#!/usr/bin/env node

/**
 * 🤖 Bot de Notificação — Microresumos ao Telegram
 * 
 * Envio automático de microresumos para o dono do projeto.
 * Usado a cada conclusão de microetapa.
 * 
 * Uso:
 *   npx tsx bots/notifica-telegram.mts "Título: Resumo..." --imagem /caminho/para/imagem.jpg
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");

// Carregar variáveis de ambiente
function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const conteudo = fs.readFileSync(ENV_PATH, "utf-8");
  for (const linha of conteudo.split(/\r?\n/)) {
    const m = linha.match(/^\s*(\w+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

carregarEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DONO = process.env.TELEGRAM_CHAT_ID;

interface Notificacao {
  titulo: string;
  resumo: string;
  status: "concluido" | "alerta" | "em_andamento";
  emoji?: string;
  imagem?: string; // caminho local
  botoes?: Array<{ texto: string; url: string }>;
}

/**
 * Formata data brasileira
 */
function dataBrasileira(): string {
  const d = new Date();
  return d.toLocaleDateString("pt-BR");
}

/**
 * Envia mensagem (simples ou com foto)
 */
async function enviar(notificacao: Notificacao): Promise<boolean> {
  if (!TOKEN || !DONO) {
    console.error("❌ TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes");
    return false;
  }

  const emoji = notificacao.emoji ?? "✅";
  
  // Montar texto formatado
  let texto = `📣 ${emoji} ${notificacao.titulo}\n\n`;
  texto += `📅 ${dataBrasileira()}\n\n`;
  texto += `📝 ${notificacao.resumo}\n\n`;
  texto += `Status: ${notificacao.status.toUpperCase()}`;
  
  // Adicionar botões se fornecidos
  if (notificacao.botoes && notificacao.botoes.length > 0) {
    texto += `\n\n🔗 Úteis:`;
    for (const btn of notificacao.botoes) {
      texto += `\n• ${btn.texto}`;
    }
  }

  try {
    // Se tem imagem, envia como foto
    if (notificacao.imagem && fs.existsSync(notificacao.imagem)) {
      const fotoBuffer = fs.readFileSync(notificacao.imagem);
      const fotoBase64 = fotoBuffer.toString("base64");
      
      // Nota: para envio real, usaria multipart/form-data
      // Aqui simplificamos para envio de texto
      console.log(`📸 Imagem disponível em: ${notificacao.imagem}`);
    }
    
    // Enviar mensagem
    const resposta = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: DONO,
        text: texto,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    
    if (!resposta.ok) {
      console.error(`❌ Falha no envio: HTTP ${resposta.status}`);
      return false;
    }
    
    console.log(`✅ Notificação enviada para ${DONO}`);
    return true;
    
  } catch (e) {
    console.error("❌ Erro no envio:", (e as Error).message);
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  // Parse de argumentos
  let titulo = "";
  let resumo = "";
  let status: "concluido" | "alerta" | "em_andamento" = "em_andamento";
  let emoji = "📋";
  let imagem = "";
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--titulo" && i + 1 < args.length) {
      titulo = args[++i];
    } else if (arg === "--resumo" && i + 1 < args.length) {
      resumo = args[++i];
    } else if (arg === "--status" && i + 1 < args.length) {
      status = args[++i] as any;
    } else if (arg === "--emoji" && i + 1 < args.length) {
      emoji = args[++i];
    } else if (arg === "--imagem" && i + 1 < args.length) {
      imagem = args[++i];
    }
  }
  
  // Se passou texto direto como argumento, usa como resumo
  const textoDireto = args.find(a => !a.startsWith("--"));
  if (textoDireto && !titulo && !resumo) {
    resumo = textoDireto;
    titulo = "Microetapa Concluída";
  }
  
  if (!titulo || !resumo) {
    console.error("Uso: npx tsx bots/notifica-telegram.mts --titulo \"X\" --resumo \"Y\" --status concluido");
    console.error("   ou: npx tsx bots/notifica-telegram.mts \"Resumo direto\"");
    process.exit(1);
  }
  
  const ok = await enviar({ titulo, resumo, status, emoji, imagem });
  process.exit(ok ? 0 : 1);
}

main();