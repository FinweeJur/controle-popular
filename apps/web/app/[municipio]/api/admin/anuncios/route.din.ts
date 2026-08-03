import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import * as q from "@/lib/db/queries/betim";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";
import { ANUNCIO_PLANOS } from "@/lib/betim/anuncios";

/**
 * O `ADMIN_TOKEN` é um só para toda a instalação, então ele autoriza mas
 * NÃO escolhe a cidade — quem escolhe é o segmento da rota, e é ele que
 * entra no filtro de toda consulta daqui.
 */
type Ctx = { params: Promise<{ municipio: string }> };

export async function GET(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const rows = await q.listarAnunciosAdmin(cidade.id_municipio);
  if (!rows) return Response.json({ error: "Banco não configurado." }, { status: 503 });

  return Response.json({ rows });
}

export async function POST(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const nome_comercio = typeof body.nome_comercio === "string" ? body.nome_comercio.trim() : "";
  const plano = typeof body.plano === "string" ? body.plano : "";
  const banner_url = typeof body.banner_url === "string" ? body.banner_url : null;
  const link = typeof body.link === "string" ? body.link : null;
  const data_inicio = typeof body.data_inicio === "string" ? body.data_inicio : null;
  const data_fim = typeof body.data_fim === "string" ? body.data_fim : null;

  if (!nome_comercio || !ANUNCIO_PLANOS.includes(plano as (typeof ANUNCIO_PLANOS)[number])) {
    return Response.json({ error: "nome_comercio/plano inválidos." }, { status: 400 });
  }

  try {
    const row = await q.inserirAnuncio(cidade.id_municipio, {
      nome_comercio,
      plano,
      banner_url,
      link,
      data_inicio,
      data_fim,
    });
    if (!row) return Response.json({ error: "Banco não configurado." }, { status: 503 });
    return Response.json({ row });
  } catch {
    return Response.json({ error: "Erro ao criar anúncio." }, { status: 500 });
  }
}
