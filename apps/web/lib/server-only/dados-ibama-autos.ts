/**
 * @file apps/web/lib/server-only/dados-ibama-autos.ts
 * @description Loader SERVER-ONLY dos autos de infração do IBAMA por município.
 * Convenção do repo: leitura com `node:fs` fica em `lib/server-only/`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoIbamaAutos } from "@/lib/ambiental/ibama-autos";

let CACHE: AcervoIbamaAutos | null = null;

const VAZIO: AcervoIbamaAutos = {
  fonte: "IBAMA — Fiscalização - auto de infração",
  url_fonte: "https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao",
  url_arquivo: "",
  janela: "",
  atualizado_em: "",
  metodologia: "",
  total_autos: 0,
  total_valor: 0,
  autos_cancelados: 0,
  total_municipios: 0,
  por_uf: {},
  por_ano: {},
  por_bioma: {},
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "ambiental", "ibama-autos-municipio.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/ambiental/ibama-autos-municipio.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega os autos de infração do IBAMA por município, com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterIbamaAutos(): AcervoIbamaAutos {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoIbamaAutos;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar os autos do IBAMA:", erro);
    return VAZIO;
  }
}
