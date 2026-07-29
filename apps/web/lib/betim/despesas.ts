import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

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
export const FUNCOES_COFOG = new Set<string>([
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
export async function getDespesasPorFuncao(
  idMunicipio: IdMunicipio,
  anoParam?: number
): Promise<DespesasPorFuncaoData> {
  try {
    // Antes o seletor de ano custava uma página inteira da tabela (~2.9k
    // linhas), porque `select distinct` não existe no PostgREST sem RPC.
    // Agora são duas consultas que devolvem dezenas de linhas: os anos, e
    // a soma por função já agregada no banco.
    const anos = await q.anosDeDespesas(idMunicipio);
    if (!anos) return EMPTY;
    const anosDisponiveis = anos
      .map((r) => r.ano)
      .filter((a): a is number => a != null);
    if (anosDisponiveis.length === 0) return { ...EMPTY, configured: true };
    const ano = anoParam && anosDisponiveis.includes(anoParam) ? anoParam : anosDisponiveis[0];

    const linhas = await q.despesasPorFuncao(idMunicipio, ano, [...FUNCOES_COFOG]);
    if (!linhas) return { ...EMPTY, configured: true };

    const total = linhas.reduce((a, r) => a + (r.valor ?? 0), 0);
    const funcoes = linhas.map((r) => ({
      funcao: r.funcao as string,
      valor: r.valor ?? 0,
      pct: total > 0 ? ((r.valor ?? 0) / total) * 100 : 0,
    }));

    return { ano, anosDisponiveis, funcoes, total, configured: true, ok: funcoes.length > 0 };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
