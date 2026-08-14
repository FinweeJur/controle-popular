#!/usr/bin/env node
/**
 * auditoria-links-normas.mjs — varredura vigorosa dos links de fonte das
 * normas de PROTEÇÃO (pedido do dono em 2026-08-13, ver
 * docs/PLANO-ARQUIVO-DE-FONTES.md).
 *
 * Cobre por INTEIRO (não amostra):
 *   - ambiental_legislacao.link_pdf, temas 'serras' + 'recursos_hidricos'
 *   - direito_critico_normas.link_oficial, temas de direito protegido
 *   - direito_critico_precedentes.link_oficial, mesmos temas
 *   - atos_oficiais.link_fonte, as normas de área protegida (lidas do
 *     GeoJSON `public/terras/globo/dados/camadas/atos-area-protegida-
 *     municipios.geojson` — arquivo só LIDO aqui, nunca escrito)
 *
 * `patrimonio_tombado_iepha` fica de fora do checador: a tabela não tem
 * coluna de URL (só `ato_legal`, texto livre — ver comentário da migration
 * 0072 em lib/db/schema.ts). Não há link para verificar ali.
 *
 * REGRAS (aprendidas na auditoria de 2026-08-13, não são teoria):
 *   - 403/429/qualquer bloqueio tipo-captcha NÃO é "quebrado". Muito
 *     site .gov.br barra bot e funciona no navegador. Classificado à parte.
 *   - Redirecionar para a HOME do órgão é quebra disfarçada: a página
 *     específica sumiu e o servidor jogou na raiz.
 *   - `robots.txt` é respeitado por host (cache em memória, TTL da sessão).
 *   - User-Agent honesto, identificando o projeto.
 *   - Pausa mínima por host entre requisições (não é ataque, é auditoria).
 *
 * Uso:
 *   node scripts/auditoria-links-normas.mjs [--limite N] [--so-tabela X]
 *
 * Saída: JSON em scripts/_tmp-auditoria/resultado-<carimbo>.json (fora de
 * `public/` de propósito — nunca vira asset do deploy).
 */

import { Client } from "pg";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_WEB = path.resolve(__dirname, "..");

const USER_AGENT =
  "ControlePopularBot/1.0 (+https://controlepopular.com.br; auditoria de fontes; contato via github.com/FinweeJur/controle-popular)";
const TIMEOUT_MS = 20_000;
const PAUSA_MIN_POR_HOST_MS = 1200;
const CONCORRENCIA_HOSTS = 6;

function ehPostgresLocal(url) {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
  } catch {
    return false;
  }
}

const DATABASE_URL =
  process.env.DATABASE_URL ??
  readFileSync(path.join(RAIZ_WEB, ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="))
    ?.slice("DATABASE_URL=".length)
    .trim();

if (!DATABASE_URL) throw new Error("DATABASE_URL não encontrada (.env.local ausente?)");
if (!ehPostgresLocal(DATABASE_URL)) {
  throw new Error(
    `ABORTADO: DATABASE_URL não é local (${new URL(DATABASE_URL).hostname}). Regra da máquina: nunca a Neon.`
  );
}

// ---------------------------------------------------------------- robots.txt

const cacheRobots = new Map(); // host -> { disallow: string[] } | null (sem robots)

async function robotsPermite(urlStr) {
  const u = new URL(urlStr);
  const host = u.host;
  if (!cacheRobots.has(host)) {
    try {
      const r = await fetch(`${u.protocol}//${host}/robots.txt`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        cacheRobots.set(host, { disallow: [] });
      } else {
        const texto = await r.text();
        const linhas = texto.split("\n").map((l) => l.trim());
        let aplicaGeral = false;
        const disallow = [];
        for (const linha of linhas) {
          const [chaveRaw, ...resto] = linha.split(":");
          if (!chaveRaw) continue;
          const chave = chaveRaw.trim().toLowerCase();
          const valor = resto.join(":").trim();
          if (chave === "user-agent") aplicaGeral = valor === "*";
          if (chave === "disallow" && aplicaGeral && valor) disallow.push(valor);
        }
        cacheRobots.set(host, { disallow });
      }
    } catch {
      // sem robots.txt acessível => trata como permitido, mas registrado
      cacheRobots.set(host, { disallow: [] });
    }
  }
  const regra = cacheRobots.get(host);
  return !regra.disallow.some((prefixo) => u.pathname.startsWith(prefixo));
}

// ---------------------------------------------------------- rate limit/host

const proximaLiberacaoPorHost = new Map();
/**
 * Reserva a vez ANTES de qualquer `await` (síncrono até o `set`), senão
 * chamadas concorrentes pro mesmo host leem o mesmo "última vez" e disparam
 * juntas mesmo assim — foi o que aconteceu com 5 URLs do planalto.gov.br
 * batendo "ao mesmo tempo" e levando ECONNRESET por flood, não por bloqueio
 * de User-Agent (medido nesta auditoria, 2026-08-13/14).
 */
async function respeitarPausa(host) {
  const agora = Date.now();
  const liberadoEm = proximaLiberacaoPorHost.get(host) ?? 0;
  const proxima = Math.max(agora, liberadoEm) + PAUSA_MIN_POR_HOST_MS;
  proximaLiberacaoPorHost.set(host, proxima);
  const espera = proxima - PAUSA_MIN_POR_HOST_MS - agora;
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
}

// ---------------------------------------------------------------- checagem

function pareceHome(urlFinal, urlOriginal) {
  try {
    const f = new URL(urlFinal);
    const o = new URL(urlOriginal);
    if (f.host !== o.host) return false; // foi pra outro domínio, é outro problema
    const pathFinal = f.pathname.replace(/\/+$/, "");
    const pathOriginal = o.pathname.replace(/\/+$/, "");
    const eraEspecifico = pathOriginal.length > 1 && /[a-zA-Z0-9]/.test(pathOriginal.slice(1));
    const virouRaiz = pathFinal === "" || pathFinal === "/index" || pathFinal === "/home";
    return eraEspecifico && virouRaiz && pathFinal !== pathOriginal;
  } catch {
    return false;
  }
}

async function checarUrl(urlStr) {
  if (!/^https?:\/\//i.test(urlStr)) {
    return { status: "url_invalida", detalhe: "não é http(s)" };
  }
  let permitido;
  try {
    permitido = await robotsPermite(urlStr);
  } catch {
    permitido = true;
  }
  if (!permitido) return { status: "bloqueado_robots" };

  const host = new URL(urlStr).host;
  await respeitarPausa(host);

  const tentar = async (method) => {
    const resp = await fetch(urlStr, {
      method,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/pdf,*/*",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // não precisamos do corpo aqui — só status e URL final
    resp.body?.cancel?.().catch(() => {});
    return resp;
  };

  try {
    let resp;
    try {
      resp = await tentar("HEAD");
      // alguns servidores devolvem 200 fixo pra HEAD sem checar de verdade,
      // ou 405 (Method Not Allowed) — nesse caso tenta GET de verdade
      if (resp.status === 405 || resp.status === 501) resp = await tentar("GET");
    } catch {
      resp = await tentar("GET");
    }

    const redirecionouHome = pareceHome(resp.url, urlStr);

    if (resp.status === 403 || resp.status === 429) {
      return { status: "nao_verificavel", http: resp.status, url_final: resp.url };
    }
    if (resp.status >= 200 && resp.status < 300) {
      if (redirecionouHome) {
        return { status: "redirecionou_home", http: resp.status, url_final: resp.url };
      }
      return { status: "ok", http: resp.status, url_final: resp.url };
    }
    if (resp.status >= 300 && resp.status < 400) {
      // redirect não seguido (raro com redirect:'follow', mas pode acontecer com loop)
      return { status: "redirect_nao_resolvido", http: resp.status, url_final: resp.url };
    }
    return { status: "quebrado", http: resp.status, url_final: resp.url };
  } catch (e) {
    const msg = String(e?.cause?.message ?? e?.message ?? e);
    const eTls = /certificate|SSL|TLS|self.signed|self signed/i.test(msg);

    // O fetch/undici do Node às vezes reseta conexão com servidor .gov.br
    // que funciona normal no navegador (ou via curl) — medido na auditoria
    // de 2026-08-13 com dois domínios de MG. Antes de condenar, confirma
    // com curl (motor TLS diferente) com o MESMO User-Agent honesto.
    await respeitarPausa(host);
    const comUaHonesto = await checarViaCurl(urlStr, USER_AGENT);
    if (comUaHonesto.status === "ok") {
      return {
        status: "ok",
        http: comUaHonesto.http,
        url_final: urlStr,
        detalhe: `fetch nativo falhou (${msg}), confirmado OK via curl com UA honesto`,
      };
    }

    // Achado da auditoria de 2026-08-13: planalto.gov.br reseta a conexão
    // especificamente por causa do formato do User-Agent (bot honesto ->
    // ECONNRESET; UA de navegador comum -> 200, mesmo host, mesmo path).
    // Isso é bloqueio anti-bot disfarçado de erro de rede, não link
    // quebrado — mesmo princípio do 403/429 que a regra já cobre. Um
    // segundo teste só de DIAGNÓSTICO, com UA de navegador, decide qual é.
    await respeitarPausa(host);
    const comUaNavegador = await checarViaCurl(urlStr, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    if (comUaNavegador.status === "ok") {
      return {
        status: "nao_verificavel",
        http: comUaNavegador.http,
        url_final: urlStr,
        detalhe: `bot honesto recebe ${msg} (ECONNRESET/timeout), mas UA de navegador comum recebe ${comUaNavegador.http} no mesmo host+path — bloqueio anti-bot, não link quebrado`,
      };
    }

    return { status: eTls ? "erro_tls" : "erro_rede", detalhe: msg, curl: comUaHonesto };
  }
}

async function checarViaCurl(urlStr, userAgent) {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-s",
        "-o",
        // curl aqui é o build nativo win32 (mingw) chamado via
        // child_process do Node sem console anexado — escrever em
        // `/dev/null` (caminho POSIX) falha com "curl: (23) client
        // returned ERROR on write" mesmo com HTTP 200 recebido (medido
        // nesta auditoria). O device nulo do Windows é `NUL`.
        "NUL",
        "-w",
        "%{http_code}",
        "-A",
        userAgent,
        "--max-time",
        "20",
        "-L", // segue redirect, igual ao fetch
        urlStr,
      ],
      { timeout: 25_000 }
    );
    const http = Number(stdout.trim());
    if (http >= 200 && http < 400) return { status: "ok", http };
    return { status: "quebrado", http };
  } catch (e) {
    return { status: "erro_rede", detalhe: String(e?.stderr ?? e?.message ?? e) };
  }
}

// ------------------------------------------------------------- universo db

async function coletarUniverso(c, soTabela) {
  const itens = [];

  if (!soTabela || soTabela === "ambiental_legislacao") {
    const r = await c.query(`
      SELECT id, fonte, tipo, numero, ano, temas, link_pdf AS url
      FROM ambiental_legislacao
      WHERE temas && ARRAY['serras','recursos_hidricos']
        AND link_pdf IS NOT NULL AND link_pdf <> ''
    `);
    for (const row of r.rows) {
      itens.push({
        tabela: "ambiental_legislacao",
        coluna: "link_pdf",
        id: row.id,
        rotulo: `${row.fonte} ${row.tipo ?? ""} ${row.numero ?? ""}/${row.ano ?? ""}`.trim(),
        tema: row.temas?.filter((t) => ["serras", "recursos_hidricos"].includes(t)).join("+"),
        url: row.url,
      });
    }
  }

  if (!soTabela || soTabela === "direito_critico_normas") {
    const r = await c.query(`
      SELECT id, nome_curto, temas, link_oficial AS url
      FROM direito_critico_normas
      WHERE temas && ARRAY['indigena','quilombola','povos_tradicionais','rios','direitos_humanos']
    `);
    for (const row of r.rows) {
      itens.push({
        tabela: "direito_critico_normas",
        coluna: "link_oficial",
        id: row.id,
        rotulo: row.nome_curto,
        tema: row.temas.join("+"),
        url: row.url,
      });
    }
  }

  if (!soTabela || soTabela === "direito_critico_precedentes") {
    const r = await c.query(`
      SELECT id, titulo, temas, link_oficial AS url
      FROM direito_critico_precedentes
      WHERE temas && ARRAY['indigena','quilombola','povos_tradicionais','rios','direitos_humanos']
        AND link_oficial IS NOT NULL AND link_oficial <> ''
    `);
    for (const row of r.rows) {
      itens.push({
        tabela: "direito_critico_precedentes",
        coluna: "link_oficial",
        id: row.id,
        rotulo: row.titulo,
        tema: row.temas.join("+"),
        url: row.url,
      });
    }
  }

  if (!soTabela || soTabela === "atos_oficiais_area_protegida") {
    const geojsonPath = path.join(
      RAIZ_WEB,
      "public/terras/globo/dados/camadas/atos-area-protegida-municipios.geojson"
    );
    const geo = JSON.parse(readFileSync(geojsonPath, "utf8"));
    for (const f of geo.features) {
      for (const n of f.properties.normas ?? []) {
        itens.push({
          tabela: "atos_oficiais (via geojson area-protegida)",
          coluna: "link_fonte",
          id: `${f.properties.nome}-${n.tipo}-${n.numero}`,
          rotulo: `${f.properties.nome}: ${n.tipo} ${n.numero}`,
          tema: "area_protegida",
          url: n.link_fonte,
        });
      }
    }
  }

  return itens;
}

// --------------------------------------------------------------- execução

async function mapLimitado(itens, limite, fn) {
  const resultados = new Array(itens.length);
  let cursor = 0;
  async function worker() {
    while (cursor < itens.length) {
      const i = cursor++;
      resultados[i] = await fn(itens[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, worker));
  return resultados;
}

async function main() {
  const args = process.argv.slice(2);
  const idxLimite = args.indexOf("--limite");
  const limiteItens = idxLimite >= 0 ? Number(args[idxLimite + 1]) : undefined;
  const idxSoTabela = args.indexOf("--so-tabela");
  const soTabela = idxSoTabela >= 0 ? args[idxSoTabela + 1] : undefined;

  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();
  let universo = await coletarUniverso(c, soTabela);
  await c.end();

  // dedup por URL dentro da mesma tabela+coluna não é feito de propósito:
  // cada linha é uma norma citando aquele link, e queremos saber quantas
  // NORMAS têm o problema, não quantas URLs únicas.
  if (limiteItens) universo = universo.slice(0, limiteItens);

  console.log(`Universo a checar: ${universo.length} URLs (prioridade: normas de proteção)`);

  let feitos = 0;
  const t0 = Date.now();
  const resultados = await mapLimitado(universo, CONCORRENCIA_HOSTS, async (item) => {
    const r = await checarUrl(item.url);
    feitos++;
    if (feitos % 25 === 0 || feitos === universo.length) {
      const seg = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  ${feitos}/${universo.length} checados (${seg}s)`);
    }
    return { ...item, ...r };
  });

  const porStatus = {};
  for (const r of resultados) porStatus[r.status] = (porStatus[r.status] ?? 0) + 1;
  console.log("\n=== resumo ===");
  console.table(porStatus);

  const dirSaida = path.join(__dirname, "_tmp-auditoria");
  mkdirSync(dirSaida, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const arquivoSaida = path.join(dirSaida, `resultado-${carimbo}.json`);
  writeFileSync(arquivoSaida, JSON.stringify(resultados, null, 2));
  console.log(`\nResultado completo em: ${arquivoSaida}`);
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
