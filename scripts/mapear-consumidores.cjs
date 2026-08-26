// Mapeia consumidores dos três alvos restantes (client vs server).
const fs = require("fs");
const path = require("path");

const alvos = ["tac-projetos", "tac-agregados", "defensoria-mg"];
function walk(d, acc = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(f)) acc.push(p);
  }
  return acc;
}

for (const f of [...walk("apps/web/app"), ...walk("apps/web/lib")]) {
  const base = path.basename(f).replace(/\.tsx?$/, "");
  if (alvos.includes(base)) continue;
  const t = fs.readFileSync(f, "utf8");
  for (const a of alvos) {
    if (
      t.includes(`/${a}"`) ||
      t.includes(`/${a}';`) ||
      t.includes(`"./${a}"`)
    ) {
      const cl = t.trimStart().startsWith('"use client"');
      console.log(`${cl ? "[CLIENT]" : "[server]"} ${f.replace(/\\/g, "/")} -> ${a}`);
    }
  }
}
