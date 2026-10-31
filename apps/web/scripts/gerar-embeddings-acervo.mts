/**
 * Pré-calcula os embeddings do acervo do RAG.
 *
 * Motivo (medido 31/10/2026): `indexarAcervo()` vetoriza o acervo inteiro na
 * primeira pergunta. Com 10 mil peças são 209 lotes de 48 — de 3 a 7 minutos
 * de espera por instância fria. Aqui o vetor é calculado uma vez, no build, e
 * gravado em `data/acervo-embeddings.json`.
 *
 * Formato: `{ modelo, dim, pecas: { id: base64(int8) } }`. Quantizar em int8
 * não muda o cosseno de forma relevante e reduz ~4x o arquivo. O cosseno é
 * invariante a escala, então não guardamos o fator: `(byte-128)/127` basta.
 *
 * O runtime só usa o arquivo quando o `modelo` bate com o embedder em uso
 * (nomic-embed-text local ou BAAI/bge-m3 remoto). Modelo diferente = ignora e
 * volta a vetorizar, para nunca comparar vetores de espaços diferentes.
 *
 * Uso:
 *     cd apps/web
 *     npx tsx scripts/gerar-embeddings-acervo.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { montarAcervo } from "../lib/assistente/acervo.js";
import { vetorizarLote } from "../lib/assistente/embeddings/ollama.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_DADOS = path.resolve(AQUI, "../data");
const SAIDA = path.join(DIR_DADOS, "acervo-embeddings.json");
const LOTE = 48;
const MODELO = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

function quantizar(vetor: number[]): string {
  const bytes = Buffer.alloc(vetor.length);
  for (let i = 0; i < vetor.length; i += 1) {
    const escala = Math.max(-127, Math.min(127, Math.round((vetor[i] ?? 0) * 127)));
    bytes[i] = escala + 128;
  }
  return bytes.toString("base64");
}

const fontes = montarAcervo();
console.log(`[embeddings] peças: ${fontes.length} | modelo: ${MODELO}`);

const pecas: Record<string, string> = {};
let dimensao = 0;
for (let i = 0; i < fontes.length; i += LOTE) {
  const lote = fontes.slice(i, i + LOTE);
  const vetores = await vetorizarLote(
    lote.map((f) => f.texto),
    { modelo: MODELO, timeoutMs: 180_000 },
  );
  vetores.forEach((vetor, j) => {
    dimensao = vetor.length;
    pecas[lote[j].id] = quantizar(vetor);
  });
  process.stdout.write(`\r[embeddings] ${Math.min(i + LOTE, fontes.length)}/${fontes.length}`);
}
process.stdout.write("\n");

mkdirSync(DIR_DADOS, { recursive: true });
writeFileSync(
  SAIDA,
  JSON.stringify({ modelo: MODELO, dim: dimensao, pecas }),
  "utf8",
);
const tamanho = Buffer.byteLength(JSON.stringify({ modelo: MODELO, dim: dimensao, pecas }));
console.log(`[embeddings] ${SAIDA} | ${(tamanho / 1024 / 1024).toFixed(1)} MB | dim ${dimensao}`);
