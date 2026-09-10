#!/usr/bin/env node

/**
 * 🌱 Seed — Todas as 853 cidades de Minas Gerais
 * 
 * Gera arquivo JSON com todos os municípios mineiros a partir da API do IBGE.
 * Necessário para:
 * - Criar routes dinâmicas ([municipio])
 * - Cross-check de dados
 * - Seed do Neon Postgres
 * 
 * Fonte: https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios
 */

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..", "..", "..");
const OUTPUT = path.join(RAIZ, "apps", "web", "data", "municipios-mg.json");

const API_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios";

async function main() {
  console.log("🌱 Coletando 853 municípios de MG do IBGE...");

  const response = await fetch(API_URL, {
    headers: {
      "User-Agent": "Controle-Popular/1.0 (transparencia@cidadania.dev)"
    }
  });

  if (!response.ok) {
    throw new Error(`API IBGE retornou ${response.status}`);
  }

  const municipiosRaw = await response.json();
  
  // Transformar para formato compacto
  const municipios = municipiosRaw.map((m: any) => ({
    id: m.id,
    nome: m.nome,
    microrregiao: m.microrregiao?.nome || "",
    mesorregiao: m.microrregiao?.mesorregiao?.nome || "",
    regiao_imediata: m["regiao-imediata"]?.nome || "",
    regiao_intermediaria: m["regiao-imediata"]?.["regiao-intermediaria"]?.nome || ""
  }));

  writeFileSync(OUTPUT, JSON.stringify(municipios, null, 2), "utf-8");

  console.log(`✅ Salvo: ${OUTPUT}`);
  console.log(`📊 Total: ${municipios.length} municípios`);
  console.log(`📍 Exemplo: ${municipios[3106699 - 3100000]?.nome || municipios[0]?.nome} (codigo ${municipios.find((m:any) => m.id === 3106705)?.nome || 'N/A'}...)`);
  console.log(`\n🏛️ Fonte: API do IBGE (servicodados.ibge.gov.br)`);
  console.log(`📝 Usar: npx tsx scripts/etl/municipios/seed-municipios-mg.mts`);
}

main().catch((e) => {
  console.error("❌ Erro:", (e as Error).message);
  process.exit(1);
});