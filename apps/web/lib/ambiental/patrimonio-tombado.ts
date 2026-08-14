import type {
  CategoriaPatrimonioTombado,
  PatrimonioTombadoRow,
} from "@/lib/db/queries/patrimonio-tombado";

/**
 * Lógica pura (sem React, sem banco) de `/ambiental/patrimonio-cultural` —
 * mesmo padrão de `lib/ambiental/legislacao-unificada.ts`: testável sem
 * montar componente.
 */

export const CATEGORIA_LABEL: Record<CategoriaPatrimonioTombado, string> = {
  BI: "Bem imóvel",
  BM: "Bem móvel",
  CH: "Centro histórico",
  CP: "Conjunto paisagístico",
};

export interface FiltroPatrimonioTombado {
  termoNormalizado?: string;
  categoria?: CategoriaPatrimonioTombado | "";
  municipio?: string | "";
}

function textoBuscaPatrimonio(r: PatrimonioTombadoRow): string {
  return [r.denominacao, r.denominacaoCompleta, r.municipio, r.distrito, r.classeSubclasse]
    .filter(Boolean)
    .join(" ");
}

export function filtrarPatrimonio(
  linhas: PatrimonioTombadoRow[],
  filtro: FiltroPatrimonioTombado,
  normalizar: (s: string) => string
): PatrimonioTombadoRow[] {
  const termo = filtro.termoNormalizado?.trim();
  return linhas.filter((r) => {
    if (filtro.categoria && r.categoria !== filtro.categoria) return false;
    if (filtro.municipio && r.municipio !== filtro.municipio) return false;
    if (termo && !normalizar(textoBuscaPatrimonio(r)).includes(termo)) return false;
    return true;
  });
}

export function contarPorCategoria(linhas: PatrimonioTombadoRow[]): Record<CategoriaPatrimonioTombado, number> {
  const cont: Record<CategoriaPatrimonioTombado, number> = { BI: 0, BM: 0, CH: 0, CP: 0 };
  for (const r of linhas) cont[r.categoria] += 1;
  return cont;
}

/** Municípios distintos, ordem alfabética — para popular o `<select>`. */
export function municipiosDistintos(linhas: PatrimonioTombadoRow[]): string[] {
  return [...new Set(linhas.map((r) => r.municipio))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
