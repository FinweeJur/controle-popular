#!/usr/bin/env node
/**
 * validar-link-correcoes.mjs — valida a CAMADA de correções de links antes do
 * build (gancho no `prebuild` de apps/web/package.json).
 *
 * `apps/web/data/link-correcoes.json` nunca reescreve o dado versionado: é
 * camada lida no build, aplicada na renderização por
 * lib/linkmender/correcoes.ts (aplicarCorrecoesEmDado / urlCorrigida).
 * JSON malformado aqui ABORTA o build — melhor o build parar do que uma
 * correção torta virar página.
 *
 * Formato exigido (array):
 *   [{ "urlVelha": "https://...", "urlNova": "https://...", "criterios": ["..."], "data": "ISO-8601" }]
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVO = path.resolve(__dirname, "..", "data", "link-correcoes.json");

function falhar(motivo) {
  console.error(`⛔ [link-correcoes] ${ARQUIVO}: ${motivo}`);
  console.error("   A camada de correcoes de links esta malformada — build abortado.");
  console.error("   Corrija (ou reverta) o arquivo antes de buildar. Formato: array de");
  console.error('   { urlVelha, urlNova, criterios[], data } — ver lib/linkmender/correcoes.ts.');
  process.exit(1);
}

let bruto;
try {
  bruto = JSON.parse(readFileSync(ARQUIVO, "utf8"));
} catch (e) {
  falhar(`JSON ilegivel: ${e.message}`);
}

if (!Array.isArray(bruto)) {
  falhar(`esperado array na raiz, veio ${typeof bruto}`);
}

const problemas = [];
bruto.forEach((item, i) => {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    problemas.push(`item ${i}: nao e objeto`);
    return;
  }
  if (typeof item.urlVelha !== "string" || !item.urlVelha.startsWith("http")) {
    problemas.push(`item ${i}: urlVelha ausente ou nao http(s)`);
  }
  if (typeof item.urlNova !== "string" || !item.urlNova.startsWith("http")) {
    problemas.push(`item ${i}: urlNova ausente ou nao http(s)`);
  }
  if (
    !Array.isArray(item.criterios) ||
    item.criterios.length === 0 ||
    !item.criterios.every((c) => typeof c === "string")
  ) {
    problemas.push(`item ${i}: criterios deve ser array de strings nao vazio`);
  }
  if (typeof item.data !== "string" || Number.isNaN(Date.parse(item.data))) {
    problemas.push(`item ${i}: data ausente ou nao ISO`);
  }
});

if (problemas.length > 0) {
  falhar(problemas.join("; "));
}

const urlsVelhas = new Set(bruto.map((c) => c.urlVelha));
if (urlsVelhas.size !== bruto.length) {
  falhar("ha urlVelha repetida — uma correcao por URL velha (fica a ultima)");
}

console.log(`✓ [link-correcoes] camada valida: ${bruto.length} correcao(oes) sera(ao) aplicada(s) na geracao das paginas.`);
