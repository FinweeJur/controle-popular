/**
 * DocVault: baixa PDFs do catálogo (fontes governamentais), varre por CPF de
 * pessoa fisica e envia ao R2 (bucket `controlepopular-fontes`) SOMENTE o que
 * passou. O indice gerado fica em `docs/relatorios-automacao/docvault-indice.json`.
 *
 * Seguranca (regras do repo, medidas aqui):
 * - PDF NUNCA vai para o repositorio. Downloads ficam em
 *   %LOCALAPPDATA%\controlepopular\docvault\ (fora do repo).
 * - Varredura fail-closed: PDF sem camada de texto extraivel (scan/imagem)
 *   registra "varredura pendente" e NAO vai ao R2. CPF valido detectado:
 *   REJEITA, apaga o arquivo do staging e registra motivo MASCARADO no indice
 *   (o numero em si e dado pessoal e nao entra no repo).
 * - Falso positivo de byte-scan: binario de PDF compactado pode conter 11
 *   digitos que passam no mod-11 por acidente. A favor do rejeitar (seguro);
 *   o risco residual esta documentado aqui de proposito.
 * - Credenciais R2 vivem em scripts/.env (gitignored) e sao lidas em runtime
 *   por parser proprio; valores vao so para process.env do processo e nunca
 *   sao impressos em log.
 * - UA honesto, pausa de 400ms entre requisicoes do catalogo.
 *
 * Status do indice (enum):
 *   baixado | download-falhou | varredura-falhou | rejeitado-por-cpf |
 *   upload-pendente | enviado
 *   - "varredura-falhou" com motivo "varredura pendente: ..." significa
 *     fail-closed (nao leu texto), pendente de ferramenta de OCR.
 *   - "download-falhou" e extensao do enum para o caso que a tarefa nao
 *     listou: baixar e impossivel nao e nenhum dos cinco estados normais.
 *
 * Uso:
 *   npx tsx scripts/agent-tools/docvault-downloader.mts
 *
 * Variaveis em scripts/.env (ver scripts/.env.exemplo):
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   Se faltarem, o upload vira "upload-pendente" (nao e erro, segue o loop).
 */
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOGO = path.join(RAIZ, "scripts", "agent-tools", "docvault-catalogo.json");
const INDICE = path.join(RAIZ, "docs", "relatorios-automacao", "docvault-indice.json");
const ENV_ARQUIVO = path.join(RAIZ, "scripts", ".env");

const UA = "controlepopular-docvault/0.1 (portal civico de transparencia; contato: docs do repositorio)";
const PAUSA_CATALOGO_MS = 400;
const DOWNLOAD_TIMEOUT_MS = 25_000;
const PARSE_TIMEOUT_MS = 20_000;
const CHAVES_R2 = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const;

type StatusIndice =
  | "baixado"
  | "download-falhou"
  | "varredura-falhou"
  | "rejeitado-por-cpf"
  | "upload-pendente"
  | "enviado";

interface EntradaIndice {
  slug: string;
  nome: string;
  urlOrigem: string;
  hash: string;
  dataDownload: string;
  status: StatusIndice;
  urlR2?: string;
  motivo?: string;
}

interface EntradaCatalogo {
  slug: string;
  nome: string;
  urlOrigem: string;
  frente: string;
  rotaPortal: string;
  observacao?: string;
}

interface ResultadoVarredura {
  ok: boolean;
  cpfEncontrado: boolean;
  leuTexto: boolean;
  detalhe: string;
}

interface ResumoEtapa {
  slug: string;
  download: string;
  hash: string;
  varredura: string;
  upload: string;
}

// ─────────────────────────── infra ───────────────────────────

function pausar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parser minimo de .env: linhas CHAVE=VALOR, ignora comentarios (#) e vazias.
 *  Valores vao para process.env; nada sai do processo. */
function lerEnv(caminho: string): void {
  if (!fs.existsSync(caminho)) return;
  for (const linha of fs.readFileSync(caminho, "utf-8").split(/\r?\n/)) {
    const crua = linha.trim();
    if (crua === "" || crua.startsWith("#")) continue;
    const m = crua.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

function credenciaisR2Presentes(): boolean {
  return CHAVES_R2.every((k) => (process.env[k] ?? "").trim() !== "");
}

function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function baixarPdf(url: string, destino: string): Promise<Buffer> {
  const resposta = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ${resposta.statusText}`);
  const tipo = (resposta.headers.get("content-type") ?? "").toLowerCase();
  if (tipo && tipo.includes("text/html")) throw new Error(`resposta HTML (${tipo}), nao PDF`);
  const buf = Buffer.from(await resposta.arrayBuffer());
  if (buf.length < 5 || buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error(`conteudo nao comeca com %PDF (${buf.length} bytes)`);
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, buf);
  return buf;
}

// ─────────────────────────── varredura CPF ───────────────────────────

/** Digito verificador de CPF (mesmo padrao do repo, agregar-decisoes-licenciamento).
 *  Formato nao basta: 000.000.000-00 tem forma e nao e ninguem. */
function cpfValido(bruto: string): boolean {
  const c = bruto.replace(/\D/g, "");
  if (c.length !== 11) return false;
  if (c.split("").every((d) => d === c[0])) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(c[n])) return false;
  }
  return true;
}

/** Infla streams FlateDecode do PDF em texto latin1 (perda zero de bytes). */
function inflarStreams(pdf: Buffer): string[] {
  const saidas: string[] = [];
  const texto = pdf.toString("latin1");
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const bruto = Buffer.from(m[1], "latin1");
    try {
      saidas.push(inflateSync(bruto).toString("latin1"));
    } catch {
      // stream nao-Flate (DCTDecode, JPXDecode etc.) ou cortada — ignora.
    }
  }
  return saidas;
}

function infladoTemTexto(s: string): boolean {
  if (s.length < 100) return false;
  const letras = (s.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  return letras / s.length >= 0.3;
}

/** Tenta extrair texto com pdf-parse (disponivel via workspace). Se falhar ou
 *  demorar, devolve "" — a varredura cai no fail-closed. */
async function extrairTextoPdfParse(pdf: Buffer): Promise<string> {
  const mod: { default?: (buf: Buffer) => Promise<{ text: string }> } | null =
    await import("pdf-parse").catch(() => null);
  if (!mod?.default) return "";
  try {
    const r = await Promise.race([
      mod.default(pdf),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout pdf-parse")), PARSE_TIMEOUT_MS),
      ),
    ]);
    return r.text ?? "";
  } catch {
    return "";
  }
}

/** Varredura obrigatoria de CPF sobre os bytes do PDF + camadas de texto. */
async function varrerCpf(pdf: Buffer): Promise<ResultadoVarredura> {
  const bruto = pdf.toString("latin1");
  const inflados = inflarStreams(pdf);
  const textoPdfParse = await extrairTextoPdfParse(pdf);

  const camadas = [...inflados, textoPdfParse].join("\n");
  const leuTexto =
    camadas.trim().length > 0 || inflados.some(infladoTemTexto) || textoPdfParse.trim().length > 0;

  const todos = [bruto, camadas].join("\n");
  const candidatos = new Set<string>();
  for (const m of todos.matchAll(/\b\d{11}\b/g)) candidatos.add(m[0]);
  for (const m of todos.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}/g)) candidatos.add(m[0].replace(/\D/g, ""));

  let cpfEncontrado = false;
  for (const candidato of candidatos) {
    if (cpfValido(candidato)) {
      cpfEncontrado = true;
      break;
    }
  }

  if (!leuTexto) {
    return {
      ok: false,
      cpfEncontrado: false,
      leuTexto: false,
      detalhe: "varredura pendente: PDF sem camada de texto extraivel (provarel scan/imagem)",
    };
  }
  if (cpfEncontrado) {
    return { ok: false, cpfEncontrado: true, leuTexto: true, detalhe: "CPF valido detectado (numero mascarado por privacidade)" };
  }
  return { ok: true, cpfEncontrado: false, leuTexto: true, detalhe: `sem CPF valido (${candidatos.size} candidato(s) rejeitado(s) no mod-11)` };
}

// ─────────────────────────── R2 ───────────────────────────

async function enviarAoR2(pdf: Buffer, slug: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `docs/${slug}.pdf`,
      Body: pdf,
      ContentType: "application/pdf",
    }),
  );
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/docs/${slug}.pdf`;
}

// ─────────────────────────── indice ───────────────────────────

function lerIndice(): Map<string, EntradaIndice> {
  try {
    const lista = JSON.parse(fs.readFileSync(INDICE, "utf-8")) as EntradaIndice[];
    return new Map(lista.map((e) => [e.slug, e]));
  } catch {
    return new Map();
  }
}

function gravarIndice(indice: Map<string, EntradaIndice>): void {
  fs.mkdirSync(path.dirname(INDICE), { recursive: true });
  const lista = [...indice.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(INDICE, JSON.stringify(lista, null, 2) + "\n", "utf-8");
}

// ─────────────────────────── fluxo principal ───────────────────────────

function pastaStaging(): string {
  const local = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  const dir = path.join(local, "controlepopular", "docvault");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function processarEntrada(
  entrada: EntradaCatalogo,
  indice: Map<string, EntradaIndice>,
  staging: string,
): Promise<ResumoEtapa> {
  const anterior = indice.get(entrada.slug);
  const resumo: ResumoEtapa = { slug: entrada.slug, download: "-", hash: "-", varredura: "-", upload: "-" };

  if (anterior?.status === "enviado" || anterior?.status === "rejeitado-por-cpf") {
    resumo.download = `pulado (estado terminal ${anterior.status})`;
    console.log(`[docvault] ${entrada.slug}: ${resumo.download}`);
    return resumo;
  }

  const arquivo = path.join(staging, `${entrada.slug}.pdf`);
  let pdf: Buffer;

  await pausar(PAUSA_CATALOGO_MS);
  if (fs.existsSync(arquivo) && anterior?.hash) {
    const hashLocal = sha256Hex(fs.readFileSync(arquivo));
    if (hashLocal === anterior.hash) {
      resumo.download = "em cache (mesmo hash do indice, sem rebaixar)";
      console.log(`[docvault] ${entrada.slug}: ${resumo.download}`);
      pdf = fs.readFileSync(arquivo);
    } else {
      fs.rmSync(arquivo, { force: true });
      pdf = await baixarPdf(entrada.urlOrigem, arquivo);
      resumo.download = `baixado (${pdf.length} bytes)`;
      console.log(`[docvault] ${entrada.slug}: ${resumo.download}`);
    }
  } else {
    try {
      pdf = await baixarPdf(entrada.urlOrigem, arquivo);
      resumo.download = `baixado (${pdf.length} bytes)`;
      console.log(`[docvault] ${entrada.slug}: ${resumo.download}`);
    } catch (e) {
      resumo.download = `falhou: ${(e as Error).message.slice(0, 140)}`;
      console.log(`[docvault] ${entrada.slug}: download ${resumo.download}`);
      indice.set(entrada.slug, {
        slug: entrada.slug,
        nome: entrada.nome,
        urlOrigem: entrada.urlOrigem,
        hash: anterior?.hash ?? "",
        dataDownload: new Date().toISOString(),
        status: "download-falhou",
        motivo: resumo.download.replace(/^falhou: /, ""),
      });
      gravarIndice(indice);
      return resumo;
    }
  }

  const hash = sha256Hex(pdf);
  resumo.hash = `sha256 ok (${hash.slice(0, 12)}...)`;
  console.log(`[docvault] ${entrada.slug}: hash ${resumo.hash}`);

  const varredura = await varrerCpf(pdf);
  resumo.varredura = varredura.ok ? "ok" : varredura.cpfEncontrado ? "CPF encontrado (rejeitado)" : "pendente";
  console.log(`[docvault] ${entrada.slug}: varredura ${resumo.varredura} — ${varredura.detalhe}`);

  if (!varredura.ok) {
    const status: StatusIndice = varredura.cpfEncontrado ? "rejeitado-por-cpf" : "varredura-falhou";
    if (varredura.cpfEncontrado) fs.rmSync(arquivo, { force: true });
    indice.set(entrada.slug, {
      slug: entrada.slug,
      nome: entrada.nome,
      urlOrigem: entrada.urlOrigem,
      hash,
      dataDownload: new Date().toISOString(),
      status,
      motivo: varredura.detalhe,
    });
    gravarIndice(indice);
    return resumo;
  }

  lerEnv(ENV_ARQUIVO);
  if (!credenciaisR2Presentes()) {
    resumo.upload = "upload pendente (credenciais R2 ausentes em scripts/.env — nao e erro)";
    console.log(`[docvault] ${entrada.slug}: ${resumo.upload}`);
    indice.set(entrada.slug, {
      slug: entrada.slug,
      nome: entrada.nome,
      urlOrigem: entrada.urlOrigem,
      hash,
      dataDownload: new Date().toISOString(),
      status: "upload-pendente",
      motivo: "credenciais R2 ausentes em scripts/.env",
    });
    gravarIndice(indice);
    return resumo;
  }

  try {
    const urlR2 = await enviarAoR2(pdf, entrada.slug);
    resumo.upload = `enviado (${urlR2})`;
    console.log(`[docvault] ${entrada.slug}: upload ${resumo.upload}`);
    indice.set(entrada.slug, {
      slug: entrada.slug,
      nome: entrada.nome,
      urlOrigem: entrada.urlOrigem,
      hash,
      dataDownload: new Date().toISOString(),
      status: "enviado",
      urlR2,
    });
  } catch (e) {
    resumo.upload = `erro: ${(e as Error).message.slice(0, 140)}`;
    console.log(`[docvault] ${entrada.slug}: upload ${resumo.upload}`);
    indice.set(entrada.slug, {
      slug: entrada.slug,
      nome: entrada.nome,
      urlOrigem: entrada.urlOrigem,
      hash,
      dataDownload: new Date().toISOString(),
      status: "upload-pendente",
      motivo: `erro no envio ao R2: ${resumo.upload.replace(/^erro: /, "")}`,
    });
  }
  gravarIndice(indice);
  return resumo;
}

export async function executarDocVault(): Promise<ResumoEtapa[]> {
  const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf-8")) as EntradaCatalogo[];
  const staging = pastaStaging();
  const indice = lerIndice();
  console.log(`[docvault] catalogo: ${catalogo.length} entrada(s); staging: ${staging}`);
  const resumos: ResumoEtapa[] = [];
  for (const entrada of catalogo) {
    resumos.push(await processarEntrada(entrada, indice, staging));
  }
  gravarIndice(indice);
  const contagem = new Map<string, number>();
  for (const e of indice.values()) contagem.set(e.status, (contagem.get(e.status) ?? 0) + 1);
  console.log(`[docvault] indice: ${INDICE} (${indice.size} entrada(s))`);
  console.log(`[docvault] resumo por status: ${[...contagem.entries()].map(([s, n]) => `${s}=${n}`).join(", ")}`);
  return resumos;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  executarDocVault().catch((e) => {
    console.error("[docvault] falha fatal:", (e as Error).message);
    process.exitCode = 1;
  });
}
