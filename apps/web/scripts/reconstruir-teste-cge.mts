// Reconstrói decisoes-cge.test.ts a partir do HEAD + troca para o loader.
// Uso único da migração do teto de 3 MiB do Worker.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let t: string = execSync("git show HEAD:apps/web/lib/ambiental/decisoes-cge.test.ts", {
  encoding: "utf8",
});

t = t.replace("  DECISOES_CGE_MG,\r\n", "").replace("  DECISOES_CGE_MG,\n", "");
t = t.replace(
  '} from "./decisoes-cge";',
  '} from "./decisoes-cge";\nimport { lerDecisoesCgeMg } from "./decisoes-cge-dados";'
);
t = t
  .split("DECISOES_CGE_MG.")
  .join("lerDecisoesCgeMg().")
  .split("Object.keys(DECISOES_CGE_MG)")
  .join("Object.keys(lerDecisoesCgeMg())")
  .split("Object.entries(DECISOES_CGE_MG)")
  .join("Object.entries(lerDecisoesCgeMg())")
  .split("Object.values(DECISOES_CGE_MG)")
  .join("Object.values(lerDecisoesCgeMg())")
  .split("JSON.stringify(DECISOES_CGE_MG)")
  .join("JSON.stringify(lerDecisoesCgeMg())");
t = t.replace(/(?<![a-zA-Z_.])DECISOES_CGE_MG\b/g, "lerDecisoesCgeMg()");

writeFileSync("lib/ambiental/decisoes-cge.test.ts", t, "utf8");
console.log("regravado", t.length, "bytes");
