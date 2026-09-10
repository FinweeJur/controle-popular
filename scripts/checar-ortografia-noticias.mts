#!/usr/bin/env node
/**
 * scripts/checar-ortografia-noticias.mts — porta de ortografia dos posts do
 * blog antes de publicar.
 *
 * Uso: npx tsx scripts/checar-ortografia-noticias.mts [--avisos]
 *
 * Exit code: 0 sem violações de acento (avisos são relatório);
 *            1 com violação de acento obrigatório — bloqueia o publicador.
 * Com --avisos, imprime também o relatório de frases longas.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checarTodos } from "../apps/web/lib/noticias/ortografia.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTAL_JSON = path.join(RAIZ, "apps", "web", "data", "noticias-portal.json");
const MOSTRAR_AVISOS = process.argv.includes("--avisos");

const posts = JSON.parse(fs.readFileSync(PORTAL_JSON, "utf-8"));
const { violacoes, avisos } = checarTodos(posts);

if (violacoes.length > 0) {
  console.error(`⛔ ${violacoes.length} violação(ões) de acento em noticias-portal.json:`);
  for (const v of violacoes) {
    console.error(`   ${v.slug} [${v.campo}]: "${v.palavra}" em "...${v.trecho.slice(-60)}"`);
  }
  process.exit(1);
}

console.log(`✅ ortografia: ${posts.length} posts sem violação de acento obrigatório.`);
if (MOSTRAR_AVISOS && avisos.length > 0) {
  console.log(`⚠️ ${avisos.length} aviso(s) de estilo (frases longas — regra das 13 palavras):`);
  for (const a of avisos) {
    console.log(`   ${a.slug} [${a.tipo}]: "${a.trecho.slice(0, 100)}"`);
  }
}
