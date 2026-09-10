#!/usr/bin/env node
/**
 * 🌱 Seed — Municípios por Estado
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "..", "..", "apps", "web", "data");

const UFS: Record<string, { nome: string; sigla: string }> = {
  "11": { nome: "Rondônia", sigla: "RO" }, "12": { nome: "Acre", sigla: "AC" },
  "13": { nome: "Amazonas", sigla: "AM" }, "14": { nome: "Roraima", sigla: "RR" },
  "15": { nome: "Pará", sigla: "PA" }, "16": { nome: "Amapá", sigla: "AP" },
  "17": { nome: "Tocantins", sigla: "TO" }, "21": { nome: "Maranhão", sigla: "MA" },
  "22": { nome: "Piauí", sigla: "PI" }, "23": { nome: "Ceará", sigla: "CE" },
  "24": { nome: "Rio Grande do Norte", sigla: "RN" }, "25": { nome: "Paraíba", sigla: "PB" },
  "26": { nome: "Pernambuco", sigla: "PE" }, "27": { nome: "Alagoas", sigla: "AL" },
  "28": { nome: "Sergipe", sigla: "SE" }, "29": { nome: "Bahia", sigla: "BA" },
  "31": { nome: "Minas Gerais", sigla: "MG" }, "32": { nome: "Espírito Santo", sigla: "ES" },
  "33": { nome: "Rio de Janeiro", sigla: "RJ" }, "35": { nome: "São Paulo", sigla: "SP" },
  "41": { nome: "Paraná", sigla: "PR" }, "42": { nome: "Santa Catarina", sigla: "SC" },
  "43": { nome: "Rio Grande do Sul", sigla: "RS" }, "50": { nome: "Mato Grosso do Sul", sigla: "MS" },
  "51": { nome: "Mato Grosso", sigla: "MT" }, "52": { nome: "Goiás", sigla: "GO" },
  "53": { nome: "Distrito Federal", sigla: "DF" },
};

async function main() {
  const args = process.argv.slice(2);
  let uf = "", compactar = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--uf" && i + 1 < args.length) uf = args[++i];
    else if (args[i] === "--compactar") compactar = true;
    else if (args[i].startsWith("--uf=")) uf = args[i].split("=")[1];
  }
  const estado = UFS[uf];
  if (!uf || !estado) {
    console.error("❌ Uso: --uf=XX");
    console.error("   35=SP, 33=RJ, 32=ES, 29=BA, 31=MG, 43=RS, 53=DF");
    process.exit(1);
  }
  console.log(`🌱 Coletando ${estado.nome} (${estado.sigla})...`);
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, {
    headers: { "User-Agent": "Controle-Popular/1.0" }
  });
  if (!res.ok) throw new Error(`API retornou ${res.status}`);
  const raw = await res.json();
  const municipios = raw.map((m: any) => ({
    id: m.id, nome: m.nome, microrregiao: m.microrregiao?.nome || "",
    mesorregiao: m.microrregiao?.mesorregiao?.nome || "",
    regiao_imediata: m["regiao-imediata"]?.nome || "",
    regiao_intermediaria: m["regiao-imediata"]?.["regiao-intermediaria"]?.nome || ""
  }));
  const outPath = path.join(DATA_DIR, `municipios-${estado.sigla.toLowerCase()}.json`);
  writeFileSync(outPath, JSON.stringify(municipios, null, 2), "utf-8");
  console.log(`✅ ${municipios.length} municípios → ${outPath}`);
  if (compactar) {
    const compact = raw.map((m: any) => ({ id: m.id, nome: m.nome }));
    const compPath = outPath.replace(".json", ".compact.json");
    writeFileSync(compPath, JSON.stringify(compact), "utf-8");
    console.log(`📦 Compactado: ${(Buffer.byteLength(JSON.stringify(compact))/1024).toFixed(1)} KB`);
  }
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });