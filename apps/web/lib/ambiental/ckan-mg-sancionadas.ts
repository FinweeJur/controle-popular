import dados from "../../../../etl/betim/dados/ckan-mg-sancionadas.json";

/**
 * Empresas sancionadas pela Lei Anticorrupção (Lei Federal 12.846/2013) no
 * âmbito do Estado de Minas Gerais. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=sancionadas` a partir do
 * CKAN do `dados.mg.gov.br`, dataset `empresas_sancionadas`, publicado pela
 * Controladoria-Geral do Estado (CGE). Um processo (SEI) pode listar mais de
 * uma empresa em linhas separadas — mesmo SEI, mesma portaria, empresas
 * diferentes.
 *
 * `valorMultaAplicada` vem `null` quando a fonte não traz valor — típico de
 * arquivamento (a acusação não resultou em multa), nunca tratar como zero.
 *
 * 1 CNPJ não passou no dígito verificador — fornecedor nacional
 * com número mal digitado na fonte (confirmado: não é formato de CPF, é CNPJ
 * de 14 dígitos com checksum errado). Fica `null`, sem inventar um valor.
 */

export interface EmpresaSancionadaMg {
  sei: string;
  numero: string;
  ano: number;
  numeroPortaria: string;
  dataPublicacaoPortaria: string | null;
  orgaoInstaurador: string;
  orgaoLesado: string;
  empresa: string;
  tipoSocietario: string;
  /** `null` quando o CNPJ não passa no dígito verificador. */
  cnpj: string | null;
  conduta: string;
  dataPublicacaoDecisao: string | null;
  decisao: string;
  fase: string;
  /** `null` quando a fonte não traz valor (típico de arquivamento). */
  valorMultaAplicada: number | null;
}

/**
 * O array vive em `etl/betim/dados/ckan-mg-sancionadas.json`, nao inline neste arquivo.
 *
 * POR QUE: inline, este conjunto gerava `TS2590: union type too complex`
 * (o compilador desiste de inferir literal grande demais) e o arquivo
 * passava de 1 MB de codigo -- num repo cujo teto de Worker e 3 MiB
 * gzip para a rota INTEIRA. Pagina de servidor deve importar o
 * `COBERTURA_*`, nunca este array.
 */
export const EMPRESAS_SANCIONADAS_MG: EmpresaSancionadaMg[] = dados as EmpresaSancionadaMg[];
