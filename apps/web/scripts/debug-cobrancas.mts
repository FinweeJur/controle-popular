import { execSync } from "node:child_process";
const t: string = execSync("git show HEAD:apps/web/lib/judiciario/inspecoes-cnj.ts", {
  encoding: "utf8",
});
const i = t.indexOf("export const COBRANCAS_POR_INSPECAO");
console.log(JSON.stringify(t.slice(i, i + 400)));
