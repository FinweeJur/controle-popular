/**
 * Índice estático fatiado: transforma uma tabela grande em arquivos JSON que
 * o Cloudflare aceita servir e o navegador consegue baixar em pedaços.
 *
 * ═══ POR QUE FATIAR, E NÃO UM ARQUIVO SÓ ═══
 *
 * No modo `output: 'export'` não há servidor para paginar: a página inteira
 * vira arquivo. A tentação é emitir um `dados.json` com a tabela toda, e ela
 * quebra em dois lugares ao mesmo tempo:
 *
 *   1. **Teto do Cloudflare: 25 MiB por arquivo** (conferido na doc em
 *      2026-08-09; o limite de 20.000 arquivos é folgado para este site).
 *      `prefeitura/servidores` em São Paulo passa de 100 mil linhas — um JSON
 *      único encosta nesse teto e o deploy falha depois do build inteiro.
 *   2. **O navegador do leitor.** Um arquivo de 20 MB em 3G é minutos de tela
 *      branca. Fatia permite mostrar a primeira página enquanto o resto chega.
 *
 * ═══ O CORTE É POR BYTES, NÃO POR NÚMERO DE LINHAS ═══
 *
 * Cortar de 5.000 em 5.000 parece razoável e não é: uma linha de `contratos`
 * carrega o campo `objeto`, que é texto livre e pode ter centenas de
 * caracteres, enquanto uma linha de `servidores` é nome, cargo e lotação. As
 * duas tabelas dariam fatias de tamanho completamente diferente, e a que
 * estourasse só apareceria no deploy.
 *
 * Aqui o acumulador mede o JSON serializado de cada linha e fecha a fatia
 * quando o orçamento acaba. O orçamento default é conservador de propósito
 * (2 MiB): o teto é 12,5× maior, e a folga cobre tanto o crescimento da base
 * quanto o custo de baixar a fatia numa conexão ruim.
 *
 * ═══ UMA LINHA MAIOR QUE O ORÇAMENTO NÃO É DESCARTADA ═══
 *
 * Ela vira uma fatia sozinha, e o fato é reportado em `avisos`. Descartar
 * silenciosamente seria perder dado público; abortar o build por causa de um
 * contrato com objeto gigante seria pior. Quem consumir decide o que fazer com
 * o aviso — mas ele existe.
 */

/** 2 MiB. Teto do Cloudflare é 25 MiB; a folga é intencional. */
export const ORCAMENTO_PADRAO_BYTES = 2 * 1024 * 1024;

export interface ManifestoFatias {
  /** Quantas linhas ao todo, somando as fatias. */
  total: number;
  /** Quantas fatias — os arquivos são `0`, `1`, ... `fatias - 1`. */
  fatias: number;
  /** Linhas em cada fatia, na ordem. Permite ao cliente pular direto para a
   *  fatia que contém a linha N sem baixar as anteriores. */
  linhasPorFatia: number[];
  /** Bytes de cada fatia, na ordem — o cliente usa para mostrar progresso
   *  honesto em vez de uma barra que anda por número de arquivos. */
  bytesPorFatia: number[];
  orcamentoBytes: number;
  /** Vazio no caminho feliz. Ver a nota sobre linha maior que o orçamento. */
  avisos: string[];
}

export interface IndiceFatiado<T> {
  manifesto: ManifestoFatias;
  fatias: T[][];
}

/**
 * Corta `linhas` em fatias que cabem no orçamento de bytes.
 *
 * A ordem é preservada: fatia 0 tem as primeiras linhas. Isso é requisito, não
 * detalhe — a tabela cliente mostra a primeira página assim que a fatia 0
 * chega, e isso só é a primeira página de verdade se a ordenação vier pronta
 * do build.
 */
export function fatiar<T>(
  linhas: T[],
  { orcamentoBytes = ORCAMENTO_PADRAO_BYTES }: { orcamentoBytes?: number } = {}
): IndiceFatiado<T> {
  const fatias: T[][] = [];
  const linhasPorFatia: number[] = [];
  const bytesPorFatia: number[] = [];
  const avisos: string[] = [];

  let atual: T[] = [];
  // Começa em 2 pelos colchetes do array serializado; cada linha depois da
  // primeira paga também a vírgula. Sem isso a conta subestima e a fatia sai
  // maior que o orçamento justamente quando há muitas linhas pequenas.
  let bytesAtual = 2;

  const fechar = () => {
    if (atual.length === 0) return;
    fatias.push(atual);
    linhasPorFatia.push(atual.length);
    bytesPorFatia.push(bytesAtual);
    atual = [];
    bytesAtual = 2;
  };

  for (const linha of linhas) {
    const bytes = Buffer.byteLength(JSON.stringify(linha), "utf8");

    if (bytes + 2 > orcamentoBytes) {
      // Linha sozinha já não cabe: fecha o que estava aberto e emite esta como
      // fatia própria, em vez de descartar dado público.
      fechar();
      fatias.push([linha]);
      linhasPorFatia.push(1);
      bytesPorFatia.push(bytes + 2);
      avisos.push(
        `Uma linha ocupa ${(bytes / 1024).toFixed(0)} KB sozinha e virou uma fatia ` +
          `só. Se isso for comum nesta tabela, o orçamento está baixo demais ou a ` +
          `coluna de texto livre não deveria estar no índice.`
      );
      continue;
    }

    const separador = atual.length > 0 ? 1 : 0;
    if (bytesAtual + separador + bytes > orcamentoBytes) fechar();
    atual.push(linha);
    bytesAtual += (atual.length > 1 ? 1 : 0) + bytes;
  }
  fechar();

  return {
    manifesto: {
      total: linhas.length,
      fatias: fatias.length,
      linhasPorFatia,
      bytesPorFatia,
      orcamentoBytes,
      avisos,
    },
    fatias,
  };
}

/**
 * Índice vazio — o que sai quando não há banco configurado.
 *
 * Existe para o consumidor NÃO precisar tratar `null` em toda rota: um
 * manifesto com `total: 0` e zero fatias é um estado válido e legível, e a
 * tela distingue "banco ausente" de "município sem linhas" pelo campo que já
 * usa para isso. O que não pode acontecer é uma rota estática falhar no build
 * porque o banco não respondeu.
 */
export function indiceVazio<T>(): IndiceFatiado<T> {
  return {
    manifesto: {
      total: 0,
      fatias: 0,
      linhasPorFatia: [],
      bytesPorFatia: [],
      orcamentoBytes: ORCAMENTO_PADRAO_BYTES,
      avisos: [],
    },
    fatias: [],
  };
}
