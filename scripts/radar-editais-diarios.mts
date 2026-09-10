#!/usr/bin/env node
/**
 * scripts/radar-editais-diarios.mts — radar diário de EDITAIS no Diário
 * Oficial Eletrônico de Minas Gerais (DOMG-e / Jornal Minas Gerais).
 *
 * ═══ O QUE ELE FAZ ═══
 *
 * Baixa a edição do dia (ou a última disponível) pela API pública do Jornal
 * Minas Gerais, extrai o texto do caderno principal (PDF assinado CMS, texto
 * via PyMuPDF em `radar-editais-extrair-pdf.py`) e detecta editais de
 * interesse social — chamamento público, seleção, conselho, sociedade civil,
 * CONDEL, PPDDH — com REGRAS DETERMINÍSTICAS (regex + score). Não há LLM
 * nesta etapa (ver gancho `enriquecerComLlm`, desativado por padrão).
 *
 * Candidato acima do limiar vira RASCUNHO (status "pendente") em
 * `apps/web/data/radar-editais/pendentes/<data>-<hash>.json`. Este script
 * NUNCA escreve em `apps/web/data/noticias-portal.json` — a publicação é
 * papel de `scripts/publicar-radar-editais.mts`, que roda depois (manual ou
 * agendado) e passa pelos guardas de dado pessoal do repo.
 *
 * ═══ FONTE E DECISÃO DE ROBOTS.TXT ═══
 *
 * Fonte: Jornal Minas Gerais (jornalminasgerais.mg.gov.br), Diário Oficial
 * Eletrônico de MG mantido pela Imprensa Oficial. API medida em 10/09/2026:
 *   GET https://www.jornalminasgerais.mg.gov.br/api/v1/Jornal/ObterEdicaoPorDataPublicacao?dataPublicacao=YYYY-MM-DD
 *   → {"dados": {dataPublicacao, cadernos[], arquivoCadernoPrincipal{arquivo
 *     (base64 do PDF), totalPaginas, ...}} | null, "erros": []}
 *   dados === null com erros vazio = dia sem publicação (fim de semana) —
 *   caso normal, não é falha. GET sem dados nem erros = falha REAL (exit 1).
 *
 * robots.txt: o site é uma SPA Angular que devolve o HTML do index para
 * QUALQUER caminho, inclusive /robots.txt (medido em 10/09/2026) — não há
 * política de robots publicada. Decisão registrada conforme o padrão do repo
 * (AGENTS.md, seção "Coleta de dado de fonte pública"): seguir sem política
 * explícita, com User-Agent que identifica o projeto honestamente, pausa de
 * 1,5 s entre requisições (mesmo valor de `etl/betim/etl/camaras/domweb.py`)
 * e escopo reduzido — UMA edição por rodada, sem crawlear o acervo.
 *
 * ═══ TRAVA DE SANIDADE ═══
 *
 * Fonte fora (HTTP != 200, JSON malformado, PDF sem texto) = exit 1 com
 * mensagem. Nenhum pendente é gravado fingindo coleta vazia — mesmo padrão
 * de `BloqueioDomWeb` no domweb.py: bloqueio silencioso não pode virar
 * número de cobertura.
 *
 * ═══ DADO PESSOAL ═══
 *
 * Trechos citados são mascarados ANTES de gravar: sequência de 11 dígitos
 * (ou CPF formatado) que passa no mod-11 vira "[CPF-REMOVIDO]" — régua
 * gêmea de `apps/web/lib/paraopeba/triagem.ts` (reimplementada aqui, não
 * importada, para não puxar o grafo de imports do Next para um script CLI).
 * A segunda rede é `scripts/checar-dado-pessoal-em-dado.py`, que varre
 * `apps/web/data/**` no pre-push e na CI.
 *
 * ═══ USO ═══
 *
 *   npx tsx scripts/radar-editais-diarios.mts            # dia de hoje/última edição
 *   npx tsx scripts/radar-editais-diarios.mts --dias 3   # procura até 3 dias atrás
 *   npx tsx scripts/radar-editais-diarios.mts --seco     # mede sem gravar pendente
 *   npx tsx scripts/radar-editais-diarios.mts --limiar 10  # calibra o score
 *
 * Cadência: diária às 04:20 (ver `scripts/agendar-tarefas-windows.ps1`,
 * tarefa ControlePopular_RadarEditais). Saída em UTF-8; console em cp1252
 * pode cuspir acento torto — o que importa é o JSON gravado, que é UTF-8.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PENDENTES_DIR = path.join(RAIZ, "apps", "web", "data", "radar-editais", "pendentes");
const PROCESSADOS_DIR = path.join(RAIZ, "apps", "web", "data", "radar-editais", "processados");
const EXTRATOR = path.join(RAIZ, "scripts", "radar-editais-extrair-pdf.py");

const API_BASE = "https://www.jornalminasgerais.mg.gov.br/api/v1";
const USER_AGENT = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";
const PAUSA_MS = 1500; // pausa entre requisições ao host de terceiro (padrão domweb.py)
const TIMEOUT_MS = 60_000;
const JANELA_ANTES = 150; // caracteres antes da âncora no trecho citado
const JANELA_DEPOIS = 1800; // caracteres depois da âncora no trecho citado

const ARGS = process.argv.slice(2);
const SO_MEDIR = ARGS.includes("--seco");
const DIAS = Math.max(1, Number(ARGS[ARGS.indexOf("--dias") + 1] ?? 1) || 1);
const LIMIAR = Math.max(1, Number(ARGS[ARGS.indexOf("--limiar") + 1] ?? 7) || 7);

/** Nome da fonte, exibido nas entradas e no relatório. */
const FONTE = "dom-mg";
const FONTE_NOME = "Diário Oficial Eletrônico de Minas Gerais (Jornal Minas Gerais)";

// ──────────────────────────────────────────────────────────────────────────
// Detecção determinística: âncoras + termos ponderados + bônus de cabeçalho.
// Todo o casamento é sobre o texto NORMALIZADO (sem acento, minúsculas) —
// a normalização é 1:1 em comprimento, então os índices valem no original.
// ──────────────────────────────────────────────────────────────────────────

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Âncora: bloco só é candidato se contiver uma destas marcas. */
const ANCORAS: Array<{ re: RegExp; rotulo: string }> = [
  { re: /\bedital\b/g, rotulo: "edital" },
  { re: /\bchamada\s+publica\b/g, rotulo: "chamada publica" },
  { re: /\bchamamento\s+publico\b/g, rotulo: "chamamento publico" },
  { re: /\bselecao\s+publica\b/g, rotulo: "selecao publica" },
];

/** Cabeçalho forte de edital: bônus alto, quase sempre acima do limiar. */
const RE_EDTIAL_FORTE =
  /edital\s+(?:de\s+)?(?:chamamento\s+publico|chamada\s+publica|convocacao|selecao|convite|abertura|credenciamento|concorrencia|tomada\s+de\s+precos|pregao|leilao|processo\s+seletivo)/gi;

/** Termos com peso, teto de repetições e rótulo para o JSON. */
const TERMOS: Array<{ re: RegExp; peso: number; teto: number; rotulo: string }> = [
  { re: /chamamento\s+publico/g, peso: 5, teto: 2, rotulo: "chamamento publico" },
  { re: /selecao\s+publica/g, peso: 4, teto: 2, rotulo: "selecao publica" },
  { re: /chamada\s+publica/g, peso: 3, teto: 2, rotulo: "chamada publica" },
  { re: /sociedade\s+civil/g, peso: 4, teto: 2, rotulo: "sociedade civil" },
  { re: /conselho/g, peso: 2, teto: 3, rotulo: "conselho" },
  { re: /condel/g, peso: 2, teto: 2, rotulo: "condel" },
  { re: /ppddh/g, peso: 2, teto: 2, rotulo: "ppddh" },
  { re: /inscric/g, peso: 2, teto: 3, rotulo: "inscricao" },
  { re: /prazo/g, peso: 1, teto: 3, rotulo: "prazo" },
  { re: /\bosc\b/g, peso: 2, teto: 2, rotulo: "osc" },
  { re: /credenciamento/g, peso: 3, teto: 2, rotulo: "credenciamento" },
  { re: /termo\s+de\s+(?:fomento|colaboracao)/g, peso: 3, teto: 2, rotulo: "termo de parceria" },
  { re: /premiac/g, peso: 2, teto: 2, rotulo: "premiacao" },
  { re: /homologac/g, peso: 1, teto: 2, rotulo: "homologacao" },
  { re: /\brecursos?\b/g, peso: 1, teto: 2, rotulo: "recurso" },
  { re: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, peso: 2, teto: 3, rotulo: "data dd/mm/aaaa" },
  { re: /entidade/g, peso: 1, teto: 2, rotulo: "entidade" },
  { re: /organizac/g, peso: 1, teto: 2, rotulo: "organizacao" },
  { re: /eleic/g, peso: 1, teto: 2, rotulo: "eleicao" },
  { re: /defensor/g, peso: 1, teto: 2, rotulo: "defensores" },
];

// ──────────────────────────────────────────────────────────────────────────
// Máscara de CPF (mod-11) — régua gêmea de lib/paraopeba/triagem.ts.
// ──────────────────────────────────────────────────────────────────────────

function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
  const dv = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

function mascararCpf(texto: string): string {
  return texto.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g, (seq) =>
    cpfValido(seq.replace(/\D/g, "")) ? "[CPF-REMOVIDO]" : seq,
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Gancho de enriquecimento por LLM — DESATIVADO por padrão.
//
// O dono pediu detecção determinística nesta etapa. Se um dia o enriquecimento
// de resumo/título por modelo for aceito, este é o ponto de costura: recebe o
// candidato montado e devolve um parcial (titulo/resumo) ANTES de gravar.
// Quem ligar este gancho assume a regra 8 do AGENTS.md (sanitizar antes do
// prompt — a máscara de CPF acima já roda, mas nada substitui a revisão) e a
// regra editorial: resumo gerado por modelo é o PORTAL afirmando algo e deve
// ser rotulado com data e modelo. Por enquanto: função vazia, candidato segue
// determinístico.
// ──────────────────────────────────────────────────────────────────────────

type Candidato = {
  dataPublicacao: string;
  pagina: number;
  secao: string | null;
  tituloSugerido: string;
  trecho: string;
  score: number;
  termos: string[];
};

async function enriquecerComLlm(_c: Candidato): Promise<Candidato> {
  // Desativado por padrão: sem chave, sem modelo, sem rede.
  return _c;
}

// ──────────────────────────────────────────────────────────────────────────
// Detecção por página.
// ──────────────────────────────────────────────────────────────────────────

function pontuar(janelaNormalizada: string): { score: number; termos: string[] } {
  let score = 0;
  const termos: string[] = [];
  for (const t of TERMOS) {
    const n = Math.min(t.teto, (janelaNormalizada.match(t.re) ?? []).length);
    if (n > 0) {
      score += t.peso * n;
      termos.push(t.rotulo);
    }
  }
  if (RE_EDTIAL_FORTE.test(janelaNormalizada)) {
    score += 6;
    termos.push("cabecalho edital forte");
  }
  return { score, termos };
}

function detectarNaPagina(textoPagina: string, nPagina: number): Candidato[] {
  const norm = normalizar(textoPagina);
  const achados: Candidato[] = [];

  // Coleta índices de todas as âncoras e junta janelas que se sobrepõem.
  const indices = new Set<number>();
  for (const a of ANCORAS) {
    let m: RegExpExecArray | null;
    a.re.lastIndex = 0;
    while ((m = a.re.exec(norm))) indices.add(m.index);
  }
  const ordenados = [...indices].sort((x, y) => x - y);

  let janelas: Array<[number, number]> = [];
  for (const i of ordenados) {
    const [inicio, fim] = [Math.max(0, i - JANELA_ANTES), Math.min(textoPagina.length, i + JANELA_DEPOIS)];
    const ultima = janelas[janelas.length - 1];
    if (ultima && inicio <= ultima[1]) {
      ultima[1] = Math.max(ultima[1], fim); // mescla sobreposição
    } else {
      janelas.push([inicio, fim]);
    }
  }
  // Janelas mescladas podem engolir âncoras distantes: re-segmenta se ficar
  // maior que o dobro da janela (evita um único "candidato" de 6 mil chars).
  janelas = janelas.flatMap(([ini, fim]) =>
    fim - ini > 2 * (JANELA_ANTES + JANELA_DEPOIS)
      ? [[ini, ini + JANELA_ANTES + JANELA_DEPOIS] as [number, number], [fim - JANELA_ANTES - JANELA_DEPOIS, fim] as [number, number]]
      : [[ini, fim] as [number, number]],
  );

  for (const [ini, fim] of janelas) {
    const trecho = textoPagina.slice(ini, fim);
    const janelaNorm = norm.slice(ini, fim);
    const { score, termos } = pontuar(janelaNorm);
    if (score < LIMIAR) continue;
    const tituloSugerido = sugerirTitulo(trecho, janelaNorm, ini, fim);
    achados.push({
      dataPublicacao: "", // preenchido por quem chama (edição)
      pagina: nPagina,
      secao: null, // preenchido por quem chama (mapa de seções)
      tituloSugerido,
      trecho,
      score,
      termos: [...new Set(termos)],
    });
  }
  return achados;
}

/** Primeira linha (ou até 140 chars) que contém a âncora, limpa. */
function sugerirTitulo(trecho: string, trechoNorm: string, _ini: number, _fim: number): string {
  const linhas = trecho.split("\n");
  const achou = linhas.find((l) =>
    /\bedital\b|\bchamada\s+publica\b|\bchamamento\s+publico\b|\bselecao\s+publica\b/.test(normalizar(l)),
  );
  const cru = (achou ?? linhas.find((l) => l.trim()) ?? "Edital no Diário Oficial de Minas Gerais").trim();
  const umaLinha = cru.replace(/\s+/g, " ");
  return umaLinha.length > 140 ? `${umaLinha.slice(0, 137)}…` : umaLinha;
}

// ──────────────────────────────────────────────────────────────────────────
// Rede: uma edição por rodada, com retry e pausa (padrão domweb.py).
// ──────────────────────────────────────────────────────────────────────────

const pausar = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Edicao {
  dataPublicacao: string;
  cadernos: Array<{ id: number; descricao: string; secoes: Array<{ descricao: string; paginaInicial: number }> }>;
  arquivoBase64: string;
  totalPaginas: number;
  descricaoCaderno: string;
}

async function obterEdicao(dataIso: string): Promise<Edicao | null> {
  const url = `${API_BASE}/Jornal/ObterEdicaoPorDataPublicacao?dataPublicacao=${dataIso}`;
  await pausar(PAUSA_MS);
  let ultimoErro = "";
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const corpo = (await res.json()) as { dados: unknown; erros?: unknown[] };
      if (!corpo || typeof corpo !== "object" || !("dados" in corpo)) {
        throw new Error(`resposta sem o campo "dados": ${JSON.stringify(corpo).slice(0, 200)}`);
      }
      if (corpo.dados === null) return null; // dia sem publicação — caso normal
      return validarEdicao(corpo.dados, dataIso);
    } catch (err) {
      ultimoErro = err instanceof Error ? err.message : String(err);
      if (tentativa < 3) await pausar(3000 * tentativa);
    }
  }
  throw new Error(`GET ${url} falhou após 3 tentativas: ${ultimoErro}`);
}

function validarEdicao(dados: unknown, esperado: string): Edicao {
  const d = dados as {
    dataPublicacao?: string;
    cadernos?: Array<{ id?: number; descricao?: string; secoes?: Array<{ descricao?: string; paginaInicial?: number }> }>;
    arquivoCadernoPrincipal?: { arquivo?: string; totalPaginas?: number; descricaoCaderno?: string };
  };
  if (!d || typeof d !== "object") throw new Error("dados da edição não é objeto");
  if (!Array.isArray(d.cadernos)) throw new Error("edição sem lista de cadernos");
  const arq = d.arquivoCadernoPrincipal;
  if (!arq || typeof arq.arquivo !== "string" || arq.arquivo.length === 0) {
    throw new Error("edição sem arquivo do caderno principal (arquivoCadernoPrincipal.arquivo)");
  }
  return {
    dataPublicacao: (d.dataPublicacao ?? esperado).slice(0, 10),
    cadernos: d.cadernos
      .filter((c) => c && typeof c === "object")
      .map((c) => ({
        id: Number(c.id ?? 0),
        descricao: c.descricao ?? "",
        secoes: Array.isArray(c.secoes)
          ? c.secoes.filter((s) => s && typeof s === "object").map((s) => ({ descricao: s.descricao ?? "", paginaInicial: Number(s.paginaInicial ?? 0) }))
          : [],
      })),
    arquivoBase64: arq.arquivo,
    totalPaginas: Number(arq.totalPaginas ?? 0),
    descricaoCaderno: arq.descricaoCaderno ?? "",
  };
}

/** Mapa página → seção do caderno principal (a que o PDF corresponde). */
function mapaDeSecoes(edicao: Edicao): Map<number, string> {
  const mapa = new Map<number, string>();
  const caderno =
    edicao.cadernos.find((c) => c.descricao && edicao.descricaoCaderno && c.descricao === edicao.descricaoCaderno) ??
    edicao.cadernos[0];
  if (!caderno) return mapa;
  for (let p = 1; p <= edicao.totalPaginas; p++) {
    let secao = "Sem seção mapeada";
    for (const s of caderno.secoes) {
      if (s.paginaInicial > 0 && s.paginaInicial <= p) secao = s.descricao;
    }
    mapa.set(p, secao);
  }
  return mapa;
}

// ──────────────────────────────────────────────────────────────────────────
// Extração de texto: base64 → PDF temporário → PyMuPDF (helper .py).
// ──────────────────────────────────────────────────────────────────────────

interface PaginaExtraida {
  n: number;
  texto: string;
}

function extrairTextoPdf(base64: string, rotulo: string): PaginaExtraida[] {
  const tmpPdf = path.join(os.tmpdir(), `radar-editais-${rotulo}-${crypto.randomBytes(4).toString("hex")}.pdf`);
  const tmpJson = tmpPdf + ".json";
  try {
    fs.writeFileSync(tmpPdf, Buffer.from(base64, "base64"));
    const python = process.env.RADAR_PYTHON ?? "python";
    let r = spawnSync(python, [EXTRATOR, tmpPdf, tmpJson], { encoding: "utf-8", timeout: 180_000 });
    if (r.error && !process.env.RADAR_PYTHON) {
      r = spawnSync("py", ["-3", EXTRATOR, tmpPdf, tmpJson], { encoding: "utf-8", timeout: 180_000 });
    }
    if (r.error) {
      throw new Error(`não achei python para extrair o PDF (${r.error.message}); defina RADAR_PYTHON`);
    }
    if (r.status !== 0) {
      const saida = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim();
      throw new Error(`extrator falhou (rc=${r.status}): ${saida.slice(0, 400)}`);
    }
    const dados = JSON.parse(fs.readFileSync(tmpJson, "utf-8")) as { paginas?: PaginaExtraida[] };
    if (!Array.isArray(dados.paginas) || dados.paginas.length === 0) {
      throw new Error("extrator devolveu zero páginas com texto");
    }
    console.log(`${r.stdout.trim().split("\n").pop()}`);
    return dados.paginas;
  } finally {
    for (const p of [tmpPdf, tmpJson]) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* temp pode já ter sumido */
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Gravação de pendentes (idempotente por <data>-<hash>).
// ──────────────────────────────────────────────────────────────────────────

function gravarPendente(c: Candidato): string | null {
  const hash = crypto
    .createHash("sha256")
    .update(`${FONTE}|${c.dataPublicacao}|${c.pagina}|${c.tituloSugerido}`)
    .digest("hex")
    .slice(0, 8);
  const id = `${c.dataPublicacao}-${hash}`;
  const caminho = path.join(PENDENTES_DIR, `${id}.json`);
  if (fs.existsSync(caminho)) return null; // já viu este candidato

  const entrada = {
    id,
    status: "pendente",
    fonte: FONTE,
    fonte_nome: FONTE_NOME,
    fonte_url: "https://www.jornalminasgerais.mg.gov.br",
    data_publicacao: c.dataPublicacao,
    url: `https://www.jornalminasgerais.mg.gov.br/edicao-do-dia?dataPublicacao=${c.dataPublicacao}`,
    pagina: c.pagina,
    secao: c.secao,
    titulo_sugerido: mascararCpf(c.tituloSugerido),
    trechos: [{ contexto: mascararCpf(c.trecho).replace(/\s+/g, " ").trim() }],
    score: c.score,
    termos: c.termos,
    criado_em: new Date().toISOString(),
    detector: "radar-editais v1 (deterministico, sem LLM)",
  };
  fs.mkdirSync(PENDENTES_DIR, { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(entrada, null, 1) + "\n", "utf-8");
  return id;
}

// ──────────────────────────────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────────────────────────────

function dataIso(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  console.log(`[radar-editais] fonte=${FONTE} dias=${DIAS} limiar=${LIMIAR} seco=${SO_MEDIR ? "sim" : "nao"}`);

  // 1. Acha a edição: hoje primeiro, depois os dias anteriores. Se a janela
  // inteira for fim de semana/feriado, cai na última edição publicada.
  let edicao: Edicao | null = null;
  let dataUsada = "";
  for (let i = 0; i < DIAS; i++) {
    const iso = dataIso(i);
    console.log(`  … consultando edição de ${iso}`);
    const e = await obterEdicao(iso);
    if (e) {
      edicao = e;
      dataUsada = iso;
      break;
    }
  }
  if (!edicao) {
    console.log(`  … nenhuma edição em ${DIAS} dia(s); tentando a última publicada`);
    await pausar(PAUSA_MS);
    const res = await fetch(`${API_BASE}/Jornal/ObterUltimaEdicao`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`❌ [radar-editais] fonte fora: ObterUltimaEdicao respondeu HTTP ${res.status}`);
      process.exit(1);
    }
    const corpo = (await res.json()) as { dados: unknown };
    if (!corpo || corpo.dados === null || corpo.dados === undefined) {
      console.error("❌ [radar-editais] fonte fora: nenhuma edição disponível (nem na última publicada)");
      process.exit(1);
    }
    edicao = validarEdicao(corpo.dados, dataIso(0));
    dataUsada = edicao.dataPublicacao;
  }

  console.log(`✅ edição de ${edicao.dataPublicacao} — caderno "${edicao.descricaoCaderno || edicao.cadernos[0]?.descricao}", ${edicao.totalPaginas} página(s), ${edicao.cadernos.length} caderno(s) na edição`);

  // 2. Texto do caderno principal.
  const paginas = extrairTextoPdf(edicao.arquivoBase64, edicao.dataPublicacao);
  const mapa = mapaDeSecoes(edicao);

  // 3. Detecção.
  const candidatos: Candidato[] = [];
  for (const p of paginas) {
    const daPagina = detectarNaPagina(p.texto, p.n);
    for (const c of daPagina) {
      c.dataPublicacao = edicao.dataPublicacao;
      c.secao = mapa.get(p.n) ?? null;
    }
    candidatos.push(...daPagina);
  }

  console.log(`🔎 ${candidatos.length} candidato(s) acima do limiar ${LIMIAR} (de ${paginas.length} página(s) com texto)`);

  // 4. Grava (ou só mede, em --seco).
  let gravados = 0;
  let repetidos = 0;
  for (const c of candidatos) {
    const enriquecido = await enriquecerComLlm(c);
    if (SO_MEDIR) {
      console.log(`🧪 [seco] ${enriquecido.tituloSugerido.slice(0, 80)} | pág. ${enriquecido.pagina} | score ${enriquecido.score}`);
      continue;
    }
    const id = gravarPendente(enriquecido);
    if (id) {
      gravados++;
      console.log(`📝 pendente ${id} — "${enriquecido.tituloSugerido.slice(0, 80)}" (score ${enriquecido.score})`);
    } else {
      repetidos++;
    }
  }
  console.log(`\n[radar-editais] edição=${dataUsada} candidatos=${candidatos.length} gravados=${gravados} repetidos=${repetidos} seco=${SO_MEDIR ? "sim" : "nao"}`);
}

main().catch((err) => {
  console.error("❌ [radar-editais] rodada abortada:", err instanceof Error ? err.message : err);
  process.exit(1);
});
