#!/usr/bin/env node
/**
 * scripts/sincronizar-documentos-r2.mts
 *
 * Pipeline de arquivamento perene e espelhamento no Cloudflare R2:
 * 1. Mapeia links de PDFs externos nas bases de dados do portal.
 * 2. Baixa o documento com taxa controlada e User-Agent transparente.
 * 3. Varre o conteúdo por segurança fail-closed (Mod-11 CPF - LGPD).
 * 4. Sobe para o bucket Cloudflare R2 (`controlepopular-fontes`).
 * 5. Emite mapa de URLs (`apps/web/data/documentos-espelho-r2.json`)
 *    para o portal preferir o link do bucket R2 em vez do link externo instável.
 *
 * Uso:
 *   npx tsx scripts/sincronizar-documentos-r2.mts --dry-run
 *   npx tsx scripts/sincronizar-documentos-r2.mts --limite 5
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGING_DIR = path.join(RAIZ, "documentos-site", "r2-staging");
const MAPA_R2 = path.join(RAIZ, "apps", "web", "data", "documentos-espelho-r2.json");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");
const ENV_LOCAL_PATH = path.join(RAIZ, "apps", "web", ".env.local");

const UA = "controlepopular-r2-sync/0.1 (portal civico de transparencia; contato: contato@controlepopular.com.br)";
const PAUSA_MS = 400;

function carregarVariavel(nome: string): string | undefined {
  if (process.env[nome]) return process.env[nome];
  for (const arq of [ENV_PATH, ENV_LOCAL_PATH]) {
    if (fs.existsSync(arq)) {
      const linhas = fs.readFileSync(arq, "utf-8").split("\n");
      for (const l of linhas) {
        const m = l.match(new RegExp(`^\\s*${nome}\\s*=\\s*(.*)\\s*$`));
        if (m) return m[1].trim();
      }
    }
  }
  return undefined;
}

const R2_ENDPOINT = carregarVariavel("R2_ENDPOINT");
const R2_ACCESS_KEY_ID = carregarVariavel("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = carregarVariavel("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = carregarVariavel("R2_BUCKET_NAME") || "controlepopular-fontes";
const R2_PUBLIC_DOMAIN = carregarVariavel("R2_PUBLIC_DOMAIN") || "https://fontes.controlepopular.com.br";

function pausar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function validarCpfMod11(d: string): boolean {
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const dv = (ate: number) => {
    let s = 0;
    for (let i = 0; i < ate; i++) s += Number(d[i]) * (ate + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function varrerCpfTexto(texto: string): boolean {
  const matches = texto.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{11}\b/g) || [];
  for (const m of matches) {
    const limpo = m.replace(/\D/g, "");
    if (validarCpfMod11(limpo)) {
      return true; // CPF detectado!
    }
  }
  return false;
}

function coletarUrlsPdfs(): string[] {
  const urls = new Set<string>();
  const arquivosBase = [
    path.join(RAIZ, "apps", "web", "data", "editais-consolidado.json"),
    path.join(RAIZ, "apps", "web", "data", "biblioteca-desastres-unificada.json"),
    path.join(RAIZ, "apps", "web", "data", "gestao", "planos-governo-eleitos.json"),
  ];

  for (const arq of arquivosBase) {
    if (!fs.existsSync(arq)) continue;
    try {
      const conteudo = fs.readFileSync(arq, "utf-8");
      const matches = conteudo.match(/https?:\/\/[^"\s\\]+\.pdf(?:\?[^"\s\\]*)?/gi) || [];
      for (const u of matches) {
        urls.add(u);
      }
    } catch {}
  }

  return Array.from(urls);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limiteArg = args.find((a) => a.startsWith("--limite"));
  const limite = limiteArg ? parseInt(limiteArg.split("=")[1] || args[args.indexOf(limiteArg) + 1], 10) : undefined;

  console.log("\n📦 Pipeline de Sincronização de Documentos para Cloudflare R2");
  console.log(`Modo: ${dryRun ? "🔍 --dry-run (apenas auditoria)" : "🚀 sincronização ativa"}`);

  const todasUrls = coletarUrlsPdfs();
  console.log(`• Total de links de PDFs catalogados nas bases: ${todasUrls.length}`);

  const alvos = limite ? todasUrls.slice(0, limite) : todasUrls;
  if (limite) console.log(`• Limite aplicado: processando os primeiros ${alvos.length} documentos`);

  let mapaExistente: Record<string, any> = {};
  if (fs.existsSync(MAPA_R2)) {
    try {
      mapaExistente = JSON.parse(fs.readFileSync(MAPA_R2, "utf-8"));
    } catch {}
  }

  let credenciaisR2Ok = Boolean(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
  let s3Client: any = null;

  if (credenciaisR2Ok && !dryRun) {
    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      s3Client = new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID!,
          secretAccessKey: R2_SECRET_ACCESS_KEY!,
        },
      });
      console.log("✅ Conexão com Cloudflare R2 configurada.");
    } catch (e) {
      console.log("⚠️ SDK do S3 não carregou. Upload marcado como pendente.");
      credenciaisR2Ok = false;
    }
  } else if (!credenciaisR2Ok && !dryRun) {
    console.log("ℹ️ Credenciais R2 ausentes em scripts/.env. O pipeline catalogará com status 'upload-pendente'.");
  }

  for (let i = 0; i < alvos.length; i++) {
    const urlOriginal = alvos[i];
    console.log(`\n[${i + 1}/${alvos.length}] ${urlOriginal}`);

    if (mapaExistente[urlOriginal] && mapaExistente[urlOriginal].status === "enviado") {
      console.log(`  ✓ Já sincronizado: ${mapaExistente[urlOriginal].urlR2}`);
      continue;
    }

    const hashChave = crypto.createHash("sha256").update(urlOriginal).digest("hex").slice(0, 16);
    const chaveR2 = `docs/${hashChave}.pdf`;
    const urlR2 = `${R2_PUBLIC_DOMAIN}/${chaveR2}`;

    if (dryRun) {
      console.log(`  -> Destino no bucket: ${chaveR2}`);
      mapaExistente[urlOriginal] = {
        urlR2,
        chaveR2,
        status: "dry-run",
      };
      continue;
    }

    // Download do arquivo para staging
    const caminhoLocal = path.join(STAGING_DIR, `${hashChave}.pdf`);
    fs.mkdirSync(STAGING_DIR, { recursive: true });

    try {
      console.log(`  • Baixando arquivo...`);
      const res = await fetch(urlOriginal, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) {
        console.log(`  ⚠️ Erro no download: HTTP ${res.status}`);
        mapaExistente[urlOriginal] = { status: "download-falhou", httpStatus: res.status };
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(caminhoLocal, buffer);

      // Verificação fail-closed por texto e mod-11
      const textoSimples = buffer.toString("latin1");
      if (varrerCpfTexto(textoSimples)) {
        console.log(`  ⛔ Rejeitado: CPF de pessoa física detectado no documento.`);
        fs.unlinkSync(caminhoLocal);
        mapaExistente[urlOriginal] = { status: "rejeitado-por-cpf" };
        continue;
      }

      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

      // Upload para R2
      if (s3Client) {
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: chaveR2,
            Body: buffer,
            ContentType: "application/pdf",
          })
        );
        console.log(`  ✅ Enviado ao R2: ${urlR2}`);
        mapaExistente[urlOriginal] = {
          urlR2,
          chaveR2,
          sha256,
          tamanhoBytes: buffer.length,
          dataUpload: new Date().toISOString(),
          status: "enviado",
        };
      } else {
        console.log(`  💾 Salvo em staging. Upload para R2 pendente de credenciais.`);
        mapaExistente[urlOriginal] = {
          urlR2,
          chaveR2,
          sha256,
          tamanhoBytes: buffer.length,
          dataDownload: new Date().toISOString(),
          status: "upload-pendente",
        };
      }
    } catch (err: any) {
      console.log(`  ⚠️ Falha: ${err.message}`);
      mapaExistente[urlOriginal] = { status: "download-falhou", erro: err.message };
    }

    await pausar(PAUSA_MS);
  }

  fs.mkdirSync(path.dirname(MAPA_R2), { recursive: true });
  fs.writeFileSync(MAPA_R2, JSON.stringify(mapaExistente, null, 2) + "\n", "utf-8");
  console.log(`\n📄 Mapa de documentos R2 atualizado em: ${path.relative(RAIZ, MAPA_R2)}`);
  console.log("✅ Pipeline finalizado.");
}

main().catch(console.error);
