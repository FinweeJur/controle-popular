import type { NextRequest } from "next/server";
import { carregarCruzamentosDoMunicipio } from "@/lib/terras/cruzamentos-municipio";
import { cruzamentosToCsv, type TipoCruzamento } from "@/lib/terras/cruzamentos-puro";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Exporta CSV dos cruzamentos do município — mesmo mecanismo das rotas CSV
 * `.din.ts` (Cloudflare only). Filtro aceito: `tipo` (mesmos valores da
 * tela: mineracao_operacao | mineracao_interesse | barragem_mancha_quilombola).
 *
 * Diferente das rotas que leem banco: a fonte aqui são arquivos do acervo,
 * então não existe estado "banco indisponível" — ou o build publicou as
 * camadas, ou nada desta zona funciona.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return Response.json({ error: "Cidade não encontrada." }, { status: 404 });

  const tipoParam = request.nextUrl.searchParams.get("tipo");
  const cruz = carregarCruzamentosDoMunicipio(cidade.nome, cidade.id_municipio);
  let rows = cruz.linhas;
  if (tipoParam) {
    // Valor fora do vocabulário não filtra nada silenciosamente: devolve o
    // conjunto inteiro com header de aviso? Não — recusa com 400, porque
    // "CSV igual à tela" com filtro ignorado seria a API respondendo errado
    // com cara de certa (AGENTS.md: valide o CONTEÚDO).
    const validos = new Set(["mineracao_operacao", "mineracao_interesse", "barragem_mancha_quilombola"]);
    if (!validos.has(tipoParam)) {
      return Response.json({ error: `tipo inválido: ${tipoParam}` }, { status: 400 });
    }
    rows = rows.filter((r) => r.tipo === (tipoParam as TipoCruzamento));
  }

  const csv = cruzamentosToCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cruzamentos-territorios.csv"',
    },
  });
}
