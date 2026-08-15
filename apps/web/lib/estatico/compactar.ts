/**
 * Compactação de tabela versionada: **esqueleto + rótulos internados**.
 *
 * ═══ O PROBLEMA QUE ISTO RESOLVE ═══
 *
 * `fatiar.ts` (vizinho) resolve "o arquivo não pode passar de 25 MiB no
 * Cloudflare". Este resolve outra coisa: **um JSON de registros repete o nome
 * de cada campo em cada linha, e repete o VALOR de toda coluna de baixa
 * cardinalidade**. Medido nos dois arquivos da Lei Rouanet, que motivaram o
 * módulo:
 *
 * | Arquivo | Registros | Um objeto por linha | Compactado | Corte |
 * |---|---|---|---|---|
 * | `rouanet-mg-projetos.json` | 7.206 | 3.532.764 B | 1.022.739 B | 71,0% |
 * | `rouanet-mg-incentivadores.json` | 20.784 | 4.363.729 B | 1.418.792 B | 67,5% |
 *
 * Os 7.896.493 B somados eram o maior dado do repositório; viraram 2.441.531 B. As duas economias vêm de
 * lugares diferentes e é por isso que as duas técnicas convivem aqui:
 *
 *   1. **Esqueleto.** `{"PRONAC":"266269","nome":"…","cgccpf":"…"}` vira
 *      `["266269","…","…"]`, com os nomes de campo gravados UMA vez em
 *      `esqueleto`. Em 7.206 projetos de 13 campos, o nome do campo sozinho
 *      custava ~1,6 MB.
 *   2. **Rótulos internados.** `situacao` tem 54 valores distintos em 7.206
 *      linhas e ocupava 330.388 B por extenso; virando índice para um
 *      dicionário, cabe em ~2 KB de dicionário mais 1 byte por linha.
 *      `segmento`: 102 distintos em 332.620 B. Nos dois arquivos, as colunas
 *      que a medição aprovou foram `proponente`, `UF`, `municipio`,
 *      `segmento`, `situacao`, `ano_projeto`, `responsavel` e `tipo_pessoa`.
 *
 * ═══ A DECISÃO DE INTERNAR É MEDIDA, NÃO CHUTADA ═══
 *
 * A tentação é internar "as colunas que parecem repetitivas". Isso erra nos
 * dois sentidos: `nome` de projeto tem 6.765 valores distintos em 7.206 linhas
 * e internar AUMENTARIA o arquivo (o dicionário custa o texto inteiro de novo,
 * mais o índice em cada linha) — e `municipio`, que não parece grande coisa,
 * tem 333 distintos em 101.003 B e paga bem. Uma coluna de 4 valores numa
 * tabela CURTA também não paga: o teste do desempate alfabético nasceu falhando
 * por isso, com 7 linhas, e só passou ao virar 700.
 *
 * `compactar` mede as duas formas de CADA coluna de texto, em bytes
 * serializados, e interna só quando a conta fecha. O que foi decidido fica em
 * `dicionarios` — quem lê o arquivo vê quais colunas foram internadas sem
 * precisar rodar nada.
 *
 * ═══ POR QUE NÃO É SÓ `gzip` ═══
 *
 * O Cloudflare já comprime na entrega, e a compressão pegaria boa parte disso.
 * Mas o arquivo é **versionado**: o que pesa no `git clone`, no `git diff` e no
 * limite de arquivo do GitHub é o tamanho em disco, não o da resposta HTTP. E a
 * janela do gzip é de 32 KB — num arquivo de 4 MB, duas ocorrências do mesmo
 * rótulo distantes entre si **não** são deduplicadas pela compressão. O
 * dicionário deduplica todas.
 *
 * ═══ O DIFF CONTINUA LEGÍVEL ═══
 *
 * Requisito herdado de `coletar-salic-rouanet.mts`: uma linha por registro. O
 * esqueleto não muda isso — cada registro continua sendo uma linha do arquivo.
 * O que muda é que ela ficou curta. O risco novo é o dicionário: inserir um
 * valor no MEIO dele renumeraria todas as linhas e faria um diff gigante por
 * causa de um registro. Por isso a ordem do dicionário é **por frequência
 * decrescente, com desempate alfabético** — determinística, reproduzível, e
 * estável enquanto a distribuição não muda de verdade.
 */

/** Tabela compactada, no formato que vai para o disco. */
export interface TabelaCompacta {
  /** Nomes dos campos, na ordem em que cada linha os traz. */
  esqueleto: string[];
  /**
   * Campo → valores distintos. A linha guarda o ÍNDICE neste vetor.
   * Campo ausente aqui é campo gravado por extenso na linha.
   */
  dicionarios: Record<string, string[]>;
  /** Um vetor por registro, na ordem de `esqueleto`. */
  linhas: unknown[][];
}

/** Quanto custaria a coluna gravada por extenso, em bytes de JSON. */
function bytesPorExtenso(valores: string[]): number {
  let total = 0;
  for (const v of valores) total += Buffer.byteLength(JSON.stringify(v), "utf8");
  return total;
}

/**
 * Quanto custaria a coluna internada: o dicionário uma vez, mais o índice em
 * cada linha.
 *
 * O índice não custa sempre a mesma coisa — `7` são 1 byte e `1043` são 4 —,
 * então a conta usa o comprimento decimal real de cada índice em vez de uma
 * média. Chutar 2 bytes aqui aprovaria colunas que não pagam.
 */
function bytesInternado(valores: string[], ordem: string[]): number {
  const posicao = new Map(ordem.map((v, i) => [v, i]));
  let total = 2 + Math.max(0, ordem.length - 1); // colchetes e vírgulas do dicionário
  for (const v of ordem) total += Buffer.byteLength(JSON.stringify(v), "utf8");
  for (const v of valores) total += String(posicao.get(v) ?? 0).length;
  return total;
}

/**
 * Ordena os valores distintos por frequência decrescente, desempatando pelo
 * próprio valor.
 *
 * Frequência primeiro porque índice menor é menos byte, e o valor mais comum é
 * o que aparece mais vezes. Desempate alfabético porque sem ele duas coletas
 * com a mesma distribuição poderiam gerar dicionários diferentes, e o `git
 * diff` acusaria mudança onde não houve nenhuma.
 */
function ordenarDicionario(contagem: Map<string, number>): string[] {
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([v]) => v);
}

export interface OpcoesCompactar {
  /**
   * Campos que NUNCA são internados, mesmo que a conta feche.
   *
   * Existe para chave de junção: internar `cgccpf` faria o dicionário do
   * arquivo ser uma lista limpa de todos os CNPJ/CPF do acervo, em ordem de
   * frequência — um índice de documentos, que é exatamente o formato que não
   * se quer publicar num repositório aberto, mesmo com dado público. O
   * registro continua trazendo o documento; o que não existe é a lista dele.
   */
  nuncaInternar?: string[];
}

/**
 * Compacta uma lista de registros homogêneos.
 *
 * Aborta em lista vazia? **Não** — devolve um pacote vazio com esqueleto
 * vazio. Coleta que não achou nada é resultado, não erro, e `expandir` de um
 * pacote vazio devolve lista vazia.
 *
 * O esqueleto sai das chaves do PRIMEIRO registro. Se um registro seguinte
 * trouxer campo a mais, a função ABORTA: gravar em silêncio perderia a coluna
 * nova em todos os registros menos num, e o arquivo pareceria certo.
 */
export function compactar<T extends Record<string, unknown>>(
  itens: T[],
  { nuncaInternar = [] }: OpcoesCompactar = {}
): TabelaCompacta {
  if (itens.length === 0) return { esqueleto: [], dicionarios: {}, linhas: [] };

  const esqueleto = Object.keys(itens[0]);
  const conjunto = new Set(esqueleto);
  for (const [i, item] of itens.entries()) {
    const chaves = Object.keys(item);
    const sobrando = chaves.filter((c) => !conjunto.has(c));
    if (sobrando.length > 0) {
      throw new Error(
        `ABORTADO: o registro ${i} tem campo que o primeiro não tinha (${sobrando.join(", ")}) — ` +
          `o esqueleto sai do primeiro registro e a coluna nova seria perdida em silêncio.`
      );
    }
  }

  const proibido = new Set(nuncaInternar);
  const dicionarios: Record<string, string[]> = {};

  for (const campo of esqueleto) {
    if (proibido.has(campo)) continue;
    // Só texto é internado. Número já é curto e virar índice não paga; e um
    // dicionário de números confundiria o índice com o próprio valor na
    // leitura de quem abre o arquivo à mão.
    const valores: string[] = [];
    let soTexto = true;
    for (const item of itens) {
      const v = item[campo];
      if (typeof v !== "string") {
        soTexto = false;
        break;
      }
      valores.push(v);
    }
    if (!soTexto) continue;

    const contagem = new Map<string, number>();
    for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
    const ordem = ordenarDicionario(contagem);
    if (bytesInternado(valores, ordem) < bytesPorExtenso(valores)) dicionarios[campo] = ordem;
  }

  const posicoes = new Map<string, Map<string, number>>();
  for (const [campo, ordem] of Object.entries(dicionarios)) {
    posicoes.set(campo, new Map(ordem.map((v, i) => [v, i])));
  }

  const linhas = itens.map((item) =>
    esqueleto.map((campo) => {
      const pos = posicoes.get(campo);
      if (!pos) return item[campo];
      return pos.get(item[campo] as string)!;
    })
  );

  return { esqueleto, dicionarios, linhas };
}

/**
 * Desfaz `compactar`. É a única forma correta de ler o arquivo — quem indexar
 * `linhas` por posição na tela vai errar assim que uma coluna nova entrar.
 *
 * Aborta em índice fora do dicionário em vez de devolver `undefined`: campo
 * vazio numa tabela é indistinguível de dado ausente na origem, e este é
 * arquivo truncado.
 */
export function expandir<T extends Record<string, unknown>>(tabela: TabelaCompacta): T[] {
  const { esqueleto, dicionarios, linhas } = tabela;
  return linhas.map((linha, n) => {
    if (linha.length !== esqueleto.length) {
      throw new Error(
        `ABORTADO: a linha ${n} tem ${linha.length} valores e o esqueleto tem ` +
          `${esqueleto.length} — arquivo truncado.`
      );
    }
    const saida: Record<string, unknown> = {};
    for (const [i, campo] of esqueleto.entries()) {
      const dic = dicionarios[campo];
      if (!dic) {
        saida[campo] = linha[i];
        continue;
      }
      const idx = linha[i] as number;
      const valor = dic[idx];
      if (valor === undefined) {
        throw new Error(
          `ABORTADO: a linha ${n} aponta para a posição ${idx} do dicionário de "${campo}", ` +
            `que tem ${dic.length} valores.`
        );
      }
      saida[campo] = valor;
    }
    return saida as T;
  });
}

/**
 * Serializa com **uma linha por registro**, para o `git diff` continuar
 * mostrando quais registros mudaram entre duas coletas.
 *
 * `JSON.stringify(tabela)` numa linha só seria menor por um punhado de bytes e
 * tornaria toda recoleta um diff de "1 linha alterada, 4 MB" — que é
 * exatamente o defeito de `risco-climatico.json`, o vizinho.
 *
 * `cabecalho` entra ANTES: quem abre o arquivo tem de ler a origem do dado
 * antes dos números, e `JSON.parse` não se importa com a ordem.
 */
export function serializarCompacto(
  cabecalho: Record<string, unknown>,
  tabela: TabelaCompacta
): string {
  const meta = JSON.stringify(cabecalho, null, 1).replace(/\n?}$/, "");
  const dic = Object.entries(tabela.dicionarios)
    .map(([campo, valores]) => `  ${JSON.stringify(campo)}: ${JSON.stringify(valores)}`)
    .join(",\n");
  const linhas = tabela.linhas.map((l) => "  " + JSON.stringify(l)).join(",\n");
  const texto =
    `${meta},\n` +
    ` "esqueleto": ${JSON.stringify(tabela.esqueleto)},\n` +
    ` "dicionarios": {\n${dic}\n },\n` +
    ` "linhas": [\n${linhas}\n ]\n}\n`;
  // Montar JSON à mão é rápido e é exatamente o tipo de coisa que grava um
  // arquivo quebrado. Conferir aqui custa um parse e evita descobrir no build.
  JSON.parse(texto);
  return texto;
}
