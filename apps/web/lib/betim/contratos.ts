import { getSupabaseClient, ID_MUNICIPIO_DEFAULT, comColunaOpcional } from "@/lib/betim/supabase";

export const CONTRATOS_PAGE_SIZE = 25;
const EXPORT_ROW_LIMIT = 5000;

const CONTRATOS_SELECT =
  "id, fornecedor_nome, fornecedor_cnpj, objeto, valor_global, status, data_assinatura, vigencia_inicio, vigencia_fim, ano, alerta, motivos_alerta, temas";
const CONTRATOS_SELECT_SEM_TEMAS =
  "id, fornecedor_nome, fornecedor_cnpj, objeto, valor_global, status, data_assinatura, vigencia_inicio, vigencia_fim, ano, alerta, motivos_alerta";

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
  /** `undefined` quando a migration 0012 (tags temáticas) ainda não rodou. */
  temas?: string[] | null;
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
  page?: number;
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
 * consolidada por trás) do que é **heurística de investigação** (regras 1
 * e 4 — sinal de atenção real, usado de fato por TCU/CGU/MP, mas sem teto
 * fixado em lei ou súmula). Mostrar as duas com o mesmo peso visual daria
 * a entender que uma suspeita estatística tem a mesma força que uma
 * violação de artigo de lei — não tem, e o site não pode fingir que tem.
 */
export const MOTIVO_ALERTA_INFO: Record<string, MotivoAlertaInfo> = {
  regra_1_valor_atipico_para_categoria: {
    label: "Valor muito acima do usual para contratos parecidos",
    categoria: "heuristica",
    fundamentacao:
      "O valor está bem acima do que Betim costuma pagar em contratos parecidos. Isso não prova que o preço foi alto — é só um sinal pra conferir. É uma comparação estatística, não uma pesquisa de mercado oficial.",
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
  /** false when Supabase env vars are missing — data source not configured. */
  configured: boolean;
  /** false when configured but the query itself failed (e.g. table missing). */
  ok: boolean;
}

function sanitizeSearchTerm(q: string | undefined): string | undefined {
  const trimmed = q?.trim();
  if (!trimmed) return undefined;
  // Strip characters that would break the PostgREST `or=` filter syntax.
  return trimmed.replace(/[%,()]/g, "");
}

/**
 * Fetches a page of `contratos` rows for id_municipio=ID_MUNICIPIO_DEFAULT,
 * plus the total matching count and the summed valor_global across ALL
 * matching rows (not just the current page). Degrades gracefully to an
 * empty result set on missing client or query error — never throws.
 */
export async function fetchContratos(
  filters: ContratosFilters
): Promise<ContratosResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { rows: [], total: 0, sum: 0, totalAlertas: 0, configured: false, ok: false };
  }

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CONTRATOS_PAGE_SIZE;
  const to = from + CONTRATOS_PAGE_SIZE - 1;
  const term = sanitizeSearchTerm(filters.q);

  try {
    // `.contains("temas", ...)` falha com 42703 se a migration 0012
    // ainda não rodou -- tenta com o filtro, cai pra sem filtro (não
    // "lista vazia") se a coluna não existir. Sem filtro de tema, nem
    // tenta tocar a coluna: nenhuma mudança de comportamento pra quem
    // não está usando o filtro novo.
    const aggBase = () => {
      let q = supabase
        .from("contratos")
        .select("valor_global, alerta", { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      // Um motivo específico já implica alerta=true (motivos_alerta só tem
      // itens quando alerta=true), então .contains() sozinho basta.
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (filters.tema) q = q.contains("temas", [filters.tema]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q;
    };
    const aggSemTema = () => {
      let q = supabase
        .from("contratos")
        .select("valor_global, alerta", { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q;
    };
    const { data: aggData, count, error: aggError } = filters.tema
      ? await comColunaOpcional(aggBase, aggSemTema)
      : await aggBase();
    if (aggError) {
      return { rows: [], total: 0, sum: 0, totalAlertas: 0, configured: true, ok: false };
    }
    const sum = (aggData ?? []).reduce(
      (acc: number, row: { valor_global: number | null }) =>
        acc + (Number(row.valor_global) || 0),
      0
    );
    const totalAlertas = (aggData ?? []).filter(
      (row: { alerta: boolean | null }) => row.alerta
    ).length;

    const rowsBase = () => {
      let q = supabase
        .from("contratos")
        .select(CONTRATOS_SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (filters.tema) q = q.contains("temas", [filters.tema]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q.order("data_assinatura", { ascending: false, nullsFirst: false }).range(from, to);
    };
    const rowsSemTema = () => {
      let q = supabase
        .from("contratos")
        .select(CONTRATOS_SELECT_SEM_TEMAS)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q.order("data_assinatura", { ascending: false, nullsFirst: false }).range(from, to);
    };
    const { data: rows, error: rowsError } = await comColunaOpcional(rowsBase, rowsSemTema);

    if (rowsError) {
      return { rows: [], total: 0, sum: 0, totalAlertas: 0, configured: true, ok: false };
    }

    const rowsTyped = (rows ?? []) as ContratoRow[];
    await anexarSancoesCeis(supabase, rowsTyped);

    return {
      rows: rowsTyped,
      total: count ?? 0,
      sum,
      totalAlertas,
      configured: true,
      ok: true,
    };
  } catch {
    return { rows: [], total: 0, sum: 0, totalAlertas: 0, configured: true, ok: false };
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
async function anexarSancoesCeis(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  rows: ContratoRow[]
): Promise<void> {
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
    const { data, error } = await supabase
      .from("fornecedores")
      .select("cnpj, ceis_detalhes")
      .in("cnpj", cnpjsComAlerta);
    if (error || !data) return;

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
  filters: Omit<ContratosFilters, "page">
): Promise<{ rows: ContratoRow[]; configured: boolean; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], configured: false, ok: false };

  const term = sanitizeSearchTerm(filters.q);

  try {
    // `comTemas` liga select E filtro juntos -- um filtro `.contains`
    // numa coluna que não existe falha do mesmo jeito que selecioná-la.
    const buildComTemas = () => {
      let q = supabase
        .from("contratos")
        .select(CONTRATOS_SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (filters.tema) q = q.contains("temas", [filters.tema]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q.order("data_assinatura", { ascending: false, nullsFirst: false }).limit(EXPORT_ROW_LIMIT);
    };
    const buildSemTemas = () => {
      let q = supabase
        .from("contratos")
        .select(CONTRATOS_SELECT_SEM_TEMAS)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT);
      if (filters.ano) q = q.eq("ano", Number(filters.ano));
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.alerta) q = q.eq("alerta", true);
      if (filters.motivo) q = q.contains("motivos_alerta", [filters.motivo]);
      if (term) q = q.or(`objeto.ilike.%${term}%,fornecedor_nome.ilike.%${term}%`);
      return q.order("data_assinatura", { ascending: false, nullsFirst: false }).limit(EXPORT_ROW_LIMIT);
    };
    const { data, error } = await comColunaOpcional(buildComTemas, buildSemTemas);

    if (error) return { rows: [], configured: true, ok: false };
    return { rows: (data ?? []) as ContratoRow[], configured: true, ok: true };
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
