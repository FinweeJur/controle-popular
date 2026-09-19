#!/usr/bin/env node
/**
 * scripts/enviar-relatorio-telegram.mts
 *
 * Coleta os logs e métricas reais das rotinas automáticas da esteira noturna,
 * do Vigia do Servidor e das Coletas Ambientais (ONSA), gerando o relatório
 * matinal detalhado com links clicáveis para as páginas impactadas do portal.
 *
 * Diretrizes (AGENTS.md):
 * - Frases curtas, oração direta, uma ideia por linha.
 * - Emojis para guiar o olho (✅, 🌐, 🤖, 🌍, 📊, ⚠️, ❌).
 * - Termo técnico com explicação na frente.
 * - Números reais extraídos diretamente dos logs e acervos (lacuna é informação).
 * - Links diretos em HTML (<a href="...">...</a>) para as páginas do portal.
 * - Suporte a divisão de mensagens no Telegram para respeitar o limite de 4096 caracteres.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGS_DIR = path.join(RAIZ, "docs", "relatorios-automacao", "logs");
const DATA_DIR = path.join(RAIZ, "apps", "web", "data");
const BASE_URL = "https://controlepopular.com.br";

function carregarEnv() {
  const envPath = path.join(RAIZ, "scripts", ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const [, key, rawVal] = match;
        const val = rawVal.trim().replace(/^["']|["']$/g, "").replace(/\r$/, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

carregarEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DIA_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const SEM_REGISTRO = "sem registro hoje — rotina não rodou ou não logou";

/**
 * Lê o último log com o prefixo dado no dia atual (UTF-16LE ou UTF-8).
 */
function obterLogDoDia(prefixo: string): { texto: string; quando: string } {
  if (!fs.existsSync(LOGS_DIR)) return { texto: "", quando: "" };
  const hoje = new Date().toISOString().slice(0, 10);
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
      texto = bruto.toString("utf16le");
    } else if (bruto[0] === 0xef && bruto[1] === 0xbb && bruto[2] === 0xbf) {
      texto = bruto.subarray(3).toString("utf-8");
    } else {
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

/**
 * Lê as últimas linhas de um log contínuo (ex: radar de editais ou atos de pessoal).
 */
function obterUltimasLinhasLog(nomeArquivo: string, maxLinhas = 30): string[] {
  const caminho = path.join(LOGS_DIR, nomeArquivo);
  if (!fs.existsSync(caminho)) return [];
  try {
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const linhas = conteudo.split("\n").map((l) => l.trim()).filter(Boolean);
    return linhas.slice(-maxLinhas);
  } catch {
    return [];
  }
}

/** Extrai regex no texto ou retorna null. */
function extrair(texto: string, re: RegExp): string | null {
  const m = texto.match(re);
  return m ? m[1] : null;
}

/**
 * Lê cabeçalhos de arquivos JSON em apps/web/data de forma ultrarrápida (Buffer 8KB),
 * sem carregar arquivos pesados de centenas de MB na memória.
 */
function lerMetadadosJson(caminhoRelativo: string): { total: number | null; geradoEm: string | null } {
  const caminho = path.join(DATA_DIR, caminhoRelativo);
  if (!fs.existsSync(caminho)) return { total: null, geradoEm: null };
  try {
    const fd = fs.openSync(caminho, "r");
    const buf = Buffer.alloc(8192);
    const bytesLidos = fs.readSync(fd, buf, 0, 8192, 0);
    fs.closeSync(fd);
    const str = buf.subarray(0, bytesLidos).toString("utf8");

    const mTotal = str.match(
      /"(?:total|total_disponivel|total_fonte|total_linhas_fonte|total_processos_fonte)"\s*:\s*(\d+)/
    );
    const mGerado = str.match(/"gerado_em"\s*:\s*"([^"]+)"/);

    return {
      total: mTotal ? parseInt(mTotal[1], 10) : null,
      geradoEm: mGerado ? mGerado[1] : null,
    };
  } catch {
    return { total: null, geradoEm: null };
  }
}

/**
 * 1. Métricas do Vigia do Servidor
 */
function obterStatusVigia() {
  const statusFile = path.join(RAIZ, "docs", "relatorios-automacao", "vigia-servidor-status.json");
  const reiniciosFile = path.join(RAIZ, "scripts", ".vigia-reinicios.json");
  const hoje = new Date().toISOString().slice(0, 10);

  let status = {
    producaoOk: false,
    producaoStatus: 0,
    latenciaMs: 0,
    atualizadoEm: "",
    erro: null as string | null,
  };

  if (fs.existsSync(statusFile)) {
    try {
      status = JSON.parse(fs.readFileSync(statusFile, "utf-8"));
    } catch {}
  }

  let reiniciosHoje = 0;
  if (fs.existsSync(reiniciosFile)) {
    try {
      const reinicios = JSON.parse(fs.readFileSync(reiniciosFile, "utf-8"));
      if (Array.isArray(reinicios)) {
        reiniciosHoje = reinicios.filter((r: any) => typeof r === "string" && r.startsWith(hoje)).length;
      }
    } catch {}
  }

  let horaVerificacao = "";
  if (status.atualizadoEm) {
    try {
      horaVerificacao = new Date(status.atualizadoEm).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    } catch {}
  }

  return {
    ...status,
    reiniciosHoje,
    horaVerificacao,
  };
}

/**
 * 2. Métricas dos Acervos Ambientais (ONSA)
 */
function obterMetricasAmbientais() {
  // Licenças: soma dos 15 arquivos estaduais/federais
  let totalLicencas = 0;
  let basesLicencas = 0;
  try {
    const arquivosLicenca = fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.includes("licenca") && f.endsWith(".json"));
    for (const arq of arquivosLicenca) {
      const meta = lerMetadadosJson(arq);
      if (meta.total) {
        totalLicencas += meta.total;
        basesLicencas++;
      }
    }
  } catch {}

  const metaAutos = lerMetadadosJson("ibama-autos-infracao.json");
  const metaOutorgasAna = lerMetadadosJson("ana-outorgas.json");
  const metaOutorgasIgam = lerMetadadosJson("igam-outorgas.json");
  const metaMineracao = lerMetadadosJson("sigmine-nacional.json");

  const totalOutorgas = (metaOutorgasAna.total ?? 0) + (metaOutorgasIgam.total ?? 0);

  return {
    licencas: {
      total: totalLicencas,
      bases: basesLicencas,
    },
    autosInfracao: {
      total: metaAutos.total ?? 0,
      geradoEm: metaAutos.geradoEm,
    },
    outorgas: {
      total: totalOutorgas,
      ana: metaOutorgasAna.total ?? 0,
      igam: metaOutorgasIgam.total ?? 0,
    },
    mineracao: {
      total: metaMineracao.total ?? 0,
      geradoEm: metaMineracao.geradoEm,
    },
  };
}

interface ItemRotina {
  emoji: string;
  nome: string;
  url: string;
  urlTexto: string;
  status: string;
  ok: boolean;
}

/**
 * Monta o relatório matinal consolidado em formato HTML.
 */
function montarRelatorio(): { mensagem: string; totalRotinas: number; sucessosRotinas: number } {
  const agora = new Date();
  const nomeDia = DIA_SEMANA[agora.getDay()];
  const dataFormatada = agora.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const horaFormatada = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  // --- BLOCO 1: FAROL (VIGIA DO SERVIDOR) ---
  const vigia = obterStatusVigia();
  const statusServidorEmoji = vigia.producaoOk ? "🟢" : vigia.producaoStatus === 502 ? "🔴" : "⚠️";
  const statusServidorTexto = vigia.producaoOk
    ? `Online (HTTP 200) · latência ${vigia.latenciaMs}ms`
    : `Alerta HTTP ${vigia.producaoStatus || "Indisponível"} · latência ${vigia.latenciaMs}ms`;

  const blocoVigia = [
    `🌐 <b>Farol</b> (<a href="${BASE_URL}/">Pagina Inicial</a>)`,
    `• Status: ${statusServidorEmoji} ${statusServidorTexto}`,
    `• Última medição: ${vigia.horaVerificacao || "registrada nesta manhã"}`,
    `• Intervenções do watchdog: ${vigia.reiniciosHoje > 0 ? `⚠️ ${vigia.reiniciosHoje} reinício(s) hoje` : "0 (estável)"}`,
  ].join("\n");

  // --- BLOCO 2: ROTINAS E BOTS DA ESTEIRA ---
  const rotinas: ItemRotina[] = [];

  // 1. Páginas-modelo (01:00)
  {
    const { texto, quando } = obterLogDoDia("rotina-paginas_");
    if (!texto) {
      rotinas.push({
        emoji: "🗂️",
        nome: "Páginas-Modelo",
        url: `${BASE_URL}/`,
        urlTexto: "Home",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const erros = (texto.match(/\bError\b|\berror TS|ABORTAD/gi) || []).length;
      rotinas.push({
        emoji: "🗂️",
        nome: "Páginas-Modelo",
        url: `${BASE_URL}/`,
        urlTexto: "Home",
        status:
          erros === 0
            ? `manifestos e rotas validados com sucesso (${quando})`
            : `${erros} erro(s) encontrados no log (${quando})`,
        ok: erros === 0,
      });
    }
  }

  // 2. Notícias cívicas (02:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-noticias_");
    if (!texto) {
      rotinas.push({
        emoji: "📰",
        nome: "Coleta de Notícias",
        url: `${BASE_URL}/noticias`,
        urlTexto: "Notícias",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const itens =
        extrair(texto, /(\d+)\s+itens na janela/) ?? extrair(texto, /(\d+)\s+(?:novos?|itens)/);
      const vazia = /coleta vazia/i.test(texto);
      rotinas.push({
        emoji: "📰",
        nome: "Coleta de Notícias",
        url: `${BASE_URL}/noticias`,
        urlTexto: "Notícias",
        status: vazia
          ? `rodada vazia (${quando}) — sem matérias inéditas`
          : `${itens ?? "0"} matérias processadas na janela (${quando})`,
        ok: !vazia,
      });
    }
  }

  // 3. Fontes e integridade de links (03:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-madrugada_");
    if (!texto) {
      rotinas.push({
        emoji: "🦜",
        nome: "Radar & Links",
        url: `${BASE_URL}/fontes`,
        urlTexto: "Fontes",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const resumo = texto.match(
        /Resumo:\s*(\d+)\s*URLs\s*\|\s*OK\s*(\d+)\s*\|\s*QUEBRADOS\s*(\d+)\s*\|\s*REDIRECTS\s*(\d+)(?:\s*\|\s*INCONSISTENTES\s*(\d+))?/i
      );
      const propostas = extrair(texto, /propostas\s+(\d+)/i);
      if (resumo) {
        rotinas.push({
          emoji: "🦜",
          nome: "Radar & Links",
          url: `${BASE_URL}/fontes`,
          urlTexto: "Fontes",
          status: `${resumo[2]}/${resumo[1]} URLs ativas, ${resumo[3]} quebradas, ${propostas ?? "0"} correções propostas (${quando})`,
          ok: Number(resumo[3]) <= 15,
        });
      } else {
        rotinas.push({
          emoji: "🦜",
          nome: "Radar & Links",
          url: `${BASE_URL}/fontes`,
          urlTexto: "Fontes",
          status: `executou às ${quando} (sem sumário no log)`,
          ok: true,
        });
      }
    }
  }

  // 4. Radar de Editais (04:20)
  {
    const linhasRadar = obterUltimasLinhasLog("rotina-radar-editais.log", 20);
    const ultimaLinhaRadar = linhasRadar.reverse().find((l) => l.includes("[radar-editais] edição="));
    if (!ultimaLinhaRadar) {
      rotinas.push({
        emoji: "📡",
        nome: "Radar de Editais",
        url: `${BASE_URL}/noticias`,
        urlTexto: "Radar",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const edicao = extrair(ultimaLinhaRadar, /edição=(\S+)/);
      const candidatos = extrair(ultimaLinhaRadar, /candidatos=(\d+)/);
      const gravados = extrair(ultimaLinhaRadar, /gravados=(\d+)/);
      rotinas.push({
        emoji: "📡",
        nome: "Radar de Editais",
        url: `${BASE_URL}/noticias`,
        urlTexto: "Radar",
        status: `DOM-MG ${edicao ?? "recente"}: ${candidatos ?? "0"} encontrados, ${gravados ?? "0"} novos arquivados`,
        ok: true,
      });
    }
  }

  // 5. Atos de Pessoal (05:05)
  {
    const linhasAtos = obterUltimasLinhasLog("rotina-atos-pessoal.log", 10);
    const ultimaLinhaAtos = linhasAtos.reverse()[0];
    if (!ultimaLinhaAtos) {
      rotinas.push({
        emoji: "⚖️",
        nome: "Atos de Pessoal",
        url: `${BASE_URL}/judiciario`,
        urlTexto: "Judiciário",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const indisponivel = /indispon[íi]vel/i.test(ultimaLinhaAtos);
      const abortado = /abortad|timeout/i.test(ultimaLinhaAtos);
      rotinas.push({
        emoji: "⚖️",
        nome: "Atos de Pessoal",
        url: `${BASE_URL}/judiciario`,
        urlTexto: "Judiciário",
        status: indisponivel
          ? "diário oficial do dia ainda indisponível na fonte"
          : abortado
            ? "tempo limite excedido ao consultar diário"
            : ultimaLinhaAtos.replace(/^\[atos-pessoal\]\s*/, ""),
        ok: !abortado,
      });
    }
  }

  // 6. Manha & Olho (05:30)
  {
    const { texto, quando } = obterLogDoDia("rotina-manha_");
    if (!texto) {
      rotinas.push({
        emoji: "🧠",
        nome: "Escudo & Olho",
        url: `${BASE_URL}/sobre`,
        urlTexto: "Sobre",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const falhas = (texto.match(/FALHA[:\s]/g) || []).length;
      const sondadas = (texto.match(/Sondando/g) || []).length;
      rotinas.push({
        emoji: "🧠",
        nome: "Escudo & Olho",
        url: `${BASE_URL}/sobre`,
        urlTexto: "Sobre",
        status: `${sondadas} verificações de integridade, ${falhas} alertas (${quando})`,
        ok: falhas === 0,
      });
    }
  }

  // 7. Autodeploy (05:50)
  {
    const { texto, quando } = obterLogDoDia("rotina-autodeploy-meianoite_");
    if (!texto) {
      rotinas.push({
        emoji: "🚀",
        nome: "Deploy Cloudflare",
        url: `${BASE_URL}/`,
        urlTexto: "Portal",
        status: SEM_REGISTRO,
        ok: false,
      });
    } else {
      const abortado = /ABORTAD/i.test(texto);
      const concluida = /CONCLU[IÍ]DA/i.test(texto);
      rotinas.push({
        emoji: "🚀",
        nome: "Deploy Cloudflare",
        url: `${BASE_URL}/`,
        urlTexto: "Portal",
        status: abortado
          ? `⛔ Falha no build/deploy (${quando})`
          : concluida
            ? `publicação concluída com sucesso às ${quando}`
            : `executou às ${quando} sem fechamento de conclusão`,
        ok: !abortado && concluida,
      });
    }
  }

  const sucessosRotinas = rotinas.filter((r) => r.ok).length;
  const linhasRotinas = rotinas
    .map((r) => `${r.emoji} <b>${r.nome}</b> (<a href="${r.url}">${r.urlTexto}</a>)\n   └ ${r.status}`)
    .join("\n");

  // --- BLOCO 2.5: DETALHES DOS ERROS POR BOT ---
  const blocosErros: string[] = [];

  // Escudo: alertas e falhas detalhados
  try {
    const hermes = JSON.parse(
      fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "hermes-auditoria-seguranca.json"), "utf-8")
    );
    const alertas = (hermes.itens || []).filter((i: { status: string }) => i.status === "ALERTA");
    const falhas = (hermes.itens || []).filter((i: { status: string }) => i.status === "FALHA");
    if (alertas.length > 0 || falhas.length > 0) {
      const linhas: string[] = [`🛡️ <b>Escudo (Seguranca) — ${alertas.length} alertas, ${falhas.length} falhas</b>`];
      for (const a of alertas.slice(0, 5)) {
        linhas.push(`   ⚠️ <b>${a.item}</b>: ${a.detalhes.slice(0, 120)}`);
      }
      for (const f of falhas.slice(0, 5)) {
        linhas.push(`   ❌ <b>${f.item}</b>: ${f.detalhes.slice(0, 120)}`);
      }
      blocosErros.push(linhas.join("\n"));
    }
  } catch {}

  // Olho: resumo de falhas (se houver padrao dominante)
  try {
    const argus = JSON.parse(
      fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "argus-paginas-status.json"), "utf-8")
    );
    const falhas = (argus.resultados || []).filter((r: { veredito: string }) => r.veredito === "FALHA");
    if (falhas.length > 0) {
      // Contar status codes únicos
      const porStatus: Record<number, number> = {};
      for (const f of falhas) {
        porStatus[f.status] = (porStatus[f.status] || 0) + 1;
      }
      const resumo = Object.entries(porStatus)
        .map(([code, qtd]) => `HTTP ${code}: ${qtd}`)
        .join(", ");
      blocosErros.push(
        `👁️ <b>Olho (Paginas)</b>: ${falhas.length}/${argus.total} rotas com falha\n   └ ${resumo}`
      );
    }
  } catch {}

  // Radar: fontes com falha detalhada
  try {
    const pico = JSON.parse(
      fs.readFileSync(path.join(RAIZ, "docs", "relatorios-automacao", "picoclaw-fontes-status.json"), "utf-8")
    );
    const comFalha = (pico.resultados || []).filter((r: { ok: boolean }) => !r.ok);
    if (comFalha.length > 0) {
      const linhas: string[] = [`📡 <b>Radar (Fontes) — ${comFalha.length} fonte(s) com falha</b>`];
      for (const f of comFalha.slice(0, 5)) {
        const detalhe = f.erro || `HTTP ${f.statusHttp}`;
        linhas.push(`   ❌ <b>${f.nome}</b>: ${detalhe}`);
      }
      blocosErros.push(linhas.join("\n"));
    }
  } catch {}

  // --- BLOCO 3: COLETAS AMBIENTAIS (ONSA) ---
  const ambiental = obterMetricasAmbientais();
  const blocoAmbiental = [
    `🌍 <b>Acervos Ambientais (ONSA)</b>`,
    `• <b>Licenciamento</b>: ${ambiental.licencas.total.toLocaleString("pt-BR")} licenças em ${ambiental.licencas.bases} bases (<a href="${BASE_URL}/ambiental/licenciamento">Licenças</a>)`,
    `• <b>Infrações IBAMA</b>: ${ambiental.autosInfracao.total.toLocaleString("pt-BR")} autos e embargos (<a href="${BASE_URL}/ambiental/crimes-socioambientais">Infrações</a>)`,
    `• <b>Recursos Hídricos</b>: ${ambiental.outorgas.total.toLocaleString("pt-BR")} outorgas ANA/IGAM (<a href="${BASE_URL}/nossos-rios">Nossos Rios</a>)`,
    `• <b>Mineração & Serras</b>: ${ambiental.mineracao.total.toLocaleString("pt-BR")} processos SIGMINE (<a href="${BASE_URL}/ambiental/barragens">Barragens</a> · <a href="${BASE_URL}/nossas-serras">Serras</a>)`,
  ].join("\n");

  // --- BLOCO 4: RESUMO GERAL ---
  const blocoErros = blocosErros.length > 0 ? blocosErros.join("\n\n") : "";
  const mensagem = [
    `☀️ <b>Bom dia, Artur! Relatório Matinal do Controle Popular</b>`,
    `📅 <i>${nomeDia}, ${dataFormatada} às ${horaFormatada}</i>`,
    ``,
    blocoVigia,
    ``,
    `🤖 <b>Rotinas e Bots da Madrugada</b>`,
    linhasRotinas,
    ``,
    blocoAmbiental,
    ``,
    blocoErros ? `🔎 <b>Detalhes dos Erros</b>\n${blocoErros}\n` : "",
    `📊 <b>Placar Geral</b>: ${sucessosRotinas}/${rotinas.length} rotinas operando normalmente.`,
    `<i>Dados reais extraídos diretamente dos logs e acervos locais.</i>`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    mensagem,
    totalRotinas: rotinas.length,
    sucessosRotinas,
  };
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Envia uma mensagem via Telegram Bot API com retentativas e backoff exponencial.
 */
async function enviarMensagemSimples(texto: string, tentativaMax = 4): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log("[Telegram] ⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados em scripts/.env.");
    console.log("Mensagem que seria enviada:\n\n" + texto);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const ESPERAS = [0, 10_000, 30_000, 90_000];
  let ultimoErro = "";

  for (let tentativa = 1; tentativa <= tentativaMax; tentativa++) {
    if (ESPERAS[tentativa - 1]) await delay(ESPERAS[tentativa - 1]);
    try {
      const controller = new AbortController();
      const temporizador = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: texto,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(temporizador);

      if (res.ok) {
        return;
      }

      const errText = await res.text();
      ultimoErro = `HTTP ${res.status} - ${errText.slice(0, 200)}`;
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

  throw new Error(`Esgotadas as tentativas de entrega no Telegram: ${ultimoErro}`);
}

/**
 * Envia o relatório diário. Se ultrapassar o limite seguro de 3.900 caracteres,
 * divide inteligentemente por blocos preservando formatação HTML.
 */
async function enviarTelegram(mensagem: string) {
  const LIMITE_PARTE = 3900;
  if (mensagem.length <= LIMITE_PARTE) {
    await enviarMensagemSimples(mensagem);
    console.log("✅ Relatório matinal enviado com sucesso para o Telegram!");
    return;
  }

  console.log(`ℹ️ Mensagem grande (${mensagem.length} caracteres). Dividindo em partes...`);
  const blocos = mensagem.split("\n\n");
  const partes: string[] = [];
  let parteAtual = "";

  for (const bloco of blocos) {
    if ((parteAtual + "\n\n" + bloco).length > LIMITE_PARTE) {
      if (parteAtual) partes.push(parteAtual.trim());
      parteAtual = bloco;
    } else {
      parteAtual = parteAtual ? `${parteAtual}\n\n${bloco}` : bloco;
    }
  }
  if (parteAtual) partes.push(parteAtual.trim());

  for (let i = 0; i < partes.length; i++) {
    console.log(`📤 Enviando parte ${i + 1}/${partes.length}...`);
    await enviarMensagemSimples(partes[i]);
    if (i < partes.length - 1) await delay(1000);
  }
  console.log("✅ Todas as partes do relatório foram entregues com sucesso!");
}

async function main() {
  const { mensagem } = montarRelatorio();
  console.log(mensagem.replace(/<[^>]+>/g, ""));
  console.log("---");
  await enviarTelegram(mensagem);
}

main().catch((err) => {
  console.error("❌ Relatório não entregue:", err instanceof Error ? err.message : err);
  process.exit(1);
});

