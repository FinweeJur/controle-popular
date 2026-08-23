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

/**
 * Limiar do indício de concentração: mesmo fornecedor com MAIS DE N
 * contratos assinados NO MESMO ANO (decisão do dono, sprint revisao-dados:
 * N=3 como padrão). Não está em lei — o rótulo na tela é "indício", com a
 * regra visível; mudar aqui muda a tela e o filtro, sem tocar no ETL.
 */
export const INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO = 3;

/** Identificação mínima do fornecedor pra agrupar — mesma chave do banco:
 *  CNPJ e, na falta, o nome publicado. Sem nenhum dos dois, a linha não
 *  entra em grupo algum (não gera indício). */
export interface ContratoIdentificado {
  ano: number | null;
  fornecedor_cnpj?: string | null;
  fornecedor_nome?: string | null;
}

function chaveFornecedor(l: ContratoIdentificado): string | null {
  if (l.fornecedor_cnpj) return l.fornecedor_cnpj;
  if (l.fornecedor_nome) return `nome:${l.fornecedor_nome}`;
  return null;
}

/**
 * Conta contratos por fornecedor+ano sobre o conjunto carregado na tela
 * (a cidade inteira, pois `TabelaEstatica` baixa todas as fatias).
 * Chave do mapa: `${cnpj}|${ano}` ou `nome:${razao}|${ano}`. Linhas sem
 * identificação ou sem ano ficam fora — lacuna não é sinal.
 */
export function contarContratosPorFornecedorAno<T extends ContratoIdentificado>(
  linhas: T[]
): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const l of linhas) {
    const chave = chaveFornecedor(l);
    if (!chave || !l.ano) continue;
    const k = `${chave}|${l.ano}`;
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  return contagem;
}

/** Quantidade de contratos daquele fornecedor naquele ano — para o texto do
 *  indício mostrar o número ("X contratos"), não só sim/não. */
export function quantosContratosNoAno(
  linha: ContratoIdentificado,
  contagens: Map<string, number>
): number {
  const chave = chaveFornecedor(linha);
  if (!chave || !linha.ano) return 0;
  return contagens.get(`${chave}|${linha.ano}`) ?? 0;
}

/**
 * A linha dispara o indício? Estritamente MAIS que o limiar: com N=3,
 * três contratos no ano NÃO acusam — quatro sim ("mais de N").
 */
export function fornecedorExcedeContratosNoAno(
  linha: ContratoIdentificado,
  contagens: Map<string, number>,
  limite: number = INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO
): boolean {
  return quantosContratosNoAno(linha, contagens) > limite;
}
