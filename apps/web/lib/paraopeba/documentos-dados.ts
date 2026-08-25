/**
 * SERVER-ONLY: os 471 documentos do processo judicial da reparação de
 * Brumadinho que citam municípios da Bacia do Paraopeba, lidos de
 * `public/data/documentos-paraopeba.json` — o mesmo asset que o cliente busca
 * via `fetch` em `DocumentosClient.tsx`.
 *
 * A separação existe por causa do teto de 3 MiB gzip do Worker Free
 * (erro 10027, 2026-08-25): o array de ~500 KiB estava embutido no bundle do
 * servidor, e o tree-shaking não o removeu mesmo quando só o client o usava.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DocumentoProcesso } from "./documentos";

let cache: DocumentoProcesso[] | null = null;

export function lerDocumentosProcesso(): DocumentoProcesso[] {
  if (cache) return cache;
  const caminho = path.resolve(process.cwd(), "public", "data", "documentos-paraopeba.json");
  try {
    cache = JSON.parse(readFileSync(caminho, "utf-8")) as DocumentoProcesso[];
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `documentos-dados: não consegui ler ${caminho} — rode o build a partir de apps/web ou regenere com scripts/dumpar-documentos-paraopeba.mts (${causa})`
    );
  }
  return cache;
}
