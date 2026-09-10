#!/usr/bin/env node
/**
 * 📦 Build — Índice fatiado para municipios-sp
 * Genera manifesto + fatias na pasta public/municipios/sp/
 */
import { fatiar } from "@/lib/estatico/fatiar.js";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "apps/web/data");
const publicDir = path.resolve(process.cwd(), "apps/web/public/municipios/sp");

const dados = JSON.parse(fs.readFileSync(path.join(dataDir, "municipios-sp.json"), "utf-8"));

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

console.log(`✅ ${dados.length} municípios SP → ${indice.manifesto.fatias} fatias`);
console.log(`📦 Total: ${(fs.statSync(path.join(publicDir, "manifesto.json")).size / 1024).toFixed(1)} KB + fatias`);