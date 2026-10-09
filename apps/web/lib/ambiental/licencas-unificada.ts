/**
 * licencas-unificada.ts — feed único de licenças/outorgas/autos para
 * `/ambiental/licencas`, lendo os JSONs de amostra coletados (coleta cheia
 * roda na home-pc pela rotina agendada: `rotina-ambiental.mts`).
 *
 * Server-only: importa os arquivos de data/. A página recebe o feed
 * NORMALIZADO + COBERTURA — o array inteiro não serdado por fora de
 * `TabelaLicencas`/tamanho; teto de 3 MiB gzip do Worker.
 *
 * REGRA EDITORIAL (AGENTS.md): cadastros de órgãos diferentes NUNCA são
 * somados num "total geral"; cada linha mantém `orgao` de origem, e a
 * ressalva de cada JSON segue no `CoberturaLicencas.ressalvas`.
 *
 * Campos unificados: orgao, uf, ano, categoria (licenca/outorga/
 * auto_infracao/embargo), tipo (tag), empresa, municipio, bacia,
 * data_inicio, data_fim, situacao, processo.
 *
 * REGRAS EM TABELA (refatoração de 08/10/2026, hotspots CodeScene — leitura
 * de 07/10 com saúde 5,73): três lugares em que a MESMA regra estava
 * escrita N vezes viraram dado declarativo, sem mudar o que sai na tela:
 *  1. `REGRAS_LINK_OFICIAL` — um link por órgão no lugar de 18 `if`;
 *   2. `FONTES` — lista única das 18 fontes da cobertura (antes repetida
 *      três vezes: soma de totais, truncado e ressalvas);
 *   3. `FonteEstadualSimples` — os 4 estados com o mesmo formato bruto
 *      (BA, MA, PA, GO) descritos por configuração, não por função nova.
 * A prova de equivalência está em `licencas-unificada.test.ts`.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { janelaDe } from "./licencas-arquivos";

interface ArquivoLicencasRaw {
  total?: number;
  total_disponivel?: number;
  truncado?: boolean;
  gerado_em?: string;
  ressalva_editorial?: string;
  colunas?: string[];
  linhas?: (LinhaBruta | (string | number | null)[])[];
}

/** Carrega JSON já normalizado (coletores Onda 2: campos completos incluindo
 *  microresumo e tags). maxLinhas limita a janela por bundle (Rule 1).
 *  Os totais reais ficam no meta para uso em LICENCAS_COBERTURA. */
interface ArquivoNormalizadoRaw {
  total?: number;
  total_disponivel?: number;
  truncado?: boolean;
  ressalva_editorial?: string;
  gerado_em?: string;
  linhas?: LinhaLicencaUnificada[];
}

export interface LinhaLicencaUnificada {
  orgao: string;
  uf: string | null;
  ano: number | null;
  categoria: "licenca" | "outorga" | "auto_infracao" | "embargo";
  tipo: string;
  empresa: string | null;
  municipio: string | null;
  bacia: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  situacao: string | null;
  processo: string;
  valor_investimento?: number | null;
  porte?: string | null;
  tamanho_detalhe?: string | null;
  microresumo?: string | null;
  tags?: string[];
  link_oficial?: string | null;
}

export interface CoberturaLicencas {
  total: number;
  por_orgao: Record<string, number>;
  por_uf: Record<string, number>;
  por_ano: Record<string, number>;
  por_categoria: Record<string, number>;
  truncado: boolean;
  gerado_em: string;
  ressalvas: string[];
}

type LinhaBruta = Record<string, string | number | boolean | null>;

/** Campos que cada coletor precisa preencher. `orgao`, `categoria`, `ano` e
 *  `link_oficial` são acrescentados por `unificar` — escrevê-los em cada
 *  coletor era repetição da mesma regra em 15 blocos. */
interface ExtracaoLinha {
  uf: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  tipo: string;
  empresa: string | null;
  municipio: string | null;
  bacia: string | null;
  situacao: string | null;
  processo: string;
  valor_investimento?: number | null;
  porte?: string | null;
  tamanho_detalhe?: string | null;
  link_oficial?: string | null;
}

/**
 * ---------------------------------------------------------------------------
 * 1. LINKS OFICIAIS — tabela por órgão (antes: cadeia de 18 `if`).
 * Esta seção vem ANTES da carga dos JSONs de propósito: a Onda 2 já monta o
 * link de cada linha enquanto lê o arquivo, então a constante precisa estar
 * inicializada antes do primeiro `carregarLinhasNormalizadas()`.
 * ---------------------------------------------------------------------------
 */

/** Uma linha de `REGRAS_LINK_OFICIAL`: quem casa e como montar a URL. */
interface RegraLinkOficial {
  /** Rótulo do órgão — para leitura humana e para os testes. */
  nome: string;
  /** O nome do órgão em MAIÚSCULAS precisa ser exatamente este. */
  igual?: string;
  /** O nome do órgão em MAIÚSCULAS precisa conter um destes trechos. */
  contem?: string[];
  /** O nome do órgão em MAIÚSCULAS NÃO pode conter nenhum destes trechos. */
  evita?: string[];
  /** Quando existe, a regra vale só para esta categoria de ato. */
  categoria?: LinhaLicencaUnificada["categoria"];
  /** Normaliza o processo antes de codificar (ex.: só dígitos e barras). */
  limpa?: (processo: string) => string;
  /** Modelo da URL: `{processo}` recebe o processo em `encodeURIComponent`. */
  modelo: string;
}

/** IGAM e o SIAM-MG consultam por portaria/processo só com dígitos e barras:
 *  "Portaria 1800001/2018" → "1800001/2018". Vazio devolve "" e a montagem
 *  cai no processo original, como fazia a versão em `if`. */
const limpaSiam = (processo: string): string => processo.replace(/[^\d/]/g, "");

/** FEPAM e IMA-SC publicam o processo entre parênteses:
 *  "AI 4 (Proc. 001374-0567/17-1)" → "001374-0567/17-1". */
const limpaParenteses = (processo: string): string =>
  /\((?:Proc\.?\s*)?([^)]+)\)/i.exec(processo)?.[1]?.trim() ?? "";

/** IAT publica "Protocolo 176488697 (Doc. 35146)" e consulta pelo número. */
const limpaProtocolo = (processo: string): string =>
  /Protocolo\s*([\d.]+)/i.exec(processo)?.[1]?.trim() ?? "";

/**
 * Um link de consulta processual por órgão — regra 1 das seis qualidades
 * (AGENTS.md): link DIRETO para o ato, nunca para a home do órgão.
 *
 * A ORDEM DA LISTA É A REGRA: a primeira linha que casa vence, exatamente
 * como a cadeia de `if` que isto substituiu. Ex.: "IBAMA" puro usa o SEI
 * mesmo quando a categoria é auto_infracao, e SEMAD de MG (SIAM) vem antes
 * de SEMAD de GO (SGA) porque o `evita: ["GO"]` desempata.
 */
const REGRAS_LINK_OFICIAL: RegraLinkOficial[] = [
  // 1 — IBAMA (licenças federais). Igualdade exata: a variante "IBAMA (autos)" e
  //     a categoria auto_infracao têm link próprio nas duas linhas seguintes.
  { nome: "IBAMA", igual: "IBAMA", modelo: "https://sei.ibama.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa={processo}" },
  // 2 — IBAMA (autos de infração e embargos): duas grafias de nome, um link só.
  { nome: "IBAMA (autos)", contem: ["IBAMA (AUTOS)"], modelo: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaInfracoes.php?termo={processo}" },
  { nome: "IBAMA + auto_infracao", contem: ["IBAMA"], categoria: "auto_infracao", modelo: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaInfracoes.php?termo={processo}" },
  // 3 — ANA (outorgas federais): igualdade exata, como no original.
  { nome: "ANA", igual: "ANA", modelo: "https://www.snirh.gov.br/cnarh/consulta/processo?numero={processo}" },
  // 4 — IGAM (MG): consulta por portaria, só dígitos e barras.
  { nome: "IGAM (MG)", contem: ["IGAM"], limpa: limpaSiam, modelo: "http://www.siam.mg.gov.br/siam/legislacao/consulta_portarias.jsp?num={processo}" },
  // 4b — SEMAD (MG) / FEAM / IEF: são três linhas porque o `evita: ["GO"]` vale
  //      só para o SEMAD — FEAM e IEF de Goiás, se existirem, seguem no SIAM-MG.
  { nome: "SEMAD (MG)", contem: ["SEMAD"], evita: ["GO"], limpa: limpaSiam, modelo: "http://www.siam.mg.gov.br/siam/processo/consulta_processo.jsp?num={processo}" },
  { nome: "FEAM (MG)", contem: ["FEAM"], limpa: limpaSiam, modelo: "http://www.siam.mg.gov.br/siam/processo/consulta_processo.jsp?num={processo}" },
  { nome: "IEF (MG)", contem: ["IEF"], limpa: limpaSiam, modelo: "http://www.siam.mg.gov.br/siam/processo/consulta_processo.jsp?num={processo}" },
  // 5 a 9 — secretarias estaduais: uma linha por órgão, na ordem do `if` original.
  { nome: "SEMA (MT)", contem: ["SEMA (MT)", "SEMA-MT"], modelo: "https://simlam.sema.mt.gov.br/portal/processo/consulta?termo={processo}" },
  { nome: "INEMA (BA)", contem: ["INEMA"], modelo: "http://www.seia.ba.gov.br/consulta-processo?num_processo={processo}" },
  { nome: "SEMA (MA)", contem: ["SEMA (MA)", "SEMA-MA"], modelo: "https://sigla.sema.ma.gov.br/consulta/processo?termo={processo}" },
  { nome: "SEMAS (PA)", contem: ["SEMAS (PA)", "SEMAS-PA"], modelo: "http://monitoramento.semas.pa.gov.br/simlam/painel_processo.aspx?processo={processo}" },
  { nome: "SEMAD (GO)", contem: ["SEMAD (GO)", "SEMAD-GO"], modelo: "https://sga.meioambiente.go.gov.br/consulta/processo?numero={processo}" },
  // 10 — FEPAM (RS): o processo sai de dentro dos parênteses.
  { nome: "FEPAM (RS)", contem: ["FEPAM"], limpa: limpaParenteses, modelo: "https://sol.fepam.rs.gov.br/consulta/processo?termo={processo}" },
  // 11 a 18 — demais estados da Onda 2 (SEMAR, IMASUL, IEMA/AGERH, SEDAM, IBRAM,
  //           CETESB, IAT e IMA-SC). IAT e IMA-SC também limpam o processo.
  { nome: "SEMAR (PI)", contem: ["SEMAR"], modelo: "https://siga.semarh.pi.gov.br/consulta/processo/{processo}" },
  { nome: "IMASUL (MS)", contem: ["IMASUL"], modelo: "https://www.imasul.ms.gov.br/consulta-processo?termo={processo}" },
  { nome: "IEMA (ES)", contem: ["IEMA", "AGERH"], modelo: "https://siga.es.gov.br/consulta/processo?termo={processo}" },
  { nome: "SEDAM (RO)", contem: ["SEDAM"], modelo: "https://sigam.sedam.ro.gov.br/consulta/processo?termo={processo}" },
  { nome: "IBRAM (DF)", contem: ["IBRAM"], modelo: "https://sei.df.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa={processo}" },
  { nome: "CETESB (SP)", contem: ["CETESB"], modelo: "https://e.ambiente.sp.gov.br/atendimento/consulta/processo?numero={processo}" },
  { nome: "IAT (PR)", contem: ["IAT"], limpa: limpaProtocolo, modelo: "https://www.eprotocolo.pr.gov.br/consulta/processo?numero={processo}" },
  { nome: "IMA (SC)", contem: ["IMA (SC)", "IMA-SC"], limpa: limpaParenteses, modelo: "https://sinfat.ima.sc.gov.br/consulta/processo?codigo={processo}" },
];

/**
 * Confere se uma regra de link vale para o órgão/categoria informados.
 * `orgao` chega em MAIÚSCULAS (a comparação é sem distinção de caixa por
 * construção). Uma regra sem condição positiva (`igual`/`contem`) não casa
 * nada: seria erro de configuração, e errar para "sem link" é o erro seguro.
 */
/**
 * Conferência de TEXTO da regra: `igual`, `contem` e `evita` contra o
 * nome do órgão (em maiúsculas).
 *
 * Saiu de `casaNaRegra` em 09/10/2026 porque as três guardas encadeadas
 * levavam a função a complexidade 11 — o aviso do CodeScene. Aqui a ordem
 * das três é a MESMA do `if` original, com o mesmo encurtamento: falhou
 * `igual`, já responde `false` sem olhar o resto.
 *
 * @param regra regra declarativa da tabela.
 * @param orgao nome do órgão em MAIÚSCULAS.
 * @returns `true` quando o texto do órgão satisfaz a regra.
 */
function condicoesDeOrgao(regra: RegraLinkOficial, orgao: string): boolean {
  if (regra.igual !== undefined && orgao !== regra.igual) return false;
  if (regra.contem && !regra.contem.some((pedaco) => orgao.includes(pedaco))) return false;
  if (regra.evita && regra.evita.some((pedaco) => orgao.includes(pedaco))) return false;
  return true;
}

/**
 * Conferência de CATEGORIA da regra, se ela fixar uma.
 *
 * Desempata o IBAMA (`Regras-de-link`): o mesmo nome vai para o SEI quando
 * é licença, e para o CTF quando é auto de infração. Sem categoria fixada,
 * a regra serve para qualquer uma.
 *
 * @param regra regra declarativa da tabela.
 * @param categoria licenca | outorga | auto_infracao | embargo.
 * @returns `true` quando a categoria casa.
 */
function condicaoDeCategoria(
  regra: RegraLinkOficial,
  categoria: string | null | undefined,
): boolean {
  if (regra.categoria !== undefined && categoria !== regra.categoria) return false;
  return true;
}

/**
 * Confere se uma regra de link vale para o órgão/categoria informados.
 * `orgao` chega em MAIÚSCULAS (a comparação é sem distinção de caixa por
 * construção). Uma regra sem condição positiva (`igual`/`contem`) não casa
 * nada: seria erro de configuração, e errar para "sem link" é o erro seguro.
 *
 * Em 09/10/2026 virou composição das duas conferências acima — a ordem
 * (texto, depois categoria) é a do `if` original, e o `Boolean(...)` do
 * fim continua só sendo avaliado quando as duas passaram.
 */
function casaNaRegra(
  regra: RegraLinkOficial,
  orgao: string,
  categoria: string | null | undefined,
): boolean {
  if (!condicoesDeOrgao(regra, orgao)) return false;
  if (!condicaoDeCategoria(regra, categoria)) return false;
  return Boolean(regra.igual || regra.contem?.length);
}

/** Processos que a fonte grava e que NÃO designam nada consultável. */
const PROCESSO_SEM_CONSULTA = new Set(["s/n", "—"]);

/**
 * Guarda do número de processo: vazio, `s/n` ou o travessão da fonte não
 * viram link — não há o que consultar.
 *
 * Saiu de `construirLinkOficial` em 09/10/2026 pela mesma razão de
 * `condicoesDeOrgao`: três comparações encadeadas na mesma função inflavam
 * a complexidade. Os dois valores inválidos viraram `Set`, e não `||`
 * encadeado, porque dois `||` numa linha só já é o aviso de
 * *Complex Conditional* do CodeScene — a mesma troca de forma, sem mudar
 * o resultado.
 *
 * @param processo número do processo/ato tal como veio da fonte.
 * @returns o processo limpo, ou `null` quando não dá para consultar.
 */
function processoUtil(processo?: string | null): string | null {
  const proc = (processo ?? "").trim();
  if (!proc || PROCESSO_SEM_CONSULTA.has(proc)) return null;
  return proc;
}

/**
 * Gera link oficial específico para consulta do processo, licença, outorga
 * ou auto de infração no respectivo órgão ambiental (federal ou estadual).
 * Evita homepages genéricas; aponta diretamente para a consulta processual
 * pública (AGENTS.md — regra 1 das seis qualidades).
 *
 * @param orgao nome do órgão como aparece na linha unificada
 * @param processo número do processo/ato ("s/n", "—" ou vazio → sem link)
 * @param categoria licenca | outorga | auto_infracao | embargo (desempata o IBAMA)
 * @param urlDireta URL canônica dada pelo coletor, quando existe — vence a tabela
 * @returns a URL de consulta, ou `null` quando não há link específico a montar
 */
export function construirLinkOficial(
  orgao: string,
  processo?: string | null,
  categoria?: string | null,
  urlDireta?: string | null,
): string | null {
  if (urlDireta && /^https?:\/\//i.test(urlDireta.trim())) {
    return urlDireta.trim();
  }
  const proc = processoUtil(processo);
  if (!proc) return null;

  const orgUpper = orgao.toUpperCase();
  const regra = REGRAS_LINK_OFICIAL.find((r) => casaNaRegra(r, orgUpper, categoria));
  if (!regra) return null;

  const bruto = regra.limpa ? regra.limpa(proc) || proc : proc;
  return regra.modelo.replace("{processo}", () => encodeURIComponent(bruto));
}

/**
 * ---------------------------------------------------------------------------
 * 2. CARGA DOS JSONs (amostra versionada; arquivo completo só na home-pc).
 * ---------------------------------------------------------------------------
 */

/**
 * Abre um acervo de licença preferindo a AMOSTRA versionada
 * (`data/amostras/<arquivo>`) e caindo para o arquivo completo quando ele
 * existe. A amostra tem os MESMOS metadados (total real, ressalva, truncado)
 * e só as primeiras N linhas — exatamente a janela que a página publica, então
 * o resultado é idêntico lendo de um ou de outro. O arquivo completo não entra
 * no contexto de build do Guara (teto 256 MB); quem regenera a amostra é
 * `scripts/gerar-amostras-licencas.mts`, no prebuild.
 */
function abrirJsonLicencas(nome: string): ArquivoLicencasRaw | null {
  const caminhos = [
    path.resolve(process.cwd(), "apps", "web", "data", "amostras", nome),
    path.resolve(process.cwd(), "data", "amostras", nome),
    path.resolve(process.cwd(), "apps", "web", "data", nome),
    path.resolve(process.cwd(), "data", nome),
  ];
  for (const c of caminhos) {
    if (existsSync(c)) {
      try {
        return JSON.parse(readFileSync(c, "utf-8")) as ArquivoLicencasRaw;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Lê o JSON bruto já cortado na janela da página (Rule 1 AGENTS.md). */
function carregarDataJson(nome: string, maxLinhas: number = janelaDe(nome)): ArquivoLicencasRaw {
  const dado = abrirJsonLicencas(nome);
  if (!dado) return { total: 0, linhas: [] };
  if (Array.isArray(dado.linhas) && dado.linhas.length > maxLinhas) {
    return {
      ...dado,
      linhas: dado.linhas.slice(0, maxLinhas),
    };
  }
  return dado;
}

/**
 * Preenche, numa linha já normalizada da Onda 2, os campos que o coletor pode
 * não ter gravado: porte, valor, tamanho e link oficial. Tudo sai do próprio
 * registro (microresumo, tags, `valor_multa`, `fonte_url`) — nada é inferido
 * sem lastro no texto da fonte (§7 AGENTS.md).
 *
 * @param linha linha lida do JSON, com campos completos
 * @returns a MESMA linha ampliada; nunca altera o que veio do arquivo
 */
function normalizarLinhaOnda2(linha: LinhaLicencaUnificada): LinhaLicencaUnificada {
  const extra = linha as LinhaLicencaUnificada & {
    valor_multa?: number | string | null;
    fonte_url?: string | null;
  };
  const porte = linha.porte ?? inferirPorte(null, null, linha.tipo, linha.microresumo, linha.tags);
  const valor = linha.valor_investimento ?? extrairValor(extra.valor_multa, linha.microresumo);
  const tamanho = linha.tamanho_detalhe ?? extrairTamanho(null, null, linha.tipo, linha.microresumo);
  const link =
    linha.link_oficial ?? construirLinkOficial(linha.orgao, linha.processo, linha.categoria, extra.fonte_url);
  return {
    ...linha,
    porte,
    valor_investimento: valor,
    tamanho_detalhe: tamanho,
    link_oficial: link,
  };
}

function carregarLinhasNormalizadas(
  nome: string,
  maxLinhas: number = janelaDe(nome),
): { linhas: LinhaLicencaUnificada[]; meta: ArquivoNormalizadoRaw } {
  const dado = abrirJsonLicencas(nome) as (ArquivoNormalizadoRaw & ArquivoLicencasRaw) | null;
  if (!dado) return { linhas: [], meta: {} };
  try {
    const todas = (dado.linhas ?? []).map((l) => normalizarLinhaOnda2(l));
    return {
      linhas: todas.length > maxLinhas ? todas.slice(0, maxLinhas) : todas,
      meta: dado,
    };
  } catch {
    return { linhas: [], meta: {} };
  }
}

/** Linhas brutas de um arquivo da Onda 1 (o JSON pode vir em formato posicional). */
function linhasBrutas(fonte: ArquivoLicencasRaw): LinhaBruta[] {
  return (fonte as unknown as { linhas?: LinhaBruta[] }).linhas ?? [];
}

const ibama = carregarDataJson("ibama-licencas.json");
const ibamaAutos = carregarDataJson("ibama-autos-infracao.json");
const igam = carregarDataJson("igam-outorgas.json");
const semaMt = carregarDataJson("sema-mt-licencas.json");
const inemaBa = carregarDataJson("inema-ba-licencas.json");
const semaMa = carregarDataJson("sema-ma-licencas.json");
const semasPa = carregarDataJson("semas-pa-licencas.json");
const semadGo = carregarDataJson("semad-go-licencas.json");
const ana = carregarDataJson("ana-outorgas.json", 1000);

// --- Onda 2: arquivos já no formato LinhaLicencaUnificada com microresumo + tags.
// maxLinhas=300 por fonte → janela do cliente, não o acervo real (Rule 1 AGENTS.md).
const { linhas: linhasFepamRs, meta: metaFepamRs } = carregarLinhasNormalizadas("fepam-rs-licencas.json");
const { linhas: linhasSemarPi, meta: metaSemarPi } = carregarLinhasNormalizadas("semar-pi-licencas.json");
const { linhas: linhasImasulMs, meta: metaImasulMs } = carregarLinhasNormalizadas("imasul-ms-licencas.json");
const { linhas: linhasIemaEs, meta: metaIemaEs } = carregarLinhasNormalizadas("iema-es-licencas.json");
const { linhas: linhasSedamRo, meta: metaSedamRo } = carregarLinhasNormalizadas("sedam-ro-licencas.json");
const { linhas: linhasIbramDf, meta: metaIbramDf } = carregarLinhasNormalizadas("ibram-df-licencas.json");
const { linhas: linhasCetesbSp, meta: metaCetesbSp } = carregarLinhasNormalizadas("cetesb-sp-licencas.json");
const { linhas: linhasIatPr, meta: metaIatPr } = carregarLinhasNormalizadas("iat-pr-licencas.json");
const { linhas: linhasImaSc, meta: metaImaSc } = carregarLinhasNormalizadas("ima-sc-licencas.json");

/**
 * ---------------------------------------------------------------------------
 * 3. LEITORES DE TEXTO E DATA — uma casa para cada regra de formatação.
 * ---------------------------------------------------------------------------
 */

function texto(valor: string | number | boolean | null | undefined): string | null {
  if (valor === null || valor === undefined || valor === "" || valor === "xxxxx") return null;
  return String(valor);
}

/** dd/mm/yyyy → yyyy-mm-dd; ISO já válido passa; ruído vira null. */
function dataIso(data: string | null): string | null {
  if (!data) return null;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data.trim());
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(data.trim()) ? data.trim() : null;
}

function anoDe(data: string | null): number | null {
  const iso = dataIso(data);
  if (!iso) return null;
  return Number(iso.slice(0, 4));
}

function primeiraPalavra(valor: string | null, padrao: string): string {
  if (!valor) return padrao;
  return valor.replace(/[^\w ]/g, " ").trim().split(/\s+/)[0] || padrao;
}

/** Primeiro campo da lista com texto aproveitável; nenhum → null. */
function primeiroTexto(linha: LinhaBruta, campos: string[]): string | null {
  for (const campo of campos) {
    const valor = texto(linha[campo]);
    if (valor !== null) return valor;
  }
  return null;
}

/**
 * ---------------------------------------------------------------------------
 * 4. CLASSIFICADORES — porte, valor e tamanho derivados do texto da fonte.
 * ---------------------------------------------------------------------------
 */

/** Extrai ou infere o porte do empreendimento a partir de classe, PAC, tipo ou texto. */
export function inferirPorte(
  clas?: string | null,
  pac?: string | null,
  tipo?: string | null,
  microresumo?: string | null,
  tags?: string[]
): string {
  if (pac === "1" || pac === "SIM" || /pac/i.test(pac ?? "")) return "Excepcional / PAC";

  const textoComb = `${clas ?? ""} ${tipo ?? ""} ${microresumo ?? ""} ${(tags ?? []).join(" ")}`.toLowerCase();

  if (/classe\s*[56]|grande\s*porte|excepcional|mega|miner|petr[oó]leo|siderurg|rodovia|ferrovia|porto|barragem|aeroporto|hidrel[eé]trica/i.test(textoComb)) {
    return "Grande Porte";
  }
  if (/classe\s*[34]|m[eé]dio\s*porte|loteamento|posto\s*de\s*combust|frigor[ií]fico|ind[uú]stria|usina|irrig/i.test(textoComb)) {
    return "Médio Porte";
  }
  if (/classe\s*[12]|pequeno\s*porte|simplificad|las|dlae/i.test(textoComb)) {
    return "Pequeno Porte";
  }
  if (/dispensa|inclus[aã]o.*ve[ií]culo|transporte|micro/i.test(textoComb)) {
    return "Micro / Dispensado";
  }
  return "Não classificado";
}

/** Extrai valor numérico monetário em R$ se presente no registro ou texto. */
export function extrairValor(
  valorDireto?: number | string | null,
  textoBusca?: string | null
): number | null {
  if (typeof valorDireto === "number" && !isNaN(valorDireto) && valorDireto > 0) {
    return valorDireto;
  }
  if (typeof valorDireto === "string") {
    let limpo = valorDireto.replace(/[^\d.,]/g, "").trim();
    if (limpo.includes(",") && limpo.includes(".")) {
      limpo = limpo.replace(/\./g, "").replace(",", ".");
    } else if (limpo.includes(",")) {
      limpo = limpo.replace(",", ".");
    }
    const num = parseFloat(limpo);
    if (!isNaN(num) && num > 0) return num;
  }
  if (textoBusca) {
    const m = /R\$\s*([\d.]+,\d{2}|\d+[\.,]\d+|\d+)/i.exec(textoBusca);
    if (m) {
      const limpo = m[1].replace(/\./g, "").replace(",", ".");
      const v = parseFloat(limpo);
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return null;
}

/** Extrai detalhes de tamanho (área, vazão, classe, etc.). */
export function extrairTamanho(
  clas?: string | null,
  parametros?: string | null,
  tipo?: string | null,
  microresumo?: string | null
): string | null {
  if (parametros && parametros.trim() && parametros.trim() !== "—") return parametros.trim();
  if (clas && /classe/i.test(clas)) return clas.trim();

  const m = /(\d+(?:[.,]\d+)?\s*(?:ha|m[²2]|m[³3]\/h|m[³3]\/dia|l\/s|cab|km|MW))/i.exec(`${tipo ?? ""} ${microresumo ?? ""}`);
  if (m) return m[1];
  return null;
}

/**
 * ---------------------------------------------------------------------------
 * 5. MONTAGEM DAS LINHAS UNIFICADAS.
 * ---------------------------------------------------------------------------
 */

/**
 * Converte um bloco bruto em linhas unificadas: acrescenta o órgão, a
 * categoria de origem, o ano (derivado da data) e o link oficial quando o
 * coletor não trouxe um.
 *
 * @param orgao nome do órgão que aparece em cada linha resultante
 * @param categoria categoria de origem (o coletor pode reclassificar depois)
 * @param extrair converte uma linha bruta nos campos que variam por fonte
 * @param linhas linhas brutas lidas do JSON
 * @returns linhas no formato `LinhaLicencaUnificada`
 */
function unificar(
  orgao: string,
  categoria: LinhaLicencaUnificada["categoria"],
  extrair: (linha: LinhaBruta) => ExtracaoLinha,
  linhas: LinhaBruta[],
): LinhaLicencaUnificada[] {
  return linhas.map((linha) => {
    const extra = extrair(linha);
    return {
      orgao,
      categoria,
      ...extra,
      ano: anoDe(extra.data_inicio ?? extra.data_fim),
      link_oficial: extra.link_oficial ?? construirLinkOficial(orgao, extra.processo, categoria),
    };
  });
}

/**
 * Configuração de uma fonte estadual no FORMATO BRUTO PADRÃO da Onda 1:
 * as mesmas colunas (processo, tipo, empresa, municipio, situacao, data,
 * atividade/resumo, fonte_url) e a mesma forma de montar a linha.
 *
 * Por que existe: BA, MA, PA e GO repetiam o MESMO bloco de ~20 linhas,
 * mudando só estes eixos — repetição de regra, não de gosto. Um estado novo
 * nesse formato entra aqui, sem função nova.
 */
interface FonteEstadualSimples {
  /** nome do órgão que aparece em cada linha unificada */
  orgao: string;
  /** UF da fonte (fixa na regra; a coluna `uf` do JSON não muda o resultado) */
  uf: string;
  /** categoria dada no arquivo; a reclassificação (se houver) roda depois */
  categoria: LinhaLicencaUnificada["categoria"];
  /** tags que orientam a inferência de porte */
  tags: string[];
  /** colunas do tipo do ato, em ordem de preferência (PA traz `tipo_texto`) */
  camposTipo: string[];
  /** texto padrão quando o JSON não traz tipo */
  tipoPadrao: string;
  /** coluna do texto livre usado em porte, tamanho e valor (resumo/atividade) */
  campoTexto: string;
  /** coluna de data e em qual campo ela entra: publicação vira início ou fim */
  campoData: string;
  ladoData: "inicio" | "fim";
  /** coluna da URL canônica da fonte (vence o link montado pelo órgão) */
  campoUrl: string;
  /** extrai valor monetário do texto? (só BA e MA publicam valor no resumo) */
  extraiValor: boolean;
  /** corrige a categoria pelo tipo do ato, depois da unificação (PA) */
  reclassifica?: (linha: LinhaLicencaUnificada) => LinhaLicencaUnificada["categoria"] | null;
}

/**
 * Unifica uma fonte estadual descrita por `FonteEstadualSimples`.
 *
 * @param cfg configuração declarativa da fonte (colunas, UF, regras)
 * @param linhas linhas brutas lidas do JSON
 * @returns linhas unificadas, com a categoria reclassificada se houver regra
 */
function unificarFonteSimples(
  cfg: FonteEstadualSimples,
  linhas: LinhaBruta[],
): LinhaLicencaUnificada[] {
  const unificadas = unificar(
    cfg.orgao,
    cfg.categoria,
    (linha) => {
      const tipo = primeiroTexto(linha, cfg.camposTipo) ?? cfg.tipoPadrao;
      const textoLivre = texto(linha[cfg.campoTexto]);
      const proc = texto(linha.processo) ?? "s/n";
      const data = dataIso(texto(linha[cfg.campoData]));
      const extra: ExtracaoLinha = {
        uf: cfg.uf,
        data_inicio: cfg.ladoData === "inicio" ? data : null,
        data_fim: cfg.ladoData === "fim" ? data : null,
        tipo,
        empresa: texto(linha.empresa),
        municipio: texto(linha.municipio),
        bacia: null,
        situacao: texto(linha.situacao),
        processo: proc,
        porte: inferirPorte(null, null, tipo, textoLivre, cfg.tags),
        tamanho_detalhe: extrairTamanho(null, null, tipo, textoLivre),
        // O campo só existe quando a fonte manda extrair: gravar `undefined`
        // mudaria a forma do objeto publicado (PA e GO não têm valor).
        ...(cfg.extraiValor ? { valor_investimento: extrairValor(null, textoLivre) } : {}),
        link_oficial: construirLinkOficial(cfg.orgao, proc, cfg.categoria, texto(linha[cfg.campoUrl])),
      };
      return extra;
    },
    linhas,
  );

  const reclassifica = cfg.reclassifica;
  if (!reclassifica) return unificadas;
  return unificadas.map((linha) => {
    const categoria = reclassifica(linha);
    return categoria ? { ...linha, categoria } : linha;
  });
}

const linhasIbama: LinhaLicencaUnificada[] = unificar("IBAMA", "licenca", (linha) => {
  const tipo = texto(linha.tipol) ?? "Licença";
  const pac = texto(linha.pac);
  return {
    uf: null,
    data_inicio: dataIso(texto(linha.dt_emi)),
    data_fim: dataIso(texto(linha.dt_ven)),
    tipo,
    empresa: texto(linha.emp),
    municipio: null,
    bacia: null,
    situacao: "Emitida pelo IBAMA",
    processo: texto(linha.proc) ?? texto(linha.lic) ?? "s/n",
    porte: inferirPorte(null, pac, tipo, null, ["ibama"]),
    tamanho_detalhe: pac === "SIM" || pac === "1" ? "PAC — Programa de Aceleração do Crescimento" : null,
  };
}, linhasBrutas(ibama));

const linhasAna: LinhaLicencaUnificada[] = unificar("ANA", "outorga", (linha) => {
  const uso = texto(linha.uso) ?? "Uso";
  const tipoOutorga = texto(linha.tipo_outorga) ?? "Outorga";
  const tipoTexto = `${tipoOutorga} — ${uso}`;
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_ini)),
    data_fim: dataIso(texto(linha.dt_fim)),
    tipo: tipoTexto,
    empresa: texto(linha.titular) ?? texto(linha.emp),
    municipio: texto(linha.mun),
    bacia: texto(linha.bacia)?.replace(/^Região hidrográfica do\s+/i, "") ?? null,
    situacao: texto(linha.valida) === "1" ? "Vigente" : null,
    processo: texto(linha.proc) ?? "s/n",
    porte: inferirPorte(null, null, tipoTexto, uso, ["ana", "outorga"]),
    tamanho_detalhe: `Captação: ${uso}`,
  };
}, linhasBrutas(ana));

function normalizarBaciaIgam(urga: string | null): string | null {
  if (!urga) return null;
  const u = urga.toUpperCase();
  if (u.includes("SM") || u.includes("MUCURI") || u.includes("MATEUS")) return "Rio Mucuri / São Mateus";
  if (u.includes("DOCE")) return "Rio Doce";
  if (u.includes("GRANDE")) return "Rio Grande";
  if (u.includes("PARANAÍBA") || u.includes("PARANAIBA")) return "Rio Paranaíba";
  if (u.includes("PARAÍBA") || u.includes("PARAIBA")) return "Rio Paraíba do Sul";
  if (u.includes("JEQUITINHONHA") || u.includes("PARDO")) return "Rio Jequitinhonha";
  if (u.includes("SF") || u.includes("CENTRAL") || u.includes("VELHAS") || u.includes("PARAOPEBA") || u.includes("FRANCISCO")) return "Rio São Francisco";
  return urga;
}

const igamRaw = igam as unknown as { colunas?: string[]; linhas?: (LinhaBruta | (string | number | null)[])[] };
const linhasIgamBrutas: LinhaBruta[] = (igamRaw.linhas ?? []).map((l) => {
  if (Array.isArray(l) && igamRaw.colunas) {
    const obj: LinhaBruta = {};
    igamRaw.colunas.forEach((col, idx) => {
      obj[col] = l[idx] ?? null;
    });
    return obj;
  }
  return l as LinhaBruta;
});

const linhasIgam: LinhaLicencaUnificada[] = unificar("IGAM (MG)", "outorga", (linha) => {
  const tipoUso = texto(linha.tipo_uso) ?? "Uso";
  const tipoTexto = `Outorga — ${primeiraPalavra(tipoUso, "uso")}`;
  return {
    uf: "MG",
    data_inicio: null,
    data_fim: dataIso(texto(linha.data_publicacao)),
    tipo: tipoTexto,
    empresa: texto(linha.empreendimento),
    municipio: null,
    bacia: normalizarBaciaIgam(texto(linha.regional)),
    situacao: texto(linha.situacao),
    processo: texto(linha.portaria) ?? "s/n",
    porte: inferirPorte(null, null, tipoTexto, tipoUso, ["igam", "mg"]),
    tamanho_detalhe: `Uso: ${tipoUso}`,
  };
}, linhasIgamBrutas);

const linhasMt: LinhaLicencaUnificada[] = unificar("SEMA (MT)", "licenca", (linha) => {
  const clasp = texto(linha.clas) ?? "licenca";
  const tipo = texto(linha.documento) ?? texto(linha.tipo) ?? "Licença";
  const params = texto(linha.parametros);
  return {
    uf: texto(linha.uf) ?? "MT",
    data_inicio: dataIso(texto(linha.data_emissao)),
    data_fim: dataIso(texto(linha.data_validade)),
    tipo,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
    porte: inferirPorte(clasp, null, tipo, params, ["sema", "mt"]),
    tamanho_detalhe: extrairTamanho(clasp, params, tipo, null),
  };
}, linhasBrutas(semaMt)).map((linha) => ({
  ...linha,
  // Reclassificação do MT: quem manda é o TIPO do documento (infrac/embarg);
  // o `clas` é a classe do ato e não define a categoria.
  categoria: linha.tipo.toLowerCase().includes("infrac") ? ("auto_infracao" as const) : linha.tipo.toLowerCase().includes("embarg") ? ("embargo" as const) : linha.categoria,
}));

/** IBAMA autos de infração */
const linhasIbamaAutos: LinhaLicencaUnificada[] = unificar("IBAMA (autos)", "auto_infracao", (linha) => {
  const motivo = texto(linha.motivo) ?? "Infração ambiental";
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_auto)),
    data_fim: null,
    tipo: motivo,
    empresa: texto(linha.nom),
    municipio: texto(linha.mun),
    bacia: null,
    situacao: texto(linha.sit),
    processo: texto(linha.auto) ?? texto(linha.serie) ?? "s/n",
    porte: "Infração / Auto",
    valor_investimento: extrairValor(linha.val_auto as number | string | null, motivo),
  };
}, linhasBrutas(ibamaAutos));

// --- Os 4 estados com o mesmo formato bruto (BA, MA, PA, GO) saem da
//     configuração `FonteEstadualSimples`; as diferenças reais estão declaradas.

const linhasBa: LinhaLicencaUnificada[] = unificarFonteSimples(
  {
    orgao: "INEMA (BA)", uf: "BA", categoria: "licenca", tags: ["inema", "ba"],
    camposTipo: ["tipo"], tipoPadrao: "Licença", campoTexto: "resumo",
    campoData: "data_publicacao", ladoData: "inicio", campoUrl: "fonte_pagina",
    extraiValor: true,
    // O INEMA publica notificações e autos no mesmo arquivo: o tipo do ato é
    // o que separa auto de licença (categoria vem do dado, nunca do acervo).
    reclassifica: (linha) => (/notific|infrac|auto/i.test(linha.tipo) ? "auto_infracao" : null),
  },
  linhasBrutas(inemaBa),
);

const linhasMa: LinhaLicencaUnificada[] = unificarFonteSimples(
  {
    orgao: "SEMA (MA)", uf: "MA", categoria: "licenca", tags: ["sema", "ma"],
    camposTipo: ["tipo"], tipoPadrao: "Licença", campoTexto: "resumo",
    campoData: "data_publicacao", ladoData: "inicio", campoUrl: "fonte_url",
    extraiValor: true,
  },
  linhasBrutas(semaMa),
);

const linhasPa: LinhaLicencaUnificada[] = unificarFonteSimples(
  {
    orgao: "SEMAS (PA)", uf: "PA", categoria: "licenca", tags: ["semas", "pa"],
    camposTipo: ["tipo_texto", "tipo"], tipoPadrao: "licenca", campoTexto: "atividade",
    campoData: "data", ladoData: "fim", campoUrl: "fonte_url", extraiValor: false,
    reclassifica: (linha) =>
      /infrac|auto/i.test(linha.tipo) ? "auto_infracao" : /outorga/i.test(linha.tipo) ? "outorga" : null,
  },
  linhasBrutas(semasPa),
);

const linhasGo: LinhaLicencaUnificada[] = unificarFonteSimples(
  {
    orgao: "SEMAD (GO)", uf: "GO", categoria: "licenca", tags: ["semad", "go"],
    camposTipo: ["tipo"], tipoPadrao: "Licença", campoTexto: "atividade",
    campoData: "data", ladoData: "inicio", campoUrl: "fonte_url", extraiValor: false,
  },
  linhasBrutas(semadGo),
);

export const REGISTROS_LICENCAS: LinhaLicencaUnificada[] = [
  // Fontes nacionais
  ...linhasAna,
  ...linhasIbama,
  ...linhasIbamaAutos,
  // Onda 1 (estados — sample de 500 cada)
  ...linhasIgam,
  ...linhasMt,
  ...linhasBa,
  ...linhasMa,
  ...linhasPa,
  ...linhasGo,
  // Onda 2 (estados — sample de 300 cada, acervo real em LICENCAS_COBERTURA)
  ...linhasFepamRs,
  ...linhasSemarPi,
  ...linhasImasulMs,
  ...linhasIemaEs,
  ...linhasSedamRo,
  ...linhasIbramDf,
  ...linhasCetesbSp,
  ...linhasIatPr,
  ...linhasImaSc,
];

/**
 * ---------------------------------------------------------------------------
 * 6. COBERTURA — a lista única das 18 fontes (`FONTES`) alimenta total,
 * truncado e ressalvas. Antes eram três listas escritas à mão com os mesmos
 * 18 nomes; agora um estado novo entra UMA vez.
 * ---------------------------------------------------------------------------
 */

/** Uma fonte do feed e os metadados que ela entrega à cobertura. */
interface FonteColetada {
  /** nome do órgão — para leitura humana e para os testes */
  nome: string;
  /** metadados lidos no build: total real, truncado e ressalva_editorial */
  meta: ArquivoLicencasRaw | ArquivoNormalizadoRaw;
}

/**
 * A ORDEM DESTA LISTA É A ORDEM DAS RESSALVAS do cartão de cobertura — o
 * leitor lê na ordem em que a fonte foi coletada. Não reorganize sem querer.
 *
 * O IBAMA de licenças entra como as demais: o JSON de hoje não traz
 * `ressalva_editorial` (por isso ele não aparecia antes), mas se a coleta
 * publicar uma ressalva ela passa a ser exibida — ressalva de fonte nunca é
 * descartada (§7 AGENTS.md).
 */
const FONTES: FonteColetada[] = [
  { nome: "IBAMA", meta: ibama },
  { nome: "ANA", meta: ana },
  { nome: "IBAMA (autos)", meta: ibamaAutos },
  { nome: "IGAM (MG)", meta: igam },
  { nome: "SEMA (MT)", meta: semaMt },
  { nome: "INEMA (BA)", meta: inemaBa },
  { nome: "SEMA (MA)", meta: semaMa },
  { nome: "SEMAS (PA)", meta: semasPa },
  { nome: "SEMAD (GO)", meta: semadGo },
  // Onda 2 (formato normalizado)
  { nome: "FEPAM (RS)", meta: metaFepamRs },
  { nome: "SEMAR (PI)", meta: metaSemarPi },
  { nome: "IMASUL (MS)", meta: metaImasulMs },
  { nome: "IEMA (ES)", meta: metaIemaEs },
  { nome: "SEDAM (RO)", meta: metaSedamRo },
  { nome: "IBRAM (DF)", meta: metaIbramDf },
  { nome: "CETESB (SP)", meta: metaCetesbSp },
  { nome: "IAT (PR)", meta: metaIatPr },
  { nome: "IMA (SC)", meta: metaImaSc },
];

function agrupar(forma: "orgao" | "uf" | "ano" | "categoria"): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const linha of REGISTROS_LICENCAS) {
    const chave = linha[forma];
    const k = chave === null || chave === undefined ? "—" : String(chave);
    contagem[k] = (contagem[k] ?? 0) + 1;
  }
  return contagem;
}

/** Acervo real (total do JSON — contagem da coleta, não da janela do cliente). */
function totalReal(meta: FonteColetada["meta"]): number {
  return meta.total ?? 0;
}

/** Soma os totais reais de todas as fontes para publicar no cartão de cobertura.
 *  ATENÇÃO: órgãos distintos não se somam numa linha só (AGENTS.md); o total
 *  aqui é só para "quanto foi coletado no total de atos/licenças". */
const TOTAL_ACERVO_REAL = FONTES.reduce((soma, fonte) => soma + totalReal(fonte.meta), 0);

export const LICENCAS_COBERTURA: CoberturaLicencas = {
  // NOTA: `total` é o acervo completo coletado; `REGISTROS_LICENCAS.length`
  // é a janela do cliente (subconjunto para não violar o limite de bundle).
  total: TOTAL_ACERVO_REAL || REGISTROS_LICENCAS.length,
  por_orgao: agrupar("orgao"),
  por_uf: agrupar("uf"),
  por_ano: agrupar("ano"),
  por_categoria: agrupar("categoria"),
  truncado: FONTES.some((fonte) => Boolean(fonte.meta.truncado)),
  gerado_em: new Date().toISOString().slice(0, 10),
  ressalvas: FONTES.map((fonte) => String(fonte.meta.ressalva_editorial ?? "")).filter(Boolean),
};
