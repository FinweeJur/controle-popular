import type { NextRequest } from "next/server";
import { fetchContratosCulturaForExport, contratosCulturaToCsv } from "@/lib/betim/cultura";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Exporta CSV dos contratos de Cultura, Esporte e Lazer — mesmo mecanismo de
 * `api/contratos/route.din.ts` (Cloudflare only, ver o porquê lá: CSV busca
 * o conjunto FILTRADO inteiro, direto no banco, o que o índice estático da
 * tabela não cobre pra qualquer combinação de filtro).
 */
const EMPTY_CSV_HEADER = "﻿fornecedor;objeto;valor;status;data_assinatura;ano\n";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const ano = sp.get("ano") ?? undefined;
  const valorMin = sp.get("valor_min") ? Number(sp.get("valor_min")) : undefined;
  const valorMax = sp.get("valor_max") ? Number(sp.get("valor_max")) : undefined;

  const { rows, configured } = await fetchContratosCulturaForExport(cidade.id_municipio, {
    ano,
    valorMin,
    valorMax,
  });
  const csv = configured ? contratosCulturaToCsv(rows) : EMPTY_CSV_HEADER;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cultura-gastos-${municipio}.csv"`,
    },
  });
}
