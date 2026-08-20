/**
 * Gera `apps/web/lib/paraopeba/sintese-ajri.ts` a partir de
 * `X:\DevCoder\_ajri\SINTESE-TEMATICA.md` — a síntese por eixos temáticos da
 * auditoria AECOM, já auditada contra os 337 resumos e contra o texto original
 * na fase de conteúdo (ver `PROMPT-HANDOFF-INTEGRACAO.md` naquela pasta).
 *
 * ═══ POR QUE A FONTE FICA FORA DO REPO ═══
 *
 * A mesma decisão de `gerar-resumo-ajri.mts`: o texto de trabalho de uso único
 * não é versionado ao lado do arquivo gerado, senão existem DUAS cópias do
 * mesmo conteúdo e alguém edita a que não está publicada. O que é versionado é
 * só o `.ts` gerado + este script.
 *
 * ═══ O QUE ESTE SCRIPT CONFERE (E POR QUÊ) ═══
 *
 * A auditoria do CONTEÚDO não se repete aqui — `SINTESE-TEMATICA.md` já passou
 * por `critico_sintese.py` (64 códigos de documento citados, todos reais; 3
 * citações fabricadas corrigidas). O que este script impede é que a
 * INTEGRAÇÃO corte, misture ou descaracterize a estrutura:
 *
 * 1. O documento tem que ter exatamente os 16 eixos temáticos com as quatro
 *    marcas de cada um (`Estado geral`, `Evolução no tempo`,
 *    `Achados mais relevantes`, `Números-chave`) — uma seção sem marca vira
 *    um eixo mudo, e uma marca perdida vira texto órfão.
 * 2. Todo achado tem que citar pelo menos um código de documento
 *    (`\d{5}-ACM-...`): é a ponte entre a síntese e a ficha, e é o que o
 *    crítico da fase de conteúdo conferiu um a um.
 * 3. As duas seções finais (transversais e fragilidades) têm que existir e
 *    ter itens — elas são a conclusão da síntese.
 * 4. Varredura de mojibake no arquivo gravado, relido do disco — erro de
 *    encoding nasce na escrita, não só na leitura.
 *
 * Uso:
 *   npx tsx scripts/gerar-sintese-ajri.mts            # grava
 *   npx tsx scripts/gerar-sintese-ajri.mts --conferir # só mede, não grava
 *   npx tsx scripts/gerar-sintese-ajri.mts --fonte=CAMINHO/outro.md
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Fora do repo, de propósito — ver o cabeçalho. */
const FONTE_PADRAO = resolve("X:\\DevCoder\\_ajri\\SINTESE-TEMATICA.md");
const DESTINO = resolve(RAIZ, "apps/web/lib/paraopeba/sintese-ajri.ts");

const SO_CONFERIR = process.argv.includes("--conferir");
const FONTE =
  process.argv.find((a) => a.startsWith("--fonte="))?.slice("--fonte=".length) ?? FONTE_PADRAO;

if (!existsSync(FONTE)) {
  console.error(`Fonte não encontrada: ${FONTE}`);
  process.exit(1);
}

const md = readFileSync(FONTE, "utf8");

/** `JSON.stringify` preserva unicode e escapa aspas/backtick — string segura p/ TS. */
const s = (t: string) => JSON.stringify(t);

interface Eixo {
  titulo: string;
  estadoGeral: string;
  evolucao: string;
  achados: string[];
  numerosChave: string;
}

interface Item {
  titulo: string;
  texto: string;
}

/** Código de documento do catálogo, ex. `60612553-ACM-DM-CO-RP-PM-0084-2026`. */
const CODIGO = /\d{5}-ACM-[A-Z0-9-]{8,}/;

/** Corta a marca `**Rótulo:** ` e o parágrafo seguinte, se houver. */
function depoisDoRotulo(linha: string, rotulo: string): string {
  const marca = `**${rotulo}:** `;
  const i = linha.indexOf(marca);
  if (i === -1) return "";
  return linha.slice(i + marca.length).trim();
}

/** Divide o md por seções `## `. O primeiro pedaço é o preâmbulo (H1). */
const secoes = md.split(/\n## /);

const executivo = (() => {
  const corpo = secoes.find((sx) => sx.startsWith("Resumo executivo"));
  if (!corpo) throw new Error("Seção 'Resumo executivo' não encontrada");
  const linha = corpo.split("\n").slice(1).find((l) => l.trim() && !l.startsWith("---"));
  if (!linha) throw new Error("Resumo executivo vazio");
  return linha.trim();
})();

const eixos: Eixo[] = [];
let transversais: Item[] = [];
let fragilidades: Item[] = [];

for (const secao of secoes) {
  const [cabecalho, ...linhas] = secao.split("\n");
  const titulo = cabecalho.trim();

  if (titulo === "Resumo executivo") continue;
  if (titulo.startsWith("# ")) continue; // preâmbulo (H1) — antes da primeira `##`
  if (titulo === "Pendências que atravessam o acervo inteiro") {
    const itens = linhas
      .map((l) => l.match(/^\d+\. \*\*(.+?)\*\*[,.]? (.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ titulo: m[1].trim(), texto: m[2].trim() }));
    if (itens.length === 0) throw new Error(`Seção '${titulo}' sem itens numerados`);
    transversais = itens;
    continue;
  }
  if (titulo === "Onde os dados são mais fraco") {
    const itens = linhas
      .map((l) => l.match(/^- \*\*(.+?)\*\*[,.]? (.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ titulo: m[1].trim(), texto: m[2].trim() }));
    if (itens.length === 0) throw new Error(`Seção '${titulo}' sem itens`);
    fragilidades = itens;
    continue;
  }

  const estadoGeral = linhas.map((l) => depoisDoRotulo(l, "Estado geral")).find((t) => t !== "");
  const evolucao = linhas.map((l) => depoisDoRotulo(l, "Evolução no tempo")).find((t) => t !== "");
  const achados = linhas.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
  const numerosChave = linhas.map((l) => depoisDoRotulo(l, "Números-chave")).find((t) => t !== "");

  if (!estadoGeral || !evolucao || achados.length === 0 || !numerosChave) {
    throw new Error(`Eixo '${titulo}' incompleto (faltou uma das quatro marcas ou os achados)`);
  }
  eixos.push({ titulo, estadoGeral, evolucao, achados, numerosChave });
}

if (eixos.length !== 16) {
  throw new Error(`Esperava 16 eixos temáticos, achei ${eixos.length}`);
}
for (const eixo of eixos) {
  for (const achado of eixo.achados) {
    // Exceção única e documentada: a ausência de menção a buscas/vítimas após
    // abril de 2024 não tem um documento específico a citar — é uma negação de
    // varredura sobre o conjunto, não um achado pontual.
    const negacaoDeAusencia = /^Nenhuma? menção|^Nenhum dos relatórios/.test(achado);
    if (!CODIGO.test(achado) && !negacaoDeAusencia) {
      throw new Error(`Achado sem código de documento no eixo '${eixo.titulo}': ${achado}`);
    }
  }
}
if (transversais.length === 0 || fragilidades.length === 0) {
  throw new Error("Seções finais (transversais/fragilidades) vazias");
}

const cabecalhoGerado = `/**
 * Síntese temática da auditoria AECOM — os 16 eixos do rompimento da barragem
 * B-I em Brumadinho (2019-2026), com o resumo executivo, as pendências que
 * atravessam o acervo inteiro e os pontos onde a base de evidência é mais
 * rasa. ARQUIVO GERADO — não editar à mão.
 *
 * ═══ ORIGEM ═══
 *
 * Gerado por \`scripts/gerar-sintese-ajri.mts\` a partir de
 * \`X:\\DevCoder\\_ajri\\SINTESE-TEMATICA.md\` (fora do repo, de propósito).
 * O conteúdo foi auditado na fase de conteúdo contra os 337 resumos e contra
 * o texto original — 64 códigos de documento citados, todos reais; 3 citações
 * fabricadas corrigidas. A integração não reaudita: só transpila e confere
 * estrutura. Para regenerar: \`npx tsx scripts/gerar-sintese-ajri.mts\`.
 *
 * ═══ AUTORIA ═══
 *
 * A síntese é obra deste portal, como os resumos — o material de origem é da
 * AECOM, publicada sob os termos de uso do portal da auditoria. Cada achado
 * carrega o código do documento que o sustenta (mesma ponte da ficha).
 */

export interface EixoDaSintese {
  /** Nome do eixo, ex. "Fornecimento e captação de água". */
  titulo: string;
  /** Balanço geral do eixo no conjunto dos 337 relatórios. */
  estadoGeral: string;
  /** Como o tema evoluiu entre 2019 e 2026. */
  evolucao: string;
  /** Achados com o código do documento que os sustenta entre parênteses. */
  achados: string[];
  /** Números-chave do eixo, com unidade, em texto corrido. */
  numerosChave: string;
}

export interface ItemDaSintese {
  titulo: string;
  texto: string;
}

export const SINTESE_AJRI = {
  /** O veredito do conjunto em um parágrafo. */
  executivo: ${s(executivo)},
  eixos: [
${eixos
  .map(
    (e) => `    {
      titulo: ${s(e.titulo)},
      estadoGeral: ${s(e.estadoGeral)},
      evolucao: ${s(e.evolucao)},
      achados: [${e.achados.map((a) => s(a)).join(", ")}],
      numerosChave: ${s(e.numerosChave)},
    },`,
  )
  .join("\n")}
  ],
  /** Pendências que reaparecem em vários eixos — o sinal estrutural mais forte. */
  transversais: [
${transversais.map((i) => `    { titulo: ${s(i.titulo)}, texto: ${s(i.texto)} },`).join("\n")}
  ],
  /** Eixos em que a base de evidência é mais rasa — antes de conclusões fortes. */
  fragilidades: [
${fragilidades.map((i) => `    { titulo: ${s(i.titulo)}, texto: ${s(i.texto)} },`).join("\n")}
  ],
} as const;
`;

function bytes(s: string): string {
  return `${(Buffer.byteLength(s, "utf8") / 1024).toFixed(1)} KiB`;
}

if (SO_CONFERIR) {
  console.log(`Fonte:      ${FONTE}`);
  console.log(`Eixos:      ${eixos.length}`);
  console.log(`Transversais: ${transversais.length} | Fragilidades: ${fragilidades.length}`);
  console.log(`Destino (~): ${bytes(cabecalhoGerado)} (sem acentuação conferida)`);
  process.exit(0);
}

writeFileSync(DESTINO, cabecalhoGerado, "utf8");

const relido = readFileSync(DESTINO, "utf8");
if (relido !== cabecalhoGerado) {
  throw new Error("Arquivo gravado e relido não batem — abortando");
}
if (relido.includes("\uFFFD")) {
  throw new Error("Mojibake detectado no arquivo gravado — abortando");
}

console.log(`Gravado:    ${DESTINO} (${bytes(relido)})`);