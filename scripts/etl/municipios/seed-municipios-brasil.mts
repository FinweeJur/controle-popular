#!/usr/bin/env node
/**
 * 🌱 Seed — Todos os municípios do Brasil (26 estados + DF)
 * Executa seed-municipios-estado.mts para cada UF do IBGE.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Todos os códigos UF do IBGE (27 estados)
const TODOS_UFS = [
  "11","12","13","14","15","16","17", // Norte
  "21","22","23","24","25","26","27","28","29", // Nordeste
  "31","32","33","35", // Sudeste
  "41","42","43", // Sul
  "50","51","52","53"  // Centro-Oeste
];

async function main() {
  console.log("🌱 Baixando todos os 853 municípios de MG...");
  for (const uf of TODOS_UFS) {
    const script = path.join(__dirname, "seed-municipios-estado.mts");
    try {
      execSync(`npx tsx ${script} --uf=${uf} --compactar`, {
        stdio: "pipe",
        encoding: "utf-8",
        cwd: path.resolve(__dirname, "..", "..", "..")
      });
    } catch (e) {
      console.error(`❌ Erro no UF=${uf}`);
    }
  }
  console.log("✅ Todos os estados completos!");
}

main().catch(e => { console.error(e); process.exit(1); });