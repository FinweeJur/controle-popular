/**
 * @file apps/web/lib/server-only/dados-fornecedores-campanha.ts
 * @description Loader SERVER-ONLY dos fornecedores de campanha (TSE 2022/MG).
 * Convenção do repo: leitura de JSON com `node:fs` fica em `lib/server-only/`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoFornecedoresCampanha } from "@/lib/eleicoes/fornecedores-campanha";

let CACHE: AcervoFornecedoresCampanha | null = null;

const VAZIO: AcervoFornecedoresCampanha = {
  fonte: "TSE — Prestação de Contas Eleitorais 2022 (dados abertos)",
  url_fonte:
    "https://dadosabertos.tse.jus.br/dataset/dadosabertos-tse-jus-br-dataset-prestacao-de-contas-eleitorais-2022",
  url_arquivo:
    "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip",
  escopo: "",
  atualizado_em: "",
  valor_minimo: 0,
  metodologia: "",
  linhas_lidas: 0,
  total_geral_contratado: 0,
  total_fornecedores_pj: 0,
  total_fornecedores_publicados: 0,
  fornecedores_abaixo_do_minimo: 0,
  despesas_pessoa_fisica_ignoradas: 0,
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "eleicoes", "fornecedores-campanha-2022-mg.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/eleicoes/fornecedores-campanha-2022-mg.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega os fornecedores de campanha (TSE 2022/MG) com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterFornecedoresCampanha(): AcervoFornecedoresCampanha {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoFornecedoresCampanha;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar os fornecedores de campanha:", erro);
    return VAZIO;
  }
}
