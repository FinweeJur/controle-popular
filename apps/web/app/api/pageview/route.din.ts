import type { NextRequest } from "next/server";
import { pathValido } from "@/lib/pageviews/validar";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";
import { inserirPageView, rankingPageViews } from "@/lib/db/queries/betimD1";

/**
 * Contador de visualizações das páginas principais do portal.
 *
 * ⟲ 2026-08-13: migrado de Postgres para D1 (`lib/db/queries/betimD1.ts`,
 * tabela `page_views` em `lib/db/schema.d1.ts`). Era `DATABASE_URL`
 * apontando para `127.0.0.1:5432` (a máquina de build) — em produção,
 * dentro da Cloudflare, `127.0.0.1` é a própria Cloudflare, que não acha
 * ninguém, e a rota respondia 500 (medido ao vivo). D1 roda no mesmo
 * runtime do Worker, então este problema de alcance não existe mais.
 *
 * ROTA GLOBAL, fora de `[municipio]`/`congresso`/`judiciario`: o `path`
 * gravado já carrega a zona/cidade ("/betim/prefeitura/contratos",
 * "/congresso/proposicoes"), então recortar esta rota por zona só
 * triplicaria o código para escrever na MESMA tabela.
 *
 * POST é o beacon de fogo-e-esquece disparado por
 * `app/components/PageViewBeacon.tsx` a cada carregamento de página —
 * "visualização" aqui é CARREGAMENTO, não visitante único, sem dedupe por
 * sessão/cookie. GET alimenta o ranking em `/dados/populares`.
 */
export const runtime = "nodejs";

const LIMITE_PADRAO = 100;
const LIMITE_MAXIMO = 500;

export async function POST(request: NextRequest) {
  // Alta frequência (1 escrita por navegação): ver `lib/rate-limit.ts`.
  const { permitido, retryAfter } = await limitarAltaFrequencia(ipDoCliente(request));
  if (!permitido) return respostaLimiteExcedido(retryAfter);

  const path = request.nextUrl.searchParams.get("path");
  if (!pathValido(path)) {
    return Response.json({ ok: false, error: "path inválido" }, { status: 400 });
  }

  try {
    const gravado = await inserirPageView(path);
    // Sem D1 (binding ausente): responde ok mesmo assim — é fogo-e-esquece,
    // o cliente (sendBeacon) nem lê o corpo da resposta.
    if (gravado === null) return Response.json({ ok: true });
  } catch {
    // Uma escrita de contador perdida não é erro que valha devolver: o
    // objetivo é aproximado, não auditável (ver migration 0059 no Postgres,
    // mantida como referência histórica do desenho).
  }
  return Response.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const limite = Math.min(
    LIMITE_MAXIMO,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || LIMITE_PADRAO)
  );

  try {
    const linhas = await rankingPageViews(limite);
    if (linhas === null) return Response.json({ rows: [] });
    return Response.json({
      rows: linhas.map((r) => ({
        path: r.path,
        contagem: r.contagem,
        atualizado_em: r.atualizado_em,
      })),
    });
  } catch {
    return Response.json({ error: "Ranking indisponível." }, { status: 500 });
  }
}
