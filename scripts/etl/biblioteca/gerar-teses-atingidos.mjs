#!/usr/bin/env node
/**
 * Gerador do acervo `apps/web/data/biblioteca-teses-atingidos.json`.
 *
 * O que faz: lê o CSV do levantamento "Teses sobre Atingidos por Barragens"
 * (colunas BibELO/Portal Teses), deduplica por título normalizado, aplica as
 * regras de destino definidas pelo dono e grava o JSON versionado lido no
 * build por `apps/web/lib/biblioteca/teses.ts` e pelas páginas da biblioteca.
 *
 * REGRA DO DONO (14/10/2026):
 * - Caso Mariana/Fundão (tioDoce) → destino `riodoce` (página própria);
 * - Caso Brumadinho/B1/Paraopeba → destino `brumadinho` (página própria);
 * - Vale do Jequitinhonha (Irapé, Setúbal, Itapebi) → destino
 *   `jequitinhonha` (página própria);
 * - Tudo o que não é um caso específico fica NA BIBLIOTECA UNIFICADA
 *   (`/ambiental/crimes-socioambientais/teses`) — nada é excluído;
 * - Cada item cujo título ou resumo citar "MAB" ganha a TAG `MAB`.
 *
 * Uso:
 *   node scripts/etl/biblioteca/gerar-teses-atingidos.mjs --csv="<arquivo>"
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/* ─── argumentos ─────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const argsMap = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const i = a.indexOf("=");
      return i > 0 ? [a.slice(2, i), a.slice(i + 1)] : [a.slice(2), ""];
    }),
);
if (!argsMap.csv || !fs.existsSync(argsMap.csv)) {
  console.error("Uso: node gerar-teses-atingidos.mjs --csv=<caminho-do-arquivo.csv>");
  process.exit(1);
}

/* ─── normalização e email ───────────────────────────────────────────────── */

/** Sem acento, minúsculo, espaços colapsados — para regras e dedup. */
function normalizar(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Deixa de fora endereço de e-mail de autor/a (dado de contato de repositório). */
function tiraEmail(texto) {
  return (texto || "").replace(/[\w.+-]+@[\w.-]+\.\w+/g, "").replace(/\s{2,}/g, " ").trim();
}

/* ─── parser CSV (RFC 4180: aspas, vírgula, quebra de linha dentro do campo) ── */

/**
 * Ducção de um passo do analisador CSV. Ações possíveis:
 * - { acao: "literal", ch } — acrescenta o caractere ao campo;
 * - { acao: "duplaAspa" }   — aspa dobrada dentro de aspas ("") virou uma;
 * - { acao: "fimCampo" }    — vírgula terminou o campo;
 * - { acao: "fimLinha" }    — fim de linha fechou o campo;
 * - { acao: "nada" }        — caractere ignorado (\r).
 *
 * A máquina fica fora do laço para o `parseCsv` continuar simples
 * (regra CodeScene de método pequeno — o hook de pre-commit mediu).
 */
function passoCsv(estado, ch, proximo) {
  if (estado === "dentro") {
    if (ch === '"' && proximo === '"') return { estado, acao: "duplaAspa" };
    if (ch === '"') return { estado: "fora", acao: "nada" };
    return { estado, acao: "literal", ch };
  }
  if (ch === '"') return { estado: "dentro", acao: "nada" };
  if (ch === ",") return { estado, acao: "fimCampo" };
  if (ch === "\r") return { estado, acao: "nada" };
  if (ch === "\n") return { estado, acao: "fimLinha" };
  return { estado, acao: "literal", ch };
}

/**
 * Contexto mutável do parser: campo em construção, linha em construção e
 * o acumulado. Manipulado por `executarPassoCsv` para o laço ficar enxuto.
 */
function criarContextoCsv() {
  return { campo: "", linha: [], linhas: [] };
}

/** Efeito do passo sobre o contexto. "duplaAspa" só pinta o campo: quem avança o laço é o próprio `parseCsv`. */
function executarPassoCsv(passo, con) {
  switch (passo.acao) {
    case "literal": con.campo += passo.ch; break;
    case "duplaAspa": con.campo += '"'; break;
    case "fimCampo": con.linha.push(con.campo); con.campo = ""; break;
    case "fimLinha": con.linha.push(con.campo); con.linhas.push(con.linha); con.linha = []; con.campo = ""; break;
  }
}

function parseCsv(textoBruto) {
  const con = criarContextoCsv();
  let estado = "fora";
  for (let i = 0; i < textoBruto.length; i++) {
    const passo = passoCsv(estado, textoBruto[i], textoBruto[i + 1]);
    estado = passo.estado;
    executarPassoCsv(passo, con);
    if (passo.acao === "duplaAspa") i++; // consumiu as duas aspas
  }
  // sobra sem quebra de linha no fim do arquivo: fecha o campo e a linha.
  if (con.campo !== "" || con.linha.length) {
    con.linha.push(con.campo);
    con.linhas.push(con.linha);
  }
  return con.linhas.filter((l) => l.length > 1 || (l[0] ?? "").trim() !== "");
}

/* ─── regras de destino (dono, 14/10/2026) ───────────────────────────────── */

// Jequitinhonha: barragens e atingidos dessa bacia vão para a PÁGINA PRÓPRIA.
/** Antes de testar, acentos ficam e caixa é ignorada — os campos chegam com acento. */
const REGRA_JEQ = /(jequitinhonha|irap[eé]|itapebi|barragem de set[uú]bal|salto da divisa)/i;
// Caso Rio Doce / Mariana / Fundão / Samarco — página `/riodoce`.
const REGRA_RODOCE = /(fund[aã]o|mariana|samarco|bhp|fundação renova|rio doce|barra longa|bento rodrigues|krenak|tumiritinga|gesteira|candonga|alto rio doce)/i;
// Caso Brumadinho / B1 / Paraopeba — página `/paraopeba`.
const REGRA_BRUM = /(brumadinho|c[oó]rrego do feij[aã]o|paraopeba|\bb1\b|feij[aã]o)/i;
// TAG MAB: título ou resumo menciona o Movimento dos Atingidos por Barragens.
const REGRA_MAB = /\bMAB\b/;

/**
 * Tabela de regras na ordem de prioridade: a PRIMEIRA que casa vence (dono,
 * 14/10/2026). Cada item recebe `destino` e `desastre` (nomenclatura da
 * biblioteca-unificada) determinados pelo título e pelo resumo — nada fica
 * sem casa e nada é excluído.
 */
const REGRAS_DESTINO = [
  {
    caso: "jequitinhonha",
    desastre: null,
    teste: (alvo) => REGRA_JEQ.test(alvo),
    motivo: "Vale do Jequitinhonha — página própria (dono, 14/10/2026).",
  },
  {
    caso: "unificada",
    desastre: "ambos",
    teste: (alvo) => REGRA_RODOCE.test(alvo) && REGRA_BRUM.test(alvo),
    motivo: "Compara os dois desastres (Mariana/Fundão e Brumadinho/B1) — biblioteca unificada.",
  },
  {
    caso: "riodoce",
    desastre: "mariana",
    teste: (alvo) => REGRA_RODOCE.test(alvo),
    motivo: "Caso Mariana/Fundão (título ou resumo) — biblioteca Rio Doce.",
  },
  {
    caso: "brumadinho",
    desastre: "brumadinho",
    teste: (alvo) => REGRA_BRUM.test(alvo),
    motivo: "Caso Brumadinho/B1/Paraopeba (título ou resumo) — biblioteca Paraopeba.",
  },
  {
    caso: "unificada",
    desastre: null,
    teste: () => true,
    motivo: "Sem caso nomeado — fica na biblioteca unificada, nada é excluído (dono, 14/10/2026).",
  },
];

function destinoDoTexto(textoAlvo) {
  // A última regra casa sempre — nenhuma tese fica sem destino.
  const regra = REGRAS_DESTINO.find((r) => r.teste(textoAlvo)) ?? REGRAS_DESTINO[REGRAS_DESTINO.length - 1];
  return { destino: regra.caso, motivo: regra.motivo, desastre: regra.desastre };
}

/* ─── saída ──────────────────────────────────────────────────────────────── */

const ROTA_SAIDA_CSV = argsMap.csv;
const ROTULO_SAIDA = path.resolve(
  process.cwd(), "apps/web/data/biblioteca-teses-atingidos.json",
);

const textos = parseCsv(fs.readFileSync(ROTA_SAIDA_CSV, "utf8"));
if (textos.length < 2) { console.error("CSV vazio ou com só cabeçalho."); process.exit(1); }
const cabecalho = textos[0].map((c) => c.trim());
const col = (nome) => {
  const i = cabecalho.indexOf(nome);
  if (i < 0) { console.error(`Coluna ausente no CSV: "${nome}"`); process.exit(1); }
  return i;
};

const C_TITULO = col("Título");
const C_AUTOR = col("Autor(a)");
const C_ANO = col("Ano de defesa");
const C_TIPO = col("Tipo de documento");
const C_INSTITUICAO = col("Instituição de defesa");
const C_SIGLA = col("Sigla da instituição de defesa");
const C_PAIS = col("País da instituição de defesa");
const C_IDIOMA = col("Idioma");
const C_ACESSO = col("Tipos de acesso");
const C_RESUMO = cabecalho.includes("Resumo") ? col("Resumo") : col("Resumo em Português");
const C_LINKS = col("Link de acesso");

const TIPO_ROTULO = { doctoralThesis: "Tese", masterThesis: "Dissertação" };
const contagemPorDestino = { riodoce: 0, brumadinho: 0, unificada: 0, jequitinhonha: 0 };
const duplicatasDescartadas = [];
const usados = new Set();
const itens = [];

for (const linha of textos.slice(1)) {
  const titulo = tiraEmail((linha[C_TITULO] || "").replace(/\s+/g, " ").trim());
  if (!titulo) continue;
  const chave = normalizar(titulo);
  if (usados.has(chave)) { duplicatasDescartadas.push(titulo); continue; }
  usados.add(chave);

  const resumoBruto = (linha[C_RESUMO] || "").trim();
  // "Não informado", contagem de folhas ("140 f.") e texto curto demais
  // (o repositório às vezes devolve só um número) não são resumo — lacuna
  // fica declarada (AGENTS §7), nunca um botão mostrando "50".
  const soLapis =
    /^n[oã]o informado/i.test(resumoBruto) ||
    /^\d+\s*f\.?$/i.test(resumoBruto) ||
    resumoBruto.length < 80;
  const resumo = soLapis ? "" : resumoBruto;
  const links = (linha[C_LINKS] || "")
    .split("||")
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l));

  const marcadorTituloResumo = `${titulo} ${resumo}`;
  const { destino, motivo, desastre } = destinoDoTexto(marcadorTituloResumo);
  contagemPorDestino[destino] += 1;

  const tags = [];
  if (REGRA_MAB.test(marcadorTituloResumo)) tags.push("MAB");

  const anoTexto = String(linha[C_ANO] || "").replace(/\D/g, "");
  const ano = anoTexto.length === 4 ? Number(anoTexto) : null;
  const tipo = TIPO_ROTULO[linha[C_TIPO]?.trim()] || linha[C_TIPO]?.trim() || "Trabalho acadêmico";

  let id = `tese-${ano ?? "sano"}-${chave.replace(/[^a-z0-9]+/g, "-").slice(0, 48).replace(/^-|-$/g, "")}`;
  if (usados.has(id)) id = `${id}-b`;
  usados.add(id);

  itens.push({
    id,
    titulo,
    autor: tiraEmail((linha[C_AUTOR] || "").replace(/\s+/g, " ").trim()) || "Autoria não informada",
    tipo,
    ano,
    instituicao: (linha[C_INSTITUICAO] || "").replace(/\s+/g, " ").trim() || "Instituição não informada (lacuna da fonte)",
    sigla: (linha[C_SIGLA] || "").replace(/\s+/g, " ").trim() || null,
    pais: (linha[C_PAIS] || "").replace(/\s+/g, " ").trim() || null,
    idioma: (linha[C_IDIOMA] || "").replace(/\s+/g, " ").trim() || null,
    acesso: (linha[C_ACESSO] || "").trim() || null,
    resumo: resumo || null,
    links: links.length ? links : [],
    destino,
    desastre,
    tags,
    motivo,
  });
}

itens.sort((a, b) => (a.destino === b.destino ? (b.ano ?? 0) - (a.ano ?? 0) : a.destino.localeCompare(b.destino)));
fs.writeFileSync(ROTULO_SAIDA, JSON.stringify({ total: itens.length, itens }, null, 2), "utf8");

const comMab = itens.filter((i) => i.tags.includes("MAB")).length;
const comResumo = itens.filter((i) => i.resumo).length;
console.log(`[teses] CSV lido: ${textos.length - 1} linhas.`);
console.log(`[teses] Únicas gravadas: ${itens.length} (${duplicatasDescartadas.length} duplicatas descartadas).`);
console.log(`[teses] Destino: ${JSON.stringify(contagemPorDestino)}`);
console.log(`[teses] TAG MAB: ${comMab} · com resumo: ${comResumo} · sem resumo: ${itens.length - comResumo}`);
console.log(`[teses] Arquivo: ${ROTULO_SAIDA}`);
for (const d of duplicatasDescartadas.slice(0, 8)) console.log(`  [dup] ${d}`);
