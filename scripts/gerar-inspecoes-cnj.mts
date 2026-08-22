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

const orgaos = catalogo.orgaos.map((o) => ({
  categoriaId: o.categoriaId,
  slug: o.orgao,
  titulo: o.orgaoTitulo,
  relatorios: o.relatorios.length,
  bytes: o.relatorios.reduce((s, r) => s + r.tamanhoBytes, 0),
  anos: [...new Set(o.relatorios.map((r) => (r.publicadoEm || "").slice(0, 4)).filter(Boolean))].sort(),
}));

const relatoriosTjmg = (catalogo.orgaos.find((o) => o.orgao.includes("minas-gerais"))?.relatorios ?? [])
  .map((r) => ({
    titulo: r.titulo,
    publicadoEm: r.publicadoEm.slice(0, 10),
    megabytes: Math.round((r.tamanhoBytes / 1e6) * 10) / 10,
    url: r.url,
  }))
  .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));

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
  publicadoEm: string;
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
`;

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(DESTINO, ts, "utf8");
console.log(
  `gerado: ${DESTINO}\n  órgãos: ${orgaos.length} | relatórios: ${catalogo.totalRelatorios}` +
  `\n  TJMG: ${relatoriosTjmg.length} relatórios, ${linhas.length} seções com achado, ` +
  `${new Set(linhas.map((l) => l.unidade)).size} unidades` +
  `\n  tamanho: ${(Buffer.byteLength(ts) / 1024).toFixed(0)} KiB`,
);
