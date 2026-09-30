/**
 * Cálculos cívicos puros — a aritmética da calculadora da página `/tecnologia`.
 *
 * ═══ O QUE É ═══
 *
 * Funções que respondem perguntas recorrentes do cidadão sobre dinheiro
 * público: "quanto é X% disso?", "esse repasse representa quanto do
 * orçamento?", "quanto deu por pessoa?", "se tantos milhões viram tantas
 * obras, quanto vale a obra?". São funções sem estado e sem rede.
 *
 * ═══ REGRA EDITORIAL (por que devolvem `null` e não um número) ═══
 *
 * Quando a conta não é possível — dividir por população zero, por base zero —
 * a função devolve `null` em vez de `Infinity`, `NaN` ou um zero enganoso.
 * Isso obriga a tela a dizer "não dá para calcular", com a razão, em vez de
 * mostrar um número que parece resposta. É a mesma régua do "lacuna é
 * informação" (PRODUTO.md): a ausência vira aviso, não vira zero.
 *
 * ⚠️ A calculadora faz a conta com o número que a PESSOA digita. Ela não
 * afirma nada sobre o portal nem substitui o número medido com fonte.
 */

/** Arredonda para um número fixo de casas decimais, como a tela espera. */
export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

/** Quanto é `taxaPercentual` por cento de `base` (ex.: 15% de 1.200.000). */
export function percentualDe(base: number, taxaPercentual: number): number | null {
  if (!Number.isFinite(base) || !Number.isFinite(taxaPercentual)) return null;
  return (base * taxaPercentual) / 100;
}

/** Que porcentagem `parte` representa de `total` (ex.: 30 de 120 → 25%). */
export function quantoRepresenta(parte: number, total: number): number | null {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total === 0) return null;
  return (parte / total) * 100;
}

/** Quanto fica por pessoa: `total` dividido por `populacao`. */
export function perCapita(total: number, populacao: number): number | null {
  if (!Number.isFinite(total) || !Number.isFinite(populacao) || populacao <= 0) return null;
  return total / populacao;
}

/** Regra de três: se `a` corresponde a `b`, então `c` corresponde a `(b × c) / a`. */
export function regraDeTres(a: number, b: number, c: number): number | null {
  if (![a, b, c].every(Number.isFinite) || a === 0) return null;
  return (b * c) / a;
}

/** Formata número no padrão brasileiro (vírgula decimal, ponto de milhar). */
export function formatarNumeroBR(valor: number, casas = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

/** Formata valor em reais (R$), no padrão brasileiro. */
export function formatarMoedaBR(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
