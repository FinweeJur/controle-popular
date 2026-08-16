import { listarComissoes, membrosDeComissoes, participacoesEmComissoes } from "@/lib/db/queries/betim";
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
  /**
   * Os demais integrantes, com o papel que a fonte informou.
   *
   * Era `MembroComissao[]` e a tela imprimia "MEMBRO" para todos. Funcionava
   * em Betim, cuja Câmara publica só "Membro"; Belo Horizonte distingue
   * **Membro Efetivo (76) de Membro Suplente (137)**, e mais 9
   * Vice-Presidentes. Achatar isso não é perda cosmética: suplente só vota
   * quando o efetivo falta, e a tela dizia que os dois eram a mesma coisa —
   * com o suplente aparecendo quase duas vezes mais que o efetivo.
   */
  membros: (MembroComissao & { papel: string })[];
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
      listarComissoes(idMunicipio),
      membrosDeComissoes(idMunicipio),
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
      else alvo.membros.push({ ...pessoa, papel: m.papel || "Membro" });
    }

    // Efetivo antes de suplente: a ordem em que a fonte devolve é a de
    // raspagem, e listar suplente primeiro sugeriria precedência que não
    // existe.
    const peso = (p: string) =>
      p.toLowerCase().includes("suplente") ? 2 : p.toLowerCase().includes("vice") ? 0 : 1;
    for (const c of porComissao.values()) {
      c.membros.sort((a, b) => peso(a.papel) - peso(b.papel));
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
    const data = await participacoesEmComissoes(idMunicipio, vereadorId);
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
