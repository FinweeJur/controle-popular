#!/usr/bin/env node
/**
 * 📦 Build — Índice fatiado para municipios-<uf>
 * Gera manifesto + fatias na pasta public/municipios/<uf>/
 *
 * Uso: npx tsx scripts/etl/municipios/build-municipios-uf.mts <uf>
 * Exemplo: npx tsx scripts/etl/municipios/build-municipios-uf.mts rj
 */
import { fatiar } from "../../../apps/web/lib/estatico/fatiar.js";
import fs from "node:fs";
import path from "node:path";

const uf = process.argv[2]?.toLowerCase();

if (!uf || !/^[a-z]{2}$/.test(uf)) {
  console.error("❌ Informe a UF: node build-municipios-uf.mts <uf>");
  process.exit(1);
}

const dataDir = path.resolve(process.cwd(), "apps/web/data");
const publicDir = path.resolve(process.cwd(), "apps/web/public/municipios", uf);

const arquivo = path.join(dataDir, `municipios-${uf}.json`);
if (!fs.existsSync(arquivo)) {
  console.error(`❌ Não existe ${arquivo}`);
  process.exit(1);
}

const dados = JSON.parse(fs.readFileSync(arquivo, "utf-8"));

const indice = fatiar(dados, { orcamentoBytes: 500 * 1024 }); // 500KB por fatia

fs.mkdirSync(publicDir, { recursive: true });

const manifesto = {
  total: indice.manifesto.total,
  fatias: indice.manifesto.fatias,
  linhasPorFatia: indice.manifesto.linhasPorFatia,
  bytesPorFatia: indice.manifesto.bytesPorFatia,
  orcamentoBytes: indice.manifesto.orcamentoBytes,
  avisos: indice.manifesto.avisos,
};

fs.writeFileSync(path.join(publicDir, "manifesto.json"), JSON.stringify(manifesto));
indice.fatias.forEach((fatia, i) => {
  fs.writeFileSync(path.join(publicDir, `${i}.json`), JSON.stringify(fatia));
});

console.log(`✅ ${dados.length} municípios ${uf.toUpperCase()} → ${indice.manifesto.fatias} fatias`);
console.log(`📦 Total: ${(fs.statSync(path.join(publicDir, "manifesto.json")).size / 1024).toFixed(1)} KB + fatias`);
for (const aviso of indice.manifesto.avisos) console.warn(`⚠️ ${aviso}`);
