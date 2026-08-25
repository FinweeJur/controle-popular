/**
 * Despeja os exports de dados de um módulo TS gerado para um JSON em
 * etl/betim/dados/, para que o módulo passe a ler do disco (fora do bundle
 * do Worker) em vez de embutir o dado. Uso único de migração — não é parte
 * do pipeline.
 *
 *   npx tsx scripts/dumpar-modulo-dados.mts <modulo> <saida.json> <export1> <export2> ...
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const [modulo, saida, ...exports] = process.argv.slice(2);
if (!modulo || !saida || exports.length === 0) {
  console.error("uso: dumpar-modulo-dados.mts <modulo> <saida.json> <export...>");
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod = await import(modulo);
const dado: Record<string, unknown> = {};
for (const nome of exports) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valor = (mod as any)[nome];
  if (valor === undefined) {
    console.error(`export ${nome} não existe em ${modulo}`);
    process.exit(1);
  }
  dado[nome] = valor;
}

const destino = path.resolve(process.cwd(), "..", "..", "etl", "betim", "dados", saida);
writeFileSync(destino, JSON.stringify(dado));
console.log(`✓ ${destino} (${Object.keys(dado).join(", ")})`);
