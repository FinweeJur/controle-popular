import * as q from "@/lib/db/queries/congresso";
import type { AnaliseItem, Rotulo } from "@/lib/congresso/rubrica";
import type { NivelGravidade, VicioItem } from "@/lib/congresso/rubrica_vicio";

export interface Proposicao {
  id: string;
  casa_id: string;
  id_externo: string;
  sigla_tipo: string | null;
  numero: number | null;
  ano: number | null;
  identificacao: string | null;
  ementa: string | null;
  ementa_detalhada: string | null;
  keywords: string | null;
  temas_oficiais: string[] | null;
  data_apresentacao: string | null;
  situacao: string | null;
  orgao_atual: string | null;
  url_inteiro_teor: string | null;
  url_fonte: string | null;
  /** Extraído do PDF por `etl/inteiro_teor.py`; null enquanto não rodou. */
  texto_integral: string | null;
  tramitando: boolean | null;
  data_ultima_tramitacao: string | null;
}

export interface Analise {
  id: string;
  proposicao_id: string;
  score: number | null;
  rotulo: Rotulo | null;
  clausula_petrea: boolean;
  vedacao_retrocesso: boolean;
  resumo_neutro: string | null;
  parecer_critico: string | null;
  legislacao_relacionada: NormaRelacionada[] | null;
  modelo: string | null;
  versao_rubrica: string | null;
  status: "ok" | "requer_revisao" | "falhou" | null;
  criado_em: string | null;
}

export interface NormaRelacionada {
  identificador: string;
  tipo: string;
  numero: string | null;
  ano: number | null;
  artigos: string[];
  trecho: string;
}

export interface Autor {
  parlamentar_id: string;
  nome: string | null;
  partido: string | null;
  uf: string | null;
  email: string | null;
  url_foto: string | null;
  ordem: number | null;
  proponente: boolean | null;
}

export interface Filtros {
  q?: string;
  tema?: string;
  rotulo?: string;
  /** Nome do autor — ver `FiltrosProposicoes.autor` na camada de queries. */
  autor?: string;
  casa?: string;
  ano?: number;
  tramitando?: boolean;
  pagina?: number;
  porPagina?: number;
}

export const POR_PAGINA_PADRAO = 25;

/**
 * Lista paginada com filtros. Devolve `null` quando o Supabase não está
 * configurado — o chamador renderiza estado vazio em vez de quebrar.
 *
 * A busca textual usa `ilike` sobre ementa e palavras-chave. Busca
 * semântica (pgvector) entra em F8; até lá, `ilike` com índice GIN de
 * trigrama já cobre o caso real do usuário ("trabalho intermitente").
 */
export async function listarProposicoes(
  filtros: Filtros = {}
): Promise<{
  itens: (Proposicao & {
    analise: Analise | null;
    /** Só o nível — o detalhamento (categoria/dispositivo/trecho) mora na página da proposição. */
    vicioNivelGravidade: NivelGravidade | null;
    autoria?: q.AutoriaResumo;
  })[];
  total: number;
} | null> {
  const linhas = await q.paginaDeProposicoes(filtros as q.FiltrosProposicoes);
  if (!linhas) return null;

  const itens = linhas.map((l) => ({
    ...(l.proposicao as Proposicao),
    analise: (l.analise as Analise | null) ?? null,
    vicioNivelGravidade: (l.vicio_nivel_gravidade as NivelGravidade | null) ?? null,
  })) as (Proposicao & {
    analise: Analise | null;
    vicioNivelGravidade: NivelGravidade | null;
    autoria?: q.AutoriaResumo;
  })[];

  // Autoria numa segunda query, sobre os ids DESTA página (25). Não dá para
  // vir no mesmo join: uma proposição tem N autores e o join multiplicaria
  // as linhas da página, quebrando o `count(*) over ()` que dá o total.
  try {
    const autorias = await q.autoriaDeProposicoes(itens.map((i) => i.id));
    const porId = new Map(autorias.map((a) => [a.proposicao_id, a]));
    for (const i of itens) i.autoria = porId.get(i.id);
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") throw e;
  }

  // `count(*) over ()` vem repetido em toda linha; a pagina vazia nao tem
  // linha nenhuma, e ai o total e zero mesmo.
  return { itens, total: linhas[0]?.total ?? 0 };
}

export interface Vicio {
  id: string;
  proposicao_id: string;
  nivel_gravidade: NivelGravidade | null;
  resumo: string | null;
  modelo: string | null;
  versao_rubrica: string | null;
  status: "ok" | "requer_revisao" | "falhou" | null;
  criado_em: string | null;
}

export async function obterProposicao(
  id: string
): Promise<{
  proposicao: Proposicao;
  analise: Analise | null;
  itens: AnaliseItem[];
  vicio: Vicio | null;
  vicioItens: VicioItem[];
  autores: Autor[];
  /** Autoria de leitura: inclui Poder Executivo, comissões e Senado. */
  autoriaCompleta: Awaited<ReturnType<typeof q.autoriaCompletaDaProposicao>>;
  tramitacoes: { sequencia: number; data_hora: string; sigla_orgao: string; descricao: string; despacho: string }[];
} | null> {
  const prop = await q.obterProposicaoPorId(id);
  if (!prop) return null;

  const [analise, vicio, autores, autoriaCompleta, tramitacoes] = await Promise.all([
    q.analiseDaProposicao(id),
    q.vicioDaProposicao(id),
    q.autoresDaProposicao(id),
    q.autoriaCompletaDaProposicao(id).catch((e) => {
      if ((e as { code?: string }).code === "42P01") return [];
      throw e;
    }),
    q.tramitacoesDaProposicao(id),
  ]);

  let itens: AnaliseItem[] = [];
  if (analise) {
    // Peso decrescente em módulo: o item que mais move o score aparece
    // primeiro, que é a ordem em que a pessoa quer auditar.
    itens = (await q.itensDaAnalise(analise.id)) as AnaliseItem[];
    itens.sort((a, b) => Math.abs(b.peso ?? 0) - Math.abs(a.peso ?? 0));
  }

  let vicioItens: VicioItem[] = [];
  if (vicio) {
    vicioItens = (await q.itensDoVicio(vicio.id)) as VicioItem[];
  }

  return {
    proposicao: prop as Proposicao,
    analise: analise as Analise | null,
    itens,
    vicio: vicio as Vicio | null,
    vicioItens,
    autores: autores as Autor[],
    autoriaCompleta,
    tramitacoes: tramitacoes as never,
  };
}

/** Temas oficiais presentes no banco, para popular o filtro. */
export async function listarTemas(): Promise<string[]> {
  try {
    // O `distinct unnest` agrega no banco; antes vinham TODAS as
    // proposições só para montar um Set em memória.
    return (await q.temasDistintos()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch {
    return [];
  }
}
