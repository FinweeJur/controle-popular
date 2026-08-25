/**
 * Remove blocos `export const NOME = [...];` (terminador em linha própria
 * `];` ou `] as const;`) de um arquivo TS gerado. Uso único de migração.
 *   npx tsx scripts/cortar-consts.mts <arquivo> <Nome1> <Nome2> ...
 */
import { readFileSync, writeFileSync } from "node:fs";

const [arquivo, ...nomes] = process.argv.slice(2);
let texto = readFileSync(arquivo, "utf8");

// do maior índice para o menor para não invalidar offsets
const marcas = nomes
  .map((n) => ({ n, i: texto.indexOf(`export const ${n}`) }))
  .sort((a, b) => b.i - a.i);

for (const { n, i: bruto } of marcas) {
  if (bruto === -1) throw new Error(`não achei ${n}`);
  const i = texto.lastIndexOf("\n", bruto) + 1;
  const re = /\r?\n\]( as const)?;\r?\n/g;
  re.lastIndex = i;
  const m = re.exec(texto);
  if (!m) throw new Error(`fecho ] não achado para ${n}`);
  console.log(`${n}: ${(m.index + m[0].length - i / 1).toFixed(0)} chars (${((m.index + m[0].length - i) / 1024).toFixed(1)} KB)`);
  texto = texto.slice(0, i) + texto.slice(m.index + m[0].length);
}

writeFileSync(arquivo, texto, "utf8");
console.log(`OK ${arquivo} -> ${(texto.length / 1024).toFixed(1)} KB`);
