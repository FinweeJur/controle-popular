import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

export const ANUNCIO_PLANOS = ["basico", "premium"] as const;
export type AnuncioPlano = (typeof ANUNCIO_PLANOS)[number];

/**
 * Preço único por divulgação, não mensalidade (corrigido 2026-07-21 —
 * o texto original dizia "/mês", mas o modelo real é pagamento único e
 * o anúncio fica no ar enquanto o site existir, sem data de expiração
 * obrigatória).
 */
export const ANUNCIO_PRECOS: Record<AnuncioPlano, number> = {
  basico: 200,
  premium: 400,
};

export interface Anuncio {
  id: string;
  nome_comercio: string;
  plano: string | null;
  banner_url: string | null;
  link: string | null;
}

/** Active ads for today, premium slot first (plan §10: "premium top slot"). */
export async function fetchAnunciosAtivos(): Promise<Anuncio[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const today = new Date().toISOString().slice(0, 10);
  // data_fim é opcional: null significa "sem prazo, enquanto o site
  // existir" (divulgação única, não mensalidade) — sem o `.or()` abaixo,
  // um anúncio sem data_fim nunca apareceria (o `.gte` original excluía
  // qualquer linha com data_fim nulo).
  const { data, error } = await supabase
    .from("anuncios")
    .select("id, nome_comercio, plano, banner_url, link")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .eq("ativo", true)
    .lte("data_inicio", today)
    .or(`data_fim.is.null,data_fim.gte.${today}`);

  if (error || !data) return [];

  const rows = data as Anuncio[];
  return rows.sort((a, b) => (a.plano === "premium" ? -1 : 0) - (b.plano === "premium" ? -1 : 0));
}
