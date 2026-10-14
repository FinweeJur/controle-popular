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

/**
 * Vários CSVs podem alimentar o MESMO acervo — cada entrada leva um rótulo de
 * levantamento para rastreabilidade no item: `--csv=<arquivo>::<rótulo>`.
 * Rótulos válidos hoje: `geral` (levimentação bibelo, tema barragens/desastres)
 * e `ati` (levimentação focada nas ATIs).
 */
const ROTULOS_VALIDOS = new Set(["geral", "ati"]);
const entradasCsv = args
  .filter((a) => a.startsWith("--csv="))
  .map((a) => {
    const valor = a.slice(6);
    const sep = valor.lastIndexOf("::");
    return sep < 0
      ? { caminho: valor, rotulo: "geral" }
      : { caminho: valor.slice(0, sep), rotulo: valor.slice(sep + 2) };
  });
if (entradasCsv.length === 0) {
  console.error("Uso: node gerar-teses-atingidos.mjs --csv=<arquivo.csv>[::geral|::ati] [--csv=...]");
  process.exit(1);
}
for (const entrada of entradasCsv) {
  if (!ROTULOS_VALIDOS.has(entrada.rotulo)) {
    console.error(`Rótulo de levantamento inválido para "${entrada.caminho}": "${entrada.rotulo}". Use geral ou ati.`);
    process.exit(1);
  }
  if (!fs.existsSync(entrada.caminho)) {
    console.error(`CSV não encontrado: ${entrada.caminho}`);
    process.exit(1);
  }
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

const ROTA_SAIDA = path.resolve(
  process.cwd(), "apps/web/data/biblioteca-teses-atingidos.json",
);

const TIPO_ROTULO = { doctoralThesis: "Tese", masterThesis: "Dissertação" };
const contagemPorDestino = { riodoce: 0, brumadinho: 0, unificada: 0, jequitinhonha: 0 };
const contagemPorLevantamento = { geral: 0, ati: 0 };
const duplicatasDescartadas = [];
const usados = new Set();
const itens = [];

/** Índices das colunas do CSV pela NOME na linha de cabeçalho. Falta coluna
    → erro com o nome, nunca posição adivinhada. */
function indicesDeColuna(cabecalho, caminho) {
  const col = (nome) => {
    const i = cabecalho.indexOf(nome);
    if (i < 0) { console.error(`Coluna ausente no CSV "${caminho}": "${nome}"`); process.exit(1); }
    return i;
  };
  return {
    titulo: col("Título"),
    autor: col("Autor(a)"),
    ano: col("Ano de defesa"),
    tipo: col("Tipo de documento"),
    instituicao: col("Instituição de defesa"),
    sigla: col("Sigla da instituição de defesa"),
    pais: col("País da instituição de defesa"),
    idioma: col("Idioma"),
    acesso: col("Tipos de acesso"),
    resumo: cabecalho.includes("Resumo") ? col("Resumo") : col("Resumo em Português"),
    links: col("Link de acesso"),
  };
}

/** "Não informado", contagem de folhas ("140 f.") e texto curto demais
    (o repositório às vezes devolve só um número) não são resumo — lacuna
    fica declarada (AGENTS §7), nunca um botão mostrando "50". */
function resumoUtil(textoBruto) {
  const t = (textoBruto || "").trim();
  const soLapis =
    /^n[oã]o informado/i.test(t) || /^\d+\s*f\.?$/i.test(t) || t.length < 80;
  return soLapis ? null : t;
}

/** Links de acesso: só HTTP(s), separados por "||" na célula do CSV. */
function linksDo(texto) {
  return (texto || "")
    .split("||")
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l));
}

/** Campo de texto: vira fallback quando a fonte veio vazia. */
function campoTexto(campo, fallback) {
  const limpo = (campo || "").replace(/\s+/g, " ").trim();
  return limpo || fallback;
}

/** Tipo de documento BibELO → rótulo em português; desconhecido sai como veio. */
function tipoRotulo(valor) {
  const bruto = (valor || "").trim();
  return TIPO_ROTULO[bruto] || bruto || "Trabalho acadêmico";
}

/** Ano de defesa: 4 dígitos exigidos; qualquer outra coisa é nada. */
function anoDe(valor) {
  const texto = String(valor || "").replace(/\D/g, "");
  return texto.length === 4 ? Number(texto) : null;
}

/** Monta o item do acervo a partir de UMA linha do CSV + rótulo do
    levantamento. Função pura: não mexe em estado global. */
function itemDaLinha(linha, cols, rotulo) {
  const titulo = tiraEmail((linha[cols.titulo] || "").replace(/\s+/g, " ").trim());
  if (!titulo) return null;
  const resumo = resumoUtil(linha[cols.resumo]);
  const marcadorTituloResumo = `${titulo} ${resumo ?? ""}`;
  const { destino, motivo, desastre } = destinoDoTexto(marcadorTituloResumo);

  return {
    titulo,
    autor: campoTexto(tiraEmail(linha[cols.autor]), "Autoria não informada"),
    tipo: tipoRotulo(linha[cols.tipo]),
    ano: anoDe(linha[cols.ano]),
    instituicao: campoTexto(linha[cols.instituicao], "Instituição não informada (lacuna da fonte)"),
    sigla: campoTexto(linha[cols.sigla], null),
    pais: campoTexto(linha[cols.pais], null),
    idioma: campoTexto(linha[cols.idioma], null),
    acesso: campoTexto(linha[cols.acesso], null),
    resumo,
    links: linksDo(linha[cols.links]),
    levantamento: rotulo,
    destino,
    desastre,
    tags: REGRA_MAB.test(marcadorTituloResumo) ? ["MAB"] : [],
    motivo,
  };
}

/** Titula o item dedup-global-kin: a dedup é GLOBAL (uma tese que apareça
    nos dois levantamentos fica só um item — o primeiro a chegar). Devolve
    `true` quando o item entrou no acervo, para a contagem não somar
    duplicata. */
function adicionarItemSeNovo(dadosItem, ctx) {
  const chave = normalizar(dadosItem.titulo);
  if (ctx.usados.has(chave)) { ctx.duplicatas.push(dadosItem.titulo); return false; }
  ctx.usados.add(chave);

  let id = `tese-${dadosItem.ano ?? "sano"}-${chave.replace(/[^a-z0-9]+/g, "-").slice(0, 48).replace(/^-|-$/g, "")}`;
  if (ctx.usados.has(id)) id = `${id}-b`;
  ctx.usados.add(id);

  ctx.itens.push({ id, ...dadosItem });
  return true;
}

/** Converte um CSV de levantamento em itens do acervo, contando destinos. */
function carregarAcervoCsv(entrada, ctx) {
  const textos = parseCsv(fs.readFileSync(entrada.caminho, "utf8"));
  if (textos.length < 2) { console.error(`CSV vazio ou com só cabeçalho: ${entrada.caminho}`); process.exit(1); }
  const cols = indicesDeColuna(
    textos[0].map((c) => c.trim()),
    entrada.caminho,
  );
  for (const linha of textos.slice(1)) {
    const dadosItem = itemDaLinha(linha, cols, entrada.rotulo);
    if (!dadosItem) continue;
    // Contagem SÓ do item aceito: duplicata não soma cardinalidade.
    if (adicionarItemSeNovo(dadosItem, ctx)) {
      ctx.porLevantamento[entrada.rotulo] += 1;
      ctx.porDestino[dadosItem.destino] += 1;
    }
  }
}

/** Contexto compartilhado entre os CSVs: dedup e contagens globais. */
const CONTEXTO_ACERVO = {
  usados,
  duplicatas: duplicatasDescartadas,
  itens,
  porLevantamento: contagemPorLevantamento,
  porDestino: contagemPorDestino,
};
for (const entrada of entradasCsv) carregarAcervoCsv(entrada, CONTEXTO_ACERVO);

/** Links completados à mão, fora do CSV. Chave: achado por "sobrenome ano".
    Vale SÓ quando o link veio ausente na fonte e alguém conferiu o handle
    NAVEGANDO na página oficial da tese — nunca URL adivinhada (AGENTS §6).
    Cada entrada grava quem conferiu e quando. */
const LINKS_COMPLETADOS = {
  "Garcia 2021": {
    links: ["https://www.teses.usp.br/teses/disponiveis/107/107131/tde-09082022-144422/"],
    fonte: "teses.usp.br — handle conferido pelo dono em 14/10/2026",
  },
};
let quantosCompletados = 0;
for (const item of itens) {
  const achado = LINKS_COMPLETADOS[`${item.autor.split(/[,|]/)[0].trim().split(" ").at(-1)} ${item.ano}`];
  if (achado && item.links.length === 0) {
    item.links = [...achado.links];
    item.fonteDoLink = achado.fonte;
    quantosCompletados += 1;
  }
}

itens.sort((a, b) => (a.destino === b.destino ? (b.ano ?? 0) - (a.ano ?? 0) : a.destino.localeCompare(b.destino)));
fs.writeFileSync(ROTA_SAIDA, JSON.stringify({ total: itens.length, itens }, null, 2), "utf8");

const comMab = itens.filter((i) => i.tags.includes("MAB")).length;
const comResumo = itens.filter((i) => i.resumo).length;
console.log(`[teses] Únicas gravadas: ${itens.length} (${duplicatasDescartadas.length} duplicatas descartadas).`);
console.log(`[teses] Levantamento: ${JSON.stringify(contagemPorLevantamento)}`);
console.log(`[teses] Destino: ${JSON.stringify(contagemPorDestino)}`);
console.log(`[teses] TAG MAB: ${comMab} · com resumo: ${comResumo} · sem resumo: ${itens.length - comResumo}`);
console.log(`[teses] Links completados à mão: ${quantosCompletados}`);
console.log(`[teses] Arquivo: ${ROTA_SAIDA}`);
for (const d of duplicatasDescartadas.slice(0, 8)) console.log(`  [dup] ${d}`);
