import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import * as q from "@/lib/db/queries/betim";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

const EDITABLE_FIELDS = [
  "nome_comercio",
  "plano",
  "banner_url",
  "link",
  "ativo",
  "data_inicio",
  "data_fim",
] as const;

/**
 * A rota é `/[municipio]/api/admin/anuncios/[id]`. O `municipio` estava
 * declarado fora do tipo e não era usado: `update`/`delete` casavam SÓ
 * pelo `id`, então o painel de uma cidade alcançava a linha de outra e o
 * único obstáculo era adivinhar um uuid. Agora a cidade entra no WHERE.
 */
type Ctx = { params: Promise<{ municipio: string; id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio, id } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const patch: q.PatchAnuncio = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) (patch as Record<string, unknown>)[field] = body[field];
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  try {
    const row = await q.atualizarAnuncio(cidade.id_municipio, id, patch);
    // Sem linha devolvida: o anúncio não existe ou é de outra cidade. Nos
    // dois casos, deste endereço ele não existe.
    if (!row) return Response.json({ error: "Anúncio não encontrado." }, { status: 404 });
    return Response.json({ row });
  } catch {
    return Response.json({ error: "Erro ao atualizar anúncio." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio, id } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  try {
    const row = await q.removerAnuncio(cidade.id_municipio, id);
    if (!row) return Response.json({ error: "Anúncio não encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro ao remover anúncio." }, { status: 500 });
  }
}
