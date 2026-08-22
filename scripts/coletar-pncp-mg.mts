/**
 * Coleta contratos e licitações do PNCP para os quatro órgãos ambientais do
 * Estado de Minas Gerais (SEMAD, FEAM, IEF, IGAM) — grava ARQUIVO, sem banco.
 *
 * ═══ POR QUE ESTE COLETOR EXISTE (B4) ═══
 *
 * `etl/betim/etl/pncp/{contratos,licitacoes,orgaos}.py` já sabem falar com o
 * PNCP, mas `contratos.py` e `licitacoes.py` gravam via `get_supabase_client()`
 * — e a Neon está em HTTP 402 até 2026-09-01. Este script NÃO conserta o
 * Python: é um coletor novo, em TypeScript, no molde de
 * `scripts/coletar-barragens-mpmg.mts`, que grava `etl/betim/dados/pncp-mg.json`
 * em vez de uma tabela. As rotas, parâmetros e armadilhas de paginação abaixo
 * vêm lidos do Python — não redescobertos.
 *
 * ═══ O RECORTE: 4 ÓRGÃOS AMBIENTAIS, NÃO OS 854 MUNICÍPIOS NEM O ESTADO INTEIRO ═══
 *
 * O PNCP cobre nacionalmente todo ente público (Lei 14.133/2021) — variar por
 * município exigiria 854 varreduras (uma por `codigoMunicipioIbge`), e nem
 * "todo órgão estadual de MG" tem lista pronta (descobri-la por força bruta
 * seria varrer Belo Horizonte em 13 modalidades × vários anos só para achar
 * QUEM são os órgãos, antes de coletar o que eles contrataram). Isso é
 * trabalho de outra rodada, declarado, não feito aqui.
 *
 * O recorte que cabe nesta rodada são os MESMOS quatro órgãos que
 * `scripts/coletar-convenios-ambientais-mg.mts` já usa para o financeiro do
 * SISEMA — SEMAD, FEAM, IEF, IGAM —, pela mesma razão registrada em
 * `docs/FONTES.md`: **o Governo de MG não está no Compras.gov.br**, então o
 * PNCP é a única fonte programática para o que esses quatro órgãos contratam.
 * Os CNPJs (matriz, Cidade Administrativa, Belo Horizonte) foram conferidos
 * via BrasilAPI (espelho da Receita Federal) em 2026-08-21:
 *
 *   SEMAD  00.957.404/0001-78
 *   FEAM   25.455.858/0001-71
 *   IEF    18.746.164/0001-28
 *   IGAM   17.387.481/0001-32   (⚠️ a filial 0003-02, em São João do Paraíso,
 *                                  aparece em buscas rasas — não é a matriz)
 *
 * ═══ CONTRATOS × LICITAÇÕES: DUAS ROTAS, DUAS FORMAS DE FILTRAR ═══
 *
 * `/v1/contratos` aceita `cnpjOrgao` — uma chamada por órgão por ano é barato
 * e paginável em blocos de até 50 (a API não documenta teto maior, e o Python
 * já usa 50). Isto é o que este coletor faz de forma COMPLETA: 2021 (início
 * do PNCP) até o ano corrente, para os 4 órgãos.
 *
 * `/v1/contratacoes/publicacao` (licitações) **ignora `cnpjOrgao` em
 * silêncio** — medido no Python (`etl/pncp/client.py`): mandar o parâmetro
 * devolve HTTP 200 com EXATAMENTE os mesmos registros que sem ele. O único
 * filtro que a rota respeita é `codigoMunicipioIbge` (onde o órgão está
 * SEDIADO) + `codigoModalidadeContratacao` (obrigatório, sem "todas"). Os
 * quatro órgãos estão sediados em Belo Horizonte (IBGE 3106200), que também
 * sedia a Prefeitura, órgãos federais e boa parte do resto do Estado — uma
 * varredura completa (13 modalidades × 6 anos) devolveria dezenas de milhares
 * de linhas só para filtrar 4 CNPJs no final, o mesmo custo que já derrubou
 * a varredura de São Paulo por 429 no Python.
 *
 * Por isso a coleta de licitações aqui é DECLARADAMENTE PARCIAL: só a
 * modalidade 6 (Pregão Eletrônico — a que concentra o volume, medido no
 * Python: 8.647 de ~18.680 registros de SP vieram dela) e só o ano corrente,
 * com um teto de páginas (`TETO_PAGINAS_LICITACOES`) que aborta a varredura
 * em vez de rodar sem fim. Cobrir as outras 12 modalidades e os anos
 * anteriores é featured trabalho futuro — o teto é da COLETA, não da fonte
 * (mesma frase já usada em `docs/FONTES.md` para o PNCP municipal).
 *
 * ═══ ARMADILHAS REAPROVEITADAS DO PYTHON (client.py) ═══
 *
 * - 429 sem `Retry-After`: pausa fixa e tenta de novo (o PNCP não manda o
 *   cabeçalho, medido).
 * - 5xx é TRANSITÓRIO sob carga — não aborta na primeira, espera e tenta de
 *   novo (500 medido ao vivo pelo Python numa modalidade de SP).
 * - Sequencial, nunca paralelo: 8 threads levaram 291 respostas 429 para 80
 *   chamadas bem-sucedidas no Python, e depois disso o IP tomou 429 até em
 *   requisição única por minutos.
 * - `numeroControlePNCP` pode se repetir entre páginas — dedupe por essa
 *   chave antes de agregar, nunca conta bruta de linhas.
 * - Link do contrato: `urlContrato`/`linkSistemaOrigem` vêm nulos em 100% dos
 *   contratos municipais medidos pelo Python; o link é DERIVADO do
 *   `numeroControlePNCP` (ver `linkDoContrato`).
 *
 * ═══ RAW × AGREGADO ═══
 *
 * Se o total de contratos (dedupe) passar de `TETO_LINHA_CRUA`, o JSON grava
 * só agregados (por órgão, por ano) e a linha crua fica de fora — anunciado no
 * campo `linhaCruaOmitida` do arquivo gravado, nunca em silêncio. Licitações
 * SEMPRE gravam agregado (por modalidade coletada, por órgão, por ano), porque
 * a varredura de origem já é uma amostra parcial da fonte.
 *
 * Uso:
 *   npx tsx scripts/coletar-pncp-mg.mts --seco   # mede, não grava
 *   npx tsx scripts/coletar-pncp-mg.mts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "etl/betim/dados/pncp-mg.json");
const BASE = "https://pncp.gov.br/api/consulta/v1";

const SO_MEDIR = process.argv.includes("--seco");

// UA honesto — o PNCP não exige UA de navegador (diferente de dados.mg.gov.br
// e barragens.mpmg.mp.br), mas identificar o projeto é a regra da casa.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";

interface OrgaoAmbiental {
  sigla: string;
  nome: string;
  cnpj: string;
}

const ORGAOS_AMBIENTAIS_MG: OrgaoAmbiental[] = [
  { sigla: "SEMAD", nome: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável", cnpj: "00957404000178" },
  { sigla: "FEAM", nome: "Fundação Estadual do Meio Ambiente", cnpj: "25455858000171" },
  { sigla: "IEF", nome: "Instituto Estadual de Florestas", cnpj: "18746164000128" },
  { sigla: "IGAM", nome: "Instituto Mineiro de Gestão das Águas", cnpj: "17387481000132" },
];

const ANO_INICIO_PNCP = 2021;
const ANO_ATUAL = new Date().getUTCFullYear();
const MUNICIPIO_IBGE_BH = "3106200";
const MODALIDADE_PREGAO_ELETRONICO = 6;
/** Trava de custo, não de fonte — ver cabeçalho. Cada página = até 50 linhas. */
const TETO_PAGINAS_LICITACOES = 200;
/** Acima disto o JSON grava só agregados (ver cabeçalho). */
const TETO_LINHA_CRUA = 2000;
const PAUSA_ENTRE_PAGINAS_MS = 700;

function pausa(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * GET com o mesmo comportamento de retry do `_get` em `client.py`: 429 sem
 * `Retry-After` vira pausa fixa; 5xx é tratado como transitório (espera antes
 * de estourar); 6 tentativas com backoff exponencial (3s, 6s, 12s, 24s, 48s,
 * 60s de teto — o Python usa `wait_exponential(multiplier=2, min=3, max=60)`).
 */
async function pncpGet(path: string, params: Record<string, string | number>): Promise<any> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${BASE}${path}?${qs}`;
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 204) return { data: [], totalPaginas: 0 };
      if (r.status === 429) {
        const retryAfter = r.headers.get("Retry-After");
        await pausa((retryAfter ? Number(retryAfter) : 10) * 1000);
        continue;
      }
      if (r.status >= 500) {
        // Mesma lógica do Python: espera ANTES de deixar a tentativa seguinte
        // pegar o servidor já recuperado, em vez de estourar na hora.
        await pausa(15_000);
        ultimoErro = new Error(`HTTP ${r.status} em ${path}`);
        continue;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${path}: ${await r.text().catch(() => "")}`);
      return r.json();
    } catch (e) {
      ultimoErro = e;
    }
    const backoffMs = Math.min(3000 * 2 ** (tentativa - 1), 60_000);
    if (tentativa < 6) await pausa(backoffMs);
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(`falha desconhecida em ${path}`);
}

interface ContratoBruto {
  numeroControlePNCP?: string;
  numeroControlePncpCompra?: string;
  numeroContrato?: string;
  anoContrato?: number;
  orgaoEntidade?: { cnpj?: string; razaoSocial?: string };
  unidadeOrgao?: { nomeUnidade?: string };
  tipoContrato?: { nome?: string } | string;
  objetoContrato?: string;
  niFornecedor?: string;
  nomeRazaoSocialFornecedor?: string;
  valorInicial?: number;
  valorGlobal?: number;
  dataAssinatura?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  urlContrato?: string;
  linkSistemaOrigem?: string;
}

async function* iterContratos(cnpjOrgao: string, dataInicial: string, dataFinal: string) {
  let pagina = 1;
  for (;;) {
    const payload = await pncpGet("/contratos", {
      cnpjOrgao,
      dataInicial,
      dataFinal,
      pagina,
      tamanhoPagina: 50,
    });
    const registros: ContratoBruto[] = payload?.data ?? [];
    if (registros.length === 0) break;
    yield* registros;
    if (pagina >= (payload?.totalPaginas ?? 0)) break;
    pagina++;
    await pausa(PAUSA_ENTRE_PAGINAS_MS);
  }
}

interface ContratacaoBruta {
  numeroControlePNCP?: string;
  orgaoEntidade?: { cnpj?: string; razaoSocial?: string; esferaId?: string };
  unidadeOrgao?: { nomeUnidade?: string };
  modalidadeId?: number;
  modalidadeNome?: string;
  objetoCompra?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  situacaoCompraNome?: string;
  dataPublicacaoPncp?: string;
}

/**
 * Varre licitações por MUNICÍPIO (não por CNPJ — ver cabeçalho) e devolve só
 * as que batem com um dos CNPJs alvo. Para com `paginasVarridas` quando o
 * teto de custo é atingido, para o chamador declarar cobertura parcial.
 */
async function varrerLicitacoesPorMunicipio(
  codigoMunicipioIbge: string,
  modalidade: number,
  dataInicial: string,
  dataFinal: string,
  cnpjsAlvo: Set<string>,
  tetoPaginas: number,
): Promise<{ achadas: ContratacaoBruta[]; paginasVarridas: number; tetoAtingido: boolean }> {
  const achadas: ContratacaoBruta[] = [];
  let pagina = 1;
  let tetoAtingido = false;
  for (;;) {
    if (pagina > tetoPaginas) {
      tetoAtingido = true;
      break;
    }
    const payload = await pncpGet("/contratacoes/publicacao", {
      dataInicial,
      dataFinal,
      codigoModalidadeContratacao: modalidade,
      codigoMunicipioIbge,
      pagina,
      tamanhoPagina: 50,
    });
    const registros: ContratacaoBruta[] = payload?.data ?? [];
    if (registros.length === 0) break;
    for (const reg of registros) {
      if (cnpjsAlvo.has((reg.orgaoEntidade?.cnpj ?? "").trim())) achadas.push(reg);
    }
    if (pagina >= (payload?.totalPaginas ?? 0)) break;
    pagina++;
    await pausa(PAUSA_ENTRE_PAGINAS_MS);
  }
  return { achadas, paginasVarridas: Math.min(pagina, tetoPaginas), tetoAtingido };
}

/**
 * Endereço público do contrato no PNCP, derivado do número de controle — ver
 * `link_do_contrato` em `etl/pncp/contratos.py`: os campos `urlContrato` e
 * `linkSistemaOrigem` da API vieram nulos em 100% dos contratos municipais
 * medidos pelo Python (1.268/1.268). Formato:
 *   18715391000196-2-000048/2025 → /app/contratos/18715391000196/2025/000048
 * Número fora do formato não vira link torto — vira link nenhum.
 */
function linkDoContrato(numeroControlePncp: string | undefined): string | null {
  if (!numeroControlePncp) return null;
  const m = /^(\d{14})-\d+-(\d+)\/(\d{4})$/.exec(numeroControlePncp.trim());
  if (!m) return null;
  const [, cnpj, sequencial, ano] = m;
  return `https://pncp.gov.br/app/contratos/${cnpj}/${ano}/${sequencial}`;
}

function nomeDoTipo(t: ContratoBruto["tipoContrato"]): string | null {
  if (!t) return null;
  return typeof t === "string" ? t : (t.nome ?? null);
}

interface ContratoPncpMg {
  numeroControlePncp: string;
  numeroContrato: string | null;
  ano: number | null;
  orgaoSigla: string;
  orgaoCnpj: string;
  unidade: string | null;
  tipo: string | null;
  objeto: string | null;
  fornecedorCnpjCpf: string | null;
  fornecedorNome: string | null;
  valorInicial: number | null;
  valorGlobal: number | null;
  dataAssinatura: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  link: string | null;
}

function mapContrato(raw: ContratoBruto, orgao: OrgaoAmbiental): ContratoPncpMg | null {
  const numeroControlePncp = raw.numeroControlePNCP ?? raw.numeroControlePncpCompra;
  if (!numeroControlePncp) return null;
  return {
    numeroControlePncp,
    numeroContrato: raw.numeroContrato ?? null,
    ano: raw.anoContrato ?? null,
    orgaoSigla: orgao.sigla,
    orgaoCnpj: orgao.cnpj,
    unidade: raw.unidadeOrgao?.nomeUnidade ?? null,
    tipo: nomeDoTipo(raw.tipoContrato),
    objeto: raw.objetoContrato ?? null,
    // niFornecedor pode ser CPF (pessoa física prestando serviço) — nunca
    // redigido aqui porque o PNCP já publica o documento inteiro como parte
    // pública do contrato (fornecedor de um contrato administrativo, não
    // "dado pessoal incidental" — ver a régua em docs/FONTES.md, que redige
    // CPF quando ele aparece incidentalmente num campo de outra natureza).
    fornecedorCnpjCpf: raw.niFornecedor ?? null,
    fornecedorNome: raw.nomeRazaoSocialFornecedor ?? null,
    valorInicial: raw.valorInicial ?? null,
    valorGlobal: raw.valorGlobal ?? null,
    dataAssinatura: raw.dataAssinatura ?? null,
    vigenciaInicio: raw.dataVigenciaInicio ?? null,
    vigenciaFim: raw.dataVigenciaFim ?? null,
    link: raw.urlContrato || raw.linkSistemaOrigem || linkDoContrato(numeroControlePncp),
  };
}

interface LicitacaoPncpMg {
  numeroControlePncp: string;
  orgaoSigla: string;
  orgaoCnpj: string;
  unidade: string | null;
  modalidadeId: number | null;
  modalidadeNome: string | null;
  objeto: string | null;
  valorEstimado: number | null;
  valorHomologado: number | null;
  situacao: string | null;
  dataPublicacaoPncp: string | null;
}

function mapLicitacao(raw: ContratacaoBruta, orgaoPorCnpj: Map<string, OrgaoAmbiental>): LicitacaoPncpMg | null {
  const cnpj = (raw.orgaoEntidade?.cnpj ?? "").trim();
  const orgao = orgaoPorCnpj.get(cnpj);
  if (!orgao || !raw.numeroControlePNCP) return null;
  return {
    numeroControlePncp: raw.numeroControlePNCP,
    orgaoSigla: orgao.sigla,
    orgaoCnpj: orgao.cnpj,
    unidade: raw.unidadeOrgao?.nomeUnidade ?? null,
    modalidadeId: raw.modalidadeId ?? null,
    modalidadeNome: raw.modalidadeNome ?? null,
    objeto: raw.objetoCompra ?? null,
    valorEstimado: raw.valorTotalEstimado ?? null,
    valorHomologado: raw.valorTotalHomologado ?? null,
    situacao: raw.situacaoCompraNome ?? null,
    dataPublicacaoPncp: raw.dataPublicacaoPncp ?? null,
  };
}

function agregarPorOrgaoEAno<T extends { orgaoSigla: string; ano?: number | null; valorGlobal?: number | null; valorHomologado?: number | null }>(
  linhas: T[],
  campoValor: "valorGlobal" | "valorHomologado",
  campoAno: "ano" | null,
) {
  const mapa = new Map<string, { orgao: string; ano: number | "sem-ano"; quantidade: number; valorTotal: number }>();
  for (const l of linhas) {
    const ano = campoAno ? ((l as any)[campoAno] ?? "sem-ano") : "sem-ano";
    const chave = `${l.orgaoSigla}::${ano}`;
    const atual = mapa.get(chave) ?? { orgao: l.orgaoSigla, ano, quantidade: 0, valorTotal: 0 };
    atual.quantidade += 1;
    atual.valorTotal += (l as any)[campoValor] ?? 0;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => (a.orgao === b.orgao ? String(a.ano).localeCompare(String(b.ano)) : a.orgao.localeCompare(b.orgao)));
}

async function main() {
  console.log(`[coletar-pncp-mg] ${ORGAOS_AMBIENTAIS_MG.length} órgãos · contratos ${ANO_INICIO_PNCP}-${ANO_ATUAL}`);

  // ── CONTRATOS: completo, 4 órgãos × todos os anos do PNCP ──────────────
  const contratosPorChave = new Map<string, ContratoPncpMg>();
  const anosIncompletos: string[] = [];
  for (const orgao of ORGAOS_AMBIENTAIS_MG) {
    for (let ano = ANO_INICIO_PNCP; ano <= ANO_ATUAL; ano++) {
      const dataInicial = `${ano}0101`;
      const dataFinal = `${ano}1231`;
      let doAno = 0;
      try {
        for await (const raw of iterContratos(orgao.cnpj, dataInicial, dataFinal)) {
          const c = mapContrato(raw, orgao);
          if (c) {
            contratosPorChave.set(c.numeroControlePncp, c);
            doAno++;
          }
        }
      } catch (e) {
        anosIncompletos.push(`${orgao.sigla}/${ano}`);
        console.error(`[coletar-pncp-mg] AVISO: ${orgao.sigla}/${ano} interrompido (${(e as Error).message}); segue.`);
        continue;
      }
      if (doAno > 0) console.log(`[coletar-pncp-mg] contratos ${orgao.sigla} ${ano}: ${doAno}`);
      await pausa(PAUSA_ENTRE_PAGINAS_MS);
    }
  }
  const contratos = [...contratosPorChave.values()].sort((a, b) => a.numeroControlePncp.localeCompare(b.numeroControlePncp));

  // ── LICITAÇÕES: parcial, declarado — ver cabeçalho ──────────────────────
  const cnpjsAlvo = new Set(ORGAOS_AMBIENTAIS_MG.map((o) => o.cnpj));
  const orgaoPorCnpj = new Map(ORGAOS_AMBIENTAIS_MG.map((o) => [o.cnpj, o]));
  const anoLicitacoes = ANO_ATUAL;
  let licitacoes: LicitacaoPncpMg[] = [];
  let licitacoesTetoAtingido = false;
  let licitacoesPaginasVarridas = 0;
  try {
    const { achadas, paginasVarridas, tetoAtingido } = await varrerLicitacoesPorMunicipio(
      MUNICIPIO_IBGE_BH,
      MODALIDADE_PREGAO_ELETRONICO,
      `${anoLicitacoes}0101`,
      `${anoLicitacoes}1231`,
      cnpjsAlvo,
      TETO_PAGINAS_LICITACOES,
    );
    licitacoesPaginasVarridas = paginasVarridas;
    licitacoesTetoAtingido = tetoAtingido;
    licitacoes = achadas.map((r) => mapLicitacao(r, orgaoPorCnpj)).filter((l): l is LicitacaoPncpMg => l !== null);
    console.log(`[coletar-pncp-mg] licitações (modalidade 6, BH, ${anoLicitacoes}): ${licitacoes.length} dos 4 órgãos, em ${paginasVarridas} páginas${tetoAtingido ? " (TETO ATINGIDO — parcial)" : ""}`);
  } catch (e) {
    console.error(`[coletar-pncp-mg] AVISO: varredura de licitações falhou (${(e as Error).message}); gravando só contratos.`);
  }

  // ── Medidas ──────────────────────────────────────────────────────────
  const datasAssinatura = contratos.map((c) => c.dataAssinatura).filter((d): d is string => !!d).sort();
  const valorTotalContratos = contratos.reduce((t, c) => t + (c.valorGlobal ?? 0), 0);
  const valorTotalLicitacoes = licitacoes.reduce((t, l) => t + (l.valorHomologado ?? l.valorEstimado ?? 0), 0);

  console.log(`[coletar-pncp-mg] TOTAL contratos: ${contratos.length} · R$ ${valorTotalContratos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`[coletar-pncp-mg] período contratos: ${datasAssinatura[0] ?? "—"} a ${datasAssinatura[datasAssinatura.length - 1] ?? "—"}`);
  console.log(`[coletar-pncp-mg] TOTAL licitações (parcial): ${licitacoes.length} · R$ ${valorTotalLicitacoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  if (anosIncompletos.length) console.log(`[coletar-pncp-mg] combinações incompletas (re-rodar completa): ${anosIncompletos.join(", ")}`);

  if (contratos.length === 0 && licitacoes.length === 0) {
    throw new Error(
      "0 contratos e 0 licitações para os 4 órgãos — provável falha da API (todas as combinações " +
        "ficaram incompletas), não ausência real de contratação. Abortando sem gravar " +
        "(coleta vazia não sobrescreve arquivo bom).",
    );
  }

  if (SO_MEDIR) {
    console.log("--seco: nada gravado.");
    return;
  }

  const linhaCruaOmitida = contratos.length > TETO_LINHA_CRUA;
  const contratosPorOrgaoEAno = agregarPorOrgaoEAno(contratos, "valorGlobal", "ano");
  const licitacoesPorOrgao = agregarPorOrgaoEAno(licitacoes, "valorHomologado", null);

  const saida = {
    coletadoEm: new Date().toISOString().slice(0, 10),
    coletaPendente: false,
    motivoPendencia: null,
    fonte: "https://pncp.gov.br/",
    via: "GET /api/consulta/v1/contratos (cnpjOrgao) + /api/consulta/v1/contratacoes/publicacao (codigoMunicipioIbge, filtrado por CNPJ)",
    escopo: {
      orgaos: ORGAOS_AMBIENTAIS_MG,
      contratos: `completo, ${ANO_INICIO_PNCP}–${ANO_ATUAL}, dedupe por numeroControlePNCP`,
      licitacoes: `PARCIAL: só modalidade 6 (Pregão Eletrônico), só ${anoLicitacoes}, varredura por Belo Horizonte (IBGE ${MUNICIPIO_IBGE_BH}) filtrada aos 4 CNPJs — a API não filtra licitação por órgão, só por município-sede (ver cabeçalho do coletor). Cobrir as outras 12 modalidades e os anos 2021–${anoLicitacoes - 1} é trabalho futuro, não feito nesta rodada.`,
    },
    contratosCombinacoesIncompletas: anosIncompletos,
    licitacoesPaginasVarridas,
    licitacoesTetoAtingido,
    contratos: {
      total: contratos.length,
      valorGlobalTotal: valorTotalContratos,
      periodoInicio: datasAssinatura[0] ?? null,
      periodoFim: datasAssinatura[datasAssinatura.length - 1] ?? null,
      linhaCruaOmitida,
      linhas: linhaCruaOmitida ? [] : contratos,
      porOrgaoEAno: contratosPorOrgaoEAno,
    },
    licitacoes: {
      total: licitacoes.length,
      valorHomologadoOuEstimadoTotal: valorTotalLicitacoes,
      // Licitações sempre gravam só agregado — a varredura de origem já é
      // amostra parcial (ver `escopo.licitacoes`), então a linha crua aqui
      // teria a mesma lacuna sem estar declarada linha a linha.
      porOrgao: licitacoesPorOrgao,
    },
  };

  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(saida, null, 1), "utf-8");
  console.log(`[coletar-pncp-mg] gravado: ${DESTINO}${linhaCruaOmitida ? " (linha crua de contratos OMITIDA — passou do teto)" : ""}`);
}

main().catch((e) => {
  console.error(`[coletar-pncp-mg] ABORT: ${(e as Error).message}`);
  process.exit(1);
});
