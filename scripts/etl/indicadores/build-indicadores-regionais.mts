#!/usr/bin/env node
/**
 * 📊 Build — Indicadores Regionais Consolidados
 * 
 * Gera apps/web/data/indicadores-regionais.json combinando:
 * - municipios-brasil.json (5.570 cidades)
 * - conselhos-direitos.json (conselhos regionais)
 * - outorgas (resumo por UF)
 * - PNCP contratos (resumo por UF)
 * 
 * Saída: apps/web/data/indicadores-regionais.json
 * Usado pela página /indicadores (build-time)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "apps", "web");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT = path.join(DATA_DIR, "indicadores-regionais.json");

// Mapeamentos
const REGIOES = {
  Norte: ["AC", "AP", "AM", "PA", "RR", "RO", "TO"],
  Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  Sudeste: ["ES", "MG", "RJ", "SP"],
  Sul: ["PR", "RS", "SC"],
  Centro_Oeste: ["DF", "GO", "MS", "MT"],
};

const NOME_UF = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

function carregarJSON(name: string) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf-8"));
  } catch {
    console.warn(`⚠️  ${name} não encontrado`);
    return [];
  }
}

function main() {
  const municipios = carregarJSON("municipios-brasil.json");
  const conselhos = carregarJSON("conselhos-direitos.json");
  const pncp = carregarJSON("pncp-mg.json"); // fallback para MG; outros empty

  // 1. Agrupar cidades por UF
  const porUF: Record<string, { total: number; municipios: string[] }> = {};
  for (const m of municipios) {
    const uf = m.uf || m.microrregiao?.substring(0, 2)?.toUpperCase();
    if (!uf) continue;
    if (!porUF[uf]) porUF[uf] = { total: 0, municipios: [] };
    porUF[uf].total++;
    porUF[uf].municipios.push(m.nome);
  }

  // 2. Agrupar conselhos por UF (heurística: nome contém sigla)
  const conselhosPorUF: Record<string, number> = {};
  for (const c of conselhos) {
    const nome = JSON.stringify(c).toUpperCase();
    for (const uf of Object.keys(porUF)) {
      if (nome.includes(uf) || nome.includes(uf.replace("DF", "DISTRITO FEDERAL"))) {
        conselhosPorUF[uf] = (conselhosPorUF[uf] || 0) + 1;
      }
    }
  }

  // 3. Agrupar contratos PNCP por UF (campo uasgabido contém UF ou municipio)
  const pncpPorUF: Record<string, number> = {};
  for (const c of pncp) {
    const str = JSON.stringify(c).toUpperCase();
    for (const uf of Object.keys(porUF)) {
      if (str.includes(`"uf":"${uf}"`) || str.includes(`uf_municipio:"${uf}`)) {
        pncpPorUF[uf] = (pncpPorUF[uf] || 0) + 1;
      }
    }
  }

  // 4. Montar estrutura final
  const resultado = {
    gerado_em: new Date().toISOString(),
    fonte: "IBGE API + PNCP + Conselhos Direitos",
    total_municipios_brasil: municipios.length,
    regioes: {} as Record<string, {
      ufs: string[];
      total_municipios: number;
      total_conselhos: number;
      total_contratos: number;
    }>,
    por_uf: {} as Record<string, {
      nome: string;
      nome_completo: string;
      total_municipios: number;
      total_conselhos: number;
      total_contratos: number;
    }>,
  };

  for (const [regiao, ufs] of Object.entries(REGIOES)) {
    let municipiosR = 0, conselhosR = 0, contratosR = 0;
    for (const uf of ufs) {
      municipiosR += porUF[uf]?.total ?? 0;
      conselhosR += conselhosPorUF[uf] ?? 0;
      contratosR += pncpPorUF[uf] ?? 0;
      resultado.por_uf[uf] = {
        nome: uf,
        nome_completo: NOME_UF[uf as keyof typeof NOME_UF] ?? uf,
        total_municipios: porUF[uf]?.total ?? 0,
        total_conselhos: conselhosPorUF[uf] ?? 0,
        total_contratos: pncpPorUF[uf] ?? 0,
      };
    }
    resultado.regioes[regiao] = { ufs, total_municipios: municipiosR, total_conselhos: conselhosR, total_contratos: contratosR };
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(resultado, null, 2), "utf-8");
  const stats = fs.statSync(OUTPUT);
  console.log(`✅ Indicadores regional gerado (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`📊 ${municipios.length} municípios, ${Object.keys(resultado.por_uf).length} UFs`);
  console.log(`📦 Salvo: ${OUTPUT}`);
}

// Gerar SVG inline de evolução por região (sem biblioteca externa)
function gerarSVGRegioes(resultado: any): string {
  const regioes = Object.entries(resultado.regioes);
  const maxMun = Math.max(...regioes.map(([, r]: any) => r.total_municipios));
  const barWidth = 60;
  const barHeight = 12;
  const gap = 8;
  const height = regioes.length * (barHeight + gap) + 20;
  const width = 320;

  let bars = "";
  let y = 10;
  for (const [nome, r] of regioes) {
    const w = (r.total_municipios / maxMun) * (width - 100);
    bars += `<rect x="100" y="${y}" width="${w.toFixed(1)}" height="${barHeight}" fill="#3b82f6" rx="2"/>`;
    bars += `<text x="8" y="${y + barHeight/2 + 5}" font-size="11" fill="#64748b">${nome.substring(0, 8)}</text>`;
    bars += `<text x="${105 + w}" y="${y + barHeight/2 + 5}" font-size="11" fill="#94a3b8">${r.total_municipios}</text>`;
    y += barHeight + gap;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
    <rect width="${width}" height="${height}" fill="transparent"/>
    <text x="8" y="8" font-size="12" font-weight="bold" fill="#f1f5f9">Cidades por Região</text>
    ${bars}
  </svg>`;
}

main();
