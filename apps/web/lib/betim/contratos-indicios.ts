/**
 * ═══ INDÍCIOS DE CONTRATO — LÓGICA PURA, SEGURA PRA CLIENTE ═══
 *
 * Este módulo NÃO pode importar nada de `lib/db/queries/*`: ele é usado por
 * componente de cliente (`ListaContratos`), e importar a cadeia do banco
 * arrastaria código de servidor pro bundle do navegador — o mesmo motivo de
 * `MOTIVO_ALERTA_INFO` chegar à tabela por prop (ver cabeçalho lá).
 * As funções aqui são puras e testáveis sem banco nem rede.
 */

export interface ContratoComAbertura {
  ano: number | null;
  /** Data de abertura do CNPJ do fornecedor (ISO), quando conhecida. */
  fornecedor_abertura?: string | null;
}

/**
 * Indício "empresa criada no mesmo ano do contrato": o ano da abertura do
 * CNPJ bate com o ano do contrato. Função pura — a decisão de comparar ANO
 * (não data exata) é deliberada: o que importa é o sinal estatístico
 * "fornecedor sem histórico prévio na época da assinatura".
 *
 * Sem data de abertura ou sem ano, devolve `false` — ausência de dado não
 * é indício. E `false` aqui NÃO significa "empresa antiga": significa
 * apenas que este indício específico não se aplica à linha.
 */
export function fornecedorCriadoNoAnoDoContrato(contrato: ContratoComAbertura): boolean {
  if (!contrato.ano || !contrato.fornecedor_abertura) return false;
  const abertura = Number(String(contrato.fornecedor_abertura).slice(0, 4));
  return Number.isFinite(abertura) && abertura === contrato.ano;
}
