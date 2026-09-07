#!/usr/bin/env node
/**
 * scripts/enviar-report-andamento-telegram.mts
 *
 * Envia relatório do andamento das implementações e auditorias do portal
 * diretamente para o Telegram do dono.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function enviarTelegram(texto: string) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN ou CHAT_ID não configurados. Texto:");
    console.log(texto);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: texto,
      parse_mode: "HTML",
    }),
  });

  if (res.ok) {
    console.log("✅ Relatório de andamento enviado com sucesso para o Telegram!");
  } else {
    const err = await res.text();
    console.error(`⚠️ Falha ao enviar para o Telegram: ${res.status} - ${err}`);
  }
}

async function main() {
  const customMsg = process.argv.slice(2).join(" ").trim();
  if (customMsg) {
    await enviarTelegram(customMsg);
    return;
  }

  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  let msg = `📊 <b>Controle Popular — Relatório de Andamento</b>\n`;
  msg += `📅 <i>Horário: ${agora}</i>\n\n`;

  msg += `✅ <b>1. Tema e Visual da Capa</b>\n`;
  msg += `• Tema padrão definido para 'pequi' sem flash visual.\n`;
  msg += `• Faixa da navbar mais lenta (75s) com pausa ao passar o mouse.\n`;
  msg += `• Foto da capa da home restaurada: texto com contorno preto nítido sobre vidro fosco sutil, mantendo a foto vibrante.\n\n`;

  msg += `🧭 <b>2. Navbar por Eixos Temáticos</b>\n`;
  msg += `• Menu reestruturado nos 3 Eixos + Central com cores e ícones Lucide.\n`;
  msg += `• 🔴 Direitos | 🟢 Terra | 🔵 Estado | 🟠 Central.\n\n`;

  msg += `🏛️ <b>3. Fichas das Instituições de Justiça</b>\n`;
  msg += `• 7 órgãos mapeados com organograma, contatos, orçamento, corregedoria e ouvidoria:\n`;
  msg += `  TJMG, MPMG, DPMG, TRT-3, TRF-6, DPU e TCE-MG.\n`;
  msg += `• Rota: <code>/judiciario/instituicoes/[sigla]</code> com cartões interativos.\n\n`;

  msg += `🔗 <b>4. Hiperlinks nas 199 Cidades</b>\n`;
  msg += `• Integração de fontes oficiais cruzadas (PNCP, DATASUS, ComunicaBR, INEP, IBGE, LAI).\n\n`;

  msg += `💰 <b>5. Total Monitorado na Home</b>\n`;
  msg += `• Métrica atualizada para <b>R$ 251 bi</b> com somatória exata e discriminada:\n`;
  msg += `  Rio Doce (R$ 171 bi) + Brumadinho (R$ 37,7 bi) + Justiça MG (R$ 20,1 bi) + cidades monitoradas (R$ 22,7 bi).\n\n`;

  msg += `🗄️ <b>6. Banco de Dados (Neon / Postgres)</b>\n`;
  msg += `• Diagnóstico concluído: 83 tabelas ativas, 166 ms de latência, migrações críticas validadas e banco pronto para produção.\n\n`;

  msg += `🚀 <b>Próximos passos</b>: Build de produção, testes finais e deploy.`;

  await enviarTelegram(msg);
}

main().catch(console.error);
