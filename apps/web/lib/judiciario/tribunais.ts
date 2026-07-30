import * as q from "@/lib/db/queries/judiciario";
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
  const doBanco = await q.listarTribunais();
  if (doBanco && doBanco.length) return doBanco as Tribunal[];
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
  return (await q.ocupacoesAtuais(tribunalId)) as Ocupacao[];
}

/**
 * Integrantes sem cadeira atribuída — ver a nota em `queries/judiciario.ts`.
 * Degrada para lista vazia se a migration 0008 ainda não rodou.
 */
export async function integrantesSemCadeira(tribunalId: string) {
  try {
    return await q.integrantesSemCadeira(tribunalId);
  } catch (e) {
    const codigo = (e as { code?: string }).code;
    if (codigo === "42703" || codigo === "42P01") return [];
    throw e;
  }
}

/** Todas as ocupações atuais com vacância projetada conhecida, ordenadas. */
export async function proximasVacancias(limite = 50): Promise<Ocupacao[]> {
  // O filtro por vacância conhecida, a ordenação e o limite passaram para
  // o SQL — antes era `fetchAll` + filter/sort/slice em memória, porque o
  // PostgREST truncava em 1000 linhas.
  return (await q.proximasVacancias(limite)) as Ocupacao[];
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
  return q.mandatosDirecao(tribunalId);
}

export async function obterNomeacao(id: string): Promise<Nomeacao | null> {
  return (await q.obterNomeacao(id)) as Nomeacao | null;
}

export async function obterVaga(id: string): Promise<Vaga | null> {
  return (await q.obterVaga(id)) as Vaga | null;
}

export async function listarVagas(): Promise<Vaga[]> {
  return (await q.listarVagas()) as Vaga[];
}

export async function listarNomeacoes(tribunalId?: string): Promise<Nomeacao[] | null> {
  return (await q.listarNomeacoes(tribunalId)) as Nomeacao[] | null;
}
