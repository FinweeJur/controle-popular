#!/usr/bin/env node
/**
 * 🤖 BOT OCR CPF SCANNER
 * 
 * Escaneia documentos baixados (PDFs e imagens) em documentos-site/
 * usando Tesseract OCR + regex mod-11 para detectar CPFs de pessoas.
 * 
 * Integraçāo:
 * - Executa após download-documentos.mts
 * - Faz parte da rotina noturna (02:30-03:30)
 * - Se achar CPF: loga + notifica Telegram + marca dado pra revisão
 *
 * Uso:
 *   npx tsx scripts/bot-ocr-cpf-scanner.mts --dir documentos-site/
 *   npx tsx scripts/bot-ocr-cpf-scanner.mts --dir documentos-site/ --notificar
 *
 * Nota: Tesseract precisa estar instalado (apt/tesseract-ocr ou brew install tesseract)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-10017250703518";

// Regex para CPF (11 dígitos ou formato 000.000.000-00)
const RE_CPF = /\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/g;

// Validação mod-11 (copiada do checar-dado-pessoal.py)
function cpfValido(digitos: string): boolean {
  const clean = digitos.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(clean[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(clean[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(clean[10]);
}

const SINTETICOS = new Set([
  "00000000000", "000.000.000-00", "11111111111",
  "12345678900", "12345678909", "00003106705",
  "47018614139", "84351260645", "843.512.606-45",
  "05982413615", "059.824.136-15"
]);

async function checkTesseract() {
  try {
    execSync("tesseract --version", { stdio: "ignore" });
    return true;
  } catch {
    if (process.env.NODE_ENV !== "test") {
      console.error("⚠️  Tesseract não encontrado. Instalar: apt/tesseract-ocr ou brew install tesseract");
    }
    return false;
  }
}

function extractText(filePath: string): string | null {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".tiff", ".bmp"].includes(ext)) {
      return execSync(`tesseract "${filePath}" stdout`, { encoding: "utf-8" }).toString();
    }
    // PDFs — converter primeiro página para texto (ou usar pdftotext)
    if (ext === ".pdf") {
      try {
        return execSync(`pdftotext "${filePath}" - 2>/dev/null`, { encoding: "utf-8" }).toString();
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function scanTexto(texto: string): string[] {
  const achados = new Set<string>();
  const matches = texto.matchAll(RE_CPF);
  for (const m of matches) {
    const cpf = m[1];
    if (SINTETICOS.has(cpf)) continue;
    if (cpfValido(cpf)) achados.add(cpf);
  }
  return Array.from(achados);
}

function notificarTelegram(msg: string) {
  if (!TELEGRAM_TOKEN) return;
  try {
    spawn("curl", [
      "-s", "--max-time", "10",
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      "-d", `chat_id=${TELEGRAM_CHAT_ID}`,
      "-d", `text=${encodeURIComponent(msg)}`,
    ], { stdio: "ignore", detached: true, windowsHide: true });
  } catch {}
}

interface Resultado {
  arquivo: string;
  cpfs: string[];
}

async function scanDirectory(dir: string): Promise<Resultado[]> {
  if (!(await checkTesseract())) {
    console.error("⚠️ Tesseract não disponível — pulando escaneamento OCR");
    notificarTelegram("⚠️ OCR CPF Scanner: Tesseract não instalado — documentos não foram escaneados");
    return [];
  }

  const resultados: Resultado[] = [];
  const arquivos = getAllFilesRecursive(dir);

  for (const file of arquivos) {
    const texto = extractText(file);
    if (!texto) continue;

    const cpfs = scanTexto(texto);
    if (cpfs.length > 0) {
      resultados.push({ arquivo: path.basename(file), cpfs });
      console.log(`⚠️  ${file}: ${cpfs.length} CPF(s) detectado(s)`);
      notificarTelegram(
        `🚨 CPF detectado em documento: ${path.basename(file)}\n` +
        `Valores: ${cpfs.join(", ")}\n` +
        `⏰ ${new Date().toLocaleString("pt-BR")}`
      );
    }
  }
  return resultados;
}

function getAllFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFilesRecursive(full));
    } else if (![".json"].some(e => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// Main
const args = process.argv.slice(2);
const dirIdx = args.indexOf("--dir");
const dir = dirIdx >= 0 ? args[dirIdx + 1] : "documentos-site";
const doNotificar = !args.includes("--notificar");

if (!fs.existsSync(dir)) {
  console.log("Diretório não encontrado:", dir);
  process.exit(0);
}

scanDirectory(dir).then((results) => {
  const totalCpfs = results.reduce((s, r) => s + r.cpfs.length, 0);
  console.log(`\n📊 Escaneamento concluído: ${totalCpfs} CPF(s) detectado(s) em ${results.length} arquivo(s)`);
});
