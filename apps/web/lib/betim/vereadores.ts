import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

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
  /** Migration 0017. As três colunas existem no banco — o
   *  `comColunaOpcional()` que as protegia nunca usou o fallback. */
  biografia?: string | null;
  profissao?: string | null;
  aniversario_dia_mes?: string | null;
}

export interface ProposicaoRow {
  tipo: string;
  numero: number | null;
  ano: number | null;
  ementa: string | null;
  situacao: string | null;
  link_fonte: string | null;
  /** Migration 0012. A coluna existe no banco, com índice GIN. */
  temas?: string[] | null;
}

export interface DiariaRow {
  destino: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor: number | null;
  motivo: string | null;
}

/**
 * Rótulo por tipo de proposição.
 *
 * Cada câmara tem o seu conjunto: os seis primeiros vieram de Betim, e
 * `projeto_decreto_legislativo`/`emenda_lei_organica` entraram com São
 * Paulo (232 e 16 linhas). Tipo ausente daqui renderiza o SLUG CRU na tela
 * ("projeto_decreto_legislativo") — não quebra, mas vaza nome de banco para
 * o leitor. Ao ligar uma câmara nova, confira os tipos distintos que o ETL
 * gravou antes de publicar.
 */
export const TIPO_PROPOSICAO_LABELS: Record<string, string> = {
  indicacao: "Indicação",
  projeto_lei: "Projeto de Lei",
  projeto_resolucao: "Projeto de Resolução",
  requerimento: "Requerimento",
  emenda: "Emenda",
  emenda_loa: "Emenda LOA",
  projeto_decreto_legislativo: "Projeto de Decreto Legislativo",
  emenda_lei_organica: "Emenda à Lei Orgânica",
  // Belo Horizonte
  mocao: "Moção",
  proposta_emenda_lei_organica: "Proposta de Emenda à Lei Orgânica",
  denuncia: "Denúncia",
  autorizacao: "Autorização",
  prestacao_contas: "Prestação de Contas",
};

export async function getProposicoesByVereador(
  idMunicipio: IdMunicipio,
  vereadorId: string,
  /** Filtra pra proposições que tenham ESSE tema (slug de `lib/temas.ts`). */
  tema?: string
): Promise<{ rows: ProposicaoRow[]; total: number; ok: boolean }> {
  try {
    const data = await q.proposicoesDeVereador(idMunicipio, vereadorId, tema);
    if (!data) return { rows: [], total: 0, ok: false };
    // O total do conjunto (que passa das 10 exibidas) vem por
    // `count(*) over ()` na mesma consulta.
    return { rows: data as ProposicaoRow[], total: data[0]?.total ?? 0, ok: true };
  } catch {
    return { rows: [], total: 0, ok: false };
  }
}

export async function getDiariasByVereador(
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<{ rows: DiariaRow[]; ok: boolean }> {
  try {
    const data = await q.diariasDeVereador(idMunicipio, vereadorId);
    if (!data) return { rows: [], ok: false };
    return { rows: data as DiariaRow[], ok: true };
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
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<{ total: number; soma: number; rows: DoadorRow[]; ok: boolean }> {
  try {
    const data = await q.doacoesDeVereador(idMunicipio, vereadorId);
    if (!data) return { total: 0, soma: 0, rows: [], ok: false };
    // Total e soma vêm por `over ()` na mesma consulta.
    return {
      total: data[0]?.total ?? 0,
      soma: data[0]?.soma ?? 0,
      rows: data as DoadorRow[],
      ok: true,
    };
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
  idMunicipio: IdMunicipio,
  vereadorId: string
): Promise<{ rows: BemCandidatoRow[]; total: number; soma: number; ok: boolean }> {
  try {
    const data = await q.bensDeVereador(idMunicipio, vereadorId);
    if (!data) return { rows: [], total: 0, soma: 0, ok: false };
    return {
      rows: data as BemCandidatoRow[],
      total: data[0]?.total ?? 0,
      soma: data[0]?.soma ?? 0,
      ok: true,
    };
  } catch {
    return { rows: [], total: 0, soma: 0, ok: false };
  }
}

export async function getVereadores(
  idMunicipio: IdMunicipio
): Promise<{ rows: VereadorRow[]; ok: boolean }> {
  try {
    const data = await q.listarVereadores(idMunicipio);
    if (!data) return { rows: [], ok: false };
    return { rows: data as VereadorRow[], ok: true };
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
/**
 * Peso de cada tipo no ranking de atuação.
 *
 * `emenda_lei_organica` pesa 15 como o Projeto de Lei: altera a Lei
 * Orgânica do município, que é a norma de hierarquia mais alta que uma
 * câmara municipal produz — dar-lhe peso menor que um PL inverteria a
 * ordem que o ranking existe para mostrar.
 *
 * `projeto_decreto_legislativo` pesa 6, junto do Projeto de Resolução: os
 * dois são atos privativos da Câmara com tramitação formal, sem efeito
 * sobre terceiros.
 *
 * Tipo ausente daqui vale `undefined` na soma — não zero. Foi o que
 * aconteceria com os dois tipos de São Paulo antes desta entrada.
 */
export const PESO_PROPOSICAO: Record<string, number> = {
  projeto_lei: 15,
  emenda_lei_organica: 15,
  proposta_emenda_lei_organica: 15,
  projeto_resolucao: 6,
  projeto_decreto_legislativo: 6,
  requerimento: 2,
  denuncia: 2,
  indicacao: 1,
  emenda: 1,
  emenda_loa: 1,
  mocao: 1,
  autorizacao: 1,
  prestacao_contas: 1,
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
    tipos: ["projeto_lei", "emenda_lei_organica", "proposta_emenda_lei_organica"],
    explicacao: "Pode virar norma que obriga toda a cidade — o maior esforço legislativo.",
  },
  {
    slot: 2,
    label: "Projeto de Resolução",
    labelCurto: "resolução",
    peso: 6,
    tipos: ["projeto_resolucao", "projeto_decreto_legislativo"],
    explicacao: "Norma interna da própria Câmara, com tramitação formal.",
  },
  {
    slot: 3,
    label: "Requerimento",
    labelCurto: "requerimento",
    peso: 2,
    tipos: ["requerimento", "denuncia"],
    explicacao: "Pedido formal de informação ou providência, votado em plenário.",
  },
  {
    slot: 4,
    label: "Indicação, Moção e Emenda",
    labelCurto: "indicação/moção",
    peso: 1,
    tipos: [
      "indicacao",
      "emenda",
      "emenda_loa",
      "mocao",
      "autorizacao",
      "prestacao_contas",
    ],
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
 * Ranking de atuação legislativa — soma ponderada de todas as proposições
 * de cada vereador (PESO_PROPOSICAO), maior primeiro.
 *
 * A contagem por (vereador, tipo) agora vem agregada do banco. Antes, o
 * app trazia as 2.733 linhas de `proposicoes` em páginas de 1000 e contava
 * em memória — laço que existia porque o PostgREST corta em 1000 SEM ERRO.
 * O comentário do código anterior registra o estrago: quando a tabela
 * passou de 487 para 2.731 linhas (depois de consertar a paginação do
 * scraper da Câmara), o ranking passou a somar só as primeiras mil e
 * mostrava o 1º colocado errado. Com `group by` não existe página para
 * truncar.
 *
 * A PONDERAÇÃO CONTINUA NO JS de propósito: `PESO_PROPOSICAO` é decisão
 * editorial documentada (Projeto de Lei vale 15, Indicação vale 1), não
 * propriedade do dado. Levá-la para o SQL esconderia num `case when` a
 * régua que a página `/camara` explica ao leitor.
 */
export async function getRankingVereadores(idMunicipio: IdMunicipio): Promise<{
  rows: RankingVereador[];
  /** Contagem por tipo somando a Câmara inteira (alimenta o gráfico de
   *  composição sem precisar de um segundo select de `proposicoes`). */
  totaisPorTipo: Record<string, number>;
  ok: boolean;
}> {
  try {
    const [vereadoresRows, contagens] = await Promise.all([
      q.listarVereadores(idMunicipio),
      q.contagemDeProposicoesPorVereador(idMunicipio),
    ]);
    if (!vereadoresRows || !contagens) return { rows: [], totaisPorTipo: {}, ok: false };

    const porVereador = new Map<string, { pontuacao: number; porTipo: Record<string, number> }>();
    const totaisPorTipo: Record<string, number> = {};
    for (const c of contagens) {
      const tipo = c.tipo;
      if (!tipo) continue;
      // O total da Câmara conta toda proposição, inclusive as sem autor
      // casado com um vereador ativo — o ranking por pessoa não pode.
      totaisPorTipo[tipo] = (totaisPorTipo[tipo] ?? 0) + c.qtd;
      if (!c.vereador_id) continue;
      const acc = porVereador.get(c.vereador_id) ?? { pontuacao: 0, porTipo: {} };
      acc.pontuacao += (PESO_PROPOSICAO[tipo] ?? 0) * c.qtd;
      acc.porTipo[tipo] = (acc.porTipo[tipo] ?? 0) + c.qtd;
      porVereador.set(c.vereador_id, acc);
    }

    const rows: RankingVereador[] = (vereadoresRows as VereadorRow[])
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
      // Desempate por nome: vereadores com a mesma pontuação saíam em
      // ordem indefinida, e com SSG o gráfico mudaria a cada build.
      .sort(
        (a, b) =>
          b.pontuacao - a.pontuacao ||
          (a.nome_urna ?? "").localeCompare(b.nome_urna ?? "", "pt-BR")
      );

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
export async function getAtividadeRecenteCamara(
  idMunicipio: IdMunicipio
): Promise<AtividadeRecente> {
  const EMPTY = { ultimoProjeto: null, ultimoAprovado: null, ultimoRequerimento: null, ok: false };
  try {
    const [projeto, aprovado, requerimento] = await Promise.all([
      q.ultimaProposicao(idMunicipio, { tipo: "projeto_lei" }),
      q.ultimaProposicao(idMunicipio, { situacao: "Aprovado" }),
      q.ultimaProposicao(idMunicipio, { tipo: "requerimento" }),
    ]);

    return {
      ultimoProjeto: (projeto as AtividadeRecenteItem) ?? null,
      ultimoAprovado: (aprovado as AtividadeRecenteItem) ?? null,
      ultimoRequerimento: (requerimento as AtividadeRecenteItem) ?? null,
      ok: true,
    };
  } catch {
    return EMPTY;
  }
}

export async function getVereadorBySlug(
  idMunicipio: IdMunicipio,
  slug: string
): Promise<{ row: VereadorRow | null; ok: boolean }> {
  try {
    const row = await q.vereadorPorSlug(idMunicipio, slug);
    return { row: (row as VereadorRow) ?? null, ok: true };
  } catch {
    return { row: null, ok: false };
  }
}
