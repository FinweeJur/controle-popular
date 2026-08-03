import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface AvaliacaoPntp {
  poder: "Executivo" | "Legislativo";
  ano: number;
  indiceTransparencia: number; // 0-1
  nivelTransparencia: string;
  variacaoIndice: number | null;
  variacaoNivel: string | null;
  historicoNivel: string | null;
  posicaoRankingUf: number | null;
  totalAvaliadosUf: number | null;
  linkSite: string | null;
}

export interface NotaTransparenciaData {
  configured: boolean;
  ok: boolean;
  prefeitura: AvaliacaoPntp | null;
  camara: AvaliacaoPntp | null;
}

const VAZIO: NotaTransparenciaData = {
  configured: false,
  ok: false,
  prefeitura: null,
  camara: null,
};

interface Row {
  poder: string;
  ano: number;
  indice_transparencia: number | string;
  nivel_transparencia: string;
  variacao_indice: number | string | null;
  variacao_nivel: string | null;
  historico_nivel: string | null;
  posicao_ranking_uf: number | null;
  total_avaliados_uf: number | null;
  link_site: string | null;
}

function mapRow(r: Row): AvaliacaoPntp {
  return {
    poder: r.poder as "Executivo" | "Legislativo",
    ano: r.ano,
    indiceTransparencia: Number(r.indice_transparencia),
    nivelTransparencia: r.nivel_transparencia,
    variacaoIndice: r.variacao_indice != null ? Number(r.variacao_indice) : null,
    variacaoNivel: r.variacao_nivel,
    historicoNivel: r.historico_nivel,
    posicaoRankingUf: r.posicao_ranking_uf,
    totalAvaliadosUf: r.total_avaliados_uf,
    linkSite: r.link_site,
  };
}

/**
 * Nota de Transparência (PNTP/ATRICON, `etl/apis/pntp.py`, migration 0018).
 * A planilha do PNTP é NACIONAL (11.697 avaliações); o recorte por
 * estado sai da UF da cidade. `posicaoRankingUf` é a posição
 * real de Betim entre as prefeituras (ou câmaras) do estado avaliadas no
 * mesmo ciclo, não uma estimativa.
 */
export async function getNotaTransparenciaData(
  idMunicipio: IdMunicipio
): Promise<NotaTransparenciaData> {
  try {
    const data = await q.notaTransparencia(idMunicipio);
    const error = null;
    if (!data) return VAZIO;
    if (error || !data || data.length === 0) return { ...VAZIO, configured: true };

    const rows = data as Row[];
    const maisRecentePorPoder = (poder: string) =>
      rows.find((r) => r.poder === poder) ?? null;

    const prefeituraRow = maisRecentePorPoder("Executivo");
    const camaraRow = maisRecentePorPoder("Legislativo");

    return {
      configured: true,
      ok: true,
      prefeitura: prefeituraRow ? mapRow(prefeituraRow) : null,
      camara: camaraRow ? mapRow(camaraRow) : null,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
