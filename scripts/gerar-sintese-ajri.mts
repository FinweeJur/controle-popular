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
 * por `critico_sintese.py` e `critico_powerbi.py` (64 códigos de documento
 * citados, todos reais; toda citação/número atribuído ao painel Power BI
 * conferido contra `powerbi/indicadores-portal.md`). O que este script impede
 * é que a INTEGRAÇÃO corte, misture ou descaracterize a estrutura:
 *
 * 1. O documento tem que ter exatamente os 16 eixos temáticos com as quatro
 *    marcas de cada um (`Estado geral`, `Evolução no tempo`,
 *    `Achados mais relevantes`, `Números-chave`) — uma seção sem marca vira
 *    um eixo mudo, e uma marca perdida vira texto órfão.
 * 2. Todo achado tem que citar pelo menos um código de documento
 *    (`\d{5}-ACM-...`) OU vir do painel de indicadores (marca
 *    "Painel de indicadores (DD/MM/AAAA)") — são as duas fontes que a fase de
 *    conteúdo audita; achado sem nenhuma das duas é texto sem lastro.
 * 3. As duas seções finais (transversais e fragilidades) têm que existir e
 *    ter itens — elas são a conclusão da síntese.
 * 4. A "Tabela de prazos" (nova, 2026-08-20) tem que ter pelo menos uma linha
 *    de dado — é seção à parte, não um 17º eixo, e por isso não conta para o
 *    total de 16.
 * 5. Toda imagem (`![legenda](caminho)`) tem que apontar para um arquivo que
 *    REALMENTE existe em `apps/web/public/paraopeba/auditoria/graficos/` —
 *    link de imagem quebrado no site é pior que não ter gráfico nenhum.
 * 6. Varredura de mojibake no arquivo gravado, relido do disco — erro de
 *    encoding nasce na escrita, não só na leitura.
 *
 * ═══ IMAGENS: CAMINHO LOCAL VIRA URL PÚBLICA ═══
 *
 * O `.md`-fonte referencia os gráficos por caminho absoluto do disco de
 * trabalho (`X:\DevCoder\_ajri\graficos\NN-nome.png`) — é o que o pipeline do
 * `.docx` precisa. Para o site, esse caminho é reescrito para
 * `/paraopeba/auditoria/graficos/NN-nome.png`, servido de
 * `apps/web/public/paraopeba/auditoria/graficos/` (cópia manual dos PNGs,
 * ~136 KiB ao todo — não há automação de cópia ainda; se o gráfico mudar,
 * copiar de novo antes de rodar este script).
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
const PASTA_GRAFICOS_PUBLICOS = resolve(RAIZ, "apps/web/public/paraopeba/auditoria/graficos");
const URL_BASE_GRAFICOS = "/paraopeba/auditoria/graficos/";

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

interface Grafico {
  src: string;
  legenda: string;
}

interface Eixo {
  titulo: string;
  estadoGeral: string;
  evolucao: string;
  achados: string[];
  numerosChave: string;
  graficos: Grafico[];
}

interface Item {
  titulo: string;
  texto: string;
}

interface LinhaPrazo {
  obra: string;
  prazoInicial: string;
  prazoAtual: string;
  atraso: string;
  resumo: string;
}

/** Código de documento do catálogo, ex. `60612553-ACM-DM-CO-RP-PM-0084-2026`. */
const CODIGO = /\d{5}-ACM-[A-Z0-9-]{8,}/;
/** Marca de citação ao painel Power BI — a outra fonte que a fase de conteúdo audita. */
const PAINEL = /Painel de indicadores \(\D{0,12}\d{2}\/\d{2}\/\d{4}\)/i;
/** `![legenda](caminho)` — uma linha de imagem inteira. */
const IMAGEM = /^!\[(.+?)\]\((.+?)\)$/;

/** Reescreve o caminho local do `.md`-fonte para a URL pública do site, e
 * confere que o PNG correspondente existe de fato em `public/`. */
function resolverGrafico(legenda: string, caminhoLocal: string): Grafico {
  const nome = caminhoLocal.split(/[\\/]/).pop();
  if (!nome) throw new Error(`Caminho de imagem sem nome de arquivo: ${caminhoLocal}`);
  const destinoPublico = resolve(PASTA_GRAFICOS_PUBLICOS, nome);
  if (!existsSync(destinoPublico)) {
    throw new Error(
      `Gráfico referenciado no .md não existe em apps/web/public/paraopeba/auditoria/graficos/: ${nome}. ` +
        `Copie o PNG de X:\\DevCoder\\_ajri\\graficos\\ para lá antes de gerar.`,
    );
  }
  return { src: URL_BASE_GRAFICOS + nome, legenda };
}

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
let prazos: LinhaPrazo[] = [];
let graficosGerais: Grafico[] = [];

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
  if (titulo.startsWith("Tabela de prazos")) {
    // linhas de tabela markdown "| a | b | c | d | e |", pulando o separador
    // "|---|---|...|" e o cabeçalho (primeira linha de tabela encontrada).
    const linhasTabela = linhas.filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
    const celulas = linhasTabela
      .map((l) =>
        l
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim()),
      )
      .filter((cel) => !/^:?-+:?$/.test(cel[0])); // pula "|---|---|"
    const [, ...linhasDado] = celulas; // primeira é o cabeçalho da tabela
    prazos = linhasDado.map((cel) => ({
      obra: cel[0].replace(/\*\*/g, ""),
      prazoInicial: cel[1],
      prazoAtual: cel[2],
      atraso: cel[3],
      resumo: cel[4],
    }));
    if (prazos.length === 0) throw new Error(`Seção '${titulo}' sem nenhuma linha de dado`);

    graficosGerais = linhas
      .map((l) => l.trim().match(IMAGEM))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => resolverGrafico(m[1], m[2]));
    continue;
  }

  const graficosDoEixo = linhas
    .map((l) => l.trim().match(IMAGEM))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => resolverGrafico(m[1], m[2]));

  const estadoGeral = linhas.map((l) => depoisDoRotulo(l, "Estado geral")).find((t) => t !== "");
  const evolucao = linhas.map((l) => depoisDoRotulo(l, "Evolução no tempo")).find((t) => t !== "");
  const achados = linhas.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
  const numerosChave = linhas.map((l) => depoisDoRotulo(l, "Números-chave")).find((t) => t !== "");

  if (!estadoGeral || !evolucao || achados.length === 0 || !numerosChave) {
    throw new Error(`Eixo '${titulo}' incompleto (faltou uma das quatro marcas ou os achados)`);
  }
  eixos.push({ titulo, estadoGeral, evolucao, achados, numerosChave, graficos: graficosDoEixo });
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
    const temFonte = CODIGO.test(achado) || PAINEL.test(achado) || negacaoDeAusencia;
    if (!temFonte) {
      throw new Error(`Achado sem código de documento nem citação ao painel no eixo '${eixo.titulo}': ${achado}`);
    }
  }
}
if (transversais.length === 0 || fragilidades.length === 0) {
  throw new Error("Seções finais (transversais/fragilidades) vazias");
}
if (prazos.length === 0) {
  throw new Error("Tabela de prazos não encontrada ou vazia — ver seção '## Tabela de prazos' no .md-fonte");
}

const cabecalhoGerado = `/**
 * Síntese temática da auditoria AECOM — os 16 eixos do rompimento da barragem
 * B-I em Brumadinho (2019-2026), com o resumo executivo, a tabela de prazos
 * (prometido × atual), as pendências que atravessam o acervo inteiro e os
 * pontos onde a base de evidência é mais rasa. ARQUIVO GERADO — não editar à
 * mão.
 *
 * ═══ ORIGEM ═══
 *
 * Gerado por \`scripts/gerar-sintese-ajri.mts\` a partir de
 * \`X:\\DevCoder\\_ajri\\SINTESE-TEMATICA.md\` (fora do repo, de propósito).
 * O conteúdo foi auditado na fase de conteúdo contra os 337 resumos, contra o
 * texto original e contra \`powerbi/indicadores-portal.md\` (achados do painel
 * de indicadores do portal) — 64+ códigos de documento citados, todos reais;
 * toda citação ao painel conferida contra a fonte da captura visual. A
 * integração não reaudita: só transpila e confere estrutura. Para regenerar:
 * \`npx tsx scripts/gerar-sintese-ajri.mts\`.
 *
 * ═══ DUAS FONTES DENTRO DA MESMA SÍNTESE ═══
 *
 * A maioria dos achados cita um código de documento AECOM (\`\\d{5}-ACM-...\`).
 * Alguns citam em vez disso o painel de indicadores do próprio portal
 * (\`/indicadores\`), que publica percentual de avanço por obra fora do ciclo
 * de relatórios em PDF, às vezes com data mais recente que qualquer PDF do
 * acervo. Esses achados trazem "Painel de indicadores (DD/MM/AAAA)" no texto
 * — a UI não precisa tratar diferente, mas quem lê sabe de onde veio cada
 * número.
 *
 * ═══ AUTORIA ═══
 *
 * A síntese é obra deste portal, como os resumos — o material de origem é da
 * AECOM, publicada sob os termos de uso do portal da auditoria. Cada achado
 * carrega o código do documento ou a data do painel que o sustenta (mesma
 * ponte da ficha).
 */

export interface GraficoDaSintese {
  /** Caminho público, ex. "/paraopeba/auditoria/graficos/01-manejo-rejeitos.png". */
  src: string;
  /** Legenda/alt-text — inclui a fonte e a data de atualização do painel. */
  legenda: string;
}

export interface EixoDaSintese {
  /** Nome do eixo, ex. "Fornecimento e captação de água". */
  titulo: string;
  /** Balanço geral do eixo no conjunto dos 337 relatórios. */
  estadoGeral: string;
  /** Como o tema evoluiu entre 2019 e 2026. */
  evolucao: string;
  /** Achados com o código do documento (ou a data do painel) que os sustenta. */
  achados: string[];
  /** Números-chave do eixo, com unidade, em texto corrido. */
  numerosChave: string;
  /** Gráficos do painel de indicadores relacionados a este eixo, se houver. */
  graficos: GraficoDaSintese[];
}

export interface ItemDaSintese {
  titulo: string;
  texto: string;
}

/** Uma linha da tabela de prazos: o que foi prometido × o que está valendo hoje. */
export interface LinhaDePrazoAjri {
  obra: string;
  prazoInicial: string;
  prazoAtual: string;
  atraso: string;
  resumo: string;
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
      graficos: [${e.graficos.map((g) => `{ src: ${s(g.src)}, legenda: ${s(g.legenda)} }`).join(", ")}],
    },`,
  )
  .join("\n")}
  ],
  /** Tabela de prazos — só entram obras com prazo inicial E atual explícitos. */
  prazos: [
${prazos
  .map(
    (p) => `    {
      obra: ${s(p.obra)},
      prazoInicial: ${s(p.prazoInicial)},
      prazoAtual: ${s(p.prazoAtual)},
      atraso: ${s(p.atraso)},
      resumo: ${s(p.resumo)},
    },`,
  )
  .join("\n")}
  ],
  /** Gráficos gerais do painel, não ligados a um eixo só (ex.: visão agregada). */
  graficosGerais: [${graficosGerais.map((g) => `{ src: ${s(g.src)}, legenda: ${s(g.legenda)} }`).join(", ")}],
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
  console.log(`Prazos: ${prazos.length} | Gráficos gerais: ${graficosGerais.length}`);
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
