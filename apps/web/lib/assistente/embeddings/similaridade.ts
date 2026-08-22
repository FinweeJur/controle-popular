/**
 * Similaridade de cosseno entre dois vetores — a métrica padrão pra "quão
 * perto" um pedaço de texto embedado está de uma pergunta embedada.
 *
 * Cosseno, não distância euclidiana: o `nomic-embed-text` (como a maioria
 * dos modelos de embedding) devolve vetores cuja MAGNITUDE não carrega
 * significado — o que importa é a direção. Cosseno mede só o ângulo entre
 * os dois vetores (1 = mesma direção, 0 = ortogonais, -1 = opostos),
 * ignorando o tamanho; distância euclidiana penalizaria dois vetores
 * semanticamente idênticos que só diferem em norma.
 */

/**
 * Similaridade de cosseno entre `a` e `b`. Espera vetores do MESMO
 * tamanho (mesma origem, mesmo modelo) — tamanhos diferentes são erro de
 * quem chamou, não caso a tratar em silêncio.
 */
export function similaridadeCosseno(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`similaridadeCosseno: vetores de tamanhos diferentes (${a.length} vs ${b.length})`);
  }
  if (a.length === 0) {
    throw new Error("similaridadeCosseno: vetores vazios");
  }

  let produtoInterno = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    produtoInterno += a[i] * b[i];
    normaA += a[i] * a[i];
    normaB += b[i] * b[i];
  }

  // Vetor nulo (todas as posições zero) não tem direção — cosseno não é
  // definido. Na prática um embedding real nunca é nulo; isto é só a borda
  // que evita dividir por zero se algum dia entrar um vetor degenerado.
  if (normaA === 0 || normaB === 0) return 0;

  return produtoInterno / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

export interface CandidatoRankeado<T> {
  item: T;
  score: number;
}

/**
 * Rankeia `candidatos` por similaridade ao vetor `consulta`, do mais para o
 * menos parecido. `vetorDe` extrai o vetor de cada candidato — genérico de
 * propósito, pra não amarrar este módulo à forma de "pedaço de documento"
 * de `pedacos.ts`; quem chama decide o que é `T`.
 */
export function ranquearPorSimilaridade<T>(
  consulta: number[],
  candidatos: T[],
  vetorDe: (item: T) => number[]
): CandidatoRankeado<T>[] {
  return candidatos
    .map((item) => ({ item, score: similaridadeCosseno(consulta, vetorDe(item)) }))
    .sort((x, y) => y.score - x.score);
}
