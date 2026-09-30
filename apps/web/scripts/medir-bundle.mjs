// Mede o tamanho do bundle do cliente já construído (`.next/static`).
//
// ═══ POR QUE EXISTE ═══
//
// A fase E0 do plano do ecossistema pede MEDIR o bundle antes de publicar. O
// teto de referência da Cloudflare é 3 MiB (gzip). Um `next build` deixa os
// arquivos do cliente em `.next/static`; este script soma o gzip de tudo e
// aponta os maiores, para a decisão ser por número, não por palpite.
//
// ⚠️ Isto mede o CLIENTE (`/static`). O Worker inteiro (servidor + assets) só
// se mede com `npm run cf:build`; rode este script depois do build, antes do
// deploy. Sem build, ele avisa e sai sem erro.
//
// Uso:
//   node apps/web/scripts/medir-bundle.mjs [caminho-da-pasta-static]
// Padrão: <cwd>/.next/static (rode de apps/web).

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const TETO_MIB = 3;
const DIR = path.resolve(process.argv[2] ?? path.join(process.cwd(), ".next", "static"));

if (!fs.existsSync(DIR)) {
  console.log(`Sem build em ${DIR} — rode "npm run build" antes de medir.`);
  process.exit(0);
}

/** Percorre o diretório e devolve todos os arquivos. */
function listarArquivos(dir) {
  const saida = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const cheio = path.join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...listarArquivos(cheio));
    else saida.push(cheio);
  }
  return saida;
}

let bruto = 0;
let gzip = 0;
const arquivos = [];
for (const arquivo of listarArquivos(DIR)) {
  const conteudo = fs.readFileSync(arquivo);
  const g = zlib.gzipSync(conteudo);
  bruto += conteudo.length;
  gzip += g.length;
  arquivos.push({ arquivo: path.relative(DIR, arquivo), bruto: conteudo.length, gzip: g.length });
}

const mib = (bytes) => (bytes / 1024 ** 2).toFixed(2);
const pct = ((gzip / (TETO_MIB * 1024 ** 2)) * 100).toFixed(1);

console.log(`Bundle do cliente em ${DIR}`);
console.log(`  bruto: ${mib(bruto)} MiB · gzip: ${mib(gzip)} MiB`);
console.log(`  teto de referência (${TETO_MIB} MiB gzip): ${pct}% usado`);

const maiores = [...arquivos].sort((a, b) => b.gzip - a.gzip).slice(0, 10);
console.log("  maiores (gzip):");
for (const a of maiores) {
  console.log(`   ${mib(a.gzip).padStart(7)} MiB  ${a.arquivo}`);
}

if (gzip > TETO_MIB * 1024 ** 2) {
  console.error(`\n⚠️ passou do teto de ${TETO_MIB} MiB gzip. Reduza antes do deploy.`);
  process.exit(1);
}
console.log("\n✅ dentro do teto de referência (cliente).");
