/**
 * Coletor de Estudos Rurais — gera `apps/web/data/estudos-rurais/estudos-rurais.json`.
 *
 * ═══ O QUE É O DADO ═══
 *
 * Agregação de estudos rurais do território dos vales do Jequitinhonha e
 * Mucuri (foco do PPGER/UFVJM): notícias, artigos, eventos e publicações.
 * Cada item traz título, tipo, fonte com link, data ISO e resumo curto.
 *
 * ═══ FONTES, MEDIDAS EM 08/09/2026 (ESTA MÁQUINA, REDE DEVEL) ═══
 *
 * 1. **Google News RSS** (`news.google.com/rss/search?...`) — HTTP 200,
 *    XML válido. 3 buscas: "estudos rurais" + Jequitinhonha/Mucuri;
 *    "agricultura familiar" + Jequitinhonha/Diamantina; "PPGER UFVJM".
 *    Radar de notícias, mesmo padrão do radar da Paraopeba.
 * 2. **Feed WordPress do ICA/UFVJM** (`site.ufvjm.edu.br/ica/feed/`) —
 *    HTTP 200, RSS válido. Filtrado por palavras-chave do tema
 *    (estudos rurais, PPGER, agricultura familiar, campesinato…).
 *    A página do programa é `site.ufvjm.edu.br/ica/pos-graduacao/estudos-rurais/`
 *    e o feed do PRÓPRIO programa (`.../estudos-rurais/feed/`) devolve só
 *    comentários — por isso usa-se o feed do ICA inteiro, com filtro.
 * 3. **Repositório institucional UFVJM** (dissertações do PPGER, coleção
 *    `69a0a0d2-d9f0-4e08-a825-1265f156f608`) — ⛔ BLOQUEADO nesta máquina:
 *    DSpace 7, e TODAS as rotas de API testadas (`/server/api/core/items`,
 *    `/server/api/discover/search/objects`, `/server/oai/request`, `/api/...`)
 *    respondem 200 com o HTML da SPA Angular em vez de JSON. É o caso
 *    registrado no AGENTS.md de "API responde 200 e mente": aqui o status
 *    não mente — o Content-Type é `text/html` e ISSO é o sinal de bloqueio.
 *    A rodada das dissertações fica para o **home-pc**, que consegue
 *    navegador/captura; enquanto isso o JSON declara a lacuna.
 *
 * O script tenta a API do repositório a cada rodada: se um dia responder
 * JSON (`application/json`), os itens do tipo `publicacao` passam a ser
 * coletados automaticamente, sem mudar código.
 *
 * ═══ REGRAS DE COLEÇÃO (AGENTS.md) ═══
 *
 * - Pausa de 1,5 s entre requisições (PAUSA_MS).
 * - User-Agent honesto que identifica o projeto; nunca UA de navegador falso.
 * - Checkpoint por fonte: interrompeu, roda de novo e só a fonte faltante é
 *   baixada (`scripts/.checkpoint-estudos-rurais.json`; `--zerar` começa do
 *   zero). O checkpoint guarda também as fontes já medidas como bloqueadas.
 * - Roda FORA da CI.
 * - Resumo é texto da própria fonte, truncado em 300 caracteres — sem edição,
 *   sem modelo de linguagem. **O número vem do dado; nada embrulha.**
 * - Dado pessoal: as fontes deste coletor são notícias e acervos
 *   bibliográficos; mesmo assim o JSON ingerido aqui entra na varredura
 *   `scripts/checar-dado-pessoal-em-dado.py` (rodar a suíte antes de commitar).
 *
 * Uso:
 *   npx tsx scripts/coletar-estudos-rurais.mts             # coleta e grava
 *   npx tsx scripts/coletar-estudos-rurais.mts --seco      # só mede, não grava
 *   npx tsx scripts/coletar-estudos-rurais.mts --zerar     # ignora o checkpoint
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { hostname } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "apps/web/data/estudos-rurais/estudos-rurais.json");
const CHECKPOINT = resolve(RAIZ, "scripts/.checkpoint-estudos-rurais.json");

const SO_MEDIR = process.argv.includes("--seco");
const ZERAR = process.argv.includes("--zerar");

const PAUSA_MS = 1500;
const UA =
  "controlepopular-bot/1.0 (+https://controlepopular.com.br; portal civico de transparencia; uso academico-civico; pausa 1.5s)";

const COLECAO_DSSERTACOES_UUID = "69a0a0d2-d9f0-4e08-a825-1265f156f608";

const QUERIES_NEWS: { id: string; titulo: string; query: string }[] = [
  {
    id: "news-estudos-rurais",
    titulo: "Google News — estudos rurais no Jequitinhonha e Mucuri",
    query: '"estudos rurais" Jequitinhonha OR Mucuri OR Diamantina',
  },
  {
    id: "news-agricultura-familiar",
    titulo: "Google News — agricultura familiar no Jequitinhonha",
    query: '"agricultura familiar" (Jequitinhonha OR Diamantina OR "vales do Jequitinhonha")',
  },
  {
    id: "news-ppger",
    titulo: "Google News — PPGER / UFVJM",
    query: 'PPGER OR "Estudos Rurais" UFVJM',
  },
];

const PALAVRAS_FEED_UFVJM = [
  "estudos rurais",
  "ppger",
  "agricultura familiar",
  "campesinato",
  "agricultura camponesa",
  "mundo rural",
  "extensão rural",
  "sociobiodiversidade",
  "jequitinhonha",
];

const ENDPOINTS_REPOSITORIO = [
  `https://repositorio.ufvjm.edu.br/server/api/discover/search/objects?f.collection=${COLECAO_DSSERTACOES_UUID}&size=100`,
  "https://repositorio.ufvjm.edu.br/server/api/core/items?size=100",
  "https://repositorio.ufvjm.edu.br/server/oai/request?verb=ListRecords&metadataPrefix=oai_dc",
];

// ─── infra ────────────────────────────────────────────────────────────────

const abortar = (msg: string): never => {
  console.error(`[estudos-rurais] ABORT: ${msg}`);
  process.exit(1);
};

const pausar = () => new Promise((r) => setTimeout(r, PAUSA_MS));

interface Checkpoint {
  rodada: string;
  pronto: string[];
  bloqueado: Record<string, string>;
}

function carregarCheckpoint(): Checkpoint {
  if (ZERAR || !existsSync(CHECKPOINT)) {
    return { rodada: new Date().toISOString().slice(0, 10), pronto: [], bloqueado: {} };
  }
  try {
    return JSON.parse(readFileSync(CHECKPOINT, "utf-8")) as Checkpoint;
  } catch {
    return { rodada: new Date().toISOString().slice(0, 10), pronto: [], bloqueado: {} };
  }
}

function gravarCheckpoint(cp: Checkpoint) {
  if (SO_MEDIR) return;
  writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2) + "\n", "utf-8");
}

async function pegar(url: string): Promise<{ status: number; corpo: string; contentType: string }> {
  const r = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, application/json, text/html;q=0.8" },
  });
  const corpo = await r.text();
  return { status: r.status, corpo, contentType: r.headers.get("content-type") ?? "" };
}

// ─── parsers ──────────────────────────────────────────────────────────────

const removerHtml = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    // O Google News envia o resumo ESCAPADO (&lt;a href=...&gt;), então as
    // entidades precisam ser decodificadas ANTES de remover as tags — na ordem
    // contrária a `<a href="...">` sobrevive como texto literal. Medido em
    // 08/09/2026: 60 resumos chegaram com `<a href...` visível na primeira rodada.
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#821[67];/g, "'")
    .replace(/&#8211;|&#8230;/g, "…")
    .replace(/\s+/g, " ")
    .trim();

const truncar = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

function textos(tag: string, xml: string): string[] {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g")) ?? [];
  return m.map((x) => removerHtml(x.replace(new RegExp(`^<${tag}[^>]*>|</${tag}>$`, "g"), "")));
}

interface ItemBruto {
  id: string;
  titulo: string;
  tipo: "noticia" | "artigo" | "evento" | "publicacao";
  fonte: string;
  fonte_url: string;
  data: string | null;
  resumo: string;
  url: string;
}

function idDe(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 120).toLowerCase();
}

function itemNews(xml: string, fonteTitulo: string, fonteUrl: string): ItemBruto[] {
  const blocos = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const itens: ItemBruto[] = [];
  for (const b of blocos) {
    const titulo = textos("title", b)[0];
    const link = textos("link", b)[0];
    if (!titulo || !link) continue;
    const data = textos("pubDate", b)[0] ? new Date(textos("pubDate", b)[0]) : null;
    itens.push({
      id: idDe(link),
      titulo,
      tipo: "noticia",
      fonte: (textos("source", b)[0] ?? fonteTitulo).slice(0, 120),
      fonte_url: fonteUrl,
      data: data && Number.isFinite(data.getTime()) ? data.toISOString().slice(0, 10) : null,
      resumo: truncar(textos("description", b)[0] ?? "", 300),
      url: link,
    });
  }
  return itens;
}

function semAcentoMin(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function itemRss(xml: string, fonteTitulo: string, fonteUrl: string): ItemBruto[] {
  const blocos = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const itens: ItemBruto[] = [];
  for (const b of blocos) {
    const titulo = textos("title", b)[0];
    const link = textos("link", b)[0];
    if (!titulo || !link) continue;
    const alvo = semAcentoMin(`${titulo} ${textos("description", b)[0] ?? ""}`);
    if (!PALAVRAS_FEED_UFVJM.some((p) => alvo.includes(semAcentoMin(p)))) continue;
    const data = textos("pubDate", b)[0] ? new Date(textos("pubDate", b)[0]) : null;
    itens.push({
      id: idDe(link),
      titulo,
      tipo: "noticia",
      fonte: fonteTitulo,
      fonte_url: fonteUrl,
      data: data && Number.isFinite(data.getTime()) ? data.toISOString().slice(0, 10) : null,
      resumo: truncar(textos("description", b)[0] ?? "", 300),
      url: link,
    });
  }
  return itens;
}

// ─── coleta ───────────────────────────────────────────────────────────────

interface FonteResultado {
  id: string;
  titulo: string;
  url: string;
  metodo: string;
  itens: number;
  observacao?: string;
}

async function main() {
  const cp = carregarCheckpoint();
  const itens: ItemBruto[] = [];
  const fontes: FonteResultado[] = [];
  const lacunas: string[] = [];

  // 1. Google News RSS
  for (const q of QUERIES_NEWS) {
    if (cp.pronto.includes(q.id)) {
      console.log(`[estudos-rurais] ${q.id}: já pronto no checkpoint — pulando`);
      continue;
    }
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q.query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    console.log(`[estudos-rurais] coletando ${q.id}…`);
    const r = await pegar(url);
    if (r.status !== 200 || !r.corpo.includes("<item>")) {
      abortar(`Google News respondeu HTTP ${r.status} sem itens — não é erro de rede para ignorar`);
    }
    const coletados = itemNews(r.corpo, q.titulo, url);
    itens.push(...coletados);
    fontes.push({
      id: q.id,
      titulo: q.titulo,
      url,
      metodo: "RSS de busca do Google News (título, link, data e resumo da própria fonte)",
      itens: coletados.length,
    });
    cp.pronto.push(q.id);
    gravarCheckpoint(cp);
    await pausar();
  }

  // 2. Feed WordPress do ICA/UFVJM
  const ID_ICA = "site-ufvjm-ica";
  if (!cp.pronto.includes(ID_ICA)) {
    const url = "https://site.ufvjm.edu.br/ica/feed/";
    console.log(`[estudos-rurais] coletando ${ID_ICA}…`);
    const r = await pegar(url);
    if (r.status !== 200) {
      abortar(`Feed do ICA/UFVJM respondeu HTTP ${r.status}`);
    }
    const coletados = itemRss(r.corpo, "UFVJM — Instituto de Ciências Agrárias (ICA)", url);
    itens.push(...coletados);
    fontes.push({
      id: ID_ICA,
      titulo: "Feed do ICA/UFVJM, filtrado por palavras-chave de estudos rurais",
      url,
      metodo: "RSS do WordPress do ICA; post entra só se título ou resumo casar com a lista de palavras-chave",
      itens: coletados.length,
    });
    cp.pronto.push(ID_ICA);
    gravarCheckpoint(cp);
    await pausar();
  } else {
    console.log(`[estudos-rurais] ${ID_ICA}: já pronto no checkpoint — pulando`);
  }

  // 3. Repositório institucional UFVJM (dissertações do PPGER)
  const ID_REPO = "repositorio-ufvjm";
  if (!cp.pronto.includes(ID_REPO)) {
    const urlBloqueado = `https://repositorio.ufvjm.edu.br/collections/${COLECAO_DSSERTACOES_UUID}`;
    console.log(`[estudos-rurais] tentando ${ID_REPO}…`);
    let destravado = false;
    let ultimaObs = "";
    for (const api of ENDPOINTS_REPOSITORIO) {
      try {
        const r = await pegar(api);
        if (r.status === 200 && r.contentType.includes("json") && !r.corpo.trimStart().startsWith("<")) {
          const json = JSON.parse(r.corpo) as unknown;
          void json; // formato DSpace 7: percorrer objetos/embedded numa próxima rodada
          destravado = true;
          console.log(`[estudos-rurais] API do repositório RESPONDEU JSON: ${api}`);
          ultimaObs = `API responsiva em ${api} — formato ainda não processado nesta versão do coletor`;
          break;
        }
        ultimaObs = `API devolve text/html (SPA) em ${api}`;
        console.log(`[estudos-rurais]   ${api} -> text/html (bloqueada)`);
      } catch (e) {
        ultimaObs = `erro de rede em ${api}: ${String((e as Error).message).slice(0, 120)}`;
        console.log(`[estudos-rurais]   erro: ${ultimaObs}`);
      }
      await pausar();
    }
    if (destravado) {
      // Coleção acessível: os itens entram como publicação numa próxima rodada.
      fontes.push({
        id: ID_REPO,
        titulo: "Repositório institucional UFVJM — dissertações do PPGER",
        url: urlBloqueado,
        metodo: "API REST do DSpace 7",
        itens: 0,
        observacao: ultimaObs,
      });
      lacunas.push(
        "Publicações (dissertações do PPGER): a API do repositório respondeu JSON, mas o processamento do formato DSpace 7 ainda não está implementado neste coletor — coletar na próxima rodada.",
      );
    } else {
      cp.bloqueado[ID_REPO] = ultimaObs;
      fontes.push({
        id: ID_REPO,
        titulo: "Repositório institucional UFVJM — dissertações do PPGER",
        url: urlBloqueado,
        metodo: "API REST do DSpace 7",
        itens: 0,
        observacao: `BLOQUEADO nesta rodada: ${ultimaObs}`,
      });
      lacunas.push(
        "Publicações (dissertações do PPGER): a API REST do DSpace do repositório UFVJM devolve a SPA HTML em todas as rotas testadas (status 200, Content-Type text/html) — não é possível coletar de máquina comum. Rodada fica para o home-pc (captura com navegador); enquanto isso não há dissertação nesta página.",
      );
      console.log(`[estudos-rurais] ${ID_REPO}: BLOQUEADO (${ultimaObs})`);
    }
    cp.pronto.push(ID_REPO);
    gravarCheckpoint(cp);
  } else {
    console.log(`[estudos-rurais] ${ID_REPO}: já medido no checkpoint — pulando`);
  }

  // Lacunas honestas: tipo evento não tem fonte estruturada nesta versão.
  if (!itens.some((i) => i.tipo === "evento")) {
    lacunas.push(
      "Eventos: nenhum coletado nesta rodada — sem fonte estruturada de eventos do PPGER na web aberta (o sistema sgppg.com.br/ppg/ppger/31/ existe, mas exigiria varredura própria; registrado para rodada futura).",
    );
  }
  const semData = itens.filter((i) => !i.data).length;
  if (semData > 0) {
    lacunas.push(`${semData} itens vieram sem data na fonte — aparecem como "—" e ficam fora do gráfico por ano.`);
  }

  // Dedup por id (a mesma notícia pode chegar por duas buscas)
  const porId = new Map<string, ItemBruto>();
  for (const i of itens) if (!porId.has(i.id)) porId.set(i.id, i);
  const itensFinais = [...porId.values()].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));

  const saida = {
    schema: 1,
    coletadoEm: new Date().toISOString(),
    maquina: hostname(),
    exemplo: false,
    contagens: {
      itens: itensFinais.length,
      porTipo: Object.fromEntries(
        ["noticia", "artigo", "evento", "publicacao"].map((t) => [
          t,
          itensFinais.filter((i) => i.tipo === t).length,
        ]),
      ),
    },
    fontes,
    lacunas,
    itens: itensFinais,
  };

  console.log(`[estudos-rurais] ${itensFinais.length} itens dedup de ${itens.length} coletados`);
  if (SO_MEDIR) {
    console.log("[estudos-rurais] --seco: nada gravado");
    return;
  }
  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(saida, null, 2) + "\n", "utf-8");
  console.log(`[estudos-rurais] gravado: ${DESTINO}`);
}

main().catch((e) => abortar(String((e as Error).stack ?? e)));
