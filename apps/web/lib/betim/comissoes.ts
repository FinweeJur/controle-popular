import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

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
  slug: string;
  nome_urna: string | null;
}

/**
 * Composição atual das comissões (migration 0015, `etl/camaras/comissoes.py`).
 *
 * Só as comissões do catálogo `comissoes` (semeado a partir do bloco "em
 * andamento" de cada vereador) — ver docstring do ETL pra por que o
 * catálogo não tenta reconciliar nomes históricos renomeados.
 */
export async function getComissoesAtuais(
  idMunicipio: IdMunicipio
): Promise<{ rows: ComissaoAtual[]; ok: boolean }> {
  try {
    const [comissoesData, membrosData] = await Promise.all([
      q.listarComissoes(idMunicipio),
      q.membrosDeComissoes(idMunicipio),
    ]);
    if (!comissoesData || !membrosData) return { rows: [], ok: false };

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

    // O embed `vereadores(slug, nome_urna)` do PostgREST virou `inner
    // join`, então o membro já chega achatado e sem vereador órfão.
    for (const m of membrosData as ComissaoMembroJoin[]) {
      if (!m.comissao_id) continue;
      const alvo = porComissao.get(m.comissao_id);
      if (!alvo) continue;
      const pessoa: MembroComissao = { slug: m.slug, nomeUrna: m.nome_urna };
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
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<{ andamento: ParticipacaoComissao[]; finalizadas: ParticipacaoComissao[]; ok: boolean }> {
  const VAZIO = { andamento: [], finalizadas: [], ok: false };
  try {
    // A consulta antiga filtrava só por `vereador_id`, sem a cidade —
    // mesmo caso de `getTemasVereador`. Agora filtra pelos dois.
    const data = await q.participacoesEmComissoes(idMunicipio, vereadorId);
    if (!data) return VAZIO;

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
