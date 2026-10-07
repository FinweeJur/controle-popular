#!/usr/bin/env node
/**
 * Auditoria de robots.txt contra os registros REAIS da Cloudflare.
 *
 * O que faz: busca cada pedido HTTP da zona (GraphQL `httpRequestsAdaptiveGroups`),
 * casa o User-Agent com as regras de `apps/web/public/robots.txt` — fonte única
 * da política de rastreamento (medida 04/10/2026) — e aponta:
 *   1. bots BLOQUEADOS que buscaram páginas (violação);
 *   2. bots permitidos que tocaram rotas vedadas (/api/painel, /painel, ...);
 *   3. violações do Crawl-delay (intervalo mínimo entre pedidos);
 *   4. inventário de User-Agents (quem visitou o portal na janela).
 *
 * Por que a Cloudflare: o Azure guarda só console — sem User-Agent, medido
 * 07/10/2026 — e o site passa pelo proxy da CF; lá cada pedido carrega o
 * User-Agent (a "carteira de identidade" que o cliente mostra ao servidor).
 *
 * Decisões não triviais:
 *   - O CSV NÃO coleta IP: User-Agent + caminho + hora bastam para a
 *     auditoria e evitam dado pessoal em artefato (AGENTS 5.2).
 *   - Janela diária com divisão recursiva: o dataset adaptativo limita
 *     10.000 linhas por consulta; dia lotado vira dois, até caber.
 *   - Busca de /robots.txt pelo próprio bot bloqueado NÃO é violação:
 *     é o bot lendo a política antes de decidir (RFC 9309).
 *   - Empate entre regra Allow e Disallow de mesmo peso vence Allow
 *     (convenção Google — mais permissivo no empate).
 *   - O token nunca é impresso; só sai o que a API devolve.
 *
 * Uso (CI ou máquina com o token):
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
 *     node scripts/auditoria-robots-cloudflare.mjs --dias 7 --saida relatorios
 *
 * Saída: relatorio-robots-AAAA-MM-DD.md (leitura humana) e
 *        pedidos-robots-AAAA-MM-DD.csv (evidência bruta, BOM + ";" p/ Excel).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ZONA = "controlepopular.com.br";
const ROBOTS = resolve(RAIZ, "apps/web/public/robots.txt");
const LIMITE_CONSULTA = 10000;
const API = "https://api.cloudflare.com/client/v4";

/** Lê um argumento `--nome valor` da linha de comando, com padrão. */
function argumento(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const DIAS = Math.max(1, Math.min(30, Number(argumento("--dias", "7")) || 7));
const SAIDA = resolve(RAIZ, argumento("--saida", "relatorios"));
// Token só é EXIGIDO na execução (principal/api) — importar o módulo para
// testar a lógica pura não pode depender de segredo no ambiente.
const TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? null;

/** Chamada REST à API da Cloudflare com o token do ambiente. */
async function api(caminho) {
  if (!TOKEN) throw new Error("Falta CLOUDFLARE_API_TOKEN (secreto da CI; valor nunca é impresso).");
  const r = await fetch(API + caminho, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!r.ok) {
    const corpo = await r.text().catch(() => "");
    throw new Error(`API Cloudflare ${r.status} em ${caminho}: ${corpo.slice(0, 300)}`);
  }
  return r.json();
}

/** Consulta GraphQL; lança com as mensagens de erro da API (sem segredo). */
async function graphql(query, variables) {
  if (!TOKEN) throw new Error("Falta CLOUDFLARE_API_TOKEN (secreto da CI; valor nunca é impresso).");
  const r = await fetch(API + "/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.errors) {
    throw new Error(`GraphQL ${r.status}: ${JSON.stringify(j.errors ?? j).slice(0, 500)}`);
  }
  return j.data;
}

/** Acha o id (zoneTag) da zona pública do portal. */
async function buscarZona() {
  const j = await api(`/zones?name=${ZONA}&status=active`);
  const z = (j.result ?? [])[0];
  if (!z) {
    throw new Error(
      `Zona ${ZONA} não achada. O token tem permissão de leitura da zona (Zone.Zone Read)?`
    );
  }
  return z.id;
}

/**
 * Consulta de pedidos brutos de uma janela [deMs, ateMs).
 * Se lotar o limite de 10.000 linhas, divide a janela ao meio até caber
 * (divisão recursiva — sem cursor, que varia entre planos da CF).
 */
async function buscarJanela(zoneTag, deMs, ateMs, nivel = 0) {
  const consulta = `
    query($zoneTag:String!, $de:String!, $ate:String!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(
            filter: { datetime_geq: $de, datetime_lt: $ate }
            limit: ${LIMITE_CONSULTA}
            orderBy: [datetime_ASC]
          ) {
            count
            dimensions {
              datetime
              clientRequestUserAgent
              clientRequestPath
              edgeResponseStatus
            }
          }
        }
      }
    }`;
  const dados = await graphql(consulta, {
    zoneTag,
    de: new Date(deMs).toISOString(),
    ate: new Date(ateMs).toISOString(),
  });
  const grupos = dados?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];
  if (grupos.length >= LIMITE_CONSULTA && nivel < 8) {
    const meio = Math.floor((deMs + ateMs) / 2);
    if (meio > deMs && meio < ateMs) {
      const esq = await buscarJanela(zoneTag, deMs, meio, nivel + 1);
      const dir = await buscarJanela(zoneTag, meio, ateMs, nivel + 1);
      return esq.concat(dir);
    }
  }
  return grupos.map((g) => ({
    t: g.dimensions?.datetime ?? "",
    ua: g.dimensions?.clientRequestUserAgent ?? "",
    caminho: g.dimensions?.clientRequestPath ?? "/",
    status: Number(g.dimensions?.edgeResponseStatus ?? 0),
    n: Number(g.count ?? 1),
  }));
}

/** Lê o robots.txt e devolve os grupos [User-agent] com suas regras.
 * Interpretação mínima fiel à RFC 9309: linha `User-agent` depois de regras
 * abre grupo novo; linhas em branco fecham grupo que já tem regra; comentário
 * (#) é descartado; `Disallow:` vazio não bloqueia nada. */
export function parseRobots(texto) {
  const grupos = [];
  let atual = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/#.*$/, "").trim();
    if (!linha) {
      if (atual && atual.regras.length) atual = null;
      continue;
    }
    const m = linha.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const chave = m[1].toLowerCase();
    const valor = m[2].trim();
    if (chave === "user-agent") {
      if (!atual || atual.regras.length) {
        atual = { uas: [valor], regras: [], delay: null };
        grupos.push(atual);
      } else {
        atual.uas.push(valor);
      }
    } else if (atual) {
      if (chave === "crawl-delay") atual.delay = Number(valor) || null;
      else if ((chave === "allow" || chave === "disallow") && valor !== "") {
        atual.regras.push({ tipo: chave, padrao: valor });
      }
    }
  }
  return grupos;
}

/**
 * Escolhe o grupo que rege um User-Agent observado: o grupo cujo token
 * declarado aparece no UA (substrings, sem distinção de maiúsculas), com o
 * token MAIS LONGO vencendo — prática de mercado; sem match, o grupo `*`.
 */
export function grupoPara(ua, grupos) {
  const alvo = (ua || "").toLowerCase();
  let melhor = null;
  let melhorToken = "";
  for (const g of grupos) {
    for (const token of g.uas) {
      const t = token.trim().toLowerCase();
      if (!t || t === "*") continue;
      if (alvo.includes(t) && t.length > melhorToken.length) {
        melhor = g;
        melhorToken = t;
      }
    }
  }
  if (melhor) return { grupo: melhor, especifico: true };
  const padrao = grupos.find((g) => g.uas.some((t) => t.trim() === "*"));
  return { grupo: padrao ?? null, especifico: false };
}

/** Converte padrão de caminho do robots (`*` curinga) em regex de prefixo. */
export function regexPadrao(padrao) {
  let p = "";
  for (const c of padrao) {
    if (c === "*") p += ".*";
    else p += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + p);
}

/**
 * Avalia se o caminho é permitido pelo grupo: todas as regras que casam
 * disputam pelo padrão MAIS LONGO; empate vence Allow (convenção Google).
 */
export function avaliar(caminho, grupo) {
  if (!grupo || grupo.regras.length === 0) {
    return { permitido: true, regra: "sem regra que case" };
  }
  let melhor = null;
  for (const r of grupo.regras) {
    if (!regexPadrao(r.padrao).test(caminho)) continue;
    const peso = r.padrao.length;
    if (
      !melhor ||
      peso > melhor.peso ||
      (peso === melhor.peso && r.tipo === "allow")
    ) {
      melhor = { ...r, peso };
    }
  }
  if (!melhor) return { permitido: true, regra: "nenhuma regra casa" };
  return { permitido: melhor.tipo === "allow", regra: `${melhor.tipo}: ${melhor.padrao}` };
}

/** Escapa CSV no padrão brasileiro (separador ";", vírgula decimal irrelevante). */
function csvCelula(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

async function principal() {
  const texto = readFileSync(ROBOTS, "utf-8");
  const grupos = parseRobots(texto);
  console.log(`robots.txt: ${grupos.length} grupos de User-agent.`);

  const zoneTag = await buscarZona();
  console.log(`Zona encontrada. Buscando ${DIAS} dia(s) de pedidos...`);

  const agora = Date.now();
  const pedidos = [];
  const diasVazios = [];
  for (let d = DIAS; d >= 1; d--) {
    const de = agora - d * 86400000;
    const ate = agora - (d - 1) * 86400000;
    const lote = await buscarJanela(zoneTag, de, ate);
    if (lote.length === 0) diasVazios.push(new Date(ate).toISOString().slice(0, 10));
    pedidos.push(...lote);
    console.log(
      `  ${new Date(ate).toISOString().slice(0, 10)}: ${lote.length} linhas` +
        (lote.length === 0 ? " (vazio — retenção da CF?)" : "")
    );
  }
  if (pedidos.length === 0) {
    throw new Error(
      "Nenhum pedido na janela: retenção do plano grátis da CF é menor que " +
        `${DIAS} dia(s). Tente --dias 1.`
    );
  }

  // ---- Agregação por User-Agent ---------------------------------------
  const porUa = new Map();
  for (const p of pedidos) {
    if (!porUa.has(p.ua)) {
      const { grupo, especifico } = grupoPara(p.ua, grupos);
      porUa.set(p.ua, {
        ua: p.ua,
        grupo,
        especifico,
        total: 0,
        eventos: [],
        violacoesRota: [],
        violacoesDelay: [],
        minGapMs: null,
        leuRobots: 0,
      });
    }
    const a = porUa.get(p.ua);
    a.total += p.n;
    a.eventos.push(p);
    if (p.caminho === "/robots.txt") a.leuRobots += p.n;
  }

  let violBloqueado = 0;
  let violRotaVedada = 0;
  let violDelay = 0;
  for (const a of porUa.values()) {
    a.eventos.sort((x, y) => (x.t < y.t ? -1 : 1));
    for (const p of a.eventos) {
      if (p.caminho === "/robots.txt") continue; // ler a política é sempre lícito
      const v = avaliar(p.caminho, a.grupo);
      if (!v.permitido) {
        if (a.grupo && a.grupo.regras.some((r) => r.tipo === "disallow" && r.padrao === "/")) {
          violBloqueado += p.n; // grupo de bloqueio total (Disallow: /)
        } else {
          violRotaVedada += p.n;
        }
        if (a.violacoesRota.length < 400) a.violacoesRota.push({ ...p, regra: v.regra });
      }
    }
    const delay = a.grupo?.delay;
    if (delay) {
      for (let i = 1; i < a.eventos.length; i++) {
        const gap = Date.parse(a.eventos[i].t) - Date.parse(a.eventos[i - 1].t);
        if (Number.isNaN(gap)) continue;
        if (a.minGapMs === null || gap < a.minGapMs) a.minGapMs = gap;
        if (gap < delay * 1000) {
          violDelay++;
          if (a.violacoesDelay.length < 400) {
            a.violacoesDelay.push({
              de: a.eventos[i - 1].t,
              para: a.eventos[i].t,
              gap,
              caminho: a.eventos[i].caminho,
            });
          }
        }
      }
    }
  }

  // ---- Saídas -----------------------------------------------------------
  mkdirSync(SAIDA, { recursive: true });
  const dia = new Date().toISOString().slice(0, 10);
  const caminhoMd = resolve(SAIDA, `relatorio-robots-${dia}.md`);
  const caminhoCsv = resolve(SAIDA, `pedidos-robots-${dia}.csv`);

  const ordenadas = [...porUa.values()].sort((a, b) => b.total - a.total);
  const tempos = pedidos.map((p) => p.t).filter(Boolean).sort();
  const janelaDe = tempos[0] ?? "";
  const janelaAte = tempos[tempos.length - 1] ?? "";
  const totalPedidos = pedidos.reduce((s, p) => s + p.n, 0);

  const bloqueadosViol = ordenadas.filter(
    (a) =>
      a.grupo &&
      a.grupo.regras.some((r) => r.tipo === "disallow" && r.padrao === "/") &&
      a.violacoesRota.length > 0
  );
  const bloqueadosSoRobots = ordenadas.filter(
    (a) =>
      a.grupo &&
      a.grupo.regras.some((r) => r.tipo === "disallow" && r.padrao === "/") &&
      a.violacoesRota.length === 0 &&
      a.total > 0
  );
  const permitidosComViol = ordenadas.filter((a) => a.violacoesRota.length > 0 && !bloqueadosViol.includes(a));
  const comDelay = ordenadas.filter((a) => a.grupo?.delay && a.eventos.length > 1);
  const desconhecidos = ordenadas.filter(
    (a) => !a.especifico && /bot|crawler|crawl|spider|scraper|fetch|archiver|slurp/i.test(a.ua)
  );

  const L = [];
  L.push(`# Auditoria robots.txt × Cloudflare — ${dia}`);
  L.push("");
  L.push(`- **Zona:** ${ZONA}`);
  L.push(`- **Janela real dos dados:** ${janelaDe} → ${janelaAte}`);
  L.push(`- **Pedidos analisados:** ${totalPedidos.toLocaleString("pt-BR")} em ${porUa.size} User-Agents distintos`);
  if (diasVazios.length) {
    L.push(`- **Dias vazios (retenção da CF):** ${diasVazios.join(", ")}`);
  }
  L.push(`- **Fonte:** Cloudflare GraphQL \`httpRequestsAdaptiveGroups\`; regras de \`${"apps/web/public/robots.txt"}\``);
  L.push("");
  L.push("## Resumo");
  L.push("");
  L.push(`- Bots bloqueados que visitaram páginas: **${bloqueadosViol.length ? "SIM" : "não"}** (${violBloqueado} pedidos).`);
  L.push(`- Rotas vedadas acessadas por bots permitidos: **${violRotaVedada}** pedidos.`);
  L.push(`- Quedas de Crawl-delay: **${violDelay}** pares abaixo do intervalo.`);
  L.push(`- Robôs que só leram /robots.txt (sem violação): ${bloqueadosSoRobots.length}.`);
  L.push("");

  L.push("## Bots BLOQUEADOS que vieram assim mesmo");
  L.push("");
  if (!bloqueadosViol.length) {
    L.push("Nenhum. Nenhum bot da lista de bloqueio buscou páginas na janela.");
  } else {
    L.push("| User-Agent | Pedidos | Exemplos de caminho |");
    L.push("|---|---:|---|");
    for (const a of bloqueadosViol) {
      const exemplos = [...new Set(a.violacoesRota.map((v) => v.caminho))].slice(0, 3);
      L.push(`| \`${a.ua.slice(0, 90)}\` | ${a.total} | ${exemplos.join(", ")} |`);
    }
  }
  L.push("");

  L.push("## Bots permitidos que tocaram rota vedada");
  L.push("");
  if (!permitidosComViol.length) {
    L.push("Nenhum.");
  } else {
    L.push("| User-Agent | Pedidos irregulares | Regra violada | Exemplos |");
    L.push("|---|---:|---|---|");
    for (const a of permitidosComViol) {
      const regras = [...new Set(a.violacoesRota.map((v) => v.regra))].slice(0, 2);
      const exemplos = [...new Set(a.violacoesRota.map((v) => v.caminho))].slice(0, 3);
      L.push(
        `| \`${a.ua.slice(0, 90)}\` | ${a.violacoesRota.reduce((s, v) => s + v.n, 0)} | ${regras.join("; ")} | ${exemplos.join(", ")} |`
      );
    }
  }
  L.push("");

  L.push("## Crawl-delay (intervalo entre pedidos)");
  L.push("");
  if (!comDelay.length) {
    L.push("Nenhum bot com regra Crawl-delay apareceu com 2+ pedidos na janela.");
  } else {
    L.push("| User-Agent | Esperado | Menor intervalo medido | Quedas abaixo |");
    L.push("|---|---:|---:|---:|");
    for (const a of comDelay) {
      const abaixo = a.violacoesDelay.length;
      const min =
        a.minGapMs === null ? "—" : a.minGapMs < 1000 ? `${a.minGapMs} ms` : `${(a.minGapMs / 1000).toFixed(1)} s`;
      L.push(`| \`${a.ua.slice(0, 90)}\` | ${a.grupo.delay} s | ${min} | ${abaixo} |`);
    }
  }
  L.push("");

  L.push("## Bots desconhecidos (regra `*` do arquivo)");
  L.push("");
  if (!desconhecidos.length) {
    L.push("Nenhum nome sugestivo de robô fora das listas.");
  } else {
    L.push("| User-Agent | Pedidos |");
    L.push("|---|---:|");
    for (const a of desconhecidos.slice(0, 20)) {
      L.push(`| \`${a.ua.slice(0, 100)}\` | ${a.total} |`);
    }
  }
  L.push("");

  L.push("## Inventário geral (top 20 por volume)");
  L.push("");
  L.push("| User-Agent | Pedidos | Grupo robots |");
  L.push("|---|---:|---|");
  for (const a of ordenadas.slice(0, 20)) {
    const nome = a.especifico && a.grupo ? a.grupo.uas.join(", ") : a.grupo ? "`*`" : "(sem grupo)";
    L.push(`| \`${a.ua.slice(0, 100)}\` | ${a.total} | ${nome} |`);
  }
  L.push("");
  L.push("## Limitações");
  L.push("");
  L.push("- Robô que obedece e nunca vem não aparece: só detectamos DESOBEDIÊNCIA de quem visitou.");
  L.push("- User-Agent é declarado pelo cliente — pode ser forjado; auditoria prova comportamento, não identidade.");
  L.push("- Crawl-delay é recomendação não padrão (o Google o ignora por definição).");
  L.push("- Evidência bruta: CSV ao lado deste arquivo (User-Agent, caminho, hora, status — sem IP).");
  L.push("");

  writeFileSync(caminhoMd, L.join("\n"), "utf-8");

  const csv = ["data_hora;user_agent;caminho;status_http;ocorrencias"];
  const todos = [...pedidos].sort((x, y) => (x.t < y.t ? -1 : 1));
  for (const p of todos) {
    csv.push([csvCelula(p.t), csvCelula(p.ua), csvCelula(p.caminho), p.status, p.n].join(";"));
  }
  writeFileSync(caminhoCsv, "\uFEFF" + csv.join("\r\n"), "utf-8");

  console.log(`\nRelatório: ${caminhoMd}`);
  console.log(`Evidência: ${caminhoCsv} (${todos.length} linhas)`);
  console.log(
    `Resumo: ${violBloqueado} pedidos de bots bloqueados, ${violRotaVedada} de rota vedada, ${violDelay} quedas de delay.`
  );
}

// Roda só quando chamado direto (`node script.mjs`); importar para teste
// não dispara a consulta à API.
const executandoDireto =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (executandoDireto) {
  principal().catch((e) => {
    console.error(`FALHA: ${e.message}`);
    process.exit(1);
  });
}
