import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface ComercioEssencial {
  id: string;
  nome: string;
  tipo: "supermercado" | "farmacia";
  bairro: string | null;
  endereco: string | null;
  telefone: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ComerciosData {
  configured: boolean;
  ok: boolean;
  rows: ComercioEssencial[];
}

const VAZIO: ComerciosData = { configured: false, ok: false, rows: [] };

// Coordenadas dos escritórios das regionais (regionais.betim.digital),
// usadas só pra ordenar por proximidade -- não filtram nada (o dado de
// bairro do OSM não bate 1:1 com a lista oficial de bairros da
// Prefeitura, ver etl/apis/osm_comercios.py).
const CENTRO = { lat: -19.9667181, lng: -44.2017521 };
const CITROLANDIA = { lat: -20.029838890885337, lng: -44.22838104842431 };

function distanciaKm(a: { lat: number; lng: number }, b: { lat: number | null; lng: number | null }): number {
  if (b.lat == null || b.lng == null) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

interface Row {
  id: string;
  nome: string;
  tipo: string;
  bairro: string | null;
  endereco: string | null;
  telefone: string | null;
  lat: number | string | null;
  lng: number | string | null;
}

/**
 * Supermercados e farmácias de Betim (OpenStreetMap, `etl/apis/osm_comercios.py`,
 * migration 0019). Ordenados por proximidade ao Centro e à Regional
 * Citrolândia primeiro (pedido do usuário) -- o resto por nome.
 */
export async function getComerciosEssenciais(
  idMunicipio: IdMunicipio
): Promise<ComerciosData> {
  try {
    const data = await q.comerciosEssenciais(idMunicipio);
    if (!data) return VAZIO;

    const rows = (data as Row[]).map((r) => ({
      id: r.id,
      nome: r.nome,
      tipo: r.tipo as "supermercado" | "farmacia",
      bairro: r.bairro,
      endereco: r.endereco,
      telefone: r.telefone,
      lat: r.lat != null ? Number(r.lat) : null,
      lng: r.lng != null ? Number(r.lng) : null,
    }));

    rows.sort((a, b) => {
      const distA = Math.min(distanciaKm(CENTRO, a), distanciaKm(CITROLANDIA, a));
      const distB = Math.min(distanciaKm(CENTRO, b), distanciaKm(CITROLANDIA, b));
      if (distA !== distB) return distA - distB;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    return { configured: true, ok: true, rows };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
