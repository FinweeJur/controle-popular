import { listarOrgaosAtivos, membrosDoOrgao as membrosDoOrgaoQuery, obterOrgaoPorSigla, proposicoesDoOrgao, rotulosDoOrgao, rotulosPorOrgao } from "@/lib/db/queries/congresso";
import { agregar, type PerfilAgregado } from "@/lib/congresso/agregado";
import type { Rotulo } from "@/lib/congresso/rubrica";

export interface Orgao {
  id: string;
  casa_id: string;
  id_externo: string;
  sigla: string | null;
  nome: string | null;
  tipo: string | null;
  email: string | null;
  url_site: string | null;
  ativo: boolean | null;
}

export interface OrgaoComPerfil extends Orgao {
  perfil: PerfilAgregado;
}

/**
 * Vínculo proposição ↔ comissão: `proposicoes.orgao_atual` guarda a SIGLA
 * do órgão onde a matéria está agora (é o que a API da Câmara entrega em
 * `statusProposicao.siglaOrgao`), não o uuid.
 *
 * Casar por sigla em vez de FK é uma escolha consciente: a sigla é o que
 * chega da fonte, é estável no tempo, e é como as pessoas se referem à
 * comissão ("foi pra CCJC"). Normalizar para FK exigiria resolver órgãos
 * que a lista de comissões não cobre — Mesa, Plenário, órgãos extintos —
 * e perderia a informação em vez de guardá-la crua.
 */
async function rotulosPorSigla(): Promise<Map<string, (Rotulo | null)[]>> {
  const mapa = new Map<string, (Rotulo | null)[]>();
  try {
    for (const linha of await rotulosPorOrgao()) {
      const sigla = linha.orgao_atual;
      if (!sigla) continue;
      const lista = mapa.get(sigla) ?? [];
      lista.push((linha.rotulo as Rotulo | null) ?? null);
      mapa.set(sigla, lista);
    }
  } catch {
    // Migration ainda não rodada: devolve mapa vazio e a página mostra
    // estado vazio honesto em vez de quebrar.
  }
  return mapa;
}

export async function listarOrgaos(): Promise<OrgaoComPerfil[] | null> {
  try {
    const [orgaos, porSigla] = await Promise.all([listarOrgaosAtivos(), rotulosPorSigla()]);
    if (!orgaos) return null;

    return (orgaos as Orgao[])
      .map((o) => ({ ...o, perfil: agregar(porSigla.get(o.sigla ?? "") ?? []) }))
      // Comissão com matéria parada nela vem primeiro: é onde há o que
      // fazer agora. Entre as vazias, ordem alfabética.
      .sort((a, b) => b.perfil.total - a.perfil.total || (a.sigla ?? "").localeCompare(b.sigla ?? "", "pt-BR"));
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

export interface MembroOrgao {
  id: string;
  nome: string | null;
  partido: string | null;
  uf: string | null;
  email: string | null;
  /** "Presidente" | "1º Vice-Presidente" | ... | "Titular" | "Suplente" */
  papel: string | null;
}

/**
 * Mesa diretora (presidência + vice-presidências) e titulares da comissão.
 *
 * A mesa é o alvo certo para o ofício: poucas pessoas concretas, e é quem
 * decide a pauta. Devolve lista vazia (não erro) se a migration
 * `0004_orgao_membros.sql` ainda não rodou — mesmo padrão de degradar
 * usado no resto deste arquivo.
 */
async function membrosDoOrgao(orgaoId: string): Promise<MembroOrgao[]> {
  try {
    return await membrosDoOrgaoQuery(orgaoId);
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

/** Ordem de prioridade para sugerir destinatário: mesa antes de titular. */
const PESO_PAPEL: Record<string, number> = {
  "Presidente": 0,
  "1º Vice-Presidente": 1,
  "2º Vice-Presidente": 2,
  "3º Vice-Presidente": 3,
  "Titular": 4,
  "Suplente": 5,
};
export function ordenarPorRelevancia(membros: MembroOrgao[]): MembroOrgao[] {
  return [...membros].sort(
    (a, b) => (PESO_PAPEL[a.papel ?? ""] ?? 9) - (PESO_PAPEL[b.papel ?? ""] ?? 9)
  );
}

/** Quantas proposições a página de comissão lista. Ver `proposicoesDoOrgao`. */
export const LIMITE_PROPOSICOES_ORGAO = 60;

export async function obterOrgao(sigla: string): Promise<{
  orgao: Orgao;
  perfil: PerfilAgregado;
  membros: MembroOrgao[];
  /** Total real no órgão — pode ser MUITO maior que `proposicoes.length`. */
  totalProposicoes: number;
  proposicoes: {
    id: string;
    identificacao: string | null;
    ementa: string | null;
    data_apresentacao: string | null;
    rotulo: Rotulo | null;
    score: number | null;
  }[];
} | null> {
  const orgao = await obterOrgaoPorSigla(sigla);
  if (!orgao) return null;

  const siglaReal = (orgao as Orgao).sigla ?? sigla;

  // As duas consultas são separadas de propósito: a lista vem limitada (a
  // `ementa` de milhares de linhas estourava a CPU do Worker — ver
  // `proposicoesDoOrgao`), mas o perfil agregado precisa de TODAS as linhas
  // para não mentir. Só o rótulo de cada uma, que é barato.
  const [linhas, rotulos, membros] = await Promise.all([
    proposicoesDoOrgao(siglaReal, LIMITE_PROPOSICOES_ORGAO),
    rotulosDoOrgao(siglaReal),
    membrosDoOrgao((orgao as Orgao).id),
  ]);

  const proposicoes = linhas.map((l) => {
    return {
      id: l.id,
      identificacao: l.identificacao,
      ementa: l.ementa,
      data_apresentacao: l.data_apresentacao,
      rotulo: (l.rotulo as Rotulo | null) ?? null,
      score: l.score ?? null,
    };
  });

  return {
    orgao: orgao as Orgao,
    perfil: agregar(rotulos.map((r) => (r.rotulo as Rotulo | null) ?? null)),
    membros: ordenarPorRelevancia(membros),
    totalProposicoes: rotulos.length,
    proposicoes,
  };
}
