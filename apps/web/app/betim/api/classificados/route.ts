import type { NextRequest } from "next/server";
import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";
import {
  CLASSIFICADO_EXPIRACAO_DIAS,
  fetchClassificados,
  validateClassificadoSubmission,
} from "@/lib/betim/classificados";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const categoria = sp.get("categoria") ?? undefined;
  const q = sp.get("q") ?? undefined;

  const { rows, configured } = await fetchClassificados({ categoria, q });

  if (!configured) {
    return Response.json({
      rows: [],
      message: "Fonte de dados não configurada (variáveis Supabase ausentes).",
    });
  }

  return Response.json({ rows });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Cadastro indisponível no momento." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (typeof body.site === "string" && body.site.length > 0) {
    return Response.json({ ok: true });
  }

  const validated = validateClassificadoSubmission(body);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + CLASSIFICADO_EXPIRACAO_DIAS);

  const { error } = await supabase.from("classificados").insert({
    id_municipio: ID_MUNICIPIO_DEFAULT,
    titulo: validated.value.titulo,
    descricao: validated.value.descricao,
    categoria: validated.value.categoria,
    preco: validated.value.preco,
    contato_whatsapp: validated.value.contato_whatsapp,
    expira_em: expiraEm.toISOString().slice(0, 10),
    aprovado: false,
  });

  if (error) {
    return Response.json({ error: "Não foi possível publicar o anúncio." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
