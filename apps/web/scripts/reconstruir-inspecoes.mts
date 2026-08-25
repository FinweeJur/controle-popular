// Reconstrói inspecoes-cnj.ts a partir do HEAD (pristine), removendo os seis
// blocos de dado grande (que hoje vivem em JSON/asset). Uso único da migração.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ALVO = "lib/judiciario/inspecoes-cnj.ts";
const NOMES = [
  "ORGAOS_INSPECIONADOS",
  "RELATORIOS_TJMG",
  "ACHADOS_TJMG",
  "PENDENCIAS_TJMG",
  "COBRANCAS_POR_INSPECAO",
];

let t: string = execSync(`git show HEAD:apps/web/${ALVO}`, { encoding: "utf8" });

// Remove cada `export const NOME = <literal>;`. Para os cinco, o
// inicializador termina numa linha sozinha com `];` ou `] as const;`
// (formato do gerador), então o corte é por âncora de linha — robusto
// mesmo com strings contendo colchetes/parênteses.
for (const nome of [...NOMES].sort((a, b) => {
  const ia = t.indexOf(`export const ${a}`);
  const ib = t.indexOf(`export const ${b}`);
  return ib - ia;
})) {
  const marca = `export const ${nome}`;
  let i = t.indexOf(marca);
  if (i === -1) throw new Error(`não achei ${nome}`);
  i = t.lastIndexOf("\n", i) + 1;

  const fimRe = /\n\]( as const)?;\r?\n/g;
  fimRe.lastIndex = i;
  const m = fimRe.exec(t);
  if (!m) throw new Error(`fecho ] não achado para ${nome}`);
  const j = m.index + m[0].length;
  console.log(`${nome}: ${((j - i) / 1024).toFixed(0)} KB removidos`);
  t = t.slice(0, i) + t.slice(j);
}

t += `
/**
 * Os acervos grandes desta frente saíram daqui em 2026-08-25 pelo teto de
 * 3 MiB gzip do Worker Free (erro 10027):
 * - ORGAOS_INSPECIONADOS, RELATORIOS_TJMG, PENDENCIAS_TJMG e
 *   COBRANCAS_POR_INSPECAO -> etl/betim/dados/inspecoes-cnj-bundle.json,
 *   lidos em build via inspecoes-cnj-dados.ts (server-only);
 * - ACHADOS_TJMG -> public/data/achados-tjmg.json, buscado pelo cliente via
 *   fetch em TabelaAchados.tsx (useAchadosTjmg).
 */
`;

writeFileSync(ALVO, t, "utf8");
console.log(`OK ${ALVO} -> ${(t.length / 1024).toFixed(1)} KB`);
