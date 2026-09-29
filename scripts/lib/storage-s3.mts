/**
 * @file scripts/lib/storage-s3.mts
 * @description Cliente leve e agnóstico compatível com protocolo S3 (AWS SigV4).
 *
 * Papel no portal:
 * Permite fazer upload e arquivamento de cópias de segurança (dumps brutos e compactados)
 * para provedores S3 sem inflar o projeto com SDKs pesados:
 * 1. Cloudflare R2 (recomendado: custo zero de transferência de saída / egress).
 * 2. Provedores nacionais brasileiros (Magalu Cloud Object Storage, UOL Host).
 * 3. Provedores internacionais / multi-cloud (Aliyun OSS, MinIO local).
 *
 * Decisões técnicas e restrições:
 * - Implementa AWS Signature Version 4 nativamente com `node:crypto`.
 * - Lê credenciais de variáveis de ambiente sem expor segredos (`AGENTS.md` §5.8).
 * - Quando as credenciais não estiverem configuradas, opera em modo simulado (dry-run).
 */

import crypto from "node:crypto";

export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface ResultadoUpload {
  sucesso: boolean;
  chave: string;
  urlPublicaOuChave: string;
  bytes: number;
  simulado?: boolean;
  erro?: string;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function carregarConfigS3(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET_NAME || "controle-popular-acervo";
  const region = process.env.S3_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint: endpoint.replace(/\/+$/, ""),
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

/**
 * Envia um arquivo/buffer para o bucket S3 compatível.
 */
export async function enviarArquivoS3(
  chave: string,
  buffer: Buffer,
  contentType: string = "application/json"
): Promise<ResultadoUpload> {
  const config = carregarConfigS3();

  // Modo dry-run se as credenciais de S3 não estiverem no ambiente local
  if (!config) {
    return {
      sucesso: true,
      chave,
      urlPublicaOuChave: `s3://local-simulado/${chave}`,
      bytes: buffer.length,
      simulado: true,
    };
  }

  try {
    const url = new URL(`${config.endpoint}/${config.bucket}/${chave.replace(/^\/+/, "")}`);
    const host = url.host;
    const path = url.pathname;

    const agora = new Date();
    const amzDate = agora.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);
    const payloadHash = sha256(buffer);

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest =
      `PUT\n` +
      `${path}\n` +
      `\n` +
      canonicalHeaders +
      `\n` +
      signedHeaders +
      `\n` +
      payloadHash;

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const stringToSign =
      `AWS4-HMAC-SHA256\n` +
      amzDate +
      `\n` +
      credentialScope +
      `\n` +
      sha256(canonicalRequest);

    const kDate = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, config.region);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const authHeader =
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      Host: host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authHeader,
    };

    const res = await fetch(url.toString(), {
      method: "PUT",
      headers,
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const textoErro = await res.text();
      return {
        sucesso: false,
        chave,
        urlPublicaOuChave: "",
        bytes: buffer.length,
        erro: `HTTP ${res.status}: ${textoErro.substring(0, 200)}`,
      };
    }

    return {
      sucesso: true,
      chave,
      urlPublicaOuChave: url.toString(),
      bytes: buffer.length,
    };
  } catch (err) {
    return {
      sucesso: false,
      chave,
      urlPublicaOuChave: "",
      bytes: buffer.length,
      erro: (err as Error).message,
    };
  }
}
