/**
 * Extrai o acervo `ATI_DATA` do painel-fonte para
 * `apps/web/lib/paraopeba/clipping-ati.ts`.
 *
 * ═══ POR QUE UM SCRIPT, E NÃO UM COPIAR-E-COLAR ═══
 *
 * A ingestão anterior do painel (`docs/PLANO-INGESTAO-PARAOPEBA.md`) trouxe
 * uma página de sete — `page-clipping` (`NEWS_DATA`) virou `clipping.ts`, e
 * `page-clipati` (`ATI_DATA`) se perdeu inteira. O que se perde num
 * copiar-e-colar não é o texto: é a **prova de que o texto está completo**.
 * Aqui a contagem, o período e os rótulos saem todos do próprio arquivo, e
 * o script **aborta em vez de gravar** quando algo não bate.
 *
 * ═══ AS TRÊS ARMADILHAS DESTA FONTE ═══
 *
 * 1. **Acentuação.** O HTML é UTF-8 válido mas não declara `charset`. Lido
 *    com o default do sistema (cp1252 no Windows) sai `Ã§` no lugar de `ç` e
 *    ninguém percebe até a página estar no ar. A leitura é utf-8 explícita e
 *    há uma varredura de mojibake (`Ã` sem maiúscula depois, U+FFFD) que
 *    barra a gravação.
 *
 * 2. **`ATI_DATA` é literal de objeto JS, não JSON** — chaves sem aspas,
 *    aspas duplas dentro de texto com acento. `JSON.parse` não lê. A leitura
 *    é por casamento de colchetes (ciente de string) + `node:vm`, sem
 *    dependência nova e sem regex adivinhando onde o array termina.
 *
 * 3. **Este arquivo é `(V1)`.** É a única cópia em disco, e tem 130 itens em
 *    `NEWS_DATA` contra os 149 que `clipping.ts` já carrega — ou seja, o
 *    clipping foi ingerido de uma versão MAIS NOVA que sumiu do disco. Por
 *    isso este script **não toca em `clipping.ts`**: regravá-lo a partir do
 *    V1 apagaria 19 notícias. Ele só escreve o arquivo das ATIs, que não
 *    existe em lugar nenhum do portal.
 *
 * Uso:
 *   npx tsx scripts/extrair-clipping-ati.mts            # grava
 *   npx tsx scripts/extrair-clipping-ati.mts --conferir # só mede, não grava
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Painel entregue à mão pelo dono. Somente leitura — nunca reescrever. */
const FONTE = "X:/DevCoder/Projetos html/painel-paraopeba (V1).html";
const DESTINO = resolve(RAIZ, "apps/web/lib/paraopeba/clipping-ati.ts");

const SO_CONFERIR = process.argv.includes("--conferir");

interface ItemBruto {
  id: string;
  ati: string;
  tema: string;
  date: string;
  title: string;
  source: string;
  url: string;
  tags: string[];
  summary: string;
}

/**
 * Recorta um literal de array a partir do nome da constante, casando
 * colchetes e ignorando os que estão dentro de string. Regex não serve: os
 * `summary` têm colchete e aspas no meio do texto.
 */
function recortarArrayLiteral(texto: string, nomeConst: string): string {
  const inicio = texto.indexOf(nomeConst);
  if (inicio < 0) throw new Error(`constante ${nomeConst} não existe na fonte`);
  const abre = texto.indexOf("[", texto.indexOf("=", inicio));
  let nivel = 0;
  let emString: string | null = null;
  for (let i = abre; i < texto.length; i++) {
    const c = texto[i];
    if (emString) {
      if (c === "\\") i++;
      else if (c === emString) emString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") emString = c;
    else if (c === "[") nivel++;
    else if (c === "]" && --nivel === 0) return texto.slice(abre, i + 1);
  }
  throw new Error(`array de ${nomeConst} não fecha`);
}

/** Mesma ideia para literal de objeto (`ATI_META`, `ATI_TEMA_LABEL`). */
function recortarObjetoLiteral(texto: string, nomeConst: string): string {
  const inicio = texto.indexOf(nomeConst);
  if (inicio < 0) throw new Error(`constante ${nomeConst} não existe na fonte`);
  const abre = texto.indexOf("{", texto.indexOf("=", inicio));
  let nivel = 0;
  let emString: string | null = null;
  for (let i = abre; i < texto.length; i++) {
    const c = texto[i];
    if (emString) {
      if (c === "\\") i++;
      else if (c === emString) emString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") emString = c;
    else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) return texto.slice(abre, i + 1);
  }
  throw new Error(`objeto de ${nomeConst} não fecha`);
}

function avaliar<T>(literal: string): T {
  return runInNewContext(`(${literal})`) as T;
}

/**
 * Mojibake de cp1252→utf-8 sempre produz `Ã` seguido de caractere que não é
 * letra maiúscula ASCII. `NÃO`, `SÃO` (maiúsculas legítimas) passam; `Ã§`,
 * `Ã£`, `Ãµ` são barrados. U+FFFD é substituição de decodificação perdida.
 */
function acharMojibake(texto: string): string[] {
  const achados: string[] = [];
  for (const m of texto.matchAll(/.{0,20}(?:Ã(?![A-Z])|\uFFFD).{0,20}/g)) {
    achados.push(m[0]);
  }
  return achados;
}

function aspas(s: string): string {
  return JSON.stringify(s);
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Ler a fonte com encoding explícito
// ─────────────────────────────────────────────────────────────────────────
if (!existsSync(FONTE)) {
  console.error(`Painel-fonte não encontrado em ${FONTE}`);
  console.error("O X: é VHD sem montagem automática — monte antes de rodar.");
  process.exit(1);
}
const html = readFileSync(FONTE, "utf8");
console.log(`fonte: ${FONTE} (${html.length.toLocaleString("pt-BR")} caracteres)`);

// ─────────────────────────────────────────────────────────────────────────
// 2. Recortar e avaliar os quatro pedaços que a tela do painel usa
// ─────────────────────────────────────────────────────────────────────────
const itens = avaliar<ItemBruto[]>(recortarArrayLiteral(html, "const ATI_DATA"));
const metaAti = avaliar<Record<string, { label: string }>>(
  recortarObjetoLiteral(html, "const ATI_META")
);
const rotuloTema = avaliar<Record<string, string>>(
  recortarObjetoLiteral(html, "const ATI_TEMA_LABEL")
);
// Ordem de exibição por tema, como a própria tela do painel agrupa.
const ordemTema = avaliar<string[]>(recortarArrayLiteral(html, "const temaOrder")).filter(
  (t) => t !== "outros"
);

// ─────────────────────────────────────────────────────────────────────────
// 3. Conferir ANTES de gravar — cada falha aborta
// ─────────────────────────────────────────────────────────────────────────
const problemas: string[] = [];

const CAMPOS = ["id", "ati", "tema", "date", "title", "source", "url", "tags", "summary"] as const;
for (const item of itens) {
  for (const campo of CAMPOS) {
    const v = item[campo];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      problemas.push(`item ${item.id}: campo "${campo}" vazio`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) problemas.push(`item ${item.id}: data "${item.date}"`);
  if (!/^https?:\/\//.test(item.url)) problemas.push(`item ${item.id}: url "${item.url}"`);
  if (!metaAti[item.ati]) problemas.push(`item ${item.id}: ATI desconhecida "${item.ati}"`);
  if (!rotuloTema[item.tema]) problemas.push(`item ${item.id}: tema desconhecido "${item.tema}"`);
}

// Campo extra na fonte é sinal de que o painel evoluiu e este script ficou
// para trás — recusa, não descarta em silêncio.
const camposVistos = new Set(itens.flatMap((i) => Object.keys(i)));
for (const c of camposVistos) {
  if (!(CAMPOS as readonly string[]).includes(c)) problemas.push(`campo novo na fonte: "${c}"`);
}

const ids = new Set(itens.map((i) => i.id));
if (ids.size !== itens.length) problemas.push(`ids repetidos: ${itens.length - ids.size}`);

const mojibake = acharMojibake(JSON.stringify(itens) + JSON.stringify(rotuloTema));
if (mojibake.length) {
  problemas.push(`acentuação corrompida em ${mojibake.length} trecho(s): ${mojibake[0]}`);
}

if (problemas.length) {
  console.error("\nABORTADO — a fonte não passou na conferência:");
  for (const p of problemas.slice(0, 20)) console.error(`  · ${p}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Medir (nunca estimar) o que o cabeçalho do arquivo vai afirmar
// ─────────────────────────────────────────────────────────────────────────
const datas = itens.map((i) => i.date).sort();
const periodo = { de: datas[0], ate: datas[datas.length - 1] };
const porAti = Object.fromEntries(
  Object.keys(metaAti).map((k) => [k, itens.filter((i) => i.ati === k).length])
);
const porTema = Object.fromEntries(
  ordemTema.map((k) => [k, itens.filter((i) => i.tema === k).length])
);

console.log(`itens: ${itens.length}`);
console.log(`período: ${periodo.de} → ${periodo.ate}`);
console.log(`por ATI: ${JSON.stringify(porAti)}`);
console.log(`por tema: ${JSON.stringify(porTema)}`);
console.log(`tags distintas: ${new Set(itens.flatMap((i) => i.tags)).size}`);

// Sobreposição com o acervo que já está no portal. Não é para deduplicar —
// é para o cabeçalho do arquivo gerado poder AFIRMAR que são curadorias
// distintas com um número medido atrás da afirmação.
const CLIPPING_TS = resolve(RAIZ, "apps/web/lib/paraopeba/clipping.ts");
const jaNoPortal = avaliar<{ url: string; titulo: string }[]>(
  recortarArrayLiteral(readFileSync(CLIPPING_TS, "utf8"), "export const CLIPPING_PARAOPEBA")
);
const chave = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const urlsPortal = new Set(jaNoPortal.map((n) => chave(n.url)));
const titulosPortal = new Set(jaNoPortal.map((n) => chave(n.titulo)));
const urlRepetida = itens.filter((i) => urlsPortal.has(chave(i.url))).length;
const tituloRepetido = itens.filter((i) => titulosPortal.has(chave(i.title))).length;
console.log(
  `sobreposição com clipping.ts (${jaNoPortal.length} itens): ${urlRepetida} url(s), ${tituloRepetido} título(s)`
);

if (SO_CONFERIR) {
  console.log("\n--conferir: nada gravado.");
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Gerar o TS — nomes de campo em português, como `clipping.ts`
// ─────────────────────────────────────────────────────────────────────────
const siglas = Object.keys(metaAti);
const temas = ordemTema;

const corpo = itens
  .map(
    (i) => `  {
    id: ${aspas(i.id)},
    ati: ${aspas(i.ati)},
    tema: ${aspas(i.tema)},
    titulo: ${aspas(i.title)},
    resumo: ${aspas(i.summary)},
    data: ${aspas(i.date)},
    fonte: ${aspas(i.source)},
    url: ${aspas(i.url)},
    tags: [${i.tags.map(aspas).join(", ")}],
  },`
  )
  .join("\n");

const saida = `// GERADO por \`scripts/extrair-clipping-ati.mts\` a partir de
// \`painel-paraopeba (V1).html\` (\`const ATI_DATA\`, a página \`page-clipati\`).
// Não editar à mão: rode o script de novo quando o painel-fonte mudar.
//
// Acervo histórico do painel-fonte — o portal NÃO recalcula, NÃO consulta
// API e NÃO atualiza sozinho. Como em \`clipping.ts\`, \`PERIODO_CLIPPING_ATI\`
// existe para toda tela rotular o acervo pelo período real que ele cobre.
//
// ═══ O QUE ESTE ARQUIVO TEM QUE \`clipping.ts\` NÃO TEM ═══
//
// \`clipping.ts\` guarda o clipping geral, classificado por tipo de veículo
// (imprensa, institucional, movimento, assessoria). Este guarda a curadoria
// separada que o painel mantinha na página das ATIs, com duas chaves que o
// outro acervo não tem: **qual ATI produziu** (\`ati\`) e **sob qual tema da
// reparação** (\`tema\`). São curadorias distintas, medido: dos ${itens.length} itens
// daqui, ${urlRepetida} apontam para uma URL que também aparece nos ${jaNoPortal.length} de
// \`clipping.ts\`, e ${tituloRepetido === 0 ? "nenhum título se repete" : `${tituloRepetido} título(s) se repetem`}. Por isso os dois arrays convivem
// sem deduplicação — juntá-los apagaria a classificação temática.
//
// As três ATIs foram eleitas pelas comunidades atingidas e dividem as cinco
// regiões do processo: AEDAS (Regiões 1 e 2), NACAB (Região 3) e Instituto
// Guaicuy (Regiões 4 e 5).

/** Sigla da Assessoria Técnica Independente que produziu o material. */
export type SiglaAti = ${siglas.map((s) => aspas(s)).join(" | ")};

export const ATI_LABEL: Record<SiglaAti, string> = {
${siglas.map((s) => `  ${s}: ${aspas(metaAti[s].label)},`).join("\n")}
};

/** Região do processo em que cada ATI atua — do cabeçalho do painel-fonte. */
export const ATI_REGIOES: Record<SiglaAti, string> = {
  aedas: "Regiões 1 e 2",
  nacab: "Região 3",
  guaicuy: "Regiões 4 e 5",
};

/** Eixo temático da reparação, como o painel-fonte classificou. */
export type TemaAti = ${temas.map((t) => aspas(t)).join(" | ")};

export const TEMA_ATI_LABEL: Record<TemaAti, string> = {
${temas.map((t) => `  ${t}: ${aspas(rotuloTema[t])},`).join("\n")}
};

/** Ordem de exibição por tema — a mesma que o painel-fonte usava. */
export const TEMA_ATI_ORDEM: TemaAti[] = [${temas.map(aspas).join(", ")}];

export interface NoticiaAti {
  id: string;
  /** Qual das três ATIs produziu o material. */
  ati: SiglaAti;
  /** Eixo temático da reparação sob o qual o painel-fonte classificou. */
  tema: TemaAti;
  titulo: string;
  /** Resumo escrito por quem montou o painel-fonte, não pelo Controle Popular. */
  resumo: string;
  data: string;
  /** Veículo/organização que publicou — nem sempre igual ao rótulo da ATI. */
  fonte: string;
  url: string;
  tags: string[];
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "notícias de hoje". */
export const PERIODO_CLIPPING_ATI = {
  de: ${aspas(periodo.de)},
  ate: ${aspas(periodo.ate)},
} as const;

export const CLIPPING_ATI: NoticiaAti[] = [
${corpo}
];
`;

writeFileSync(DESTINO, saida, "utf8");

// Reler o que foi gravado e conferir a acentuação no disco, não na memória.
const gravado = readFileSync(DESTINO, "utf8");
const sujeira = acharMojibake(gravado);
if (sujeira.length) {
  console.error(`\nARQUIVO GRAVADO COM ACENTO CORROMPIDO: ${sujeira[0]}`);
  process.exit(1);
}
console.log(`\ngravado: ${DESTINO} (${gravado.length.toLocaleString("pt-BR")} caracteres)`);
