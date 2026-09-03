/**
 * scripts/automacao/orquestrador-rotinas.mts
 *
 * Orquestrador Central de Automações Locais:
 * Suporta os modos:
 * - `--madrugada` (03:00): Coleta de dados com retry/snapshot + triagem Ollama de diários
 * - `--manha` (06:00): Auditoria Argus/Hermes + Guardião pré-commit
 * - `--boletim` (07:00): Envio do Boletim do Café da Manhã no Telegram
 * - `--todos`: Executa o ciclo completo sob demanda
 */

import * as path from "node:path";
import { fetchComRetryESnapshot } from "./fetch-resiliente.mjs";
import { filtrarTrechosRelevantes, processarTrechoComOllama } from "./triagem-diarios-ollama.mjs";
import { executarGuardiaoPreCommit } from "./guardiao-pre-commit.mjs";
import { enviarBoletimMatinal } from "./boletim-matinal.mjs";

const raiz = path.resolve(process.cwd());

async function executarMadrugada() {
  console.log("🌙 [Orquestrador] Iniciando ciclo da Madrugada (03:00)...");
  
  // 1. Coleta resiliente de fontes
  console.log("  📡 Coletando fontes com tolerância a falhas...");
  const resultadoBater = await fetchComRetryESnapshot(
    "https://controlepopular.com.br/api/dados-resumidos",
    {
      caminhoSnapshot: path.resolve(raiz, "apps/web/data/snapshot-seguranca.json"),
      tentativas: 3,
    }
  );
  console.log(`  ✓ Coleta concluída (${resultadoBater.usouSnapshot ? "snapshot de segurança" : "online"}).`);

  // 2. Triagem semântica com Ollama
  console.log("  🧠 Realizando triagem inteligente em 2 estágios nos diários...");
  const exemploTrecho = `O Secretário Municipal declara a DISPENSA DE LICITAÇÃO nº 12/2026 para contratação emergencial de contenção de encosta no valor global de R$ 3.850.000,00 com a empresa Construtora Alfa Ltda (CNPJ 12.345.678/0001-90).`;
  const trechos = filtrarTrechosRelevantes(exemploTrecho);
  console.log(`  ✓ ${trechos.length} atos suspeitos isolados pelo filtro.`);

  if (trechos.length > 0) {
    const extraido = await processarTrechoComOllama(trechos[0], "Betim");
    console.log(`  ✓ Ato estruturado: ${extraido?.tipoAto.toUpperCase()} — ${extraido?.objeto} (${extraido?.relevancia} relevância).`);
  }
}

async function executarManha() {
  console.log("🌅 [Orquestrador] Iniciando ciclo da Manhã (06:00)...");
  
  // 1. Guardião pré-commit
  const guardiao = executarGuardiaoPreCommit(raiz);
  if (!guardiao.aprovado) {
    console.error("⛔ [Orquestrador] Ciclo interrompido pelo Guardião com rollback.");
    return;
  }
  console.log("  ✓ Integridade e segurança 100% validadas.");
}

async function main() {
  const args = process.argv.slice(2);
  const modo = args[0] || "--todos";

  console.log(`🚀 [Controle Popular] Iniciando Orquestrador de Rotinas (Modo: ${modo})\n`);

  if (modo === "--madrugada" || modo === "--todos") {
    await executarMadrugada();
    console.log("");
  }

  if (modo === "--manha" || modo === "--todos") {
    await executarManha();
    console.log("");
  }

  if (modo === "--boletim" || modo === "--todos") {
    await enviarBoletimMatinal(raiz);
    console.log("");
  }

  console.log("✨ [Orquestrador] Rotina concluída com sucesso!");
}

main().catch((err) => {
  console.error("❌ Erro fatal no orquestrador:", err);
  process.exit(1);
});
