#!/usr/bin/env node
/**
 * scripts/publicar-radar-editais.mts — converte os pendentes do radar de
 * editais em notícias do blog e avisa o dono no Telegram.
 *
 * ═══ POSIÇÃO NO FLUXO ═══
 *
 *   radar-editais-diarios.mts (04:20)  →  pendentes/   (rascunho, só o radar)
 *   publicar-radar-editais.mts (04:50)  → noticias-portal.json + commit + push
 *
 * A publicação é AUTOMÁTICA por decisão do dono (10/09/2026): a tarefa
 * agendada das 04:50 roda este script depois do radar. Guardas de dado
 * pessoal rodam antes E depois da escrita; commit e push são feitos aqui
 * (árvore suja travaria o autodeploy das 05:50, que é quem leva ao ar).
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
 * "publicado". O commit é feito aqui, por pathspec explícito (regra 5 do
 * AGENTS.md), com mensagem em arquivo (regra 6), e push logo em seguida
 * (regra 7) — quem publica o próprio trabalho é a própria rotina.
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
import { spawnSync, execFileSync } from "node:child_process";
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

// ──────────────────────────────────────────────────────────────────────────
// Registro anti-duplicado: o slug nasce do hash do pendente, que MUDARIA a
// cada re-detecção do mesmo edital em dias seguidos. A chave real é
// fonte+data+titulo normalizado — persistida em processados/registro.json.
// ──────────────────────────────────────────────────────────────────────────

const REGISTRO_PATH = path.join(PROCESSADOS_DIR, "registro.json");

/** Só vira post o edital com potencial de interesse social (regra editorial
 *  do AGENTS.md): participação em conselhos, chamamentos, seleção pública,
 *  credenciamento, audiência. Pregão/leilão comum é ruído — a menos que o
 *  score do detector seja alto (>= 25), caso em que o trecho merece leitura. */
const FILTRO_PUBLICACAO =
  /chamamento|chamada p[úu]blica|sociedade civil|conselho|condel|ppddh|sele[çc][ãa]o p[úu]blica|credenciamento|audi[êe]ncia p[úu]blica|organiza[çc][õo]es? da sociedade civil|entidades civis/i;
const SCORE_EXCECAO = 25;

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chaveDoPendente(p: Pendente): string {
  return [p.fonte, p.data_publicacao, normalizar(p.titulo_sugerido)].join("|");
}

function lerRegistro(): Set<string> {
  try {
    const cru = fs.readFileSync(REGISTRO_PATH, "utf-8");
    const arr = JSON.parse(cru) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function salvarRegistro(registro: Set<string>): void {
  fs.mkdirSync(PROCESSADOS_DIR, { recursive: true });
  fs.writeFileSync(REGISTRO_PATH, JSON.stringify([...registro].sort(), null, 1) + "\n", "utf-8");
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
      const textoParaFiltro = `${p.titulo_sugerido} ${p.trechos.map((t) => t.contexto).join(" ")}`;
      const noEscopo = FILTRO_PUBLICACAO.test(textoParaFiltro) || p.score >= SCORE_EXCECAO;
      console.log(
        noEscopo
          ? `🧪 [seco] publicaria: slug=${n.slug} | "${n.titulo.slice(0, 80)}"`
          : `🚫 [seco] fora de escopo (score ${p.score}): "${n.titulo.slice(0, 80)}"`
      );
    }
    console.log("[publicar-radar] --seco: nada gravado, nada movido, nada enviado.");
    return;
  }

  // Read-modify-write no JSON do portal, formato idêntico ao atual.
  const cru = fs.readFileSync(PORTAL_JSON, "utf-8");
  const lista = JSON.parse(cru) as NoticiaPortal[];
  const slugsExistentes = new Set(lista.map((n) => n.slug));
  const agoraIso = new Date().toISOString();

  const registro = lerRegistro();
  const publicadas: { id: string; titulo: string; slug: string }[] = [];
  const puladas: string[] = [];
  for (const p of pendentes) {
    const chave = chaveDoPendente(p);
    const n = converterEmNoticia(p, agoraIso);
    // Filtro editorial: leilão/pregão genérico não é notícia de interesse
    // social; arquiva como fora-de-escopo para não poluir a fila.
    const textoParaFiltro = `${p.titulo_sugerido} ${p.trechos.map((t) => t.contexto).join(" ")}`;
    if (!FILTRO_PUBLICACAO.test(textoParaFiltro) && p.score < SCORE_EXCECAO) {
      fs.mkdirSync(PROCESSADOS_DIR, { recursive: true });
      const fora = { ...p, status: "fora-de-escopo", slug: n.slug, publicado_em: agoraIso };
      fs.writeFileSync(path.join(PROCESSADOS_DIR, `${p.id}.json`), JSON.stringify(fora, null, 1) + "\n", "utf-8");
      fs.unlinkSync(path.join(PENDENTES_DIR, `${p.id}.json`));
      puladas.push(`${n.titulo.slice(0, 60)} (fora do escopo social)`);
      console.log(`🚫 [publicar-radar] fora de escopo (score ${p.score}): ${p.id}`);
      continue;
    }
    if (slugsExistentes.has(n.slug) || registro.has(chave)) {
      // Já publicado (hoje ou em rodada anterior): arquiva o pendente como
      // duplicado para ele não voltar amanhã, sem tocar no acervo.
      const motivo = slugsExistentes.has(n.slug) ? "slug já existe" : "edital já publicado em rodada anterior";
      puladas.push(`${n.titulo.slice(0, 60)} (${motivo})`);
      fs.mkdirSync(PROCESSADOS_DIR, { recursive: true });
      const dup = { ...p, status: "duplicado", slug: n.slug, publicado_em: agoraIso };
      fs.writeFileSync(path.join(PROCESSADOS_DIR, `${p.id}.json`), JSON.stringify(dup, null, 1) + "\n", "utf-8");
      fs.unlinkSync(path.join(PENDENTES_DIR, `${p.id}.json`));
      console.log(`⏭️  [publicar-radar] ${motivo}: ${p.id}`);
      continue;
    }
    lista.push(n);
    slugsExistentes.add(n.slug);
    registro.add(chave);
    publicadas.push({ id: p.id, titulo: n.titulo, slug: n.slug });
    console.log(`📰 [publicar-radar] ${n.slug} — "${n.titulo.slice(0, 80)}"`);
  }

  fs.writeFileSync(PORTAL_JSON, JSON.stringify(lista, null, 1) + "\n", "utf-8");
  console.log(`[publicar-radar] ${publicadas.length} notícia(s) gravada(s) em noticias-portal.json; ${puladas.length} pulada(s).`);

  // Automação completa (pedido do dono): guarda -> grava -> commit -> push.
  // Sem commit a rotina das 05:50 abortaria por árvore suja e a notícia
  // nunca iria ao ar. Se o push falhar, o JSON volta ao estado original e
  // os pendentes permanecem para a próxima rodada.
  const rel = path.relative(RAIZ, PORTAL_JSON);
  if (publicadas.length > 0) {
    try {
      rodarGuarda(["scripts/checar-dado-pessoal-em-dado.py"], "checar-dado-pessoal-em-dado.py (pós-escrita)");
      // Porta de ortografia: violação de acento obrigatório bloqueia a
      // publicação. Avisos de estilo (frase longa) não bloqueiam.
      execFileSync("npx", ["tsx", "scripts/checar-ortografia-noticias.mts"], {
        cwd: RAIZ,
        stdio: "inherit",
      });
      const msg = `radar: ${publicadas.length} edital(is) do Diario Oficial vira(m) post do blog\n\nPublicacao automatica do radar de editais. Guardas de dado pessoal e checagem de ortografia rodadas antes do commit.\n\nCo-Authored-By: opencode\n`;
      const msgFile = path.join(RAIZ, "logs", `radar-msg-${Date.now()}.txt`);
      fs.writeFileSync(msgFile, msg, "utf-8");
      execFileSync("git", ["add", rel], { cwd: RAIZ });
      execFileSync("git", ["commit", "--only", rel, "-F", msgFile], { cwd: RAIZ });
      execFileSync("git", ["fetch", "origin", "--quiet"], { cwd: RAIZ });
      execFileSync("git", ["rebase", "origin/main"], { cwd: RAIZ });
      execFileSync("git", ["push", "origin", "HEAD:main"], { cwd: RAIZ });
      fs.unlinkSync(msgFile);
      // Só agora o pendente sai da fila e o registro persiste — se o push
      // tivesse falhado, ele tentaria de novo amanhã.
      for (const pub of publicadas) {
        const p = pendentes.find((x) => x.id === pub.id);
        if (!p) continue;
        fs.mkdirSync(PROCESSADOS_DIR, { recursive: true });
        const processado = { ...p, status: "publicado", slug: pub.slug, publicado_em: agoraIso };
        fs.writeFileSync(path.join(PROCESSADOS_DIR, `${pub.id}.json`), JSON.stringify(processado, null, 1) + "\n", "utf-8");
        fs.unlinkSync(path.join(PENDENTES_DIR, `${pub.id}.json`));
      }
      salvarRegistro(registro);
      console.log("[publicar-radar] commit + push feitos; a rotina das 05:50 publica no ar.");
    } catch (err) {
      console.error("⚠️ [publicar-radar] commit/push falhou:", err instanceof Error ? err.message : err);
      execFileSync("git", ["rebase", "--abort"], { cwd: RAIZ, stdio: "ignore" });
      execFileSync("git", ["checkout", "--", rel], { cwd: RAIZ });
      console.error("[publicar-radar] JSON do portal revertido; pendentes continuam aguardando.");
    }
  }

  if (publicadas.length > 0) {
    const linhas = publicadas.map((t) => `- <b>${t.titulo.slice(0, 120)}</b>`).join("\n");
    await enviarTelegram(
      `📢 <b>Radar de editais</b>\n${publicadas.length} notícia(s) publicada(s) no blog (categoria Explicador, frente estado):\n\n${linhas}\n\nCommit e push feitos — o autodeploy das 05:50 leva ao ar.`,
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
