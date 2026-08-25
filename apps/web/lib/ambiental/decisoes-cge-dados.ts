/**
 * SERVER-ONLY: as 753 decisões de recurso de LAI da CGE-MG, lidas de
 * `public/data/decisoes-cge.json` (o mesmo asset que o cliente busca via
 * `fetch` em `TabelaDecisoes.tsx`). Separação motivada pelo teto de 3 MiB
 * gzip do Worker Free (erro 10027, 2026-08-24) — ver `decisoes-cge.ts`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DecisaoRecursoCgeMg } from "./decisoes-cge";

let cache: DecisaoRecursoCgeMg[] | null = null;

export function lerDecisoesCgeMg(): DecisaoRecursoCgeMg[] {
  if (cache) return cache;
  const caminho = path.resolve(process.cwd(), "public", "data", "decisoes-cge.json");
  try {
    const bruto = JSON.parse(readFileSync(caminho, "utf-8")) as {
      DECISOES_CGE_MG: DecisaoRecursoCgeMg[];
    };
    cache = bruto.DECISOES_CGE_MG;
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `decisoes-cge-dados: não consegui ler ${caminho} — rode o build a partir de apps/web (${causa})`
    );
  }
  return cache;
}
