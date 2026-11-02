#!/usr/bin/env node
/**
 * auditar-mobile.mjs — conformidade e responsividade mobile do portal.
 *
 * Papel no portal: varre as paginas do App Router (todo page.tsx de app/)
 * e aponta o que quebra a regua de 390 px antes de chegar ao leitor. E a
 * versao executavel do §5.14 (o celular e a regua) e do §5.16 (fonte minima
 * de 12 px) do AGENTS.md. Nao substitui olho humano: contraste, alvo de
 * 44 px, ordem de foco e texto sobre imagem continuam na checklist de
 * docs/03-desenvolvimento/CONFORMIDADE-MOBILE.md.
 *
 * Regras medidas (uma por achado):
 *   1. `text-[9px]`, `text-[10px]`, `text-[11px]` — §5.16;
 *   2. `w-[NNNpx]` / `min-w-[...]` acima de 360 px sem `overflow-x-auto`
 *      no proprio elemento nem em ancestral (rolagem lateral falsa);
 *   3. `<table>` sem `overflow-x-auto` em ancestral proximo;
 *   4. `<img>` / `<Image>` sem `sizes`, `width` ou `height`;
 *   5. `<button>` / `<a>` / `<Link>` so com icone e sem `aria-label`.
 *
 * Decisoes nao triviais:
 *   - regex + leitor de tag proprio em vez de parser DOM: sao centenas de
 *     arquivos TSX, o defeito e textual (`className`), e dependencia nova
 *     para isso nao paga o peso (mesma escolha de auditar-seo.mts);
 *   - a pilha de tags acha o ancestral de verdade, entao `<table>` dentro de
 *     `<div className="overflow-x-auto">` nao vira falso positivo;
 *   - `rem`/`em` sao convertidos a 16 px: `min-w-[34rem]` (544 px) quebra a
 *     regua igual a `min-w-[544px]`;
 *   - so `overflow-x-auto`/`scroll` contam como rolagem. `overflow-hidden`
 *     corta conteudo, entao continua sendo achado;
 *   - comentario de bloco e mascarado antes da varredura para nao acusar
 *     exemplo de codigo dentro de documentacao JSX.
 *
 * Uso:
 *   node scripts/auditar-mobile.mjs                 # paginas (padrao)
 *   node scripts/auditar-mobile.mjs --escopo=app    # todo .tsx de app/
 *   node scripts/auditar-mobile.mjs --resumo        # so o placar por regra
 *   npm run auditar:mobile
 *
 * Codigo de saida: 0 = nenhum achado; 1 = ha achado (serve de porteiro
 * local e de gatilho de CI futura).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const APP = join(RAIZ, "apps", "web", "app");

const REGRAS = [
  { id: 1, titulo: "Fonte abaixo de 12 px (AGENTS 5.16)" },
  { id: 2, titulo: "Largura fixa acima de 360 px sem overflow-x-auto" },
  { id: 3, titulo: "Tabela sem overflow-x-auto em ancestral" },
  { id: 4, titulo: "Imagem sem sizes/width/height" },
  { id: 5, titulo: "Botao ou link so com icone e sem aria-label" },
];

/**
 * Wrappers do proprio portal que ja entregam rolagem horizontal. `TabelaScroll`
 * (app/[municipio]/components) e um div com `overflow-x-auto` mais a
 * affordance de seta; sem esta lista, toda tabela dentro dele vira falso
 * positivo. Nome novo de wrapper entra aqui.
 */
const WRAPPERS_ROLAGEM = new Set(["TabelaScroll", "TabelaRolavel", "TableScroll"]);

const ASPAS = new Set(['"', "'", "`"]);
const TAGS_IMAGEM = new Set(["img", "Image"]);
const TAGS_ACIONAVEIS = new Set(["button", "a", "Link"]);
const ESCOPOS = new Set(["paginas", "app"]);

function lerArgs() {
  const args = process.argv.slice(2);
  const escopo = args.find((a) => a.startsWith("--escopo="))?.split("=")[1] ?? "paginas";
  if (!ESCOPOS.has(escopo)) {
    console.error("--escopo aceita 'paginas' (padrao) ou 'app'.");
    process.exit(2);
  }
  return { escopo, resumo: args.includes("--resumo") };
}

function ignorarEntrada(nome) {
  if (nome === "node_modules") return true;
  return nome.startsWith(".");
}

/** Todo arquivo do escopo, em ordem estavel. */
function listarArquivos(dir, escopo) {
  const saida = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (ignorarEntrada(entrada.name)) continue;
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      saida.push(...listarArquivos(caminho, escopo));
    } else if (escopo === "paginas" ? entrada.name === "page.tsx" : entrada.name.endsWith(".tsx")) {
      saida.push(caminho);
    }
  }
  return saida.sort();
}

/** Troca comentarios de bloco por espacos, preservando offsets e linhas. */
function mascararComentarios(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, " "));
}

function avancarString(src, i) {
  const aspas = src[i];
  i += 1;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === aspas) return i + 1;
    i += 1;
  }
  return i;
}

/** Pula uma expressao `{...}`, inclusive `{}` aninhado e strings. */
function avancarChaves(src, i) {
  let profundidade = 0;
  while (i < src.length) {
    const c = src[i];
    if (ASPAS.has(c)) {
      i = avancarString(src, i);
      continue;
    }
    if (c === "{") profundidade += 1;
    if (c === "}") profundidade -= 1;
    i += 1;
    if (profundidade === 0) return i;
  }
  return i;
}

/** Nome da tag, se fecha ou nao, e onde os atributos comecam. */
function lerNome(src, inicio) {
  let i = inicio + 1;
  const fechamento = src[i] === "/";
  if (fechamento) i += 1;
  const nomeInicio = i;
  while (i < src.length && /[A-Za-z0-9.:_-]/.test(src[i])) i += 1;
  return { nome: src.slice(nomeInicio, i), fechamento, cursor: i };
}

/** Posicao logo depois do `>`, respeitando strings e `{...}`. */
function fimDaTag(src, i) {
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = avancarString(src, i);
      continue;
    }
    if (c === "{") {
      i = avancarChaves(src, i);
      continue;
    }
    if (c === ">") return i + 1;
    i += 1;
  }
  return -1;
}

/** Le uma tag a partir do `<`; null quando nao e tag de JSX. */
function lerTag(src, inicio) {
  const { nome, fechamento, cursor } = lerNome(src, inicio);
  if (!nome) return null;
  const fim = fimDaTag(src, cursor);
  if (fim === -1) return null;
  const texto = src.slice(inicio, fim);
  return {
    inicio,
    fim,
    nome,
    fechamento,
    autoFechada: /\/\s*>$/.test(texto),
    texto,
    pai: null,
    fimConteudo: fim,
  };
}

function lerTagSeValida(src, inicio) {
  const proximo = src[inicio + 1];
  if (!proximo) return null;
  if (!/[A-Za-z/>]/.test(proximo)) return null;
  return lerTag(src, inicio);
}

function tagAberta(t) {
  if (t.fechamento) return false;
  if (t.autoFechada) return false;
  return !t.fechada;
}

function podeFechar(aberta, nome) {
  if (aberta.fechamento) return false;
  if (aberta.autoFechada) return false;
  return aberta.nome === nome;
}

/** Fecha a tag aberta de mesmo nome mais proxima da pilha. */
function fecharTag(tags, tag) {
  for (let p = tags.length - 1; p >= 0; p -= 1) {
    const aberta = tags[p];
    if (podeFechar(aberta, tag.nome)) {
      aberta.fimConteudo = tag.inicio;
      aberta.fechada = true;
      return;
    }
  }
}

function aplicarPilha(tags, tag) {
  if (tag.fechamento) {
    fecharTag(tags, tag);
    return;
  }
  const abertas = tags.filter(tagAberta);
  tag.pai = abertas.length ? abertas[abertas.length - 1] : null;
}

/** Todas as tags do arquivo, em ordem, com pai e intervalo de conteudo. */
function analisarTags(texto) {
  const src = mascararComentarios(texto);
  const tags = [];
  let i = 0;
  while (i < src.length) {
    const menor = src.indexOf("<", i);
    if (menor === -1) break;
    const tag = lerTagSeValida(src, menor);
    if (!tag) {
      i = menor + 1;
      continue;
    }
    aplicarPilha(tags, tag);
    tags.push(tag);
    i = tag.fim;
  }
  return tags;
}

function atributo(tag, nome) {
  const re = new RegExp(`\\b${nome}=(?:"([^"]*)"|'([^']*)'|\\{\`([^\`]*)\`\\})`);
  const m = re.exec(tag.texto);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

function temAtributo(tag, nome) {
  return new RegExp(`\\b${nome}\\b`).test(tag.texto);
}

function classes(tag) {
  const bruto = atributo(tag, "className") ?? "";
  return bruto.split(/\s+/).filter(Boolean);
}

function cadeia(tag) {
  const saida = [];
  for (let atual = tag; atual; atual = atual.pai) saida.push(atual);
  return saida;
}

function tagRola(t) {
  if (WRAPPERS_ROLAGEM.has(t.nome)) return true;
  return classes(t).some((c) => /^overflow-(x-)?(auto|scroll)$/.test(c));
}

function temRolagem(tags) {
  return tags.some(tagRola);
}

/** Converte `520px`, `34rem`, `90` (espacamento Tailwind) em px. */
function larguraEmPx(valor) {
  const px = /^(\d+(?:\.\d+)?)px$/.exec(valor);
  if (px) return Number(px[1]);
  const rem = /^(\d+(?:\.\d+)?)rem$/.exec(valor);
  if (rem) return Number(rem[1]) * 16;
  const em = /^(\d+(?:\.\d+)?)em$/.exec(valor);
  if (em) return Number(em[1]) * 16;
  return null;
}

function textoVisivel(conteudo) {
  return conteudo
    // `{expressao}` que nao carrega JSX e texto vindo do dado (`{n.titulo}`);
    // so a expressao com `<` e elemento/icone e pode ser descartada.
    .replace(/\{([^{}]*)\}/g, (_, expr) => (expr.includes("<") ? " " : " x "))
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function temIcone(conteudo) {
  return /<(svg|img|Image|[A-Z][A-Za-z0-9]*)\b/.test(conteudo);
}

function temNomeAcessivel(tag) {
  if (temAtributo(tag, "aria-label")) return true;
  return temAtributo(tag, "title");
}

function achadosDeFonte(tag) {
  return classes(tag)
    .filter((c) => /^text-\[(9|10|11)px\]$/.test(c))
    .map((c) => ({ regra: 1, detalhe: c }));
}

function achadosDeLargura(tag) {
  const achados = [];
  for (const c of classes(tag)) {
    const m = /^(min-)?w-\[([^\]]+)\]$/.exec(c);
    if (!m) continue;
    const px = larguraEmPx(m[2]);
    if (px === null) continue;
    if (px <= 360) continue;
    if (temRolagem(cadeia(tag))) continue;
    achados.push({ regra: 2, detalhe: `${c} (${px} px)` });
  }
  return achados;
}

function achadosDeTabela(tag) {
  if (tag.nome !== "table") return [];
  if (temRolagem(cadeia(tag).slice(1))) return [];
  return [{ regra: 3, detalhe: "<table> sem rolagem horizontal no ancestral" }];
}

/** `fill` so e seguro com `sizes`; nas demais, qualquer dimensao serve. */
function imagemTemDimensao(tag) {
  if (temAtributo(tag, "fill")) return temAtributo(tag, "sizes");
  return ["sizes", "width", "height"].some((a) => temAtributo(tag, a));
}

function achadosDeImagem(tag) {
  if (!TAGS_IMAGEM.has(tag.nome)) return [];
  if (imagemTemDimensao(tag)) return [];
  const detalhe = temAtributo(tag, "fill") ? "<Image fill> sem sizes" : "<img> sem sizes/width/height";
  return [{ regra: 4, detalhe }];
}

function achadosDeIcone(tag, texto) {
  if (!TAGS_ACIONAVEIS.has(tag.nome)) return [];
  if (tag.autoFechada) return [];
  if (temNomeAcessivel(tag)) return [];
  const conteudo = texto.slice(tag.fim, tag.fimConteudo);
  if (!temIcone(conteudo)) return [];
  if (textoVisivel(conteudo) !== "") return [];
  return [{ regra: 5, detalhe: `<${tag.nome}> com icone sem aria-label` }];
}

function achadosDaTag(tag, texto) {
  return [
    ...achadosDeFonte(tag),
    ...achadosDeLargura(tag),
    ...achadosDeTabela(tag),
    ...achadosDeImagem(tag),
    ...achadosDeIcone(tag, texto),
  ];
}

function indicesDeLinha(texto) {
  const linhas = [0];
  for (let i = 0; i < texto.length; i += 1) if (texto[i] === "\n") linhas.push(i + 1);
  return linhas;
}

function linhaDe(linhas, posicao) {
  let baixo = 0;
  let alto = linhas.length - 1;
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2);
    if (linhas[meio] <= posicao) baixo = meio;
    else alto = meio - 1;
  }
  return baixo + 1;
}

function criarRegistrador(caminho, linhas) {
  const arquivo = relative(RAIZ, caminho).split(sep).join("/");
  return (regra, tag, detalhe) => ({
    regra,
    arquivo,
    linha: linhaDe(linhas, tag.inicio),
    detalhe,
  });
}

function analisarArquivo(caminho, texto) {
  const tags = analisarTags(texto);
  const registrar = criarRegistrador(caminho, indicesDeLinha(texto));
  const achados = [];
  for (const tag of tags) {
    if (tag.fechamento) continue;
    for (const achado of achadosDaTag(tag, texto)) {
      achados.push(registrar(achado.regra, tag, achado.detalhe));
    }
  }
  return achados;
}

const { escopo, resumo } = lerArgs();
const arquivos = listarArquivos(APP, escopo);
const todos = [];
for (const arquivo of arquivos) {
  todos.push(...analisarArquivo(arquivo, readFileSync(arquivo, "utf8")));
}

const porRegra = new Map(REGRAS.map((r) => [r.id, []]));
for (const achado of todos) porRegra.get(achado.regra).push(achado);

const rotulo = escopo === "paginas" ? "rotas (page.tsx)" : "arquivos .tsx de app/";
console.log(`\nAuditoria mobile — ${arquivos.length} ${rotulo}`);
console.log(`Raiz: ${RAIZ}`);
console.log(`Data: ${new Date().toISOString().slice(0, 10)}\n`);

for (const regra of REGRAS) {
  const lista = porRegra.get(regra.id);
  console.log(`${lista.length === 0 ? "OK " : "!! "}Regra ${regra.id} · ${regra.titulo}: ${lista.length}`);
  if (!resumo) {
    for (const a of lista) console.log(`   ${a.arquivo}:${a.linha}  ${a.detalhe}`);
  }
}

const arquivosComAchado = new Set(todos.map((a) => a.arquivo));
console.log(`\nResumo: ${todos.length} achado(s) em ${arquivosComAchado.size} de ${arquivos.length} arquivo(s).`);
if (todos.length === 0) console.log("Nenhum achado mecanico. Falta o olho humano (ver CONFORMIDADE-MOBILE.md).");
process.exit(todos.length === 0 ? 0 : 1);
