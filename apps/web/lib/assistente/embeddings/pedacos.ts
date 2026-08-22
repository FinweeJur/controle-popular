/**
 * Fatiamento de texto em pedaços para indexação por embedding ("chunking",
 * no jargão de RAG) — a metade "vetorizar" do pipeline não sabe nada de
 * embedding; só decide onde cortar.
 *
 * DUAS regras, nessa ordem, nada de NLP de propósito (é o "chunking
 * simples" pedido — sentence-splitting exigiria um tokenizador de frase em
 * português, que este módulo não tem e não precisa ter pra provar o
 * pipeline):
 *
 * 1. Corta por PARÁGRAFO primeiro (linha em branco separa parágrafo de
 *    parágrafo). É o limite de assunto que o próprio autor do texto já
 *    marcou — uma ementa de norma, por exemplo, é um parágrafo inteiro
 *    sobre UMA norma. Preservá-lo mantém cada pedaço coerente sem
 *    heurística nenhuma.
 * 2. Um parágrafo sozinho mais comprido que `maxPalavras` é recortado em
 *    janelas de `maxPalavras` com `sobreposicaoPalavras` de sobreposição.
 *    A sobreposição existe pra a busca não perder uma frase que caiu bem
 *    na fronteira entre duas janelas.
 *
 * Por que PALAVRA como unidade, e não caractere nem token de modelo:
 * é a unidade que dá pedaço legível em log/teste sem decodificar nada
 * (compare com token de BPE, que corta no meio de palavra e não imprime
 * bem), e é robusta o bastante para texto em português — o custo real de
 * "não é token exato do modelo" é só o tamanho do pedaço variar um pouco
 * do orçamento nominal do modelo, e não importa aqui: quem chama este
 * módulo escolhe `maxPalavras` com folga.
 */

export interface OpcoesFatiamento {
  /** Tamanho máximo de um pedaço, em palavras. Default: 120. */
  maxPalavras?: number;
  /** Sobreposição, em palavras, usada SÓ quando um parágrafo sozinho
   *  excede `maxPalavras` (regra 2 acima). Default: 20. */
  sobreposicaoPalavras?: number;
}

export interface Pedaco {
  /** Posição do pedaço na sequência gerada (0-based) — não é ID estável
   *  entre chamadas com opções diferentes, só ordem desta fatia. */
  indice: number;
  texto: string;
}

const MAX_PALAVRAS_PADRAO = 120;
const SOBREPOSICAO_PADRAO = 20;

/** Palavras de um texto, separadas por qualquer sequência de espaço em
 *  branco (inclui quebra de linha). Ao contrário de `separarPalavras` de
 *  `lib/busca/normalizar.ts`, NÃO tira acento nem baixa caixa nem destrói
 *  pontuação — aquela função existe pra CASAR busca com índice invertido;
 *  esta existe pra CONTAR onde cortar sem alterar o texto que vai pro
 *  embedding. Um modelo de embedding é treinado sobre texto natural:
 *  "Fundão" virar "fundao" ou a ementa perder pontuação degradaria o
 *  vetor, não ajudaria. */
function palavrasDe(texto: string): string[] {
  return texto.split(/\s+/).filter(Boolean);
}

/**
 * Fatia `texto` em pedaços prontos para embedding, na ordem em que
 * aparecem no original.
 *
 * Texto vazio (ou só espaço em branco) devolve `[]` — não é erro, é "nada
 * para indexar".
 */
export function fatiarTexto(texto: string, opcoes: OpcoesFatiamento = {}): Pedaco[] {
  const maxPalavras = opcoes.maxPalavras ?? MAX_PALAVRAS_PADRAO;
  const sobreposicao = opcoes.sobreposicaoPalavras ?? SOBREPOSICAO_PADRAO;

  if (!Number.isInteger(maxPalavras) || maxPalavras <= 0) {
    throw new Error(`fatiarTexto: maxPalavras deve ser inteiro positivo, recebeu ${maxPalavras}`);
  }
  if (!Number.isInteger(sobreposicao) || sobreposicao < 0 || sobreposicao >= maxPalavras) {
    throw new Error(
      `fatiarTexto: sobreposicaoPalavras deve ser inteiro >= 0 e menor que maxPalavras (${maxPalavras}), recebeu ${sobreposicao}`
    );
  }

  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pedacos: Pedaco[] = [];
  const passo = maxPalavras - sobreposicao;

  for (const paragrafo of paragrafos) {
    const palavras = palavrasDe(paragrafo);
    if (palavras.length <= maxPalavras) {
      pedacos.push({ indice: pedacos.length, texto: paragrafo });
      continue;
    }
    for (let inicio = 0; inicio < palavras.length; inicio += passo) {
      const fim = Math.min(inicio + maxPalavras, palavras.length);
      pedacos.push({ indice: pedacos.length, texto: palavras.slice(inicio, fim).join(" ") });
      if (fim === palavras.length) break;
    }
  }

  return pedacos;
}
