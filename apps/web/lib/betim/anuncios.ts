import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

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

/**
 * Active ads for today, premium slot first (plan §10: "premium top slot").
 *
 * O premium-primeiro e o tratamento de `data_fim` nula ("sem prazo,
 * enquanto o site existir" — é divulgação única, não mensalidade) agora
 * moram na consulta; ver `anunciosAtivos()`.
 */
export async function fetchAnunciosAtivos(idMunicipio: IdMunicipio): Promise<Anuncio[]> {
  try {
    const data = await q.anunciosAtivos(idMunicipio);
    return (data ?? []) as Anuncio[];
  } catch {
    return [];
  }
}
