#!/usr/bin/env node
/**
 * scripts/completar-ementas-tjmg.mts — recupera a EMENTA INTEIRA dos acórdãos
 * do TJMG que foram gravados truncados em `apps/web/data/jurisprudencia-casos.json`.
 *
 * ═══ O PROBLEMA (medido em 10/11/2026) ═══
 *
 * `jurisprudencia-casos.json` tem 23.569 casos. Desses, 4.971 terminam a
 * `ementa` com reticências — um corte cego em 500 caracteres:
 *   4.305 com exatamente 500 chars · 665 com 499 · 1 com 2.000 (TJES).
 * O corte apaga o miolo da decisão: sobra a cabeça da ementa, some o
 * dispositivo e a fundamentação. Para quem lê sob estresse, meia ementa
 * é pior que nenhuma — dá a impressão de que o tribunal decidiu só aquilo.
 *
 * ═══ FONTE OFICIAL ═══
 *
 * TJMG, Consulta de Jurisprudência (www5.tjmg.jus.br/jurisprudencia).
 * O campo `link` do JSON, quando existe, é o espelho do acórdão:
 *   GET /jurisprudencia/relatorioEspelhoAcordao.do?...&inteiroTeor=<qualquer>&…
 *   → `application/pdf` com o acórdão completo (ementa + voto + súmula).
 *
 * Sondado nesta data, com User-Agent honesto:
 *   - SEM o parâmetro `inteiroTeor` → HTTP 500 "TJMG - Sistema Indisponível"
 *     (erro Java: `Could not initialize class br.jus.tj...`). Não serve.
 *   - COM `inteiroTeor=true` ou `inteiroTeor=false` → o MESMO PDF. O valor
 *     não importa; só a presença do parâmetro. 30 KB a 240 KB por caso.
 *   - `pesquisaPalavrasEspelhoAcordao.do` e `consultaSimples.do` exigem
 *     código de sessão (HTTP 401 "Informe o código"). NÃO há busca anônima
 *     por número do processo — e este coletor NÃO tenta burlar isso.
 *
 * Consequência dura, e o motivo de o lote ser pequeno: dos 4.971 truncados,
 * só 85 têm `link` (todos TJMG) + 1 TJES. Os outros 4.885 não têm link e
 * **não há endpoint público anônimo** que os recupere. Este coletor recupera
 * o que a fonte oficial entrega sem contorno; o resto fica registrado como
 * `sem-fonte` no checkpoint, para não fingir cobertura.
 *
 * O único TJES truncado tem inteiro teor LOCAL (`apps/web/data/inteiro-teor/
 * <processo>.txt.gz`, servido por `/api/inteiro-teor`), então não há rede —
 * mas o texto do TJES não tem o esqueleto do TJMG: ementa e relatório correm
 * num parágrafo só, sem marcador. Esse caso sai como `revisao-manual` em vez
 * de receber um limite inventado.
 *
 * ═══ POR QUE PDF E PYTHON ═══
 *
 * Node não tem parser de PDF e o repositório não tem dependência para isso.
 * A ponte já existe e é usada por `coletar-atos-pessoal-judiciario.mts`:
 * `scripts/radar-editais-extrair-pdf.py` (PyMuPDF) converte PDF em
 * `{"paginas":[{"n":1,"texto":"..."}]}`. Reusada aqui SEM alteração — o
 * recorte da ementa (semântica) mora neste arquivo, não no extrator.
 *
 * ═══ RECORTE DA EMENTA ═══
 *
 * O PDF do TJMG é: metadados do processo · EMENTA · cabeçalho da classe
 * (`AGRAVO DE INSTRUMENTO-CV Nº 1.0000.24.212266-1/001 - COMARCA …`) ·
 * `A C Ó R D Ã O` · voto. O recorte usa as QUEBRAS DE LINHA do PDF como
 * estrutura (regex sobre texto achatado erra, porque a ementa é toda em
 * caixa alta e engole o próprio cabeçalho). Ancora no prefixo conhecido da
 * ementa truncada, corta na primeira linha de cabeçalho, e recua sobre
 * linhas de lixo (número de página, "Tribunal de Justiça de Minas Gerais").
 *
 * Travessa de sanidade: a ementa recuperada TEM de começar pelo prefixo
 * original (comparado com espaçamento normalizado) e ser MAIOR que a
 * truncada. Se não bater, o caso é rejeitado com status explícito — nunca
 * entra texto duvidoso no acervo.
 *
 * ═══ GUARDAS ═══
 *
 * - User-Agent honesto `finweejur/github artur colito` (AGENTS.md).
 * - 1,5 s entre requisições ao mesmo host; timeout de 30 s; 2 tentativas.
 * - Só dado público, sem login, sem captcha, sem contornar rate limit.
 * - Retomável: `apps/web/data/ementas-completas.json` é o próprio
 *   checkpoint (processo presente = feito). Tentativas e falhas vão para
 *   `scripts/.cache/ementas-completas/checkpoint.jsonl`.
 * - CPF: ementa com CPF válido por mod-11 NÃO é gravada (AGENTS.md §5.2),
 *   reusando `temCpfValido` de `apps/web/lib/paraopeba/triagem.ts`.
 * - NÃO reescreve `jurisprudencia-casos.json`. A fusão é etapa separada,
 *   com revisão — este script só produz o acervo de apoio.
 *
 * ═══ SAÍDA ═══
 *
 * `apps/web/data/ementas-completas.json`:
 *   { "<processo>": { "ementa": "...", "fonte": "<url>", "coletado_em": "AAAA-MM-DD" } }
 *
 * ═══ USO ═══
 *
 *   npx tsx scripts/completar-ementas-tjmg.mts --listar        # só mede e lista
 *   npx tsx scripts/completar-ementas-tjmg.mts --limite 30     # amostra
 *   npx tsx scripts/completar-ementas-tjmg.mts                 # o lote inteiro
 *   npx tsx scripts/completar-ementas-tjmg.mts --refazer       # ignora o que já está no destino
 *   npx tsx scripts/completar-ementas-tjmg.mts --processo 0009840-22.2014.8.13  # um caso só
 *   npx tsx scripts/completar-ementas-tjmg.mts --refazer --do-cache  # reprocessa sem baixar
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { temCpfValido } from "../apps/web/lib/paraopeba/triagem";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = path.join(RAIZ, "apps/web/data/jurisprudencia-casos.json");
const DESTINO = path.join(RAIZ, "apps/web/data/ementas-completas.json");
const CACHE = path.join(RAIZ, "scripts/.cache/ementas-completas");
const PASTA_PDF = path.join(CACHE, "pdf");
const PASTA_TEXTO = path.join(CACHE, "texto");
const CHECKPOINT = path.join(CACHE, "checkpoint.jsonl");
const EXTRATOR = path.join(RAIZ, "scripts/radar-editais-extrair-pdf.py");

const UA = "finweejur/github artur colito";
const INTERVALO_MS = 1500;
const TIMEOUT_MS = 30_000;
const TENTATIVAS = 2;

const HOJE = new Date().toISOString().slice(0, 10);

// ────────────────────────────────────────────────────────────── argumentos
const ARGV = process.argv.slice(2);
const LISTAR = ARGV.includes("--listar");
const SECO = ARGV.includes("--seco");
const REFAZER = ARGV.includes("--refazer");
/** Reaproveita os PDFs já baixados em `scripts/.cache/...` — não fala rede. */
const DO_CACHE = ARGV.includes("--do-cache");

function valor(nome: string): string | null {
  const i = ARGV.indexOf(nome);
  return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : null;
}

const LIMITE = (() => {
  const v = valor("--limite") ?? valor("--amostra");
  if (!v) return Number.POSITIVE_INFINITY;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
})();

/** `--processo a,b` restringe a execução a esses números (reteste/diagnóstico). */
const SO_PROCESSOS = (valor("--processo") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ────────────────────────────────────────────────────────────── tipos
interface Caso {
  id: string;
  processo: string;
  tribunal: string;
  ementa: string;
  link?: string;
}

interface Registro {
  ementa: string;
  fonte: string;
  coletado_em: string;
}

type Acervo = Record<string, Registro>;

type Resultado = {
  processo: string;
  status:
    | "ok"
    | "sem-fonte"
    | "curto-demais"
    | "erro-rede"
    | "pdf-invalido"
    | "recorte-falhou"
    | "prefixo-divergente"
    | "cpf"
    | "revisao-manual";
  chars?: number;
  ganho?: number;
  erro?: string;
  ms?: number;
};

// ────────────────────────────────────────────────────────────── utilidades
function lerJson<T>(caminho: string): T {
  return JSON.parse(fs.readFileSync(caminho, "utf8")) as T;
}

function gravarJsonAtomico(caminho: string, dados: unknown): void {
  const tmp = `${caminho}.tmp`;
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 1), "utf8");
  fs.renameSync(tmp, caminho);
}

function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Nome de arquivo seguro: alguns processos vêm no formato antigo com barra
 * (`1.0216.08.053208-0/002`) e viram subpasta. A chave no acervo continua
 * sendo o processo cru — só o caminho de cache é saneado.
 */
function nomeArquivo(processo: string): string {
  return processo.replace(/[^\d.A-Za-z-]/g, "_");
}

const truncada = (c: Caso): boolean => /(…|\.\.\.)\s*$/.test(c.ementa ?? "");

/** Normaliza para comparar: remove letras espaçadas e colapsa espaços. */
function normalizar(t: string): string {
  return t
    .replace(/(?:\p{Lu}\s+){3,}\p{Lu}/gu, (m) => m.replace(/\s+/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chave de busca insensível a acento, caixa, pontuação e espaçamento.
 * O JSON de origem não é copiado do PDF: tem `-COMPANHIA` (sem espaço),
 * `DIRETO` por `DIREITO` e afins. Comparar cru rejeitaria caso bom.
 */
function chaveBusca(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Quanto do prefixo conhecido reaparece no texto recuperado, em blocos de 20.
 * Tolera erro de digitação isolado da origem sem aceitar texto de outro caso.
 */
function coberturaDoPrefixo(recuperado: string, original: string): number {
  const a = chaveBusca(original.slice(0, 600));
  const b = chaveBusca(recuperado.slice(0, 1200));
  const blocos: string[] = [];
  for (let i = 0; i + 20 <= a.length; i += 20) blocos.push(a.slice(i, i + 20));
  if (!blocos.length) return 1;
  return blocos.filter((x) => b.includes(x)).length / blocos.length;
}

// ────────────────────────────────────────────────────────────── recorte
// A classe abreviada varia: `APELAÇÃO CÍVEL`, `AP CÍVEL/REM NECESSÁRIA`,
// `AGRAVO DE INSTRUMENTO-CV`… por isso a classe aceita letra, espaço, hífen,
// barra, parêntese e ponto antes do `Nº 1.0000.…` que identifica o cabeçalho.
const RE_LINHA_CABECALHO =
  /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9\s\-./()&,]*?N[º°]\s*1\.\d{4}\.\d{2}\.\d{6}-\d\/\d{3}/;
const RE_LINHA_SO_NUMERO = /^N[º°]\s*1\.\d{4}\.\d{2}\.\d{6}-\d\/\d{3}/;
const RE_ACORDAO = /^(?:A\s*C\s*Ó\s*R\s*D\s*Ã\s*O|ACÓRDÃO|ACORDAO)\s*$/;

function ehLixo(linha: string): boolean {
  const L = linha.trim();
  if (!L) return true;
  if (/^\d{1,4}$/.test(L)) return true;
  if (L === "Tribunal de Justiça de Minas Gerais") return true;
  // nome de classe sozinho: caixa alta, curto, sem fechar frase
  if (/^[A-ZÀ-Ÿ][A-ZÀ-Ÿ\s\-()]{2,60}$/.test(L) && !L.endsWith(".")) return true;
  return false;
}

/**
 * Recorta a ementa do texto do acórdão PDF.
 * Devolve `null` quando não consegue delimitar com segurança.
 */
export function recortarEmenta(textoPdf: string, ementaTruncada: string): string | null {
  const linhas = textoPdf.replace(/\r/g, "\n").split("\n");

  // texto achatado + mapa char→linha, para localizar a âncora sem perder a linha
  const pedacos: string[] = [];
  const mapa: number[] = [];
  for (let li = 0; li < linhas.length; li++) {
    const L = linhas[li].replace(/\s+/g, " ").trim();
    if (!L) continue;
    if (pedacos.length) {
      pedacos.push(" ");
      mapa.push(li);
    }
    for (const ch of L) {
      pedacos.push(ch);
      mapa.push(li);
    }
  }
  const achatado = pedacos.join("");

  const ancora = normalizar(ementaTruncada)
    .replace(/(…|\.\.\.)$/, "")
    .replace(/[\s.]+$/, "");

  // busca em chave normalizada, com mapa de volta para o texto achatado
  const chaveChars: string[] = [];
  const chaveParaFlat: number[] = [];
  for (let i = 0; i < achatado.length; i++) {
    const c = chaveBusca(achatado[i]);
    if (c) {
      chaveChars.push(c);
      chaveParaFlat.push(i);
    }
  }
  const chaveTexto = chaveChars.join("");

  let pos = -1;
  for (const tamanho of [60, 40, 25]) {
    const alvo = chaveBusca(ancora.slice(0, tamanho));
    if (alvo.length < 12) continue;
    const p = chaveTexto.indexOf(alvo);
    if (p >= 0) {
      pos = chaveParaFlat[p];
      break;
    }
  }
  if (pos < 0) return null;
  const inicio = mapa[pos];

  let fim = -1;
  for (let j = inicio; j < linhas.length; j++) {
    const L = linhas[j].trim();
    if (!L) continue;
    if (
      j > inicio &&
      (RE_LINHA_CABECALHO.test(L) ||
        RE_LINHA_SO_NUMERO.test(L) ||
        RE_ACORDAO.test(L))
    ) {
      fim = j;
      break;
    }
  }
  if (fim < 0) return null;

  while (fim > inicio && ehLixo(linhas[fim - 1])) fim--;

  // Quebra de página no meio da ementa chega como `N` + `Tribunal de Justiça
  // de Minas Gerais` (medido: 1.085 ocorrências em 55 PDFs, sempre nesse par).
  // Sem isso, o cabeçalho entra no meio da frase: "não há 2 Tribunal de
  // Justiça de Minas Gerais que se cogitar…".
  const HDR = "Tribunal de Justiça de Minas Gerais";
  const corpoLinhas: string[] = [];
  for (let j = inicio; j < fim; j++) {
    const L = linhas[j].trim();
    if (L === HDR) continue;
    const proxima = j + 1 < fim ? linhas[j + 1].trim() : "";
    if (/^\d{1,3}$/.test(L) && proxima === HDR) continue;
    corpoLinhas.push(linhas[j]);
  }

  const corpo = normalizar(corpoLinhas.join(" "));
  return corpo.length > 0 ? corpo : null;
}

// ────────────────────────────────────────────────────────────── rede
interface Resposta {
  status: number;
  tipo: string;
  corpo: Buffer;
}

async function baixar(url: string): Promise<Resposta> {
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/pdf,text/html;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  const ab = await r.arrayBuffer();
  return {
    status: r.status,
    tipo: r.headers.get("content-type") ?? "",
    corpo: Buffer.from(ab),
  };
}

/** Baixa com 1,5 s entre requisições e 2 tentativas. */
async function baixarComRitmo(url: string): Promise<Resposta | null> {
  for (let t = 1; t <= TENTATIVAS; t++) {
    try {
      const r = await baixar(url);
      if (r.status === 200) return r;
      if (t === TENTATIVAS) return r;
    } catch {
      if (t === TENTATIVAS) return null;
    }
    await dormir(INTERVALO_MS * t);
  }
  return null;
}

// ────────────────────────────────────────────────────────────── fontes
type Fonte = { tipo: "pdf-tjmg"; url: string } | { tipo: "local-tjes"; caminho: string; url: string };

function fonteDe(caso: Caso): Fonte | null {
  const link = (caso.link ?? "").trim();
  if (!link) return null;

  if (/^https:\/\/www5\.tjmg\.jus\.br\/jurisprudencia\/relatorioEspelhoAcordao\.do/.test(link)) {
    return { tipo: "pdf-tjmg", url: link };
  }

  const interno = link.match(/^\/api\/inteiro-teor\?processo=([\d.\-/]+)$/);
  if (interno) {
    const processo = interno[1];
    const caminho = path.join(RAIZ, "apps/web/data/inteiro-teor", `${processo}.txt.gz`);
    if (fs.existsSync(caminho)) return { tipo: "local-tjes", caminho, url: link };
  }
  return null;
}

function extrairPdf(caminhoPdf: string, processo: string): string | null {
  const saida = path.join(PASTA_TEXTO, `${nomeArquivo(processo)}.json`);
  try {
    execFileSync("python", [EXTRATOR, caminhoPdf, saida], {
      stdio: ["ignore", "ignore", "ignore"],
      timeout: 120_000,
    });
    const { paginas } = lerJson<{ paginas: { n: number; texto: string }[] }>(saida);
    return paginas.map((p) => p.texto).join("\n");
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────── checkpoint
function registrarCheckpoint(r: Resultado): void {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.appendFileSync(CHECKPOINT, JSON.stringify({ ...r, quando: new Date().toISOString() }) + "\n", "utf8");
}

// ────────────────────────────────────────────────────────────── caso
async function processar(caso: Caso, acervo: Acervo): Promise<Resultado> {
  const t0 = Date.now();
  const fonte = fonteDe(caso);
  if (!fonte) return { processo: caso.processo, status: "sem-fonte", ms: Date.now() - t0 };

  let texto: string | null = null;
  let urlFonte = fonte.url;

  if (fonte.tipo === "pdf-tjmg") {
    fs.mkdirSync(PASTA_PDF, { recursive: true });
    const caminhoPdf = path.join(PASTA_PDF, `${nomeArquivo(caso.processo)}.pdf`);

    if (DO_CACHE && fs.existsSync(caminhoPdf)) {
      fs.mkdirSync(PASTA_TEXTO, { recursive: true });
      texto = extrairPdf(caminhoPdf, caso.processo);
      if (!texto) return { processo: caso.processo, status: "pdf-invalido", erro: "cache sem texto", ms: Date.now() - t0 };
    } else {
      const resp = await baixarComRitmo(fonte.url);
      if (!resp) return { processo: caso.processo, status: "erro-rede", ms: Date.now() - t0 };
      if (resp.status !== 200 || resp.corpo.subarray(0, 5).toString("latin1") !== "%PDF-") {
        return {
          processo: caso.processo,
          status: "pdf-invalido",
          erro: `HTTP ${resp.status} · ${resp.tipo.slice(0, 40)} · ${resp.corpo.length} bytes`,
          ms: Date.now() - t0,
        };
      }
      fs.writeFileSync(caminhoPdf, resp.corpo);
      fs.mkdirSync(PASTA_TEXTO, { recursive: true });
      texto = extrairPdf(caminhoPdf, caso.processo);
      if (!texto) return { processo: caso.processo, status: "pdf-invalido", erro: "extrator sem texto", ms: Date.now() - t0 };
    }
  } else {
    // TJES: o portal já guarda o inteiro teor, então não há rede.
    try {
      texto = gunzipSync(fs.readFileSync(fonte.caminho)).toString("utf8");
      urlFonte = fonte.url;
    } catch (e) {
      return { processo: caso.processo, status: "pdf-invalido", erro: String(e), ms: Date.now() - t0 };
    }
  }

  const ementa = recortarEmenta(texto, caso.ementa);
  if (!ementa) {
    // TJES não usa o mesmo esqueleto (metadados · EMENTA · cabeçalho · ACÓRDÃO):
    // a ementa e o relatório correm num texto só, sem marcador estrutural.
    // Não se inventa limite — manda para revisão com olho humano.
    const status = fonte.tipo === "local-tjes" ? "revisao-manual" : "recorte-falhou";
    return {
      processo: caso.processo,
      status,
      erro: status === "revisao-manual" ? "formato TJES sem delimitador estrutural" : undefined,
      ms: Date.now() - t0,
    };
  }

  const antes = normalizar(caso.ementa).replace(/(…|\.\.\.)$/, "").replace(/[\s.]+$/, "");
  const cobertura = coberturaDoPrefixo(ementa, antes);
  if (cobertura < 0.8) {
    return { processo: caso.processo, status: "prefixo-divergente", erro: `cobertura ${(cobertura * 100).toFixed(0)}%`, ms: Date.now() - t0 };
  }
  if (ementa.length <= caso.ementa.length) {
    return { processo: caso.processo, status: "curto-demais", chars: ementa.length, ms: Date.now() - t0 };
  }
  if (temCpfValido(ementa)) {
    return { processo: caso.processo, status: "cpf", ms: Date.now() - t0 };
  }

  acervo[caso.processo] = { ementa, fonte: urlFonte, coletado_em: HOJE };
  return {
    processo: caso.processo,
    status: "ok",
    chars: ementa.length,
    ganho: ementa.length - caso.ementa.length,
    ms: Date.now() - t0,
  };
}

// ────────────────────────────────────────────────────────────── principal
async function principal(): Promise<void> {
  const bruto = lerJson<{ casos: Caso[] }>(FONTE);
  const casos = bruto.casos ?? [];

  const truncados = casos.filter(truncada);
  const comFonte = truncados.filter((c) => fonteDe(c) !== null);
  const semFonte = truncados.length - comFonte.length;

  const porTribunal = new Map<string, { total: number; fonte: number }>();
  for (const c of truncados) {
    const atual = porTribunal.get(c.tribunal) ?? { total: 0, fonte: 0 };
    atual.total++;
    if (fonteDe(c)) atual.fonte++;
    porTribunal.set(c.tribunal, atual);
  }

  console.log(`fonte        ${path.relative(RAIZ, FONTE)}`);
  console.log(`truncados    ${truncados.length}`);
  for (const [t, n] of porTribunal) {
    console.log(`  ${t.padEnd(6)} total=${String(n.total).padStart(5)}  com-fonte=${String(n.fonte).padStart(4)}`);
  }
  console.log(`com fonte    ${comFonte.length}`);
  console.log(`sem fonte    ${semFonte}  (não há endpoint público anônimo — não é erro deste coletor)`);

  const acervo: Acervo = fs.existsSync(DESTINO) ? lerJson<Acervo>(DESTINO) : {};
  const jaFeitos = Object.keys(acervo).length;
  console.log(`no destino   ${jaFeitos} processo(s) já recuperado(s)`);

  const fila = (REFAZER ? comFonte : comFonte.filter((c) => !acervo[c.processo]))
    .filter((c) => !SO_PROCESSOS.length || SO_PROCESSOS.includes(c.processo))
    .slice()
    .sort((a, b) => a.processo.localeCompare(b.processo))
    .slice(0, LIMITE === Number.POSITIVE_INFINITY ? undefined : LIMITE);

  console.log(`na fila      ${fila.length}${REFAZER ? " (--refazer)" : ""}\n`);

  if (LISTAR || SECO) {
    for (const c of fila.slice(0, 20)) console.log(`  ${c.tribunal} ${c.processo}`);
    if (fila.length > 20) console.log(`  … e ${fila.length - 20} outros`);
    return;
  }
  if (!fila.length) {
    console.log("nada a fazer — acervo em dia.");
    return;
  }

  // Atraso entre requisições: como a fila inteira é do MESMO host (www5.tjmg),
  // o relógio é único por execução — não por processo.
  let ultimaRequisicao = 0;
  const ritmo = async (): Promise<void> => {
    const espera = INTERVALO_MS - (Date.now() - ultimaRequisicao);
    if (espera > 0) await dormir(espera);
    ultimaRequisicao = Date.now();
  };

  const contagem: Record<string, number> = {};
  const t0 = Date.now();
  let i = 0;

  for (const caso of fila) {
    i++;
    const fonte = fonteDe(caso);
    const vaiBaixar =
      fonte?.tipo === "pdf-tjmg" &&
      !(DO_CACHE && fs.existsSync(path.join(PASTA_PDF, `${nomeArquivo(caso.processo)}.pdf`)));
    if (vaiBaixar) await ritmo();

    // um caso problemático não pode derrubar o lote (retomável, mas caro)
    let r: Resultado;
    try {
      r = await processar(caso, acervo);
    } catch (e) {
      r = { processo: caso.processo, status: "pdf-invalido", erro: String(e).slice(0, 160) };
    }
    registrarCheckpoint(r);
    contagem[r.status] = (contagem[r.status] ?? 0) + 1;

    // grava o acervo a cada caso: queda de máquina não perde trabalho
    if (r.status === "ok") gravarJsonAtomico(DESTINO, acervo);

    const marca = r.status === "ok" ? "ok  " : "FALHA";
    const detalhe =
      r.status === "ok" ? `${r.chars} chars (+${r.ganho})` : (r.erro ?? r.status);
    console.log(`[${String(i).padStart(3)}/${fila.length}] ${marca} ${caso.processo} · ${detalhe}`);
  }

  const segundos = (Date.now() - t0) / 1000;
  console.log(`\n── resumo ──`);
  for (const [status, n] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${status.padEnd(18)} ${n}`);
  }
  const ok = contagem.ok ?? 0;
  if (ok) {
    const tamanhos = Object.values(acervo).map((r) => r.ementa.length);
    const media = Math.round(tamanhos.reduce((a, b) => a + b, 0) / tamanhos.length);
    console.log(`  média recuperada  ${media} chars (acervo: ${tamanhos.length})`);
  }
  console.log(`  tempo             ${segundos.toFixed(1)} s (${(segundos / Math.max(1, fila.length)).toFixed(2)} s/caso)`);
  console.log(`  destino           ${path.relative(RAIZ, DESTINO)}`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
