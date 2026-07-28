import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import { getSupabaseServiceClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";
import { ANUNCIO_PLANOS } from "@/lib/betim/anuncios";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("anuncios")
    .select("*")
    .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "Erro ao listar anúncios." }, { status: 500 });
  }

  return Response.json({ rows: data });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const nome_comercio = typeof body.nome_comercio === "string" ? body.nome_comercio.trim() : "";
  const plano = typeof body.plano === "string" ? body.plano : "";
  const banner_url = typeof body.banner_url === "string" ? body.banner_url : null;
  const link = typeof body.link === "string" ? body.link : null;
  const data_inicio = typeof body.data_inicio === "string" ? body.data_inicio : null;
  const data_fim = typeof body.data_fim === "string" ? body.data_fim : null;

  if (!nome_comercio || !ANUNCIO_PLANOS.includes(plano as (typeof ANUNCIO_PLANOS)[number])) {
    return Response.json({ error: "nome_comercio/plano inválidos." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("anuncios")
    .insert({
      id_municipio: ID_MUNICIPIO_DEFAULT,
      nome_comercio,
      plano,
      banner_url,
      link,
      data_inicio,
      data_fim,
      ativo: false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Erro ao criar anúncio." }, { status: 500 });
  }

  return Response.json({ row: data });
}
