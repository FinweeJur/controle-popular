import { getSupabaseClient, fetchAll } from "@/lib/congresso/supabase";
import { casaComTema, type Tema } from "@/lib/congresso/temas";
import type { Rotulo } from "@/lib/congresso/rubrica";

/**
 * Destaques: os PLs que retiram direitos (alertas) e os que ampliam
 * (bons exemplos), com recorte opcional por tema.
 *
 * A CONSULTA PARTE DE `analises`, NÃO DE `proposicoes`. Só proposição
 * analisada pode entrar num destaque, e as analisadas são hoje uma fração
 * das 5.500 — partir da tabela grande e filtrar depois leria milhares de
 * linhas para descartar quase todas.
 *
 * Cada destaque carrega `modelo` e `analisadaEm` de propósito: o benchmark
 * mostrou que modelos diferentes concordam no rótulo mas divergem na
 * INTENSIDADE do score. Ordenar por score é honesto dentro de um mesmo
 * modelo; entre modelos, o número não é comparável — e quem lê precisa
 * poder ver isso.
 */

export interface Destaque {
  id: string;
  identificacao: string | null;
  ementa: string | null;
  keywords: string | null;
  temas_oficiais: string[] | null;
  orgao_atual: string | null;
  data_apresentacao: string | null;
  score: number | null;
  rotulo: Rotulo | null;
  clausula_petrea: boolean;
  vedacao_retrocesso: boolean;
  resumo_neutro: string | null;
  modelo: string | null;
  analisadaEm: string | null;
  /** Slugs de direito vindos de `analise_itens` — usados no filtro por tema. */
  direitos: string[];
  /** O item de maior peso, para a UI explicar o rótulo em uma linha. */
  principal: {
    direito: string;
    dispositivo: string;
    direcao: string;
    grau: string;
    trecho: string | null;
  } | null;
}

const REDUCIONISTAS: Rotulo[] = ["reducionista_forte", "reducionista"];
const GARANTISTAS: Rotulo[] = ["garantista_forte", "garantista"];

/**
 * Carrega análises concluídas com a proposição e os itens.
 *
 * `status = 'ok'` é filtro deliberado: análise em `requer_revisao` tem
 * baixa confiança e não pode virar manchete de "alerta" nem de "bom
 * exemplo" — apontar o dedo para um projeto com base numa extração que o
 * próprio sistema considera duvidosa seria injusto com o autor.
 */
async function carregar(rotulos: Rotulo[]): Promise<Destaque[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];

  try {
    const analises = await fetchAll<{
      id: string;
      proposicao_id: string;
      score: number | null;
      rotulo: Rotulo | null;
      clausula_petrea: boolean;
      vedacao_retrocesso: boolean;
      resumo_neutro: string | null;
      modelo: string | null;
      criado_em: string | null;
    }>(() =>
      sb
        .from("analises")
        .select(
          "id, proposicao_id, score, rotulo, clausula_petrea, vedacao_retrocesso, resumo_neutro, modelo, criado_em"
        )
        .eq("status", "ok")
        .in("rotulo", rotulos)
    );

    if (analises.length === 0) return [];

    const itens = await fetchAll<{
      analise_id: string;
      direito: string;
      dispositivo: string;
      direcao: string;
      grau: string;
      trecho: string | null;
      peso: number | null;
    }>(() =>
      sb
        .from("analise_itens")
        .select("analise_id, direito, dispositivo, direcao, grau, trecho, peso")
        .in(
          "analise_id",
          analises.map((a) => a.id)
        )
    );

    const props = await fetchAll<{
      id: string;
      identificacao: string | null;
      ementa: string | null;
      keywords: string | null;
      temas_oficiais: string[] | null;
      orgao_atual: string | null;
      data_apresentacao: string | null;
    }>(() =>
      sb
        .from("proposicoes")
        .select(
          "id, identificacao, ementa, keywords, temas_oficiais, orgao_atual, data_apresentacao"
        )
        .in(
          "id",
          analises.map((a) => a.proposicao_id)
        )
    );
    const porId = new Map(props.map((p) => [p.id, p]));

    const itensPorAnalise = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorAnalise.get(i.analise_id) ?? [];
      lista.push(i);
      itensPorAnalise.set(i.analise_id, lista);
    }

    return analises
      .map((a): Destaque | null => {
        const p = porId.get(a.proposicao_id);
        if (!p) return null;
        const meus = (itensPorAnalise.get(a.id) ?? []).slice().sort(
          (x, y) => Math.abs(y.peso ?? 0) - Math.abs(x.peso ?? 0)
        );
        const principal = meus[0];
        return {
          ...p,
          score: a.score,
          rotulo: a.rotulo,
          clausula_petrea: a.clausula_petrea,
          vedacao_retrocesso: a.vedacao_retrocesso,
          resumo_neutro: a.resumo_neutro,
          modelo: a.modelo,
          analisadaEm: a.criado_em,
          direitos: [...new Set(meus.map((i) => i.direito))],
          principal: principal
            ? {
                direito: principal.direito,
                dispositivo: principal.dispositivo,
                direcao: principal.direcao,
                grau: principal.grau,
                trecho: principal.trecho,
              }
            : null,
        };
      })
      .filter((d): d is Destaque => d !== null);
  } catch (e) {
    // Migration não rodada / tabela ausente: estado vazio, não erro.
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

/** PLs que restringem direitos, do mais grave para o menos. */
export async function alertas(limite?: number, tema?: Tema): Promise<Destaque[]> {
  const todos = await carregar(REDUCIONISTAS);
  const filtrados = tema ? todos.filter((d) => casaComTema(tema, d, d.direitos)) : todos;
  // Score mais negativo primeiro.
  filtrados.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  return limite ? filtrados.slice(0, limite) : filtrados;
}

/** PLs que ampliam direitos, do mais expressivo para o menos. */
export async function bonsExemplos(limite?: number, tema?: Tema): Promise<Destaque[]> {
  const todos = await carregar(GARANTISTAS);
  const filtrados = tema ? todos.filter((d) => casaComTema(tema, d, d.direitos)) : todos;
  filtrados.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return limite ? filtrados.slice(0, limite) : filtrados;
}

/** Quantas proposições já têm análise concluída — o denominador honesto. */
export async function coberturaAnalise(): Promise<{ analisadas: number; total: number }> {
  const sb = getSupabaseClient();
  if (!sb) return { analisadas: 0, total: 0 };
  try {
    const [a, t] = await Promise.all([
      sb.from("analises").select("id", { count: "exact", head: true }).eq("status", "ok"),
      sb.from("proposicoes").select("id", { count: "exact", head: true }),
    ]);
    return { analisadas: a.count ?? 0, total: t.count ?? 0 };
  } catch {
    return { analisadas: 0, total: 0 };
  }
}
