// Reconstrói dados.test.ts a partir do HEAD + troca RESUMO_AJRI pelo loader.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ALVO = "lib/paraopeba/dados.test.ts";
let t: string = execSync(`git show HEAD:apps/web/${ALVO}`, { encoding: "utf8" });

t = t.replace("  RESUMO_AJRI,\r\n", "").replace("  RESUMO_AJRI,\n", "");
t = t.replace(
  '} from "./resumo-ajri";',
  '} from "./resumo-ajri";\nimport { lerResumosAjri } from "./resumo-ajri-dados";'
);
t = t
  .split("RESUMO_AJRI[")
  .join("lerResumosAjri()[")
  .split("Object.keys(RESUMO_AJRI)")
  .join("Object.keys(lerResumosAjri())")
  .split("Object.entries(RESUMO_AJRI)")
  .join("Object.entries(lerResumosAjri())")
  .split("Object.values(RESUMO_AJRI)")
  .join("Object.values(lerResumosAjri())");
t = t.replace(/(?<![a-zA-Z_.])RESUMO_AJRI\b/g, "lerResumosAjri()");

writeFileSync(ALVO, t, "utf8");
console.log("OK", t.length, "bytes");
