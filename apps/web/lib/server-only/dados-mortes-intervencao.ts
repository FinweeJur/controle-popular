/**
 * @file apps/web/lib/server-only/dados-mortes-intervencao.ts
 * @description Loader SERVER-ONLY das mortes por intervenção de agente do
 * Estado (Sinesp VDE 2025). Convenção: leitura com `node:fs` em `lib/server-only/`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoMortesIntervencao } from "@/lib/seguranca/mortes-intervencao-policial";

let CACHE: AcervoMortesIntervencao | null = null;

const VAZIO: AcervoMortesIntervencao = {
  fonte: "MJSP — Sinesp VDE",
  url_fonte:
    "https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/dados-nacionais-1",
  url_arquivo: "",
  ano: 0,
  atualizado_em: "",
  metodologia: "",
  brasil: { mdip: 0, feminino: 0, masculino: 0, nao_informado: 0, mvi: 0, participacao_pct: null },
  total_ufs: 0,
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "seguranca", "mortes-intervencao-policial-2025.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/seguranca/mortes-intervencao-policial-2025.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega as mortes por intervenção de agente do Estado com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterMortesIntervencao(): AcervoMortesIntervencao {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoMortesIntervencao;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar as mortes por intervenção:", erro);
    return VAZIO;
  }
}
