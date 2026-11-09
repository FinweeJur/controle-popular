#!/usr/bin/env node
/**
 * scripts/consolidar-radar-editais.mts — apenda os pendentes do radar de
 * editais ao acervo publicado em apps/web/data/editais-consolidado.json.
 *
 * POR QUE EXISTE: a página /editais lê esse consolidado (lib/editais/dados.ts),
 * mas nenhum script escrevia nele — só lia. O radar grava pendentes/ e o
 * publicador grava noticias-portal.json (blog); o consolidado tinha ficado
 * congelado em 16/09/2026.
 *
 * O QUE FAZ, sem LLM e sem publicar nada:
 * 1. lê os pendentes de apps/web/data/radar-editais/pendentes/ (mesmo
 *    diretório do radar; não move nem apaga nada);
 * 2. converte cada pendente em ItemEdital com o extrator determinístico
 *    (processarTrechoEdital) — os campos batem com os que a página consome;
 * 3. deduplica por id, slug e (dataPublicacao + título normalizado) contra o
 *    acervo existente e entre os próprios pendentes;
 * 4. grava { total, atualizadoEm, itens } no mesmo formato do arquivo atual
 *    (JSON.stringify(..., null, 1) + "\n"), mais novo primeiro.
 *
 * Quem publica no blog continua sendo o publicar-radar-editais.mts; este
 * script só alimenta a página /editais.
 *
 * USO
 *   npx tsx scripts/consolidar-radar-editais.mts                  # grava
 *   npx tsx scripts/consolidar-radar-editais.mts --seco           # só relata
 *   npx tsx scripts/consolidar-radar-editais.mts --saida <arquivo>  # grava em outro arquivo
 *   npx tsx scripts/consolidar-radar-editais.mts --pendentes <dir>  # usa outra pasta de pendentes
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { processarTrechoEdital } from "./radar-editais-extrator.mts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PENDENTES_PADRAO = path.join(RAIZ, "apps", "web", "data", "radar-editais", "pendentes");
const CONSOLIDADO_PADRAO = path.join(RAIZ, "apps", "web", "data", "editais-consolidado.json");

const ARGS = process.argv.slice(2);
const SO_MEDIR = ARGS.includes("--seco");

function valorDaFlag(flag: string): string | null {
  const i = ARGS.indexOf(flag);
  return i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : null;
}

const PENDENTES_DIR = path.resolve(valorDaFlag("--pendentes") ?? PENDENTES_PADRAO);
const CONSOLIDADO = path.resolve(valorDaFlag("--saida") ?? CONSOLIDADO_PADRAO);

interface Pendente {
  id: string;
  status: string;
  fonte: string;
  fonte_nome: string;
  fonte_url: string;
  data_publicacao: string;
  url: string;
  pagina: number;
  secao: string | null;
  titulo_sugerido: string;
  trechos: Array<{ contexto: string }>;
  score: number;
  termos: string[];
  criado_em: string;
  detector: string;
}

interface ItemEdital {
  id: string;
  slug?: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  numero: string | null;
  dataPublicacao: string;
  objeto: string;
  condicoesEPrazos: string;
  urlOficial: string;
  score: number;
  pagina?: number | null;
  secao?: string | null;
}

interface Acervo {
  total: number;
  atualizadoEm: string;
  itens: ItemEdital[];
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mesma chave editorial do publicar-radar: fonte é sempre dom-mg aqui, então
 *  data + título normalizado identifica o edital entre dias diferentes. */
function chaveDeItem(i: ItemEdital): string {
  return [i.dataPublicacao, normalizar(i.titulo)].join("|");
}

function converterEmItem(p: Pendente): ItemEdital {
  const trecho = p.trechos.map((t) => t.contexto).join(" ");
  const meta = processarTrechoEdital(
    trecho || p.titulo_sugerido,
    p.secao,
    p.data_publicacao,
    p.fonte_nome,
    p.url
  );
  return {
    id: p.id,
    slug: `radar-editais-${p.id.replace(/-/g, "").slice(0, 16)}`,
    titulo: meta.tituloJornalistico || p.titulo_sugerido,
    orgao: meta.orgao,
    modalidade: meta.modalidade,
    numero: meta.numero,
    dataPublicacao: p.data_publicacao,
    objeto: meta.objeto,
    condicoesEPrazos: meta.condicoesEPrazos,
    urlOficial: p.url,
    score: p.score,
    pagina: p.pagina,
    secao: p.secao,
  };
}

function lerPendentes(): Pendente[] {
  if (!fs.existsSync(PENDENTES_DIR)) return [];
  return fs
    .readdirSync(PENDENTES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(PENDENTES_DIR, f), "utf-8")) as Pendente);
}

function lerAcervo(): Acervo {
  if (!fs.existsSync(CONSOLIDADO)) {
    console.log(`[consolidar-editais] ${CONSOLIDADO} não existe; começando acervo vazio.`);
    return { total: 0, atualizadoEm: "", itens: [] };
  }
  const cru = JSON.parse(fs.readFileSync(CONSOLIDADO, "utf-8")) as Partial<Acervo>;
  return {
    total: Number(cru.total ?? 0),
    atualizadoEm: typeof cru.atualizadoEm === "string" ? cru.atualizadoEm : "",
    itens: Array.isArray(cru.itens) ? cru.itens : [],
  };
}

/** Guarda de dado pessoal (regra 2 do AGENTS.md): roda antes de gravar, igual
 *  ao publicar-radar. Em --seco nada é escrito, então a guarda não roda. */
function rodarGuarda(): void {
  const comando = ["scripts/checar-dado-pessoal-em-dado.py"];
  const python = process.env.RADAR_PYTHON ?? "python";
  let r = spawnSync(python, comando, { cwd: RAIZ, encoding: "utf-8", timeout: 300_000 });
  if (r.error && !process.env.RADAR_PYTHON) {
    r = spawnSync("py", ["-3", ...comando], { cwd: RAIZ, encoding: "utf-8", timeout: 300_000 });
  }
  if (r.error) {
    throw new Error(`não achei python para a guarda de dado pessoal (${r.error.message}); defina RADAR_PYTHON`);
  }
  if (r.status !== 0) {
    console.error(`${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim().slice(-2000));
    throw new Error(`guarda de dado pessoal reprovou (rc=${r.status}) — nada foi gravado`);
  }
  console.log("[consolidar-editais] guarda de dado pessoal passou");
}

function main(): void {
  const acervo = lerAcervo();
  const pendentes = lerPendentes();
  console.log(
    `[consolidar-editais] acervo: ${acervo.itens.length} item(ns), carimbo ${acervo.atualizadoEm || "nenhum"}`
  );
  console.log(`[consolidar-editais] pendentes: ${pendentes.length} em ${PENDENTES_DIR}`);

  const ids = new Set(acervo.itens.map((i) => i.id));
  const slugs = new Set(
    acervo.itens.map((i) => i.slug).filter((s): s is string => typeof s === "string" && s.length > 0)
  );
  const chaves = new Set(acervo.itens.map(chaveDeItem));

  const novos: ItemEdital[] = [];
  let duplicados = 0;
  for (const p of pendentes) {
    const item = converterEmItem(p);
    const chave = chaveDeItem(item);
    const motivo = ids.has(item.id)
      ? `id ${item.id}`
      : item.slug && slugs.has(item.slug)
        ? `slug ${item.slug}`
        : chaves.has(chave)
          ? "data + título já no acervo"
          : null;
    if (motivo) {
      duplicados++;
      console.log(`⏭️  [consolidar-editais] duplicado (${motivo}): ${item.id}`);
      continue;
    }
    ids.add(item.id);
    if (item.slug) slugs.add(item.slug);
    chaves.add(chave);
    novos.push(item);
  }

  if (novos.length === 0) {
    console.log(`[consolidar-editais] nada novo (${duplicados} duplicado(s)); arquivo intacto.`);
    return;
  }

  if (SO_MEDIR) {
    for (const item of novos) {
      console.log(`🧪 [seco] adicionaria: ${item.id} | ${item.dataPublicacao} | "${item.titulo.slice(0, 80)}"`);
    }
    console.log(`[consolidar-editais] --seco: ${novos.length} novo(s), ${duplicados} duplicado(s); nada gravado.`);
    return;
  }

  rodarGuarda();
  const itens = [...novos, ...acervo.itens].sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));
  const saida: Acervo = { total: itens.length, atualizadoEm: new Date().toISOString(), itens };
  fs.mkdirSync(path.dirname(CONSOLIDADO), { recursive: true });
  fs.writeFileSync(CONSOLIDADO, JSON.stringify(saida, null, 1) + "\n", "utf-8");
  console.log(
    `[consolidar-editais] +${novos.length} item(ns), ${duplicados} duplicado(s); total=${saida.total}; atualizadoEm=${saida.atualizadoEm}; gravado em ${CONSOLIDADO}`
  );
}

main();
