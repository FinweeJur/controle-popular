import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const CONTRATOS_PAGE_SIZE = 25;
const EXPORT_ROW_LIMIT = 5000;

export interface SancaoCeis {
  fonte: "ceis" | "cnep";
  tipo: string | null;
  orgao_sancionador: string | null;
  esfera_orgao_sancionador: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  /** Decide se a sanção alcança Betim ou fica restrita à esfera de quem
   *  aplicou — ver `etl/apis/ceis_cnep.py`. Sempre mostrar isto junto do
   *  alerta, nunca só "sancionado: sim/não". */
  abrangencia: string | null;
}

export interface ContratoRow {
  id: string;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
  objeto: string | null;
  valor_global: number | null;
  status: string | null;
  data_assinatura: string | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  ano: number | null;
  alerta: boolean | null;
  motivos_alerta: string[] | null;
  /** Tags temáticas (migration 0012). A coluna existe no banco — tem até
   *  índice GIN —, então o `comColunaOpcional()` que a protegia nunca
   *  chegou a usar o fallback. */
  temas?: string[] | null;
  /** Página do contrato no PNCP. Derivada do número de controle, não lida da
   *  API — `urlContrato` e `linkSistemaOrigem` vêm nulos em 100% dos
   *  contratos municipais (medido em 1.268/1.268, 2026-08-10). */
  link_fonte?: string | null;
  numero_contrato?: string | null;
  /** Preenchido só quando `motivos_alerta` inclui a Regra 5 — ver `fetchContratos`. */
  sancoesCeis?: SancaoCeis[] | null;
}

export interface ContratosFilters {
  ano?: string;
  status?: string;
  q?: string;
  alerta?: boolean;
  /** Código de `motivos_alerta` (chaves de MOTIVO_ALERTA_LABELS) — filtra contratos que têm esse motivo específico. */
  motivo?: string;
  /** Slug de tema (`lib/temas.ts`) — filtra contratos que tenham esse tema. */
  tema?: string;
  /** Faixa de `valor_global`, em reais. Contrato sem valor publicado fica
   *  FORA das duas pontas — ver `condicoesDeContratos`. */
  valorMin?: number;
  valorMax?: number;
  page?: number;
  /** Default `CONTRATOS_PAGE_SIZE`. `prefeitura/contratos` pede um valor
   *  bem maior pra buscar a cidade inteira de uma vez — ver
   *  `app/[municipio]/prefeitura/contratos/dados/[arquivo]/route.ts`. */
  porPagina?: number;
}

export type CategoriaAlerta = "violacao_legal" | "heuristica";

export interface MotivoAlertaInfo {
  label: string;
  categoria: CategoriaAlerta;
  /** Base legal ou jurisprudencial verificada — sempre visível junto do
   *  alerta, não escondida atrás de tooltip (aprendido com o próprio bug
   *  de `title=""` invisível em mobile, já corrigido uma vez neste
   *  projeto). Ver revisão completa em
   *  `docs/alertas-contratos-revisao-juridica.md`. */
  fundamentacao: string;
}

/**
 * Metadados de cada motivo de alerta (`contratos.motivos_alerta`,
 * `etl/alertas.py`) — revisados contra jurisprudência real de TCU/TCE em
 * 2026-07-23 (pedido do usuário, ver
 * `docs/alertas-contratos-revisao-juridica.md`).
 *
 * `categoria` distingue o que é **risco de violação legal concreta**
 * (regras 2, 3, 5, 7, 8, 9 — todas com dispositivo de lei ou jurisprudência
 * consolidada por trás) do que é **heurística de investigação** (regras 1,
 * 4 e 11 — sinal de atenção real, usado de fato por TCU/CGU/MP, mas sem
 * teto fixado em lei ou súmula). Mostrar as duas com o mesmo peso visual
 * daria a entender que uma suspeita estatística tem a mesma força que uma
 * violação de artigo de lei — não tem, e o site não pode fingir que tem.
 *
 * Regra 11 (adicionada 2026-08-11, ver `etl/alertas.py`) é uma segunda
 * checagem de outlier estatístico — mesma família da regra 1, mesma
 * categoria "heurística" — pensada especificamente pros contratos que a
 * regra 1 não consegue avaliar (categoria com poucos contratos parecidos,
 * ou nenhum na janela recente).
 */
export const MOTIVO_ALERTA_INFO: Record<string, MotivoAlertaInfo> = {
  regra_1_valor_atipico_para_categoria: {
    label: "Valor muito acima do usual para contratos parecidos",
    categoria: "heuristica",
    fundamentacao:
      "O valor está bem acima do que o município costuma pagar em contratos parecidos. Isso não prova que o preço foi alto — é só um sinal pra conferir. É uma comparação estatística, não uma pesquisa de mercado oficial.",
  },
  regra_2_dispensa_proxima_limite: {
    label: "Dispensa de licitação próxima do limite legal",
    categoria: "violacao_legal",
    fundamentacao:
      "A compra foi feita sem licitação e chegou perto do valor máximo que a lei deixa pra esse caso. Ficar bem no limite pode ser um jeito de dividir a despesa e fugir da licitação. (Lei 14.133/2021, art. 75; entendimento do TCU.)",
  },
  regra_3_aditivos_elevados: {
    label: "Aditivos elevaram o valor além do limite legal",
    categoria: "violacao_legal",
    fundamentacao:
      "O contrato foi aumentado além do que a lei permite. Em geral o teto é 25% do valor inicial — sobe pra 50% só em reforma de prédio ou equipamento. Este passou do limite do seu caso. (Lei 14.133/2021, art. 125.)",
  },
  regra_4_capital_social_baixo: {
    label: "Fornecedor com capital social baixo para o valor do contrato",
    categoria: "heuristica",
    fundamentacao:
      "A empresa tem pouco capital perto do valor do contrato. Isso pode indicar que ela não tem porte pra dar conta do serviço. Não é proibido por lei — é um sinal que TCU, CGU e Ministério Público usam pra investigar.",
  },
  regra_5_fornecedor_sancionado_ceis: {
    label: "Fornecedor com sanção registrada no CEIS/CNEP",
    categoria: "violacao_legal",
    fundamentacao:
      "A empresa tem uma punição registrada que pode impedir contratos com o poder público. Mas cuidado: nem toda punição vale pra todo município — algumas só valem na cidade ou no estado que aplicaram. Veja o campo \"abrangência\" no detalhe antes de concluir que ela impede este contrato. (Lei 14.133/2021, arts. 14 e 156.)",
  },
  regra_7_situacao_cadastral_irregular: {
    label: "Fornecedor com situação cadastral irregular na Receita Federal",
    categoria: "violacao_legal",
    fundamentacao:
      "A empresa está baixada, suspensa ou inapta no CNPJ da Receita Federal. Nessa situação, ela não pode assinar contrato com o poder público de forma regular.",
  },
  regra_8_muitos_contratos_janela_curta: {
    label: "Muitos contratos ao mesmo fornecedor em janela curta",
    categoria: "violacao_legal",
    fundamentacao:
      "O mesmo fornecedor fechou vários contratos em pouco tempo. Juntos, eles poderiam exigir uma licitação maior — repartir em contratos menores pode ser um jeito de evitar isso. (Entendimento do TCU sobre fracionamento de despesa.)",
  },
  regra_9_grupo_economico_contratos_relacionados: {
    label: "Contratos relacionados ao mesmo grupo econômico",
    categoria: "violacao_legal",
    fundamentacao:
      "Vários contratos foram parar em empresas do mesmo grupo (que dividem sócio). Isso pode simular uma disputa que, na prática, não existe. (Entendimento do TCU.)",
  },
  regra_11_valor_absurdo_para_orcamento_municipal: {
    label: "Valor consome fração desproporcional do orçamento anual da cidade",
    categoria: "heuristica",
    fundamentacao:
      "Sozinho, este contrato vale mais da metade de tudo que o município arrecada num ano inteiro. É o mesmo tipo de sinal estatístico da regra \"valor muito acima do usual\" (regra 1) — só que pensado pra pegar contratos que não têm outros parecidos pra comparar (por isso a regra 1 não teria como avaliar). Não é uma comparação de preço de mercado nem aponta ilegalidade — é desproporção clara pro tamanho do orçamento da cidade.",
  },
};

/** Só o texto do rótulo, pra código que ainda não precisa da fundamentação
 *  (CSV, `<select>` de filtro). */
export const MOTIVO_ALERTA_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(MOTIVO_ALERTA_INFO).map(([codigo, info]) => [codigo, info.label])
);

export interface ContratosResult {
  rows: ContratoRow[];
  total: number;
  sum: number;
  /** Count of contracts matching the current filters that also have alerta=true. */
  totalAlertas: number;
  /** false when DATABASE_URL is missing — data source not configured. */
  configured: boolean;
  /** false when configured but the query itself failed (e.g. table missing). */
  ok: boolean;
}

/**
 * O `%` continua sendo removido porque num `ilike` ele é curinga e
 * transformaria "10%" numa busca por qualquer coisa. Vírgula e parênteses
 * eram sintaxe do filtro `or=` do PostgREST, que não existe mais aqui —
 * ficam por simetria com a busca de proposições, e porque tirá-los mudaria
 * o resultado de buscas já feitas.
 */
function sanitizeSearchTerm(termo: string | undefined): string | undefined {
  const trimmed = termo?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/[%,()]/g, "");
}

const VAZIO: ContratosResult = {
  rows: [],
  total: 0,
  sum: 0,
  totalAlertas: 0,
  configured: false,
  ok: false,
};

function filtrosParaQuery(filters: ContratosFilters) {
  return {
    ano: filters.ano ? Number(filters.ano) : undefined,
    status: filters.status,
    alerta: filters.alerta,
    motivo: filters.motivo,
    tema: filters.tema,
    q: sanitizeSearchTerm(filters.q),
    valorMin: filters.valorMin,
    valorMax: filters.valorMax,
  };
}

/**
 * Uma página de `contratos` da cidade, mais o total de linhas, a soma de
 * `valor_global` e a contagem de alertas sobre TODO o conjunto filtrado —
 * não só sobre a página. Degrada para resultado vazio; nunca lança.
 */
export async function fetchContratos(
  idMunicipio: IdMunicipio,
  filters: ContratosFilters = {}
): Promise<ContratosResult> {
  try {
    const filtros = filtrosParaQuery(filters);
    const linhas = await q.contratosPaginados(idMunicipio, {
      ...filtros,
      pagina: filters.page,
      porPagina: filters.porPagina ?? CONTRATOS_PAGE_SIZE,
    });
    if (!linhas) return VAZIO;

    const rows = linhas.map(({ total, soma, total_alertas, ...row }) => {
      void total;
      void soma;
      void total_alertas;
      return row as ContratoRow;
    });
    await anexarSancoesCeis(rows);

    // Os agregados vêm por `over ()` pendurados em cada linha. Sem linha
    // nenhuma na página eles não vêm — e isso acontece tanto quando o
    // filtro não casa nada (aí zero é a resposta certa) quanto numa página
    // além da última, onde o total real NÃO é zero e a paginação precisa
    // dele. Uma consulta a mais só nesse caso raro.
    const agregados = linhas[0]
      ? { total: linhas[0].total, soma: linhas[0].soma, total_alertas: linhas[0].total_alertas }
      : ((await q.totaisDeContratos(idMunicipio, filtros)) ?? {
          total: 0,
          soma: 0,
          total_alertas: 0,
        });

    return {
      rows,
      total: agregados.total,
      sum: agregados.soma,
      totalAlertas: agregados.total_alertas,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}

/**
 * Preenche `row.sancoesCeis` pros contratos cuja Regra 5 disparou —
 * mostrar só "sancionado: sim" sem a abrangência da sanção seria
 * enganoso (ver `MOTIVO_ALERTA_INFO.regra_5...`), então o detalhe
 * completo (órgão sancionador, tipo, abrangência) precisa estar
 * disponível na mesma tela, não escondido atrás de outra página.
 * Muda `rows` no lugar; nunca lança — falha aqui não pode derrubar a
 * lista de contratos inteira.
 */
async function anexarSancoesCeis(rows: ContratoRow[]): Promise<void> {
  const cnpjsComAlerta = [
    ...new Set(
      rows
        .filter((r) => (r.motivos_alerta ?? []).includes("regra_5_fornecedor_sancionado_ceis"))
        .map((r) => r.fornecedor_cnpj)
        .filter((c): c is string => Boolean(c))
    ),
  ];
  if (cnpjsComAlerta.length === 0) return;

  try {
    const data = await q.sancoesCeisPorCnpj(cnpjsComAlerta);
    if (!data) return;

    const detalhesPorCnpj = new Map<string, SancaoCeis[]>(
      (data as { cnpj: string; ceis_detalhes: SancaoCeis[] | null }[]).map((f) => [
        f.cnpj,
        f.ceis_detalhes ?? [],
      ])
    );
    for (const row of rows) {
      if (row.fornecedor_cnpj && detalhesPorCnpj.has(row.fornecedor_cnpj)) {
        row.sancoesCeis = detalhesPorCnpj.get(row.fornecedor_cnpj);
      }
    }
  } catch {
    // degrade: alerta ainda aparece, só sem o detalhe da sanção
  }
}

/**
 * Fetches up to EXPORT_ROW_LIMIT matching rows (no pagination) for CSV export.
 */
export async function fetchContratosForExport(
  idMunicipio: IdMunicipio,
  filters: Omit<ContratosFilters, "page"> = {}
): Promise<{ rows: ContratoRow[]; configured: boolean; ok: boolean }> {
  try {
    const data = await q.contratosParaExport(
      idMunicipio,
      filtrosParaQuery(filters),
      EXPORT_ROW_LIMIT
    );
    if (!data) return { rows: [], configured: false, ok: false };
    return { rows: data as ContratoRow[], configured: true, ok: true };
  } catch {
    return { rows: [], configured: true, ok: false };
  }
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializes contract rows as CSV (UTF-8 BOM prefixed, so Excel opens it intact). */
export function contratosToCsv(rows: ContratoRow[]): string {
  const BOM = "﻿";
  const header = [
    "fornecedor",
    "objeto",
    "valor",
    "status",
    "data",
    "alerta",
    "motivos_alerta",
    "fundamentacao_dos_motivos",
  ].join(",");
  const lines = rows.map((row) =>
    [
      csvEscape(row.fornecedor_nome),
      csvEscape(row.objeto),
      csvEscape(row.valor_global),
      csvEscape(row.status),
      csvEscape(row.data_assinatura),
      csvEscape(row.alerta ? "sim" : "não"),
      csvEscape((row.motivos_alerta ?? []).map((m) => MOTIVO_ALERTA_INFO[m]?.label ?? m).join(" | ")),
      csvEscape(
        (row.motivos_alerta ?? [])
          .map((m) => MOTIVO_ALERTA_INFO[m]?.fundamentacao)
          .filter(Boolean)
          .join(" | ")
      ),
    ].join(",")
  );
  return BOM + [header, ...lines].join("\n") + "\n";
}
