// Mede gzip nível 9 (nosso) e nível 1 (proxy da métrica Cloudflare).
const fs = require("fs");
const zlib = require("zlib");

function medir(arquivo) {
  const bruto = fs.readFileSync(arquivo);
  const g9 = zlib.gzipSync(bruto, { level: 9 }).length;
  const g1 = zlib.gzipSync(bruto, { level: 1 }).length;
  return { raw: bruto.length, g9, g1 };
}

const arquivos = [
  "apps/web/.open-next/server-functions/default/apps/web/handler.mjs",
  "apps/web/.open-next/server-functions/default/apps/web/index.mjs",
  "apps/web/.open-next/middleware/handler.mjs",
];

let t9 = 0, t1 = 0;
for (const a of arquivos) {
  if (!fs.existsSync(a)) { console.log("AUSENTE:", a); continue; }
  const m = medir(a);
  t9 += m.g9; t1 += m.g1;
  console.log(
    `${a.split("/").pop()} [${a.includes("middleware") ? "mw" : "srv"}]: raw ${(m.raw / 1048576).toFixed(2)} MB | gz9 ${(m.g9 / 1024).toFixed(0)} KB | gz1 ${(m.g1 / 1024).toFixed(0)} KB`
  );
}
console.log(`TOTAL gz9: ${(t9 / 1024).toFixed(0)} KB | TOTAL gz1: ${(t1 / 1024).toFixed(0)} KB | LIMITE: 3072 KB`);
console.log(t1 <= 3000 ? "✅ FOLGA pela métrica fraca" : "❌ acima do limite pela métrica fraca");
