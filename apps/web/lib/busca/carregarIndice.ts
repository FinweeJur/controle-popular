import type { ManifestoFatias } from "../estatico/fatiar";
import { NOME_MANIFESTO } from "../estatico/emitir";
import type { DocumentoIndexado, IndiceBusca } from "./indice";

/**
 * Lado NAVEGADOR do índice fatiado — a metade de `lib/estatico/emitir.ts`
 * que lê o que o gerador escreveu.
 *
 * `IndiceBusca` não é uma tabela (ver `lib/busca/indice.ts`): é uma
 * estrutura {lexemas, ocorrencias, formas, docs}. Por isso o gerador grava
 * TRÊS grupos fatiados independentes — `docs`, `vocabulario`, `formas` —
 * cada um com seu próprio `manifesto.json`, e este arquivo é quem sabe
 * remontar os três de volta na forma que `buscar()` espera.
 *
 * Diferença deliberada de `TabelaEstatica.tsx`: lá a fatia 0 já é conteúdo
 * útil (a primeira página da tabela aparece antes do resto chegar). Aqui
 * não — nenhuma busca é válida com o índice pela metade (um termo pode
 * estar só na fatia 7 de `vocabulario`), então os três grupos carregam em
 * PARALELO entre si (não há "o primeiro que importa mais"), e dentro de
 * cada grupo as fatias continuam em sequência (mesma razão de sempre: não
 * disputar banda com a decisão de qual fatia baixar primeiro).
 */

export interface ProgressoCarregamento {
  bytesCarregados: number;
  bytesTotais: number;
}

async function buscarJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

/**
 * Carrega um grupo fatiado: manifesto primeiro (pra saber quantas fatias
 * existem e quanto cada uma pesa), depois cada fatia em sequência.
 *
 * `manifesto.fatias === 0` (índice vazio, ver `arquivosDeIndiceVazio`) sai
 * do laço sem tentar buscar `0.json`, que nem existe nesse caso.
 */
export async function carregarGrupoFatiado<T>(
  base: string,
  onProgresso?: (p: ProgressoCarregamento) => void
): Promise<T[]> {
  const manifesto = await buscarJson<ManifestoFatias>(`${base}/${NOME_MANIFESTO}`);
  const bytesTotais = manifesto.bytesPorFatia.reduce((a, b) => a + b, 0);
  const linhas: T[] = [];
  let bytesCarregados = 0;
  for (let i = 0; i < manifesto.fatias; i++) {
    const fatia = await buscarJson<T[]>(`${base}/${i}.json`);
    linhas.push(...fatia);
    bytesCarregados += manifesto.bytesPorFatia[i] ?? 0;
    onProgresso?.({ bytesCarregados, bytesTotais });
  }
  return linhas;
}

/**
 * Remonta o `IndiceBusca` a partir dos três grupos já carregados.
 *
 * `vocabulario`/`formas` chegam como tuplas (não `{l,o}`/`{f,l}`) porque o
 * gerador grava tuplas de propósito — ~10 mil linhas sem repetir nome de
 * chave. A ordem de `vocabulario` é o próprio `lexemaId` (fatiar preserva
 * ordem), então `ocorrencias[i]` já corresponde a `lexemas[i]` sem remapear
 * nada.
 */
export function montarIndiceDeGrupos(
  docs: DocumentoIndexado[],
  vocabulario: [string, number[]][],
  formas: [string, number][]
): IndiceBusca {
  return {
    lexemas: vocabulario.map((v) => v[0]),
    ocorrencias: vocabulario.map((v) => v[1]),
    formas: Object.fromEntries(formas),
    docs,
  };
}

/**
 * Carrega os três grupos a partir de `base` (ex.: `/busca-indice`, onde o
 * gerador grava `docs/`, `vocabulario/`, `formas/`) e devolve o
 * `IndiceBusca` pronto para `buscar()`.
 *
 * `onProgresso` soma bytes carregados/totais dos TRÊS grupos — é o que a
 * tela usa pra mostrar uma barra de progresso honesta em vez de travar sem
 * explicação até tudo chegar.
 */
export async function carregarIndiceBusca(
  base: string,
  onProgresso?: (p: ProgressoCarregamento) => void
): Promise<IndiceBusca> {
  const porGrupo = new Map<string, ProgressoCarregamento>();
  const emitirTotal = () => {
    if (!onProgresso) return;
    let bytesCarregados = 0;
    let bytesTotais = 0;
    for (const p of porGrupo.values()) {
      bytesCarregados += p.bytesCarregados;
      bytesTotais += p.bytesTotais;
    }
    onProgresso({ bytesCarregados, bytesTotais });
  };
  const progressoDoGrupo = (nome: string) => (p: ProgressoCarregamento) => {
    porGrupo.set(nome, p);
    emitirTotal();
  };

  const [docs, vocabulario, formas] = await Promise.all([
    carregarGrupoFatiado<DocumentoIndexado>(`${base}/docs`, progressoDoGrupo("docs")),
    carregarGrupoFatiado<[string, number[]]>(`${base}/vocabulario`, progressoDoGrupo("vocabulario")),
    carregarGrupoFatiado<[string, number]>(`${base}/formas`, progressoDoGrupo("formas")),
  ]);

  return montarIndiceDeGrupos(docs, vocabulario, formas);
}
