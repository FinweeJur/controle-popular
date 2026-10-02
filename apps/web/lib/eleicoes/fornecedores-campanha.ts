/**
 * @file apps/web/lib/eleicoes/fornecedores-campanha.ts
 * @description Tipos das EMPRESAS (pessoa jurídica) que receberam das campanhas
 * eleitorais de 2022 em Minas Gerais — os fornecedores de campanha.
 *
 * Papel no portal:
 * Publica quem a campanha pagou (gráficas, produtoras, agências, plataformas de
 * anúncio...) e quanto, para o cidadão cruzar com os contratos públicos daquele
 * CNPJ. Exibido em `/congresso/financiamento-eleitoral`.
 *
 * ═══ POR QUE FORNECEDOR, E NÃO DOADOR (AGENTS §7) ═══
 * Desde 2015 (STF, ADI 4650) a pessoa jurídica não pode doar a campanhas; o lado
 * da receita é quase todo pessoa física (CPF), que não se publica. O lado que
 * segue sendo empresa — e sustenta o cruzamento cívico — é a DESPESA contratada.
 * Fornecer à campanha não é ilícito: é o dado público que permite conferir quem
 * vende à campanha e quem vende ao poder público.
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-fornecedores-campanha.ts`.
 */

export interface DestinoCampanha {
  candidato: string;
  cargo: string;
  partido: string;
  valor: number;
}

export interface FornecedorCampanha extends Record<string, unknown> {
  cnpj: string;
  nome: string;
  cnae: string;
  municipio: string;
  uf: string;
  /** Total contratado (não necessariamente pago) pela(e) campanha(s). */
  total: number;
  despesas: number;
  /** Os três maiores destinos (candidato) deste fornecedor. */
  top_destinos: DestinoCampanha[];
}

export interface AcervoFornecedoresCampanha {
  fonte: string;
  url_fonte: string;
  url_arquivo: string;
  escopo: string;
  atualizado_em: string;
  valor_minimo: number;
  metodologia: string;
  linhas_lidas: number;
  total_geral_contratado: number;
  total_fornecedores_pj: number;
  total_fornecedores_publicados: number;
  fornecedores_abaixo_do_minimo: number;
  despesas_pessoa_fisica_ignoradas: number;
  registros: FornecedorCampanha[];
}
