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

export const CONTRATOS_VIGENTES_IPSEMG: ContratoIpsemgMg[] = dados as ContratoIpsemgMg[];

export const COBERTURA_CONTRATOS_VIGENTES_IPSEMG = {
  contratos: 6699,
  comCnpj: 1775,
  cnpjVazios: 4924,
  cnpjInvalidos: 0,
  /** `AAAA-MM-DD` — único valor não-vazio de `periodo_referencia`; 4925
   *  das 6699 linhas não trazem essa data (campo vazio na fonte). */
  referenciaEm: "2026-07-01",
  semReferencia: 4925,
  /** CPF de pessoa física achado DENTRO do campo `nome` (não do campo de
   *  documento) e redigido antes de gravar. */
  nomesComCpfRedigido: 11,
  ramosDeAtividade: 10,
  regioesAssistenciais: 12,
} as const;

export const IPSEMG_POR_RAMO_ATIVIDADE = [{"chave":"CLINICA","contratos":774},{"chave":"LABORATORIO","contratos":476},{"chave":"HOSPITAL/FUNDACAO","contratos":155},{"chave":"CLINICA ODONTOLOGICA","contratos":125},{"chave":"CONSULTORIO MEDICO","contratos":111},{"chave":"CONSULTORIO ODONTOLOGICO","contratos":86},{"chave":"HOSPITAL DIA","contratos":31},{"chave":"SERVICO DE ATENCAO DOMICILIAR","contratos":11},{"chave":"LABORATORIO ODONTOLOGICO","contratos":3},{"chave":"HOSPITAL ESPECIALIZADO","contratos":3}] as const;
export const IPSEMG_POR_REGIAO_ASSISTENCIAL = [{"chave":"CENTRO","contratos":372},{"chave":"SUL","contratos":247},{"chave":"SUDESTE","contratos":212},{"chave":"NORTE","contratos":187},{"chave":"OESTE","contratos":142},{"chave":"TRIANGULO DO NORTE","contratos":136},{"chave":"NORDESTE","contratos":127},{"chave":"LESTE","contratos":116},{"chave":"CENTRO SUL","contratos":83},{"chave":"LESTE DO SUL","contratos":66},{"chave":"NOROESTE","contratos":45},{"chave":"TRIANGULO DO SUL","contratos":42}] as const;
