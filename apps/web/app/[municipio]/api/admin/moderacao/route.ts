import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import { getSupabaseServiceClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

const MODERATED_TABLES = ["zap_estabelecimentos", "classificados"] as const;
type ModeratedTable = (typeof MODERATED_TABLES)[number];

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const [zap, classificados] = await Promise.all([
    supabase
      .from("zap_estabelecimentos")
      .select("id, nome, whatsapp, categoria, descricao, bairro, created_at")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("aprovado", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("classificados")
      .select("id, titulo, descricao, categoria, preco, contato_whatsapp, created_at")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("aprovado", false)
      .order("created_at", { ascending: false }),
  ]);

  return Response.json({
    zap_estabelecimentos: zap.data ?? [],
    classificados: classificados.data ?? [],
  });
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

  const tabela = body.tabela;
  const id = body.id;
  const aprovado = body.aprovado;

  if (
    typeof tabela !== "string" ||
    !MODERATED_TABLES.includes(tabela as ModeratedTable) ||
    typeof id !== "string" ||
    typeof aprovado !== "boolean"
  ) {
    return Response.json({ error: "tabela/id/aprovado inválidos." }, { status: 400 });
  }

  if (aprovado) {
    const { error } = await supabase.from(tabela).update({ aprovado: true }).eq("id", id);
    if (error) return Response.json({ error: "Erro ao aprovar." }, { status: 500 });
  } else {
    // Reject = delete the pending row (it was never public anyway).
    const { error } = await supabase.from(tabela).delete().eq("id", id);
    if (error) return Response.json({ error: "Erro ao rejeitar." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
