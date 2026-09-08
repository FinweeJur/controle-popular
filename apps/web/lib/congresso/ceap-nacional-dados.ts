/**
 * SERVER-ONLY: gastos da Cota Parlamentar (CEAP) de todos os deputados federais (27 UFs),
 * lidos de `apps/web/data/congresso-ceap-nacional.json`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface TopFornecedorCeap {
  nome: string;
  cnpjCpfMascarado: string;
  total: number;
}

export interface DeputadoCeap {
  nomeParlamentar: string;
  partido: string;
  uf: string;
  totalGasto: number;
  qtdDespesas: number;
  porTipoDespesa: Record<string, number>;
  topFornecedores: TopFornecedorCeap[];
}

export interface AcervoCeapNacional {
  geradoEm: string;
  fonte: string;
  ressalvaEditorial: string;
  totalGastoNacional: number;
  totalLancamentosAnalisados: number;
  totalParlamentares: number;
  totaisPorUf: Record<string, number>;
  parlamentares: DeputadoCeap[];
}

let cache: AcervoCeapNacional | null | undefined;

export function carregarCeapNacional(): AcervoCeapNacional | null {
  if (cache !== undefined) return cache;
  try {
    const caminho = path.join(process.cwd(), "data", "congresso-ceap-nacional.json");
    const bruto = readFileSync(caminho, "utf-8");
    cache = JSON.parse(bruto) as AcervoCeapNacional;
    return cache;
  } catch {
    try {
      const caminhoAlt = path.join(process.cwd(), "apps", "web", "data", "congresso-ceap-nacional.json");
      const bruto = readFileSync(caminhoAlt, "utf-8");
      cache = JSON.parse(bruto) as AcervoCeapNacional;
      return cache;
    } catch {
      cache = null;
      return null;
    }
  }
}
