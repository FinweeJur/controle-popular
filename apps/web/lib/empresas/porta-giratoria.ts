/**
 * @file apps/web/lib/empresas/porta-giratoria.ts
 * @description Tipos e rótulos da seção "Porta giratória" — o cruzamento entre
 * cargos públicos declarados e a governança atual de companhias abertas,
 * exibido em `/empresas/executivos`.
 *
 * Papel no portal:
 * O acervo mostra quem, no exercício de um cargo no conselho, diretoria ou
 * comitê de uma companhia aberta, declarou à CVM ter exercido cargo público
 * (ministro, secretário, Banco Central, agência reguladora, Tribunal de Contas,
 * Ministério Público/CGU, cargo eletivo) nos últimos 5 anos.
 *
 * ═══ DE ONDE VEM O DADO, E O QUE ELE NÃO DIZ (AGENTS § 7) ═══
 * A fonte é a DECLARAÇÃO DA PRÓPRIA COMPANHIA no Formulário de Referência
 * (FRE, item 12 — experiência profissional), publicada nos dados abertos da
 * CVM. O trecho citado é do documento; o link abre o formulário original. O
 * portal não julga: trânsito entre o Estado e a empresa privada é lícito e
 * frequente — o que se publica é o sinal, com fonte direta, para a conferência
 * e a apuração pela autoridade. Nenhum documento pessoal (CPF) é gravado.
 *
 * CLIENT-SAFE: este módulo NÃO lê arquivo. A leitura do JSON mora em
 * `lib/server-only/dados-porta-giratoria.ts` (convenção do repo — ver o
 * cabeçalho de `lib/server-only/dados-executivos.ts`).
 */

export type TipoOrgaoPortaGiratoria = "conselho_administracao_ou_fiscal_diretoria" | "comite";

export interface RegistroPortaGiratoria extends Record<string, unknown> {
  /** Nome da pessoa declarada pela companhia. */
  nome: string;
  /** CNPJ da companhia (dado público de empresa). */
  cnpj_cia: string;
  /** Nome da companhia. */
  companhia: string;
  /** Órgão de governança onde a pessoa consta hoje. */
  tipo_orgao: TipoOrgaoPortaGiratoria;
  /** Cargo/órgão como a companhia o descreve. */
  orgao_cargo: string;
  /** Detalhamento do cargo, quando houver. */
  cargo_detalhe: string;
  /** Data de posse no cargo atual (formato ISO). */
  data_posse: string;
  /** Ano do Formulário de Referência de onde saiu o registro. */
  ano_fre: number;
  /** Número sequencial do documento na CVM (chave do formulário). */
  id_doc: string;
  /** URL canônica do formulário na CVM para conferência. */
  url_documento: string;
  /** A companhia declarou a pessoa como politicamente exposta (PEP). */
  pep_declarada: boolean;
  /** Rótulos dos padrões de cargo público que casaram no texto. */
  padroes: string[];
  /** Trecho literal do FRE (texto da companhia) — a evidência para conferir. */
  trecho: string;
}

export interface AcervoPortaGiratoria {
  fonte: string;
  url_fonte: string;
  anos_processados: number[];
  atualizado_em: string;
  metodologia: string;
  total_registros: number;
  total_pessoas: number;
  total_empresas: number;
  registros: RegistroPortaGiratoria[];
}

/** Rótulo por tipo de órgão de governança. */
export const ROTULO_ORGAO_PORTA: Record<TipoOrgaoPortaGiratoria, string> = {
  conselho_administracao_ou_fiscal_diretoria: "Diretoria / Conselho",
  comite: "Comitê",
};

/**
 * Ordem de prioridade dos padrões — do mais relevante civicamente ao menos.
 * É a ordem de exibição do filtro e a régua do trecho único por registro.
 */
export const PADROES_PORTA_GIRATORIA = [
  "Ministro(a) de Estado",
  "Secretário(a) público",
  "Banco Central",
  "Agência reguladora",
  "Tribunal de Contas",
  "Ministério Público / CGU",
  "Cargo eletivo",
  "Alto escalão do Executivo",
] as const;
