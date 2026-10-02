/**
 * @file apps/web/lib/server-only/dados-sisdepen.ts
 * @description Loader SERVER-ONLY do SISDEPEN (população prisional por UF).
 * Convenção do repo: leitura de JSON com `node:fs` fica em `lib/server-only/`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoSisdepen } from "@/lib/judiciario/sisdepen";

let CACHE: AcervoSisdepen | null = null;

const VAZIO: AcervoSisdepen = {
  fonte: "SENAPPEN — SISDEPEN",
  url_fonte: "https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados",
  url_arquivo: "",
  ciclo: "",
  referencia: "",
  atualizado_em: "",
  metodologia: "",
  total_estabelecimentos: 0,
  brasil: {
    uf: "BR",
    estabelecimentos: 0,
    populacao: 0,
    capacidade: 0,
    taxa_ocupacao: null,
    provisorios: 0,
    provisorios_pct: null,
    fechado: 0,
    semiaberto: 0,
    aberto: 0,
    faixa_18_24: 0,
    pretos_pardos: 0,
    pretos_pardos_pct: null,
  },
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "judiciario", "sisdepen-2025-2.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/judiciario/sisdepen-2025-2.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega o SISDEPEN (população prisional por UF) com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterSisdepen(): AcervoSisdepen {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoSisdepen;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar o SISDEPEN:", erro);
    return VAZIO;
  }
}
