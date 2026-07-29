import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import * as q from "@/lib/db/queries/betim";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

type Ctx = { params: Promise<{ municipio: string }> };

export async function GET(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const pendentes = await q.pendentesDeModeracao(cidade.id_municipio);
  if (!pendentes) return Response.json({ error: "Banco não configurado." }, { status: 503 });

  return Response.json(pendentes);
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

  const { tabela, id, aprovado } = body;

  // `TABELAS_MODERADAS` é a lista de permissão E a origem da tabela: o
  // nome vindo do corpo só serve para indexar o mapa, nunca para virar
  // identificador SQL.
  if (
    typeof tabela !== "string" ||
    !(tabela in q.TABELAS_MODERADAS) ||
    typeof id !== "string" ||
    typeof aprovado !== "boolean"
  ) {
    return Response.json({ error: "tabela/id/aprovado inválidos." }, { status: 400 });
  }
  const alvo = tabela as q.TabelaModerada;

  try {
    const row = aprovado
      ? await q.aprovarPendente(cidade.id_municipio, alvo, id)
      : await q.rejeitarPendente(cidade.id_municipio, alvo, id);
    // Nada devolvido: o cadastro não existe, é de outra cidade, ou (no
    // caso de rejeitar) já estava aprovado.
    if (!row) return Response.json({ error: "Cadastro não encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: aprovado ? "Erro ao aprovar." : "Erro ao rejeitar." },
      { status: 500 }
    );
  }
}
