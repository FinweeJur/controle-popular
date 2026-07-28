import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";

/**
 * "Pergunte ao portal" (F8) — recuperação de contexto pro chat. NÃO usa
 * embeddings/pgvector (pipeline pesado): faz busca por palavra-chave nas
 * tabelas de maior valor (contratos, proposições, vereadores) + um bloco
 * fixo de números da cidade. O LLM responde SÓ com base nesse contexto e
 * cita a fonte — ver o system prompt em `app/api/chat/route.ts`.
 *
 * Objetivo do contexto: dar dado REAL e verificável pro modelo, e caber no
 * orçamento de tokens (poucas linhas por entidade). Se o Supabase não
 * estiver configurado, devolve string vazia (o route trata).
 */

const LIMITE_POR_ENTIDADE = 6;

/** Palavras muito comuns que não ajudam a busca — tiradas antes do ilike. */
const STOPWORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "um", "uma", "para", "pra", "por", "com", "que", "qual", "quais",
  "quanto", "quantos", "quanta", "quantas", "quem", "onde", "como", "sobre",
  "betim", "prefeitura", "cidade", "municipio", "município", "gastou", "gasto",
  "tem", "foi", "são", "é", "the", "me", "diga", "mostre", "liste",
]);

function termosBusca(pergunta: string): string[] {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
    .slice(0, 4);
}

/** Números-âncora da cidade — sempre no contexto (perguntas agregadas). */
async function fatosGerais(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>
): Promise<string[]> {
  const linhas: string[] = [];
  try {
    const [pop, contratos, vereadores] = await Promise.all([
      supabase
        .from("indicadores")
        .select("valor_numerico, ano_referencia")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("nome", "populacao")
        .order("ano_referencia", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("contratos")
        .select("valor_global", { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("status", "ativo"),
      supabase
        .from("vereadores")
        .select("id", { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("ativo", true),
    ]);
    if (pop.data?.valor_numerico) {
      linhas.push(
        `População de Betim: ${formatNumberBR(Number(pop.data.valor_numerico))} habitantes (${pop.data.ano_referencia}).`
      );
    }
    if (contratos.count != null) {
      const soma = (contratos.data ?? []).reduce(
        (a, r: { valor_global: number | null }) => a + Number(r.valor_global || 0),
        0
      );
      linhas.push(
        `Contratos ativos da Prefeitura: ${formatNumberBR(contratos.count)}, somando ${formatCurrencyBRL(soma)}.`
      );
    }
    if (vereadores.count != null) {
      linhas.push(`A Câmara tem ${vereadores.count} vereadores na legislatura atual.`);
    }
  } catch {
    /* degrade: contexto sem os fatos gerais */
  }
  return linhas;
}

/** Monta o bloco de contexto (texto) pra pergunta do usuário. */
export async function montarContexto(pergunta: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return "";

  const termos = termosBusca(pergunta);
  const secoes: string[] = [];

  const gerais = await fatosGerais(supabase);
  if (gerais.length) secoes.push("NÚMEROS DA CIDADE:\n" + gerais.map((l) => `- ${l}`).join("\n"));

  if (termos.length) {
    const orIlike = (campos: string[]) =>
      termos.flatMap((t) => campos.map((c) => `${c}.ilike.%${t}%`)).join(",");

    try {
      const [contratos, proposicoes] = await Promise.all([
        supabase
          .from("contratos")
          .select("objeto, fornecedor_nome, valor_global, ano, status")
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .or(orIlike(["objeto", "fornecedor_nome"]))
          .order("valor_global", { ascending: false, nullsFirst: false })
          .limit(LIMITE_POR_ENTIDADE),
        supabase
          .from("proposicoes")
          .select("tipo, numero, ano, ementa, situacao")
          .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
          .or(orIlike(["ementa"]))
          .limit(LIMITE_POR_ENTIDADE),
      ]);

      const cRows = contratos.data ?? [];
      if (cRows.length) {
        secoes.push(
          "CONTRATOS RELACIONADOS:\n" +
            cRows
              .map(
                (c) =>
                  `- ${c.fornecedor_nome ?? "fornecedor não informado"} · ${c.valor_global != null ? formatCurrencyBRL(Number(c.valor_global)) : "valor n/d"} · ${c.status ?? ""} (${c.ano ?? ""}): ${(c.objeto ?? "").slice(0, 160)}`
              )
              .join("\n")
        );
      }
      const pRows = proposicoes.data ?? [];
      if (pRows.length) {
        secoes.push(
          "PROPOSIÇÕES RELACIONADAS:\n" +
            pRows
              .map(
                (p) =>
                  `- ${p.tipo ?? "proposição"} nº ${p.numero ?? "?"}/${p.ano ?? "?"} (${p.situacao ?? ""}): ${(p.ementa ?? "").slice(0, 160)}`
              )
              .join("\n")
        );
      }
    } catch {
      /* degrade: contexto só com os fatos gerais */
    }
  }

  return secoes.join("\n\n");
}
