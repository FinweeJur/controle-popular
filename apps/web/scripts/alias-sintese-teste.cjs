// Alias SINTESE_AJRI via loader em sintese-integrada.test.ts.
const fs = require("fs");
const p = "lib/paraopeba/sintese-integrada.test.ts";
let t = fs.readFileSync(p, "utf8");
const a = 'import { SINTESE_AJRI } from "./sintese-ajri";';
if (!t.includes(a)) throw new Error("import não achado");
t = t.replace(
  a,
  'import { lerSinteseAjri } from "./sintese-ajri-dados";\n\n/** Sinônimo — dado agora no loader server-only. */\nconst SINTESE_AJRI = lerSinteseAjri();'
);
fs.writeFileSync(p, t, "utf8");
console.log("ok", p);
