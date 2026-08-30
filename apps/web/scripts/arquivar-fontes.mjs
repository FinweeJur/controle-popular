#!/usr/bin/env node
/**
 * arquivar-fontes.mjs — captura e guarda cópia dos documentos que o portal
 * cita como fonte (Tarefa 2 do pedido de 13/08/2026, plano em
 * `docs/PLANO-ARQUIVO-DE-FONTES.md`). Primeira leva: normas de PROTEÇÃO.
 *
 * O QUE ESTE SCRIPT FAZ, EM ORDEM, POR URL:
 *   1. Checa `robots.txt` do host — desobedece, pula.
 *   2. Espera a pausa mínima daquele host (rede-honesta.mjs).
 *   3. Baixa o conteúdo (GET, segue redirect).
 *   4. Calcula sha256 do conteúdo baixado.
 *   5. Grava em disco LOCAL, fora de `apps/web/public/` (nunca ali — ver o
 *      comentário grande na migration 0073 e `docs/PLANO-ARQUIVO-DE-
 *      FONTES.md`). `.arquivo-local/` está no `.gitignore`.
 *   6. Extrai texto (PDF via `pdf-parse`; HTML por remoção de tag) e varre
 *      CPF — `scripts/checar-dado-pessoal.py` NÃO cobre isto (varre
 *      código, não PDF ingerido; lacuna registrada no cabeçalho dele).
 *   7. Grava uma linha em `arquivo_fontes`. `aprovado_para_publicacao` só
 *      fica `true` se o texto foi extraído E a varredura não achou CPF.
 *      Sem R2 configurado nesta máquina, `modo_armazenamento='local'` — o
 *      upload é passo seguinte, declarado, não feito aqui (ver o resumo
 *      que este script imprime no fim).
 *
 * O LINK ORIGINAL NUNCA É SUBSTITUÍDO POR NADA AQUI — este script só
 * ACRESCENTA uma linha em `arquivo_fontes`; nenhuma tabela existente é
 * tocada.
 *
 * Uso:
 *   node scripts/arquivar-fontes.mjs --de-resultado <auditoria.json> [--limite 30]
 *   node scripts/arquivar-fontes.mjs --tabela ambiental_legislacao --limite 30
 */

import { Client } from "pg";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import { USER_AGENT, robotsPermite, respeitarPausa } from "./_lib/rede-honesta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_WEB = path.resolve(__dirname, "..");

// Fora de `public/` DE PROPÓSITO. Ver aviso na migration 0073 e no plano:
// um cache de 570 MiB dentro de `public/` quase quebrou o deploy em
// 13/08 (commit `e82a58e`) porque `public/` inteiro vira Static Assets e
// o teto do Cloudflare é 25 MiB por arquivo — `.gitignore` não protege
// disso, quem copia pro bundle é o Next, não o git.
const DIR_ARQUIVO_LOCAL = path.join(RAIZ_WEB, ".arquivo-local");

const TIMEOUT_MS = 30_000;

function ehPostgresLocal(url) {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
  } catch {
    return false;
  }
}

const DATABASE_URL =
  process.env.DATABASE_URL ??
  readFileSync(path.join(RAIZ_WEB, ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="))
    ?.slice("DATABASE_URL=".length)
    .trim();

if (!DATABASE_URL) throw new Error("DATABASE_URL não encontrada (.env.local ausente?)");
if (!ehPostgresLocal(DATABASE_URL)) {
  throw new Error(
    `ABORTADO: DATABASE_URL não é local (${new URL(DATABASE_URL).hostname}). Regra da máquina: nunca a Neon.`
  );
}

// -------------------------------------------------------- varredura de CPF
// Mesma régua de `scripts/checar-dado-pessoal.py` (mod-11), reimplementada
// aqui porque aquele script varre CÓDIGO-FONTE via `git grep`, não texto
// extraído de um PDF baixado em tempo de execução — são domínios
// diferentes, mas a REGRA (mod-11, não só "11 dígitos") tem que ser a
// mesma, senão um viraria mais rigoroso que o outro sem ninguém decidir.

const RE_CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g;
const CPF_SINTETICOS = new Set([
  "00000000000",
  "000.000.000-00",
  "11111111111",
  "12345678900",
  "12345678909",
  "123.456.789-09",
]);

function cpfValido(digitos) {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
  const dv = (ate) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

function acharCpfNoTexto(texto) {
  const achados = [];
  for (const m of texto.matchAll(RE_CPF)) {
    const valor = m[0];
    if (CPF_SINTETICOS.has(valor)) continue;
    const digitos = valor.replace(/\D/g, "");
    if (cpfValido(digitos)) achados.push(valor);
  }
  return achados;
}

function htmlParaTextoBruto(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * O Content-Type manda, NÃO o nome/extensão da URL: `ambiental_legislacao`
 * (migration 0065) já registra que Semad/Siam às vezes servem HTML sob uma
 * URL de nome "download.pdf" — confirmado ao vivo nesta captura
 * (idNorma=51241 devolveu `text/html`, era página de erro, não a norma).
 * Classificar pelo nome da URL teria mandado HTML pro parser de PDF e
 * aprovado uma "cópia" que é lixo.
 */
async function extrairTexto(buffer, contentType, urlStr) {
  const ehPdf = /pdf/i.test(contentType ?? "") || (!contentType && /\.pdf($|\?)/i.test(urlStr));
  if (ehPdf) {
    try {
      // pdf-parse 2.x: API de classe, não a função solta das versões 1.x.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const r = await parser.getText();
      return { texto: r.text, extraido: true, tipoExtracao: "pdf" };
    } catch (e) {
      return { texto: "", extraido: false, tipoExtracao: "pdf-falhou", erro: String(e?.message ?? e) };
    }
  }
  const ehHtml = /html/i.test(contentType ?? "");
  if (ehHtml) {
    return { texto: htmlParaTextoBruto(buffer.toString("utf8")), extraido: true, tipoExtracao: "html" };
  }
  return { texto: "", extraido: false, tipoExtracao: "desconhecido" };
}

// -------------------------------------------------------------- captura

async function capturarUrl(urlStr) {
  const permitido = await robotsPermite(urlStr).catch(() => true);
  if (!permitido) return { ok: false, motivo: "bloqueado_robots" };

  const host = new URL(urlStr).host;
  await respeitarPausa(host);

  let resp;
  try {
    resp = await fetch(urlStr, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/pdf,*/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return { ok: false, motivo: "erro_rede", detalhe: String(e?.cause?.message ?? e?.message ?? e) };
  }

  if (!resp.ok) {
    return { ok: false, motivo: "http_nao_ok", http: resp.status };
  }

  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = resp.headers.get("content-type") ?? null;
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  return {
    ok: true,
    http: resp.status,
    buffer,
    contentType,
    tamanho: buffer.length,
    sha256,
    urlFinal: resp.url,
  };
}

function extensaoPara(contentType, urlStr) {
  if (/pdf/i.test(contentType ?? "") || /\.pdf($|\?)/i.test(urlStr)) return "pdf";
  if (/html/i.test(contentType ?? "")) return "html";
  return "bin";
}

// ------------------------------------------------------------- universo

async function coletarUniverso(c, { tabela, limite, deResultado }) {
  if (deResultado) {
    const dados = JSON.parse(readFileSync(deResultado, "utf8"));
    const aptos = dados.filter((r) => r.status === "ok" || r.status === "nao_verificavel");
    return limite ? aptos.slice(0, limite) : aptos;
  }

  const itens = [];
  if (!tabela || tabela === "ambiental_legislacao") {
    const r = await c.query(`
      SELECT id, fonte, tipo, numero, ano, temas, link_pdf AS url
      FROM ambiental_legislacao
      WHERE temas && ARRAY['serras','recursos_hidricos']
        AND link_pdf IS NOT NULL AND link_pdf <> ''
      ORDER BY random()
    `);
    for (const row of r.rows) {
      itens.push({
        tabela: "ambiental_legislacao",
        rotulo: `${row.fonte} ${row.tipo ?? ""} ${row.numero ?? ""}/${row.ano ?? ""}`.trim(),
        url: row.url,
      });
    }
  }
  return limite ? itens.slice(0, limite) : itens;
}

// --------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const arg = (nome, def) => {
    const i = args.indexOf(nome);
    return i >= 0 ? args[i + 1] : def;
  };
  const limite = Number(arg("--limite", "30"));
  const tabela = arg("--tabela", undefined);
  const deResultado = arg("--de-resultado", undefined);

  mkdirSync(DIR_ARQUIVO_LOCAL, { recursive: true });

  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();

  // Idempotência entre rodadas (ordem do universo é random() — sem isto,
  // duas execuções duplicam linhas; já medido: 5 duplicatas por reelaboração):
  //  1. Alvos com cópia já capturada (sha256 real) saem do universo.
  //  2. Falhas antigas (sha256='sem-conteudo') são APAGADAS e regravadas —
  //     retriga URLs que caíram por timeout/rede numa rodada anterior.
  await c.query(`DELETE FROM arquivo_fontes WHERE sha256 = 'sem-conteudo'`);
  const jaCapturadas = await c.query(
    `SELECT DISTINCT url_original FROM arquivo_fontes WHERE sha256 IS NOT NULL AND sha256 <> 'sem-conteudo'`
  );
  const jaCapturadasSet = new Set(jaCapturadas.rows.map((r) => r.url_original));

  const universo = await coletarUniverso(c, { tabela, limite, deResultado });
  const pendentes = universo.filter((u) => !jaCapturadasSet.has(u.url));
  console.log(`Capturando ${pendentes.length} URLs de ${universo.length} (já capturadas: ${universo.length - pendentes.length})`);

  const resultados = [];
  let ok = 0;
  let falhas = 0;
  let totalBytes = 0;
  let comCpf = 0;

  for (const [i, item] of pendentes.entries()) {
    process.stdout.write(`  [${i + 1}/${pendentes.length}] ${item.url} ... `);
    const cap = await capturarUrl(item.url);

    if (!cap.ok) {
      falhas++;
      console.log(`FALHOU (${cap.motivo}${cap.http ? " " + cap.http : ""})`);
      await c.query(
        `INSERT INTO arquivo_fontes
           (url_original, http_status, sha256, modo_armazenamento, caminho_armazenamento,
            aprovado_para_publicacao, erro_captura, user_agent)
         VALUES ($1, $2, $3, 'local', $4, false, $5, $6)`,
        [item.url, cap.http ?? null, "sem-conteudo", "(captura falhou, nada gravado em disco)", `${cap.motivo}${cap.detalhe ? ": " + cap.detalhe : ""}`, USER_AGENT]
      );
      resultados.push({ ...item, status: "falhou", ...cap, buffer: undefined });
      continue;
    }

    const ext = extensaoPara(cap.contentType, item.url);
    const subdir = cap.sha256.slice(0, 2);
    const nomeArquivo = `${cap.sha256}.${ext}`;
    const dirDestino = path.join(DIR_ARQUIVO_LOCAL, subdir);
    mkdirSync(dirDestino, { recursive: true });
    const caminhoCompleto = path.join(dirDestino, nomeArquivo);
    if (!existsSync(caminhoCompleto)) writeFileSync(caminhoCompleto, cap.buffer);

    const { texto, extraido, tipoExtracao, erro } = await extrairTexto(cap.buffer, cap.contentType, item.url);
    const cpfsAchados = extraido ? acharCpfNoTexto(texto) : [];
    const aprovado = extraido && cpfsAchados.length === 0;
    let motivoReprovacao = null;
    if (!extraido) {
      motivoReprovacao = `texto não extraído (${tipoExtracao}${erro ? ": " + erro : ""}) — requer revisão manual antes de publicar`;
    } else if (cpfsAchados.length > 0) {
      motivoReprovacao = `${cpfsAchados.length} CPF válido (mod-11) encontrado no texto extraído — cópia NÃO publicada`;
      comCpf++;
    }

    const caminhoRelativo = path.relative(RAIZ_WEB, caminhoCompleto);
    await c.query(
      `INSERT INTO arquivo_fontes
         (url_original, http_status, content_type, tamanho_bytes, sha256,
          modo_armazenamento, caminho_armazenamento, aprovado_para_publicacao,
          motivo_reprovacao, user_agent)
       VALUES ($1, $2, $3, $4, $5, 'local', $6, $7, $8, $9)`,
      [
        item.url,
        cap.http,
        cap.contentType,
        cap.tamanho,
        cap.sha256,
        caminhoRelativo,
        aprovado,
        motivoReprovacao,
        USER_AGENT,
      ]
    );

    ok++;
    totalBytes += cap.tamanho;
    console.log(
      `OK ${(cap.tamanho / 1024).toFixed(0)} KiB, sha256=${cap.sha256.slice(0, 12)}… ${aprovado ? "[aprovado]" : "[NÃO aprovado: " + motivoReprovacao + "]"}`
    );
    resultados.push({ ...item, status: "capturado", tamanho: cap.tamanho, sha256: cap.sha256, aprovado });
  }

  await c.end();

  console.log("\n=== medição (para decidir a escala do acervo inteiro) ===");
  console.log(`  tentativas:        ${pendentes.length}`);
  console.log(`  sucesso:           ${ok} (${((ok / pendentes.length) * 100).toFixed(1)}%)`);
  console.log(`  falha:             ${falhas}`);
  console.log(`  com CPF (barrado): ${comCpf}`);
  if (ok > 0) {
    const mediaKiB = totalBytes / ok / 1024;
    console.log(`  tamanho médio:     ${mediaKiB.toFixed(1)} KiB`);
    console.log(`  total desta amostra: ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`);
  }

  const dirSaida = path.join(__dirname, "_tmp-auditoria");
  mkdirSync(dirSaida, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    path.join(dirSaida, `captura-${carimbo}.json`),
    JSON.stringify(resultados.map((r) => ({ ...r, buffer: undefined })), null, 2)
  );
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
