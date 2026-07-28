import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";
import { normalizeWhatsapp } from "@/lib/betim/zap";

export const CLASSIFICADO_CATEGORIAS = [
  "imoveis",
  "veiculos",
  "eletronicos",
  "agro",
  "servicos",
  "outros",
] as const;

export type ClassificadoCategoria = (typeof CLASSIFICADO_CATEGORIAS)[number];

export const CLASSIFICADO_CATEGORIA_LABELS: Record<ClassificadoCategoria, string> = {
  imoveis: "Imóveis",
  veiculos: "Veículos",
  eletronicos: "Eletrônicos",
  agro: "Agro",
  servicos: "Serviços",
  outros: "Outros",
};

/** Listings run for 60 days (plan §10) before expiring from public view. */
export const CLASSIFICADO_EXPIRACAO_DIAS = 60;

export interface ClassificadoAnuncio {
  id: string;
  categoria: string | null;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  contato_whatsapp: string | null;
  expira_em: string | null;
}

export async function fetchClassificados(params: {
  categoria?: string;
  q?: string;
}): Promise<{ rows: ClassificadoAnuncio[]; configured: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false };

  let query = supabase
    .from("classificados")
    .select("id, categoria, titulo, descricao, preco, contato_whatsapp, expira_em")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .eq("aprovado", true)
    .gte("expira_em", new Date().toISOString().slice(0, 10))
    .order("created_at", { ascending: false });

  if (params.categoria) query = query.eq("categoria", params.categoria);
  if (params.q) query = query.ilike("titulo", `%${params.q}%`);

  const { data, error } = await query;
  if (error || !data) return { rows: [], configured: true };
  return { rows: data as ClassificadoAnuncio[], configured: true };
}

export interface ClassificadoSubmission {
  titulo: string;
  descricao: string;
  categoria: string;
  preco: number | null;
  contato_whatsapp: string;
}

export function validateClassificadoSubmission(
  body: Record<string, unknown>
): { ok: true; value: ClassificadoSubmission } | { ok: false; error: string } {
  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  const categoria = typeof body.categoria === "string" ? body.categoria : "";
  const whatsappRaw = typeof body.contato_whatsapp === "string" ? body.contato_whatsapp : "";
  const precoRaw = body.preco;

  if (titulo.length < 3 || titulo.length > 150) {
    return { ok: false, error: "Título inválido." };
  }
  if (descricao.length < 5 || descricao.length > 1000) {
    return { ok: false, error: "Descrição deve ter entre 5 e 1000 caracteres." };
  }
  if (!CLASSIFICADO_CATEGORIAS.includes(categoria as ClassificadoCategoria)) {
    return { ok: false, error: "Categoria inválida." };
  }
  const contato_whatsapp = normalizeWhatsapp(whatsappRaw);
  if (!contato_whatsapp) {
    return { ok: false, error: "WhatsApp inválido — use DDD + número." };
  }

  let preco: number | null = null;
  if (precoRaw !== undefined && precoRaw !== null && precoRaw !== "") {
    const n = Number(precoRaw);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: "Preço inválido." };
    }
    preco = n;
  }

  return { ok: true, value: { titulo, descricao, categoria, preco, contato_whatsapp } };
}
