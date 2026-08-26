// Corta os 4 blocos derivados de pericia-ufmg.ts (âncoras medidas no arquivo).
const fs = require("fs");
const p = "apps/web/lib/paraopeba/pericia-ufmg.ts";
const linhas = fs.readFileSync(p, "utf8").split("\n");
const TERM = new Set(["];", ");", "} as const;"]);

function achaFim(ini1) {
  for (let i = ini1; i < linhas.length; i++) {
    if (TERM.has(linhas[i].trim())) return i + 1;
  }
  throw new Error("fim não achado após linha " + ini1);
}

const nomes = [
  "ACERVO_PERICIA",
  "ESTUDOS_PERICIA_COM_TEMA",
  "RESULTADOS_PERICIA",
  "RESUMO_DO_ACERVO",
];
const rangos = nomes
  .map((n) => {
    const idx = linhas.findIndex((l) => l.startsWith("export const " + n));
    if (idx < 0) return null;
    return { n, ini: idx + 1, fim: achaFim(idx + 1) };
  })
  .filter(Boolean)
  .sort((a, b) => b.ini - a.ini);

for (const r of rangos) {
  console.log(`${r.n}: ${r.ini}..${r.fim}`);
  linhas.splice(r.ini - 1, r.fim - r.ini + 1);
}

linhas.push(
  "",
  "/**",
  " * ACERVO_PERICIA/ESTUDOS_PERICIA_COM_TEMA/RESULTADOS_PERICIA/RESUMO_DO_ACERVO",
  " * saíram daqui em 2026-08-25 (teto de 3 MiB gzip do Worker, erro 10027):",
  " * o JSON bruto agora é lido em build por pericia-ufmg-dados.ts (server-only)",
  " * e servido como asset public/data/estudos-pericia.json para o cliente.",
  " */",
  ""
);
fs.writeFileSync(p, linhas.join("\n"), "utf8");
console.log("OK ->", (linhas.join("\n").length / 1024).toFixed(1), "KB");
