/**
 * Pré-calcula os embeddings dos trechos do índice documental.
 *
 * Motivo (medido 01/11/2026): a busca documental era só lexical e o recall@3
 * ficou em 48,3% no gabarito de 30 perguntas. Vetorizar 8.057 trechos a cada
 * requisição seria inviável; aqui o vetor é calculado uma vez e gravado.
 *
 * Formato: `{ modelo, dim, trechos: { id: base64(int8) } }`. Quantizar em int8
 * reduz ~4x sem mudar o cosseno de forma relevante — mesma decisão de
 * `acervo-embeddings.json`.
 *
 * Uso (com o Ollama local de pé):
 *     cd apps/web
 *     $env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
 *     npx tsx scripts/gerar-embeddings-documentos.mts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { vetorizarLote } from "../lib/assistente/embeddings/ollama.js";

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "public", "data", "documentos-rag", "trechos.json");
const SAIDA = path.join(RAIZ, "data", "documentos-rag-embeddings.json");
const LOTE = 24;
const MODELO = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

interface Trecho {
  id: string;
  texto?: string;
}

function quantizar(vetor: number[]): string {
  const bytes = Buffer.alloc(vetor.length);
  for (let i = 0; i < vetor.length; i += 1) {
    const escala = Math.max(-127, Math.min(127, Math.round((vetor[i] ?? 0) * 127)));
    bytes[i] = escala + 128;
  }
  return bytes.toString("base64");
}

async function main(): Promise<void> {
  const bruto = JSON.parse(readFileSync(ENTRADA, "utf8")) as { trechos?: Trecho[] };
  const trechos = (bruto.trechos ?? []).filter((t) => (t.texto ?? "").trim().length > 20);
  console.log(`[embeddings-doc] trechos: ${trechos.length} | modelo: ${MODELO} | ${BASE_URL}`);

  const vetores: Record<string, string> = {};
  let dimensao = 0;
  for (let i = 0; i < trechos.length; i += LOTE) {
    const lote = trechos.slice(i, i + LOTE);
    const resultado = await vetorizarLote(
      lote.map((t) => t.texto as string),
      { modelo: MODELO, baseUrl: BASE_URL, timeoutMs: 180_000 },
    );
    resultado.forEach((vetor, j) => {
      dimensao = vetor.length;
      vetores[lote[j].id] = quantizar(vetor);
    });
    process.stdout.write(`\r[embeddings-doc] ${Math.min(i + LOTE, trechos.length)}/${trechos.length}`);
  }
  process.stdout.write("\n");

  mkdirSync(path.dirname(SAIDA), { recursive: true });
  const conteudo = JSON.stringify({ modelo: MODELO, dim: dimensao, trechos: vetores });
  writeFileSync(SAIDA, conteudo, "utf8");
  console.log(`[embeddings-doc] ${SAIDA} | ${(Buffer.byteLength(conteudo) / 1024 / 1024).toFixed(1)} MB | dim ${dimensao}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
