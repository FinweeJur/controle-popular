import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export interface MembroComissao {
  slug: string;
  nomeUrna: string | null;
}

export interface ComissaoAtual {
  id: string;
  nome: string;
  especial: boolean;
  presidente: MembroComissao | null;
  relator: MembroComissao | null;
  membros: MembroComissao[];
}

interface ComissaoMembroJoin {
  comissao_id: string | null;
  papel: string;
  vereadores: { slug: string; nome_urna: string | null } | null;
}

/**
 * Composição atual das comissões (migration 0015, `etl/camaras/comissoes.py`).
 *
 * Só as comissões do catálogo `comissoes` (semeado a partir do bloco "em
 * andamento" de cada vereador) — ver docstring do ETL pra por que o
 * catálogo não tenta reconciliar nomes históricos renomeados.
 */
export async function getComissoesAtuais(): Promise<{ rows: ComissaoAtual[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], ok: false };

  try {
    const { data: comissoesData, error: erroComissoes } = await supabase
      .from("comissoes")
      .select("id, nome, especial")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .order("nome", { ascending: true });
    if (erroComissoes || !comissoesData) return { rows: [], ok: false };

    const { data: membrosData, error: erroMembros } = await supabase
      .from("comissao_membros")
      .select("comissao_id, papel, vereadores(slug, nome_urna)")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("ativo", true)
      .not("comissao_id", "is", null);
    if (erroMembros) return { rows: [], ok: false };

    const porComissao = new Map<string, ComissaoAtual>();
    for (const c of comissoesData as { id: string; nome: string; especial: boolean }[]) {
      porComissao.set(c.id, {
        id: c.id,
        nome: c.nome,
        especial: c.especial,
        presidente: null,
        relator: null,
        membros: [],
      });
    }

    for (const m of (membrosData ?? []) as unknown as ComissaoMembroJoin[]) {
      if (!m.comissao_id || !m.vereadores) continue;
      const alvo = porComissao.get(m.comissao_id);
      if (!alvo) continue;
      const pessoa: MembroComissao = { slug: m.vereadores.slug, nomeUrna: m.vereadores.nome_urna };
      if (m.papel === "Presidente") alvo.presidente = pessoa;
      else if (m.papel === "Relator") alvo.relator = pessoa;
      else alvo.membros.push(pessoa);
    }

    return { rows: [...porComissao.values()], ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

export interface ParticipacaoComissao {
  nomeComissao: string;
  papel: string;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
}

/**
 * Histórico de participações de UM vereador — usa `nome_comissao_bruto`
 * (não faz join com `comissoes`), porque grande parte do histórico tem
 * nome de comissão já renomeado/extinto, e mostrar o nome exato que a
 * própria Câmara registrou naquela época é mais correto que tentar casar
 * com o nome atual.
 */
export async function getParticipacoesByVereador(
  vereadorId: string
): Promise<{ andamento: ParticipacaoComissao[]; finalizadas: ParticipacaoComissao[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  const VAZIO = { andamento: [], finalizadas: [], ok: false };
  if (!supabase) return VAZIO;

  try {
    const { data, error } = await supabase
      .from("comissao_membros")
      .select("nome_comissao_bruto, papel, ativo, data_inicio, data_fim")
      .eq("vereador_id", vereadorId)
      .order("data_fim", { ascending: false, nullsFirst: false });
    if (error || !data) return VAZIO;

    const rows = (
      data as {
        nome_comissao_bruto: string;
        papel: string;
        ativo: boolean;
        data_inicio: string | null;
        data_fim: string | null;
      }[]
    ).map((r) => ({
      nomeComissao: r.nome_comissao_bruto,
      papel: r.papel,
      ativo: r.ativo,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
    }));

    return {
      andamento: rows.filter((r) => r.ativo),
      finalizadas: rows.filter((r) => !r.ativo),
      ok: true,
    };
  } catch {
    return VAZIO;
  }
}
