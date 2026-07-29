import type { NextRequest } from "next/server";
import {
  fetchContratos,
  fetchContratosForExport,
  contratosToCsv,
  CONTRATOS_PAGE_SIZE,
} from "@/lib/betim/contratos";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

const EMPTY_CSV_HEADER = "fornecedor,objeto,valor,status,data\n";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const ano = sp.get("ano") ?? undefined;
  const status = sp.get("status") ?? undefined;
  const q = sp.get("q") ?? undefined;
  const alerta = sp.get("alerta") === "1";
  const motivo = sp.get("motivo") ?? undefined;
  const tema = sp.get("tema") ?? undefined;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const format = sp.get("format");

  if (format === "csv") {
    const { rows, configured } = await fetchContratosForExport(cidade.id_municipio, {
      ano,
      status,
      q,
      alerta,
      motivo,
      tema,
    });
    const csv = configured ? contratosToCsv(rows) : `﻿${EMPTY_CSV_HEADER}`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="contratos-betim.csv"',
      },
    });
  }

  const { rows, total, sum, configured, ok } = await fetchContratos(cidade.id_municipio, {
    ano,
    status,
    q,
    alerta,
    motivo,
    tema,
    page,
  });

  if (!configured || !ok) {
    return Response.json({
      rows: [],
      total: 0,
      sum: 0,
      page,
      pageSize: CONTRATOS_PAGE_SIZE,
      message: "Nenhum contrato encontrado no momento.",
    });
  }

  return Response.json({
    rows,
    total,
    sum,
    page,
    pageSize: CONTRATOS_PAGE_SIZE,
  });
}
