/**
 * extrair-educacao-paraopeba.mts — traz o glossário e as perguntas frequentes
 * do painel-fonte para `lib/paraopeba/educacao.ts`.
 *
 *   npx tsx scripts/extrair-educacao-paraopeba.mts          # grava
 *   npx tsx scripts/extrair-educacao-paraopeba.mts --seco   # só mede
 *
 * ## O que entra, e o que fica de fora
 *
 * A página `page-educacao` do painel tinha quatro blocos. Este script traz
 * dois:
 *
 *   EDU_GLOSSARIO — 15 verbetes (NAE, PTR, PNAB, ERSHRE…)
 *   EDU_FAQ       — 9 perguntas e respostas
 *
 * **`EDU_TIMELINE` fica DE FORA de propósito**, e a reconciliação que este
 * comentário pedia já foi feita à mão em 15/08/2026 (`96de91e`): os 6 itens
 * dela anteriores a 2025 entraram em `lib/paraopeba/linha-do-tempo.ts`, que
 * passou de 17 para **23** marcos — e o primeiro deles é o rompimento, que o
 * portal não tinha.
 *
 * Continua fora do script porque a fusão é item a item: dos **16** itens da
 * `EDU_TIMELINE`, 10 já existiam no portal com dado melhor (o painel para em
 * "Mai/2026 · STF analisa" e o portal já tem junho e julho; o painel junta num
 * item só o que o portal separa em 07/05 e 14/05). Importar por cima
 * rebaixaria esses dez. Isso não é trabalho de script.
 *
 * ⚠️ A versão anterior deste comentário dizia que o painel tinha **12** itens.
 * Contados em 15/08: são **16**. O número errado é o que sustentava a
 * conclusão de que importar "apagaria cinco".
 *
 * ## Por que glossário e FAQ valem a ingestão
 *
 * São o único material do painel escrito para quem **não** acompanha o caso.
 * O resto do bloco Paraopeba pressupõe que o leitor sabe o que é NAE, PTR e
 * zona quente — e essas três siglas aparecem em quase toda página. Sem o
 * glossário, o portal explica o processo para quem já entende o processo.
 *
 * ## Regras que o script aplica, e aborta se falharem
 *
 * 1. Campo faltando ou campo novo no painel ⇒ **aborta**. Ingestão silenciosa
 *    de estrutura mudada foi o que fez o clipping perder três acervos.
 * 2. Acento corrompido no resultado ⇒ **aborta**. O arquivo-fonte tem
 *    codificação traiçoeira: lido sem `utf-8` explícito, vira mojibake.
 * 3. Autoria: o texto é do painel-fonte, não do Controle Popular. O arquivo
 *    gerado diz isso no topo, e a página tem de repetir.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = "X:\\DevCoder\\Projetos html\\painel-paraopeba (V1).html";
const SAIDA = path.join(RAIZ, "apps", "web", "lib", "paraopeba", "educacao.ts");
const SECO = process.argv.includes("--seco");

/** Recorta o array literal `NOME = [...]` equilibrando colchetes. */
function corpoDoArray(html: string, nome: string): string {
  const m = new RegExp(`${nome}\\s*=\\s*\\[`).exec(html);
  if (!m) throw new Error(`ABORTADO: ${nome} não existe no painel-fonte.`);
  let profundidade = 0;
  const inicio = m.index + m[0].length - 1;
  for (let k = inicio; k < html.length; k++) {
    if (html[k] === "[") profundidade++;
    else if (html[k] === "]") {
      profundidade--;
      if (profundidade === 0) return html.slice(inicio, k + 1);
    }
  }
  throw new Error(`ABORTADO: ${nome} não fecha.`);
}

/**
 * Lê objetos `{chave:"valor"}` de um array literal de JS.
 *
 * Não uso `JSON.parse`: as chaves do painel não têm aspas e as strings usam
 * escapes de JS. E não uso `eval`, por motivo óbvio num arquivo de terceiro.
 */
function objetos(corpo: string, chaves: string[]): Record<string, string>[] {
  const saida: Record<string, string>[] = [];
  const blocos = corpo.matchAll(/\{([^{}]*)\}/gs);
  for (const bloco of blocos) {
    const item: Record<string, string> = {};
    for (const chave of chaves) {
      const m = new RegExp(`\\b${chave}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s").exec(bloco[1]);
      if (!m) throw new Error(`ABORTADO: item sem o campo "${chave}" — a estrutura do painel mudou.`);
      item[chave] = m[1].replace(/\\"/g, '"').replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    }
    // Campo que o painel ganhou e este script não conhece: parar é melhor que
    // ingerir pela metade e ninguém notar.
    //
    // ⚠️ A varredura tem de ignorar o CONTEÚDO das strings, e isso não é
    // detalhe: a primeira versão abortou acusando um campo novo chamado
    // "Valor" que não existe — ele aparece dentro de uma definição
    // ("Valor: R$ 133,1 mi/mês."). Uma trava que dispara no texto em vez de na
    // estrutura é pior que trava nenhuma, porque ensina a ignorá-la.
    const semStrings = bloco[1].replace(/"(?:[^"\\]|\\.)*"/gs, '""');
    const conhecidos = new Set(chaves);
    for (const m of semStrings.matchAll(/\b([a-zA-Z_]+)\s*:/g)) {
      if (!conhecidos.has(m[1])) {
        throw new Error(`ABORTADO: campo novo "${m[1]}" no painel — confira antes de ingerir.`);
      }
    }
    saida.push(item);
  }
  return saida;
}

const html = readFileSync(FONTE, "utf-8");
const glossario = objetos(corpoDoArray(html, "EDU_GLOSSARIO"), ["t", "d"]);
const faq = objetos(corpoDoArray(html, "EDU_FAQ"), ["q", "a"]);

const tudo = JSON.stringify({ glossario, faq });
if (/\uFFFD/.test(tudo)) throw new Error("ABORTADO: acento corrompido no resultado.");

console.log(`glossário: ${glossario.length} verbetes`);
console.log(`perguntas: ${faq.length}`);
if (SECO) {
  console.log("--seco: nada foi escrito.");
  process.exit(0);
}

const arquivo = `// GERADO por scripts/extrair-educacao-paraopeba.mts — não editar à mão.
//
// Glossário e perguntas frequentes do painel-fonte do Paraopeba.
//
// ⚠️ O TEXTO É DA FONTE, NÃO NOSSO. Quem escreveu as definições e as respostas
// foi quem montou o painel; o Controle Popular só reexibe. A página tem de
// dizer isso — atribuir a nós a explicação de um caso em que somos observador
// seria assumir uma autoridade que não temos.
//
// A linha do tempo do painel (EDU_TIMELINE) NÃO entra aqui, e o motivo mudou
// em 15/08/2026 (`96de91e`): os 6 marcos dela anteriores a 2025 FORAM fundidos
// à mão em `linha-do-tempo.ts`, que passou de 17 para 23 marcos. Continua fora
// deste script porque a fusão é item a item — dos 16 itens da EDU_TIMELINE, 10
// já existiam no portal com dado melhor, e importar por cima os rebaixaria.
//
// ⚠️ A contagem anterior deste comentário dizia que o painel tinha 12 itens.
// Contados em 15/08: são 16.

export interface Verbete {
  /** A sigla ou o termo, como o painel escreve. */
  termo: string;
  /** A definição, palavra por palavra da fonte. */
  definicao: string;
}

export interface Pergunta {
  pergunta: string;
  resposta: string;
}

export const GLOSSARIO_PARAOPEBA: Verbete[] = ${JSON.stringify(
  glossario.map((g) => ({ termo: g.t, definicao: g.d })),
  null,
  2
)};

export const PERGUNTAS_PARAOPEBA: Pergunta[] = ${JSON.stringify(
  faq.map((f) => ({ pergunta: f.q, resposta: f.a })),
  null,
  2
)};
`;

writeFileSync(SAIDA, arquivo, "utf-8");

// Reconfere lendo do disco: gravar e acreditar é como o mojibake passa.
const relido = readFileSync(SAIDA, "utf-8");
if (/\uFFFD/.test(relido)) throw new Error("ABORTADO: o arquivo gravado tem acento corrompido.");
console.log(`gravado em ${path.relative(RAIZ, SAIDA)}`);
