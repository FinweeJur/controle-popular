import { getSupabaseClient, fetchAll } from "@/lib/judiciario/supabase";
import { TRIBUNAIS } from "@/lib/judiciario/regras";

export interface Tribunal {
  id: string;
  ramo: string;
  instancia: string;
  esfera: string;
  nome: string;
  sigla: string | null;
  uf: string | null;
  n_cadeiras: number | null;
  autoridade_nomeante: string | null;
  exige_sabatina_senado: boolean | null;
  base_legal: string | null;
}

export interface Cadeira {
  id: string;
  tribunal_id: string;
  numero: number | null;
  cota: string;
  dispositivo: string | null;
}

export interface Ocupacao {
  ocupacao_id: string;
  cadeira_id: string;
  magistrado_id: string;
  tribunal_id: string;
  cota: string;
  magistrado_nome: string;
  data_nascimento: string | null;
  data_posse: string | null;
  atual: boolean;
  /** nascimento + 75 anos; null quando a data de nascimento é desconhecida. */
  vacancia_projetada: string | null;
}

export interface Nomeacao {
  id: string;
  tribunal_id: string | null;
  senado_identificacao: string | null;
  senado_ementa: string | null;
  dispositivo_vaga: string | null;
  autoridade_nomeante: string | null;
  data_mensagem: string | null;
  data_deliberacao: string | null;
  resultado: string | null;
  antecessor_nome: string | null;
  motivo_vacancia: string | null;
  url_fonte: string | null;
}

export interface Vaga {
  id: string;
  cadeira_id: string;
  data_abertura: string | null;
  motivo: string | null;
  fase: string;
  prazo_nomeacao: string | null;
  nomeacao_id: string | null;
}

export interface MandatoDirecao {
  id: string;
  cargo: string | null;
  magistrado_nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  biennio: string | null;
  eleito: boolean | null;
}

/**
 * Lista tribunais do banco. Quando o banco ainda não existe (F0/F1), cai
 * para a régua canônica `regras/regras.json` — assim `/tribunais` mostra a
 * composição LEGAL mesmo sem uma linha gravada, e nunca uma tela vazia.
 * Devolve `null` só nunca acontece aqui de propósito: a régua é o piso.
 */
export async function listarTribunais(): Promise<Tribunal[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data } = await sb.from("tribunais").select("*").order("ramo");
    if (data && data.length) return data as Tribunal[];
  }
  // Fallback pela régua — composição legal, sem ocupantes.
  return Object.entries(TRIBUNAIS).map(([id, t]) => ({
    id,
    ramo: t.ramo,
    instancia: "superior",
    esfera: "federal",
    nome: t.nome,
    sigla: id.toUpperCase(),
    uf: null,
    n_cadeiras: t.cadeiras,
    autoridade_nomeante: t.sabatina_senado ? "presidente_republica" : "eletiva",
    exige_sabatina_senado: t.sabatina_senado,
    base_legal: t.base_legal,
  }));
}

export async function obterTribunal(id: string): Promise<Tribunal | null> {
  const todos = await listarTribunais();
  return todos.find((t) => t.id === id) ?? null;
}

/** Cadeiras de um tribunal, com o ocupante atual (via vw_vacancia). */
export async function ocupacoesAtuais(tribunalId: string): Promise<Ocupacao[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb
    .from("vw_vacancia")
    .select("*")
    .eq("tribunal_id", tribunalId)
    .eq("atual", true);
  return (data as Ocupacao[]) ?? [];
}

/** Todas as ocupações atuais com vacância projetada conhecida, ordenadas. */
export async function proximasVacancias(limite = 50): Promise<Ocupacao[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const linhas = await fetchAll<Ocupacao>(() =>
    sb.from("vw_vacancia").select("*").eq("atual", true)
  );
  return linhas
    .filter((o) => o.vacancia_projetada)
    .sort((a, b) => (a.vacancia_projetada! < b.vacancia_projetada! ? -1 : 1))
    .slice(0, limite);
}

/**
 * Composição do TSE (e, no futuro, qualquer eixo de eleição interna) —
 * lê `mandatos_direcao`, NÃO `ocupacoes`/`vw_vacancia`.
 *
 * Por quê: a projeção de 75 anos de `vw_vacancia` é da cadeira de ORIGEM
 * do ministro (STF/STJ), não do mandato de 2 anos no TSE. Usar
 * `ocupacoes` aqui mostraria a "vacância" do presidente do TSE em 2047
 * (quando ele completa 75 no STF) em vez de 2027 (fim do biênio) — dado
 * tecnicamente real mas respondendo à pergunta errada na tela errada.
 */
export async function mandatosDirecao(tribunalId: string): Promise<MandatoDirecao[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const linhas = await fetchAll<{
    id: string;
    cargo: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    biennio: string | null;
    eleito: boolean | null;
    magistrados: { nome: string } | { nome: string }[] | null;
  }>(() =>
    sb
      .from("mandatos_direcao")
      .select("id,cargo,data_inicio,data_fim,biennio,eleito,magistrados(nome)")
      .eq("tribunal_id", tribunalId)
  );
  return linhas.map((l) => ({
    id: l.id,
    cargo: l.cargo,
    magistrado_nome: Array.isArray(l.magistrados) ? l.magistrados[0]?.nome ?? "" : l.magistrados?.nome ?? "",
    data_inicio: l.data_inicio,
    data_fim: l.data_fim,
    biennio: l.biennio,
    eleito: l.eleito,
  }));
}

export async function obterNomeacao(id: string): Promise<Nomeacao | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.from("nomeacoes").select("*").eq("id", id).maybeSingle();
  return (data as Nomeacao | null) ?? null;
}

export async function obterVaga(id: string): Promise<Vaga | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.from("vagas").select("*").eq("id", id).maybeSingle();
  return (data as Vaga | null) ?? null;
}

export async function listarVagas(): Promise<Vaga[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const linhas = await fetchAll<Vaga>(() => sb.from("vagas").select("*"));
  return linhas.sort((a, b) => (a.data_abertura ?? "") < (b.data_abertura ?? "") ? 1 : -1);
}

export async function listarNomeacoes(tribunalId?: string): Promise<Nomeacao[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const linhas = await fetchAll<Nomeacao>(() => {
    const q = sb.from("nomeacoes").select("*");
    return tribunalId ? q.eq("tribunal_id", tribunalId) : q;
  });
  return linhas.sort((a, b) =>
    (b.data_deliberacao ?? b.data_mensagem ?? "") > (a.data_deliberacao ?? a.data_mensagem ?? "")
      ? 1
      : -1
  );
}
