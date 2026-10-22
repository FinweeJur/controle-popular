#!/usr/bin/env node
/**
 * Indexador local do RAG documental.
 *
 * Duas camadas:
 * 1. metadados/resumos já versionados (`documentos-paraopeba`,
 *    `biblioteca-desastres`, `biblioteca-unificada`, teses e Pro-Brumadinho);
 * 2. texto de PDFs oficiais, quando `--baixar` ou `--cache` é usado.
 *
 * O índice guarda trecho + página + URL oficial. PDFs ficam em `.cache/`
 * (gitignored); o repositório recebe só o índice derivado. O R2 entra numa
 * automação posterior, não neste script.
 *
 * Coleta: User-Agent honesto `FinweeJur/Github Artur colito`, leitura de
 * `robots.txt`, 1,5 s entre downloads, sem login/CAPTCHA/paywall.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { extrairPaginasPdf, fatiarDocumento, metaDoDocumento, redigirCpf } from "../lib/assistente/documentos-rag/extrair";
import { construirIndiceDocumentos, construirMapaDocumentos } from "../lib/assistente/documentos-rag/indice";
import type { DocumentoExtraido, DocumentoRagMeta, TrechoDocumento } from "../lib/assistente/documentos-rag/tipos";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(APP_ROOT, ".cache", "documentos-rag");
const SAIDA = path.join(APP_ROOT, "public", "data", "documentos-rag");
const UA = "FinweeJur/Github Artur colito";
const PAUSA_MS = 1500;

interface Relatorio {
  metadados: number;
  baixados: number;
  reaproveitados: number;
  pulados: number;
  falhas: number;
  semTexto: number;
  semTextoIds: string[];
}

interface ItemGenerico {
  id?: string;
  titulo?: string;
  tipo?: string;
  categoria?: string;
  macro_categoria?: string;
  tema?: string;
  temas?: string[];
  desastre?: string;
  bacia?: string;
  orgao?: string;
  autor?: string;
  autoria?: string | null;
  instituicao?: string;
  entidade?: string;
  data?: string | null;
  ano?: number | null;
  url?: string;
  urlOficial?: string;
  urlPdf?: string;
  link?: string;
  resumo?: string;
  microResumo?: string;
  citacao?: string;
  tags?: string[];
  links?: string[];
  destino?: string;
}

interface ArquivoItens {
  itens?: ItemGenerico[];
}

function pausar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function anoDe(data: string | null | undefined, ano?: number | null): number | null {
  if (typeof ano === "number" && Number.isFinite(ano)) return ano;
  const match = /^(\d{4})/.exec(data ?? "");
  return match ? Number(match[1]) : null;
}

function textoDe(item: ItemGenerico): string {
  return (item.resumo ?? item.microResumo ?? item.citacao ?? "").replace(/\s+/g, " ").trim();
}

function urlDe(item: ItemGenerico): string {
  return (item.urlPdf || item.urlOficial || item.link || item.url || item.links?.[0] || "").trim();
}

function urlPdfDe(item: ItemGenerico): string | null {
  const url = (item.urlPdf || item.url || item.links?.[0] || "").trim();
  return /\.pdf(?:$|[?#])/i.test(url) ? url : null;
}

function itemParaMeta(
  item: ItemGenerico,
  opcoes: {
    prefixo: string;
    fonte: string;
    categoria: string;
    tema: string;
    orgao: string;
  }
): DocumentoRagMeta | null {
  const titulo = item.titulo?.trim();
  const url = urlDe(item);
  if (!titulo || !url) return null;
  const resumo = textoDe(item);
  if (!resumo) return null;

  return {
    id: `${opcoes.prefixo}:${item.id ?? crypto.createHash("sha1").update(url).digest("hex").slice(0, 12)}`,
    titulo,
    tipo: item.tipo ?? "Documento",
    categoria: item.categoria ?? item.macro_categoria ?? opcoes.categoria,
    tema: item.tema ?? item.temas?.[0] ?? opcoes.tema,
    orgao: item.orgao ?? item.autor ?? item.autoria ?? item.instituicao ?? item.entidade ?? opcoes.orgao,
    ano: anoDe(item.data, item.ano),
    data: item.data ?? null,
    urlOriginal: url,
    urlPdf: urlPdfDe(item),
    resumo,
    tags: item.tags ?? item.temas ?? [],
    fonte: opcoes.fonte,
  };
}

function trechoDeMeta(meta: DocumentoRagMeta): TrechoDocumento {
  const resumo = redigirCpf(meta.resumo);
  return {
    id: `${meta.id}:meta`,
    docId: meta.id,
    titulo: meta.titulo,
    tipo: meta.tipo,
    categoria: meta.categoria,
    tema: meta.tema,
    orgao: meta.orgao,
    ano: meta.ano,
    pagina: 0,
    texto: resumo,
    urlOriginal: meta.urlOriginal,
    urlPdf: meta.urlPdf,
    resumo,
    tags: meta.tags,
    fonte: meta.fonte,
  };
}

function lerJson<T>(caminho: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf-8")) as T;
  } catch {
    return null;
  }
}

function adicionarMetadados(
  itens: ItemGenerico[],
  meta: DocumentoRagMeta[],
  trechos: TrechoDocumento[],
  opcoes: Parameters<typeof itemParaMeta>[1],
  urlsVistas: Set<string>
): void {
  for (const item of itens) {
    const registro = itemParaMeta(item, opcoes);
    if (!registro) continue;
    const chaveUrl = registro.urlOriginal.toLowerCase();
    if (urlsVistas.has(chaveUrl)) continue;
    urlsVistas.add(chaveUrl);
    meta.push(registro);
    trechos.push(trechoDeMeta(registro));
  }
}

function carregarMetadados(): { documentos: DocumentoRagMeta[]; trechos: TrechoDocumento[]; relatorio: Relatorio } {
  const documentos: DocumentoRagMeta[] = [];
  const trechos: TrechoDocumento[] = [];
  const urlsVistas = new Set<string>();

  const fontesOficiais = lerJson<ItemGenerico[]>(path.join(APP_ROOT, "data", "documentos-rag-fontes.json"));
  if (fontesOficiais) {
    adicionarMetadados(
      fontesOficiais,
      documentos,
      trechos,
      { prefixo: "oficial", fonte: "fontes-oficiais", categoria: "Legislação", tema: "Cidades", orgao: "Fonte oficial" },
      urlsVistas
    );
  }

  const paraopeba = lerJson<ItemGenerico[]>(path.join(APP_ROOT, "public", "data", "documentos-paraopeba.json"));
  if (paraopeba) {
    adicionarMetadados(
      paraopeba,
      documentos,
      trechos,
      { prefixo: "paraopeba", fonte: "documentos-paraopeba", categoria: "Justiça & Controle", tema: "Paraopeba", orgao: "UFMG / Projeto Brumadinho" },
      urlsVistas
    );
  }

  const desastres = lerJson<ArquivoItens>(path.join(APP_ROOT, "public", "data", "biblioteca-desastres.json"));
  if (desastres?.itens) {
    adicionarMetadados(
      desastres.itens,
      documentos,
      trechos,
      { prefixo: "desastre", fonte: "biblioteca-desastres", categoria: "Ambiental & Desastres", tema: "Desastres e barragens", orgao: "ATIs / CBH-Doce" },
      urlsVistas
    );
  }

  const unificada = lerJson<ArquivoItens>(path.join(APP_ROOT, "data", "biblioteca-unificada.json"));
  if (unificada?.itens) {
    adicionarMetadados(
      unificada.itens,
      documentos,
      trechos,
      { prefixo: "unificada", fonte: "biblioteca-unificada", categoria: "Biblioteca geral", tema: "Acervo geral", orgao: "Controle Popular" },
      urlsVistas
    );
  }

  const teses = lerJson<ArquivoItens>(path.join(APP_ROOT, "data", "biblioteca-teses-atingidos.json"));
  if (teses?.itens) {
    adicionarMetadados(
      teses.itens,
      documentos,
      trechos,
      { prefixo: "tese", fonte: "biblioteca-teses", categoria: "Acadêmico & Pesquisa", tema: "Atingidos por barragens", orgao: "Biblioteca acadêmica" },
      urlsVistas
    );
  }

  const proBrumadinho = lerJson<ArquivoItens>(path.join(APP_ROOT, "public", "data", "biblioteca-pro-brumadinho.json"));
  if (proBrumadinho?.itens) {
    adicionarMetadados(
      proBrumadinho.itens,
      documentos,
      trechos,
      { prefixo: "probrumadinho", fonte: "biblioteca-pro-brumadinho", categoria: "Pro-Brumadinho", tema: "Reparação de Brumadinho", orgao: "Governo de Minas Gerais" },
      urlsVistas
    );
  }

  return {
    documentos,
    trechos,
    relatorio: { metadados: documentos.length, baixados: 0, reaproveitados: 0, pulados: 0, falhas: 0, semTexto: 0, semTextoIds: [] },
  };
}

interface RegrasRobots {
  permitido: (caminho: string) => boolean;
}

const cacheRobots = new Map<string, RegrasRobots>();

async function regrasDoHost(origem: string): Promise<RegrasRobots> {
  const existente = cacheRobots.get(origem);
  if (existente) return existente;

  try {
    const resposta = await fetch(`${origem}/robots.txt`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!resposta.ok) {
      const livre = { permitido: () => true };
      cacheRobots.set(origem, livre);
      return livre;
    }
    const linhas = (await resposta.text()).split(/\r?\n/);
    let noGrupo = false;
    const regras: { tipo: "allow" | "disallow"; caminho: string }[] = [];
    for (const linha of linhas) {
      const limpa = linha.replace(/#.*$/, "").trim();
      if (!limpa) continue;
      const [campoBruto, ...resto] = limpa.split(":");
      const campo = campoBruto.trim().toLowerCase();
      const valor = resto.join(":").trim();
      if (campo === "user-agent") {
        noGrupo = valor === "*" || valor.toLowerCase().includes("finweejur");
        continue;
      }
      if (!noGrupo) continue;
      if (campo === "allow") regras.push({ tipo: "allow", caminho: valor });
      if (campo === "disallow") regras.push({ tipo: "disallow", caminho: valor });
    }
    const doHost: RegrasRobots = {
      permitido(caminho: string): boolean {
        const aplicaveis = regras
          .filter((regra) => regra.caminho && caminho.startsWith(regra.caminho))
          .sort((a, b) => b.caminho.length - a.caminho.length);
        return aplicaveis[0]?.tipo !== "disallow";
      },
    };
    cacheRobots.set(origem, doHost);
    return doHost;
  } catch {
    const livre = { permitido: () => true };
    cacheRobots.set(origem, livre);
    return livre;
  }
}

async function baixarPdf(url: string, destino: string): Promise<"baixado" | "cache"> {
  if (fs.existsSync(destino) && fs.statSync(destino).size > 4) return "cache";
  const alvo = new URL(url);
  const regras = await regrasDoHost(alvo.origin);
  if (!regras.permitido(alvo.pathname)) throw new Error(`robots.txt desautoriza ${alvo.pathname}`);

  const resposta = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/pdf,*/*" },
    signal: AbortSignal.timeout(60_000),
    redirect: "follow",
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const buffer = Buffer.from(await resposta.arrayBuffer());
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error("resposta não começa com %PDF-");
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, buffer);
  return "baixado";
}

function hashDaUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 20);
}

function argumento(nome: string, padrao: string): string {
  const exato = process.argv.find((arg) => arg === `--${nome}`);
  if (exato) {
    const indice = process.argv.indexOf(exato);
    return process.argv[indice + 1] ?? padrao;
  }
  const comIgual = process.argv.find((arg) => arg.startsWith(`--${nome}=`));
  return comIgual ? comIgual.split("=").slice(1).join("=") : padrao;
}

async function processarPdfs(
  documentos: DocumentoRagMeta[],
  trechos: TrechoDocumento[],
  relatorio: Relatorio,
  limite: number,
  apenasCache: boolean,
  fontesFiltro: string[]
): Promise<void> {
  const vistosDocIds = new Set(documentos.map((d) => d.id));
  let processados = 0;

  for (const documento of documentos) {
    if (!documento.urlPdf) continue;
    if (fontesFiltro.length > 0 && !fontesFiltro.includes(documento.fonte)) continue;
    if (limite > 0 && processados >= limite) break;
    processados += 1;

    const destino = path.join(CACHE, `${hashDaUrl(documento.urlPdf)}.pdf`);
    try {
      if (apenasCache && !fs.existsSync(destino)) {
        relatorio.pulados += 1;
        continue;
      }
      const estado = apenasCache ? "cache" : await baixarPdf(documento.urlPdf, destino);
      relatorio[estado === "cache" ? "reaproveitados" : "baixados"] += 1;

      const paginas = await extrairPaginasPdf(fs.readFileSync(destino));
      if (paginas.length === 0) {
        relatorio.semTexto += 1;
        relatorio.semTextoIds.push(documento.id);
        console.log(`sem texto: ${documento.titulo}`);
        continue;
      }
      const extraido: DocumentoExtraido = { ...documento, paginas };
      trechos.push(...fatiarDocumento(extraido));
      if (!vistosDocIds.has(documento.id)) documentos.push(metaDoDocumento(extraido));
      console.log(`${paginas.length} pág.: ${documento.titulo}`);
    } catch (erro) {
      relatorio.falhas += 1;
      console.log(`falhou: ${documento.titulo} — ${(erro as Error).message}`);
    }
    await pausar(PAUSA_MS);
  }
}

async function main(): Promise<void> {
  const limite = Number(argumento("limite", "0")) || 0;
  const baixar = process.argv.includes("--baixar");
  const cache = process.argv.includes("--cache");
  const fontesFiltro = argumento("fonte", "").split(",").map((f) => f.trim()).filter(Boolean);
  const { documentos, trechos, relatorio } = carregarMetadados();

  console.log(`Metadados: ${documentos.length} documentos`);
  if (baixar || cache) {
    await processarPdfs(documentos, trechos, relatorio, limite, cache && !baixar, fontesFiltro);
  }

  const indice = construirIndiceDocumentos(trechos);
  const mapa = construirMapaDocumentos(indice);
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.writeFileSync(
    path.join(SAIDA, "trechos.json"),
    JSON.stringify(
      {
        geradoEm: new Date().toISOString(),
        totalDocumentos: indice.documentos.length,
        totalTrechos: indice.trechos.length,
        documentos: indice.documentos,
        trechos: indice.trechos,
        relatorio,
      },
      null,
      0
    )
  );
  fs.writeFileSync(path.join(SAIDA, "mapa.json"), JSON.stringify(mapa, null, 2));

  console.log("\nResumo:", relatorio);
  console.log(`Índice: ${indice.documentos.length} documentos, ${indice.trechos.length} trechos`);
  console.log(`Saída: ${SAIDA}`);
  if (relatorio.semTexto > 0) {
    console.log(`Sem texto (${relatorio.semTexto}): ${relatorio.semTextoIds.slice(0, 10).join(", ")}`);
  }
}

await main();
