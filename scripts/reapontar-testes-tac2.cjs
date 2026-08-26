// Reaponta os testes de TAC (versão tolerante a CRLF e ordem real dos nomes).
const fs = require("fs");

function edit(p, fn) {
  let t = fs.readFileSync(p, "utf8");
  const antes = t;
  t = fn(t);
  if (t === antes) throw new Error("nenhuma mudança em " + p);
  fs.writeFileSync(p, t, "utf8");
  console.log("ok", p);
}

edit("apps/web/lib/ambiental/tac-projetos.test.ts", (t) =>
  t.replace(
    /import \{\r?\n  COBERTURA_TAC_PROJETOS,\r?\n  TAC_POR_ANO,\r?\n  TAC_POR_MINERADORA,\r?\n  TAC_POR_STATUS,\r?\n  TAC_PROJETOS,\r?\n\} from "\.\/tac-projetos";/,
    'import {\n  COBERTURA_TAC_PROJETOS,\n  TAC_POR_ANO,\n  TAC_POR_MINERADORA,\n  TAC_POR_STATUS,\n  TAC_PROJETOS,\n} from "./tac-projetos-dados";'
  )
);

edit("apps/web/lib/ambiental/tac-agregados.test.ts", (t) => {
  let saida = t;
  saida = saida.replace(
    /import \{\r?\n  TAC_POR_ANO,\r?\n  TAC_POR_PROJETO,\r?\n\} from "\.\/tac-projetos";/,
    'import { TAC_POR_ANO, TAC_POR_PROJETO } from "./tac-projetos-dados";'
  );
  return saida.replace(
    /import \{\r?\n  COBERTURA_TAC_ACORDOS,\r?\n  STATUS_ORDEM,\r?\n  TAC_ACORDOS_PROJETOS,\r?\n  TAC_ANO_ACORDOS,\r?\n  TAC_STATUS_POR_ORGAO,\r?\n\} from "\.\/tac-agregados";/,
    'import { STATUS_ORDEM } from "./tac-agregados";\n' +
      'import {\n  COBERTURA_TAC_ACORDOS,\n  TAC_ACORDOS_PROJETOS,\n  TAC_ANO_ACORDOS,\n  TAC_STATUS_POR_ORGAO,\n} from "./tac-projetos-dados";'
  );
});
