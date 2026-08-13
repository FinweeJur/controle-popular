import { isAdminAuthorized } from "@/lib/betim/adminAuth";
import {
  aprovarPendenteD1,
  pendentesDeModeracaoD1,
  rejeitarPendenteD1,
  TABELAS_MODERADAS_D1,
} from "@/lib/db/queries/betimD1";
import type { TabelaModeradaD1 } from "@/lib/db/queries/betimD1";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

// ⟲ 2026-08-13: migrado de Postgres para D1 — `zap_estabelecimentos` e
// `classificados` só existem em D1 desde esta migration (ver o cabeçalho
// de `lib/db/schema.d1.ts`), então a moderação tem de ler e escrever lá,
// não mais no Postgres.
type Ctx = { params: Promise<{ municipio: string }> };

export async function GET(request: Request, { params }: Ctx) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const pendentes = await pendentesDeModeracaoD1(cidade.id_municipio);
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
    !(tabela in TABELAS_MODERADAS_D1) ||
    typeof id !== "string" ||
    typeof aprovado !== "boolean"
  ) {
    return Response.json({ error: "tabela/id/aprovado inválidos." }, { status: 400 });
  }
  const alvo = tabela as TabelaModeradaD1;

  try {
    const row = aprovado
      ? await aprovarPendenteD1(cidade.id_municipio, alvo, id)
      : await rejeitarPendenteD1(cidade.id_municipio, alvo, id);
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
