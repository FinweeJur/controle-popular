/**
 * Extrai o acervo `CLIPPING_DATA` do painel-fonte para
 * `apps/web/lib/paraopeba/clipping-ij.ts` — a curadoria que as três
 * instituições de justiça signatárias do Acordo (MPMG, MPF, DPMG) mantinham
 * na página `page-clipping` do painel.
 *
 * Gêmeo de `scripts/extrair-clipping-ati.mts`: mesmo método, mesmas
 * travas, outro array. O que muda está anotado abaixo.
 *
 * ═══ POR QUE UM SCRIPT, E NÃO UM COPIAR-E-COLAR ═══
 *
 * `docs/HANDOFF-PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md` (§3) mediu que estas
 * 59 matérias ficaram inteiras de fora da primeira ingestão do painel — o
 * mesmo tipo de perda que engoliu as 46 ATIs. O que se perde num
 * copiar-e-colar não é o texto: é a **prova de que o texto está completo**.
 * Aqui a contagem, o período e os rótulos saem todos do próprio arquivo, e
 * o script **aborta em vez de gravar** quando algo não bate.
 *
 * ═══ AS QUATRO ARMADILHAS DESTA FONTE ═══
 *
 * 1. **Acentuação.** O HTML é UTF-8 válido mas não declara `charset`. Lido
 *    com o default do sistema (cp1252 no Windows) sai `Ã§` no lugar de `ç` e
 *    ninguém percebe até a página estar no ar. A leitura é utf-8 explícita e
 *    há uma varredura de mojibake (`Ã` sem maiúscula depois, U+FFFD) que
 *    barra a gravação — e que roda de novo no arquivo já gravado, lendo do
 *    disco, porque erro de encoding nasce na escrita, não só na leitura.
 *
 * 2. **`CLIPPING_DATA` é literal de objeto JS, não JSON** — chaves sem
 *    aspas, aspas duplas dentro de texto com acento, travessão e colchete no
 *    meio dos `summary`. `JSON.parse` não lê. A leitura é por casamento de
 *    colchetes (ciente de string) + `node:vm`, sem dependência nova e sem
 *    regex adivinhando onde o array termina.
 *
 * 3. **Os rótulos dos temas moram DENTRO de uma função.** Diferente das
 *    ATIs, que têm `ATI_TEMA_LABEL` no topo do script, o clipping das IJs
 *    guarda `_clipLbl` e `_clipOrd` como consts locais de `renderClipping()`
 *    — e com emoji colado no rótulo (`'⚖️ Ação Penal'`). O recorte é o mesmo
 *    (nome da const + casamento de chaves); o emoji é removido na geração,
 *    porque no portal quem escolhe ícone é a tela, não o dado.
 *
 * 4. **Existem duas cópias do painel em disco, e só uma serve.** O
 *    `painel-paraopeba (V1).html` (376.048 bytes) é ANTERIOR: tem 130 itens
 *    em `NEWS_DATA`, 12 marcos e 8 pagamentos, contra os 149/17/9 que o
 *    portal já carrega. Extrair do V1 e regravar `clipping.ts`,
 *    `linha-do-tempo.ts` ou `auxilio.ts` apagaria 19 notícias, 5 marcos e 1
 *    pagamento — é a armadilha que `docs/HANDOFF-PAINEL-PARAOPEBA-PAGINAS-
 *    PERDIDAS.md` §0 registra. A `FONTE` abaixo aponta para a cópia de
 *    391.941 bytes, entregue pelo dono em 15/08/2026, que é de onde
 *    `clipping.ts` saiu. Mesmo assim este script **só escreve
 *    `clipping-ij.ts`**: os outros arquivos têm cada um o seu gerador, e
 *    misturar responsabilidades é como a perda começou.
 *
 * Uso:
 *   npx tsx scripts/extrair-clipping-ij.mts            # grava
 *   npx tsx scripts/extrair-clipping-ij.mts --conferir # só mede, não grava
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Painel entregue à mão pelo dono. Somente leitura — nunca reescrever.
 * Se o arquivo mudar de lugar, é esta linha (e só ela) que muda: o cabeçalho
 * do TS gerado cita `basename(FONTE)`, então nunca passa a mentir sozinho.
 */
const FONTE = "C:/Users/teste/Downloads/painel-paraopeba.html";
const DESTINO = resolve(RAIZ, "apps/web/lib/paraopeba/clipping-ij.ts");

const SO_CONFERIR = process.argv.includes("--conferir");

interface ItemBruto {
  id: string;
  inst: string;
  tema: string;
  date: string;
  /** Só em parte dos itens — amarra várias matérias ao mesmo fato. */
  group?: string;
  title: string;
  source: string;
  url: string;
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

/** Mesma ideia para literal de objeto (`INST_META`, `_clipLbl`). */
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

/**
 * `_clipLbl` traz o ícone colado no rótulo (`'⚖️ Ação Penal'`). No portal,
 * ícone é decisão da tela; o dado carrega só o nome do eixo.
 */
function semEmoji(rotulo: string): string {
  return rotulo.replace(/^[^\p{L}]+/u, "").trim();
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
const itens = avaliar<ItemBruto[]>(recortarArrayLiteral(html, "const CLIPPING_DATA"));
const metaInst = avaliar<Record<string, { label: string; full: string }>>(
  recortarObjetoLiteral(html, "const INST_META")
);
// `_clipLbl` e `_clipOrd` são locais de `renderClipping()` — ver armadilha 3.
const rotuloTema = avaliar<Record<string, string>>(recortarObjetoLiteral(html, "const _clipLbl"));
const ordemTemaFonte = avaliar<string[]>(recortarArrayLiteral(html, "const _clipOrd"));

// ─────────────────────────────────────────────────────────────────────────
// 3. Conferir ANTES de gravar — cada falha aborta
// ─────────────────────────────────────────────────────────────────────────
const problemas: string[] = [];

/** Obrigatórios em todo item. `group` fica de fora: só parte dos itens tem. */
const CAMPOS = ["id", "inst", "tema", "date", "title", "source", "url", "summary"] as const;
const CAMPOS_OPCIONAIS = ["group"] as const;

for (const item of itens) {
  for (const campo of CAMPOS) {
    const v = item[campo];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
      problemas.push(`item ${item.id}: campo "${campo}" vazio`);
    }
  }
  // Presente mas vazio é pior que ausente: viraria grupo de um item só.
  if ("group" in item && !item.group?.trim()) problemas.push(`item ${item.id}: group vazio`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) problemas.push(`item ${item.id}: data "${item.date}"`);
  if (!/^https?:\/\//.test(item.url)) problemas.push(`item ${item.id}: url "${item.url}"`);
  if (!metaInst[item.inst]) problemas.push(`item ${item.id}: instituição desconhecida "${item.inst}"`);
  if (!rotuloTema[item.tema]) problemas.push(`item ${item.id}: tema desconhecido "${item.tema}"`);
}

// Campo extra na fonte é sinal de que o painel evoluiu e este script ficou
// para trás — recusa, não descarta em silêncio.
const conhecidos = [...CAMPOS, ...CAMPOS_OPCIONAIS] as readonly string[];
const camposVistos = new Set(itens.flatMap((i) => Object.keys(i)));
for (const c of camposVistos) {
  if (!conhecidos.includes(c)) problemas.push(`campo novo na fonte: "${c}"`);
}

const ids = new Set(itens.map((i) => i.id));
if (ids.size !== itens.length) problemas.push(`ids repetidos: ${itens.length - ids.size}`);

const mojibake = acharMojibake(
  JSON.stringify(itens) + JSON.stringify(rotuloTema) + JSON.stringify(metaInst)
);
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

// Só os temas e instituições que APARECEM no dado viram tipo. `_clipOrd`
// lista sete (inclui `ati` e `outros`); o array usa cinco. Tipar os sete
// prometeria um filtro que a tela não teria como preencher.
const siglas = Object.keys(metaInst).filter((k) => itens.some((i) => i.inst === k));
const temas = ordemTemaFonte.filter((t) => itens.some((i) => i.tema === t));

const porInst = Object.fromEntries(siglas.map((k) => [k, itens.filter((i) => i.inst === k).length]));
const porTema = Object.fromEntries(temas.map((k) => [k, itens.filter((i) => i.tema === k).length]));

const comGrupo = itens.filter((i) => i.group).length;
const grupos = new Set(itens.filter((i) => i.group).map((i) => i.group));

console.log(`itens: ${itens.length}`);
console.log(`período: ${periodo.de} → ${periodo.ate}`);
console.log(`por instituição: ${JSON.stringify(porInst)}`);
console.log(`por tema: ${JSON.stringify(porTema)}`);
console.log(`com group: ${comGrupo} itens em ${grupos.size} fatos distintos`);

// Sobreposição com os acervos que já estão no portal. Não é para deduplicar
// — é para o cabeçalho do arquivo gerado poder AFIRMAR que são curadorias
// distintas com um número medido atrás da afirmação.
const chave = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function medirSobreposicao(arquivo: string, nomeConst: string) {
  const outros = avaliar<{ url: string; titulo: string; data: string }[]>(
    recortarArrayLiteral(readFileSync(resolve(RAIZ, arquivo), "utf8"), nomeConst)
  );
  const urls = new Set(outros.map((n) => chave(n.url)));
  const titulos = new Set(outros.map((n) => chave(n.titulo)));
  return {
    total: outros.length,
    // Início real do outro acervo, para o cabeçalho poder comparar cobertura
    // sem ninguém digitar "cinco anos antes" de memória.
    de: outros.map((n) => n.data).sort()[0],
    url: itens.filter((i) => urls.has(chave(i.url))).length,
    titulo: itens.filter((i) => titulos.has(chave(i.title))).length,
  };
}
const vsGeral = medirSobreposicao("apps/web/lib/paraopeba/clipping.ts", "export const CLIPPING_PARAOPEBA");
const vsAti = medirSobreposicao("apps/web/lib/paraopeba/clipping-ati.ts", "export const CLIPPING_ATI");
console.log(
  `sobreposição com clipping.ts (${vsGeral.total} itens): ${vsGeral.url} url(s), ${vsGeral.titulo} título(s)`
);
console.log(
  `sobreposição com clipping-ati.ts (${vsAti.total} itens): ${vsAti.url} url(s), ${vsAti.titulo} título(s)`
);

const anosDeVantagem = Number(vsGeral.de.slice(0, 4)) - Number(periodo.de.slice(0, 4));

/** O cabeçalho gerado precisa ler bem com 0, 1 ou N — inclusive daqui a um ano. */
const repeticao = (n: number, total: number, arquivo: string) =>
  n === 0
    ? `nenhum repete URL dos ${total} de \`${arquivo}\``
    : `${n} ${n === 1 ? "repete uma URL" : "repetem URL"} dos ${total} de \`${arquivo}\``;
console.log(`cobertura a mais que o clipping geral: ${anosDeVantagem} anos`);

if (SO_CONFERIR) {
  console.log("\n--conferir: nada gravado.");
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Gerar o TS — nomes de campo em português, como `clipping.ts`
// ─────────────────────────────────────────────────────────────────────────
const corpo = itens
  .map(
    (i) => `  {
    id: ${aspas(i.id)},
    instituicao: ${aspas(i.inst)},
    tema: ${aspas(i.tema)},
    titulo: ${aspas(i.title)},
    resumo: ${aspas(i.summary)},
    data: ${aspas(i.date)},
    fonte: ${aspas(i.source)},
    url: ${aspas(i.url)},${i.group ? `\n    grupo: ${aspas(i.group)},` : ""}
  },`
  )
  .join("\n");

const saida = `// GERADO por \`scripts/extrair-clipping-ij.mts\` a partir de
// \`${basename(FONTE)}\` (\`const CLIPPING_DATA\`, a página
// \`page-clipping\` do painel). Não editar à mão: rode o script de novo
// quando o painel-fonte mudar.
//
// Acervo histórico do painel-fonte — o portal NÃO recalcula, NÃO consulta
// API e NÃO atualiza sozinho. Como em \`clipping.ts\`, \`PERIODO_CLIPPING_IJ\`
// existe para toda tela rotular o acervo pelo período real que ele cobre.
// Os \`resumo\` são de autoria de quem montou o painel-fonte, não do Controle
// Popular, e chegam aqui sem uma vírgula de edição.
//
// ═══ TRÊS ACERVOS DE CLIPPING, TRÊS CURADORIAS ═══
//
// \`clipping.ts\` guarda o clipping geral, classificado por tipo de veículo.
// \`clipping-ati.ts\` guarda o das assessorias técnicas independentes. Este
// guarda o que as três instituições de justiça signatárias do Acordo —
// MPMG, MPF e DPMG — publicaram sobre a reparação, classificado por eixo.
//
// São curadorias distintas, medido: dos ${itens.length} itens daqui,
// ${repeticao(vsGeral.url, vsGeral.total, "clipping.ts")}
// e ${repeticao(vsAti.url, vsAti.total, "clipping-ati.ts")};
// ${vsGeral.titulo === 0 && vsAti.titulo === 0 ? "nenhum título se repete em nenhum dos dois" : `${vsGeral.titulo} e ${vsAti.titulo} títulos se repetem`}.
// Por isso os três arrays convivem sem deduplicação — juntá-los apagaria a
// classificação temática que só existe aqui.
//
// A cobertura também é outra: este acervo começa em ${periodo.de} e o
// clipping geral só em ${vsGeral.de}, ${anosDeVantagem} anos depois. É aqui, e só aqui, que
// o portal alcança a assinatura do Acordo de R$ 37,6 bi, em fevereiro de 2021.
//
// ═══ O CAMPO \`grupo\`, QUE NENHUM OUTRO ACERVO DO PORTAL TEM ═══
//
// ${comGrupo} dos ${itens.length} itens trazem \`grupo\`: é o mesmo FATO noticiado pelas três
// instituições em paralelo (a assinatura do Acordo, uma decisão do STJ), e o
// painel-fonte marcou isso à mão. São ${grupos.size} fatos distintos. Sem esse campo,
// a mesma decisão vira três notícias soltas e o acervo parece maior do que é.
//
// Ressalva de fidelidade: o painel-fonte AINDA agrupava, na hora de
// desenhar, itens sem \`grupo\` que compartilhassem a mesma URL. Isso é
// decisão de tela, não dado — só o \`grupo\` explícito atravessou para cá.

/** Instituição de justiça signatária do Acordo que publicou o material. */
export type SiglaInstituicaoJustica = ${siglas.map(aspas).join(" | ")};

export const INSTITUICAO_JUSTICA_LABEL: Record<SiglaInstituicaoJustica, string> = {
${siglas.map((s) => `  ${s}: ${aspas(metaInst[s].label)},`).join("\n")}
};

/** Nome por extenso, como o painel-fonte escreve no cabeçalho de cada item. */
export const INSTITUICAO_JUSTICA_NOME: Record<SiglaInstituicaoJustica, string> = {
${siglas.map((s) => `  ${s}: ${aspas(metaInst[s].full)},`).join("\n")}
};

/** Eixo temático da reparação, como o painel-fonte classificou. */
export type TemaClippingIj = ${temas.map(aspas).join(" | ")};

export const TEMA_CLIPPING_IJ_LABEL: Record<TemaClippingIj, string> = {
${temas.map((t) => `  ${t}: ${aspas(semEmoji(rotuloTema[t]))},`).join("\n")}
};

/** Ordem de exibição por tema — a mesma que o painel-fonte usava. */
export const TEMA_CLIPPING_IJ_ORDEM: TemaClippingIj[] = [${temas.map(aspas).join(", ")}];

export interface NoticiaInstituicaoJustica {
  id: string;
  /** Qual das três instituições de justiça publicou. */
  instituicao: SiglaInstituicaoJustica;
  /** Eixo temático da reparação sob o qual o painel-fonte classificou. */
  tema: TemaClippingIj;
  titulo: string;
  /** Resumo escrito por quem montou o painel-fonte, não pelo Controle Popular. */
  resumo: string;
  data: string;
  /** Veículo que publicou — nem sempre igual ao rótulo da instituição. */
  fonte: string;
  url: string;
  /** Mesmo fato noticiado por mais de uma instituição, quando o painel marcou. */
  grupo?: string;
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "notícias de hoje". */
export const PERIODO_CLIPPING_IJ = {
  de: ${aspas(periodo.de)},
  ate: ${aspas(periodo.ate)},
} as const;

export const CLIPPING_IJ: NoticiaInstituicaoJustica[] = [
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
