// Gêmea TS do SINTETICOS ganha o agregado do SIAFI; comentário do python ajustado.
const fs = require("fs");

let p = "lib/sem-cpf-no-repo.test.ts";
let t = fs.readFileSync(p, "utf8");
const alvo = '  "12345678909", "123.456.789-09",';
if (!t.includes(alvo)) throw new Error("âncora TS não achada");
t = t.replace(
  alvo,
  alvo +
    "\n  // 47018614139: agregado financeiro do SIAFI (R$ bi) capturado como inteiro\n" +
    "  // pelo grep — mod-11 passa por coincidência, mas é dinheiro, não CPF.\n" +
    '  "47018614139",'
);
fs.writeFileSync(p, t, "utf8");
console.log("ok teste");

p = "../../scripts/checar-dado-pessoal.py";
t = fs.readFileSync(p, "utf8");
t = t.replace(
  "# falso positivo: vetor de teste da propria guarda (sem-cpf-no-repo.test.ts) e ja publico em origin/main via ckan-mg-siafi.ts",
  "# falso positivo: agregado financeiro do SIAFI (R$ bi) capturado como inteiro pelo grep — dinheiro, nao CPF"
);
fs.writeFileSync(p, t, "utf8");
console.log("ok py");
