import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface VisaoGeralData {
  ano: number;
  receitaTotal: number;
  /** Despesa total paga no ano (soma dos dois blocos intraorçamentários,
   *  que juntos são o total geral). 0 quando não dá pra apurar. */
  despesaTotal: number;
  /** Custo per capita anual = despesaTotal / população do ano. 0 se não
   *  há despesa total ou população. */
  custoPerCapitaAno: number;
  /** População usada no cálculo e o ano dela (pode diferir do ano da
   *  despesa se a série de população não cobrir exatamente o mesmo ano). */
  populacao: number;
  populacaoAno: number;
  gastosPorFuncao: { funcao: string; valor: number }[];
  maioresFornecedores: { nome: string; cnpj: string | null; valor: number }[];
  configured: boolean;
  ok: boolean;
}

const EMPTY: VisaoGeralData = {
  ano: 0,
  receitaTotal: 0,
  despesaTotal: 0,
  custoPerCapitaAno: 0,
  populacao: 0,
  populacaoAno: 0,
  gastosPorFuncao: [],
  maioresFornecedores: [],
  configured: false,
  ok: false,
};

// Os dois blocos de topo de `despesas` ("Exceto Intra" + "Intra") não são
// funções COFOG (Saúde, Educação...) e sim uma partição de escopo
// orçamentário — juntos, e sem se sobrepor, somam o TOTAL geral da despesa.
// São excluídos do ranking "por função" (NAO_FUNCOES, abaixo) justamente
// por não serem função; aqui são o que a gente QUER somar pra ter o total.
const BLOCOS_TOTAL = new Set([
  "Despesas Exceto Intraorçamentárias",
  "Despesas Intraorçamentárias",
  "Despesas (Exceto Intraorçamentárias)",
  "Despesas (Intraorçamentárias)",
]);

/**
 * Overview for /prefeitura: latest year's realized revenue, top spending
 * functions (Despesas Pagas stage), and top suppliers by total contracted
 * value. Best-effort read over already-aggregated SICONFI rows plus
 * contratos -- degrades to an empty/unconfigured result rather than
 * throwing, same convention as lib/contratos.ts.
 */
export async function getVisaoGeral(
  idMunicipio: IdMunicipio
): Promise<VisaoGeralData> {
  try {
    const ano = await q.anoMaisRecenteDeDespesas(idMunicipio);
    if (ano == null) return { ...EMPTY, configured: true, ok: false };

    // `funcao`/`conta` in despesas/receitas are hierarchical SICONFI charts
    // of accounts, not a flat list -- a parent total row and all its child
    // rows share the same (ano, estagio) and coexist in the table (e.g.
    // "TOTAL DAS RECEITAS" + "Receitas Correntes" + "Impostos" + ... all
    // present at once). Summing every row for a year multiply-counts the
    // same money at every level of the hierarchy. Confirmed live 2026-07-21:
    // naive SUM over all despesas/receitas rows for Betim 2024 gave R$24,8bi
    // in revenue against a real ~R$3,49bi (the actual "TOTAL DAS RECEITAS"
    // row). Fix: for receita, read the single TOTAL row directly instead of
    // summing. For despesa, the two non-functional top-level buckets
    // ("Despesas (Exceto/Intra) Orçamentárias" -- an orçamentária-scope
    // split, not a COFOG function) are excluded so the "por função" ranking
    // only shows real functions (Saúde, Educação, etc); this doesn't fully
    // solve the deeper função/subfunção hierarchy (a subfunção total nested
    // under a função would still double count if fetched), so treat this
    // as a best-effort top-level ranking, not an audited total.
    // A soma por função e a dos fornecedores desceram para o banco; aqui
    // sobra a separação entre os blocos de escopo (que são o total geral) e
    // as funções COFOG (que são o ranking).
    const [linhasFuncao, popRows, receitaTotal, fornecedores] = await Promise.all([
      q.despesasAgrupadasPorFuncao(idMunicipio, ano),
      q.listarIndicadores(idMunicipio, ["populacao"]),
      q.receitaTotalDoAno(idMunicipio, ano),
      q.maioresFornecedores(idMunicipio, 5),
    ]);

    let despesaTotal = 0;
    const gastosPorFuncao: { funcao: string; valor: number }[] = [];
    for (const row of linhasFuncao ?? []) {
      if (BLOCOS_TOTAL.has(row.funcao)) {
        // Os dois blocos somados são o total geral — não entram no
        // ranking por função (não são função COFOG).
        despesaTotal += row.valor ?? 0;
        continue;
      }
      gastosPorFuncao.push({ funcao: row.funcao, valor: row.valor ?? 0 });
    }

    // População pro custo per capita — de preferência o mesmo ano da
    // despesa; se a série não cobrir exatamente esse ano, cai pro mais
    // recente disponível (a ordenação desc deixa o mais novo em primeiro).
    const popDoAno =
      (popRows ?? []).find((r) => r.ano_referencia === ano) ?? (popRows ?? [])[0];
    const populacao = Number(popDoAno?.valor_numerico ?? 0);
    const populacaoAno = Number(popDoAno?.ano_referencia ?? 0);
    const custoPerCapitaAno =
      despesaTotal > 0 && populacao > 0 ? despesaTotal / populacao : 0;

    const maioresFornecedores = (fornecedores ?? []).map((f) => ({
      nome: f.nome,
      cnpj: f.cnpj,
      valor: f.valor ?? 0,
    }));

    return {
      ano,
      receitaTotal: receitaTotal ?? 0,
      despesaTotal,
      custoPerCapitaAno,
      populacao,
      populacaoAno,
      // O `order by` do banco já traz maior primeiro; o corte em 8 fica
      // aqui porque o descarte dos blocos de escopo acontece depois dele.
      gastosPorFuncao: gastosPorFuncao.slice(0, 8),
      maioresFornecedores,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true, ok: false };
  }
}
