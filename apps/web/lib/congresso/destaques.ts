import * as q from "@/lib/db/queries/congresso";
import type { AutoriaResumo } from "@/lib/db/queries/congresso";
import { casaComTema, type Tema } from "@/lib/congresso/temas";
import type { Rotulo } from "@/lib/congresso/rubrica";

/**
 * Destaques: os PLs que retiram direitos (alertas) e os que ampliam
 * (bons exemplos), com recorte opcional por tema.
 *
 * A CONSULTA PARTE DE `analises`, NÃO DE `proposicoes`. Só proposição
 * analisada pode entrar num destaque, e as analisadas são hoje uma fração
 * das 5.500 — partir da tabela grande e filtrar depois leria milhares de
 * linhas para descartar quase todas.
 *
 * Cada destaque carrega `modelo` e `analisadaEm` de propósito: o benchmark
 * mostrou que modelos diferentes concordam no rótulo mas divergem na
 * INTENSIDADE do score. Ordenar por score é honesto dentro de um mesmo
 * modelo; entre modelos, o número não é comparável — e quem lê precisa
 * poder ver isso.
 */

export interface Destaque {
  id: string;
  identificacao: string | null;
  ementa: string | null;
  keywords: string | null;
  temas_oficiais: string[] | null;
  orgao_atual: string | null;
  data_apresentacao: string | null;
  score: number | null;
  rotulo: Rotulo | null;
  clausula_petrea: boolean;
  vedacao_retrocesso: boolean;
  resumo_neutro: string | null;
  modelo: string | null;
  analisadaEm: string | null;
  /** Slugs de direito vindos de `analise_itens` — usados no filtro por tema. */
  direitos: string[];
  /** O item de maior peso, para a UI explicar o rótulo em uma linha. */
  principal: {
    direito: string;
    dispositivo: string;
    direcao: string;
    grau: string;
    trecho: string | null;
  } | null;
  /**
   * Autoria, preenchida DEPOIS do corte por limite/tema — ver
   * `hidratarAutoria`. `undefined` significa "não buscada", não "sem autor".
   */
  autoria?: AutoriaResumo;
}

const REDUCIONISTAS: Rotulo[] = ["reducionista_forte", "reducionista"];
const GARANTISTAS: Rotulo[] = ["garantista_forte", "garantista"];

/**
 * Carrega análises concluídas com a proposição e os itens.
 *
 * `status = 'ok'` é filtro deliberado: análise em `requer_revisao` tem
 * baixa confiança e não pode virar manchete de "alerta" nem de "bom
 * exemplo" — apontar o dedo para um projeto com base numa extração que o
 * próprio sistema considera duvidosa seria injusto com o autor.
 */
async function carregar(rotulos: Rotulo[]): Promise<Destaque[]> {
  try {
    // O join ja traz a proposicao junto: eram TRES idas ao banco
    // (analises, itens, proposicoes) e agora sao duas.
    const analises = await q.analisesComProposicao(rotulos);
    if (analises.length === 0) return [];

    const itens = await q.itensDasAnalises(analises.map((a) => a.id));

    const itensPorAnalise = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorAnalise.get(i.analise_id) ?? [];
      lista.push(i);
      itensPorAnalise.set(i.analise_id, lista);
    }

    return analises
      .map((a): Destaque | null => {
        const meus = (itensPorAnalise.get(a.id) ?? []).slice().sort(
          (x, y) => Math.abs(y.peso ?? 0) - Math.abs(x.peso ?? 0)
        );
        const principal = meus[0];
        return {
          id: a.proposicao_id,
          identificacao: a.identificacao,
          ementa: a.ementa,
          keywords: a.keywords,
          temas_oficiais: a.temas_oficiais,
          orgao_atual: a.orgao_atual,
          data_apresentacao: a.data_apresentacao,
          score: a.score,
          // O banco permite null nestas tres; o PostgREST entregava o
          // default. A camada de queries continua fiel ao schema e o
          // ajuste fica aqui, onde vive o contrato de apresentacao.
          rotulo: a.rotulo as Rotulo | null,
          clausula_petrea: a.clausula_petrea ?? false,
          vedacao_retrocesso: a.vedacao_retrocesso ?? false,
          resumo_neutro: a.resumo_neutro,
          modelo: a.modelo,
          analisadaEm: a.criado_em,
          direitos: [...new Set(meus.map((i) => i.direito))],
          principal: principal
            ? {
                direito: principal.direito,
                dispositivo: principal.dispositivo,
                direcao: principal.direcao,
                grau: principal.grau ?? "",
                trecho: principal.trecho,
              }
            : null,
        };
      })
      .filter((d): d is Destaque => d !== null);
  } catch (e) {
    // Migration não rodada / tabela ausente: estado vazio, não erro.
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

/**
 * Preenche a autoria dos destaques JÁ CORTADOS pelo limite.
 *
 * A ordem importa: hidratar antes do `slice` buscaria autoria das ~370
 * análises carregadas para exibir 60. Uma query só, e ela só vê os ids que
 * vão de fato para a tela.
 */
async function hidratarAutoria(lista: Destaque[]): Promise<Destaque[]> {
  if (lista.length === 0) return lista;
  try {
    const autorias = await q.autoriaDeProposicoes(lista.map((d) => d.id));
    const porId = new Map(autorias.map((a) => [a.proposicao_id, a]));
    for (const d of lista) d.autoria = porId.get(d.id);
  } catch (e) {
    // Migration 0005 ainda não rodada: card sem autoria é degradação
    // aceitável; página em branco não é.
    if ((e as { code?: string }).code !== "42P01") throw e;
  }
  return lista;
}

/** PLs que restringem direitos, do mais grave para o menos. */
export async function alertas(limite?: number, tema?: Tema): Promise<Destaque[]> {
  const todos = await carregar(REDUCIONISTAS);
  const filtrados = tema ? todos.filter((d) => casaComTema(tema, d, d.direitos)) : todos;
  // Score mais negativo primeiro.
  filtrados.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  return hidratarAutoria(limite ? filtrados.slice(0, limite) : filtrados);
}

/** PLs que ampliam direitos, do mais expressivo para o menos. */
export async function bonsExemplos(limite?: number, tema?: Tema): Promise<Destaque[]> {
  const todos = await carregar(GARANTISTAS);
  const filtrados = tema ? todos.filter((d) => casaComTema(tema, d, d.direitos)) : todos;
  filtrados.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return hidratarAutoria(limite ? filtrados.slice(0, limite) : filtrados);
}

/** Quantas proposições já têm análise concluída — o denominador honesto. */
export async function coberturaAnalise(): Promise<{ analisadas: number; total: number }> {
  return q.coberturaAnalise();
}
