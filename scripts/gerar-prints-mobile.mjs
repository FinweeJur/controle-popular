/**
 * Script de automação para captura de telas em viewport móvel (375x1200)
 * para auditoria visual de responsividade em celulares.
 *
 * Utiliza o Google Chrome nativo em modo headless para renderizar
 * fielmente a versão mobile de todas as páginas principais.
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3027";
const OUTPUT_DIR = resolve(process.cwd(), "docs", "prints-mobile");

const PAGINAS = [
  { name: "01-home", rota: "/" },
  { name: "02-indice", rota: "/indice" },
  { name: "03-central", rota: "/central" },
  { name: "04-direitos", rota: "/direitos-em-movimento" },
  { name: "05-terra", rota: "/terra-e-territorios" },
  { name: "06-estado", rota: "/estado-e-economia" },
  { name: "07-ambiental", rota: "/ambiental" },
  { name: "08-car", rota: "/ambiental/car" },
  { name: "09-capacidade", rota: "/ambiental/capacidade-institucional" },
  { name: "10-cidades", rota: "/cidades" },
  { name: "11-betim", rota: "/betim" },
  { name: "12-busca", rota: "/busca" },
  { name: "13-noticias", rota: "/noticias" },
  { name: "14-editais", rota: "/editais" },
  { name: "15-mapa3d", rota: "/funcaosocialterra/mapa" },
  { name: "16-laboratorio", rota: "/laboratorio" },
  { name: "17-empresas", rota: "/empresas" },
  { name: "18-assembleias", rota: "/assembleias" },
  { name: "19-assembleias-mg", rota: "/assembleias/mg" },
  { name: "20-congresso", rota: "/congresso" },
];

console.log(`📱 Iniciando auditoria móvel em ${PAGINAS.length} páginas...`);
console.log(`Dimensões: 375x1200px (padrão móvel moderno)\n`);

let sucessos = 0;
let falhas = 0;

for (const { name, rota } of PAGINAS) {
  const url = `${BASE_URL}${rota}`;
  const outPath = resolve(OUTPUT_DIR, `${name}.png`);

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=375,1200",
    `--screenshot=${outPath}`,
    url,
  ];

  const t0 = Date.now();
  const res = spawnSync(CHROME_PATH, args, { stdio: "ignore", timeout: 20000 });
  const dt = Date.now() - t0;

  if (res.status === 0 && existsSync(outPath)) {
    const sizeKb = Math.round(statSync(outPath).size / 1024);
    console.log(`✅ [${name}] ${rota} -> ${sizeKb} KB (${dt}ms)`);
    sucessos++;
  } else {
    console.error(`❌ [${name}] Falha ao capturar ${url}`);
    falhas++;
  }
}

console.log(`\n🎉 Auditoria concluída: ${sucessos} capturadas com sucesso, ${falhas} falhas.`);
