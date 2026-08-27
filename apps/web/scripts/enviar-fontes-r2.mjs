#!/usr/bin/env node
/**
 * enviar-fontes-r2.mjs — sobe para o R2 as cópias locais capturadas por
 * `arquivar-fontes.mjs` e atualiza `arquivo_fontes` para modo 'r2'.
 *
 * Uso:
 *   node scripts/enviar-fontes-r2.mjs              # envia tudo nao enviado
 *   node scripts/enviar-fontes-r2.mjs --limite 10  # piloto
 *
 * Variaveis em .env.local:
 *   R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID=...
 *   R2_SECRET_ACCESS_KEY=...
 *   R2_BUCKET_NAME=controlepopular-fontes
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_WEB = path.resolve(__dirname, "..");
const DIR_ARQUIVO_LOCAL = path.join(RAIZ_WEB, ".arquivo-local");

function env(nome) {
  const val = process.env[nome];
  if (!val) return undefined;
  return val;
}

function envLocal(nome) {
  try {
    const texto = readFileSync(path.join(RAIZ_WEB, ".env.local"), "utf8");
    const linha = texto.split("\n").find((l) => l.startsWith(`${nome}=`));
    return linha ? linha.slice(nome.length + 1).trim() : undefined;
  } catch {
    return undefined;
  }
}

const R2_ENDPOINT = env("R2_ENDPOINT") ?? envLocal("R2_ENDPOINT");
const R2_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID") ?? envLocal("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY") ?? envLocal("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = (env("R2_BUCKET_NAME") ?? envLocal("R2_BUCKET_NAME")) || "controlepopular-fontes";
const DATABASE_URL = env("DATABASE_URL") ?? envLocal("DATABASE_URL");

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Faltam credenciais R2. Crie um token em:");
  console.error("  Dashboard > R2 > Manage R2 API Tokens > Create API Token");
  console.error("e adicione R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY em apps/web/.env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const args = process.argv.slice(2);
const limiteArg = args.find((a) => a.startsWith("--limite"));
const limite = limiteArg ? Number(limiteArg.split("=")[1] ?? args[args.indexOf(limiteArg) + 1]) : undefined;

async function existeNoR2(chave) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: chave }));
    return true;
  } catch (e) {
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

async function main() {
  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();

  const { rows } = await c.query(
    `SELECT id, url_original, sha256, caminho_armazenamento, content_type
       FROM arquivo_fontes
      WHERE modo_armazenamento = 'local'
        AND aprovado_para_publicacao = true
        AND caminho_armazenamento NOT LIKE '(captura falhou%'
      ORDER BY capturado_em
      ${Number.isFinite(limite) ? `LIMIT ${Math.max(1, Math.floor(limite))}` : ""}`
  );

  console.log(`Enviando ${rows.length} arquivo(s) para r2://${R2_BUCKET_NAME} ...`);
  let ok = 0;
  let pulados = 0;
  let falhas = 0;

  for (const [i, r] of rows.entries()) {
    const localPath = path.resolve(RAIZ_WEB, r.caminho_armazenamento);
    const ext = path.extname(localPath).replace(/^\./, "") || "bin";
    const chave = `${r.sha256.slice(0, 2)}/${r.sha256}.${ext}`;
    process.stdout.write(`  [${i + 1}/${rows.length}] ${chave} ... `);

    try {
      const body = readFileSync(localPath);
      const jaExiste = await existeNoR2(chave);
      if (jaExiste) {
        console.log("ja existe no R2");
        pulados++;
      } else {
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: chave,
            Body: body,
            ContentType: r.content_type || "application/octet-stream",
            Metadata: { url_original: r.url_original },
          })
        );
        console.log(`enviado (${(body.length / 1024).toFixed(1)} KiB)`);
        ok++;
      }

      await c.query(
        `UPDATE arquivo_fontes
            SET modo_armazenamento = 'r2',
                caminho_armazenamento = $2
          WHERE id = $1`,
        [r.id, chave]
      );
    } catch (e) {
      falhas++;
      console.log(`FALHOU: ${e.message}`);
    }
  }

  await c.end();
  console.log(`\n=== resumo ===`);
  console.log(`  enviados: ${ok}`);
  console.log(`  ja existiam: ${pulados}`);
  console.log(`  falhas: ${falhas}`);
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
