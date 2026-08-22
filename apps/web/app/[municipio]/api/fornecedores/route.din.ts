import type { NextRequest } from "next/server";
import { fornecedoresRanking } from "@/lib/db/queries/betim";
// Lógica pura direto do módulo puro — aqui seria indiferente (rota de
// servidor), mas apontar pro puro deixa a dependência explícita.
import {
  fornecedorAbertoNoPeriodo,
  fornecedoresToCsv,
  type FornecedorRow,
} from "@/lib/betim/fornecedores-puro";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Exporta CSV do ranking de fornecedores — mesmo mecanismo de
 * `api/contratos/route.din.ts` (Cloudflare only): o CSV precisa do conjunto
 * FILTRADO inteiro direto do banco, o que o índice estático da tabela não
 * cobre para combinação nenhuma de filtro.
 *
 * Os filtros espelham os da tela (`ListaFornecedores`) — valor total mínimo,
 * somente com alerta, somente indício de abertura recente. A busca textual
 * (`q`) também é aceita aqui, mesmo sendo estado interno da tabela: no CSV
 * ela filtra por razão social e CNPJ.
 */
const EMPTY_CSV_HEADER =
  "\ufeffrazao_social;cnpj;valor_total_contratado;num_contratos;num_orgaos;ano_primeiro_contrato;ano_ultimo_contrato;data_abertura_cnpj;tem_alerta\r\n";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const valorTotalMin = sp.get("valor_total_min") ? Number(sp.get("valor_total_min")) : undefined;
  const somenteAlerta = sp.get("alerta") === "1";
  const somenteRecemAberta = sp.get("recem") === "1";
  const q = (sp.get("q") ?? "").trim().toLowerCase();

  const linhas = await fornecedoresRanking(cidade.id_municipio, { valorTotalMin });
  let rows: FornecedorRow[] = (linhas ?? []) as unknown as FornecedorRow[];
  if (somenteAlerta) rows = rows.filter((r) => r.tem_alerta === true);
  if (somenteRecemAberta) rows = rows.filter((r) => fornecedorAbertoNoPeriodo(r));
  if (q) {
    rows = rows.filter(
      (r) =>
        (r.razao_social ?? "").toLowerCase().includes(q) || (r.cnpj ?? "").includes(q) || r.chave.includes(q)
    );
  }

  const csv = linhas ? fornecedoresToCsv(rows) : EMPTY_CSV_HEADER;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fornecedores.csv"',
    },
  });
}
