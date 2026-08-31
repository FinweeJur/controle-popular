/**
 * Coletor M8 — rede de socios da Vale via brasil.io (dataset `socios-brasil`),
 * frente Empresas. Ponto de partida para investigacao, nunca achado.
 *
 * ═══ FONTE E LICENCA ═══
 * - API: `https://api.brasil.io/v1/dataset/socios-brasil/socios/data/`
 *   (caminho antigo `https://brasil.io/api/dataset/socios-brasil/socios/data/`
 *   responde igual, tambem exigindo token).
 * - Dados originais: Receita Federal do Brasil (dados abertos do CNPJ),
 *   liberados pelo brasil.io; licenca CC BY-SA 4.0.
 * - Dataset capturado em 20/09/2020 e importado em 03/11/2020 — quadro
 *   societario VELHO, anterior a 2020. Data de entrada na sociedade e
 *   participacao percentual NAO existem neste dataset (lacuna informada:
 *   `dataEntrada` sai null em todos os registros).
 *
 * ═══ MEDICAO DA API (31/08/2026) ═══
 * - **Precisa de token**: os endpoints acima respondem 401 sem o header
 *   `Authorization: Token <token>` (medido nos dois caminhos, com e sem
 *   filtro). O token e criado em https://brasil.io/auth/tokens-api/ e entra
 *   pela variavel de ambiente `BRASILIO_API_TOKEN` — nunca versionada.
 * - `page_size` maximo de 10.000 registros por pagina (documentacao oficial
 *   do brasil.io); este coletor usa 1.000 para onerar menos o servidor.
 * - Shape dos resultados (dicionario de dados oficial da tabela `socios`):
 *   `cnpj`, `razao_social`, `cpf_cnpj_socio`, `nome_socio`, `tipo_socio`,
 *   `qualificacao_socio`, `codigo_tipo_socio`, `codigo_qualificacao_socio`.
 * - Filtro por empresa: `cnpj=<14 digitos>` (mesmo filtro de igualdade da
 *   interface web). O plano previa busca por nome; o filtro exato e melhor:
 *   zero falsos positivos de razao social parecida.
 *
 * ═══ MASCARAMENTO — REGRA NAO NEGOCIAVEL ═══
 * A interface web do brasil.io ja mostra o documento do socio mascarado
 * (ex.: `***697419**`). Mesmo assim o coletor NAO confia na fonte: qualquer
 * `cpf_cnpj_socio` de pessoa fisica (11 digitos) sai do coletor como
 * `***.****.***-**`, e de pessoa juridica (14 digitos) como
 * `**.***.***` + barra + `****-**`.
 * Nome, qualificacao e tipo tambem sao varridos por CPF valido (mod-11) e
 * redigidos — a regra do AGENTS.md: varrer o DADO, nao so o campo suspeito.
 * A guarda `scripts/checar-dado-pessoal-em-dado.py` roda no pre-push e na CI
 * por cima do JSON gerado em `apps/web/data/`.
 *
 * ═══ RESSALVA EDITORIAL (regra do AGENTS.md) ═══
 * Socio registrado na Receita Federal NAO significa gestao atual nem
 * responsabilidade por dano. A ressalva viaja colada ao dado no JSON.
 *
 * Uso:
 *   $env:BRASILIO_API_TOKEN="<token>" ; npx tsx scripts/coletar-socios-brasilio.mts
 *   npx tsx scripts/coletar-socios-brasilio.mts --self-check   # so o assert de redacao, sem rede
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "apps/web/data/socios-vale.json");
const RAIZ_CNPJ = "33.592.510/0001-54";
const RAIZ_CNPJ_DIGITOS = "33592510000154";
const PAUSA_MS = 400;
const PAGE_SIZE = 1000;
const MAX_PAGINAS = 100;

/** UA honesto e identifica o projeto — nunca UA de navegador falso. */
const AGENTE =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; coletor de socios)";

const RESSALVA_EDITORIAL =
  "Socio registrado na Receita Federal nao significa gestao atual nem responsabilidade por dano. Juncao e ponto de partida para investigar, nao achado.";

const abortar = (msg: string): never => {
  console.error(`[socios-brasilio] ABORT: ${msg}`);
  process.exit(1);
};

const pausa = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────────────────────────────────
// Redacao defensiva (copias locais, mesma convencao de lib/sem-cpf-no-repo
// e do coletor-ckan-mg: cada modulo que redige CPF carrega a propria copia).
// ─────────────────────────────────────────────────────────────────────────

function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** Redige CPF valido (mod-11) em qualquer texto — varre TODOS os campos. */
function redigirCpfEmTexto(texto: string): string {
  return texto.replace(/\d{11}/g, (seq) => (cpfValido(seq) ? "[documento redigido]" : seq));
}

/** Mascara `cpf_cnpj_socio` no que sair do coletor. Se o valor ja vier
 *  mascarado da fonte (asteriscos), mantem. Se nao for nem CPF nem CNPJ,
 *  omite (null). PF completa NUNCA sai para o arquivo. */
function mascararDocumento(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (valor.includes("*")) return valor;
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) return "***.****.***-**";
  if (digitos.length === 14) return "**.***.***/****-**";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Self-check de redacao — roda sempre, nao depende de rede nem de token.
// ─────────────────────────────────────────────────────────────────────────

function gerarCpfValido(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  const dv = (ate: number, corpo: string) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(corpo[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(9, base);
  const d2 = dv(10, base + d1);
  return base + d1 + d2;
}

function selfCheckRedacao(): void {
  const cpf = gerarCpfValido();
  if (!cpfValido(cpf)) abortar("self-check: CPF gerado nao passa no mod-11");
  const cpfFormatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  const mascara = mascararDocumento(cpfFormatado);
  if (mascara !== "***.****.***-**") abortar(`self-check: CPF nao mascarado (${mascara})`);
  if (mascararDocumento("33.592.510/0001-54") !== "**.***.***/****-**")
    abortar("self-check: CNPJ nao mascarado");
  const comCpfNoTexto = redigirCpfEmTexto(`NOME DE EXEMPLO ${cpfFormatado}`);
  if (comCpfNoTexto.includes(cpf.slice(0, 6))) abortar("self-check: CPF vazou no texto");
  console.log(`[socios-brasilio] self-check de redacao OK (CPF ${mascara} nunca sai completo)`);
}

// ─────────────────────────────────────────────────────────────────────────
// Coleta via API do brasil.io
// ─────────────────────────────────────────────────────────────────────────

interface LinhaBrasilio {
  cnpj: string;
  razao_social: string;
  cpf_cnpj_socio: string;
  nome_socio: string;
  tipo_socio: string;
  qualificacao_socio: string;
  [campo: string]: unknown;
}

interface PaginaBrasilio {
  count: number;
  next: string | null;
  previous: string | null;
  results: LinhaBrasilio[];
}

interface SocioSaida {
  nome: string;
  tipoPessoa: string;
  qualificacao: string;
  dataEntrada: string | null;
  cpfCnpjMascarado: string | null;
}

const TOKEN = process.env.BRASILIO_API_TOKEN;

async function coletar(): Promise<void> {
  if (!TOKEN) {
    abortar(
      "API do brasil.io exige token (401 sem ele — medido em 31/08/2026). " +
        "Crie o token em https://brasil.io/auth/tokens-api/ e rode com " +
        'BRASILIO_API_TOKEN="<token>" npx tsx scripts/coletar-socios-brasilio.mts',
    );
  }

  const headers = {
    "User-Agent": AGENTE,
    Authorization: `Token ${TOKEN}`,
    Accept: "application/json",
  };

  const primeira = `https://api.brasil.io/v1/dataset/socios-brasil/socios/data/?cnpj=${RAIZ_CNPJ_DIGITOS}&page=1&page_size=${PAGE_SIZE}`;
  const linhas: LinhaBrasilio[] = [];
  let url: string | null = primeira;
  let pagina = 0;

  while (url) {
    pagina += 1;
    if (pagina > MAX_PAGINAS) abortar(`paginação estourou ${MAX_PAGINAS} páginas — revisar filtro`);
    const r = await fetch(url, { headers });
    if (r.status === 401) abortar("token do brasil.io rejeitado (HTTP 401)");
    if (!r.ok) abortar(`HTTP ${r.status} em ${url}`);
    const corpo = (await r.json()) as PaginaBrasilio;
    if (!Array.isArray(corpo.results)) abortar("resposta sem `results` — shape da API mudou?");
    linhas.push(...corpo.results);
    url = corpo.next;
    if (url) {
      console.log(`[socios-brasilio] página ${pagina}: ${corpo.results.length} linhas (total ${corpo.count})`);
      await pausa(PAUSA_MS);
    }
  }

  if (linhas.length === 0) abortar("nenhum socio encontrado para a raiz — conferir CNPJ na fonte");

  const razoes = new Set(linhas.map((l) => l.razao_social));
  for (const l of linhas) {
    if (l.cnpj !== RAIZ_CNPJ_DIGITOS)
      abortar(`linha com cnpj ${l.cnpj} diferente da raiz — filtro da API devolveu errado`);
  }

  const socios: SocioSaida[] = linhas.map((l) => ({
    nome: redigirCpfEmTexto(String(l.nome_socio ?? "")).trim(),
    tipoPessoa: redigirCpfEmTexto(String(l.tipo_socio ?? "")).trim(),
    qualificacao: redigirCpfEmTexto(String(l.qualificacao_socio ?? "")).trim(),
    dataEntrada: null,
    cpfCnpjMascarado: mascararDocumento(l.cpf_cnpj_socio),
  }));

  const porQualificacao = new Map<string, number>();
  for (const s of socios) {
    porQualificacao.set(s.qualificacao, (porQualificacao.get(s.qualificacao) ?? 0) + 1);
  }

  const arquivo = {
    geradoEm: new Date().toISOString(),
    fonte: "brasil.io (socios-brasil)",
    raizCNPJ: RAIZ_CNPJ,
    ressalvaEditorial: RESSALVA_EDITORIAL,
    socios,
  };

  const conteudo = JSON.stringify(arquivo, null, 1) + "\n";
  writeFileSync(DESTINO, conteudo, "utf8");
  const relido = readFileSync(DESTINO, "utf8");
  if (relido !== conteudo) abortar(`gravado e relido nao batem: ${DESTINO}`);
  if (relido.includes("\uFFFD")) abortar(`mojibake no arquivo gravado: ${DESTINO}`);

  console.log(`[socios-brasilio] gravado ${DESTINO}`);
  console.log(`[socios-brasilio] ${socios.length} socios; razoes sociais na fonte: ${[...razoes].join(" | ")}`);
  console.log("[socios-brasilio] por qualificacao:");
  for (const [q, n] of [...porQualificacao.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${q}`);
  }
}

selfCheckRedacao();
if (process.argv.includes("--self-check")) {
  console.log("[socios-brasilio] self-check apenas, sem coleta.");
} else {
  await coletar();
}
