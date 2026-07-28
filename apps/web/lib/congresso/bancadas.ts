import { getSupabaseClient, fetchAll } from "@/lib/congresso/supabase";
import { agregar, type PerfilAgregado } from "@/lib/congresso/agregado";
import type { Rotulo } from "@/lib/congresso/rubrica";

export type TipoBancada = "frente" | "bloco" | "federacao" | "partido";

export interface Bancada {
  id: string;
  casa_id: string;
  id_externo: string | null;
  tipo: TipoBancada;
  nome: string | null;
  legislatura: number | null;
  url_site: string | null;
}

export interface BancadaComContagem extends Bancada {
  membros: number;
}

export const ROTULO_TIPO: Record<TipoBancada, string> = {
  frente: "Frente parlamentar",
  bloco: "Bloco",
  federacao: "Federação",
  partido: "Partido",
};

export const DESCRICAO_TIPO: Record<TipoBancada, string> = {
  frente:
    "Grupos temáticos suprapartidários — é o que se costuma chamar de “bancada ruralista”, “bancada evangélica”, “bancada da segurança”. Não são órgãos do regimento, mas explicam por que parlamentares sem partido em comum votam junto num tema.",
  bloco: "Agrupamentos partidários formados para efeito de proporcionalidade nas comissões e no tempo de fala.",
  federacao: "União de partidos com vínculo obrigatório por no mínimo quatro anos, que funciona como um partido só.",
  partido: "Legendas com representação na casa.",
};

/**
 * PostgREST põe todos os filtros na URL. Um `.in()` com 500 uuids estoura
 * o limite prático de tamanho de URL e o servidor devolve 414 — que chega
 * aqui como erro genérico e some fácil no meio de uma página. Fatiar é o
 * que evita descobrir isso só quando um partido grande for aberto.
 */
async function emLotes<T>(
  ids: string[],
  tamanho: number,
  consulta: (lote: string[]) => Promise<T[]>
): Promise<T[]> {
  const saida: T[] = [];
  for (let i = 0; i < ids.length; i += tamanho) {
    saida.push(...(await consulta(ids.slice(i, i + tamanho))));
  }
  return saida;
}

export async function listarBancadas(
  tipo?: TipoBancada
): Promise<BancadaComContagem[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const bancadas = await fetchAll<Bancada>(() => {
      const q = sb.from("bancadas").select("*").order("nome");
      return tipo ? q.eq("tipo", tipo) : q;
    });

    const vinculos = await fetchAll<{ bancada_id: string }>(() =>
      sb.from("bancada_membros").select("bancada_id")
    );
    const contagem = new Map<string, number>();
    for (const v of vinculos) contagem.set(v.bancada_id, (contagem.get(v.bancada_id) ?? 0) + 1);

    return bancadas
      .map((b) => ({ ...b, membros: contagem.get(b.id) ?? 0 }))
      .sort((a, b) => b.membros - a.membros || (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"));
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

export interface MembroBancada {
  id: string;
  nome: string | null;
  partido: string | null;
  uf: string | null;
  url_foto: string | null;
  papel: string | null;
}

export async function obterBancada(id: string): Promise<{
  bancada: Bancada;
  membros: MembroBancada[];
  perfil: PerfilAgregado;
  proposicoes: {
    id: string;
    identificacao: string | null;
    ementa: string | null;
    rotulo: Rotulo | null;
    autores: string[];
  }[];
} | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data: bancada } = await sb.from("bancadas").select("*").eq("id", id).maybeSingle();
  if (!bancada) return null;

  type LinhaMembro = {
    papel: string | null;
    parlamentares:
      | { id: string; nome: string | null; partido: string | null; uf: string | null; url_foto: string | null }[]
      | { id: string; nome: string | null; partido: string | null; uf: string | null; url_foto: string | null }
      | null;
  };

  const linhasMembros = await fetchAll<LinhaMembro>(() =>
    sb
      .from("bancada_membros")
      .select("papel, parlamentares(id, nome, partido, uf, url_foto)")
      .eq("bancada_id", id)
  );

  const membros: MembroBancada[] = linhasMembros
    .map((l) => {
      // Recurso embutido N:1 volta como array no PostgREST.
      const p = Array.isArray(l.parlamentares) ? l.parlamentares[0] : l.parlamentares;
      return p ? { ...p, papel: l.papel } : null;
    })
    .filter((m): m is MembroBancada => m !== null)
    .sort((a, b) => {
      // Coordenação primeiro; o resto em ordem alfabética.
      const peso = (m: MembroBancada) => (m.papel ? 0 : 1);
      return peso(a) - peso(b) || (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
    });

  const idsMembros = membros.map((m) => m.id);
  if (idsMembros.length === 0) {
    return { bancada: bancada as Bancada, membros, perfil: agregar([]), proposicoes: [] };
  }

  type LinhaAutoria = {
    parlamentar_id: string;
    proposicoes:
      | {
          id: string;
          identificacao: string | null;
          ementa: string | null;
          data_apresentacao: string | null;
          analises: { rotulo: Rotulo | null }[] | { rotulo: Rotulo | null } | null;
        }
      | {
          id: string;
          identificacao: string | null;
          ementa: string | null;
          data_apresentacao: string | null;
          analises: { rotulo: Rotulo | null }[] | { rotulo: Rotulo | null } | null;
        }[]
      | null;
  };

  const autorias = await emLotes(idsMembros, 60, (lote) =>
    fetchAll<LinhaAutoria>(() =>
      sb
        .from("proposicao_autores")
        .select(
          "parlamentar_id, proposicoes(id, identificacao, ementa, data_apresentacao, analises(rotulo))"
        )
        .in("parlamentar_id", lote)
    )
  );

  const nomePorId = new Map(membros.map((m) => [m.id, m.nome ?? ""]));

  // Uma proposição assinada por 12 membros da mesma frente é UMA
  // proposição, não 12 — contar por vínculo inflaria o perfil de frentes
  // grandes e faria toda frente parecer mais ativa do que é.
  const porProposicao = new Map<
    string,
    { id: string; identificacao: string | null; ementa: string | null; data: string | null; rotulo: Rotulo | null; autores: Set<string> }
  >();

  for (const a of autorias) {
    const p = Array.isArray(a.proposicoes) ? a.proposicoes[0] : a.proposicoes;
    if (!p) continue;
    const analise = Array.isArray(p.analises) ? p.analises[0] : p.analises;
    const existente = porProposicao.get(p.id);
    const autor = nomePorId.get(a.parlamentar_id) ?? "";
    if (existente) {
      if (autor) existente.autores.add(autor);
    } else {
      porProposicao.set(p.id, {
        id: p.id,
        identificacao: p.identificacao,
        ementa: p.ementa,
        data: p.data_apresentacao,
        rotulo: analise?.rotulo ?? null,
        autores: new Set(autor ? [autor] : []),
      });
    }
  }

  const proposicoes = [...porProposicao.values()]
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
    .map((p) => ({
      id: p.id,
      identificacao: p.identificacao,
      ementa: p.ementa,
      rotulo: p.rotulo,
      autores: [...p.autores],
    }));

  return {
    bancada: bancada as Bancada,
    membros,
    perfil: agregar(proposicoes.map((p) => p.rotulo)),
    proposicoes,
  };
}
