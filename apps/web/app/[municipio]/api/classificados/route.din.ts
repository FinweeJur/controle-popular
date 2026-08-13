import type { NextRequest } from "next/server";
import { inserirClassificadoD1 } from "@/lib/db/queries/betimD1";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";
import {
  CLASSIFICADO_EXPIRACAO_DIAS,
  fetchClassificados,
  validateClassificadoSubmission,
} from "@/lib/betim/classificados";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarBaixaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";

/**
 * Mesma divergência de `api/zap/route.din.ts`: GET lê do Postgres (fora do
 * escopo desta migration), POST grava em D1 desde 2026-08-13.
 */

/** Rota de cidade: `params.municipio` é o slug, e a consulta filtra por id. */
type Ctx = { params: Promise<{ municipio: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const categoria = sp.get("categoria") ?? undefined;
  const q = sp.get("q") ?? undefined;

  const { rows, configured } = await fetchClassificados(cidade.id_municipio, {
    categoria,
    q,
  });

  if (!configured) {
    return Response.json({
      rows: [],
      message: "Fonte de dados não configurada (DATABASE_URL ausente).",
    });
  }

  return Response.json({ rows });
}

export async function POST(request: NextRequest, { params }: Ctx) {
  // Baixa frequência (cadastro raro): ver `lib/rate-limit.ts`.
  const { permitido, retryAfter } = await limitarBaixaFrequencia(ipDoCliente(request));
  if (!permitido) return respostaLimiteExcedido(retryAfter);

  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

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

  try {
    // A cidade gravada vem do segmento da rota. Era a constante de build,
    // o que carimbava todo anúncio como de Betim independente de onde o
    // formulário estivesse.
    const row = await inserirClassificadoD1(cidade.id_municipio, {
      titulo: validated.value.titulo,
      descricao: validated.value.descricao,
      categoria: validated.value.categoria,
      preco: validated.value.preco,
      contato_whatsapp: validated.value.contato_whatsapp,
      expira_em: expiraEm.toISOString().slice(0, 10),
    });
    if (!row) {
      return Response.json({ error: "Cadastro indisponível no momento." }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível publicar o anúncio." }, { status: 500 });
  }
}
