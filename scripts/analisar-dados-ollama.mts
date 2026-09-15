#!/usr/bin/env node
/**
 * 🤖 Seu Nono RAG Offline — Análise de dados via Ollama
 *
 * Faz análises sociais/ambientais de dados coletados usando modelo local (llama3.2:3b).
 * Funciona offline entre 03:00-05:00 (site downtime) — não sobrecarrega o PC.
 *
 * Integração:
 * - Input: apps/web/data/*.json (coletas do dia)
 * - Output: apps/web/data/analises-ollama/{slug}.json
 * - Trigger: cronjob entre 3h-5h (fora horário de pico)
 *
 * Uso:
 *   npx tsx scripts/analisar-dados-ollama.mts --modelo llama3.2:3b
 *   npx tsx scripts/analisar-dados-ollama.mts --modelo deepseek-r1:8b --fonte dados.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "apps", "web");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT_DIR = path.join(DATA_DIR, "analises-ollama");

interface Args {
  modelo: string;
  fonte?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const modeloIdx = args.indexOf("--modelo");
  const fonteIdx = args.indexOf("--fonte");

  const modelo = modeloIdx >= 0 ? args[modeloIdx + 1] : "llama3.2:3b";
  const fonte = fonteIdx >= 0 ? args[fonteIdx + 1] : null;

  return { modelo, fonte };
}

async function verificarOllama(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("curl", ["-s", "--max-time", "5", "http://127.0.0.1:11434/api/tags"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    proc.stdout.on("data", (d) => (output += d));
    proc.on("close", () => resolve(output.includes(`"${3}tags"`) && output.length > 10));
    proc.on("error", () => resolve(false));
  });
}

async function analisar(modelo: string, dados: any[], slug: string): Promise<string> {
  return new Promise((resolve) => {
    const prompt = `Você é "Seu Nono Sabia", um assistente de análise de dados públicos brasileiros.

Analise os seguintes dados do Controle Popular (${slug}). Identifique:
1. Padrões sociais/ambientais relevantes
2. Possíveis inconsistências ou pontos de atenção
3. Contexto de interesse público

Dados (JSON, máximo 8000 caracteres):
${JSON.stringify(dados).substring(0, 8000)}

Responda em 200 palavras, foco em transparência pública. Use marcadores.`;

    const body = JSON.stringify({
      model: modelo,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_ctx: 4096 },
    });

    const proc = spawn("curl", [
      "-s", "--max-time", "60",
      "http://127.0.0.1:11434/api/generate",
      "-H", "Content-Type: application/json",
      "-d", body,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    let result = "";
    proc.stdout.on("data", (d) => (result += d));
    proc.on("close", () => {
      try {
        const parsed = JSON.parse(result);
        resolve(parsed.response || "Sem resposta do modelo");
      } catch {
        resolve("Erro no parse da resposta do Ollama");
      }
    });
    proc.on("error", () => resolve("Ollama indisponível"));
  });
}

async function main() {
  const { modelo, fonte: fonteSlug } = parseArgs();

  console.log("🤖 Seu Nono RAG Offline — Iniciando...\n");
  console.log(`Modelo: ${modelo}`);

  const ollamaUp = await verificarOllama();
  if (!ollamaUp) {
    console.error("❌ Ollama não está rodando em 127.0.0.1:11434");
    console.error("💡 Inicie com: ollama serve && ollama pull llama3.2:3b");
    process.exit(1);
  }
  console.log("✅ Conexão com Ollama OK");

  // Lista arquivos de dados para análise
  const arquivos = fonteSlug
    ? [fonteSlug]
    : fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith(".json") && !f.includes("compact"))
        .filter(f => !f.startsWith("analises") && !f.startsWith("indicadores"))
        .slice(0, 3); // Limita a 3 arquivos por rodada

  if (arquivos.length === 0) {
    console.log("📭 Nenhum arquivo de dados para analisar");
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const arquivo of arquivos) {
    const fp = path.join(DATA_DIR, arquivo);
    const dados = JSON.parse(fs.readFileSync(fp, "utf-8"));

    // Skip arquivos muito grandes
    const size = fs.statSync(fp).size;
    if (size > 512 * 1024) {
      console.log(`⚠️  ${arquivo} muito grande (${(size/1024).toFixed(0)}KB) — pulando`);
      continue;
    }

    const slug = arquivo.replace(".json", "");
    const outPath = path.join(OUTPUT_DIR, `${slug}.json`);

    // Skip se já analisado hoje
    if (fs.existsSync(outPath)) {
      const stat = fs.statSync(outPath);
      const hoje = new Date().toISOString().slice(0, 10);
      const ultima = stat.mtime.toISOString().slice(0, 10);
      if (hoje === ultima) {
        console.log(`✅ ${arquivo}: já analisado hoje`);
        continue;
      }
    }

    console.log(`📊 Analisando ${arquivo} (${dados.length || 'N/A'} itens)...`);

    const analise = await analisar(modelo, dados, slug);
    const resultado = {
      fonte: arquivo,
      slug,
      modelo,
      analise,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(outPath, JSON.stringify(resultado, null, 2), "utf-8");
    console.log(`   → ${path.basename(outPath)} (${(analise.length/100).toFixed(0)} palavras)`);
  }

  console.log("\n✅ Análise offline concluída");
}

main().catch(console.error);
