import type { NextRequest } from "next/server";
import * as q from "@/lib/db/queries/betim";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";
import { fetchZapEstabelecimentos, validateZapSubmission } from "@/lib/betim/zap";

/** Rota de cidade: `params.municipio` é o slug, e a consulta filtra por id. */
type Ctx = { params: Promise<{ municipio: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const categoria = sp.get("categoria") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const bairrosParam = sp.get("bairros") ?? undefined;
  const bairros = bairrosParam ? bairrosParam.split(",") : undefined;

  const { rows, configured } = await fetchZapEstabelecimentos(cidade.id_municipio, {
    categoria,
    q,
    bairros,
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
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

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

  try {
    // A cidade gravada vem do segmento da rota, não mais de uma constante
    // de build que carimbava todo cadastro como de Betim.
    const row = await q.inserirZapEstabelecimento(cidade.id_municipio, {
      nome: validated.value.nome,
      whatsapp: validated.value.whatsapp,
      categoria: validated.value.categoria,
      descricao: validated.value.descricao || null,
      bairro: validated.value.bairro || null,
    });
    if (!row) {
      return Response.json({ error: "Cadastro indisponível no momento." }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Não foi possível cadastrar." }, { status: 500 });
  }
}
