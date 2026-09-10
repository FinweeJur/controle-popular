#!/usr/bin/env node
/**
 * scripts/publicar-radar-editais.mts — converte os pendentes do radar de
 * editais em notícias do blog e avisa o dono no Telegram.
 *
 * ═══ POSIÇÃO NO FLUXO ═══
 *
 *   radar-editais-diarios.mts (04:20)  →  pendentes/   (rascunho, só o radar)
 *   publicar-radar-editais.mts (MANUAL) → noticias-portal.json + Telegram
 *
 * Este script NÃO roda sozinho na esteira: publicar no blog é decisão do dono
 * ou da rotina dele. O script é o executante da decisão — a chamada é manual
 * (`npx tsx scripts/publicar-radar-editais.mts`) ou entra na agenda quando o
 * dono mandar.
 *
 * ═══ GUARDAS ANTES DE QUALQUER ESCRITA (regra 2 do AGENTS.md) ═══
 *
 * 1. `python scripts/checar-dado-pessoal.py`          — código rastreado;
 * 2. `python scripts/checar-dado-pessoal-em-dado.py`  — JSON de dado (varre
 *    `apps/web/data/**`, que cobre os pendentes e o próprio portal JSON).
 * Qualquer uma que sair com código != 0 ABORTA tudo: nenhum JSON é tocado.
 * Roda mesmo em `--seco` — guarda não é cosmético.
 *
 * ═══ COMO ESCREVE ═══
 *
 * Read-modify-write em `apps/web/data/noticias-portal.json`, com o MESMO
 * formato do arquivo atual: `JSON.stringify(lista, null, 1)` + "\n" (indent
 * de 1 espaço, fim com quebra de linha — medido em 10/09/2026). Nada de
 * reescrever o arquivo inteiro com estilo novo: diff mínimo, estilo idêntico.
 * Cada pendente vira um `NoticiaPortal` com:
 *   categoria "Explicador", frente "estado", autor ONSA, declaracaoIa
 *   "Texto gerado automaticamente pelo radar de editais a partir do Diário
 *   Oficial, revisado pela equipe" — declaração honesta de máquina (regra
 *   editorial do AGENTS.md: rótulo de geração + revisão).
 * Depois de gravar, o pendente é MOVIDO para `processados/` com status
 * "publicado". Este script NÃO commita — o dono/rotina decide o commit
 * (regra 7 do AGENTS.md: cada um publica o próprio trabalho).
 *
 * ═══ TELEGRAM ═══
 *
 * Mesmo padrão de `scripts/enviar-relatorio-telegram.mts`: lê
 * TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID de `scripts/.env` via `process.env`
 * (nunca imprime o token), envia com parse_mode HTML e retry. Telegram fora
 * = exit 1 — conexão que falhou não é sucesso silencioso.
 *
 * ═══ USO ═══
 *
 *   npx tsx scripts/publicar-radar-editais.mts          # publica os pendentes
 *   npx tsx scripts/publicar-radar-editais.mts --seco   # só valida e relata
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PENDENTES_DIR = path.join(RAIZ, "apps", "web", "data", "radar-editais", "pendentes");
const PROCESSADOS_DIR = path.join(RAIZ, "apps", "web", "data", "radar-editais", "processados");
const PORTAL_JSON = path.join(RAIZ, "apps", "web", "data", "noticias-portal.json");

const SO_MEDIR = process.argv.includes("--seco");

// ──────────────────────────────────────────────────────────────────────────
// Telegram (padrão de enviar-relatorio-telegram.mts — nunca imprime segredo).
// ──────────────────────────────────────────────────────────────────────────

function carregarEnv(): void {
  const envPath = path.join(RAIZ, "scripts", ".env");
  if (!fs.existsSync(envPath)) return;
  const linhas = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const linha of linhas) {
    const m = linha.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const [, chave, valor] = m;
      if (!process.env[chave]) process.env[chave] = valor.trim();
    }
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function enviarTelegram(mensagem: string): Promise<void> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log("⚠️ [publicar-radar] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados em scripts/.env.");
    console.log("Mensagem que seria enviada:\n\n" + mensagem);
    return;
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const ESPERAS = [0, 10_000, 30_000];
  let ultimoErro = "";
  for (let tentativa = 1; tentativa <= ESPERAS.length; tentativa++) {
    if (ESPERAS[tentativa - 1]) await delay(ESPERAS[tentativa - 1]);
    try {
      const controller = new AbortController();
      const temporizador = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: mensagem, parse_mode: "HTML" }),
        signal: controller.signal,
      });
      clearTimeout(temporizador);
      if (res.ok) {
        console.log(`✅ [publicar-radar] aviso enviado ao dono no Telegram (tentativa ${tentativa})`);
        return;
      }
      ultimoErro = `HTTP ${res.status} - ${(await res.text()).slice(0, 200)}`;
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`Telegram rejeitou a mensagem: ${ultimoErro}`);
      }
    } catch (err) {
      if (err instanceof Error && /rejeitou a mensagem/.test(err.message)) throw err;
      ultimoErro = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`⚠️ [publicar-radar] tentativa ${tentativa} sem entrega: ${ultimoErro}`);
    }
  }
  throw new Error(`esgotadas as tentativas de entrega ao Telegram: ${ultimoErro}`);
}

// ──────────────────────────────────────────────────────────────────────────
// Guardas de dado pessoal (regra 2 do AGENTS.md).
// ──────────────────────────────────────────────────────────────────────────

function rodarGuarda(comando: string[], rotulo: string): void {
  const python = process.env.RADAR_PYTHON ?? "python";
  let r = spawnSync(python, comando, { encoding: "utf-8", timeout: 300_000 });
  if (r.error && !process.env.RADAR_PYTHON) {
    r = spawnSync("py", ["-3", ...comando], { encoding: "utf-8", timeout: 300_000 });
  }
  if (r.error) throw new Error(`não achei python para a guarda ${rotulo} (${r.error.message}); defina RADAR_PYTHON`);
  if (r.status !== 0) {
    const saida = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim();
    console.error(`⛔ [publicar-radar] guarda ${rotulo} FALHOU (rc=${r.status}). Nada será escrito.`);
    console.error(saida.slice(-2000));
    throw new Error(`guarda ${rotulo} reprovou — abortando publicação`);
  }
  console.log(`✅ [publicar-radar] guarda ${rotulo} passou`);
}

// ──────────────────────────────────────────────────────────────────────────
// Tipos.
// ──────────────────────────────────────────────────────────────────────────

interface Pendente {
  id: string;
  status: string;
  fonte: string;
  fonte_nome: string;
  fonte_url: string;
  data_publicacao: string;
  url: string;
  pagina: number;
  secao: string | null;
  titulo_sugerido: string;
  trechos: Array<{ contexto: string }>;
  score: number;
  termos: string[];
  criado_em: string;
  detector: string;
}

interface NoticiaPortal {
  slug: string;
  titulo: string;
  subtitulo: string;
  resumo: string;
  categoria: string;
  frente: string;
  subfrente: string;
  autor: string;
  declaracaoIa: string;
  publicadoEm: string;
  atualizadoEm: string;
  tempoLeituraMin: number;
  palavrasChave: string[];
  citacaoAbnt: string;
  citacaoBibtex: string;
  fontesOficiais: Array<{ nome: string; url: string }>;
  metricas: Array<{ rotulo: string; valor: string }>;
  recomendacaoVerificar?: string;
  paragrafos: string[];
}

// ──────────────────────────────────────────────────────────────────────────
// Conversão pendente → NoticiaPortal (determinística, sem LLM).
// ──────────────────────────────────────────────────────────────────────────

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function mesAno(dataIso: string): string {
  const [ano, mes] = dataIso.split("-");
  return `${MESES[Number(mes) - 1] ?? mes}. ${ano}`;
}

function converterEmNoticia(p: Pendente, agoraIso: string): NoticiaPortal {
  const slug = `radar-editais-${p.id.replace(/-/g, "").slice(0, 16)}`;
  const titulo = p.titulo_sugerido || "Edital publicado no Diário Oficial de Minas Gerais";
  const trechoLimpo = (p.trechos[0]?.contexto ?? "").slice(0, 400);
  const local = [p.secao ? `${p.secao}` : null, p.pagina ? `página ${p.pagina}` : null].filter(Boolean).join(", ");
  const data = p.data_publicacao;

  const paragrafos = [
    `O radar de editais do Controle Popular registrou a publicação de "${titulo}" no ${p.fonte_nome} de ${data}${local ? ` (${local})` : ""}. O trecho abaixo transcreve o ato conforme consta no diário:`,
    `"${trechoLimpo}${p.trechos[0]?.contexto && p.trechos[0].contexto.length > 400 ? "…" : ""}"`,
    `Editais desse tipo definem prazos de inscrição e regras de participação — inclusive para entidades da sociedade civil, conselhos e organizações. Confira o texto integral no diário oficial antes de qualquer ação: datas e requisitos podem mudar por retificação ou aditivo.`,
    `Este texto foi gerado automaticamente pelo radar de editais, que varre cada edição do diário em busca de atos de interesse social (chamamentos públicos, seleções, conselhos). O detector é determinístico — regras de texto com score ${p.score} — e não usa modelo de linguagem. A publicação automática não dispensa a revisão humana: ela é exatamente o que este radar quer provocar.`,
  ];

  return {
    slug,
    titulo,
    subtitulo: `Radar de editais: ${p.fonte_nome} — ${data}.`,
    resumo: `Detecção automática de edital de interesse social publicada no ${p.fonte_nome} de ${data}.${local ? ` Local: ${local}.` : ""}`,
    categoria: "Explicador",
    frente: "estado",
    subfrente: "Participação & Editais Públicos",
    autor: "ONSA — Observatório Nacional Socioambiental",
    declaracaoIa: "Texto gerado automaticamente pelo radar de editais a partir do Diário Oficial, revisado pela equipe.",
    publicadoEm: agoraIso,
    atualizadoEm: agoraIso,
    tempoLeituraMin: 2,
    palavrasChave: ["radar-editais", "diario-oficial", "editais", "participacao-social", p.fonte],
    citacaoAbnt: `ONSA — OBSERVATÓRIO NACIONAL SOCIOAMBIENTAL. ${titulo}. Controle Popular, Brasília, ${mesAno(data)}. Disponível em: <https://controlepopular.com.br/noticias/${slug}>.`,
    citacaoBibtex: `@article{onsa${new Date().getFullYear()}${slug.replace(/-/g, "")},\n  author = {{ONSA — Observatório Nacional Socioambiental}},\n  title = {${titulo}},\n  journal = {Controle Popular — Observatório Nacional Socioambiental},\n  year = {${new Date().getFullYear()}},\n  url = {https://controlepopular.com.br/noticias/${slug}}\n}`,
    fontesOficiais: [{ nome: p.fonte_nome, url: p.url }],
    metricas: [
      { rotulo: "Score do detector", valor: String(p.score) },
      { rotulo: "Termos casados", valor: p.termos.length ? p.termos.slice(0, 5).join(", ") : "nenhum registrado" },
    ],
    recomendacaoVerificar: `Abra a [edição do dia](${p.url}) no Jornal Minas Gerais e confira o edital na íntegra antes de qualquer inscrição.`,
    paragrafos,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────────────────────────────

function listarPendentes(): Pendente[] {
  if (!fs.existsSync(PENDENTES_DIR)) return [];
  return fs
    .readdirSync(PENDENTES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(PENDENTES_DIR, f), "utf-8")) as Pendente);
}

async function main(): Promise<void> {
  carregarEnv();
  const pendentes = listarPendentes();
  console.log(`[publicar-radar] ${pendentes.length} pendente(s) em ${path.relative(RAIZ, PENDENTES_DIR)}; seco=${SO_MEDIR ? "sim" : "nao"}`);

  if (pendentes.length === 0) {
    console.log("[publicar-radar] nada a publicar. Fim.");
    return;
  }

  // GUARDAS — rodam antes de qualquer escrita, mesmo em --seco.
  rodarGuarda(["scripts/checar-dado-pessoal.py"], "checar-dado-pessoal.py (código)");
  rodarGuarda(["scripts/checar-dado-pessoal-em-dado.py"], "checar-dado-pessoal-em-dado.py (dado)");

  if (SO_MEDIR) {
    for (const p of pendentes) {
      const n = converterEmNoticia(p, new Date().toISOString());
      console.log(`🧪 [seco] publicaria: slug=${n.slug} | "${n.titulo.slice(0, 80)}"`);
    }
    console.log("[publicar-radar] --seco: nada gravado, nada movido, nada enviado.");
    return;
  }

  // Read-modify-write no JSON do portal, formato idêntico ao atual.
  const cru = fs.readFileSync(PORTAL_JSON, "utf-8");
  const lista = JSON.parse(cru) as NoticiaPortal[];
  const slugsExistentes = new Set(lista.map((n) => n.slug));
  const agoraIso = new Date().toISOString();

  const publicadas: string[] = [];
  const puladas: string[] = [];
  for (const p of pendentes) {
    const n = converterEmNoticia(p, agoraIso);
    if (slugsExistentes.has(n.slug)) {
      puladas.push(`${n.slug} (slug já existe — pendente mantido)`);
      console.log(`⏭️  [publicar-radar] slug ${n.slug} já existe; pendente ${p.id} NÃO publicado`);
      continue;
    }
    lista.push(n);
    slugsExistentes.add(n.slug);
    fs.mkdirSync(PROCESSADOS_DIR, { recursive: true });
    const processado = { ...p, status: "publicado", slug: n.slug, publicado_em: agoraIso };
    fs.writeFileSync(path.join(PROCESSADOS_DIR, `${p.id}.json`), JSON.stringify(processado, null, 1) + "\n", "utf-8");
    fs.unlinkSync(path.join(PENDENTES_DIR, `${p.id}.json`));
    publicadas.push(n.titulo);
    console.log(`📰 [publicar-radar] ${n.slug} — "${n.titulo.slice(0, 80)}"`);
  }

  fs.writeFileSync(PORTAL_JSON, JSON.stringify(lista, null, 1) + "\n", "utf-8");
  console.log(`[publicar-radar] ${publicadas.length} notícia(s) gravada(s) em noticias-portal.json; ${puladas.length} pulada(s). Nenhum commit — decisão do dono.`);

  if (publicadas.length > 0) {
    const linhas = publicadas.map((t) => `- <b>${t.slice(0, 120)}</b>`).join("\n");
    await enviarTelegram(
      `📢 <b>Radar de editais</b>\n${publicadas.length} notícia(s) publicada(s) no blog (categoria Explicador, frente estado):\n\n${linhas}\n\nNenhum commit foi feito — a publicação no repositório fica a cargo da rotina do dono.`,
    );
  }
  if (puladas.length > 0) {
    console.log(`⚠️  [publicar-radar] ${puladas.join(" | ")}`);
  }
}

main().catch((err) => {
  console.error("❌ [publicar-radar] abortado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
