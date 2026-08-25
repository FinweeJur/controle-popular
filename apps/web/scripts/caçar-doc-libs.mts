// Lista quem importa pdf-lib/docx e se o arquivo é client/server.
import fs from "node:fs";
import path from "node:path";

function walk(d: string, acc: string[] = []): string[] {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      if (!/node_modules|\.next|\.open-next|public/.test(p)) walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(f)) acc.push(p);
  }
  return acc;
}

for (const f of [...walk("app"), ...walk("lib")]) {
  const t = fs.readFileSync(f, "utf8");
  const libs = ["pdf-lib", "docx"].filter((lib) =>
    new RegExp(`from\\s+["']${lib}["']`).test(t)
  );
  if (libs.length === 0) continue;
  const client = t.startsWith('"use client"') || t.startsWith("'use client'");
  console.log(`${f} [client=${client}] -> ${libs.join(", ")}`);
}
