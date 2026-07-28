import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import { getSupabaseServiceClient } from "@/lib/betim/supabase";

const EDITABLE_FIELDS = [
  "nome_comercio",
  "plano",
  "banner_url",
  "link",
  "ativo",
  "data_inicio",
  "data_fim",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) patch[field] = body[field];
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("anuncios")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Erro ao atualizar anúncio." }, { status: 500 });
  }

  return Response.json({ row: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const { id } = await params;
  const { error } = await supabase.from("anuncios").delete().eq("id", id);

  if (error) {
    return Response.json({ error: "Erro ao remover anúncio." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
