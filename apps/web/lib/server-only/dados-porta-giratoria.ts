/**
 * @file apps/web/lib/server-only/dados-porta-giratoria.ts
 * @description Loader SERVER-ONLY do acervo da porta giratória (FRE/CVM).
 *
 * POR QUE ESTE ARQUIVO É SEPARADO (convenção do repo): leitura de JSON com
 * `node:fs` não pode entrar no bundle de cliente — o componente
 * `PainelPortaGiratoria.tsx` importa só os TIPOS e RÓTULOS de
 * `lib/empresas/porta-giratoria.ts`. Quem lê do disco é a página de servidor
 * (`/empresas/executivos/page.tsx`) e repassa o acervo como prop. Ver o
 * cabeçalho de `lib/server-only/dados-executivos.ts` (mesma armadilha medida
 * em 01/10/2026: `node:fs` no bundle de cliente derruba o build).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoPortaGiratoria } from "@/lib/empresas/porta-giratoria";

/** Cache em memória — o acervo é lido uma vez por processo. */
let CACHE: AcervoPortaGiratoria | null = null;

/** Acervo vazio — usado quando o arquivo não existe (lacuna é informação). */
const VAZIO: AcervoPortaGiratoria = {
  fonte: "CVM — Formulário de Referência (dados abertos)",
  url_fonte: "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FRE/DADOS/",
  anos_processados: [],
  atualizado_em: "",
  metodologia: "",
  total_registros: 0,
  total_pessoas: 0,
  total_empresas: 0,
  registros: [],
};

/** Localiza o arquivo de dados considerando variações de CWD (Next, Vitest, raiz). */
function resolverCaminho(): string {
  const relativo = path.join("data", "empresas", "porta-giratoria-cvm.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/empresas/porta-giratoria-cvm.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega o acervo da porta giratória (FRE/CVM) com cache em memória.
 *
 * @returns Acervo tipado; vazio (e nunca lançando) quando o arquivo não existe.
 */
export function obterPortaGiratoria(): AcervoPortaGiratoria {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoPortaGiratoria;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar o acervo da porta giratória:", erro);
    return VAZIO;
  }
}
