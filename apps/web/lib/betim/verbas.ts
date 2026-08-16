import { subsidioAtual, verbasIndenizatorias, verbasPorAno, verbasPorVereadorPorAno } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface VerbasAnalytics {
  total: number;
  totalRegistros: number;
  gastosPorTema: { tema: string; valor: number; qtd: number }[];
  topFornecedores: { fornecedor: string; valor: number; qtd: number }[];
  ok: boolean;
}

const EMPTY: VerbasAnalytics = {
  total: 0,
  totalRegistros: 0,
  gastosPorTema: [],
  topFornecedores: [],
  ok: false,
};

/**
 * Aggregates `verbas_indenizatorias` client-side (small dataset, under a
 * few hundred rows for a single câmara) -- PostgREST has no GROUP BY, so
 * this fetches all matching rows and reduces in JS, same pattern as
 * lib/prefeitura.ts's getVisaoGeral.
 */
export async function getVerbasAnalytics(
  idMunicipio: IdMunicipio,
  vereadorId?: string
): Promise<VerbasAnalytics> {
  try {
    const data = await verbasIndenizatorias(idMunicipio, vereadorId);
    if (!data) return EMPTY;
    const rows = data ?? [];

    const porTema = new Map<string, { valor: number; qtd: number }>();
    const porFornecedor = new Map<string, { valor: number; qtd: number }>();
    let total = 0;

    for (const row of rows) {
      const valor = Number(row.valor ?? 0);
      total += valor;

      const tema = row.grupo_verba || "Outros";
      const temaEntry = porTema.get(tema) ?? { valor: 0, qtd: 0 };
      temaEntry.valor += valor;
      temaEntry.qtd += 1;
      porTema.set(tema, temaEntry);

      const fornecedor = row.fornecedor || "Não identificado";
      const fornEntry = porFornecedor.get(fornecedor) ?? { valor: 0, qtd: 0 };
      fornEntry.valor += valor;
      fornEntry.qtd += 1;
      porFornecedor.set(fornecedor, fornEntry);
    }

    const gastosPorTema = [...porTema.entries()]
      .map(([tema, { valor, qtd }]) => ({ tema, valor, qtd }))
      .sort((a, b) => b.valor - a.valor);

    const topFornecedores = [...porFornecedor.entries()]
      .map(([fornecedor, { valor, qtd }]) => ({ fornecedor, valor, qtd }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      total,
      totalRegistros: rows.length,
      gastosPorTema,
      topFornecedores,
      ok: true,
    };
  } catch {
    return { ...EMPTY, ok: false };
  }
}

/**
 * Quanto o vereador custa: o que ele RECEBE por mês e o que o gabinete dele
 * GASTA por ano.
 *
 * São duas naturezas diferentes e a página precisa mantê-las separadas. O
 * subsídio é remuneração pessoal, fixada em lei e igual para todos os
 * parlamentares da casa — comparar vereadores por ele não diz nada. O
 * custeio é despesa do gabinete, varia muito entre eles e é onde a
 * comparação tem sentido. Somar os dois num número só (“custo do
 * vereador”) esconde exatamente a parte que distingue um do outro.
 *
 * Em Betim isto vem vazio: a Câmara não publica o subsídio, e a tabela
 * `subsidios` nunca teve linha. A ausência é tratada como ausência — o card
 * não aparece —, e não como zero, que afirmaria que o vereador não recebe.
 */
export interface CustoVereador {
  /** Subsídio mensal bruto, antes de descontos. */
  mensalBruto: number | null;
  /** Verbas fixas que acompanham o subsídio (auxílio-alimentação etc.). */
  mensalExtras: number | null;
  /** Competência do subsídio, para datar o número na tela. */
  competencia: string | null;
  fonteSubsidio: string | null;
  /** Custeio do gabinete somado por ano, do mais recente para o mais antigo. */
  gastoPorAno: { ano: number; total: number; qtd: number }[];
  ok: boolean;
}

const CUSTO_VAZIO: CustoVereador = {
  mensalBruto: null,
  mensalExtras: null,
  competencia: null,
  fonteSubsidio: null,
  gastoPorAno: [],
  ok: false,
};

export async function getCustoVereador(
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<CustoVereador> {
  try {
    // As duas consultas são independentes e uma pode existir sem a outra —
    // Belo Horizonte tem as duas, Betim não tem nenhuma, e uma câmara que
    // publique só o custeio continua rendendo meia tela útil.
    const [subsidio, porAno] = await Promise.all([
      subsidioAtual(idMunicipio, vereadorId),
      verbasPorAno(idMunicipio, vereadorId),
    ]);

    return {
      mensalBruto: subsidio?.valor_bruto ?? null,
      mensalExtras: subsidio?.verbas_extras ?? null,
      competencia: subsidio?.competencia ?? null,
      fonteSubsidio: subsidio?.fonte ?? null,
      gastoPorAno: (porAno ?? []).map((l) => ({
        ano: Number(l.ano),
        total: Number(l.total),
        qtd: Number(l.qtd),
      })),
      ok: true,
    };
  } catch {
    return CUSTO_VAZIO;
  }
}


/**
 * A casa inteira: quanto o gabinete de cada vereador gastou, por ano.
 *
 * Serve à comparação que a página individual promete no link "comparar com
 * os outros" — sem isso o link levaria a uma página que não responde a
 * pergunta. Ordena pelo ano mais recente com dado, porque comparar pelo
 * total acumulado favorece quem está há mais tempo na casa.
 */
export interface GastoGabinete {
  vereadorId: string;
  nome: string;
  slug: string;
  partido: string | null;
  porAno: Record<number, number>;
  total: number;
}

export async function getGastoGabineteDaCasa(idMunicipio: IdMunicipio): Promise<{
  linhas: GastoGabinete[];
  anos: number[];
  ok: boolean;
}> {
  try {
    const dados = await verbasPorVereadorPorAno(idMunicipio);
    if (!dados || dados.length === 0) return { linhas: [], anos: [], ok: false };

    const porVereador = new Map<string, GastoGabinete>();
    const anos = new Set<number>();

    for (const l of dados) {
      const id = String(l.vereador_id);
      const ano = Number(l.ano);
      const total = Number(l.total);
      anos.add(ano);
      const atual =
        porVereador.get(id) ??
        {
          vereadorId: id,
          nome: l.nome ?? "—",
          slug: l.slug ?? "",
          partido: l.partido ?? null,
          porAno: {} as Record<number, number>,
          total: 0,
        };
      atual.porAno[ano] = (atual.porAno[ano] ?? 0) + total;
      atual.total += total;
      porVereador.set(id, atual);
    }

    const anosOrdenados = [...anos].sort((a, b) => b - a);
    const maisRecente = anosOrdenados[0];
    const linhas = [...porVereador.values()].sort(
      (a, b) => (b.porAno[maisRecente] ?? 0) - (a.porAno[maisRecente] ?? 0)
    );

    return { linhas, anos: anosOrdenados, ok: true };
  } catch {
    return { linhas: [], anos: [], ok: false };
  }
}
