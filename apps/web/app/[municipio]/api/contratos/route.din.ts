import type { NextRequest } from "next/server";
import {
  fetchContratos,
  fetchContratosForExport,
  contratosToCsv,
  CONTRATOS_PAGE_SIZE,
} from "@/lib/betim/contratos";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

// Tem que ser IGUAL ao cabeçalho de `contratosToCsv` (lib/betim/contratos.ts),
// incluindo as colunas novas da Sprint 2 — divergência aqui é o tipo de bug
// que só aparece quando o banco não responde, exatamente quando ninguém
// está olhando.
const EMPTY_CSV_HEADER =
  "\ufefffornecedor,objeto,valor,status,data,alerta,motivos_alerta,fundamentacao_dos_motivos,tipo,orgao,ano,link_fonte\n";

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
  // Sprint 2: faixa de valor, tipo e o indício "fornecedor criado no mesmo
  // ano" — mesmos filtros da tela (ListaContratos monta a query no botão).
  const valorMin = sp.get("valor_min") ? Number(sp.get("valor_min")) : undefined;
  const valorMax = sp.get("valor_max") ? Number(sp.get("valor_max")) : undefined;
  const tipo = sp.get("tipo") ?? undefined;
  const recemCriado = sp.get("recem") === "1";
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
      valorMin,
      valorMax,
      tipo,
      recemCriado,
    });
    const csv = configured ? contratosToCsv(rows) : EMPTY_CSV_HEADER;

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
    valorMin,
    valorMax,
    tipo,
    // `recemCriado` NÃO vai aqui de propósito: o ramo JSON devolve os
    // agregados do conjunto inteiro calculados em SQL (`over ()`) junto
    // com UMA página de linhas — filtrar as linhas em JS depois deixaria
    // total/soma contando linhas que não estão na resposta. O CSV suporta
    // o filtro porque lá não há agregado; quem precisar dele via API usa
    // format=csv.
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
