import { getSupabaseClient, fetchAll } from "@/lib/congresso/supabase";
import type { AnaliseItem, Rotulo } from "@/lib/congresso/rubrica";

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
): Promise<{ itens: (Proposicao & { analise: Analise | null })[]; total: number } | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const porPagina = filtros.porPagina ?? POR_PAGINA_PADRAO;
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const de = (pagina - 1) * porPagina;

  let query = sb
    .from("proposicoes")
    .select("*, analises(*)", { count: "exact" })
    .order("data_apresentacao", { ascending: false })
    .range(de, de + porPagina - 1);

  if (filtros.casa) query = query.eq("casa_id", filtros.casa);
  if (filtros.ano) query = query.eq("ano", filtros.ano);
  if (filtros.tramitando !== undefined) query = query.eq("tramitando", filtros.tramitando);
  if (filtros.tema) query = query.contains("temas_oficiais", [filtros.tema]);
  if (filtros.q) {
    const termo = `%${filtros.q}%`;
    query = query.or(`ementa.ilike.${termo},keywords.ilike.${termo},identificacao.ilike.${termo}`);
  }

  const { data, error, count } = await query;
  if (error) {
    // Tabela ainda não existe (migration não rodada) não é motivo para
    // derrubar a página — é o estado esperado antes do F1.
    if (error.code === "42P01") return { itens: [], total: 0 };
    throw error;
  }

  let itens = (data ?? []).map((linha) => {
    const { analises, ...prop } = linha as Proposicao & { analises: Analise[] | Analise | null };
    const analise = Array.isArray(analises) ? (analises[0] ?? null) : (analises ?? null);
    return { ...(prop as Proposicao), analise };
  });

  // O filtro por rótulo é aplicado depois da consulta de propósito: filtrar
  // por coluna de tabela embutida no PostgREST exigiria `!inner`, que
  // descartaria silenciosamente toda proposição SEM análise — e "ainda não
  // analisada" é um estado legítimo que precisa continuar visível.
  if (filtros.rotulo) {
    itens = itens.filter((i) => i.analise?.rotulo === filtros.rotulo);
  }

  return { itens, total: count ?? itens.length };
}

export async function obterProposicao(
  id: string
): Promise<{
  proposicao: Proposicao;
  analise: Analise | null;
  itens: AnaliseItem[];
  autores: Autor[];
  tramitacoes: { sequencia: number; data_hora: string; sigla_orgao: string; descricao: string; despacho: string }[];
} | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data: prop, error } = await sb.from("proposicoes").select("*").eq("id", id).maybeSingle();
  if (error || !prop) return null;

  const [analiseRes, autoresRes, tramRes] = await Promise.all([
    sb.from("analises").select("*").eq("proposicao_id", id).maybeSingle(),
    sb
      .from("proposicao_autores")
      .select("ordem, proponente, parlamentares(id, nome, partido, uf, email, url_foto)")
      .eq("proposicao_id", id)
      .order("ordem"),
    sb
      .from("tramitacoes")
      .select("sequencia, data_hora, sigla_orgao, descricao, despacho")
      .eq("proposicao_id", id)
      .order("sequencia", { ascending: false }),
  ]);

  const analise = (analiseRes.data as Analise | null) ?? null;

  let itens: AnaliseItem[] = [];
  if (analise) {
    const { data } = await sb
      .from("analise_itens")
      .select("*")
      .eq("analise_id", analise.id)
      // Peso decrescente em módulo: o item que mais move o score aparece
      // primeiro, que é a ordem em que a pessoa quer auditar.
      .order("peso", { ascending: true });
    itens = (data ?? []) as AnaliseItem[];
    itens.sort((a, b) => Math.abs(b.peso ?? 0) - Math.abs(a.peso ?? 0));
  }

  type ParlamentarEmbutido = {
    id: string;
    nome: string | null;
    partido: string | null;
    uf: string | null;
    email: string | null;
    url_foto: string | null;
  };
  // PostgREST tipa recurso embutido como ARRAY mesmo quando a relação é
  // N:1 e sempre volta um elemento só — daí o `[0]` em vez do acesso
  // direto que o schema sugeriria.
  type LinhaAutor = {
    ordem: number | null;
    proponente: boolean | null;
    parlamentares: ParlamentarEmbutido[] | ParlamentarEmbutido | null;
  };

  const autores: Autor[] = ((autoresRes.data ?? []) as unknown as LinhaAutor[])
    .map((linha) => {
      const p = Array.isArray(linha.parlamentares)
        ? (linha.parlamentares[0] ?? null)
        : linha.parlamentares;
      if (!p) return null;
      return {
        parlamentar_id: p.id,
        nome: p.nome,
        partido: p.partido,
        uf: p.uf,
        email: p.email,
        url_foto: p.url_foto,
        ordem: linha.ordem,
        proponente: linha.proponente,
      };
    })
    .filter((a): a is Autor => a !== null);

  return {
    proposicao: prop as Proposicao,
    analise,
    itens,
    autores,
    tramitacoes: (tramRes.data ?? []) as never,
  };
}

/** Temas oficiais presentes no banco, para popular o filtro. */
export async function listarTemas(): Promise<string[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const linhas = await fetchAll<{ temas_oficiais: string[] | null }>(() =>
      sb.from("proposicoes").select("temas_oficiais").not("temas_oficiais", "is", null)
    );
    const todos = new Set<string>();
    for (const linha of linhas) (linha.temas_oficiais ?? []).forEach((t) => todos.add(t));
    return [...todos].sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch {
    return [];
  }
}
