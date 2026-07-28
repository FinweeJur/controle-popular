import { getSupabaseClient, fetchAll } from "@/lib/congresso/supabase";
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
  const sb = getSupabaseClient();
  const mapa = new Map<string, (Rotulo | null)[]>();
  if (!sb) return mapa;

  try {
    const linhas = await fetchAll<{
      orgao_atual: string | null;
      analises: { rotulo: Rotulo | null }[] | { rotulo: Rotulo | null } | null;
    }>(() =>
      sb
        .from("proposicoes")
        .select("orgao_atual, analises(rotulo)")
        .not("orgao_atual", "is", null)
    );

    for (const linha of linhas) {
      const sigla = linha.orgao_atual;
      if (!sigla) continue;
      const a = Array.isArray(linha.analises) ? linha.analises[0] : linha.analises;
      const lista = mapa.get(sigla) ?? [];
      lista.push(a?.rotulo ?? null);
      mapa.set(sigla, lista);
    }
  } catch {
    // Migration ainda não rodada: devolve mapa vazio e a página mostra
    // estado vazio honesto em vez de quebrar.
  }
  return mapa;
}

export async function listarOrgaos(): Promise<OrgaoComPerfil[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const [orgaos, porSigla] = await Promise.all([
      fetchAll<Orgao>(() => sb.from("orgaos").select("*").eq("ativo", true).order("sigla")),
      rotulosPorSigla(),
    ]);

    return orgaos
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
  const sb = getSupabaseClient();
  if (!sb) return [];

  type Linha = {
    papel: string | null;
    parlamentares:
      | { id: string; nome: string | null; partido: string | null; uf: string | null; email: string | null }
      | { id: string; nome: string | null; partido: string | null; uf: string | null; email: string | null }[]
      | null;
  };

  try {
    const linhas = await fetchAll<Linha>(() =>
      sb
        .from("orgao_membros")
        .select("papel, parlamentares(id, nome, partido, uf, email)")
        .eq("orgao_id", orgaoId)
    );
    return linhas
      .map((l) => {
        // Recurso embutido N:1 volta como array no PostgREST.
        const p = Array.isArray(l.parlamentares) ? l.parlamentares[0] : l.parlamentares;
        return p ? { ...p, papel: l.papel } : null;
      })
      .filter((m): m is MembroOrgao => m !== null);
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

export async function obterOrgao(sigla: string): Promise<{
  orgao: Orgao;
  perfil: PerfilAgregado;
  membros: MembroOrgao[];
  proposicoes: {
    id: string;
    identificacao: string | null;
    ementa: string | null;
    data_apresentacao: string | null;
    rotulo: Rotulo | null;
    score: number | null;
  }[];
} | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data: orgao } = await sb
    .from("orgaos")
    .select("*")
    .ilike("sigla", sigla)
    .limit(1)
    .maybeSingle();
  if (!orgao) return null;

  const linhas = await fetchAll<{
    id: string;
    identificacao: string | null;
    ementa: string | null;
    data_apresentacao: string | null;
    analises: { rotulo: Rotulo | null; score: number | null }[] | { rotulo: Rotulo | null; score: number | null } | null;
  }>(() =>
    sb
      .from("proposicoes")
      .select("id, identificacao, ementa, data_apresentacao, analises(rotulo, score)")
      .eq("orgao_atual", (orgao as Orgao).sigla ?? sigla)
      .order("data_apresentacao", { ascending: false })
  );

  const proposicoes = linhas.map((l) => {
    const a = Array.isArray(l.analises) ? l.analises[0] : l.analises;
    return {
      id: l.id,
      identificacao: l.identificacao,
      ementa: l.ementa,
      data_apresentacao: l.data_apresentacao,
      rotulo: a?.rotulo ?? null,
      score: a?.score ?? null,
    };
  });

  const membros = await membrosDoOrgao((orgao as Orgao).id);

  return {
    orgao: orgao as Orgao,
    perfil: agregar(proposicoes.map((p) => p.rotulo)),
    membros: ordenarPorRelevancia(membros),
    proposicoes,
  };
}
