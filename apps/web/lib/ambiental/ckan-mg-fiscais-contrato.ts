import { carregarJsonEtl } from "@/lib/server-only/json-etl";
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

export function lerFiscaisContratoMg(): FiscalContratoMg[] {
  try {
    return carregarJsonEtl<FiscalContratoMg[]>("ckan-mg-fiscais-contrato.json");
  } catch {
    return [];
  }
}

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_FISCAIS_CONTRATO = {
  contratos: 16922,
  anoInicial: 2022,
  anoFinal: 2026,
  valorAtualTotal: 37482402887.11004,
  /** CPF de pessoa física no campo `cnpj_cpf` do fornecedor, confirmado por mod-11 e redigido. */
  cpfRedigidos: 615,
  /** Linhas com CPF achado DENTRO de campo de texto livre (fornecedor, objeto,
   *  fiscais ou gestores) — não do campo de documento. Redigido. */
  linhasComCpfEmTextoLivre: 257,
  /** Nem CNPJ válido nem CPF válido — inclui fornecedor estrangeiro sem CNPJ real. */
  documentosInvalidos: 15,
} as const;

export const FISCAIS_CONTRATO_POR_SITUACAO = [{"chave":"Vigente publicado","contratos":9866},{"chave":"Encerrado","contratos":3458},{"chave":"Vencido","contratos":3426},{"chave":"Rescindido","contratos":172}] as const;
export const FISCAIS_CONTRATO_POR_ANO = [{"ano":2022,"contratos":4122,"valorAtualTotal":7029914563.589996},{"ano":2023,"contratos":4248,"valorAtualTotal":8223266555.66999},{"ano":2024,"contratos":2696,"valorAtualTotal":2209609993.5800014},{"ano":2025,"contratos":3840,"valorAtualTotal":6863542006.519988},{"ano":2026,"contratos":2016,"valorAtualTotal":13156069767.749989}] as const;
