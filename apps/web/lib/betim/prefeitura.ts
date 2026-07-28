import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

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
export async function getVisaoGeral(): Promise<VisaoGeralData> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    const { data: anosData, error: anosError } = await supabase
      .from("despesas")
      .select("ano")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .order("ano", { ascending: false })
      .limit(1);
    if (anosError || !anosData?.length) return { ...EMPTY, configured: true, ok: false };
    const ano = anosData[0].ano as number;

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
    const { data: despesasData } = await supabase
      .from("despesas")
      .select("funcao, valor")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("ano", ano)
      .eq("estagio", "Despesas Pagas");

    const porFuncao = new Map<string, number>();
    let despesaTotal = 0;
    for (const row of despesasData ?? []) {
      const funcao = (row.funcao as string) || "Outros";
      if (BLOCOS_TOTAL.has(funcao)) {
        // Os dois blocos somados são o total geral — não entram no
        // ranking por função (não são função COFOG).
        despesaTotal += Number(row.valor ?? 0);
        continue;
      }
      porFuncao.set(funcao, (porFuncao.get(funcao) ?? 0) + Number(row.valor ?? 0));
    }
    const gastosPorFuncao = [...porFuncao.entries()]
      .map(([funcao, valor]) => ({ funcao, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    // População pro custo per capita — de preferência o mesmo ano da
    // despesa; se a série não cobrir exatamente esse ano, cai pro mais
    // recente disponível (a ordenação desc deixa o mais novo em primeiro).
    const { data: popRows } = await supabase
      .from("indicadores")
      .select("valor_numerico, ano_referencia")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("nome", "populacao")
      .order("ano_referencia", { ascending: false });
    const popDoAno = (popRows ?? []).find((r) => r.ano_referencia === ano) ?? (popRows ?? [])[0];
    const populacao = Number(popDoAno?.valor_numerico ?? 0);
    const populacaoAno = Number(popDoAno?.ano_referencia ?? 0);
    const custoPerCapitaAno =
      despesaTotal > 0 && populacao > 0 ? despesaTotal / populacao : 0;

    const { data: receitaTotalRow } = await supabase
      .from("receitas")
      .select("valor")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("ano", ano)
      .eq("estagio", "Receitas Brutas Realizadas")
      .ilike("conta", "TOTAL DAS RECEITAS%")
      .limit(1)
      .maybeSingle();
    const receitaTotal = Number(receitaTotalRow?.valor ?? 0);

    const { data: contratosData } = await supabase
      .from("contratos")
      .select("fornecedor_nome, fornecedor_cnpj, valor_global")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
    const porFornecedor = new Map<string, { nome: string; cnpj: string | null; valor: number }>();
    for (const row of contratosData ?? []) {
      const cnpj = row.fornecedor_cnpj as string | null;
      const nome = (row.fornecedor_nome as string) || cnpj || "Fornecedor não identificado";
      const key = cnpj ?? nome;
      const entry = porFornecedor.get(key) ?? { nome, cnpj, valor: 0 };
      entry.valor += Number(row.valor_global ?? 0);
      porFornecedor.set(key, entry);
    }
    const maioresFornecedores = [...porFornecedor.values()]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      ano,
      receitaTotal,
      despesaTotal,
      custoPerCapitaAno,
      populacao,
      populacaoAno,
      gastosPorFuncao,
      maioresFornecedores,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true, ok: false };
  }
}
