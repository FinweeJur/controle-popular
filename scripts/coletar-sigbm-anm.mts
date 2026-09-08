/**
 * Coletor TypeScript para barragens de mineração do SIGBM/ANM
 *
 * Invoca o pipeline padronizado em Python (`etl.apis.sigbm_anm`)
 * e valida a integridade do JSON gerado em `apps/web/data/barragens-sigbm.json`.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PYTHON = process.env.RADAR_PYTHON ?? "py";
const PYTHON_ARGS = process.env.RADAR_PYTHON ? [] : ["-3"];
const DESTINO = path.join(RAIZ, "apps", "web", "data", "barragens-sigbm.json");

function main() {
  console.log("Coletando cadastro nacional de barragens de mineração (SIGBM / ANM)...");

  const r = spawnSync(PYTHON, [...PYTHON_ARGS, "-m", "etl.apis.sigbm_anm"], {
    cwd: path.join(RAIZ, "etl", "betim"),
    stdio: "inherit",
    encoding: "utf-8",
  });

  if (r.status !== 0) {
    console.error(`Falha ao executar etl.apis.sigbm_anm (exit code ${r.status})`);
    process.exit(1);
  }

  if (!fs.existsSync(DESTINO)) {
    console.error(`Arquivo de saída não foi gerado: ${DESTINO}`);
    process.exit(1);
  }

  const dados = JSON.parse(fs.readFileSync(DESTINO, "utf-8"));
  console.log(
    `✓ SIGBM atualizado com sucesso: ${dados.total} barragens em MG (${dados.total_brasil} no Brasil) em ${dados.municipios} municípios.`
  );
}

main();
