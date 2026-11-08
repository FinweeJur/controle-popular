#!/usr/bin/env node
/**
 * Coleta o acervo de mídia do CNDH no Brasil Participativo.
 *
 * FONTE OFICIAL: https://brasilparticipativo.presidencia.gov.br/assemblies/cndh/media
 * Plataforma Decidim do Governo Federal (Conselho Nacional dos Direitos
 * Humanos). O acervo reúne recomendações, notas públicas, resoluções,
 * relatórios, editais e termos do Conselho.
 *
 * ÉTICA DE COLETA (AGENTS.md §Pesquisa e COLETA-ETICA.md):
 * - UMA requisição HTTP por execução, com User-Agent honesto;
 * - `robots.txt` permite `/assemblies/` e proíbe só admin, busca e `.json`
 *   — esta coleta lê a página HTML pública;
 * - nenhum arquivo é baixado: só título e link oficial de cada item;
 * - sem autenticação, sem contorno de limite, sem dado pessoal.
 *
 * POR QUE NODE E NÃO PYTHON: o servidor encerra o handshake TLS do Python
 * (`SSLZeroReturnError`), mas aceita o fetch do Node. Ver ARMADILHAS.md.
 *
 * USO:
 *   node scripts/coletar-cndh-midia.mjs
 * Saída: apps/web/public/data/cndh-midia.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const URL_FONTE =
  "https://brasilparticipativo.presidencia.gov.br/assemblies/cndh/media";
const ORIGEM = "https://brasilparticipativo.presidencia.gov.br";
const UA = "finweejur/github artur colito";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "apps", "web", "public", "data", "cndh-midia.json");

/** Tipo pelo começo do título (mesma régua da leitura manual). */
function tipoDoTitulo(titulo) {
  const m = titulo.match(
    /^(Nota Pública|Nota Técnica|Recomendação|Resolução|Relatório|Edital|Anexo|Resultado|Informe|Aviso|Cartilha|Errata|Publicação|Lista|Ata|Quadro|Termo)/i,
  );
  if (!m) return "Outros";
  return m[1]
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

function limparTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function coletarItens(html) {
  const itens = [];
  const vistos = new Set();
  const marcas = [...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)];

  for (let i = 0; i < marcas.length; i++) {
    const titulo = limparTags(marcas[i][1]);
    if (!titulo) continue;
    const inicio = marcas[i].index + marcas[i][0].length;
    const fim = i + 1 < marcas.length ? marcas[i + 1].index : html.length;
    // O link do anexo mora perto do título; 6000 caracteres cobre o cartão.
    const trecho = html.slice(inicio, Math.min(fim, inicio + 6000));
    const link = trecho.match(/href="([^"]*active_storage[^"]*)"/i);
    if (!link) continue;
    const url = link[1].startsWith("http") ? link[1] : ORIGEM + link[1];
    const chave = `${titulo}|${url.slice(0, 120)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    itens.push({ titulo, tipo: tipoDoTitulo(titulo), url });
  }
  return itens;
}

async function main() {
  const resposta = await fetch(URL_FONTE, { headers: { "user-agent": UA } });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} em ${URL_FONTE}`);
  }
  const html = await resposta.text();
  const itens = coletarItens(html);
  const dados = {
    fonte: URL_FONTE,
    origem: ORIGEM,
    coletadoEm: new Date().toISOString().slice(0, 10),
    total: itens.length,
    itens,
  };
  mkdirSync(dirname(SAIDA), { recursive: true });
  writeFileSync(SAIDA, JSON.stringify(dados, null, 1), "utf8");
  console.log(`${itens.length} itens -> ${SAIDA}`);
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
