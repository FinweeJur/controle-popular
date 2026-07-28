import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

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

export async function getEducacaoData(): Promise<EducacaoData> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    const { data, count, error } = await supabase
      .from("escolas")
      .select("id_inep, nome, rede, matriculas", { count: "exact" })
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .order("nome", { ascending: true });

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
