/**
 * ═══ O TERCEIRO PASSO DO ASSISTENTE: COMPOSIÇÃO ═══
 *
 * Junta respostas do degrau 1 (o índice de documentos já carregado) com uma
 * regra ESCRITA — sem modelo, sem rede além do índice — para as perguntas
 * que comparam cidades ou apontam ausência:
 *
 *   "compare Betim e Belo Horizonte"  → contagem por tema, lado a lado
 *   "o que falta em Betim"            → temas com documento em outra cidade
 *                                       atendida e nenhum em Betim
 *   "compare Betim e Contagem"        → Contagem não é atendida; honesto
 *
 * ═══ O QUE ISTO É, E O QUE ISTO NÃO É ═══
 *
 * A contagem vem do ÍNDICE DA `/busca` — o mesmo ~5 MB do degrau 1,
 * carregado uma vez por sessão (`carregarIndice` em `documentos.ts`). O
 * índice cobre leis municipais e proposições das 6 cidades (ver
 * `scripts/gerar-indice-busca.mts`); os acervos ricos (ComunicaBR, Rouanet,
 * despesas) NÃO estão nele. Então "total" aqui significa "documentos no
 * índice", e a tela diz isso em texto — zero dado fora do índice é
 * afirmado. A disciplina de "o assistente não afirma número" continua
 * valendo para tudo o que o índice não contém.
 *
 * Ausência de documento no índice NÃO é ausência de página: `/betim/saude`
 * existe para toda cidade atendida. Por isso a resposta de lacuna diz "no
 * índice" e o componente explica a ressalva.
 *
 * ═══ QUANDO CALA ═══
 *
 * "falta de água em Betim" (pergunta de conteúdo, não de cobertura),
 * "o que falta" sem cidade nomeada, duas cidades repetidas, sinal de
 * comparação sem par: tudo devolve `null` e a conversa segue o caminho dos
 * degraus 0/1. Calar é resposta quando a regra escrita não tem o que dizer.
 *
 * As FRASES de sinal ("o que falta") e a lista de palavras comuns são o
 * limite deliberado do reconhecimento: cada padrão a mais é uma pergunta
 * respondida errada a mais. Conservador de propósito, e o teste fixa cada
 * caso que deve continuar calado.
 */

import { separarPalavras } from "@/lib/busca/normalizar";
import type { IndiceBusca } from "@/lib/busca/indice";
import { PALAVRAS_COMUNS, cidadesMencionadas } from "./navegacao";
import { CIDADES, ROTAS_GERAIS, SUFIXOS_DE_CIDADE } from "./catalogo";

/** Quantas linhas a resposta de composição mostra — o resto fica na página. */
export const LIMITE_LINHAS = 8;

export type IntentComposicao =
  | { tipo: "comparar"; cidades: [string, string] }
  | { tipo: "lacuna"; cidade: string }
  | { tipo: "cidadeNaoAtendida"; nome: string; cidade: string | null };

export interface CidadeDaResposta {
  slug: string;
  nome: string;
}

export type RespostaComposicao =
  | {
      tipo: "comparacao";
      a: CidadeDaResposta & { total: number };
      b: CidadeDaResposta & { total: number };
      linhas: { tema: string; a: number; b: number }[];
    }
  | {
      tipo: "lacuna";
      cidade: CidadeDaResposta;
      faltando: { tema: string; exemplo: CidadeDaResposta & { total: number } }[];
    }
  | { tipo: "cidadeNaoAtendida"; nome: string; cidade: CidadeDaResposta | null };

const SINAIS_COMPARAR = new Set([
  "compare",
  "comparar",
  "comparacao",
  "comparando",
  "versus",
  "vs",
  "diferenca",
  "diferencas",
]);

const FRASES_COMPARAR = ["qual tem mais", "qual tem menos"];

const FRASES_LACUNA = ["o que falta", "o que nao tem", "o que esta faltando"];

const PALAVRAS_LACUNA = new Set(["lacuna", "lacunas", "faltam"]);

/**
 * Todas as palavras dos termos do catálogo, uma vez só.
 *
 * Serve para NÃO tratar assunto conhecido como cidade não atendida:
 * "compare saúde em Betim" não pode virar "saúde não é atendida".
 */
const PALAVRAS_DE_TERMOS = new Set(
  [...SUFIXOS_DE_CIDADE, ...ROTAS_GERAIS]
    .flatMap((e) => e.termos)
    .flatMap((t) => separarPalavras(t))
);

const NOME_POR_SLUG = new Map(CIDADES.map((c) => [c.slug, c.nome]));

export function cidadeDaResposta(slug: string): CidadeDaResposta {
  return { slug, nome: NOME_POR_SLUG.get(slug) ?? slug };
}

/** Palavras que sobraram da frase e não são cidade, comum nem assunto. */
function sobras(palavras: string[], gastas: Set<number>): string[] {
  const resultado: string[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    if (gastas.has(i)) continue;
    if (PALAVRAS_COMUNS.has(p)) continue;
    if (PALAVRAS_DE_TERMOS.has(p)) continue;
    if (/^\d+$/.test(p)) continue;
    if (p.length < 3) continue;
    resultado.push(p);
  }
  return resultado;
}

/** Posições de uma frase dentro das palavras, ou `null`. */
function posicoesDaFrase(palavras: string[], frase: string): number[] | null {
  const sequencia = separarPalavras(frase);
  for (let i = 0; i + sequencia.length <= palavras.length; i++) {
    let bate = true;
    for (let j = 0; j < sequencia.length; j++) {
      if (palavras[i + j] !== sequencia[j]) {
        bate = false;
        break;
      }
    }
    if (bate) return Array.from({ length: sequencia.length }, (_, j) => i + j);
  }
  return null;
}

/**
 * Reconhece a intenção de composição no texto, ou `null`.
 *
 * NUNCA devolve intenção quando a regra escrita não tem resposta certa —
 * os casos que devem calar estão fixados em `compor.test.ts`.
 */
export function interpretarComposicao(texto: string): IntentComposicao | null {
  const palavras = separarPalavras(texto);
  if (palavras.length === 0) return null;

  const cidades = cidadesMencionadas(palavras);
  const juntado = palavras.join(" ");

  const temSinalComparar =
    palavras.some((p) => SINAIS_COMPARAR.has(p)) ||
    FRASES_COMPARAR.some((f) => juntado.includes(f));

  if (temSinalComparar) {
    if (cidades.length >= 2) {
      const [a, b] = cidades;
      if (a.slug === b.slug) return null;
      return { tipo: "comparar", cidades: [a.slug, b.slug] };
    }
    const gastas = new Set<number>();
    for (const c of cidades) for (const p of c.posicoes) gastas.add(p);
    for (let i = 0; i < palavras.length; i++) if (SINAIS_COMPARAR.has(palavras[i])) gastas.add(i);
    for (const f of FRASES_COMPARAR) {
      const pos = posicoesDaFrase(palavras, f);
      if (pos) for (const p of pos) gastas.add(p);
    }
    const restantes = sobras(palavras, gastas);
    if (restantes.length > 0) {
      const nome = restantes[0];
      return {
        tipo: "cidadeNaoAtendida",
        nome,
        cidade: cidades.length === 1 ? cidades[0].slug : null,
      };
    }
    return null;
  }

  const temSinalLacuna =
    FRASES_LACUNA.some((f) => juntado.includes(f)) ||
    palavras.some((p) => PALAVRAS_LACUNA.has(p));

  if (temSinalLacuna) {
    if (cidades.length !== 1) return null;
    return { tipo: "lacuna", cidade: cidades[0].slug };
  }

  return null;
}

function docsDaCidade(indice: IndiceBusca, slug: string) {
  return indice.docs.filter((d) => d.f === "cidades" && d.m === slug);
}

/**
 * Monta a resposta de composição a partir do índice já carregado.
 *
 * Tudo aqui é derivado de `indice.docs` — nenhum número nasce fora dele.
 */
export function compor(intencao: IntentComposicao, indice: IndiceBusca): RespostaComposicao {
  switch (intencao.tipo) {
    case "cidadeNaoAtendida":
      return {
        tipo: "cidadeNaoAtendida",
        nome: intencao.nome,
        cidade: intencao.cidade ? cidadeDaResposta(intencao.cidade) : null,
      };

    case "comparar": {
      const docsA = docsDaCidade(indice, intencao.cidades[0]);
      const docsB = docsDaCidade(indice, intencao.cidades[1]);
      const porTema = new Map<string, { a: number; b: number }>();
      for (const d of docsA) {
        for (const t of d.a ?? []) {
          const e = porTema.get(t) ?? { a: 0, b: 0 };
          e.a++;
          porTema.set(t, e);
        }
      }
      for (const d of docsB) {
        for (const t of d.a ?? []) {
          const e = porTema.get(t) ?? { a: 0, b: 0 };
          e.b++;
          porTema.set(t, e);
        }
      }
      const linhas = [...porTema.entries()]
        .map(([tema, c]) => ({ tema, a: c.a, b: c.b }))
        .filter((l) => l.a + l.b > 0)
        .sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))
        .slice(0, LIMITE_LINHAS);
      return {
        tipo: "comparacao",
        a: { ...cidadeDaResposta(intencao.cidades[0]), total: docsA.length },
        b: { ...cidadeDaResposta(intencao.cidades[1]), total: docsB.length },
        linhas,
      };
    }

    case "lacuna": {
      const porCidade = new Map<string, Map<string, number>>();
      const totalPorCidade = new Map<string, number>();
      for (const d of indice.docs) {
        if (d.f !== "cidades" || !d.m) continue;
        totalPorCidade.set(d.m, (totalPorCidade.get(d.m) ?? 0) + 1);
        let temas = porCidade.get(d.m);
        if (!temas) {
          temas = new Map();
          porCidade.set(d.m, temas);
        }
        for (const t of d.a ?? []) temas.set(t, (temas.get(t) ?? 0) + 1);
      }
      const naAlvo = porCidade.get(intencao.cidade) ?? new Map<string, number>();
      const faltando = new Map<string, CidadeDaResposta & { total: number }>();
      for (const [slug, temas] of porCidade) {
        if (slug === intencao.cidade) continue;
        for (const [tema, n] of temas) {
          if (n <= 0 || naAlvo.has(tema) || faltando.has(tema)) continue;
          faltando.set(tema, { ...cidadeDaResposta(slug), total: totalPorCidade.get(slug) ?? 0 });
        }
      }
      const faltandoOrdenado = [...faltando.entries()]
        .map(([tema, exemplo]) => ({ tema, exemplo }))
        .sort((x, y) => y.exemplo.total - x.exemplo.total)
        .slice(0, LIMITE_LINHAS);
      return { tipo: "lacuna", cidade: cidadeDaResposta(intencao.cidade), faltando: faltandoOrdenado };
    }
  }
}