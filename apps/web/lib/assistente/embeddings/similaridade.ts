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
 *
 * ═══ O IRMÃO LEXICAL ═══
 *
 * `similaridadeLexical` é o lado BM25-leve do ranking híbrido do chatbot:
 * sobreposição de tokens normalizados entre pergunta e pedaço. O índice
 * BM25 de verdade (`public/busca-indice/**`) só existe quando o `home-pc`
 * publica o build com Postgres — numa máquina de desenvolvimento o acervo
 * do degrau 3 precisa de uma régua lexical AUTOCONTIDA. Jaccard sobre
 * tokens (sem stopwords pt) não é BM25, mas cobre o caso que o cosseno
 * perde: termo exato que o embedding espalha ("licenciamento" citado uma
 * vez no pedaço mas diluído no vetor). Ver a decisão em
 * `lib/assistente/acervo.ts` e o pipeline em `embeddings/rag.ts`.
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

// Stopwords do português — sem acento (o token já foi normalizado). A lista
// é curta de propósito: só o que polui a sobreposição lexical sem carregar
// significado ("de", "para", "que"); palavra curta demais cai pelo filtro
// de tamanho, não pela lista.
const STOPWORDS_PT = new Set([
  "de", "da", "do", "das", "dos", "em", "e", "para", "por", "com", "que",
  "como", "no", "na", "nos", "nas", "ao", "aos", "um", "uma", "uns", "umas",
  "pelo", "pela", "pra", "pro", "se", "sobre", "entre", "ate", "mais",
]);

/**
 * Tokens normalizados de um texto: minúsculo, sem acento, só letras e
 * números, sem stopwords. A mesma régua de normalização usada pela busca do
 * portal (`lib/busca/normalizar.ts`) — divergir dela aqui criaria um
 * segundo dialeto de "mesma palavra" para o mesmo conteúdo.
 */
export function tokensDe(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS_PT.has(t));
}

/**
 * Similaridade lexical (Jaccard sobre tokens) entre dois textos — o
 * complemento barato do cosseno no ranking híbrido. 0 = nenhum token em
 * comum; 1 = os mesmos tokens. Texto sem tokens devolve 0, não erro.
 */
export function similaridadeLexical(a: string, b: string): number {
  const ta = new Set(tokensDe(a));
  const tb = new Set(tokensDe(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersecao = 0;
  for (const t of ta) {
    if (tb.has(t)) intersecao++;
  }
  return intersecao / (ta.size + tb.size - intersecao);
}
