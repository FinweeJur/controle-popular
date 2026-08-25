/**
 * Remove declarações `export const NAME = [...]` (com colchetes balanceados)
 * de um arquivo TS gerado. Uso único de migração.
 *   npx tsx scripts/remover-consts.mts <arquivo> <Nome1> <Nome2> ...
 */
import { readFileSync, writeFileSync } from "node:fs";

const [arquivo, ...nomes] = process.argv.slice(2);
let texto = readFileSync(arquivo, "utf-8");

for (const nome of nomes) {
  const re = new RegExp(`^export const ${nome}\\b`, "m");
  const m = re.exec(texto);
  if (!m) {
    console.error(`não achei ${nome}`);
    process.exit(1);
  }
  let i = m.index;
  // volta para o começo da linha (para não deixar indentação órfã)
  i = texto.lastIndexOf("\n", i) + 1;

  // caminha contendo profundidade de [ ] { } ( ) ignorando strings
  let depth = 0;
  let iniciou = false;
  let j = i;
  let emString: string | null = null;
  while (j < texto.length) {
    const ch = texto[j];
    const prox = texto[j + 1];
    if (emString) {
      if (ch === "\\") j += 2;
      else if (ch === emString) emString = null;
      j++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      emString = ch;
      j++;
      continue;
    }
    if ("[{(".includes(ch)) {
      depth++;
      iniciou = true;
    } else if("]})".includes(ch)) {
      depth--;
      if (iniciou && depth === 0) {
        // fim do inicializador; consome até o ';' da declaração
        const fim = texto.indexOf(";", j);
        j = fim === -1 ? texto.length : fim + 1;
        break;
      }
    }
    j++;
  }

  const removido = texto.slice(i, j);
  console.log(`${nome}: ${removido.split("\n").length} linhas, ${removido.length} bytes`);
  texto = texto.slice(0, i) + texto.slice(j);
}

writeFileSync(arquivo, texto);
console.log(`OK ${arquivo} -> ${(texto.length / 1024).toFixed(0)} KB`);
