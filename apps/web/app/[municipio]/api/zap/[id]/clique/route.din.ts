import { incrementarCliquesZapD1 } from "@/lib/db/queries/betimD1";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";

/**
 * Soma um clique num negócio do Zap.
 *
 * Eram duas idas ao banco (ler `cliques`, gravar `cliques + 1`) com o
 * cliente `service_role`, porque a RLS do Supabase só dava SELECT e INSERT
 * ao papel anônimo nesta tabela. Sem RLS no caminho, virou um UPDATE só,
 * atômico — o que também fecha a janela em que dois cliques simultâneos
 * liam o mesmo número e gravavam o mesmo, perdendo uma contagem.
 *
 * ⟲ 2026-08-13: migrado de Postgres para D1 — mesmo motivo do
 * `api/pageview` (ver o cabeçalho daquele arquivo). `zap_estabelecimentos`
 * em D1 só tem as linhas cadastradas via D1 depois desta migration; a
 * tabela homônima do Postgres continua existindo, mas não recebe mais
 * escrita — é a mesma divergência documentada em `api/zap/route.din.ts`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ municipio: string; id: string }> }
) {
  // Alta frequência (1 escrita por clique real): ver `lib/rate-limit.ts`.
  const { permitido, retryAfter } = await limitarAltaFrequencia(ipDoCliente(request));
  if (!permitido) return respostaLimiteExcedido(retryAfter);

  const { municipio, id } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ ok: false }, { status: 404 });

  try {
    const row = await incrementarCliquesZapD1(cidade.id_municipio, id);
    // Sem linha: não existe, não é desta cidade, ou não está aprovado.
    if (!row) return Response.json({ ok: false }, { status: 404 });
    return Response.json({ ok: true, cliques: row.cliques });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
