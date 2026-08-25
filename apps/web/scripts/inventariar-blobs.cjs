// Inventário dos maiores literais de string embutidos no handler.mjs.
const fs = require("fs");
const t = fs.readFileSync(
  ".open-next/server-functions/default/apps/web/handler.mjs",
  "utf8"
);
const re = /"((?:[^"\\]|\\.){40000,})"/g;
let m,
  n = 0;
while ((m = re.exec(t)) && n < 20) {
  const s = m[1];
  n++;
  console.log(`BLOB ${n}: ${(s.length / 1024).toFixed(0)} KB :: ${JSON.stringify(s.slice(0, 90))}`);
}
if (n === 0) console.log("nenhum literal >40KB");
