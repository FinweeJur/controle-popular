/**
 * Gera as quatro camadas de dado das frentes de transparência da Justiça:
 *
 *   apps/web/lib/judiciario/presidios-cniep.ts   — inspeção em presídios
 *   apps/web/lib/judiciario/defensoria-mg.ts     — cobertura por comarca
 *   apps/web/lib/judiciario/justica-em-numeros.ts— série do TJMG
 *   apps/web/lib/judiciario/correicoes-trt3.ts   — atas do TRT-3
 *
 * ARQUIVOS GERADOS — não editar à mão. Entradas em `etl/betim/dados/`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = resolve(RAIZ, "apps/web/lib/judiciario");
/** Data de corte do recorte. Inspeção agendada para depois disto não conta
 *  como realizada — senão o portal diz que a unidade foi visitada antes de a
 *  visita acontecer. Medido: 1 registro com data futura no acervo. */
const HOJE = "2026-08-22";

function ler<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(RAIZ, rel), "utf8")) as T;
}
function gravar(nome: string, conteudo: string) {
  mkdirSync(LIB, { recursive: true });
  writeFileSync(resolve(LIB, nome), conteudo, "utf8");
  console.log(`  ${nome} — ${(Buffer.byteLength(conteudo) / 1024).toFixed(0)} KiB`);
}

// ══════════════════════════ 1. PRESÍDIOS (CNIEP) ══════════════════════════

interface Estabelecimento {
  seq_estabelecimento: number;
  dsc_identificacao: string;
  dsc_apelido: string | null;
  dsc_tribunal: string;
  dsc_endereco: string | null;
  naturezas: unknown[];
}
interface Inspecao {
  seq_estabelecimento: number;
  data_inicio: string | null;
  tema: string | null;
  tribunal: string | null;
}

const cniep = ler<{
  meta: Record<string, unknown>;
  estabelecimentos_mg: Estabelecimento[];
  inspecoes_mg: Inspecao[];
}>("etl/betim/dados/cniep-presidios-mg.json");

const realizadas = cniep.inspecoes_mg.filter(
  (i) => (i.data_inicio ?? "").slice(0, 10) <= HOJE,
);
const contagem = new Map<number, number>();
for (const i of realizadas) {
  contagem.set(i.seq_estabelecimento, (contagem.get(i.seq_estabelecimento) ?? 0) + 1);
}

/** Justiça comum × justiça militar. ⚠️ ESSA SEPARAÇÃO É O ACHADO, não um
 *  detalhe: no bolo, 56 de 285 estabelecimentos (20%) não receberam inspeção —
 *  número que sugere descaso generalizado. Separando, a justiça comum cobre
 *  213 de 217 (98%) e o buraco inteiro está na justiça militar. Publicar os
 *  20% sem separar seria acusar quem está inspecionando. */
function ramoDe(t: string): "comum" | "militar-estadual" | "militar-federal" {
  if (/Superior Tribunal Militar/i.test(t)) return "militar-federal";
  if (/Militar/i.test(t)) return "militar-estadual";
  return "comum";
}

const estabelecimentos = cniep.estabelecimentos_mg.map((e) => ({
  id: e.seq_estabelecimento,
  nome: (e.dsc_identificacao || e.dsc_apelido || "—").trim(),
  tribunal: e.dsc_tribunal,
  ramo: ramoDe(e.dsc_tribunal),
  natureza:
    (Array.isArray(e.naturezas) && typeof e.naturezas[0] === "string"
      ? (e.naturezas[0] as string)
      : null) ?? "—",
  inspecoes: contagem.get(e.seq_estabelecimento) ?? 0,
}));

const porRamo = ["comum", "militar-estadual", "militar-federal"].map((ramo) => {
  const sub = estabelecimentos.filter((e) => e.ramo === ramo);
  const sem = sub.filter((e) => e.inspecoes === 0);
  return {
    ramo,
    tribunal: sub[0]?.tribunal ?? "—",
    total: sub.length,
    semInspecao: sem.length,
    percentualSemInspecao: sub.length ? Math.round((sem.length / sub.length) * 100) : 0,
  };
});

const temas = Object.entries(
  realizadas.reduce<Record<string, number>>((acc, i) => {
    const t = (i.tema ?? "—").trim();
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {}),
).sort((a, b) => b[1] - a[1]);

const datas = realizadas.map((i) => (i.data_inicio ?? "").slice(0, 10)).filter(Boolean).sort();

gravar(
  "presidios-cniep.ts",
  `/**
 * Inspeções judiciais em estabelecimentos penais de Minas Gerais.
 * ARQUIVO GERADO por \`scripts/gerar-transparencia-justica.mts\`.
 *
 * Fonte: CNIEP / Geopresídios do CNJ — \`cniep.cnj.jus.br/api\`. JSON público,
 * sem login. ⚠️ **API não documentada**, descoberta por engenharia reversa do
 * \`config.js\` do front-end: bater nela alguns dias antes de depender dela.
 *
 * ═══ O QUE A SEPARAÇÃO POR RAMO EVITA ═══
 *
 * No bolo, ${estabelecimentos.filter((e) => e.inspecoes === 0).length} de ${estabelecimentos.length} estabelecimentos não receberam inspeção em 12 meses
 * — 20%, um número que sugere descaso generalizado. **Separando por quem
 * responde, a conta muda de dono:** a Justiça comum cobre ${porRamo[0].total - porRamo[0].semInspecao} de ${porRamo[0].total}, e o buraco
 * inteiro está na Justiça Militar. Publicar os 20% sem separar seria acusar
 * exatamente quem está inspecionando.
 *
 * ⚠️ **Unidade militar não é presídio.** São celas em batalhão, muitas vezes
 * vazias. Comparar uma delas com uma penitenciária de 1.500 pessoas em número
 * de inspeções é comparar coisas diferentes — a tela diz isso.
 */

export interface EstabelecimentoPenal {
  id: number;
  nome: string;
  tribunal: string;
  /** comum | militar-estadual | militar-federal */
  ramo: string;
  natureza: string;
  /** Inspeções com data de início até ${HOJE}. Agendada não conta. */
  inspecoes: number;
}

export const COBERTURA_CNIEP = {
  extraidoEm: ${JSON.stringify(HOJE)},
  fonte: "CNIEP / Geopresídios — Conselho Nacional de Justiça",
  url: "https://geopresidios.cnj.jus.br",
  estabelecimentos: ${estabelecimentos.length},
  inspecoes: ${realizadas.length},
  periodoDe: ${JSON.stringify(datas[0] ?? null)},
  periodoAte: ${JSON.stringify(datas[datas.length - 1] ?? null)},
  semInspecao: ${estabelecimentos.filter((e) => e.inspecoes === 0).length},
  avisoConteudo:
    "O portal mostra QUE houve inspeção e SOBRE QUAL TEMA. O relato do que o " +
    "juiz encontrou não é público por esta via: as rotas de conteúdo respondem " +
    "404. Ausência de achado aqui não significa que não houve achado.",
  avisoApi:
    "API não documentada pelo CNJ, descoberta no front-end. Pode mudar sem aviso.",
} as const;

export const PRESIDIOS_POR_RAMO = ${JSON.stringify(porRamo, null, 1)} as const;

export const TEMAS_INSPECAO: [string, number][] = ${JSON.stringify(temas, null, 1)};

export const ESTABELECIMENTOS_MG: EstabelecimentoPenal[] = ${JSON.stringify(estabelecimentos, null, 1)};
`,
);

// ══════════════════════════ 2. DEFENSORIA ═════════════════════════════════

interface Comarca {
  nomeComarca: string;
  populacaoEstimada2024: number | null;
  populacaoAte3SM2024: number | null;
  numeroMunicipiosNaComarca: number | null;
  atendidaDefensoria2025_pesquisaNacional: string | null;
  temUnidadeFisicaListadaHoje_dpmg: boolean;
  linkUnidadeDpmg: string | null;
  atendidaDefensoria2013_ipea: string | null;
  numeroDefensores2013_ipea: number | null;
}

const dp = ler<{ totais: Record<string, unknown>; comarcas: Comarca[]; fontes: unknown[] }>(
  "etl/betim/dados/defensoria-comarcas-mg.json",
);

const comarcas = dp.comarcas.map((c) => ({
  nome: c.nomeComarca,
  populacao: c.populacaoEstimada2024,
  populacaoAte3SM: c.populacaoAte3SM2024,
  municipios: c.numeroMunicipiosNaComarca,
  atendida2025: c.atendidaDefensoria2025_pesquisaNacional,
  temUnidadeHoje: c.temUnidadeFisicaListadaHoje_dpmg,
  link: c.linkUnidadeDpmg,
  atendida2013: c.atendidaDefensoria2013_ipea,
  defensores2013: c.numeroDefensores2013_ipea,
}));

const naoAtendidas = comarcas.filter((c) => c.atendida2025 === "NÃO");
const popDescoberta = naoAtendidas.reduce((s, c) => s + (c.populacao ?? 0), 0);

gravar(
  "defensoria-mg.ts",
  `/**
 * Cobertura da Defensoria Pública de Minas Gerais, comarca a comarca.
 * ARQUIVO GERADO por \`scripts/gerar-transparencia-justica.mts\`.
 *
 * ═══ O DENOMINADOR É O PRODUTO ═══
 *
 * A DPMG publica onde ELA está. Nunca publica onde ela **não** está. "128
 * unidades" parece cobertura boa; contra as ${comarcas.length} comarcas do estado, vira
 * déficit. Esta camada existe para juntar as duas pontas.
 *
 * ⚠️ **AS FONTES DIVERGEM, E AS DUAS FICAM.** A DPMG lista 129 unidades hoje
 * (128 comarcas mineiras + a sede em Brasília); a Pesquisa Nacional da
 * Defensoria 2025 marca ${comarcas.filter((c) => c.atendida2025 === "SIM").length} comarcas como atendidas. São recortes
 * diferentes — unidade física instalada contra comarca declarada atendida —,
 * e escolher um e calar esconderia a diferença.
 *
 * ⚠️ Duas armadilhas medidas na coleta: a planilha nacional só baixa com
 * headers de navegador (curl cru = HTTP 406), e o CSV do IPEA 2013 é **CP850**,
 * não ISO-8859-1 — decodificar errado produz texto ilegível em silêncio.
 */

export interface ComarcaDefensoria {
  nome: string;
  populacao: number | null;
  populacaoAte3SM: number | null;
  municipios: number | null;
  /** SIM | NÃO | PARCIALMENTE — Pesquisa Nacional da Defensoria 2025 */
  atendida2025: string | null;
  /** A DPMG lista unidade física nesta comarca hoje? */
  temUnidadeHoje: boolean;
  link: string | null;
  atendida2013: string | null;
  defensores2013: number | null;
}

export const COBERTURA_DEFENSORIA = {
  extraidoEm: "2026-08-22",
  comarcas: ${comarcas.length},
  atendidas2025: ${comarcas.filter((c) => c.atendida2025 === "SIM").length},
  naoAtendidas2025: ${naoAtendidas.length},
  parcialmente2025: ${comarcas.filter((c) => c.atendida2025 === "PARCIALMENTE").length},
  comUnidadeFisicaHoje: ${comarcas.filter((c) => c.temUnidadeHoje).length},
  comarcas2013: ${dp.totais["fonte4_comarcas_total_2013"] ?? null},
  atendidas2013: ${dp.totais["fonte4_comDefensoria_2013"] ?? null},
  populacaoEmComarcaNaoAtendida: ${popDescoberta},
} as const;

export const COMARCAS_MG: ComarcaDefensoria[] = ${JSON.stringify(comarcas, null, 1)};
`,
);

// ═══════════════════════ 3. JUSTIÇA EM NÚMEROS ════════════════════════════

const jn = ler<{
  url_pagina_indice: string;
  aviso_url_muda: string;
  serie_tjmg: Record<string, number | null>[];
  pergunta_tempo_medio_tramitacao_estadual: Record<string, unknown>;
}>("etl/betim/dados/justica-em-numeros-tjmg.json");

const serieJn = jn.serie_tjmg.map((a) => ({
  ano: a.ano as number,
  congestionamento: a.taxa_congestionamento_tc,
  pendentes: a.casos_pendentes_acervo_cp,
  casosNovosPorMagistrado: a.casos_novos_por_magistrado_cm,
  baixados: a.processos_baixados_total_tbaix,
  tempoAteBaixa: a.tempo_medio_ate_baixa_dias_tpbaixm,
}));

gravar(
  "justica-em-numeros.ts",
  `/**
 * Série do TJMG no Justiça em Números (CNJ), 2009–2025.
 * ARQUIVO GERADO por \`scripts/gerar-transparencia-justica.mts\`.
 *
 * ⚠️ **A URL DO ZIP MUDA A CADA PUBLICAÇÃO** (o nome traz a data). O coletor
 * raspa a página de índice para achar o link vigente; link fixo quebra na
 * próxima atualização, e quebra em silêncio.
 *
 * ⚠️ **CORREÇÃO REGISTRADA:** este projeto afirmou que tempo médio de
 * tramitação por tribunal estadual **não existia** em dado aberto. **Está
 * errado.** A variável é \`tpbaixm\`, populada de 2015 a 2025 para o TJMG. A
 * busca anterior falhou porque o dicionário a rotula apenas como
 * "TpBaix - Média", sem a palavra "tempo" nem "tramitação" — buscar por
 * palavra não a acha; só o padrão \`Tp*\` + sufixo.
 *
 * ⚠️ **E a unidade NÃO está declarada no dicionário.** O valor de 2025 (675,5)
 * é compatível com dias, mas isso é inferência. A tela diz "não confirmada".
 */

export interface AnoJusticaEmNumeros {
  ano: number;
  /** 0 a 1. Fração do acervo que ficou sem baixa no ano. */
  congestionamento: number | null;
  pendentes: number | null;
  casosNovosPorMagistrado: number | null;
  baixados: number | null;
  /** \`tpbaixm\`. Unidade NÃO declarada no dicionário do CNJ. */
  tempoAteBaixa: number | null;
}

export const JN_META = {
  fonte: "Justiça em Números — Conselho Nacional de Justiça",
  urlIndice: ${JSON.stringify(jn.url_pagina_indice)},
  extraidoEm: "2026-08-22",
  avisoUnidade:
    "O dicionário do CNJ rotula a variável apenas como “TpBaix - Média” e não " +
    "declara a unidade. O valor é compatível com dias corridos entre " +
    "distribuição e baixa, mas isso é inferência deste projeto, não do CNJ.",
  avisoCobertura:
    "O tempo médio só existe de 2015 em diante; de 2009 a 2014 a coluna vem vazia.",
} as const;

export const SERIE_JN_TJMG: AnoJusticaEmNumeros[] = ${JSON.stringify(serieJn, null, 1)};
`,
);

// ═══════════════════════════ 4. TRT-3 ═════════════════════════════════════

interface Ata {
  ano: string;
  periodo_correicao: string;
  data_assinatura_dj: string;
  ministro_corregedor_geral: string;
  url_pdf: string;
  bytes_medidos: number;
}

const trt3 = ler<{
  total_atas_encontradas: number;
  piso_ou_total: string;
  gestoes_sem_correicao_no_trt3: { ministro: string; periodo_gestao: string }[];
  vao_maior_entre_duas_correicoes: unknown;
  atas: Ata[];
}>("etl/betim/dados/trt3-atas.json");

const atas = trt3.atas
  .map((a) => ({
    ano: Number(a.ano),
    periodo: a.periodo_correicao,
    assinadaEm: a.data_assinatura_dj,
    corregedor: a.ministro_corregedor_geral,
    url: a.url_pdf,
    megabytes: Math.round((a.bytes_medidos / 1e6) * 10) / 10,
  }))
  .sort((a, b) => b.ano - a.ano);

const anos = atas.map((a) => a.ano).sort((a, b) => a - b);
const vaos = anos.slice(1).map((a, i) => ({ de: anos[i], ate: a, anos: a - anos[i] }));
const maiorVao = vaos.sort((a, b) => b.anos - a.anos)[0];

gravar(
  "correicoes-trt3.ts",
  `/**
 * Atas de correição ordinária no TRT da 3ª Região (Minas Gerais), 1991–2024.
 * ARQUIVO GERADO por \`scripts/gerar-transparencia-justica.mts\`.
 *
 * ⚠️ **QUEM CORREICIONA TRT NÃO É O CNJ.** É a Corregedoria-Geral da Justiça
 * do Trabalho, órgão do TST — e o documento chama-se **ata de correição**, não
 * relatório de inspeção. Por isso procurar no CNJ, ou no site do próprio
 * TRT-3, não acha: a fonte é o Liferay do TST.
 *
 * ⚠️ **NÃO SOMAR COM O ACERVO DO CNJ.** São gêneros distintos: o relatório do
 * CNJ traz achado por unidade; a ata da CGJT é outro documento, com outra
 * estrutura. Um número que junte os dois não significa nada.
 *
 * ⚠️ **É PISO, NÃO TOTAL.** Não há rota de enumeração: o acervo saiu de
 * raspagem de 19 páginas de gestão de Ministro Corregedor-Geral, e o TST pode
 * ter reformulado o histórico anterior a 1991 sem deixar sinal.
 */

export interface AtaCorreicao {
  ano: number;
  periodo: string;
  assinadaEm: string;
  corregedor: string;
  url: string;
  megabytes: number;
}

export const COBERTURA_TRT3 = {
  extraidoEm: "2026-08-22",
  orgaoQueLavra: "Corregedoria-Geral da Justiça do Trabalho (TST)",
  fonte: "https://www.tst.jus.br/web/corregedoria/correicoes-anteriores",
  atas: ${atas.length},
  anoMaisAntigo: ${anos[0]},
  anoMaisRecente: ${anos[anos.length - 1]},
  maiorVaoAnos: ${maiorVao?.anos ?? 0},
  maiorVaoDe: ${maiorVao?.de ?? 0},
  maiorVaoAte: ${maiorVao?.ate ?? 0},
  proximaCorreicao: "05 a 09/10/2026 (edital publicado, ata ainda não existe)",
  gestoesSemCorreicao: ${JSON.stringify(trt3.gestoes_sem_correicao_no_trt3, null, 1)},
} as const;

export const ATAS_TRT3: AtaCorreicao[] = ${JSON.stringify(atas, null, 1)};
`,
);

console.log("pronto.");
