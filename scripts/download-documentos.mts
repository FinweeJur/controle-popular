#!/usr/bin/env node
/**
 * 📥 Downloader de PDFs e Documentos do Controle Popular
 *
 * Escaneia páginas do site, encontra links de PDFs/docs e baixa
 * organizando em: documentos-site/{tema}/{data}/
 *
 * Uso:
 *   npx tsx scripts/download-documentos.mts --site https://controlepopular.com.br --tema outorgas
 *   npx tsx scripts/download-documentos.mts --sitemap https://controlepopular.com.br/sitemap.xml
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const DOWNLOAD_DIR = path.join(process.cwd(), "documentos-site");

interface DownloadResult {
  url: string;
  destino: string;
  bytes: number;
  status: "ok" | "exists" | "error";
  error?: string;
}

const PDF_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".zip"];

function isDocumento(url: string): boolean {
  const lower = url.toLowerCase();
  return PDF_EXTS.some(ext => lower.endsWith(ext)) || lower.includes("download");
}

function extrairTema(url: string): string {
  const match = url.match(/\/([^/]+)\//);
  if (!match) return "outros";
  const tema = match[1];
  return ["http", "https", "www", "com", "br"].includes(tema) ? "raiz" : tema;
}

async function baixarArquivo(url: string, tema: string): Promise<DownloadResult> {
  const parsed = new URL(url);
  const pathLimpo = parsed.pathname.replace(/[^a-zA-Z0-9_-]/g, "_");
  const data = new Date().toISOString().split("T")[0];
  const dir = path.join(DOWNLOAD_DIR, tema, data);
  const filename = `${path.basename(parsed.pathname)}${pathLimpo}`.substring(0, 128);
  const destino = path.join(dir, filename);

  if (fs.existsSync(destino)) {
    return { url, destino, bytes: 0, status: "exists" };
  }

  fs.mkdirSync(dir, { recursive: true });

  return new Promise((resolve) => {
    const file = fs.createWriteStream(destino);
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destino);
        baixarArquivo(res.headers.location, tema).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destino);
        resolve({ url, destino, bytes: 0, status: "error", error: `HTTP ${res.statusCode}` });
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const stats = fs.statSync(destino);
        resolve({ url, destino, bytes: stats.size, status: "ok" });
      });
      file.on("error", (err) => {
        fs.unlinkSync(destino);
        resolve({ url, destino, bytes: 0, status: "error", error: err.message });
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destino)) fs.unlinkSync(destino);
      resolve({ url, destino, bytes: 0, status: "error", error: err.message });
    });
  });
}

async function extrairLinksDocs(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let html = "";
      res.on("data", chunk => html += chunk);
      res.on("end", () => {
        const matches = html.matchAll(/href=["']([^"']+\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|csv|zip))["']/gi);
        const links = Array.from(matches).map(m => m[1]);
        resolve([...new Set(links)]); // deduplica
      });
    }).on("error", () => resolve([]));
  });
}

async function escanearSitemap(sitemapUrl: string): Promise<string[]> {
  // Extrai URLs de páginas do sitemap
  return new Promise((resolve) => {
    https.get(sitemapUrl, { timeout: 15000 }, (res) => {
      let xml = "";
      res.on("data", chunk => xml += chunk);
      res.on("end", () => {
        const urls = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
        resolve(Array.from(urls).map(u => u[1]));
      });
    }).on("error", () => resolve([]));
  });
}

// Main
const args = process.argv.slice(2);
const siteIdx = args.indexOf("--site");
const sitemapIdx = args.indexOf("--sitemap");
const temaIdx = args.indexOf("--tema");
const site = siteIdx >= 0 ? args[siteIdx + 1] : null;
const sitemap = sitemapIdx >= 0 ? args[sitemapIdx + 1] : null;
const temaOverride = temaIdx >= 0 ? args[temaIdx + 1] : null;

if (!site && !sitemap) {
  console.error("Uso: npx tsx scripts/download-documentos.mts --site <url> --tema <nome>");
  console.error("     npx tsx scripts/download-documentos.mts --sitemap <url>");
  process.exit(1);
}

async function main() {
  let paginas: string[] = [];
  if (sitemap) {
    paginas = await escanearSitemap(sitemap);
  } else if (site) {
    paginas = [site];
  }

  const resultados: DownloadResult[] = [];
  console.error(`🔍 Escaneando ${paginas.length} página(s)...`);

  for (const pagina of paginas.slice(0, 20)) { // limita a 20 por segurança
    const links = await extrairLinksDocs(pagina);
    console.error(`  ${pagina}: ${links.length} docs encontrados`);

    for (const link of links) {
      const url = link.startsWith("http") ? link : new URL(link, pagina).href;
      const tema = temaOverride || extrairTema(pagina);
      const result = await baixarArquivo(url, tema);
      resultados.push(result);
      console.error(`  📄 ${result.status}: ${path.basename(result.destino)} (${(result.bytes/1024).toFixed(1)} KB)`);
    }
  }

  // Salva manifesto
  const manifesto = {
    data: new Date().toISOString(),
    site: site || sitemap,
    total_documentos: resultados.length,
    baixados: resultados.filter(r => r.status === "ok").length,
    erros: resultados.filter(r => r.status === "error").length,
    resultados,
  };
  fs.writeFileSync(path.join(DOWNLOAD_DIR, "manifesto.json"), JSON.stringify(manifesto, null, 2));
  console.error(`\n📦 Total: ${manifesto.baixados} baixados, ${manifesto.erros} erros`);
  console.error(`📝 Manifesto salvo em documentos-site/manifesto.json`);
}

main().catch(console.error);
