/**
 * Funções puras usadas por `scripts/gerar-indice-busca.mts` para montar o
 * `IndiceBusca` a partir do que o Postgres devolve.
 *
 * Moram em `lib/` (não em `scripts/`) porque `vitest.config.ts` só coleta
 * testes em `lib/**` — é a mesma divisão que `lib/estatico/emitir.ts` já
 * documenta: o que decide FORMATO fica testável sem banco; ao script sobra
 * só conectar, consultar e escrever.
 */

/**
 * Extrai os radicais distintos da representação textual de um `tsvector`
 * (`to_tsvector(...)::text`), descartando posição e peso.
 *
 * Formato do Postgres: `'lex1':1,3 'lex2':5A ...`, aspas simples internas
 * escapadas como `''`. Vazio (documento sem texto) devolve `[]`.
 */
export function parseTsvectorLexemas(tsvectorTexto: string): string[] {
  const texto = tsvectorTexto.trim();
  if (!texto) return [];
  const encontrados = new Set<string>();
  const re = /'((?:[^']|'')*)'(?::[0-9,A-Za-z]+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    encontrados.add(m[1].replace(/''/g, "'"));
  }
  return [...encontrados];
}

/**
 * Ementa/subtítulo truncado para caber no índice sem inflar demais uma
 * fatia por causa de um texto livre excepcionalmente longo. Corta em
 * espaço de sobra (não no meio de palavra) quando possível.
 */
export function truncarEmenta(texto: string | null | undefined, limite: number): string {
  const t = (texto ?? "").trim();
  if (t.length <= limite) return t;
  return `${t.slice(0, limite).trimEnd()}…`;
}

/**
 * Título de ato/proposição municipal — replica o formato que
 * `app/busca/page.tsx` já usa hoje na versão dinâmica ("Lei nº 1234/2020"),
 * para a troca de tela não mudar como o resultado aparece.
 */
export function montarTituloMunicipal(
  tipo: string | null | undefined,
  numero: string | number | null | undefined,
  ano: number | null | undefined,
  origem: "ato" | "proposicao"
): string {
  const base = tipo ?? (origem === "ato" ? "Ato" : "Proposição");
  const nro = numero !== null && numero !== undefined && numero !== "" ? ` nº ${numero}` : "";
  const anoTxt = ano ? `/${ano}` : "";
  return `${base}${nro}${anoTxt}`;
}

/**
 * Monta `lexemas` (ordenados — contrato de `IndiceBusca`) e `ocorrencias`
 * (lexemaId -> ids de documento) a partir dos radicais extraídos de cada
 * documento.
 *
 * Cada `entradas[i].lexemas` já deve vir deduplicado por documento (é o que
 * `parseTsvectorLexemas` devolve) — aqui só se agrega entre documentos.
 */
export function construirVocabulario(
  entradas: { docId: number; lexemas: string[] }[]
): { lexemas: string[]; ocorrencias: number[][] } {
  const porLexema = new Map<string, number[]>();
  for (const { docId, lexemas } of entradas) {
    for (const lex of lexemas) {
      const lista = porLexema.get(lex);
      if (lista) lista.push(docId);
      else porLexema.set(lex, [docId]);
    }
  }
  const lexemasOrdenados = [...porLexema.keys()].sort();
  const ocorrencias = lexemasOrdenados.map((l) => porLexema.get(l) as number[]);
  return { lexemas: lexemasOrdenados, ocorrencias };
}

/**
 * Monta o mapa `formas` (forma de superfície digitada -> lexemaId) a partir
 * do par (forma, radical) que o Postgres devolveu via `ts_lexize`.
 *
 * Descarta duas classes de linha, as duas esperadas e não um bug:
 * - `radical` nulo: a forma é stopword para o dicionário `portuguese_stem`
 *   (`ts_lexize` devolve array vazio — em SQL, `(vazio)[1]` é `null`).
 * - `radical` que não está em `idDoLexema`: o radical não aparece em
 *   nenhum documento do acervo (não deveria sobrar candidato pra isso,
 *   dado que as formas vêm do próprio corpus, mas a função não confia nisso
 *   às cegas — filtra em vez de gravar um `formas[x] = undefined`).
 */
export function construirFormas(
  pares: { forma: string; radical: string | null }[],
  idDoLexema: Map<string, number>
): Record<string, number> {
  const formas: Record<string, number> = {};
  for (const { forma, radical } of pares) {
    if (!radical) continue;
    const id = idDoLexema.get(radical);
    if (id === undefined) continue;
    formas[forma] = id;
  }
  return formas;
}
