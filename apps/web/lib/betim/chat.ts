import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";

/**
 * "Pergunte ao portal" (F8) — recuperação de contexto pro chat. NÃO usa
 * embeddings/pgvector (pipeline pesado): faz busca por palavra-chave nas
 * tabelas de maior valor (contratos, proposições, vereadores) + um bloco
 * fixo de números da cidade. O LLM responde SÓ com base nesse contexto e
 * cita a fonte — ver o system prompt em `app/api/chat/route.ts`.
 *
 * Objetivo do contexto: dar dado REAL e verificável pro modelo, e caber no
 * orçamento de tokens (poucas linhas por entidade). Se o banco não estiver
 * configurado, devolve string vazia (o route trata).
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
async function fatosGerais(idMunicipio: IdMunicipio): Promise<string[]> {
  const linhas: string[] = [];
  try {
    const [pop, contratos, qtdVereadores] = await Promise.all([
      q.listarIndicadores(idMunicipio, ["populacao"]),
      // Era `select valor_global` de todos os contratos ativos só para
      // somar no JS; agora count e sum vêm do banco.
      q.resumoContratosAtivos(idMunicipio),
      q.contagemVereadoresAtivos(idMunicipio),
    ]);
    const popRow = pop?.[0];
    if (popRow?.valor_numerico) {
      linhas.push(
        `População de Betim: ${formatNumberBR(Number(popRow.valor_numerico))} habitantes (${popRow.ano_referencia}).`
      );
    }
    // ZERO NÃO ENTRA NO CONTEXTO. O `if` era `contratos.count != null` e
    // `qtdVereadores != null`, então uma cidade sem dado carregado gerava
    // "Contratos ativos: 0" e "A Câmara tem 0 vereadores" — que o modelo
    // repetiria como FATO, já que o system prompt manda responder só a
    // partir do contexto e citar a fonte. "Não temos esse dado" é uma
    // resposta; "a cidade tem zero vereadores" é uma afirmação falsa.
    // Com uma cidade só isso nunca aparecia; com duas, aparece no dia em
    // que a segunda entra antes do ETL.
    if (contratos && contratos.qtd > 0) {
      linhas.push(
        `Contratos ativos da Prefeitura: ${formatNumberBR(contratos.qtd)}, somando ${formatCurrencyBRL(contratos.soma)}.`
      );
    }
    if (qtdVereadores) {
      linhas.push(`A Câmara tem ${qtdVereadores} vereadores na legislatura atual.`);
    }
  } catch {
    /* degrade: contexto sem os fatos gerais */
  }
  return linhas;
}

/** Monta o bloco de contexto (texto) pra pergunta do usuário. */
export async function montarContexto(
  idMunicipio: IdMunicipio,
  pergunta: string
): Promise<string> {
  const termos = termosBusca(pergunta);
  const secoes: string[] = [];

  const gerais = await fatosGerais(idMunicipio);
  if (gerais.length) secoes.push("NÚMEROS DA CIDADE:\n" + gerais.map((l) => `- ${l}`).join("\n"));

  if (termos.length) {
    try {
      const [contratos, proposicoes] = await Promise.all([
        q.contratosPorTermos(idMunicipio, termos, LIMITE_POR_ENTIDADE),
        q.proposicoesPorTermos(idMunicipio, termos, LIMITE_POR_ENTIDADE),
      ]);

      const cRows = contratos ?? [];
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
      const pRows = proposicoes ?? [];
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
