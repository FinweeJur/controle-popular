import fs from "node:fs";
import path from "node:path";
import { extrairLinhas, jsonParaCsv } from "./enviar-smtp";

/**
 * Datasets da API pública v1 que podem ser enviados por e-mail (etapa 2 do
 * Tier 2, PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Allowlist ESTRITA: só estes ids, só o arquivo JSON correspondente em
 * `public/api/v1/datasets/`. Nada de caminho arbitrário, nada de PDF do
 * acervo (envio desses segue manual).
 */
export const DATASETS_PERMITIDOS = [
  "biblioteca-ati",
  "comarcas-mg",
  "convenios-ambientais-mg",
  "decisoes-cge-mg",
  "documentos-paraopeba",
  "estabelecimentos-prisionais-mg",
  "globo-proveniencia",
  "municipios-mg-comunicabr",
  "repasse-brumadinho-mg",
  "resumo-auditoria-ajri",
  "risco-climatico-mg",
  "sirenejud-brasil",
  "sirenejud-mg",
  "tac-projetos",
] as const;

const DIR = path.join(process.cwd(), "public", "api", "v1", "datasets");

export interface DatasetCsv {
  csv: string;
  nome: string;
}

/** Carrega um dataset permitido e devolve CSV pronto para anexar (ou null). */
export function carregarDatasetCsv(id: string): DatasetCsv | null {
  if (!/^[a-z0-9-]+$/.test(id) || !(DATASETS_PERMITIDOS as readonly string[]).includes(id)) {
    return null;
  }
  let dados: unknown;
  try {
    dados = JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), "utf-8"));
  } catch {
    return null;
  }
  const linhas = extrairLinhas(dados);
  if (!linhas || linhas.length === 0) return null;
  return { csv: jsonParaCsv(linhas), nome: `${id}.csv` };
}
