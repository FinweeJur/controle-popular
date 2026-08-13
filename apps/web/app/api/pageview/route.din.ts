import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { pathValido } from "@/lib/pageviews/validar";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarAltaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";

/**
 * Contador de visualizações das páginas principais do portal
 * (`page_views`, migration `0059_page_views.sql`).
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

  const db = getDb();
  // Sem banco (DATABASE_URL ausente): responde ok mesmo assim — é
  // fogo-e-esquece, o cliente (sendBeacon) nem lê o corpo da resposta.
  if (!db) return Response.json({ ok: true });

  try {
    await db.execute(sql`
      insert into page_views (path, contagem, atualizado_em)
      values (${path}, 1, now())
      on conflict (path) do update
        set contagem = page_views.contagem + 1,
            atualizado_em = now()
    `);
  } catch {
    // Uma escrita de contador perdida não é erro que valha devolver: o
    // objetivo é aproximado, não auditável (ver migration).
  }
  return Response.json({ ok: true });
}

type LinhaPageView = { path: string; contagem: string | number; atualizado_em: string };

export async function GET(request: NextRequest) {
  const limite = Math.min(
    LIMITE_MAXIMO,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || LIMITE_PADRAO)
  );

  const db = getDb();
  if (!db) return Response.json({ rows: [] });

  try {
    const linhas = await db.execute<LinhaPageView>(sql`
      select path, contagem, atualizado_em
        from page_views
       order by contagem desc
       limit ${limite}
    `);
    return Response.json({
      // `contagem` é bigint: o driver devolve string para não perder
      // precisão acima de 2^53. Nesta escala (contador de portal cívico)
      // Number() nunca chega perto do limite de segurança.
      rows: (linhas.rows ?? []).map((r) => ({
        path: r.path,
        contagem: Number(r.contagem),
        atualizado_em: r.atualizado_em,
      })),
    });
  } catch (e) {
    // 42P01 = tabela não existe (banco ainda não migrado neste ambiente).
    if ((e as { code?: string }).code === "42P01") return Response.json({ rows: [] });
    return Response.json({ error: "Ranking indisponível." }, { status: 500 });
  }
}
