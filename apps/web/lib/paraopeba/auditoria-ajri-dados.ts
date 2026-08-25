/**
 * SERVER-ONLY: os 467 documentos da auditoria AJRI, lidos de
 * `public/data/auditoria-ajri.json` (asset estático — o mesmo arquivo que o
 * cliente busca via `fetch`). Separação do `auditoria-ajri.ts` pelo mesmo
 * motivo do teto de 3 MiB gzip do Worker (erro 10027 em 2026-08-25).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DocumentoAuditoriaAjri } from "./auditoria-ajri";

let cache: DocumentoAuditoriaAjri[] | null = null;

export function lerAuditoriaAjri(): DocumentoAuditoriaAjri[] {
  if (cache) return cache;
  const caminho = path.resolve(process.cwd(), "public", "data", "auditoria-ajri.json");
  try {
    cache = JSON.parse(readFileSync(caminho, "utf-8")) as DocumentoAuditoriaAjri[];
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `auditoria-ajri-dados: não consegui ler ${caminho} — rode o build a partir de apps/web ou regenere com scripts/dumpar-auditoria-ajri.mts (${causa})`
    );
  }
  return cache;
}
