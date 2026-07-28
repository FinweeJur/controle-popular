import { getSupabaseClient, ID_MUNICIPIO_DEFAULT, comColunaOpcional } from "@/lib/betim/supabase";

export interface VereadorRow {
  id: string;
  slug: string;
  nome: string;
  nome_urna: string | null;
  partido: string | null;
  email: string | null;
  cargo_mesa: string | null;
  foto_url: string | null;
  mandato_inicio: string | null;
  mandato_fim: string | null;
  votos_eleicao: number | null;
  ano_eleicao: number | null;
  /** `undefined` quando a migration 0017 (biografia) ainda não rodou. */
  biografia?: string | null;
  profissao?: string | null;
  aniversario_dia_mes?: string | null;
}

const VEREADOR_SELECT =
  "id, slug, nome, nome_urna, partido, email, cargo_mesa, foto_url, mandato_inicio, mandato_fim, votos_eleicao, ano_eleicao, biografia, profissao, aniversario_dia_mes";
const VEREADOR_SELECT_SEM_BIOGRAFIA =
  "id, slug, nome, nome_urna, partido, email, cargo_mesa, foto_url, mandato_inicio, mandato_fim, votos_eleicao, ano_eleicao";

export interface ProposicaoRow {
  tipo: string;
  numero: number | null;
  ano: number | null;
  ementa: string | null;
  situacao: string | null;
  link_fonte: string | null;
  /** `undefined` quando a migration 0012 (tags temáticas) ainda não
   *  rodou -- `comColunaOpcional()` faz o select degradar pra sem essa
   *  coluna em vez de derrubar a lista inteira. */
  temas?: string[] | null;
}

export interface DiariaRow {
  destino: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor: number | null;
  motivo: string | null;
}

export const TIPO_PROPOSICAO_LABELS: Record<string, string> = {
  indicacao: "Indicação",
  projeto_lei: "Projeto de Lei",
  projeto_resolucao: "Projeto de Resolução",
  requerimento: "Requerimento",
  emenda: "Emenda",
  emenda_loa: "Emenda LOA",
};

export async function getProposicoesByVereador(
  vereadorId: string,
  /** Filtra pra proposições que tenham ESSE tema (slug de `lib/temas.ts`). */
  tema?: string
): Promise<{ rows: ProposicaoRow[]; total: number; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], total: 0, ok: false };
  try {
    const base = () => {
      let q = supabase
        .from("proposicoes")
        .select("tipo, numero, ano, ementa, situacao, link_fonte, temas", { count: "exact" })
        .eq("vereador_id", vereadorId);
      if (tema) q = q.contains("temas", [tema]);
      return q.order("ano", { ascending: false }).order("numero", { ascending: false }).limit(10);
    };
    const semTemas = () => {
      // Sem a coluna `temas`, um filtro por tema não tem como ser
      // aplicado -- volta a lista completa (não filtrada) em vez de uma
      // lista vazia enganosa.
      const q = supabase
        .from("proposicoes")
        .select("tipo, numero, ano, ementa, situacao, link_fonte", { count: "exact" })
        .eq("vereador_id", vereadorId);
      return q.order("ano", { ascending: false }).order("numero", { ascending: false }).limit(10);
    };
    const { data, error, count } = await comColunaOpcional(base, semTemas);
    if (error) return { rows: [], total: 0, ok: false };
    return { rows: (data ?? []) as ProposicaoRow[], total: count ?? 0, ok: true };
  } catch {
    return { rows: [], total: 0, ok: false };
  }
}

export async function getDiariasByVereador(
  vereadorId: string
): Promise<{ rows: DiariaRow[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], ok: false };
  try {
    const { data, error } = await supabase
      .from("diarias")
      .select("destino, data_inicio, data_fim, valor, motivo")
      .eq("vereador_id", vereadorId)
      .order("data_inicio", { ascending: false });
    if (error) return { rows: [], ok: false };
    return { rows: (data ?? []) as DiariaRow[], ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

export interface DoadorRow {
  doador_nome: string | null;
  doador_tipo: string | null; // PF | PJ
  valor: number | null;
  data_doacao: string | null;
}

/**
 * Doações de campanha de um vereador: total, soma e a lista de doadores
 * (maior valor primeiro), pra tela mostrar o detalhe além do agregado.
 * Máximo real observado é ~86 doadores por vereador (bem abaixo do teto de
 * 1000 do PostgREST), então não precisa paginar.
 *
 * CPF/CNPJ de doador NÃO é mascarado de propósito — a Lei das Eleições
 * (Lei 9.504/97) exige divulgação plena do financiamento de campanha; o
 * nome do doador é informação pública por lei, ver `etl/bd/tse.py`. Aqui
 * só se expõe nome/tipo/valor/data, não o documento.
 */
export async function getDoacoesSummary(
  vereadorId: string
): Promise<{ total: number; soma: number; rows: DoadorRow[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { total: 0, soma: 0, rows: [], ok: false };
  try {
    const { data, error, count } = await supabase
      .from("doacoes_campanha")
      .select("doador_nome, doador_tipo, valor, data_doacao", { count: "exact" })
      .eq("vereador_id", vereadorId)
      .order("valor", { ascending: false });
    if (error) return { total: 0, soma: 0, rows: [], ok: false };
    const rows = (data ?? []) as DoadorRow[];
    const soma = rows.reduce((acc, r) => acc + Number(r.valor || 0), 0);
    return { total: count ?? 0, soma, rows, ok: true };
  } catch {
    return { total: 0, soma: 0, rows: [], ok: false };
  }
}

export interface BemCandidatoRow {
  tipo_item: string | null;
  descricao_item: string | null;
  valor: number | null;
}

/**
 * Patrimônio declarado na campanha (migration 0013, TSE via
 * `etl/bd/tse.py`). Tabela nova -- se `bens_candidato` ainda não existe
 * no banco, o erro genérico do Supabase já cai no `catch`/`ok:false`
 * abaixo (mesmo padrão de qualquer tabela nova ainda sem migration
 * rodada, ex. `caixa_disponivel`); diferente da coluna `temas`, uma
 * tabela inteira ausente não arrisca quebrar nenhuma OUTRA leitura.
 */
export async function getBensCandidato(
  vereadorId: string
): Promise<{ rows: BemCandidatoRow[]; total: number; soma: number; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], total: 0, soma: 0, ok: false };
  try {
    const { data, error, count } = await supabase
      .from("bens_candidato")
      .select("tipo_item, descricao_item, valor", { count: "exact" })
      .eq("vereador_id", vereadorId)
      .order("valor", { ascending: false });
    if (error) return { rows: [], total: 0, soma: 0, ok: false };
    const rows = (data ?? []) as BemCandidatoRow[];
    const soma = rows.reduce((acc, r) => acc + Number(r.valor || 0), 0);
    return { rows, total: count ?? 0, soma, ok: true };
  } catch {
    return { rows: [], total: 0, soma: 0, ok: false };
  }
}

export async function getVereadores(): Promise<{ rows: VereadorRow[]; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], ok: false };
  try {
    const { data, error } = await supabase
      .from("vereadores")
      .select(VEREADOR_SELECT)
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("ativo", true)
      .order("nome_urna", { ascending: true });
    if (error) return { rows: [], ok: false };
    return { rows: (data ?? []) as VereadorRow[], ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

/**
 * Peso por tipo de proposição (plan §8, "Councilor activity score"):
 * Projeto de Lei=15 · Resolução/Decreto Legislativo=6 · Requerimento=2 ·
 * Indicação/Moção=1. `emenda`/`emenda_loa` não estavam no plano original
 * (não existe "moção" nem "decreto_legislativo" nos tipos reais raspados
 * da Câmara de Betim, ver `etl/camaras/betim.py` `TIPO_MATERIA`) — tratadas
 * com peso 1, mesmo nível de indicação, por serem emendas a proposições já
 * em tramitação (baixo esforço legislativo comparado a um PL do zero).
 */
export const PESO_PROPOSICAO: Record<string, number> = {
  projeto_lei: 15,
  projeto_resolucao: 6,
  requerimento: 2,
  indicacao: 1,
  emenda: 1,
  emenda_loa: 1,
};

/**
 * Os tipos de proposição são ORDINAIS, não nominais: um Projeto de Lei
 * pesa 15x uma Indicação, então a ordem dos tiers carrega significado e
 * a cor do gráfico tem que mostrar isso (rampa de uma cor só, escura ->
 * clara, ver `--cp-ord-*` em `app/globals.css`).
 *
 * `slot` é o degrau da rampa (1 = mais pesado/escuro .. 4 = mais leve).
 * Tipos de peso igual dividem o mesmo tier — `emenda`/`emenda_loa` valem
 * 1 igual à indicação, então entram no tier 4 em vez de virarem uma cor
 * própria (8 séries numa barra empilhada seria ilegível; ver PESO_PROPOSICAO).
 */
export interface ProposicaoTier {
  slot: 1 | 2 | 3 | 4;
  label: string;
  /** Rótulo curto pros rótulos diretos embaixo da barra. */
  labelCurto: string;
  peso: number;
  tipos: string[];
  /** Explicação em linguagem simples — o "porquê" do peso. */
  explicacao: string;
}

export const PROPOSICAO_TIERS: ProposicaoTier[] = [
  {
    slot: 1,
    label: "Projeto de Lei",
    labelCurto: "proj. de lei",
    peso: 15,
    tipos: ["projeto_lei"],
    explicacao: "Pode virar norma que obriga toda a cidade — o maior esforço legislativo.",
  },
  {
    slot: 2,
    label: "Projeto de Resolução",
    labelCurto: "resolução",
    peso: 6,
    tipos: ["projeto_resolucao"],
    explicacao: "Norma interna da própria Câmara, com tramitação formal.",
  },
  {
    slot: 3,
    label: "Requerimento",
    labelCurto: "requerimento",
    peso: 2,
    tipos: ["requerimento"],
    explicacao: "Pedido formal de informação ou providência, votado em plenário.",
  },
  {
    slot: 4,
    label: "Indicação e Emenda",
    labelCurto: "indicação/emenda",
    peso: 1,
    tipos: ["indicacao", "emenda", "emenda_loa"],
    explicacao: "Sugestão ao Executivo ou ajuste em proposta alheia — sem força de lei.",
  },
];

/** Tier de cada tipo, indexado pra lookup direto. */
const TIER_POR_TIPO: Record<string, ProposicaoTier> = Object.fromEntries(
  PROPOSICAO_TIERS.flatMap((tier) => tier.tipos.map((tipo) => [tipo, tier]))
);

export interface SegmentoPontuacao {
  tier: ProposicaoTier;
  /** Quantas proposições desse tier. */
  qtd: number;
  /** Pontos que ESSE tier contribuiu = qtd * peso. */
  pontos: number;
}

/**
 * Converte a contagem por tipo na composição da pontuação — o dado que o
 * gráfico empilhado desenha. Segmenta por PONTOS, não por quantidade:
 * é a diferença entre "fulano apresentou muita coisa" e "fulano
 * apresentou coisa que pesa", que é exatamente o que o ranking mede e o
 * que a lista de texto anterior não explicava.
 * Tiers com zero proposições saem do resultado (não viram segmento vazio).
 */
export function composicaoPontuacao(porTipo: Record<string, number>): SegmentoPontuacao[] {
  const porTier = new Map<number, SegmentoPontuacao>();

  for (const [tipo, qtd] of Object.entries(porTipo)) {
    const tier = TIER_POR_TIPO[tipo];
    if (!tier || !qtd) continue;
    const acc = porTier.get(tier.slot) ?? { tier, qtd: 0, pontos: 0 };
    acc.qtd += qtd;
    acc.pontos += qtd * tier.peso;
    porTier.set(tier.slot, acc);
  }

  return PROPOSICAO_TIERS.map((t) => porTier.get(t.slot)).filter(
    (s): s is SegmentoPontuacao => s !== undefined
  );
}

export interface RankingVereador {
  id: string;
  slug: string;
  nome_urna: string | null;
  partido: string | null;
  pontuacao: number;
  porTipo: Record<string, number>;
}

/**
 * Busca TODAS as linhas de `proposicoes` (vereador_id, tipo) para o
 * município, paginando em blocos de 1000 -- o teto padrão do PostgREST
 * por `.execute()`, que corta silenciosamente sem erro em vez de avisar.
 *
 * Existia só um comentário aqui avisando que a tabela "ficava perto" de
 * 1000 linhas (487 na época); depois de corrigir a paginação do scraper
 * da Câmara (`etl/camaras/betim.py` -- ele também truncava, só que a
 * 20 itens por página em vez de 1000), a tabela real passou de 487 para
 * 2731 linhas, estourando esse teto de verdade. O ranking mostrava um
 * corte de 1000 proposições e o 1º colocado errado até este fetch virar
 * paginado -- o mesmo tipo de bug do scraper, um nível acima.
 */
async function fetchAllProposicoesTipos(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>
): Promise<{ vereador_id: string | null; tipo: string | null }[]> {
  const PAGE_SIZE = 1000;
  const todas: { vereador_id: string | null; tipo: string | null }[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("proposicoes")
      .select("vereador_id, tipo")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    todas.push(...((data ?? []) as { vereador_id: string | null; tipo: string | null }[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return todas;
}

/**
 * Ranking de atuação legislativa — soma ponderada de todas as proposições
 * de cada vereador (PESO_PROPOSICAO), maior primeiro.
 */
export async function getRankingVereadores(): Promise<{
  rows: RankingVereador[];
  /** Contagem por tipo somando a Câmara inteira (alimenta o gráfico de
   *  composição sem precisar de um segundo select de `proposicoes`). */
  totaisPorTipo: Record<string, number>;
  ok: boolean;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { rows: [], totaisPorTipo: {}, ok: false };

  try {
    const [vereadoresRes, todasProposicoes] = await Promise.all([
      supabase
        .from("vereadores")
        .select("id, slug, nome_urna, partido")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("ativo", true),
      fetchAllProposicoesTipos(supabase),
    ]);

    if (vereadoresRes.error) return { rows: [], totaisPorTipo: {}, ok: false };

    const porVereador = new Map<string, { pontuacao: number; porTipo: Record<string, number> }>();
    const totaisPorTipo: Record<string, number> = {};
    for (const p of todasProposicoes) {
      if (!p.tipo) continue;
      // O total da Câmara conta toda proposição, inclusive as sem autor
      // casado com um vereador ativo — o ranking por pessoa não pode.
      totaisPorTipo[p.tipo] = (totaisPorTipo[p.tipo] ?? 0) + 1;
      if (!p.vereador_id) continue;
      const acc = porVereador.get(p.vereador_id) ?? { pontuacao: 0, porTipo: {} };
      acc.pontuacao += PESO_PROPOSICAO[p.tipo] ?? 0;
      acc.porTipo[p.tipo] = (acc.porTipo[p.tipo] ?? 0) + 1;
      porVereador.set(p.vereador_id, acc);
    }

    const rows: RankingVereador[] = ((vereadoresRes.data ?? []) as VereadorRow[])
      .map((v) => {
        const acc = porVereador.get(v.id) ?? { pontuacao: 0, porTipo: {} };
        return {
          id: v.id,
          slug: v.slug,
          nome_urna: v.nome_urna,
          partido: v.partido,
          pontuacao: acc.pontuacao,
          porTipo: acc.porTipo,
        };
      })
      .sort((a, b) => b.pontuacao - a.pontuacao);

    return { rows, totaisPorTipo, ok: true };
  } catch {
    return { rows: [], totaisPorTipo: {}, ok: false };
  }
}

export interface AtividadeRecenteItem {
  tipo: string;
  numero: number | null;
  ano: number | null;
  ementa: string | null;
  link_fonte: string | null;
}

export interface AtividadeRecente {
  ultimoProjeto: AtividadeRecenteItem | null;
  ultimoAprovado: AtividadeRecenteItem | null;
  ultimoRequerimento: AtividadeRecenteItem | null;
  ok: boolean;
}

/** Última proposição de cada tipo (por data de apresentação), pro teaser da Home. */
export async function getAtividadeRecenteCamara(): Promise<AtividadeRecente> {
  const supabase = getSupabaseClient();
  const EMPTY = { ultimoProjeto: null, ultimoAprovado: null, ultimoRequerimento: null, ok: false };
  if (!supabase) return EMPTY;

  const SELECT = "tipo, numero, ano, ementa, link_fonte, data_apresentacao";

  try {
    const [projeto, aprovado, requerimento] = await Promise.all([
      supabase
        .from("proposicoes")
        .select(SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("tipo", "projeto_lei")
        .order("data_apresentacao", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("proposicoes")
        .select(SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("situacao", "Aprovado")
        .order("data_apresentacao", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("proposicoes")
        .select(SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("tipo", "requerimento")
        .order("data_apresentacao", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      ultimoProjeto: (projeto.data as AtividadeRecenteItem) ?? null,
      ultimoAprovado: (aprovado.data as AtividadeRecenteItem) ?? null,
      ultimoRequerimento: (requerimento.data as AtividadeRecenteItem) ?? null,
      ok: true,
    };
  } catch {
    return EMPTY;
  }
}

export async function getVereadorBySlug(
  slug: string
): Promise<{ row: VereadorRow | null; ok: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { row: null, ok: false };
  try {
    const comBiografia = () =>
      supabase
        .from("vereadores")
        .select(VEREADOR_SELECT)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("slug", slug)
        .maybeSingle();
    const semBiografia = () =>
      supabase
        .from("vereadores")
        .select(VEREADOR_SELECT_SEM_BIOGRAFIA)
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("slug", slug)
        .maybeSingle();
    const { data, error } = await comColunaOpcional(comBiografia, semBiografia);
    if (error) return { row: null, ok: false };
    return { row: (data as VereadorRow) ?? null, ok: true };
  } catch {
    return { row: null, ok: false };
  }
}
