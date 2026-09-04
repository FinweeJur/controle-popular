#!/usr/bin/env node
/**
 * scripts/enviar-relatorio-telegram.mts
 *
 * Coleta os logs das rotinas automáticas da esteira noturna, EXTRAI OS
 * NÚMEROS REAIS de cada log e envia o relatório consolidado via Telegram.
 *
 * ⟲ 04/09/2026, reescrito a pedido do dono ("está sempre mandando o mesmo
 * texto padrão; tem que ser um texto correspondente ao que a rotina fez"):
 *
 * - Causa raiz do texto fixo: os logs são gravados pelo Tee-Object do
 *   PowerShell em UTF-16LE, e a versão anterior lia tudo como UTF-8 — nenhum
 *   regex casava, e cada linha caía no fallback inventado à mão.
 * - Agora: cada linha do relatório vem de um número lido do log da vez.
 *   Se o log não existir ou o número não aparecer, a linha diz "sem registro"
 *   — lacuna é informação, número errado é dano (AGENTS.md).
 * - Retry com backoff (10s/30s/90s, 4 tentativas): às 06:30 de 04/09 a rede
 *   caiu e o relatório não chegou sem aviso. Conexão que falhou agora é
 *   erro de saída (exit != 0), para o watchdog e o agendador perceberem.
 *
 * Esteira de referência (horários de 04/09): páginas 01:00 · notícias 02:30 ·
 * coleta/madrugada 03:30 · manhã 05:30 · deploy 05:50 · report 06:30.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGS_DIR = path.join(RAIZ, "docs", "relatorios-automacao", "logs");

// Tenta carregar variáveis de ambiente do scripts/.env
function carregarEnv() {
  const envPath = path.join(RAIZ, "scripts", ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const [, key, val] = match;
        if (!process.env[key]) {
          process.env[key] = val.trim();
        }
      }
    }
  }
}

carregarEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DIA_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/**
 * Lê o último log com o prefixo dado, decodificando UTF-16LE com BOM
 * (o padrão do Tee-Object) e UTF-8 sem BOM. Retorna texto limpo ou "".
 * Aceita somente logs do DIA de execução: log de ontem não conta como
 * "a rotina rodou hoje".
 */
function obterLogDoDia(prefixo: string): { texto: string; quando: string } {
  if (!fs.existsSync(LOGS_DIR)) return { texto: "", quando: "" };
  const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const arquivos = fs
    .readdirSync(LOGS_DIR)
    .filter((f) => f.startsWith(prefixo) && f.includes(hoje) && f.endsWith(".log"))
    .sort()
    .reverse();
  if (arquivos.length === 0) return { texto: "", quando: "" };
  try {
    const bruto = fs.readFileSync(path.join(LOGS_DIR, arquivos[0]));
    let texto: string;
    if (bruto[0] === 0xff && bruto[1] === 0xfe) {
      texto = bruto.toString("utf16le"); // BOM UTF-16LE do PowerShell
    } else if (bruto[0] === 0xef && bruto[1] === 0xbb && bruto[2] === 0xbf) {
      texto = bruto.subarray(3).toString("utf-8");
    } else {
      // sem BOM: UTF-16LE se os ímpares forem muitos zeros, senão UTF-8
      const cheiroUTF16 = bruto.length > 4 && bruto[1] === 0x00 && bruto[3] === 0x00;
      texto = cheiroUTF16 ? bruto.toString("utf16le") : bruto.toString("utf-8");
    }
    const m = arquivos[0].match(/(\d{2})-(\d{2})-\d{2}(?=\.log$)/);
    const quando = m ? `${m[1]}:${m[2]}` : "";
    return { texto, quando };
  } catch {
    return { texto: "", quando: "" };
  }
}

/** Primeira captura de regex no texto, ou null. */
function extrair(texto: string, re: RegExp): string | null {
  const m = texto.match(re);
  return m ? m[1] : null;
}

const SEM_REGISTRO = "⚠️ sem registro hoje — a rotina não rodou ou não logou";

interface Linha {
  emoji: string;
  nome: string;
  status: string;
  ok: boolean;
}

/** Cada linha abaixo lê APENAS o que o log correspondente diz. */
function montarRelatorio(): { linhas: Linha[]; mensagem: string } {
  const agora = new Date();
  const nomeDia = DIA_SEMANA[agora.getDay()];
  const dataFormatada = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const linhas: Linha[] = [];

  // 1. Páginas-modelo (01:00)
  {
    const { texto, quando } = obterLogDoDia("rotina-paginas_");
    if (!texto) {
      linhas.push({ emoji: "🗂️", nome: "Páginas-modelo", status: SEM_REGISTRO, ok: false });
    } else {
      const erros = (texto.match(/\bError\b|\berror TS|ABORTAD/gi) || []).length;
      linhas.push({
        emoji: "🗂️",
        nome: "Páginas-modelo",
        status: erros === 0 ? `validou os manifestos às ${quando}` : `${erros} ocorrências de erro no log (${quando})`,
        ok: erros === 0,
      });
    }
  }

  // 2. Notícias (02:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-noticias_");
    if (!texto) {
      linhas.push({ emoji: "📰", nome: "Notícias", status: SEM_REGISTRO, ok: false });
    } else {
      const itens = extrair(texto, /(\d+)\s+itens na janela/) ?? extrair(texto, /(\d+)\s+(?:novos?|itens)/);
      const vazia = /coleta vazia/i.test(texto);
      linhas.push({
        emoji: "📰",
        nome: "Notícias",
        status: vazia ? `rodada vazia (${quando}) — fonte muda ou janela sem matéria` : `${itens ?? "?"} itens na janela (${quando})`,
        ok: !vazia,
      });
    }
  }

  // 3. Coleta/madrugada — PicoClaw + LinkMender (03:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-madrugada_");
    if (!texto) {
      linhas.push({ emoji: "🦜", nome: "Fontes & links", status: SEM_REGISTRO, ok: false });
    } else {
      const resumo = extrair(
        texto,
        /Resumo:\s*(\d+)\s*URLs\s*\|\s*OK\s*(\d+)\s*\|\s*QUEBRADOS\s*(\d+)\s*\|\s*REDIRECTS\s*(\d+)(?:\s*\|\s*INCONSISTENTES\s*(\d+))?/i,
      ) ? texto.match(/Resumo:\s*(\d+)\s*URLs\s*\|\s*OK\s*(\d+)\s*\|\s*QUEBRADOS\s*(\d+)\s*\|\s*REDIRECTS\s*(\d+)(?:\s*\|\s*INCONSISTENTES\s*(\d+))?/i) : null;
      const propostas = extrair(texto, /propostas\s+(\d+)/i);
      if (resumo) {
        linhas.push({
          emoji: "🦜",
          nome: "Fontes & links",
          status: `${resumo[2]}/${resumo[1]} fontes OK, ${resumo[3]} quebradas, ${resumo[4]} redirects${resumo[5] ? `, ${resumo[5]} inconsistentes` : ""}; ${propostas ?? "0"} propostas de link (${quando})`,
          ok: Number(resumo[3]) <= 10,
        });
      } else {
        linhas.push({ emoji: "🦜", nome: "Fontes & links", status: `rodou às ${quando}, mas sem a linha de resumo no log`, ok: false });
      }
    }
  }

  // 4. Manhã — Hermes auditor/segurança (05:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-manha_");
    if (!texto) {
      linhas.push({ emoji: "🧠", nome: "Manhã (sondagem)", status: SEM_REGISTRO, ok: false });
    } else {
      const falhas = (texto.match(/FALHA[:\s]/g) || []).length;
      const sondadas = (texto.match(/Sondando/g) || []).length;
      linhas.push({
        emoji: "🧠",
        nome: "Manhã (sondagem)",
        status: `${sondadas} sondagens, ${falhas} falhas (${quando})`,
        ok: falhas === 0,
      });
    }
  }

  // 5. Autodeploy (05:50). O script ainda se chama "meianoite" por dentro —
  // moveu para as 05:50 em 04/09, e o nome do log veio junto. Quando o
  // executar-rotina-meianoite.ps1 for renomeado, ajustar o prefixo aqui.
  {
    const { texto, quando } = obterLogDoDia("rotina-autodeploy-meianoite_");
    if (!texto) {
      linhas.push({ emoji: "🚀", nome: "Deploy", status: SEM_REGISTRO, ok: false });
    } else {
      const abortado = /ABORTAD/i.test(texto);
      const concluida = /CONCLU[IÍ]DA/i.test(texto);
      linhas.push({
        emoji: "🚀",
        nome: "Deploy",
        status: abortado
          ? `⛔ build ou deploy FALHOU (${quando}) — o site continua na versão anterior`
          : concluida
            ? `verificação/publicação concluída às ${quando}`
            : `rodou às ${quando}, mas o log não fecha com conclusão`,
        ok: !abortado && concluida,
      });
    }
  }

  const sucessos = linhas.filter((l) => l.ok).length;
  const corpo = linhas.map((l) => `${l.emoji} <b>${l.nome}</b> / ${l.status}`).join("\n");
  const mensagem =
    `Bom dia! Relatório de ${nomeDia}, dia ${dataFormatada}\n\n${corpo}\n\n` +
    `<b>Status geral</b>: ${sucessos}/${linhas.length} rotinas redondas. ` +
    `Números lidos dos logs de hoje, nada de texto decorativo.`;
  return { linhas, mensagem };
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * POST com RETRY: 4 tentativas, backoff 10s → 30s → 90s. A conexão com o
 * Telegram API caiu às 06:30 de 04/09 e o relatório sumiu sem ninguém saber
 * (rc=0 mentia). Agora: esgotou a última tentativa → throw → exit != 0,
 * e o watchdog de hora em hora avisa e re-dispara.
 */
async function enviarTelegram(mensagem: string) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log("[Telegram] ⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados em scripts/.env.");
    console.log("Mensagem que seria enviada:\n\n" + mensagem);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const ESPERAS = [0, 10_000, 30_000, 90_000];
  let ultimoErro = "";

  for (let tentativa = 1; tentativa <= ESPERAS.length; tentativa++) {
    if (ESPERAS[tentativa - 1]) await delay(ESPERAS[tentativa - 1]);
    try {
      const controller = new AbortController();
      const temporizador = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: mensagem,
          parse_mode: "HTML",
        }),
        signal: controller.signal,
      });
      clearTimeout(temporizador);

      if (res.ok) {
        console.log(`✅ Relatório diário enviado com sucesso para o Telegram! (tentativa ${tentativa})`);
        return;
      }
      const errText = await res.text();
      ultimoErro = `HTTP ${res.status} - ${errText.slice(0, 200)}`;
      // 4xx de payload não adianta repetir (menssagem grande, chat ruim): sai na hora.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`Telegram rejeitou a mensagem: ${ultimoErro}`);
      }
      console.error(`⚠️ tentativa ${tentativa} falhou: ${ultimoErro}`);
    } catch (err) {
      if (err instanceof Error && /rejeitou a mensagem/.test(err.message)) throw err;
      ultimoErro = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`⚠️ tentativa ${tentativa} sem conexão: ${ultimoErro}`);
    }
  }
  throw new Error(`esgotadas as tentativas de entrega: ${ultimoErro}`);
}

async function main() {
  const { mensagem } = montarRelatorio();
  console.log(mensagem.replace(/<[^>]+>/g, ""));
  console.log("---");
  await enviarTelegram(mensagem);
}

main().catch((err) => {
  console.error("❌ relatório não entregue:", err instanceof Error ? err.message : err);
  process.exit(1);
});
