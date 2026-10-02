/**
 * @file apps/web/lib/server-only/dados-renuncia-fiscal.ts
 * @description Loader SERVER-ONLY da renúncia fiscal (Receita/DGT).
 * Convenção do repo: leitura de JSON com `node:fs` fica em `lib/server-only/`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoRenunciaFiscal } from "@/lib/estado/renuncia-fiscal";

let CACHE: AcervoRenunciaFiscal | null = null;

const VAZIO: AcervoRenunciaFiscal = {
  fonte: "Receita Federal — Gastos Tributários (Bases Efetivas)",
  url_fonte:
    "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-bases-efetivas",
  url_arquivo: "",
  ano_base: 0,
  serie: "",
  atualizado_em: "",
  metodologia: "",
  total_renuncia: 0,
  total_arrecadacao: null,
  renuncia_sobre_arrecadacao: null,
  total_por_regiao: {},
  total_funcoes: 0,
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "estado", "renuncia-fiscal-2023.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/estado/renuncia-fiscal-2023.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega a renúncia fiscal (Gastos Tributários) com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterRenunciaFiscal(): AcervoRenunciaFiscal {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoRenunciaFiscal;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar a renúncia fiscal:", erro);
    return VAZIO;
  }
}
