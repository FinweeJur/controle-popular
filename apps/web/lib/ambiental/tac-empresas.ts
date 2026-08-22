/**
 * Totais por empresa dos TACs das mineradoras com o Estado de MG — valor
 * destinado ao Estado, valor destinado ao Ministério Público, e o total.
 * ARQUIVO GERADO — não editar à mão.
 *
 * Fonte: captura isolada da consulta `Empresas_valores Estado Consulta
 * Geral` (visual de totais por empresa) do "Painel TACs Final" (Power BI
 * público da SEMAD/MG), decodificada com `etl.apis._powerbi_dsr`. Diferente
 * de `tac-contas.ts`: aquele é a série Mineradora × Ano (120 linhas);
 * este é o TOTAL por empresa, sem a dimensão Ano — 17 linhas
 * para 15 empresas.
 *
 * ═══ POR QUE 17 LINHAS PARA 15 EMPRESAS ═══
 *
 * "Alcoa Alumínio S.A" aparece 3 vezes,
 * com valores DIFERENTES em cada ocorrência — não é linha duplicada (os três
 * valores não se repetem). A fonte não expõe id de instrumento nesta consulta
 * (só o nome da empresa), então não dá para afirmar se são TACs distintos ou
 * outra razão de negócio; o array preserva as 17 linhas como a
 * fonte devolveu, sem fundir. Se algum consumidor precisar de "uma linha por
 * empresa", precisa decidir como agregar — este módulo não decide por ele.
 *
 * ═══ ARMADILHA DE TIPO, FECHADA NA EXTRAÇÃO ═══
 *
 * O DSR manda número como STRING quando o double não faz round-trip limpo em
 * JSON (medido aqui em 10 das 51 células de valor). Todo
 * valor abaixo já foi normalizado para `number` — nenhum consumidor precisa
 * converter de novo. Trava de geração: `valorEstado + valorMp` fecha com
 * `valorTotal` em TODAS as 17 linhas (tolerância de R$ 0,50 por
 * arredondamento de ponto flutuante) — se um dia isso não fechar mais, é
 * sinal de coluna trocada, não de a fonte ter mudado a regra de negócio.
 *
 * ═══ DADO PESSOAL ═══
 *
 * Varredura por CPF (com e sem máscara) no campo `empresa`: zero
 * ocorrências. Os 15 valores únicos são todos razão
 * social de pessoa jurídica (Alcoa, ArcelorMittal, CSN, Gerdau, Samarco,
 * Vale…) — nada a redigir nesta captura.
 *
 * ═══ AS DUAS RESSALVAS QUE VIAJAM COM O DADO ═══
 *
 * Mesmo painel de `tac-contas.ts` e `tac-projetos.ts`: (1) `refreshEnabled:
 * false`, última carga 2026-05-05 — não é dado ao vivo; (2) publicado de uma
 * "My workspace" pessoal, não de workspace institucional.
 */

export interface LinhaTacEmpresa {
  empresa: string;
  /** Em reais. Parcela destinada ao Estado de MG. */
  valorEstado: number;
  /** Em reais. Parcela destinada ao Ministério Público. */
  valorMp: number;
  /** Em reais. `valorEstado + valorMp`, conferido na geração deste arquivo. */
  valorTotal: number;
}

/** 17 linhas — ver docstring sobre por que não é 1 por empresa. */
export const TAC_EMPRESAS: LinhaTacEmpresa[] = [{"empresa":"Alcoa Alumínio S.A","valorEstado":160000,"valorMp":40000,"valorTotal":200000},{"empresa":"Alcoa Alumínio S.A","valorEstado":1923682.8800000001,"valorMp":480920.72000000003,"valorTotal":2404603.6},{"empresa":"Alcoa Alumínio S.A","valorEstado":2083682.88,"valorMp":520920.72,"valorTotal":2604603.5999999996},{"empresa":"AMG Mineração","valorEstado":371917.60000000003,"valorMp":92979.40000000001,"valorTotal":464897},{"empresa":"ArcelorMittal Brasil S.A.","valorEstado":696377.3714285715,"valorMp":174094.34285714288,"valorTotal":870471.7142857143},{"empresa":"CSN Mineração","valorEstado":1673764.06,"valorMp":418441.015,"valorTotal":2092205.075},{"empresa":"Gerdau Açominas S.A.","valorEstado":1584746.8,"valorMp":396186.7,"valorTotal":1980933.5},{"empresa":"Herculano Mineração Ltda","valorEstado":1266784.8,"valorMp":316696.2,"valorTotal":1583481},{"empresa":"Itaminas Comércio de Minérios S/A","valorEstado":422448.80000000005,"valorMp":105612.20000000001,"valorTotal":528061},{"empresa":"Mineração Morro do Ipê","valorEstado":1710684,"valorMp":427671,"valorTotal":2138355},{"empresa":"Minérios Nacional S/A","valorEstado":1462931.3173333334,"valorMp":365732.82933333336,"valorTotal":1828664.1466666667},{"empresa":"Minerita - Minérios Itaúna Ltda.","valorEstado":796710.4,"valorMp":199177.6,"valorTotal":995888},{"empresa":"Mosaic Fertilizantes P&K Ltda.","valorEstado":1218503.3142857144,"valorMp":304625.8285714286,"valorTotal":1523129.142857143},{"empresa":"Nacional de Grafite Ltda.","valorEstado":194107.19999999998,"valorMp":48526.799999999996,"valorTotal":242633.99999999997},{"empresa":"Safm Mineração Ltda","valorEstado":203051.48200000002,"valorMp":50762.870500000005,"valorTotal":253814.3525},{"empresa":"Samarco Mineração S.A.","valorEstado":11627957.25,"valorMp":2906989.3125,"valorTotal":14534946.5625},{"empresa":"Vale S.A.","valorEstado":23675972.200000003,"valorMp":5918993.050000001,"valorTotal":29594965.250000004}];

export const COBERTURA_TAC_EMPRESAS = {
  linhas: 17,
  empresasUnicas: 15,
  valorEstadoTotal: 51073322.35504763,
  valorMpTotal: 12768330.588761907,
  valorTotalGeral: 63841652.943809524,
  dadoCongeladoEm: "2026-05-05",
  ressalvaCongelamento:
    "O painel declara refreshEnabled=false; o dado está congelado em 2026-05-05 e NÃO reflete a situação atual dos TACs.",
  workspaceDeOrigem: "My workspace",
  ressalvaWorkspace:
    "O relatório foi publicado de uma 'My workspace' pessoal, não de workspace institucional — depende de uma conta individual, sem governança de área.",
} as const;

/** Empresas com mais de uma linha nesta captura — ver docstring. */
export const TAC_EMPRESAS_REPETIDAS = [{"empresa":"Alcoa Alumínio S.A","ocorrencias":3}] as const;
