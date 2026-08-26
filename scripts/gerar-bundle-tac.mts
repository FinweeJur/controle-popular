// Gera os bundles finais de TAC (derivados de projetos+agregados) e
// grava em etl/betim/dados + public/data com o mesmo conteúdo.
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd().includes("apps")
  ? path.resolve(process.cwd(), "..", "..")
  : process.cwd();

const modProjetos = await import(
  "file:///" + path.join(raiz, "apps/web/lib/ambiental/tac-projetos.ts").replaceAll("\\", "/")
);
const modAgregados = await import(
  "file:///" + path.join(raiz, "apps/web/lib/ambiental/tac-agregados.ts").replaceAll("\\", "/")
);

const bundle = {
  TAC_PROJETOS: modProjetos.TAC_PROJETOS,
  TAC_POR_ANO: modProjetos.TAC_POR_ANO,
  TAC_POR_MINERADORA: modProjetos.TAC_POR_MINERADORA,
  TAC_POR_STATUS: modProjetos.TAC_POR_STATUS,
  TAC_POR_PROJETO: modProjetos.TAC_POR_PROJETO,
  COBERTURA_TAC_PROJETOS: modProjetos.COBERTURA_TAC_PROJETOS,
  TAC_ACORDOS_PROJETOS: modAgregados.TAC_ACORDOS_PROJETOS,
  TAC_STATUS_POR_ORGAO: modAgregados.TAC_STATUS_POR_ORGAO,
  TAC_ANO_ACORDOS: modAgregados.TAC_ANO_ACORDOS,
  COBERTURA_TAC_ACORDOS: modAgregados.COBERTURA_TAC_ACORDOS,
};

const destinoEtl = path.join(raiz, "etl/betim/dados/tac-projetos-bundle.json");
fs.writeFileSync(destinoEtl, JSON.stringify(bundle));
fs.mkdirSync(path.join(raiz, "apps/web/public/data"), { recursive: true });
fs.copyFileSync(destinoEtl, path.join(raiz, "apps/web/public/data/tac-projetos.json"));

console.log(
  "OK chaves:",
  Object.keys(bundle).join(", "),
  "| acordos:",
  bundle.TAC_ACORDOS_PROJETOS.length
);
