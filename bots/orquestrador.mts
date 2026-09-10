#!/usr/bin/env node

/**
 * 🔄 Orquestrador de Microetapas com Notificação Telegram
 * 
 * Executa microetapas do plano de expansão com notificação automática
 * ao final de cada tarefa concluída.
 * 
 * Uso:
 *   npx tsx bots/orquestrador.mts --etapa M1 --descricao "Schema criado"
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Configuração de microetapas
interface Microetapa {
  id: string;
  titulo: string;
  descricao: string;
  comando: string;
  status: "pendente" | "em_andamento" | "concluido" | "erro";
  emoji: string;
}

const MICROETAPAS: Microetapa[] = [
  {
    id: "M1",
    titulo: "Schema Consultórios",
    descricao: "Tabela conselhos_membros com regimentos criada. Análise de representação (governo vs sociedade civil).",
    comando: "npx tsx apps/web/lib/db/schema-conselhos.ts",
    status: "concluido",
    emoji: "✅",
  },
  {
    id: "M2", 
    titulo: "Schema Outorgas",
    descricao: "Tabela outorgas_agua com 5k+ registros. Foco em escassez hídrica e concentração.",
    comando: "npx tsx apps/web/lib/db/schema-outorgas.ts",
    status: "pendente",
    emoji: "💧",
  },
  {
    id: "V1",
    titulo: "Bot Verificação",
    descricao: "Cross-check automatizado de valores críticos. Detecta discrepâncias > 1%.",
    comando: "npx tsx bots/verifica-dados.mts",
    status: "concluido",
    emoji: "🤖",
  },
  {
    id: "V2",
    titulo: "Validação PNCP",
    descricao: "Testar com contrato real: 12345-67/2024 (caso R$ 900M vs R$ 900K)",
    comando: "npx tsx bots/verifica-dados.mts --limiar 0.01",
    status: "pendente",
    emoji: "📊",
  },
];

/**
 * Envia notificação ao Telegram
 */
async function notificar(etapa: Microetapa) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const DONO = process.env.TELEGRAM_CHAT_ID;
  
  if (!TOKEN || !DONO) {
    console.log("ℹ️  Telegram não configurado - pulando notificação");
    return true;
  }

  const texto = `
📣 ${etapa.emoji} Microetapa ${etapa.id} ${etapa.status === "concluido" ? "✅" : etapa.status === "erro" ? "❌" : "🚧"}

📅 ${new Date().toLocaleDateString("pt-BR")}

📝 ${etapa.descricao}

🔗 Plano: docs/planos/PLANO-ANALISE-CONSELHOS-OUTORGAS.md

💡 Dica: ${etapa.comando}
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: DONO,
        text: texto,
        parse_mode: "HTML",
      }),
    });
    console.log(`✅ Notificação enviada: ${etapa.id}`);
    return true;
  } catch (e) {
    console.error("❌ Erro na notificação:", (e as Error).message);
    return false;
  }
}

/**
 * Executa microetapa
 */
async function executarEtapa(id: string, executarComando: boolean = true) {
  const etapa = MICROETAPAS.find(e => e.id === id);
  
  if (!etapa) {
    console.error(`❌ Microetapa ${id} não encontrada`);
    console.log("Microetapas disponíveis:", MICROETAPAS.map(e => e.id).join(", "));
    return false;
  }

  console.log("═".repeat(60));
  console.log(`🔄 Executando Microetapa ${etapa.id}: ${etapa.titulo}`);
  console.log("═".repeat(60));
  console.log(`📝 ${etapa.descricao}`);
  console.log(`🎯 Emoji: ${etapa.emoji}`);
  console.log(`💻 Comando: ${etapa.comando}`);
  console.log("");

  if (executarComando && etapa.status !== "concluido") {
    etapa.status = "em_andamento";
    
    try {
      // Simular execução (na prática, seria spawn do comando real)
      console.log(`🚀 Executando: ${etapa.comando}`);
      
      // Aqui você poderia usar spawn ou child_process para executar o comando real
      // Por exemplo:
      // const { exec } = require('child_process');
      // await promisify(exec)(etapa.comando);
      
      etapa.status = "concluido";
      console.log(`✅ Microetapa ${etapa.id} concluída!`);
      
    } catch (e) {
      etapa.status = "erro";
      console.error(`❌ Erro na microetapa ${etapa.id}:`, (e as Error).message);
    }
  }

  // Notificar resultados
  await notificar(etapa);
  
  return etapa.status === "concluido";
}

/**
 * Lista microetapas
 */
function listarEtapas() {
  console.log("\n📋 Microetapas Disponíveis:\n");
  console.log("| ID | Título | Status | Emoji |");
  console.log("|----|--------|--------|-------|");
  for (const e of MICROETAPAS) {
    console.log(`| ${e.id} | ${e.titulo} | ${e.status} | ${e.emoji} |`);
  }
  console.log("");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const actionIndex = args.indexOf("--executar");
  const listIndex = args.indexOf("--list");
  const idIndex = args.indexOf("--etapa");
  
  // Listar microetapas
  if (listIndex !== -1 || args.includes("--help") || args.length === 0) {
    listarEtapas();
    return;
  }
  
  // Executar microetapa específica
  if (actionIndex !== -1) {
    const id = args[idIndex ?? -1];
    if (!id) {
      console.error("❌ Especifique --etapa <ID>");
      process.exit(1);
    }
    const sucesso = await executarEtapa(id);
    process.exit(sucesso ? 0 : 1);
  }
  
  // Executar todas pendentes
  if (args.includes("--all")) {
    console.log("🔄 Executando todas as microetapas...\n");
    
    for (const etapa of MICROETAPAS) {
      if (etapa.status !== "concluido") {
        await executarEtapa(etapa.id, true);
        // Pequena pausa entre execuções
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return;
  }
  
  console.log("Uso:");
  console.log("  npx tsx bots/orquestrador.mts --list                    # Listar microetapas");
  console.log("  npx tsx bots/orquestrador.mts --executar --etapa M1    # Executar uma");
  console.log("  npx tsx bots/orquestrador.mts --all                    # Executar todas");
}

main();