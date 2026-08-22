import type { NextRequest } from "next/server";
import {
  buscarDatajud,
  DatajudErro,
  filtroTemCriterio,
  TAMANHO_MAXIMO,
  type DatajudFiltro,
} from "@/lib/judiciario/datajud";

/**
 * Proxy de CONSULTA AO VIVO ao DataJud do CNJ (B8). Ver o comentário de topo
 * de `lib/judiciario/datajud.ts` para o porquê jurídico completo — em
 * resumo: as cláusulas 3.8/3.9 do Termo de Uso vedam distribuir derivado do
 * acervo sem ciência ao CNJ, então esta rota nunca grava o que devolve. Cada
 * `GET` aqui dispara uma consulta nova ao Elasticsearch do CNJ; o portal não
 * tem cópia própria do acervo em nenhum lugar.
 *
 * Extensão `din.ts` — como toda rota que depende da Request neste
 * repositório (ver `AGENTS.md`, regra 1): esta rota só existe no alvo
 * Cloudflare. No alvo `output: 'export'` (GitHub Pages) `pageExtensions`
 * não inclui essa extensão, e o Next não tenta gerá-la — comportamento
 * igual ao das outras rotas de API do portal (`api/pageview`, as rotas de
 * busca e chat de cada zona), não uma exceção nova.
 *
 * ═══ PARÂMETROS ═══
 *   numeroProcesso   — só dígitos, 20 dígitos (número único CNJ). Já é
 *                       critério suficiente sozinho; se vier junto com outro
 *                       filtro, os dois entram em `AND` (inofensivo, porque
 *                       o número já é seletivo ao ponto de apontar 1 processo).
 *   classe            — código numérico de `classe.codigo`.
 *   assunto           — código numérico de `assuntos.codigo`.
 *   orgaoJulgador      — código numérico de `orgaoJulgador.codigo`.
 *   municipioIbge     — código IBGE (7 dígitos) de `orgaoJulgador.codigoMunicipioIBGE`.
 *   tamanho           — tamanho de página, 1–20 (teto próprio, ver
 *                       `TAMANHO_MAXIMO` em `lib/judiciario/datajud.ts`).
 *   searchAfter       — JSON de array (o `searchAfter` devolvido pela página
 *                       anterior), para continuar a paginação.
 *
 * É preciso pelo menos UM critério (`numeroProcesso`, `classe`, `assunto`,
 * `orgaoJulgador` ou `municipioIbge`) — sem nenhum, a consulta viraria
 * `match_all` sobre um índice de ~70 mil processos, e isto não é uma rota de
 * exportação em massa.
 */
export const runtime = "nodejs";

function respostaDeErro(mensagem: string, status: number) {
  // NUNCA inclui a chave, o header de Authorization ou o corpo bruto de erro
  // do CNJ — só a mensagem já filtrada por `buscarDatajud`/`DatajudErro`.
  return Response.json({ ok: false, error: mensagem }, { status });
}

function paraNumero(valor: string | null): number | undefined {
  if (valor === null || valor.trim() === "") return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : Number.NaN; // NaN sinaliza "veio, mas é inválido"
}

function parseSearchAfter(valor: string | null): Array<number | string> | undefined {
  if (valor === null || valor.trim() === "") return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(valor);
  } catch {
    return undefined; // tratado como ausente; a validação abaixo não exige searchAfter
  }
  if (!Array.isArray(parsed)) return undefined;
  const valido = parsed.every((v) => typeof v === "number" || typeof v === "string");
  return valido ? (parsed as Array<number | string>) : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const numeroProcessoBruto = params.get("numeroProcesso");
  const numeroProcesso = numeroProcessoBruto ? numeroProcessoBruto.replace(/\D/g, "") : undefined;
  if (numeroProcessoBruto && numeroProcesso?.length !== 20) {
    return respostaDeErro("numeroProcesso precisa ter 20 dígitos (número único CNJ)", 400);
  }

  const classeCodigo = paraNumero(params.get("classe"));
  const assuntoCodigo = paraNumero(params.get("assunto"));
  const orgaoJulgadorCodigo = paraNumero(params.get("orgaoJulgador"));
  const municipioIBGE = paraNumero(params.get("municipioIbge"));
  const tamanhoBruto = paraNumero(params.get("tamanho"));

  for (const [nome, valor] of [
    ["classe", classeCodigo],
    ["assunto", assuntoCodigo],
    ["orgaoJulgador", orgaoJulgadorCodigo],
    ["municipioIbge", municipioIBGE],
    ["tamanho", tamanhoBruto],
  ] as const) {
    if (typeof valor === "number" && Number.isNaN(valor)) {
      return respostaDeErro(`parâmetro "${nome}" precisa ser numérico`, 400);
    }
  }

  const filtro: DatajudFiltro = {
    numeroProcesso,
    classeCodigo,
    assuntoCodigo,
    orgaoJulgadorCodigo,
    municipioIBGE,
    tamanho: tamanhoBruto,
    searchAfter: parseSearchAfter(params.get("searchAfter")),
  };

  if (!filtroTemCriterio(filtro)) {
    return respostaDeErro(
      "informe ao menos um filtro: numeroProcesso, classe, assunto, orgaoJulgador ou municipioIbge",
      400
    );
  }

  try {
    const resultado = await buscarDatajud(filtro);
    return Response.json({
      ok: true,
      fonte: "API Pública do DataJud (CNJ)",
      tribunal: "TJMG",
      avisoLegal:
        "Consulta ao vivo ao acervo público do CNJ. Este portal não armazena nem republica os processos — cada busca consulta o DataJud na hora (Termo de Uso da API Pública, cláusulas 3.8/3.9).",
      tamanhoMaximo: TAMANHO_MAXIMO,
      resultado,
    });
  } catch (erro) {
    if (erro instanceof DatajudErro) {
      return respostaDeErro(erro.message, erro.statusSugerido);
    }
    console.error("api/datajud: erro não classificado —", erro);
    return respostaDeErro("falha ao consultar o DataJud", 500);
  }
}
