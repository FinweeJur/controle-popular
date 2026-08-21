import dados from "../../../../etl/betim/dados/ckan-mg-ipsemg.json";

/**
 * Contratos vigentes de prestadores de saúde credenciados ao IPSEMG (Instituto
 * de Previdência dos Servidores do Estado de Minas Gerais — assistência à
 * saúde dos servidores mineiros, não é o SUS). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=ipsemg` a partir do CKAN
 * do `dados.mg.gov.br`, dataset `contratos_vigentes`.
 *
 * ═══ `periodo_referencia` NÃO ESTÁ EM TODA LINHA ═══
 *
 * A primeira leitura deste campo (amostragem com split ingênuo por `;`, que
 * desalinha em linhas com `nome` contendo o separador) sugeria uma fotografia
 * datada por completo. Medido de novo em 21/08/2026 com parser que respeita
 * aspas: só 1774 de 6699 linhas trazem `periodo_referencia`
 * (sempre o mesmo valor, "2026-07-01", quando presente); as outras 4925
 * vêm vazias. `COBERTURA_CONTRATOS_VIGENTES_IPSEMG.referenciaEm` é esse valor
 * único — não confunda com "data de toda a base".
 *
 * ═══ CPF DENTRO DO CAMPO `nome`, NÃO SÓ NO CAMPO DE DOCUMENTO ═══
 *
 * 11 prestadores pessoa física colam o próprio CPF no NOME
 * (formato medido: `"<NOME> - 000.000.000-00"` e `"<NOME> CPF-00000000000"`)
 * mesmo tendo CNPJ próprio no campo certo — CADA UM redigido por
 * `redigirTextoLivre` antes de gravar (o valor real nunca aparece aqui nem em
 * nenhum outro comentário deste arquivo: escrever o CPF encontrado, mesmo
 * como exemplo, é o mesmo erro que `sem-cpf-no-repo.test.ts` documenta ter
 * acontecido em 12/08/2026 — o exemplo virou o vazamento). É por isso que
 * `coletar-ckan-mg.mts` varre o arquivo INTEIRO por CPF válido antes de
 * escrever (`conferirSemCpf`), não só os campos chamados "cpf" ou "cnpj".
 *
 * ═══ POR QUE 4.924 DE 6.699 NÃO TÊM CNPJ ═══
 *
 * A fonte simplesmente não preenche o campo `cpf_cnpj` na maioria das linhas
 * (medido em 21/08/2026: 4924 vazias). Dos 1775 que trazem
 * valor, TODOS são CNPJ (nenhum CPF de pessoa física) — mas a fonte grava o
 * número como um FLOAT, e a exportação derruba o zero à esquerda: valores com
 * 11 a 13 dígitos onde deveria haver 14. O coletor corrige com
 * `padStart(14, "0")` e só aceita se o resultado passar no dígito
 * verificador do CNPJ — nunca confia na contagem de dígitos sozinha (ver
 * armadilha 1 no topo de `coletar-ckan-mg.mts`).
 */

export interface ContratoIpsemgMg {
  regiaoAssistencial: string;
  microrregiao: string;
  municipio: string;
  ramoAtividade: string;
  numContrato: string;
  /** `null` quando a fonte não informa CNPJ do prestador. */
  cnpj: string | null;
  nome: string;
  inicioVigencia: string | null;
  fimVigencia: string | null;
}

/**
 * O array vive em `etl/betim/dados/ckan-mg-ipsemg.json`, nao inline neste arquivo.
 *
 * POR QUE: inline, este conjunto gerava `TS2590: union type too complex`
 * (o compilador desiste de inferir literal grande demais) e o arquivo
 * passava de 1 MB de codigo -- num repo cujo teto de Worker e 3 MiB
 * gzip para a rota INTEIRA. Pagina de servidor deve importar o
 * `COBERTURA_*`, nunca este array.
 */
export const CONTRATOS_VIGENTES_IPSEMG: ContratoIpsemgMg[] = dados as ContratoIpsemgMg[];
