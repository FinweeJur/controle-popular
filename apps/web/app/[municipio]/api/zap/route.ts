import type { NextRequest } from "next/server";
import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";
import { fetchZapEstabelecimentos, validateZapSubmission } from "@/lib/betim/zap";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const categoria = sp.get("categoria") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const bairrosParam = sp.get("bairros") ?? undefined;
  const bairros = bairrosParam ? bairrosParam.split(",") : undefined;

  const { rows, configured } = await fetchZapEstabelecimentos({ categoria, q, bairros });

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
    return Response.json(
      { error: "Cadastro indisponível no momento." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  // Honeypot: a hidden field real users never fill; bots that autofill every
  // input trip it. Silently pretend success instead of telling the bot why.
  if (typeof body.site === "string" && body.site.length > 0) {
    return Response.json({ ok: true });
  }

  const validated = validateZapSubmission(body);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const { error } = await supabase.from("zap_estabelecimentos").insert({
    id_municipio: ID_MUNICIPIO_DEFAULT,
    nome: validated.value.nome,
    whatsapp: validated.value.whatsapp,
    categoria: validated.value.categoria,
    descricao: validated.value.descricao || null,
    bairro: validated.value.bairro || null,
    aprovado: false,
  });

  if (error) {
    return Response.json({ error: "Não foi possível cadastrar." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
