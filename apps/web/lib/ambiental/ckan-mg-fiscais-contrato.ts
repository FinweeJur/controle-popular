import dados from "../../../../etl/betim/dados/ckan-mg-fiscais-contrato.json";

/**
 * Fiscais e gestores de contratos administrativos do Poder Executivo de Minas
 * Gerais, 2022–2026. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=fiscais-contrato` a partir
 * do CKAN do `dados.mg.gov.br`, dataset `fiscais_contrato` — um CSV por ano,
 * mesmo layout. `fiscais` e `gestores` guardam nome de servidor público no
 * PAPEL OFICIAL de fiscalizar/gerir aquele contrato — não é redigido, é
 * exatamente o dado que a Lei de Acesso à Informação pede para existir.
 *
 * ═══ O QUE É REDIGIDO: CPF DO FORNECEDOR ═══
 *
 * `cnpj_cpf` mistura CNPJ de empresa com CPF de fornecedor pessoa física —
 * 615 valores válidos por mod-11 de CPF em 16922 contratos dos
 * cinco anos (medido em 21/08/2026; a sondagem original só tinha amostrado
 * 2026, que sozinho já tem 205 — os quatro anos anteriores também têm, de 38 a
 * 200 por ano). Redigido: o campo `cnpj` vem `null`. Achado à parte, mais
 * grave: 257 linhas têm CPF real dentro de um campo de TEXTO
 * LIVRE — não só `nome_fornecedor` (mesmo padrão de `contratos_vigentes.nome`),
 * mas também dentro de `objeto`, no corpo de um ato administrativo que cita o
 * CPF do servidor designado fiscal ("Fica designado o servidor... CPF
 * 000.000.000-00 para acompanhar..."). É a mesma classe de vazamento que
 * `docs/FONTES.md` registra para o Rouanet/SALIC ("CPF real já vazou em
 * ementa oficial") — aqui é ato administrativo, lá era ementa, o padrão é
 * igual. `fornecedor`, `objeto`, `fiscais` e `gestores` passam TODOS por
 * `redigirTextoLivre` antes de gravar, não só o campo com nome óbvio.
 *
 * ═══ ARMADILHAS DA FONTE (medidas em 21/08/2026, cobrem os cinco anos) ═══
 *
 * 1. **Mesmo campo, mais de um documento.** 14 contratos (dos ~21 mil) trazem
 *    `cnpj_cpf` com dois valores separados por vírgula, um por fornecedor —
 *    o coletor guarda só o primeiro CNPJ válido; nenhum CPF de nenhuma posição
 *    sobrevive.
 * 2. **Decimal sem padrão fixo, nem dentro do mesmo arquivo.** 2022 grava
 *    `valor_inicial` com PONTO e `valor_atual` com VÍRGULA nas MESMAS linhas;
 *    2023–2026 usam vírgula nos dois. `numeroBr` decide pelo conteúdo, não
 *    pelo ano.
 * 3. **`objeto` e outros campos de texto têm o SEPARADOR do CSV dentro do
 *    texto** — um split ingênuo por `;` desalinha a linha inteira sem lançar
 *    erro (é a mesma classe de armadilha que `dt_vigencia_inicial` mentindo em
 *    `convenios-mg.ts`: silenciosa, plausível, e só aparece com parser que
 *    respeita aspas).
 */

export interface FiscalContratoMg {
  ano: number;
  numeroProcesso: string;
  numeroContrato: string;
  situacao: string;
  tipo: string;
  dataPublicacao: string | null;
  inicioVigencia: string | null;
  fimVigencia: string | null;
  orgaoParticipante: string;
  /** `null` quando não há CNPJ válido (vazio, só CPF redigido, ou inválido). */
  cnpj: string | null;
  fornecedor: string;
  unidadeGestora: string;
  gestores: string;
  fiscais: string;
  objeto: string;
  valorInicial: number;
  valorAtual: number;
}

/**
 * O array vive em `etl/betim/dados/ckan-mg-fiscais-contrato.json`, nao inline neste arquivo.
 *
 * POR QUE: inline, este conjunto gerava `TS2590: union type too complex`
 * (o compilador desiste de inferir literal grande demais) e o arquivo
 * passava de 1 MB de codigo -- num repo cujo teto de Worker e 3 MiB
 * gzip para a rota INTEIRA. Pagina de servidor deve importar o
 * `COBERTURA_*`, nunca este array.
 */
export const FISCAIS_CONTRATO_MG: FiscalContratoMg[] = dados as FiscalContratoMg[];
