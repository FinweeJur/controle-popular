import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

/**
 * As 28 funções de governo (Portaria MOG 42/1999) + Reserva de
 * Contingência. A tabela `despesas` (SICONFI via BD) mistura FUNÇÕES e
 * SUBFUNÇÕES na mesma coluna `conta` — somar tudo conta a mesma despesa
 * duas vezes (a função e suas subfunções). Filtrar por esta lista dá o
 * corte "por função" real: em Betim 2024 as funções presentes somam
 * exatamente o bloco "Despesas Exceto Intraorçamentárias" (94% do total,
 * o restante é intraorçamentário), sem dupla contagem. Verificado ao vivo
 * 2026-07-24.
 */
const FUNCOES_COFOG = new Set<string>([
  "Legislativa",
  "Judiciária",
  "Essencial à Justiça",
  "Administração",
  "Defesa Nacional",
  "Segurança Pública",
  "Relações Exteriores",
  "Assistência Social",
  "Previdência Social",
  "Saúde",
  "Trabalho",
  "Educação",
  "Cultura",
  "Direitos da Cidadania",
  "Urbanismo",
  "Habitação",
  "Saneamento",
  "Gestão Ambiental",
  "Ciência e Tecnologia",
  "Agricultura",
  "Organização Agrária",
  "Indústria",
  "Comércio e Serviços",
  "Comunicações",
  "Energia",
  "Transporte",
  "Desporto e Lazer",
  "Encargos Especiais",
  "Reserva de Contingência",
]);

export interface DespesaFuncao {
  funcao: string;
  valor: number;
  /** Fatia do total das funções (0-100). */
  pct: number;
}

export interface DespesasPorFuncaoData {
  ano: number;
  anosDisponiveis: number[];
  funcoes: DespesaFuncao[];
  total: number;
  configured: boolean;
  ok: boolean;
}

const EMPTY: DespesasPorFuncaoData = {
  ano: 0,
  anosDisponiveis: [],
  funcoes: [],
  total: 0,
  configured: false,
  ok: false,
};

/**
 * Despesas pagas por função de governo, pra uma tela dedicada
 * (`/prefeitura/despesas`). `ano` opcional; sem ele usa o mais recente
 * disponível. Best-effort: degrada pra `ok:false` em vez de quebrar.
 */
export async function getDespesasPorFuncao(anoParam?: number): Promise<DespesasPorFuncaoData> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    // Anos disponíveis (pro seletor). `despesas` tem ~2.9k linhas — cabe
    // no teto de 1000? Não: pegar só a coluna `ano` distinta é inviável
    // via PostgREST sem RPC, então leio os anos com uma página e derivo o
    // conjunto. Uso "Despesas Pagas" pra não inflar com outros estágios.
    const { data: anosData, error: anosError } = await supabase
      .from("despesas")
      .select("ano")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("estagio", "Despesas Pagas")
      .order("ano", { ascending: false });
    if (anosError || !anosData?.length) return { ...EMPTY, configured: true };
    const anosDisponiveis = [...new Set(anosData.map((r) => r.ano as number))].sort(
      (a, b) => b - a
    );
    const ano = anoParam && anosDisponiveis.includes(anoParam) ? anoParam : anosDisponiveis[0];

    const { data, error } = await supabase
      .from("despesas")
      .select("conta, valor")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("ano", ano)
      .eq("estagio", "Despesas Pagas");
    if (error) return { ...EMPTY, configured: true };

    const porFuncao = new Map<string, number>();
    for (const row of data ?? []) {
      const conta = row.conta as string;
      if (!FUNCOES_COFOG.has(conta)) continue;
      porFuncao.set(conta, (porFuncao.get(conta) ?? 0) + Number(row.valor ?? 0));
    }
    const total = [...porFuncao.values()].reduce((a, b) => a + b, 0);
    const funcoes = [...porFuncao.entries()]
      .map(([funcao, valor]) => ({
        funcao,
        valor,
        pct: total > 0 ? (valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);

    return { ano, anosDisponiveis, funcoes, total, configured: true, ok: funcoes.length > 0 };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
