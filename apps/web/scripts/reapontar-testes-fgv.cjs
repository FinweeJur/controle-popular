// Reaponta os testes do execucao-fgv para o loader server-only.
const fs = require("fs");

function sub(p, re, novo) {
  let t = fs.readFileSync(p, "utf8");
  if (!re.test(t)) throw new Error("padrão não achado em " + p);
  t = t.replace(re, novo);
  fs.writeFileSync(p, t, "utf8");
  console.log("ok", p);
}

sub(
  "lib/paraopeba/execucao-fgv.test.ts",
  /import \{\r?\n  MUNICIPIOS_EXECUCAO_FGV,\r?\n  PROJETOS_EXECUCAO_FGV,\r?\n  PROJETOS_ESPECIAIS_FGV,\r?\n  STATUS_PROJETOS_FGV,\r?\n  REFERENCIA_EXECUCAO_FGV,\r?\n  TOTAL_EXECUCAO_FGV,\r?\n\} from "\.\/execucao-fgv";/,
  'import {\n  MUNICIPIOS_EXECUCAO_FGV,\n  PROJETOS_EXECUCAO_FGV,\n  PROJETOS_ESPECIAIS_FGV,\n  STATUS_PROJETOS_FGV,\n} from "./execucao-fgv-dados";\nimport { REFERENCIA_EXECUCAO_FGV, TOTAL_EXECUCAO_FGV } from "./execucao-fgv";'
);

sub(
  "lib/paraopeba/dados.test.ts",
  /import \{\r?\n  COBERTURA_EXECUCAO_FGV,\r?\n  MUNICIPIOS_EXECUCAO_FGV,\r?\n  STATUS_PROJETOS_FGV,\r?\n\} from "\.\/execucao-fgv";/,
  'import { COBERTURA_EXECUCAO_FGV } from "./execucao-fgv";\nimport { MUNICIPIOS_EXECUCAO_FGV, STATUS_PROJETOS_FGV } from "./execucao-fgv-dados";'
);
