import { getSupabaseServiceClient } from "@/lib/betim/supabase";

/**
 * Increments the click counter for a Zap Betim listing. Uses the
 * service-role client (server-side only) because RLS grants anon only
 * SELECT + INSERT on this table, not UPDATE.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: false }, { status: 503 });
  }

  const { data, error: selectError } = await supabase
    .from("zap_estabelecimentos")
    .select("cliques")
    .eq("id", id)
    .eq("aprovado", true)
    .maybeSingle();

  if (selectError || !data) {
    return Response.json({ ok: false }, { status: 404 });
  }

  const { error } = await supabase
    .from("zap_estabelecimentos")
    .update({ cliques: (data.cliques ?? 0) + 1 })
    .eq("id", id);

  if (error) {
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
