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

// Stopwords do português — sem acento (o token já foi normalizado). Inclui
// as palavras de pergunta ("qual", "quem", "onde", "quanto"...) porque elas
// aparecem em quase todo pedaço do acervo e, sem removê-las, a sobreposição
// lexical marca pergunta fora do escopo como relevante (medido: "receita de
// bolo de cenoura" casava a página de orçamento). A lista é curta de
// propósito: só o que polui a sobreposição sem carregar significado.
const STOPWORDS_PT = new Set([
  "de", "da", "do", "das", "dos", "em", "e", "para", "por", "com", "que",
  "como", "no", "na", "nos", "nas", "ao", "aos", "um", "uma", "uns", "umas",
  "pelo", "pela", "pra", "pro", "se", "sobre", "entre", "ate", "mais",
  "qual", "quais", "quem", "quando", "onde", "quanto", "quantos", "quantas",
  "porque", "pois", "foi", "sao", "ser", "esta", "estao", "tem", "ha",
  "quero", "saber", "dizer", "fale", "conte", "veja", "ver",
]);

/**
 * Radicalização (stemming) leve em português para normalizar plurais, gêneros
 * e sufixos comuns sem depender de bibliotecas externas pesadas.
 */
export function stemPt(t: string): string {
  let s = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.length <= 3) return s;
  if (s.endsWith("coes") || s.endsWith("cao")) return s.slice(0, -3);
  if (s.endsWith("mentos") || s.endsWith("mento")) return s.slice(0, -5);
  if (s.endsWith("idades") || s.endsWith("idade")) return s.slice(0, -4);
  if (s.endsWith("ados") || s.endsWith("adas") || s.endsWith("ado") || s.endsWith("ada")) return s.slice(0, -3);
  if (s.endsWith("idos") || s.endsWith("idas") || s.endsWith("ido") || s.endsWith("ida")) return s.slice(0, -3);
  if (s.endsWith("ores") || s.endsWith("oras") || s.endsWith("or") || s.endsWith("ora")) return s.slice(0, -2);
  if (s.endsWith("arios") || s.endsWith("arias") || s.endsWith("ario") || s.endsWith("aria")) return s.slice(0, -4);
  if (s.endsWith("acoes") || s.endsWith("acao")) return s.slice(0, -4);
  if (s.endsWith("eis") || s.endsWith("ais") || s.endsWith("ois")) return s.slice(0, -3) + "l";
  if (s.endsWith("es") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("s") && s.length > 3) return s.slice(0, -1);
  return s;
}

/**
 * Tokens normalizados de um texto: minúsculo, sem acento, só letras e
 * números, sem stopwords. Mantém siglas e números de 2+ caracteres (ex: "mg", "bi", "es").
 */
export function tokensDe(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS_PT.has(t));
}

// Termos de alto valor cívico e informativo que garantem maior relevância
const TERMOS_CHAVE_BOOST = new Set([
  "251", "171", "37", "20", "14", "100", "16", "23", "45", "19", "199", "853", "27", "990", "176", "445", "710",
  "tjmg", "mpmg", "dpmg", "semad", "copam", "pncp", "lai", "caged", "rais", "sus", "cnes", "ideb",
  "sigbm", "anm", "ibama", "feam", "ief", "igam", "trf6", "stj", "stf", "tce", "tcu",
  "mariana", "brumadinho", "paraopeba", "doce", "betim", "samarco", "vale", "litio",
  "descaracterizacao", "repactuacao", "licenciamento", "barragens", "royalties", "cfem", "bi", "mg"
]);

/**
 * Similaridade lexical entre a pergunta (a) e o pedaço de acervo (b).
 *
 * Combina Recall de termos da pergunta (70%) com Jaccard de tokens (30%),
 * radicalização leve de termos e boost para números e siglas cívicas.
 *
 * `pesoToken` opcional dá o peso IDF de cada termo da pergunta (termo comum
 * no acervo pesa menos; termo raro pesa mais). Sem ele, a métrica é a
 * contagem simples — compatível com quem chama a função fora do índice
 * (ex.: testes). Com ele, é o que impede uma pergunta fora do escopo de
 * pontuar alto por causa de uma palavra comum como "receita".
 */
export function similaridadeLexical(
  a: string,
  b: string,
  pesoToken?: (t: string) => number
): number {
  const tokensA = tokensDe(a);
  const tokensB = tokensDe(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const stemsB = new Set(tokensB.map(stemPt));
  const setTokensB = new Set(tokensB);

  let intersecao = 0;
  let pesoCasado = 0;
  let pesoTotal = 0;
  let boostTotal = 0;

  for (const t of tokensA) {
    const peso = pesoToken ? pesoToken(t) : 1;
    pesoTotal += peso;
    // Casamento exato ou por radical (stemming)
    const casou = setTokensB.has(t) || stemsB.has(stemPt(t)) || tokensB.some(tb => (tb.length >= 4 && t.length >= 4 && (tb.startsWith(t.slice(0, 4)) || t.startsWith(tb.slice(0, 4)))));
    
    if (casou) {
      intersecao++;
      pesoCasado += peso;
      if (TERMOS_CHAVE_BOOST.has(t) || /^\d+$/.test(t)) {
        boostTotal += 0.08;
      }
    }
  }

  if (intersecao === 0) return 0;

  // Recall: proporção (ponderada por IDF, quando há) dos termos da pergunta
  // encontrados no texto.
  const recall = pesoToken
    ? (pesoTotal > 0 ? pesoCasado / pesoTotal : 0)
    : intersecao / tokensA.length;
  // Jaccard sobreposição
  const jaccard = intersecao / (tokensA.length + tokensB.length - intersecao);

  // Score composto (0 a 1)
  const scoreBase = 0.70 * recall + 0.30 * jaccard;
  const scoreComBoost = Math.min(1.0, scoreBase + boostTotal);

  return scoreComBoost;
}
