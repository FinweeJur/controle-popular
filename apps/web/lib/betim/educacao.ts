import * as q from "@/lib/db/queries/betim";

export const REDE_LABELS: Record<string, string> = {
  "1": "Federal",
  "2": "Estadual",
  "3": "Municipal",
  "4": "Privada",
};

export interface EscolaRow {
  id_inep: string;
  nome: string;
  rede: string | null;
  matriculas: number | null;
}

export interface EducacaoData {
  configured: boolean;
  totalEscolas: number;
  totalMatriculas: number;
  porRede: { rede: string; qtd: number }[];
  escolas: EscolaRow[];
}

const EMPTY: EducacaoData = {
  configured: false,
  totalEscolas: 0,
  totalMatriculas: 0,
  porRede: [],
  escolas: [],
};

export async function getEducacaoData(idMunicipio: string): Promise<EducacaoData> {
  try {
    const data = await q.listarEscolas(idMunicipio);
    if (!data) return EMPTY;
    // `count(*) over ()` vem repetido em toda linha.
    const count = data[0]?.total ?? 0;
    const error = null;

    if (error || !data) return { ...EMPTY, configured: true };

    const rows = data as EscolaRow[];
    const totalMatriculas = rows.reduce((acc, r) => acc + (r.matriculas ?? 0), 0);

    const redeCounts = new Map<string, number>();
    for (const r of rows) {
      const key = r.rede ?? "?";
      redeCounts.set(key, (redeCounts.get(key) ?? 0) + 1);
    }

    return {
      configured: true,
      totalEscolas: count ?? rows.length,
      totalMatriculas,
      porRede: [...redeCounts.entries()].map(([rede, qtd]) => ({ rede, qtd })),
      escolas: rows,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
