/**
 * Normalização de texto para a busca estática — o lado do NAVEGADOR.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * A `/busca` do servidor usa
 * `to_tsvector('portuguese', public.unaccent_immutable(texto))`. Para a versão
 * estática dar o MESMO resultado, o navegador precisa tratar a palavra digitada
 * exatamente como o Postgres trata o documento. Este arquivo é a metade
 * determinística disso (minúscula + tirar acento + separar palavras); a
 * radicalização em si vem PRONTA do Postgres, num dicionário gerado no build —
 * ver `scripts/gerar-indice-busca.mts`.
 *
 * ═══ A ORDEM IMPORTA, E FOI MEDIDA ═══
 *
 * `ts_lexize('portuguese_stem', ...)` devolve radicais DIFERENTES conforme o
 * acento (medido em PostgreSQL 18.4, 2026-08-09):
 *
 *     iluminação  -> ilumin        iluminacao -> iluminaca
 *     educação    -> educ          educacao   -> educaca
 *     saúde       -> saúd          saude      -> saud
 *     cidadãos    -> cidadã        cidadaos   -> cidada
 *
 * Quem digita "iluminacao" no teclado sem acento é a maioria. Se o documento
 * fosse radicalizado COM acento e a busca SEM, nada casaria — e o modo de falha
 * seria "a busca não acha", sem erro nenhum para investigar. Por isso os dois
 * lados tiram o acento ANTES de radicalizar. É o que a migration `0046` já
 * fazia no servidor com `unaccent_immutable`; aqui é a mesma regra.
 */

/**
 * Tira acento e cedilha, e baixa para minúscula.
 *
 * NFD separa a letra do diacrítico (`ç` vira `c` + cedilha combinante), e o
 * range `̀-ͯ` remove os diacríticos. Cobre á à â ã ä é ê í ó ô õ ú ü
 * ç — todo o português — sem tabela escrita à mão.
 *
 * `ª`/`º` NÃO são diacríticos e sobrevivem ao NFD: viram `a`/`o` à parte,
 * porque "1ª via" e "1a via" têm de casar.
 */
export function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ªº]/g, (c) => (c === "ª" ? "a" : "o"))
    .toLowerCase();
}

/**
 * Quebra em palavras do jeito que o Postgres quebra.
 *
 * Decisões que parecem detalhe e não são:
 *
 * - **Hífen vira separador.** "compra-e-venda" e "meio-ambiente" são rotas do
 *   portal, e quem busca digita com e sem hífen. Virar duas palavras faz as
 *   duas formas casarem.
 * - **Ponto e barra somem de números.** "Lei 1.234/2020" e "lei 1234 2020"
 *   têm de dar no mesmo lugar; `PL 3611` idem. Sem isto, o formato oficial da
 *   norma (o jeito como ela é citada em documento) seria o único que NÃO acha.
 * - **Número colado em letra separa.** "art5" -> "art" + "5".
 */
export function separarPalavras(texto: string): string[] {
  return semAcento(texto)
    .replace(/(\d)[.,](?=\d)/g, "$1") // 1.234 -> 1234
    .replace(/[^a-z0-9]+/g, " ") // hífen, barra, pontuação viram espaço
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Distância de edição (Levenshtein) com corte.
 *
 * Existe para o erro de digitação, que é o caso mais comum de "a busca não
 * acha" depois do acento: `sáude`, `licitaçao`, `vereadro`. Só é chamada
 * quando a palavra digitada NÃO existe no dicionário do acervo — então o
 * custo some no caso normal.
 *
 * `maximo` corta a conta assim que a linha inteira passa do limite: sem isso,
 * comparar a palavra digitada contra ~10 mil radicais seria lento no celular.
 */
export function distancia(a: string, b: string, maximo = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menorDaLinha = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      atual.push(v);
      if (v < menorDaLinha) menorDaLinha = v;
    }
    if (menorDaLinha > maximo) return maximo + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/**
 * Quanto erro de digitação tolerar, pelo tamanho da palavra.
 *
 * Palavra curta não ganha tolerância: com 3 letras, distância 1 transforma
 * "lei" em "leo", "rei", "les" — a "correção" acharia coisa que ninguém pediu.
 * O risco de falso positivo cresce quando a palavra encurta, então a régua
 * sobe junto com o tamanho.
 */
export function tolerancia(palavra: string): number {
  if (palavra.length <= 3) return 0;
  if (palavra.length <= 6) return 1;
  return 2;
}
