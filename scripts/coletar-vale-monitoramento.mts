/**
 * Coletor Integrado de Monitoramento da Vale S.A.
 *
 * Invoca o coletor de cotações B3 e notícias da Vale, atualizando
 * `apps/web/data/vale3-cotacoes.json` e `apps/web/public/data/vale3-cotacoes.csv`.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  console.log("Coletando cotações e dados de monitoramento da Vale S.A. (B3/CVM)...");

  const r = spawnSync(
    "npx",
    ["tsx", "apps/web/scripts/coletar-vale3-cotacoes.mts"],
    {
      cwd: RAIZ,
      stdio: "inherit",
      shell: true,
      encoding: "utf-8",
    }
  );

  if (r.status !== 0) {
    console.error("Aviso: Coleta remota de cotações retornou código", r.status);
  }

  console.log("✓ Monitoramento da Vale S.A. verificado.");
}

main();
