import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface ContatoUtil {
  nome: string;
  telefone: string | null;
  categoria: string | null;
  ordem: number | null;
}

export const CONTATO_CATEGORIA_LABELS: Record<string, string> = {
  emergencia: "Emergência",
  prefeitura: "Prefeitura",
  camara: "Câmara Municipal",
  saude: "Saúde",
  outros: "Outros",
};

export async function fetchContatosUteis(idMunicipio: IdMunicipio): Promise<{
  rows: ContatoUtil[];
  configured: boolean;
}> {
  try {
    const data = await q.contatosUteis(idMunicipio);
    if (!data) return { rows: [], configured: false };
    return { rows: data as ContatoUtil[], configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

export interface ColetaLixoRow {
  bairro: string;
  tipo: string | null;
  dias_semana: string[] | null;
  horario: string | null;
}

export async function fetchColetaLixo(
  idMunicipio: IdMunicipio,
  bairro?: string
): Promise<{
  rows: ColetaLixoRow[];
  configured: boolean;
}> {
  try {
    const data = await q.coletaLixo(idMunicipio, bairro);
    if (!data) return { rows: [], configured: false };
    return { rows: data as ColetaLixoRow[], configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

const DIA_SEMANA_ICS: Record<string, string> = {
  domingo: "SU",
  segunda: "MO",
  terca: "TU",
  "terça": "TU",
  quarta: "WE",
  quinta: "TH",
  sexta: "FR",
  sabado: "SA",
  "sábado": "SA",
};

/** Maps a free-text weekday name to its two-letter iCalendar RRULE code. */
export function diaSemanaParaIcs(dia: string): string | null {
  const normalized = dia
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return DIA_SEMANA_ICS[normalized] ?? DIA_SEMANA_ICS[dia.toLowerCase()] ?? null;
}

export interface FarmaciaPlantao {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  plantao_inicio: string | null;
  plantao_fim: string | null;
  h24: boolean;
  lat: number | null;
  lng: number | null;
}

export async function fetchFarmaciasPlantao(idMunicipio: IdMunicipio): Promise<{
  rows: FarmaciaPlantao[];
  configured: boolean;
}> {
  try {
    const data = await q.farmaciasPlantao(idMunicipio);
    if (!data) return { rows: [], configured: false };
    return { rows: data as FarmaciaPlantao[], configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

/**
 * Waze deep link — cai para busca por TEXTO quando faltam coordenadas.
 *
 * A cidade e a UF entram na busca porque sem elas o Waze acha uma
 * "Farmácia São João" em qualquer lugar do país. Eram literais "Betim MG":
 * numa segunda cidade, o link mandaria o morador para o município errado
 * — dos poucos casos em que a string de cidade não errava um texto, e sim
 * um DESTINO de navegação.
 */
export function wazeLink(
  nome: string,
  lat: number | null,
  lng: number | null,
  cidade: { nome: string; uf: string }
): string {
  if (lat !== null && lng !== null) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(`${nome} ${cidade.nome} ${cidade.uf}`)}`;
}
