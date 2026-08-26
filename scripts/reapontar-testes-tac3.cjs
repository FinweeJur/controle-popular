// Reaponta tac-agregados.test.ts (ordem real dos imports, CRLF-tolerante).
const fs = require("fs");
const p = "apps/web/lib/ambiental/tac-agregados.test.ts";
let t = fs.readFileSync(p, "utf8");

t = t.replace(
  /import \{ COBERTURA_TAC_PROJETOS, TAC_POR_ANO, TAC_POR_PROJETO \} from "\.\/tac-projetos";/,
  'import { COBERTURA_TAC_PROJETOS } from "./tac-projetos-dados";\n' +
    'import { TAC_POR_ANO, TAC_POR_PROJETO } from "./tac-projetos-dados";'
);

t = t.replace(
  /import \{\r?\n  COBERTURA_TAC_ACORDOS,\r?\n  STATUS_ORDEM,\r?\n  TAC_ACORDOS_PROJETOS,\r?\n  TAC_ANO_ACORDOS,\r?\n  TAC_STATUS_POR_ORGAO,\r?\n  contratosParaCsv,\r?\n  type AcordoTacContrato,\r?\n\} from "\.\/tac-agregados";/,
  'import {\n  STATUS_ORDEM,\n  contratosParaCsv,\n  type AcordoTacContrato,\n} from "./tac-agregados";\n' +
    'import {\n  COBERTURA_TAC_ACORDOS,\n  TAC_ACORDOS_PROJETOS,\n  TAC_ANO_ACORDOS,\n  TAC_STATUS_POR_ORGAO,\n} from "./tac-projetos-dados";'
);

fs.writeFileSync(p, t, "utf8");
console.log("ok", p);
