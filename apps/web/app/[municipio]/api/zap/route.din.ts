import type { NextRequest } from "next/server";
import { inserirZapEstabelecimentoD1, zapEstabelecimentosD1 } from "@/lib/db/queries/betimD1";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";
import { validateZapSubmission } from "@/lib/betim/zap";
import { ipDoCliente } from "@/lib/rate-limit-ip";
import { limitarBaixaFrequencia, respostaLimiteExcedido } from "@/lib/rate-limit";

/**
 * GET e POST no MESMO banco (D1) desde 2026-08-13. Enquanto o GET ficou no
 * Postgres, aprovar um cadastro não publicava nada: a linha existia só no
 * D1 e a listagem procurava no outro banco.
 *
 * A página `/zap` é estática — o HTML dela sai do build, que não tem
 * binding de D1 e por isso ainda vem do Postgres. É ESTA rota que tem o
 * dado de verdade, e é o navegador que troca uma lista pela outra depois de
 * montar (`useListaAoVivo`, em `ListaZap`). Sem essa troca, um cadastro
 * aprovado só apareceria no rebuild seguinte.
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
  const bairrosParam = sp.get("bairros") ?? undefined;
  const bairros = bairrosParam ? bairrosParam.split(",") : undefined;

  // `null` só quando o binding não existe (fora do Worker). Lista vazia é
  // resposta legítima e NÃO pode virar `message` — o cliente trata resposta
  // com `message` como "não deu, fica com o que veio do HTML", e aí uma
  // cidade sem nenhum cadastro nunca conseguiria mostrar a lista vazia.
  const rows = await zapEstabelecimentosD1(cidade.id_municipio, { categoria, q, bairros });

  if (!rows) {
    return Response.json({
      rows: [],
      message: "Fonte de dados não configurada (binding DB_ESCRITAS ausente).",
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
    const row = await inserirZapEstabelecimentoD1(cidade.id_municipio, {
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
