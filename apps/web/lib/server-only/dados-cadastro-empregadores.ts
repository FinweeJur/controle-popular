/**
 * @file apps/web/lib/server-only/dados-cadastro-empregadores.ts
 * @description Loader SERVER-ONLY do Cadastro de Empregadores do MTE
 * (trabalho escravo contemporâneo). Convenção do repo: leitura de JSON com
 * `node:fs` fica em `lib/server-only/` — o cliente importa só tipos/rótulos.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AcervoCadastroEmpregadores } from "@/lib/trabalho/cadastro-empregadores";

let CACHE: AcervoCadastroEmpregadores | null = null;

const VAZIO: AcervoCadastroEmpregadores = {
  fonte: "Ministério do Trabalho e Emprego — Cadastro de Empregadores",
  url_fonte:
    "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/cadastro_de_empregadores.txt",
  url_pagina:
    "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo",
  atualizado_em: "",
  metodologia: "",
  total_registros: 0,
  total_empresas: 0,
  total_ufs: 0,
  trabalhadores_envolvidos_total: 0,
  empregadores_pessoa_fisica_omitidos: 0,
  registros: [],
};

/** Localiza o arquivo de dados (Next, Vitest ou raiz do monorepo). */
function resolverCaminho(): string {
  const relativo = path.join("data", "trabalho", "cadastro-empregadores-mte.json");
  const candidatos = [path.join(process.cwd(), relativo), path.join(process.cwd(), "apps", "web", relativo)];
  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/trabalho/cadastro-empregadores-mte.json"));
  } catch {
    // import.meta.url indisponível em alguns bundles — os candidatos anteriores bastam.
  }
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return candidatos[0];
}

/**
 * Carrega o Cadastro de Empregadores (pessoa jurídica) com cache em memória.
 *
 * @returns Acervo tipado; vazio (sem lançar) quando o arquivo não existe.
 */
export function obterCadastroEmpregadores(): AcervoCadastroEmpregadores {
  if (CACHE) return CACHE;
  try {
    const caminho = resolverCaminho();
    if (!fs.existsSync(caminho)) return VAZIO;
    CACHE = JSON.parse(fs.readFileSync(caminho, "utf-8")) as AcervoCadastroEmpregadores;
    return CACHE;
  } catch (erro) {
    console.error("Falha ao carregar o Cadastro de Empregadores:", erro);
    return VAZIO;
  }
}
