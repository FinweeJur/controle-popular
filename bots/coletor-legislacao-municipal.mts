#!/usr/bin/env node
/**
 * Bot coletor de LEGISLAÇÃO MUNICIPAL — Plano A da biblioteca de leis.
 *
 * Plano: `docs/planos/PLANO-BIBLIOTECA-LEGISLACAO.md`, Fase F1. Traz as
 * matérias legislativas das câmaras municipais com API aberta e grava JSON
 * versionado em `apps/web/data/legislacao-municipal/`, no shape de
 * `ambiental_legislacao` com `esfera='municipal'`. A lógica pura (parser,
 * dedup, robots) mora em `apps/web/lib/legislacao-municipal/nucleo.ts` e é
 * testada por `vitest`; aqui só há rede, arquivo e orquestração.
 *
 * ═══ FONTE (Plano A) ═══
 *
 * SAPL (`/api/materia/materialegislativa/`), software público de várias
 * câmaras de MG. O adaptador é genérico; o registro de cidades está em
 * `apps/web/lib/legislacao-municipal/cidades.ts`, cada entrada confirmada ao
 * vivo. O Plano B (agregador leismunicipais.com.br) entra depois, só como
 * ponte — nunca link principal.
 *
 * ═══ ROBOTS E RITMO — DECISÃO REGISTRADA ═══
 *
 * As câmaras publicam `robots.txt` pedindo `Crawl-delay: 60` para o agente
 * `*` e bloqueando `/materia/docacessorio/pdf|zip/*`. O bot LÊ o
 * `robots.txt` de cada câmara e usa o delay declarado como PADRÃO. `--pausa`
 * reduz o ritmo, mas avisa quando vai abaixo do pedido — a decisão fica
 * registrada no `meta` do arquivo de saída (`crawlDelayRobots`,
 * `pausaEfetiva`). Em 403/429 o bot PARA (não retenta, não troca
 * User-Agent), mesma regra dos coletores da casa.
 *
 * ═══ OLLAMA (fase seguinte) ═══
 *
 * `--enriquecer-ollama` classifica temas/tags e gera microresumo via Ollama
 * local (127.0.0.1:11434), no mesmo espírito de
 * `scripts/analisar-dados-ollama.mts`. Sem a flag, `temas`/`tags` ficam
 * vazios e `resumo` fica `null` — lacuna declarada, nunca inventada. Resumo
 * de máquina é gravado com o modelo que o gerou, no `meta`.
 *
 * Uso:
 *   npx tsx bots/coletor-legislacao-municipal.mts --sondar --cidade contagem --ano 2026 --paginas 1
 *   npx tsx bots/coletor-legislacao-municipal.mts --cidade contagem --ano 2026
 *   npx tsx bots/coletor-legislacao-municipal.mts --cidade contagem --enriquecer-ollama
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CIDADES_CAMARA, cidadePorSlug } from "../apps/web/lib/legislacao-municipal/cidades";
import type {
  CidadeFonte,
  LinhaLegislacaoMunicipal,
  MateriaSapl,
  RegrasRobots,
  TipoMateriaSapl,
} from "../apps/web/lib/legislacao-municipal/nucleo";
import {
  montarMapaTipos,
  normalizarMateriaSapl,
  parseRobots,
} from "../apps/web/lib/legislacao-municipal/nucleo";

const LOG = "[coletor-legislacao-municipal]";
const UA = "controle-popular/1.0 (+https://controlepopular.com.br; biblioteca de legislacao)";
const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, "..");
const DIR_SAIDA = resolve(RAIZ, "apps", "web", "data", "legislacao-municipal");
const PAGE_SIZE = 100; // teto do SAPL — `limit` é ignorado, `page_size` vale (medido)

/** Faixa de anos padrão quando nenhum `--ano` é passado. */
function anosPadrao(): number[] {
  const atual = new Date().getFullYear();
  return [atual, atual - 1];
}

interface Args {
  cidades: string[];
  anos: number[];
  paginas: number | null;
  pausa: number | null;
  sondar: boolean;
  enriquecer: boolean;
  modelo: string;
  refazer: boolean;
}

function parseArgs(argv: string[]): Args {
  const cidades: string[] = [];
  const anos: number[] = [];
  let paginas: number | null = null;
  let pausa: number | null = null;
  let sondar = false;
  let enriquecer = false;
  let modelo = "llama3.2:3b";
  let refazer = false;

  const valor = (i: number): string => argv[i + 1] ?? "";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cidade") cidades.push(valor(i).trim());
    else if (a === "--ano") {
      const n = Number(valor(i));
      if (Number.isInteger(n)) anos.push(n);
    } else if (a === "--paginas") paginas = Number(valor(i)) || null;
    else if (a === "--pausa") pausa = Number(valor(i)) >= 0 ? Number(valor(i)) : null;
    else if (a === "--sondar") sondar = true;
    else if (a === "--enriquecer-ollama") enriquecer = true;
    else if (a === "--modelo") modelo = valor(i) || modelo;
    else if (a === "--refazer") refazer = true;
  }

  return {
    cidades: cidades.length ? cidades : ["all"],
    anos: anos.length ? anos : anosPadrao(),
    paginas,
    pausa,
    sondar,
    enriquecer,
    modelo,
    refazer,
  };
}

/** Pausa entre requisições. */
function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

class BloqueadoPelaFonte extends Error {}

/** GET de texto com User-Agent do projeto; para em 403/429. */
async function baixarTexto(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45_000) });
  if (r.status === 403 || r.status === 429) {
    throw new BloqueadoPelaFonte(`${LOG} HTTP ${r.status} em ${url} — parando (não retentando).`);
  }
  if (!r.ok) throw new Error(`${LOG} HTTP ${r.status} em ${url}`);
  return r.text();
}

/** GET de JSON com retry simples (erro de rede/timeout), sem retry em 403/429. */
async function baixarJson<T>(url: string, tentativas = 3): Promise<T> {
  let ultimo: unknown;
  for (let t = 1; t <= tentativas; t++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45_000) });
      if (r.status === 403 || r.status === 429) {
        throw new BloqueadoPelaFonte(`${LOG} HTTP ${r.status} em ${url} — parando (não retentando).`);
      }
      if (!r.ok) throw new Error(`${LOG} HTTP ${r.status} em ${url}`);
      return (await r.json()) as T;
    } catch (e) {
      if (e instanceof BloqueadoPelaFonte) throw e;
      ultimo = e;
      if (t < tentativas) await dormir(3_000 * t);
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

interface PaginaSapl<T> {
  pagination?: { page?: number; next_page?: number | null; total_pages?: number; total_entries?: number };
  results?: T[];
}

/** Lê todas as páginas de um endpoint paginado do SAPL (page_size = 100). */
async function paginarSapl<T>(
  base: string,
  caminho: string,
  pausaMs: number,
  tetoPaginas: number | null,
  aoPaginar?: (linhas: T[], pagina: number, totalPaginas: number) => void
): Promise<T[]> {
  const acumulado: T[] = [];
  let pagina = 1;
  for (;;) {
    const url = `${base}${caminho}${caminho.includes("?") ? "&" : "?"}format=json&page_size=${PAGE_SIZE}&page=${pagina}`;
    const corpo = await baixarJson<PaginaSapl<T>>(url);
    const itens = corpo.results ?? [];
    acumulado.push(...itens);
    aoPaginar?.(itens, pagina, corpo.pagination?.total_pages ?? 1);
    const proxima = corpo.pagination?.next_page ?? null;
    if (proxima === null) break;
    if (tetoPaginas !== null && pagina >= tetoPaginas) break;
    pagina = proxima;
    await dormir(pausaMs);
  }
  return acumulado;
}

/** Tipos de matéria da câmara (FK -> rótulo). */
async function baixarTipos(base: string, pausaMs: number): Promise<Map<number, string>> {
  const tipos = await paginarSapl<TipoMateriaSapl>(base, "/api/materia/tipomaterialegislativa/", pausaMs, null);
  return montarMapaTipos(tipos);
}

interface ArquivoCidade {
  meta: Record<string, unknown>;
  linhas: LinhaLegislacaoMunicipal[];
}

function caminhoSaida(slug: string): string {
  return resolve(DIR_SAIDA, `${slug}.json`);
}

function lerSaida(slug: string): ArquivoCidade {
  const p = caminhoSaida(slug);
  if (!existsSync(p)) return { meta: {}, linhas: [] };
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as ArquivoCidade;
  } catch {
    return { meta: {}, linhas: [] };
  }
}

/** Coleta uma cidade num intervalo de anos. Devolve as linhas (sem gravar). */
async function coletarCidade(
  cidade: CidadeFonte,
  args: Args,
  regrasRobots: RegrasRobots,
  pausaMs: number
): Promise<{ linhas: LinhaLegislacaoMunicipal[]; anosFeitos: number[]; total: number }> {
  const porId = new Map<string, LinhaLegislacaoMunicipal>();
  const anosFeitos: number[] = [];
  const tipos = await baixarTipos(cidade.base, pausaMs);

  for (const ano of args.anos) {
    const antes = porId.size;
    const materias = await paginarSapl<MateriaSapl>(
      cidade.base,
      `/api/materia/materialegislativa/?ano=${ano}`,
      pausaMs,
      args.paginas,
      (_itens, pagina, totalPaginas) => {
        process.stdout.write(`\r${LOG}   ${cidade.slug} ${ano}: página ${pagina}/${totalPaginas}`);
      }
    );
    process.stdout.write("\n");
    for (const m of materias) {
      const linha = normalizarMateriaSapl(m, cidade, tipos);
      if (linha) porId.set(linha.id_fonte, linha);
    }
    anosFeitos.push(ano);
    console.log(`${LOG}   ${cidade.slug} ${ano}: ${porId.size - antes} matéria(s) nova(s) (${porId.size} acumuladas)`);
  }

  return { linhas: [...porId.values()], anosFeitos, total: porId.size };
}

/** Classifica temas/tags e resume via Ollama local — fase seguinte do bot. */
async function enriquecerComOllama(
  linhas: LinhaLegislacaoMunicipal[],
  modelo: string,
  limite: number | null
): Promise<{ linhas: LinhaLegislacaoMunicipal[]; enriquecidas: number }> {
  let up = false;
  try {
    const r = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(5_000) });
    up = r.ok;
  } catch {
    up = false;
  }
  if (!up) {
    console.warn(`${LOG} Ollama não responde em 127.0.0.1:11434 — pulando o enriquecimento.`);
    return { linhas, enriquecidas: 0 };
  }

  // Vocabulário de temas (slugs) do acervo — o modelo escolhe entre eles.
  const TEMAS = ["mineracao", "energia", "agropecuaria", "barragens", "recursos_hidricos", "residuos", "unidades_conservacao", "fauna_flora", "serras"];
  const alvo = limite === null ? linhas : linhas.slice(0, limite);
  let enriquecidas = 0;

  for (const l of alvo) {
    if (!l.ementa) continue;
    const prompt = [
      "Você classifica legislação municipal brasileira para um portal de transparência.",
      `Tipo: ${l.tipo}. Ementa: ${l.ementa}`,
      `Escolha zero ou mais temas desta lista fixa: ${TEMAS.join(", ")}.`,
      "Responda SOMENTE um JSON válido, sem texto em volta, no formato:",
      '{"temas": ["..."], "tags": ["..."], "resumo": "até 30 palavras, português direto"}',
      "Tags são livres (assuntos finos). Se não souber o tema, deixe a lista vazia — não invente.",
    ].join("\n");
    try {
      const r = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelo, prompt, stream: false, options: { temperature: 0.2 } }),
        signal: AbortSignal.timeout(120_000),
      });
      const corpo = (await r.json()) as { response?: string };
      const texto = (corpo.response ?? "").trim();
      const json = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
      const dados = JSON.parse(json) as { temas?: unknown; tags?: unknown; resumo?: unknown };
      l.temas = Array.isArray(dados.temas) ? dados.temas.filter((t): t is string => typeof t === "string" && TEMAS.includes(t)) : [];
      l.tags = Array.isArray(dados.tags) ? dados.tags.filter((t): t is string => typeof t === "string") : [];
      l.resumo = typeof dados.resumo === "string" && dados.resumo.trim() ? dados.resumo.trim() : null;
      enriquecidas++;
    } catch {
      // Modelo indisponível/parse falho: mantém lacuna declarada, nunca inventa.
    }
  }
  return { linhas, enriquecidas };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const alvos: CidadeFonte[] = args.cidades.includes("all")
    ? CIDADES_CAMARA
    : args.cidades.map((s) => {
        const c = cidadePorSlug(s);
        if (!c) throw new Error(`${LOG} cidade desconhecida: ${s}`);
        return c;
      });

  if (!args.sondar) mkdirSync(DIR_SAIDA, { recursive: true });

  console.log(`${LOG} ${alvos.length} câmara(s), anos ${args.anos.join(", ")}${args.sondar ? " (SONDAGEM — não grava)" : ""}`);

  for (const cidade of alvos) {
    let regras: RegrasRobots = { crawlDelay: null, disallow: [] };
    try {
      regras = parseRobots(await baixarTexto(`${cidade.base}/robots.txt`));
    } catch (e) {
      if (e instanceof BloqueadoPelaFonte) throw e;
      console.warn(`${LOG} ${cidade.slug}: robots.txt indisponível (${(e as Error).message}) — seguindo com pausa padrão.`);
    }
    const crawlDelay = regras.crawlDelay ?? 0;
    const pausaSeg = args.pausa ?? (crawlDelay || 2);
    if (args.pausa !== null && args.pausa < crawlDelay) {
      console.warn(`${LOG} ${cidade.slug}: --pausa ${args.pausa}s ABAIXO do Crawl-delay ${crawlDelay}s do robots.txt — decisão registrada no meta.`);
    }
    const pausaMs = Math.round(pausaSeg * 1000);

    const { linhas, anosFeitos, total } = await coletarCidade(cidade, args, regras, pausaMs);

    let finais = linhas;
    let enriquecidas = 0;
    if (args.enriquecer) {
      const r = await enriquecerComOllama(finais, args.modelo, null);
      finais = r.linhas;
      enriquecidas = r.enriquecidas;
    }

    if (args.sondar) {
      console.log(`${LOG} ${cidade.slug} SONDA: ${total} matéria(s); nada gravado.`);
      continue;
    }

    // Mescla com o que já havia (re-execução atualiza por `id_fonte`).
    const anterior = lerSaida(cidade.slug);
    const porId = new Map(anterior.linhas.map((l) => [l.id_fonte, l]));
    for (const l of finais) porId.set(l.id_fonte, l);
    const mescladas = [...porId.values()];

    const agora = new Date().toISOString();
    const arquivo: ArquivoCidade = {
      meta: {
        cidade: cidade.nome,
        idIbge: cidade.idIbge,
        uf: cidade.uf,
        sistema: cidade.sistema,
        base: cidade.base,
        fonte: `camara-${cidade.sistema}`,
        atualizadoEm: agora,
        anos: Array.from(new Set([...(Array.isArray(anterior.meta.anos) ? (anterior.meta.anos as number[]) : []), ...anosFeitos])).sort(),
        crawlDelayRobots: regras.crawlDelay,
        pausaEfetiva: pausaSeg,
        // Coleta com `--paginas` é AMOSTRA, não acervo: fica marcado para
        // ninguém ler o arquivo como completo.
        parcial: args.paginas !== null,
        paginasCap: args.paginas,
        total: mescladas.length,
        enriquecimentoOllama: args.enriquecer ? { modelo: args.modelo, itens: enriquecidas, em: agora } : null,
      },
      linhas: mescladas,
    };
    writeFileSync(caminhoSaida(cidade.slug), JSON.stringify(arquivo, null, 2), "utf-8");
    console.log(`${LOG} ${cidade.slug}: ${mescladas.length} matéria(s) gravada(s) em data/legislacao-municipal/${cidade.slug}.json`);
  }

  console.log(`${LOG} concluído.`);
}

main().catch((e) => {
  if (e instanceof BloqueadoPelaFonte) {
    console.error(e.message);
    process.exit(2);
  }
  console.error(e);
  process.exit(1);
});
