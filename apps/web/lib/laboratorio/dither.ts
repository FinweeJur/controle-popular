/**
 * /laboratorio — fase F1: gráfico dither (feito de pontos) sobre dado fixo.
 *
 * Lógica pura, testável. Sem biblioteca nova: o SVG é montado na página de
 * servidor com o retorno daqui. Números vêm de `COBERTURA_SIGBM` (medidos,
 * com data de coleta) — nada digitado à mão (regra do repositório).
 */

export interface SerieDither {
  valor: string;
  total: number;
}

export interface BarraDither {
  valor: string;
  total: number;
  /** Quantidade de pontos (células) da barra. */
  pontos: number;
}

/** Escala de pontos: maior barra da série ocupa LARGURA_MAXIMA pontos. */
export const LARGURA_MAXIMA = 24;

/** Converte uma série (valor/total) em barras de pontos proporcionais.
 *  A maior barra ocupa LARGURA_MAXIMA pontos; as demais escalam por razão.
 *  Série vazia devolve lista vazia. */
export function barrasDither(serie: readonly SerieDither[]): BarraDither[] {
  if (serie.length === 0) return [];
  const maximo = Math.max(...serie.map((s) => s.total));
  if (maximo <= 0) {
    // tudo zero: nenhuma barra, mas manter os rótulos para a tabela
    return serie.map((s) => ({ valor: s.valor, total: s.total, pontos: 0 }));
  }
  return serie.map((s) => {
    const pontos = Math.round((s.total / maximo) * LARGURA_MAXIMA);
    // barra com valor > 0 não pode sair com 0 pontos (round para baixo)
    const movido = pontos === 0 && s.total > 0 ? 1 : pontos;
    return { valor: s.valor, total: s.total, pontos: movido };
  });
}

/** Raio (px) de cada ponto no SVG — constante medida para a grade de 24. */
export const RAIO_PONTO = 3;

/** Deslocamento entre pontos (px): raio × 2 + folga 1. */
export const PASSO_PONTO = RAIO_PONTO * 2 + 1;
