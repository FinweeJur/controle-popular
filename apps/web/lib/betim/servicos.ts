import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

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

export async function fetchContatosUteis(): Promise<{
  rows: ContatoUtil[];
  configured: boolean;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false };

  const { data, error } = await supabase
    .from("contatos_uteis")
    .select("nome, telefone, categoria, ordem")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .order("ordem", { ascending: true });

  if (error || !data) return { rows: [], configured: true };
  return { rows: data as ContatoUtil[], configured: true };
}

export interface ColetaLixoRow {
  bairro: string;
  tipo: string | null;
  dias_semana: string[] | null;
  horario: string | null;
}

export async function fetchColetaLixo(bairro?: string): Promise<{
  rows: ColetaLixoRow[];
  configured: boolean;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false };

  let query = supabase
    .from("coleta_lixo")
    .select("bairro, tipo, dias_semana, horario")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .order("bairro", { ascending: true });

  if (bairro) query = query.ilike("bairro", `%${bairro}%`);

  const { data, error } = await query;
  if (error || !data) return { rows: [], configured: true };
  return { rows: data as ColetaLixoRow[], configured: true };
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

export async function fetchFarmaciasPlantao(): Promise<{
  rows: FarmaciaPlantao[];
  configured: boolean;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false };

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("farmacias_plantao")
    .select("id, nome, endereco, telefone, plantao_inicio, plantao_fim, h24, lat, lng")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .or(`h24.eq.true,and(plantao_inicio.lte.${today},plantao_fim.gte.${today})`)
    .order("nome", { ascending: true });

  if (error || !data) return { rows: [], configured: true };
  return { rows: data as FarmaciaPlantao[], configured: true };
}

/** Waze deep link — falls back to a text-search URL when coordinates are missing. */
export function wazeLink(nome: string, lat: number | null, lng: number | null): string {
  if (lat !== null && lng !== null) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(`${nome} Betim MG`)}`;
}
