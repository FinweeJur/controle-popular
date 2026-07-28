import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export interface NaturezaAno {
  natureza: string;
  qtd: number;
}

export interface SegurancaData {
  configured: boolean;
  ok: boolean;
  anoRecente: number | null;
  anoAnterior: number | null;
  totalRecente: number;
  totalAnterior: number;
  porNaturezaRecente: NaturezaAno[];
  /** Variação percentual do total do ano recente vs. o anterior. */
  variacaoTotal: number | null;
}

const VAZIO: SegurancaData = {
  configured: false,
  ok: false,
  anoRecente: null,
  anoAnterior: null,
  totalRecente: 0,
  totalAnterior: 0,
  porNaturezaRecente: [],
  variacaoTotal: null,
};

interface Row {
  ano: number;
  mes: number;
  natureza: string;
  qtd: number;
}

/**
 * Ocorrências criminais violentas (Sejusp-MG, `etl/apis/crimes_mg.py`).
 *
 * O ano mais recente costuma vir INCOMPLETO (só os meses já publicados) —
 * comparar o total bruto do ano corrente com o ano fechado anterior
 * subestimaria a queda/alta real. Por isso a comparação usa só os MESES
 * QUE EXISTEM NOS DOIS ANOS (ex.: jan-fev de 2026 vs. jan-fev de 2025),
 * não o ano inteiro -- mesmo cuidado que `/saude` já tem com 2025 parcial.
 */
export async function getSegurancaData(): Promise<SegurancaData> {
  const supabase = getSupabaseClient();
  if (!supabase) return VAZIO;

  try {
    const { data, error } = await supabase
      .from("seguranca_ocorrencias")
      .select("ano, mes, natureza, qtd")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
    if (error || !data || data.length === 0) return { ...VAZIO, configured: true };

    const rows = data as Row[];
    const anos = [...new Set(rows.map((r) => r.ano))].sort((a, b) => b - a);
    const anoRecente = anos[0] ?? null;
    const anoAnterior = anos[1] ?? null;
    if (anoRecente === null) return { ...VAZIO, configured: true };

    const mesesComDadoNoAnoRecente = new Set(
      rows.filter((r) => r.ano === anoRecente).map((r) => r.mes)
    );

    const doAnoRecente = rows.filter((r) => r.ano === anoRecente);
    const doAnoAnteriorMesmosMeses =
      anoAnterior !== null
        ? rows.filter((r) => r.ano === anoAnterior && mesesComDadoNoAnoRecente.has(r.mes))
        : [];

    const totalRecente = doAnoRecente.reduce((acc, r) => acc + r.qtd, 0);
    const totalAnterior = doAnoAnteriorMesmosMeses.reduce((acc, r) => acc + r.qtd, 0);

    const porNaturezaMap = new Map<string, number>();
    for (const r of doAnoRecente) {
      porNaturezaMap.set(r.natureza, (porNaturezaMap.get(r.natureza) ?? 0) + r.qtd);
    }
    const porNaturezaRecente = [...porNaturezaMap.entries()]
      .map(([natureza, qtd]) => ({ natureza, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    const variacaoTotal =
      totalAnterior > 0 ? ((totalRecente - totalAnterior) / totalAnterior) * 100 : null;

    return {
      configured: true,
      ok: true,
      anoRecente,
      anoAnterior,
      totalRecente,
      totalAnterior,
      porNaturezaRecente,
      variacaoTotal,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
