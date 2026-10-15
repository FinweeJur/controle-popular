/**
 * @file apps/web/scripts/gerar-respostas-curadas.mts
 * @description Sugere perguntas e respostas curadas para as peças do acervo
 * RAG que ainda NÃO têm entrada correspondente em `SeuNonoData.ts` (FRENTES)
 * nem em `resposta-curada.ts` (PERGUNTAS_ESPECIAIS).
 *
 * ═══ PAPEL NO PROJETO ═══
 *
 * É o Passo 3 do pipeline de ingestão automática (PLANO-CI-RAG-INGESTAO-
 * UNIDADES.md, Pilar 1, item 1.2): a CI detectou peça nova/modificada no
 * `data/acervo-delta.json` e este script devolve um sumário MARKDOWN com
 * sugestões de Q&A para revisão humana (PR draft). Nada aqui é aplicado no
 * código — o humano é quem aprova (AGENTS.md §7: a resposta vem do dado,
 * revisão editorial obrigatória).
 *
 * ═══ POR QUE TEMPLATE, E NÃO LLM ═══
 *
 * Exigência do plano (princípio ponytail): o gerador é DETERMINÍSTICO, sem
 * rede e sem chave de API. Um template reproduzível audita linha a linha e
 * roda em qualquer CI fria; um LLM só pode REFINAR o texto depois, com
 * `format: "json"`, `temperature: 0` e revisão humana — nunca criar do zero.
 * Enquanto isso não existir, este script é o insumo bruto da revisão.
 *
 * ═══ FONTE DOS DADOS ═══
 *
 * - Delta: `data/acervo-delta.json` (`ingestao-rag.mts`), shape
 *   `{ geradoEm, totalPecas, baselineSha, rebuild, novos, modificados,
 *   removidos }` com peças no formato `AcervoFonte`.
 * - Cobertura: `FRENTES[].categorias[].perguntas[]` (re-export em
 *   `lib/assistente/seu-nono-dados.ts`) e `PERGUNTAS_ESPECIAIS`.
 * - Acervo inteiro: `montarAcervo()`, só com `--tudo` (import dinâmico —
 *   o caminho padrão não puxa o grafo de módulos do acervo).
 *
 * ═══ COMO RODAR ═══
 *
 *     cd apps/web
 *     npx tsx scripts/gerar-respostas-curadas.mts                # delta
 *     npx tsx scripts/gerar-respostas-curadas.mts --tudo         # cobertura total
 *     npx tsx scripts/gerar-respostas-curadas.mts --saida x.md   # grava arquivo
 *
 * Sem delta (primeira rodada, CI sem workflow) o script avisa e sai com
 * exit 0 — fallback gracioso, igual ao resto do pipeline. Por padrão ele
 * NÃO escreve arquivo nenhum no repo: só stdout (a CI cola no step summary).
 *
 * REGRA EDITORIAL: toda resposta sugerida carrega `(fonte: <fonteUrl>)` —
 * a fonte é obrigatória (AGENTS.md §8.1), não é opcional.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FRENTES } from "../lib/assistente/seu-nono-dados.js";
import { PERGUNTAS_ESPECIAIS } from "../lib/busca/resposta-curada.js";
import type { AcervoFonte } from "../lib/assistente/acervo.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DELTA = path.resolve(AQUI, "../data/acervo-delta.json");

/** Shape de `data/acervo-delta.json` (emitido por `ingestao-rag.mts`). */
interface AcervoDelta {
  geradoEm?: string;
  novos: AcervoFonte[];
  modificados: AcervoFonte[];
}

/** Uma sugestão de Q&A, pronta para o humano revisar e colar no SeuNonoData. */
interface Sugestao {
  id: string;
  frente: string;
  rota: string;
  titulo: string;
  pergunta: string;
  resposta: string;
  fonteUrl: string;
}

/** Texto curado já normalizado + seus tokens — evita renormalizar 400× por peça. */
interface Curado {
  texto: string;
  tokens: string[];
}

/**
 * Minúsculas sem acento e sem espaço colapsado — a única normalização do
 * script. Nada de fuzzy (Levenshtein, embeddings): comparação por `includes`
 * e por tokens basta, e o critério de cobertura é barato de propósito.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Palavras que carregam assunto (5+ letras): corta artigos, preposições e
 * siglas curtas antes de comparar título com pergunta curada.
 */
function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 5);
}

/**
 * Os dois textos já cobertos existentes, achados em um passe só:
 * FRENTES (pergunta + resposta de cada categoria) e PERGUNTAS_ESPECIAIS
 * (padrões da barra + resposta).
 */
function textosCurados(): Curado[] {
  const lista: Curado[] = [];
  const add = (texto: string): void => {
    lista.push({ texto: normalizar(texto), tokens: tokens(texto) });
  };
  for (const frente of FRENTES) {
    for (const categoria of frente.categorias) {
      for (const p of categoria.perguntas) {
        add(p.pergunta);
        add(p.resposta);
      }
    }
  }
  for (const esp of PERGUNTAS_ESPECIAIS) {
    for (const padrao of esp.padroes) add(padrao);
    add(esp.resposta);
  }
  return lista;
}

/**
 * Só o suficiente para dizer "o assunto desse texto já está curado": a
 * maioria dos tokens do lado A aparece no lado B. O piso de 2 evita falso
 * positivo de palavra única; com 1 token, 1 já basta (senão nada curado de
 * título curto seria coberto).
 */
function bemCobertos(ladoA: string[], ladoB: string[]): boolean {
  if (ladoA.length === 0 || ladoB.length === 0) return false;
  const conjunto = new Set(ladoB);
  const comuns = ladoA.filter((t) => conjunto.has(t)).length;
  return comuns >= Math.max(Math.min(2, ladoA.length), Math.ceil(ladoA.length * 0.6));
}

/**
 * A peça já tem pergunta/resposta curada correspondente?
 *
 * Dois testes, ambos determinísticos e O(1) por entrada curada:
 * 1. algum texto curado aparece VERBATIM no título + início do texto da peça
 *    (a peça é a origem literal de uma resposta já curada);
 * 2. os tokens do título da peça batem ~60% com os de uma pergunta curada
 *    (o assunto da peça já é perguntado no Seu Nonô).
 */
function temCobertura(peca: AcervoFonte, curados: Curado[]): boolean {
  const alvo = normalizar(`${peca.titulo} ${peca.texto.slice(0, 400)}`);
  const doTitulo = tokens(peca.titulo);
  return curados.some((c) => (c.texto.length >= 12 && alvo.includes(c.texto)) || bemCobertos(doTitulo, c.tokens));
}

/**
 * TABELA DE DADOS: template de pergunta por frente do acervo (`frente` é o
 * id de `frenteDaRota()`/`FRENTES`). Sem entrada, cai em `geral`.
 * `${titulo}` é trocado pelo título da peça em `sugerirPara()`.
 */
function montarTemplates(): Record<string, string> {
  return {
    geral: "Como consulto ${titulo}?",
    ambiental: "O que o portal mostra sobre ${titulo}?",
    funcaosocialterra: "O que o portal mostra sobre ${titulo}?",
    paraopeba: "O que o portal mostra sobre ${titulo}?",
    terra: "O que o portal reúne sobre ${titulo}?",
    cidades: "Onde vejo ${titulo} no portal?",
    direitos: "Como consulto ${titulo}?",
    "direitos-em-movimento": "Como consulto ${titulo}?",
    estado: "Como consulto ${titulo}?",
    congresso: "O que o portal reúne sobre ${titulo}?",
    judiciario: "O que o portal reúne sobre ${titulo}?",
    central: "O que o portal publica sobre ${titulo}?",
  };
}

/**
 * Abertura do texto da peça: até `limite` chars, cortada em fronteira de
 * frase (`.`, `!`, `?`, `;` seguido de espaço). Sem fronteira no limite,
 * corta na última palavra inteira e marca com `…` — truncamento visível é
 * melhor que frase partida (a revisão humana conserta).
 */
function primeiraFrase(texto: string, limite = 300): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const trecho = limpo.slice(0, limite);
  for (let i = trecho.length - 1; i >= 1; i--) {
    if (!".!?;".includes(trecho[i])) continue;
    if (i + 1 === limpo.length || /\s/.test(limpo[i + 1])) return trecho.slice(0, i + 1);
  }
  const espaco = trecho.lastIndexOf(" ");
  return (espaco > 60 ? trecho.slice(0, espaco) : trecho) + "…";
}

/**
 * Monta a sugestão de uma peça sem cobertura: pergunta por template de
 * frente (título que já é pergunta sai literal, sem envolver), resposta =
 * abertura do texto + a fonte obrigatória.
 */
function sugerirPara(peca: AcervoFonte, templates: Record<string, string>): Sugestao {
  const fonte = peca.fonteUrl.trim() || peca.rota;
  // Título que JÁ é pergunta ("Como pesquisar contratos…") sai como está:
  // envolver num template daria "Como consulto Como pesquisar contratos…?".
  const tituloEhPergunta =
    /\?\s*$/.test(peca.titulo) || /^(como|qual|quais|onde|quando|quanto|quem|o que|que)\b/i.test(peca.titulo);
  const pergunta = tituloEhPergunta
    ? peca.titulo.trim()
    : (templates[peca.frente] ?? templates.geral).replace("${titulo}", peca.titulo);
  return {
    id: peca.id,
    frente: peca.frente,
    rota: peca.rota,
    titulo: peca.titulo,
    pergunta,
    resposta: `${primeiraFrase(peca.texto)} (fonte: ${fonte})`,
    fonteUrl: fonte,
  };
}

/**
 * Sumário MARKDOWN do stdout — é o que a CI cola no step summary.
 * Três contagens no topo, depois pergunta/resposta/fonte por sugestão
 * (mais id/frente/rota, que a revisão precisa para achar a peça).
 */
function montarMarkdown(titulo: string, total: number, cobertas: number, sugestoes: Sugestao[]): string {
  const linhas = [
    `# ${titulo}`,
    "",
    "Sugestões por template determinístico (sem LLM) — revisão humana obrigatória antes de virar resposta curada.",
    "",
    `- Peças analisadas: **${total}**`,
    `- Já cobertas por resposta curada: **${cobertas}**`,
    `- Sugestões novas: **${sugestoes.length}**`,
    "",
  ];
  sugestoes.forEach((s, i) => {
    linhas.push(
      `## ${i + 1}. ${s.titulo}`,
      "",
      `- **Pergunta:** ${s.pergunta}`,
      `- **Resposta:** ${s.resposta}`,
      `- **Fonte:** ${s.fonteUrl}`,
      `- **Peça:** \`${s.id}\` · frente \`${s.frente}\` · rota \`${s.rota}\``,
      "",
    );
  });
  return linhas.join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const tudo = args.includes("--tudo");
  const iSaida = args.indexOf("--saida");
  const saida = iSaida >= 0 ? args[iSaida + 1] : undefined;
  if (iSaida >= 0 && !saida) {
    console.error("A flag --saida exige um caminho: --saida <arquivo.md>");
    process.exit(1);
  }

  let pecas: AcervoFonte[];
  let tituloRelatorio: string;
  if (tudo) {
    // Import dinâmico: só `--tudo` puxa o grafo do acervo (JSONs, blog, cavas).
    const { montarAcervo } = await import("../lib/assistente/acervo.js");
    pecas = montarAcervo();
    tituloRelatorio = "Relatório de cobertura do acervo (--tudo)";
  } else if (!existsSync(DELTA)) {
    console.log(
      `[gerar-respostas-curadas] Aviso: ${DELTA} ainda não existe — ` +
        "sem delta não há peça nova para sugerir. Rode scripts/ingestao-rag.mts " +
        "para gerar o delta. Saindo com sucesso (exit 0).",
    );
    return;
  } else {
    const delta = JSON.parse(readFileSync(DELTA, "utf8")) as AcervoDelta;
    pecas = [...(delta.novos ?? []), ...(delta.modificados ?? [])];
    if (pecas.length === 0) {
      console.log(
        `[gerar-respostas-curadas] Nada novo para sugerir: o delta de ` +
          `${delta.geradoEm ?? "(sem data)"} não traz peças novas nem modificadas.`,
      );
      return;
    }
    tituloRelatorio = `Sugestões de respostas curadas — delta de ${delta.geradoEm ?? "(sem data)"}`;
  }

  const curados = textosCurados();
  const templates = montarTemplates();
  const sugestoes: Sugestao[] = [];
  let cobertas = 0;
  for (const peca of pecas) {
    if (temCobertura(peca, curados)) cobertas++;
    else sugestoes.push(sugerirPara(peca, templates));
  }

  const md = montarMarkdown(tituloRelatorio, pecas.length, cobertas, sugestoes);
  console.log(md);
  if (saida) {
    writeFileSync(saida, md, "utf8");
    console.log(`[gerar-respostas-curadas] gravação em ${saida}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
