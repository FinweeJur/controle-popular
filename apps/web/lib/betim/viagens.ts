import { viagensDoMunicipio } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Diárias e viagens oficiais — leitura da tabela `diarias`.
 *
 * A tabela guarda DUAS coisas que a lei trata como rubricas distintas:
 *
 * - `diaria` — a verba de alimentação e hospedagem paga por dia de
 *   afastamento (é o que a Câmara de Betim publica);
 * - `passagem_aerea` — o bilhete comprado pela administração (é o que a
 *   Prefeitura de Belo Horizonte publica, e a única coisa de viagem que ela
 *   publica: nenhum dos 602 datasets do CKAN nem dos procedimentos do GRP
 *   traz diária).
 *
 * Somar as duas num total só e chamar de "diárias" afirmaria um gasto que
 * não existe com esse nome. Por isso o agrupamento por natureza é a
 * estrutura desta camada, e não um detalhe de exibição: quem chama recebe os
 * grupos separados e não tem como somá-los por descuido.
 */

export type Natureza = "diaria" | "passagem_aerea";

export interface ViagemRow {
  id: string;
  natureza: string | null;
  /** O poder ('prefeitura' / 'camara'). O órgão real vai em `orgaoNome`. */
  orgao: string | null;
  orgaoNome: string | null;
  beneficiario: string | null;
  cargo: string | null;
  /** Não-nulo só quando a linha é de um vereador (Câmara). */
  vereadorId: string | null;
  /**
   * Cidade de partida. Existe porque a fonte publica ida e volta como duas
   * linhas: sem ela, a perna de volta aparece como "viagem para a própria
   * cidade" e parece defeito do portal.
   */
  origem: string | null;
  destino: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  qtdDiarias: number | null;
  /** `null` é "sem ônus para o município" ou valor não publicado — nunca 0. */
  valor: number | null;
  motivo: string | null;
  linkFonte: string | null;
}

export interface GrupoViagens {
  natureza: string;
  rotulo: string;
  linhas: ViagemRow[];
  /** Soma dos valores conhecidos. */
  total: number;
  /** Quantas linhas do grupo não têm valor — o total não fala por elas. */
  semValor: number;
}

export interface ViagensData {
  grupos: GrupoViagens[];
  totalLinhas: number;
  /** URL de uma fonte por grupo, para creditar sem inventar. */
  fontes: string[];
  /** `false` quando o banco não respondeu — degrada, não quebra. */
  ok: boolean;
}

const VAZIO: ViagensData = { grupos: [], totalLinhas: 0, fontes: [], ok: false };

const ROTULO: Record<string, string> = {
  diaria: "Diárias",
  passagem_aerea: "Passagens aéreas",
};

/**
 * Natureza ausente é tratada como `diaria`: as linhas anteriores à migration
 * 0031 são as da Câmara de Betim, que são diária de verdade. Chutar
 * "passagem" nelas seria inventar; o default segue o que aquelas linhas são.
 */
function naturezaDe(r: { natureza: string | null }): string {
  return r.natureza?.trim() || "diaria";
}

export async function getViagens(idMunicipio: IdMunicipio): Promise<ViagensData> {
  try {
    const linhas = await viagensDoMunicipio(idMunicipio);
    if (!linhas) return VAZIO;
    if (linhas.length === 0) return { ...VAZIO, ok: true };

    const porNatureza = new Map<string, ViagemRow[]>();
    for (const r of linhas) {
      const nat = naturezaDe(r);
      const lista = porNatureza.get(nat) ?? [];
      lista.push({
        id: r.id,
        natureza: r.natureza,
        orgao: r.orgao,
        orgaoNome: r.orgao_nome,
        beneficiario: r.beneficiario,
        cargo: r.cargo,
        vereadorId: r.vereador_id,
        origem: r.origem,
        destino: r.destino,
        dataInicio: r.data_inicio,
        dataFim: r.data_fim,
        qtdDiarias: r.qtd_diarias,
        valor: r.valor,
        motivo: r.motivo,
        linkFonte: r.link_fonte,
      });
      porNatureza.set(nat, lista);
    }

    const grupos: GrupoViagens[] = [...porNatureza.entries()]
      .map(([natureza, ls]) => ({
        natureza,
        rotulo: ROTULO[natureza] ?? natureza,
        linhas: ls,
        total: ls.reduce((acc, l) => acc + (l.valor ?? 0), 0),
        semValor: ls.filter((l) => l.valor == null).length,
      }))
      .sort((a, b) => b.linhas.length - a.linhas.length);

    const fontes = [
      ...new Set(
        linhas.map((r) => r.link_fonte).filter((u): u is string => Boolean(u))
      ),
    ];

    return { grupos, totalLinhas: linhas.length, fontes, ok: true };
  } catch {
    return VAZIO;
  }
}
