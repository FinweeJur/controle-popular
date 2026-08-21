import dados from "../../../../etl/betim/dados/ckan-mg-mariana.json";

/**
 * Empenhos do Acordo Judicial de Reparação do Vale do Rio Doce (rompimento da
 * barragem de Fundão, Samarco/Vale, em Mariana — 2015), na parte executada
 * pelo Governo de Minas Gerais. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=mariana` a partir do CKAN
 * do `dados.mg.gov.br`, dataset `portal_mariana` (nome herdado da cidade de
 * origem do desastre, não de Minas Gerais). O cabeçalho daquele script
 * documenta as três armadilhas que atravessam mais de um conjunto CKAN.
 *
 * ═══ POR QUE HÁ DOCUMENTOS REDIGIDOS ═══
 *
 * O campo `cnpj_cpf_credor` mistura CNPJ de empresa com CPF de pessoa física
 * — 37 valores válidos por mod-11 de CPF em 532 empenhos
 * (medido em 21/08/2026), alguns gravados com barra em vez de traço
 * (formato `000.000.000/00`, nunca o valor real). Todo CPF confirmado é redigido: o campo `documento` vem
 * `null`, mas `credor` (o nome) permanece — é a mesma régua usada em
 * `convenios-mg.ts` e `tac-gtac.ts` para dado de acordo público.
 *
 * ═══ POR QUE HÁ PROMETIDO AO LADO DE EMPENHADO ═══
 *
 * `iniciativa.csv` publica o valor de cada cláusula do acordo (coluna
 * `valor_da_iniciativa`) — o que foi PACTUADO. `RIO_DOCE_POR_INICIATIVA` cruza
 * isso com a soma dos empenhos de cada iniciativa — o que foi EXECUTADO. A
 * mesma lógica de `lib/paraopeba/execucao-fgv.ts`: total declarado pela fonte
 * ao lado da nossa soma, nunca só a nossa soma sozinha.
 */

export interface EmpenhoAcordoRioDoce {
  ano: number;
  codigoIniciativa: string;
  iniciativa: string;
  anexo: string;
  orgao: string;
  numEmpenho: string;
  dataEmpenho: string | null;
  elementoDespesa: string;
  fonteRecurso: string;
  credor: string;
  /** CNPJ do credor. `null` quando a fonte trazia CPF de pessoa física (redigido) ou o campo era inválido/vazio. */
  documento: string | null;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPagoFinanceiro: number;
}

/**
 * O array vive em `etl/betim/dados/ckan-mg-mariana.json`, nao inline neste arquivo.
 *
 * POR QUE: inline, este conjunto gerava `TS2590: union type too complex`
 * (o compilador desiste de inferir literal grande demais) e o arquivo
 * passava de 1 MB de codigo -- num repo cujo teto de Worker e 3 MiB
 * gzip para a rota INTEIRA. Pagina de servidor deve importar o
 * `COBERTURA_*`, nunca este array.
 */
export const EMPENHOS_ACORDO_RIO_DOCE: EmpenhoAcordoRioDoce[] = dados as EmpenhoAcordoRioDoce[];
