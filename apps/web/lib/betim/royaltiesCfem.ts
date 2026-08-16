import { royaltiesCfemPorEmpresa, royaltiesCfemPorSubstancia } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface RoyaltiesCfemAno {
  ano: number;
  valor: number;
}

export interface RoyaltiesCfemSubstancia {
  substancia: string;
  valor: number;
}

export interface RoyaltiesCfemEmpresa {
  empresa: string;
  qtdeTitulos: number | null;
  valorOperacao: number | null;
  valorCfem: number;
  pctRecolhimento: number | null;
}

export interface RoyaltiesCfemData {
  configured: boolean;
  ok: boolean;
  anoMaisRecente: number | null;
  totalAnoMaisRecente: number;
  totalHistorico: number;
  serieAnual: RoyaltiesCfemAno[];
  substanciasAnoMaisRecente: RoyaltiesCfemSubstancia[];
  empresasAnoMaisRecente: RoyaltiesCfemEmpresa[];
}

const VAZIO: RoyaltiesCfemData = {
  configured: false,
  ok: false,
  anoMaisRecente: null,
  totalAnoMaisRecente: 0,
  totalHistorico: 0,
  serieAnual: [],
  substanciasAnoMaisRecente: [],
  empresasAnoMaisRecente: [],
};

/**
 * Royalties da mineração (CFEM/ANM, `etl/betim/etl/apis/anm_cfem.py`,
 * migration 0044) — coletado desde 2026-08-07 e sem tela nenhuma até aqui.
 *
 * Mesmo padrão de `getAgroData`: busca a série crua inteira (poucas centenas
 * de linhas por cidade) e agrega por ano/substância/empresa no JS — não vale
 * uma segunda ida ao banco só para achar o ano mais recente.
 *
 * A maioria das cidades vai ter ZERO linhas aqui (Belo Horizonte e São Paulo
 * não arrecadam CFEM relevante) — isso é ausência real de mineração, não
 * falha de coleta, e a página trata como tal (ver `PaginaEmBreve`).
 */
export async function getRoyaltiesCfemData(idMunicipio: IdMunicipio): Promise<RoyaltiesCfemData> {
  try {
    const [substancias, empresas] = await Promise.all([
      royaltiesCfemPorSubstancia(idMunicipio),
      royaltiesCfemPorEmpresa(idMunicipio),
    ]);
    if (!substancias || !empresas) return VAZIO;
    if (substancias.length === 0) return { ...VAZIO, configured: true, ok: true };

    const porAno = new Map<number, number>();
    for (const r of substancias) {
      porAno.set(r.ano, (porAno.get(r.ano) ?? 0) + Number(r.valor));
    }
    const serieAnual = [...porAno.entries()]
      .map(([ano, valor]) => ({ ano, valor }))
      .sort((a, b) => a.ano - b.ano);

    const anoMaisRecente = Math.max(...serieAnual.map((s) => s.ano));
    const totalAnoMaisRecente = porAno.get(anoMaisRecente) ?? 0;
    const totalHistorico = serieAnual.reduce((acc, s) => acc + s.valor, 0);

    const porSubstancia = new Map<string, number>();
    for (const r of substancias) {
      if (r.ano !== anoMaisRecente) continue;
      porSubstancia.set(r.substancia, (porSubstancia.get(r.substancia) ?? 0) + Number(r.valor));
    }
    const substanciasAnoMaisRecente = [...porSubstancia.entries()]
      .map(([substancia, valor]) => ({ substancia, valor }))
      .sort((a, b) => b.valor - a.valor);

    const empresasAnoMaisRecente = empresas
      .filter((e) => e.ano === anoMaisRecente)
      .map((e) => ({
        empresa: e.empresa,
        qtdeTitulos: e.qtde_titulos,
        valorOperacao: e.valor_operacao != null ? Number(e.valor_operacao) : null,
        valorCfem: Number(e.valor_cfem ?? 0),
        pctRecolhimento: e.pct_recolhimento != null ? Number(e.pct_recolhimento) : null,
      }))
      .sort((a, b) => b.valorCfem - a.valorCfem)
      .slice(0, 10);

    return {
      configured: true,
      ok: true,
      anoMaisRecente,
      totalAnoMaisRecente,
      totalHistorico,
      serieAnual,
      substanciasAnoMaisRecente,
      empresasAnoMaisRecente,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
