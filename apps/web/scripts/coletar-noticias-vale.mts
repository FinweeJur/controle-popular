/**
 * coletar-noticias-vale.mts — painel de notícias recentes sobre a Vale.
 *
 * Grava `apps/web/data/noticias-vale.json`, lido no BUILD pela rota
 * `/paraopeba/noticias-vale`. É o gêmeo do radar do Paraopeba
 * (`scripts/coletar-noticias-paraopeba.py`): o mesmo contrato — guardar
 * título, link, fonte, data e resumo da própria fonte, nunca o corpo da
 * matéria. Reproduzir reportagem inteira é uso de obra de terceiro, e este
 * portal publica material que vira anexo de ofício; título, resumo e link
 * são citação.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/coletar-noticias-vale.mts   # baixa e grava
 *   npx tsx scripts/coletar-noticias-vale.mts --seco                  # mostra, não grava
 *
 * (O `--env-file` é inofensivo quando o arquivo não existe; o script não
 * precisa de env nenhum.)
 *
 * ═══ AS FONTES, E O QUE CADA UMA EXIGE ═══
 *
 * | Fonte | URL | Observação |
 * |---|---|---|
 * | Google News RSS (busca) | `news.google.com/rss/search?q=vale%20brumadinho` | já vem filtrado pela busca; o veículo real mora no `<source>` do item, não no link (o link é do agregador) |
 * | Agência Brasil (EBC) | `agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml` | feed amplo: FILTRA |
 * | Radar Mineração | `radarmineracao.com.br/feed/` | feed amplo de mineração: FILTRA |
 * | G1 Minas Gerais | `g1.globo.com/rss/g1/minas-gerais/` | feed amplo: FILTRA; responde comprimido em gzip, o script descomprime quando o cabeçalho pede |
 *
 * ═══ ARMADILHAS MEDIDAS (as mesmas do radar do Paraopeba, na versão TS) ═══
 *
 * 1. **Data de RSS vem em RFC 822** ("Wed, 13 Aug 2026 10:00:00 -0300"), não
 *    em ISO. Ordenar a string crua põe agosto antes de julho porque "A" < "J".
 *    Toda data passa por `new Date(...)` antes de ordenar.
 * 2. **A busca do Google devolve o link do agregador.** O `<source>` traz o
 *    nome real do veículo; sem ele, tudo apareceria como "Google News" e a
 *    tela mentiria sobre a origem.
 * 3. **Termos casam em texto normalizado, com radicais.** "Vale" casa com
 *    fronteira de palavra (`\bvale\b`), nunca como substring (senão entram
 *    "equivalente" e "valem"); "mineração" usa o radical `miner` para pegar
 *    "mineradora" e "minerárias" sem depender da grafia exata; o acento é
 *    normalizado dos dois lados. ONDE cada termo pode casar — só no título ou
 *    também no resumo — está na armadilha 5.
 * 4. **Repetido vem por dois caminhos.** O agregador repete o texto do veículo
 *    que também tem feed próprio — e o link do agregador é outro. A chave
 *    primária de deduplicação é o link; a secundária é o título normalizado,
 *    porque casar só por link deixaria o mesmo texto entrar duas vezes (a
 *    mesma correção que o radar do Paraopeba documenta).
 * 5. **Termo de tema no corpo precisa ser específico.** A primeira versão
 *    media tudo no título+resumo com radicais curtos, e o feed amplo da
 *    Agência Brasil entupiu de fora do assunto — medido em 30/08/2026:
 *    "preparaÇÃO das equipes" passava por "reparação", "atacante Mariana"
 *    passava pela cidade, "minerais críticos" numa matéria de política
 *    passava por mineração e "Vale do Javari" pela empresa. Regra atual:
 *    vale, Mariana e o radical `miner` só contam no TÍTULO (quando o tema é
 *    o assunto da matéria, está na manchete); brumadinho, barragem e
 *    `\brepar` casam em título ou resumo.
 *
 * ═══ O QUE ESTE COLETOR NÃO É ═══
 *
 * Não é fonte de fato: notícia diz que algo foi noticiado, na data em que
 * foi. Não é curadoria: ninguém leu nem classificou. Não é clipping histórico:
 * é uma janela (~60 itens) que se renova a cada coleta.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const SAIDA = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../data/noticias-vale.json",
);

// UA honesto e identificável, ASCII — cabeçalho com acento quebra cliente
// HTTP. Mesmo padrão de `scripts/coletar-execucao-fgv.mts`.
const AGENTE =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; painel de noticias sobre a Vale; so titulo e link)";

interface Fonte {
  id: string;
  /** Nome exibido quando o item não traz veículo próprio. */
  veiculo: string;
  url: string;
  /**
   * `true` = o feed é amplo e o item só entra se passar no filtro de termos.
   * `false` = o escopo já vem garantido pela busca (Google News).
   */
  filtrar: boolean;
  nota: string;
}

const FONTES: Fonte[] = [
  {
    id: "google-noticias",
    veiculo: "Google News",
    url: "https://news.google.com/rss/search?q=vale%20brumadinho&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    filtrar: false,
    nota: "busca 'vale brumadinho'; o veículo real vem no campo source de cada item",
  },
  {
    id: "agencia-brasil",
    veiculo: "Agência Brasil",
    url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    filtrar: true,
    nota: "imprensa pública federal, licença aberta",
  },
  {
    id: "radar-mineracao",
    veiculo: "Radar Mineração",
    url: "https://radarmineracao.com.br/feed/",
    filtrar: true,
    nota: "notícias do setor de mineração (Vale é a maior mineradora do país)",
  },
  {
    id: "g1-minas-gerais",
    veiculo: "G1 Minas Gerais",
    url: "https://g1.globo.com/rss/g1/minas-gerais/",
    filtrar: true,
    nota: "cobertura regional de Minas, onde estão as operações da Vale em foco",
  },
];

/**
 * Termos que só valem no TÍTULO. São palavras comuns demais no corpo para
 * dizer alguma coisa: "vale" pega "vale a pena" e "Vale do Javari";
 * "mariana" pega nome de jogadora; "miner" pega menção passageira a
 * "minerais críticos" em matéria de política. Quando o tema é o assunto da
 * matéria, ele está na manchete (armadilha 5). Minúsculos e sem acento: a
 * comparação normaliza os dois lados.
 */
const TERMOS_TITULO: RegExp[] = [
  /\bvale\b/,
  /mariana/,
  /\bminer/,
];

/**
 * Termos de TEMA: casam em título OU resumo. São específicos o bastante
 * para não colidirem no corpo. `\brepar` é de propósito: o radical curto
 * `reparac` casa "preparaÇÃO" e entope o filtro com esporte (medido em
 * 30/08/2026 — "preparação das equipes" passava por reparação).
 */
const TERMOS_TEMA: RegExp[] = [
  /brumadinho/,
  /barragem/,
  /\brepar/,
];

const SEM_ACENTO = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

interface ItemBruto {
  titulo: string;
  link: string;
  pubDate: string | null;
  descricao: string;
  source: string;
}

/**
 * Tira marcação e entidades comuns; colapsa espaço.
 *
 * ⚠️ A ordem importa: entidades são decodificadas ANTES de cortar tags.
 * O Google News entrega a descrição com o HTML escapado (`&lt;a href=...&gt;`);
 * decodificar depois de cortar deixava as tags escapadas virarem HTML literal
 * no JSON — medido em 30/08/2026: 53 das 60 descrições saíam com `<a href>`.
 */
function limpar(texto: string): string {
  return texto
    // `&amp;` PRIMEIRO: o Google News entrega `&amp;nbsp;` (dupla codificação),
    // e decodificar depois deixa `&nbsp;` literal no resumo — medido em
    // 30/08/2026: 106 ocorrências sobreviveram à primeira versão.
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Primeiro `<nome ...>...</nome>` do bloco, já limpo. CDATA incluído. */
function extrairCampo(bloco: string, nome: string): string {
  const re = new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, "i");
  const m = re.exec(bloco);
  if (!m) return "";
  const cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(m[1]);
  return limpar(cdata ? cdata[1] : m[1]);
}

/**
 * Extrai os `<item>` de um RSS 2.0 sem depender de parser XML (o app não tem
 * nenhum como dependência, e RSS de notícia é um subset pequeno e estável).
 */
function extrairItens(corpo: string): ItemBruto[] {
  const itens: ItemBruto[] = [];
  const reItem = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = reItem.exec(corpo)) !== null) {
    const bloco = m[1];
    const titulo = extrairCampo(bloco, "title");
    const link = extrairCampo(bloco, "link");
    if (!titulo || !link) continue;
    const pubDate = extrairCampo(bloco, "pubDate");
    itens.push({
      titulo,
      link,
      pubDate: pubDate || null,
      descricao: extrairCampo(bloco, "description"),
      source: extrairCampo(bloco, "source"),
    });
  }
  return itens;
}

function dataIso(rfc822: string | null): string | null {
  if (!rfc822) return null;
  const d = new Date(rfc822);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function baixar(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": AGENTE,
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const corpo = Buffer.from(await res.arrayBuffer());
  if ((res.headers.get("content-encoding") ?? "").includes("gzip")) {
    try {
      // Servidor que comprime de verdade.
      return gunzipSync(corpo).toString("utf-8");
    } catch {
      // O `fetch` do Node descomprime sozinho mas MANTÉM o cabeçalho
      // `content-encoding` (medido em campo com Google News, EBC e G1):
      // o buffer já é texto plano, e descomprimir de novo estoura com
      // "incorrect header check". O corpo cru é o que serve.
      return corpo.toString("utf-8");
    }
  }
  return corpo.toString("utf-8");
}

/** Passa no filtro de termos? Normaliza acento dos dois lados. */
function ehRelevante(item: ItemBruto): boolean {
  const titulo = SEM_ACENTO(item.titulo);
  if (TERMOS_TITULO.some((re) => re.test(titulo))) return true;
  const alvo = `${titulo} ${SEM_ACENTO(item.descricao)}`;
  return TERMOS_TEMA.some((re) => re.test(alvo));
}

/** Chave de título normalizada, para a deduplicação secundária (armadilha 4). */
function chaveTitulo(titulo: string): string {
  return SEM_ACENTO(titulo).slice(0, 120);
}

async function coletarFonte(fonte: Fonte): Promise<ItemBruto[]> {
  let corpo: string;
  try {
    corpo = await baixar(fonte.url);
  } catch (err) {
    console.error(`  ! ${fonte.id}: não respondeu (${err instanceof Error ? err.message : err})`);
    return [];
  }
  let itens: ItemBruto[];
  try {
    itens = extrairItens(corpo);
  } catch (err) {
    console.error(`  ! ${fonte.id}: resposta não é RSS (${err instanceof Error ? err.message : err})`);
    return [];
  }
  if (fonte.filtrar) itens = itens.filter(ehRelevante);
  return itens;
}

interface Noticia {
  titulo: string;
  link: string;
  data: string | null;
  fonte: string;
  descricao: string;
}

function normalizar(itens: ItemBruto[], fonte: Fonte): Noticia[] {
  return itens.map((item) => ({
    titulo: item.titulo,
    link: item.link,
    data: dataIso(item.pubDate),
    // Armadilha 2: no agregador o veículo real está no <source>.
    fonte: fonte.filtrar
      ? fonte.veiculo
      : item.source || fonte.veiculo,
    // Resumo da PRÓPRIA fonte (o que ela publicou no feed), não texto nosso.
    // Corte de segurança para o JSON não inchar com parágrafo inteiro.
    descricao: item.descricao.slice(0, 500),
  }));
}

function coletar(itensPorFonte: Noticia[][]): Noticia[] {
  const vistosLinks = new Set<string>();
  const vistosTitulos = new Set<string>();
  const juntas: Noticia[] = [];
  for (const itens of itensPorFonte) {
    for (const item of itens) {
      if (vistosLinks.has(item.link)) continue;
      const chave = chaveTitulo(item.titulo);
      if (vistosTitulos.has(chave)) continue;
      vistosLinks.add(item.link);
      vistosTitulos.add(chave);
      juntas.push(item);
    }
  }
  // Sem data vai para o fim, não para o começo (mesma regra do radar do
  // Paraopeba): item sem data é o menos confiável do conjunto.
  juntas.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  return juntas.slice(0, 60);
}

async function main(): Promise<number> {
  const seco = process.argv.includes("--seco");

  const porFonte: Noticia[][] = [];
  for (const fonte of FONTES) {
    console.error(`- ${fonte.id}`);
    porFonte.push(normalizar(await coletarFonte(fonte), fonte));
  }
  const noticias = coletar(porFonte);
  console.error(
    `\n${noticias.length} itens (${porFonte.map((l, i) => `${FONTES[i].id}=${l.length}`).join(", ")})`,
  );

  if (seco) {
    for (const n of noticias.slice(0, 12)) {
      console.error(` [${(n.data ?? "????").slice(0, 10)}] ${n.fonte}: ${n.titulo.slice(0, 90)}`);
    }
    return 0;
  }

  // Coleta vazia NÃO sobrescreve o arquivo bom (regra herdada do radar do
  // Paraopeba): um dia de rede ruim não pode esvaziar a tela, e "hoje não
  // achei nada" é indistinguível de "hoje a rede caiu" para quem só lê.
  if (!noticias.length) {
    console.error("! coleta vazia: mantendo o arquivo anterior");
    return 1;
  }

  const dados = {
    fonte: "Google News RSS + Agência Brasil + Radar Mineração + G1 MG",
    gerado_em: new Date().toISOString(),
    noticias,
  };
  writeFileSync(SAIDA, JSON.stringify(dados, null, 1) + "\n", "utf-8");
  console.error(`gravado em ${SAIDA} (${noticias.length} itens)`);
  return 0;
}

main()
  .then((codigo) => process.exit(codigo))
  .catch((err) => {
    console.error(`ABORT: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
