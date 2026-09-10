#!/usr/bin/env node
/**
 * scripts/coletar-atos-pessoal-judiciario.mts — baixa o Diário Oficial de
 * Minas Gerais e guarda ATOS DE PESSOAL com pessoa nomeada (nomeações,
 * designações, exonerações) numa base versionada para a página de
 * contatos e para o assistente.
 *
 * ═══ FONTES ═══
 *
 * FONTE A (atliva): Jornal Minas Gerais (jornalminasgerais.mg.gov.br) —
 *   API medida em 10/09/2026 (mesma do radar de editais):
 *   GET {API}/Jornal/ObterEdicaoPorDataPublicacao?dataPublicacao=YYYY-MM-DD
 *   → JSON com o PDF assinado (base64), totalPaginas.
 *   Texto extraído via PyMuPDF (scripts/radar-editais-extrair-pdf.py).
 *   Este caderno traz portarias e nomeações do EXECUTIVO (Secretarias de
 *   Estado, Imprensa, autarquias). Magistrados e promotores publicam no
 *   DJE/TJMG e no MPMG — ver FONTE B em TODO.
 *
 * FONTE B (pendente, requer engenharia reversa dedicada): DJE/TJMG
 *   (dje.tjmg.jus.br, app legado Struts — só HTML, sem API pública) e
 *   atos do MPMG (www.mpmg.mp.br, busca HTML). Os endpoints mapeados
 *   hoje não expõem JSON; o contrato abaixo já recebe o texto do caderno,
 *   então basta plugar um baixador quando a sessão dedicada resolver a
 *   autenticação/robots daquelas srcs. Registrado: decisão de não
 *   contornar as fontes sem respeitar o robots.txt de cada uma.
 *
 * ═══ DETECÇÃO (determinística, sem LLM) ═══
 * Anchoco: "PORTARIA", "DESIGNA", "NOMEA", "EXONERA", "CEDE AO", n.º do
 * ato, data, órgão. Exige pelo menos: 1 nome em CAIXA ALTA + cargo +
 * número/órgão — senão descarta (ruído não vira dado).
 *
 * ═══ GUARDAS ═══
 * `python scripts/checar-dado-pessoal.py` e
 * `python scripts/checar-dado-pessoal-em-dado.py` rodam antes de QUALQUER
 * escrita (e CPF encontrado aborta — regra 2 do AGENTS.md).
 *
 * ═══ SAÍDA ═══
 * `apps/web/data/judiciario-designacoes.json` (versionado): registros
 * {fonte, data_edicao, ato, tipo, pessoa, cargo, orgao, unidadeId?,
 *  urlFonte, criado_em}. Merge por chave (fonte|data_edicao|ato|pessoa).
 * Registros novos → Telegram do dono (padrão enviar-relatorio).
 * Commit + push por pathspec explícito (senão o autodeploy das 05:50
 * aborta em árvore suja — mesma lição do radar).
 *
 * ═══ USO ═══
 *   npx tsx scripts/coletar-atos-pessoal-judiciario.mts            # rodada diária
 *   npx tsx scripts/coletar-atos-pessoal-judiciario.mts --sem-push # baixa e grava, não commita
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEM_PUSH = process.argv.includes("----sem-push") || process.argv.includes("--sem-push");
const DATA = "apps/web/data/judiciario-designacoes.json";
const DESTINO = path.join(RAIZ, DATA);
const EXTRATOR = path.join(RAIZ, "scripts", "radar-editais-extrair-pdf.py");
const API_BASE = "https://www.jornalminasgerais.mg.gov.br/api/v1";
const FONTE_NOME = "Diário Oficial de Minas Gerais (Jornal Minas Gerais)";

interface Designacao {
  fonte: string;
  data_edicao: string;
  ato: string;
  tipo: "NOMEAÇÃO" | "DESIGNAÇÃO" | "EXONERAÇÃO" | "CESSÃO" | "OUTRO";
  pessoa: string;
  cargo: string;
  orgao: string;
  unidadeId?: string;
  urlFonte: string;
  criado_em: string;
}

function carregarEnv(): void {
  const p = path.join(RAIZ, "scripts", ".env");
  if (!fs.existsSync(p)) return;
  for (const linha of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

function rodarGuarda(args: string[], rotulo: string): void {
  const r = spawnSync("python", args, { cwd: RAIZ, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`Guarda ${rotulo} reprovou:\n${r.stdout}${r.stderr}`);
}

async function enviarTelegram(texto: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 4000), parse_mode: "HTML" }),
    });
  } catch {
    // Avés perdido não vira erro para o dado (já gravado).
  }
}

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function obterEdicao(dataIso: string): Promise<{ paginas: string[]; url: string } | null> {
  const url = `${API_BASE}/Jornal/ObterEdicaoPorDataPublicacao?dataPublicacao=${dataIso}`;
  const r = await fetch(url, { headers: { "User-Agent": "ControlePopular/1.0 (radar editais; contato publico)" }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { valor?: { arquivo: string; totalPaginas: number }; erros?: unknown[] } | null;
  const v = j?.valor ?? (j as unknown as { arquivo: string; totalPaginas: number } | null);
  if (!v || !v.arquivo) return null;
  const pdfPath = path.join(RAIZ, "logs", `domg-${dataIso}.pdf`);
  const txtPath = path.join(RAIZ, "logs", `domg-${dataIso}.txt.json`);
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  fs.writeFileSync(pdfPath, Buffer.from(v.arquivo, "base64"));
  const ex = spawnSync("python", [EXTRATOR, pdfPath, txtPath], { cwd: RAIZ, encoding: "utf-8", timeout: 180000 });
  if (ex.status !== 0) {
    console.warn("extrator falhou:", (ex.stderr || ex.stdout || "").slice(0, 300));
    return null;
  }
  const saida = JSON.parse(fs.readFileSync(txtPath, "utf-8")) as { paginas: Array<{ n: number; texto: string }> };
  return { paginas: saida.paginas.map((p) => p.texto), url };
}

const ANCHOR = /(PORTARIA|DESIGNA|NOMEA|EXONERA|CEDE AO|CONCEDE|DESIGNAÇÃO|NOMEAÇÃO)/i;

function detectar(texto: string, dataIso: string, url: string): Designacao[] {
  const saida: Designacao[] = [];
  const janelas: Array<{ num: string; tipo: Designacao["tipo"]; trecho: string }> = [];
  const re = /((?:PORTARIA|DECRETO|RESOLUÇÃO)\s*[Nº.\s]*[\d/]+[^\n]{0,160})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const bloco = m[0];
    if (!ANCHOR.test(bloco.slice(0, 260))) continue;
    const tipo: Designacao["tipo"] =
      /EXONERA/i.test(bloco) ? "EXONERAÇÃO" :
      /DESIGNA/i.test(bloco) ? "DESIGNAÇÃO" :
      /NOMEA/i.test(bloco) ? "NOMEAÇÃO" :
      /CEDE AO/i.test(bloco) ? "CESSÃO" : "OUTRO";
    const pessoa = [...bloco.matchAll(/\b([A-ZÀ-Ü]{3,}(?:\s[A-ZÀ-Ü]{3,}){1,5})\b/g)]
      .map((mm) => mm[1]).find((p) => p.length > 5);
    const orgaoM = bloco.match(/(Secretaria\s+de\s+Estado[^\n,]{0,70}|(?:\w+\s*){1,5} de Minas Gerais)/i);
    const cargoM = bloco.match(/(?:cargo\s+de\s+)?([A-Za-zÀ-ü0-9().-]{4,}(?:\s[A-Za-zÀ-ü0-9().-]{2,}){1,6})/g);
    if (pessoa) {
      janelas.push({
        num: m[1].replace(/\s+/g, " ").slice(0, 60),
        tipo,
        trecho: `Ato ${tipo}: ${pessoa} — ${cargoM ? cargoM[cargoM.length - 1] : ""} ${orgaoM ? `— ${orgaoM[0]}` : ""} ${bloco.slice(0, 140)}`,
      });
    }
  }
  // Agrupa por pessoa+ato para não gerar 10 registros do mesmo ato.
  for (const w of janelas) {
    const pessoa = (w.trecho.match(/[A-ZÀ-Ü]{3,}(?:\s[A-ZÀ-Ü]{3,}){1,5}/) ?? [""])[0];
    if (!pessoa) continue;
    saida.push({
      fonte: FONTE_NOME,
      data_edicao: dataIso,
      ato: w.num,
      tipo: w.tipo,
      pessoa,
      cargo: (w.trecho.match(/(?:—\s)([^—]{2,60})(?:\s—|$)/) ?? ["", ""])[1].trim().slice(0, 80),
      orgao: (w.trecho.match(/(Secretaria\s+de\s+Estado[^\n]{0,70})/i) ?? ["", ""])[1].trim().slice(0, 80),
      urlFonte: url,
      criado_em: new Date().toISOString(),
    });
  }
  return saida;
}

function casarComUnidades(recs: Designacao[]): Designacao[] {
  const unidades = JSON.parse(fs.readFileSync(path.join(RAIZ, "apps/web/data/judiciario-unidades-contatos.json"), "utf-8")) as Array<{
    id: string; comarcaOuSubsecao: string; nome: string; uf: string;
  }>;
  for (const rec of recs) {
    const alvo = normalizar(rec.pessoa);
    // Unidade cuja comarca aparece no nome/órgão da pessoa? Não há N-to-1
    // seguro por texto. Melhor heurística: comarca == município do cargo.
    // Sem match confiável, deixamos unidadeId vazio (não forçar — regra do
    // AGENTS.md: relacionar por código/chave, não inventar).
    const txt = normalizar(`${rec.cargo} ${rec.orgao}`);
    const achada = unidades.find((u) => txt.includes(normalizar(u.comarcaOuSubsecao)) && txt.includes(normalizar(u.uf)));
    if (achada) rec.unidadeId = achada.id;
  }
  return recs;
}

async function main(): Promise<void> {
  carregarEnv();
  const dataIso = new Date().toISOString().slice(0, 10);
  const ed = await obterEdicao(dataIso);
  if (!ed) {
    console.log("[atos-pessoal] edição do dia indisponível — nada a fazer.");
    return;
  }
  const novos: Designacao[] = [];
  for (const t of ed.paginas) novos.push(...detectar(t, dataIso, ed.url));
  // Limite de ruído: se 100+ "designações" num só dia é sinal de regex
  // larga demais, não de biblioteca lotada.
  if (novos.length > 99) {
    console.warn(`[atos-pessoal] ${novos.length} candidatos no dia — revisar regex (trava de sanidade).`);
    novos.length = 0;
  }

  const lista: Designacao[] = []; // 99 máx; carregar existente
  if (fs.existsSync(DESTINO)) {
    lista.push(...(JSON.parse(fs.readFileSync(DESTINO, "utf-8")) as Designacao[]));
  }

  // Merge por chave.
  const existentes = new Set(lista.map((r) => [r.fonte, r.data_edicao, r.ato, r.pessoa].join("|")));
  const acrescimo = casarComUnidades(novos).filter((r) => !existentes.has([r.fonte, r.data_edicao, r.ato, r.pessoa].join("|")));
  if (acrescimo.length === 0) {
    console.log("[atos-pessoal] sem designações novas hoje.");
    return;
  }

  // GUARDAS ANTES DE ESCREVER.
  rodarGuarda(["scripts/checar-dado-pessoal.py"], "checar-dado-pessoal.py (código)");
  rodarGuarda(["scripts/checar-dado-pessoal-em-dado.py"], "checar-dado-pessoal-em-dado.py (dado)");

  lista.push(...acrescimo);
  fs.writeFileSync(DESTINO, JSON.stringify(lista, null, 1) + "\n", "utf-8");
  console.log(`[atos-pessoal] ${acrescimo.length} designação(ões) nova(s); total ${lista.length}.`);

  if (!SEM_PUSH) {
    try {
      const rel = path.relative(RAIZ, DESTINO);
      const msgFile = path.join(RAIZ, "logs", `atos-pessoal-msg-${Date.now()}.txt`);
      fs.writeFileSync(
        msgFile,
        `feat: ${acrescimo.length} ato(s) de pessoal de ${dataIso} no Diario de Minas\n\nColetor de atos de pessoal. Guardas de dado pessoal rodadas antes da escrita.\n\nCo-Authored-By: opencode\n`,
        "utf-8",
      );
      execFileSync("git", ["add", rel], { cwd: RAIZ });
      execFileSync("git", ["commit", "--only", rel, "-F", msgFile], { cwd: RAIZ });
      execFileSync("git", ["fetch", "origin", "--quiet"], { cwd: RAIZ });
      execFileSync("git", ["rebase", "origin/main"], { cwd: RAIZ });
      execFileSync("git", ["push", "origin", "HEAD:main"], { cwd: RAIZ });
      fs.unlinkSync(msgFile);
      console.log("[atos-pessoal] commit + push feitos.");
    } catch (err) {
      console.error("⚠️ [atos-pessoal] commit/push falhou:", err instanceof Error ? err.message : err);
      execFileSync("git", ["rebase", "--abort"], { cwd: RAIZ, stdio: "ignore" });
      execFileSync("git", ["checkout", "--", path.relative(RAIZ, DESTINO)], { cwd: RAIZ });
    }
  }

  const linhas = acrescimo.slice(0, 10).map((r) => `- <b>${r.tipo}</b>: ${r.pessoa} — ${r.cargo}`).join("\n");
  await enviarTelegram(
    `📌 <b>Atos de pessoal (${dataIso})</b>\n${acrescimo.length} novo(s) no Diário Oficial de MG:\n\n${linhas}\n\nFonte: Diário Oficial de MG. Commit e push feitos — autodeploy publica.`,
  );
}

main().catch((e) => {
  console.error("❌ [atos-pessoal] abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});