/**
 * Gera `apps/web/lib/judiciario/inspecoes-cnj.ts` — o catálogo dos relatórios
 * de inspeção da Corregedoria Nacional de Justiça e o extrato dos achados do
 * TJMG.
 *
 * Entradas (produzidas pelos coletores em Python):
 *   etl/betim/dados/cnj-inspecoes-catalogo.json   — 33 órgãos, 343 relatórios
 *   etl/betim/dados/cnj-inspecao-tjmg-2026.json   — achados do relatório 2026
 *
 * ═══ POR QUE O TEXTO INTEGRAL NÃO ENTRA ═══
 *
 * O relatório do TJMG de 2026 tem 2,9 milhões de caracteres. Publicá-lo
 * inteiro seria espelhar obra de terceiro — e este projeto decidiu o oposto:
 * **resumo próprio, com link para a origem.** Cada linha carrega um trecho de
 * até `TRECHO_MAX` caracteres e o link permanente do PDF no CNJ.
 *
 * ⚠️ E há uma razão a mais, medida: o CNJ publicou **6 CPFs de particulares**
 * dentro do relatório de 2026 (e o contrato do parser achou mais 11 numa
 * tabela de pessoal de 2017). Eles já saem redigidos na origem, no coletor —
 * mas espelhar o PDF reintroduziria o problema por outra porta.
 *
 * ⚠️ O link usado é o **permalink sem token**. A URL que o navegador mostra
 * traz `&token=…` que ROTACIONA: guardá-la é guardar link morto.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "apps/web/lib/judiciario/inspecoes-cnj.ts");
const TRECHO_MAX = 600;

interface RelatorioBruto {
  id: number;
  titulo: string;
  extensao: string;
  tamanhoBytes: number;
  publicadoEm: string;
  url: string;
}
interface OrgaoBruto {
  categoriaId: number;
  orgao: string;
  orgaoTitulo: string;
  relatorios: RelatorioBruto[];
}

function ler<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(RAIZ, rel), "utf8")) as T;
}

const catalogo = ler<{
  extraidoEm: string;
  faixaDeIdsVarrida: { de: number; ate: number };
  orgaos: OrgaoBruto[];
  totalOrgaos: number;
  totalRelatorios: number;
  totalBytes: number;
}>("etl/betim/dados/cnj-inspecoes-catalogo.json");

const tjmg2026 = ler<{
  relatorio: { titulo: string; processoCnj: string; portaria: string; assinadoEm: string; url: string };
  paginas: number;
  cpfsRedigidos: number;
  secoesNoSumario: number;
  secoesLidasNoCorpo: number;
  secoesVazias: number;
  secoesComConteudo: number;
  achados: {
    secao: string;
    tipoSecao: string;
    unidadeNumero: string | null;
    unidade: string | null;
    itens: { tipo: string | null; numero: number | null; texto: string }[];
  }[];
}>("etl/betim/dados/cnj-inspecao-tjmg-2026.json");

const cobrancas = ler<{
  totais: { comparativoComExtraido: Record<string, number> };
}>("etl/betim/dados/cnj-cobrancas-2012-2019-2026.json");

const pendencias = ler<{
  documentos: {
    ano: number;
    url: string;
    total: number;
    pendencias: {
      secao: string;
      unidade: string | null;
      texto: string;
      mencionaCumprida: number;
      mencionaNaoCumprida: number;
      mencionaReiterada: number;
    }[];
  }[];
}>("etl/betim/dados/cnj-pendencias-tjmg.json");

const serie = ler<{
  anosNaSerie: number[];
  anosForaDaSerie: { ano: number; arquivo: string; motivo: string }[];
  coberturaDaRubricaDeTemas: Record<string, { total: number; sem_tema: number; fracaoSemTema: number }>;
  documentos: {
    ano: number;
    estado: string;
    layout?: string;
    unidadesComItem?: number;
    itensTotais?: number;
    confiavelParaSerie?: boolean;
    itemVerificado?: boolean;
  }[];
}>("etl/betim/dados/cnj-serie-tjmg.json");

/** Mesma rubrica determinística do ETL (`etl/betim/etl/apis/cnj_temas.py`).
 *  Repetida aqui só para rotular a linha; a fonte de verdade é o Python. */
const TEMAS: [string, string, RegExp][] = [
  ["pessoa_presa", "Pessoa presa e execução penal", /cust[oó]dia|\bpres[oa]s?\b|pres[ií]dio|execu[çc][ãa]o penal|\bseeu\b|monitoramento eletr[ôo]nico|pris[õo]es|pris[ãa]o|controle nonagesimal/i],
  ["violencia_domestica", "Violência doméstica", /viol[êe]ncia dom[ée]stica|maria da penha|medida protetiva/i],
  ["infancia", "Infância e juventude", /inf[âa]ncia|juventude|adolescent|ato infracional|acolhiment/i],
  ["sistema", "Sistema processual e migração", /\bpje\b|\beproc\b|\bseeu\b|migra[çc][ãa]o|sistema eletr[ôo]nico|instabilidade do sistema/i],
  ["prazo_e_acervo", "Prazo, acervo e congestionamento", /congestionament|morosidade|represad|acervo|metas? nacion|paralisad|sobrestad|arquivo provis[óo]ri|pedido de vista|tempo m[ée]dio/i],
  ["pessoal", "Pessoal, lotação e estrutura", /lota[çc][ãa]o|quadro de servidor|d[ée]ficit de servidor|estagi[áa]ri|terceirizad|assessor/i],
  ["cartorio", "Gestão de cartório e secretaria", /cart[óo]rio|secretaria da vara|chefia de cart[óo]rio|central de processamento|\bcpe\b|secretaria unificada/i],
  ["extrajudicial", "Serventias extrajudiciais", /serventia|extrajudicial|delegat[áa]ri|notarial|tabelionato/i],
  ["estatistica", "Estatística e transparência do próprio tribunal", /estat[íi]stic|qliksense|dados? inconsistent|aus[êe]ncia de informa[çc][ãa]o/i],
  ["precatorio", "Precatórios", /precat[óo]ri|\brpv\b/i],
  ["conciliacao", "Conciliação e mediação", /concilia[çc][ãa]o|media[çc][ãa]o|cejusc|nupemec/i],
  ["colegiado", "Funcionamento do colegiado", /sess[õo]es h[íi]bridas|c[âa]mara c[íi]vel|c[âa]mara criminal|[óo]rg[ãa]o especial|sustenta[çc][ãa]o oral|turma recursal/i],
  ["pericia_e_apoio", "Perícia e órgãos de apoio fora do tribunal", /laudo(s)? pericia|per[íi]cia|insanidade mental|\biml\b|pol[íi]cia civil|pol[íi]cia penal|inqu[ée]rito policial/i],
];

function temasDe(texto: string): string[] {
  return TEMAS.filter(([, , re]) => re.test(texto)).map(([k]) => k);
}

/** Tipo de unidade pelo nome. Ordem importa: gabinete antes de vara, porque
 *  "GABINETE DO DESEMBARGADOR … DA 5ª CÂMARA" contém as duas pistas. */
function tipoDe(u: string): string {
  const t = u.toUpperCase();
  if (/GABINETE|DESEMBARGADOR/.test(t)) return "gabinete";
  if (/JUIZADO/.test(t)) return "juizado";
  if (/\bVARA\b|UNIDADE JURISDICIONAL/.test(t)) return "vara";
  if (/TURMA RECURSAL/.test(t)) return "turma";
  if (/SERVENTIA|TABELIONATO|REGISTRO DE IM[OÓ]VEIS/.test(t)) return "serventia";
  if (/PRESID[EÊ]NCIA|CORREGEDORIA|PRECAT[ÓO]RIO|DIRETORIA|NUPEMEC|EJEF/.test(t)) return "orgao-central";
  return "outra";
}

/** ⚠️ NUNCA usar "Belo Horizonte" como default — default de cidade reetiqueta
 *  dado. Sem comarca declarada no título, fica `null` e a tela mostra "—". */
function comarcaDe(u: string): string | null {
  const t = u.toUpperCase();
  const m = t.match(/COMARCA (?:DE|DO|DA) ([A-ZÁÉÍÓÚÂÊÔÃÕÇ' ]{3,40})/)
    || t.match(/MUNIC[IÍ]PIO DE ([A-ZÁÉÍÓÚÂÊÔÃÕÇ' ]{3,40})/);
  if (m) return m[1].trim().replace(/\/MG$/, "");
  if (/DE BELO HORIZONTE\b/.test(t)) return "BELO HORIZONTE";
  return null;
}

const linhas = tjmg2026.achados
  .map((a) => {
    const texto = a.itens.map((i) => i.texto).join(" ").replace(/\s+/g, " ").trim();
    return { a, texto };
  })
  .filter(({ texto }) => texto.length > 0)
  .map(({ a, texto }) => ({
    ano: 2026,
    secao: a.secao,
    unidade: a.unidade ?? "(não identificada)",
    tipo: tipoDe(a.unidade ?? ""),
    comarca: comarcaDe(a.unidade ?? ""),
    tipoSecao: a.tipoSecao,
    itens: a.itens.length,
    caracteres: texto.length,
    temas: temasDe(texto),
    trecho: texto.length > TRECHO_MAX ? texto.slice(0, TRECHO_MAX).trimEnd() + "…" : texto,
  }));

const porTema: Record<string, number> = {};
for (const l of linhas) for (const t of l.temas) porTema[t] = (porTema[t] ?? 0) + 1;

const porTipo: Record<string, { unidades: number; secoes: number; caracteres: number }> = {};
for (const l of linhas) {
  const d = (porTipo[l.tipo] ??= { unidades: 0, secoes: 0, caracteres: 0 });
  d.secoes += 1;
  d.caracteres += l.caracteres;
}
for (const tipo of Object.keys(porTipo)) {
  porTipo[tipo].unidades = new Set(
    linhas.filter((l) => l.tipo === tipo).map((l) => l.unidade),
  ).size;
}

/**
 * As seções "Pendências da última inspeção" — o CNJ conferindo a si mesmo.
 *
 * ⚠️ NÃO EXPOMOS VEREDITO AGREGADO ("N cumpridas, M não cumpridas"). A contagem
 * de palavras não serve: "cumprida" aparece dentro de "não cumprida", e um
 * número desses em tela seria estatística inventada por regex. O que a tela
 * mostra é o TEXTO, que é o que o CNJ efetivamente escreveu.
 */
const PENDENCIA_TRECHO_MAX = 900;

const linhasPendencia = pendencias.documentos.flatMap((d) =>
  d.pendencias
    .map((p) => ({
      ano: d.ano,
      secao: p.secao,
      unidade: p.unidade ?? "(não identificada)",
      caracteres: p.texto.length,
      trecho:
        p.texto.length > PENDENCIA_TRECHO_MAX
          ? p.texto.slice(0, PENDENCIA_TRECHO_MAX).trimEnd() + "…"
          : p.texto,
      url: d.url,
    }))
    .filter((p) => p.caracteres > 0),
);

/**
 * Os gabinetes de desembargador que o relatório NOMEIA, com o achado.
 *
 * ⚠️ NOMEAR AQUI É DECISÃO EDITORIAL TOMADA, não consequência automática de
 * ter o dado. A justificativa: são agentes públicos em função oficial, o fato
 * é de um relatório público do CNJ, e a alternativa — descrever o achado sem
 * dizer de quem é — protegeria o agente e não a pessoa cujo processo está
 * parado. O documento original está linkado em cada linha.
 *
 * ⚠️ O QUE NÃO SE FAZ: transformar isto em ranking de "pior desembargador". A
 * equipe de inspeção escolheu quais gabinetes visitar, e um gabinete com
 * achado registrado pode simplesmente ter sido olhado. A tela mostra a lista,
 * não uma classificação.
 *
 * ⚠️ E NÃO SE INVENTA NÚMERO. Só 6 dos 24 achados de gabinete trazem
 * distribuídos/baixados na mesma formulação; os demais dizem a mesma coisa com
 * outras palavras. Em vez de forçar um parser frágil que erraria calado, cada
 * linha carrega o TRECHO do próprio CNJ e o leitor lê o que está escrito.
 */
const RE_TITULAR = /^GABINETE\s+D[AO]\s+DESEMBARGADOR[A]?\.?\s+(.+)$/i;

const gabinetes = linhas
  .filter((l) => l.tipo === "gabinete")
  .map((l) => {
    const m = RE_TITULAR.exec(l.unidade.trim());
    return { ...l, titular: m ? m[1].trim().replace(/\s+/g, " ") : null };
  })
  // "GABINETES" sozinho é o título do capítulo, não uma pessoa.
  .filter((l) => l.titular && l.titular.length > 5)
  .sort((a, b) => (a.titular ?? "").localeCompare(b.titular ?? "", "pt-BR"));

const orgaos = catalogo.orgaos.map((o) => ({
  categoriaId: o.categoriaId,
  slug: o.orgao,
  titulo: o.orgaoTitulo,
  relatorios: o.relatorios.length,
  bytes: o.relatorios.reduce((s, r) => s + r.tamanhoBytes, 0),
  anos: [...new Set(o.relatorios.map((r) => (r.publicadoEm || "").slice(0, 4)).filter(Boolean))].sort(),
}));

/**
 * ⚠️ `created_time` DO CATÁLOGO É A DATA DE UPLOAD, NÃO A DA INSPEÇÃO.
 *
 * Medido: dez dos treze relatórios do TJMG têm `created_time` em **30/09/2019**
 * — inclusive o de 2012 e os de 2017. Foi o dia em que o CNJ carregou o acervo
 * antigo na biblioteca, não o dia em que a equipe entrou no tribunal. A
 * primeira versão desta página publicou "13 relatórios de 2019 a 2026", que é
 * falso e parecia perfeitamente plausível.
 *
 * O ano da inspeção vem do TÍTULO, que o CNJ escreve com o ano dentro
 * ("Relatório de Inspeção - TJMG 2023", "Inspeção 2012"). Quando o título não
 * tem ano, `anoInspecao` fica `null` e a tela mostra "—" — nunca cai para a
 * data de upload, que reetiquetaria o documento.
 */
function anoDoTitulo(titulo: string): number | null {
  const anos = [...titulo.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const plausiveis = anos.filter((a) => a >= 2000 && a <= 2030);
  return plausiveis.length ? Math.max(...plausiveis) : null;
}

const relatoriosTjmg = (catalogo.orgaos.find((o) => o.orgao.includes("minas-gerais"))?.relatorios ?? [])
  .map((r) => ({
    titulo: r.titulo,
    anoInspecao: anoDoTitulo(r.titulo),
    carregadoEm: r.publicadoEm.slice(0, 10),
    megabytes: Math.round((r.tamanhoBytes / 1e6) * 10) / 10,
    url: r.url,
  }))
  .sort((a, b) => (b.anoInspecao ?? 0) - (a.anoInspecao ?? 0));

const anosTjmg = relatoriosTjmg.map((r) => r.anoInspecao).filter((a): a is number => a !== null);

const ts = `/**
 * Relatórios de inspeção da Corregedoria Nacional de Justiça (CNJ).
 * ARQUIVO GERADO por \`scripts/gerar-inspecoes-cnj.mts\` — não editar à mão.
 *
 * ═══ O QUE ESTE CATÁLOGO É ═══
 *
 * A cada inspeção num tribunal, a Corregedoria Nacional publica um relatório
 * que descreve, unidade por unidade, o que a equipe encontrou — e cobra, na
 * inspeção seguinte, o que determinou na anterior. São ${catalogo.totalRelatorios} relatórios sobre
 * ${catalogo.totalOrgaos} órgãos, de 2008 a 2026.
 *
 * ⚠️ COBERTURA É PISO, NÃO TOTAL. Não existe rota de listagem de categorias no
 * CNJ (\`categories.getCategories\` responde HTTP 500), então o universo foi
 * descoberto varrendo ids de ${catalogo.faixaDeIdsVarrida.de} a ${catalogo.faixaDeIdsVarrida.ate}. E os ids **não são
 * contíguos**: o TJ de Roraima mora sozinho no id 2796, a 118 do bloco
 * alfabético dos demais. Pode haver órgão fora da faixa varrida.
 *
 * ⚠️ FORA DO ACERVO POR COMPETÊNCIA: não há inspeção da Corregedoria Nacional
 * sobre STJ, TST ou STF — o Regulamento Geral descreve inspeção sobre órgãos
 * de primeiro e segundo grau. Quem correiciona TRT é a Corregedoria-Geral da
 * Justiça do Trabalho, órgão do TST. Ver \`docs/judiciario/\`.
 *
 * ⚠️ O PDF ORIGINAL NÃO É ESPELHADO por este projeto. Cada linha traz trecho
 * de até ${TRECHO_MAX} caracteres e o link permanente para o CNJ.
 */

export interface OrgaoInspecionado {
  categoriaId: number;
  slug: string;
  titulo: string;
  relatorios: number;
  bytes: number;
  anos: string[];
}

export interface RelatorioTjmg {
  titulo: string;
  /** Ano da INSPEÇÃO, lido do título. \`null\` quando o título não traz ano —
   *  nunca preenchido com a data de upload, que é outra coisa. */
  anoInspecao: number | null;
  /** Data em que o CNJ carregou o arquivo na biblioteca. NÃO é a data da
   *  inspeção: dez dos treze relatórios do TJMG trazem 2019-09-30 aqui. */
  carregadoEm: string;
  megabytes: number;
  url: string;
}

export interface AchadoInspecao {
  ano: number;
  secao: string;
  unidade: string;
  /** vara | juizado | gabinete | turma | serventia | orgao-central | outra */
  tipo: string;
  /** \`null\` quando o título não declara — nunca preenchido por default. */
  comarca: string | null;
  /** achados | recomendacoes */
  tipoSecao: string;
  itens: number;
  caracteres: number;
  temas: string[];
  trecho: string;
}

export const TEMA_ROTULOS: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(TEMAS.map(([k, r]) => [k, r])), null, 2)};

export const COBERTURA_INSPECOES = {
  extraidoEm: ${JSON.stringify(catalogo.extraidoEm)},
  totalOrgaos: ${catalogo.totalOrgaos},
  totalRelatorios: ${catalogo.totalRelatorios},
  totalBytes: ${catalogo.totalBytes},
  faixaDeIdsVarrida: ${JSON.stringify(catalogo.faixaDeIdsVarrida)},
  tjmg: {
    relatorios: ${relatoriosTjmg.length},
    anoMaisAntigo: ${Math.min(...anosTjmg)},
    anoMaisRecente: ${Math.max(...anosTjmg)},
    secoesSemTextoLegivel: ${tjmg2026.secoesComConteudo - linhas.length},
    paginas2026: ${tjmg2026.paginas},
    processoCnj: ${JSON.stringify(tjmg2026.relatorio.processoCnj)},
    portaria: ${JSON.stringify(tjmg2026.relatorio.portaria)},
    assinadoEm: ${JSON.stringify(tjmg2026.relatorio.assinadoEm)},
    url: ${JSON.stringify(tjmg2026.relatorio.url)},
    secoesNoSumario: ${tjmg2026.secoesNoSumario},
    secoesLidasNoCorpo: ${tjmg2026.secoesLidasNoCorpo},
    secoesComConteudo: ${linhas.length},
    secoesSemAchado: ${tjmg2026.secoesVazias},
    unidadesDistintas: ${new Set(linhas.map((l) => l.unidade)).size},
  },
} as const;

export const ORGAOS_INSPECIONADOS: OrgaoInspecionado[] = ${JSON.stringify(orgaos, null, 1)};

export const RELATORIOS_TJMG: RelatorioTjmg[] = ${JSON.stringify(relatoriosTjmg, null, 1)};

export const ACHADOS_POR_TEMA: Record<string, number> = ${JSON.stringify(porTema, null, 1)};

export const ACHADOS_POR_TIPO_UNIDADE = ${JSON.stringify(porTipo, null, 1)} as const;

export const ACHADOS_TJMG: AchadoInspecao[] = ${JSON.stringify(linhas, null, 1)};

export interface PendenciaInspecao {
  ano: number;
  secao: string;
  unidade: string;
  caracteres: number;
  trecho: string;
  url: string;
}

/**
 * "Pendências da última inspeção": o que o CNJ tinha determinado antes e foi
 * cobrar de novo. Só 2022 e 2023 trazem seções assim nomeadas — os demais anos
 * cobram a inspeção anterior de outras formas, ainda não extraídas. A série é
 * de dois pontos, não de seis, e a tela diz isso.
 */
export const PENDENCIAS_TJMG: PendenciaInspecao[] = ${JSON.stringify(linhasPendencia, null, 1)};

/**
 * A série longitudinal: quantos itens o CNJ escreveu por ano.
 *
 * ⚠️ SÓ ENTRAM OS ANOS EM QUE A EXTRAÇÃO SE SUSTENTA. 2017 rende 2 unidades de
 * 25 entradas de sumário (layout sem marcador de item), e 2026 tem extrator
 * próprio. Publicar 2017 ao lado de 2023 desenharia uma "queda" que é defeito
 * do nosso parser, não do TJMG — e ninguém olhando o gráfico saberia.
 *
 * ⚠️ E os anos não são igualmente comparáveis nem entre os que entraram: a
 * rubrica de temas foi medida contra o vocabulário de 2026, e em 2012 ela
 * deixa 32% dos achados sem tema contra 5% em 2023. O semTema existe
 * para a tela poder dizer isso.
 */
export const SERIE_TJMG = ${JSON.stringify(
  serie.documentos
    .filter((d) => d.confiavelParaSerie)
    .map((d) => ({
      ano: d.ano,
      layout: d.layout,
      unidades: d.unidadesComItem,
      itens: d.itensTotais,
      itemVerificado: d.itemVerificado,
      semTema: serie.coberturaDaRubricaDeTemas[String(d.ano)]?.fracaoSemTema ?? null,
    }))
    .sort((a, b) => a.ano - b.ano), null, 1)} as const;

export const ANOS_FORA_DA_SERIE = ${JSON.stringify(serie.anosForaDaSerie, null, 1)} as const;

export interface GabineteNomeado {
  titular: string;
  secao: string;
  tipoSecao: string;
  temas: string[];
  trecho: string;
}

export const GABINETES_NOMEADOS: GabineteNomeado[] = ${JSON.stringify(
  gabinetes.map((g) => ({
    titular: g.titular as string,
    secao: g.secao,
    tipoSecao: g.tipoSecao,
    temas: g.temas,
    trecho: g.trecho,
  })), null, 1)};

/**
 * Quantas vezes, em cada inspeção, o CNJ voltou a cobrar o que já tinha
 * determinado antes.
 *
 * ⚠️ **2012 é ZERO por um motivo, não por falha.** Foi a primeira inspeção da
 * Corregedoria Nacional no TJMG: não havia inspeção anterior a cobrar. Um
 * gráfico que mostre 2012 = 0 ao lado de 2023 = 52 sem dizer isso sugere que o
 * tribunal piorou muito — quando o que mudou foi a existência de histórico.
 *
 * ⚠️ Os anos usam vocabulário diferente: 2022 e 2023 têm seções nomeadas
 * "Pendências da última inspeção"; 2019 e 2026 cobram sem esse nome (em 2026,
 * sob o título "Não cumprimento de determinações nas inspeções ano 2019, 2022
 * e 2023"). Os números não são medidos do mesmo jeito e a tela diz isso.
 */
export const COBRANCAS_POR_INSPECAO = ${JSON.stringify(
  Object.entries(cobrancas.totais.comparativoComExtraido)
    .map(([ano, n]) => ({ ano: Number(ano), cobrancas: n }))
    .sort((a, b) => a.ano - b.ano), null, 1)} as const;

export const PENDENCIAS_POR_ANO = ${JSON.stringify(
  Object.fromEntries(pendencias.documentos.map((d) => [d.ano, d.total])), null, 1)} as const;
`;

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(DESTINO, ts, "utf8");
console.log(
  `gerado: ${DESTINO}\n  órgãos: ${orgaos.length} | relatórios: ${catalogo.totalRelatorios}` +
  `\n  TJMG: ${relatoriosTjmg.length} relatórios, ${linhas.length} seções com achado, ` +
  `${new Set(linhas.map((l) => l.unidade)).size} unidades` +
  `\n  tamanho: ${(Buffer.byteLength(ts) / 1024).toFixed(0)} KiB`,
);
