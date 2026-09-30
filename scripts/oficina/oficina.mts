/**
 * Oficina do `home-pc` — um comando que se adapta à máquina.
 *
 * ═══ O QUE É ═══
 *
 * Lê o hardware (RAM, núcleos, GPU), escolhe um PERFIL (`lib/oficina/perfis`),
 * mostra os modelos locais necessários e verifica se o Ollama responde. Não
 * instala nada sem pedir e não chama a rede se não for necessário.
 *
 * ═══ POR QUE SIMPLES ═══
 *
 * O `home-pc` é mais fraco que a máquina de build. Aqui, menos é mais: um
 * comando, saída curta em português, e o perfil leve como padrão. O objetivo
 * é o dono rodar sem pensar, no computador de casa.
 *
 * ═══ MODOS ═══
 *
 *   npx tsx scripts/oficina/oficina.mts --simular
 *       Mostra o plano (perfil, modelos, passos) SEM chamar o Ollama.
 *       É o "treino de mesa": prova o encadeamento sem gastar a máquina.
 *   npx tsx scripts/oficina/oficina.mts
 *       Além do plano, verifica se o Ollama responde.
 *   npx tsx scripts/oficina/oficina.mts --instalar-modelos
 *       Baixa os modelos do perfil (`ollama pull`). Pede o Ollama instalado.
 *
 * ═══ SEGREDOS ═══
 *
 * Nada de token aqui. A oficina fala só com o Ollama local (127.0.0.1). Ver
 * o AGENTS.md § 5.8.
 */

import os from "node:os";
import { execFileSync } from "node:child_process";
import {
  type Hardware,
  modelosNecessarios,
  recomendarConfig,
} from "../../apps/web/lib/oficina/perfis";

const OLLAMA = "http://127.0.0.1:11434";

/** Descobre se há GPU utilizável (tenta o nvidia-smi; falha = sem GPU). */
function detectarGpu(): boolean {
  try {
    execFileSync("nvidia-smi", ["-L"], { stdio: "ignore", timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

/** Lê RAM, núcleos e GPU da máquina. */
function lerHardware(): Hardware {
  return {
    ramGb: Math.round(os.totalmem() / 1024 ** 3),
    cpus: os.cpus().length,
    temGpu: detectarGpu(),
  };
}

/** Verifica se o Ollama responde, com timeout curto (não trava o PC). */
async function ollamaResponde(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: ctrl.signal });
    clearTimeout(timer);
    return r.ok;
  } catch {
    return false;
  }
}

/** Baixa um modelo do Ollama. */
function baixarModelo(modelo: string): void {
  console.log(`   baixando ${modelo}...`);
  execFileSync("ollama", ["pull", modelo], { stdio: "inherit" });
}

async function principal(): Promise<void> {
  const args = process.argv.slice(2);
  const simular = args.includes("--simular");
  const instalar = args.includes("--instalar-modelos");

  const hw = lerHardware();
  const perfil = recomendarConfig(hw);
  const modelos = modelosNecessarios(perfil);

  console.log("🛠️  Oficina Controle Popular — perfil por hardware");
  console.log(
    `   máquina: ${hw.ramGb} GB RAM · ${hw.cpus} núcleos · GPU: ${hw.temGpu ? "sim" : "não"}`,
  );
  console.log(`   perfil escolhido: ${perfil.rotulo}`);
  console.log(`   ${perfil.descricao}`);
  console.log(`   paralelismo: ${perfil.maxParalelo} · lote de vetorização: ${perfil.batchEmbeddings}`);
  console.log(`   modelos: ${modelos.join(", ")}`);

  if (simular) {
    console.log("\n🧪 Modo simulação (--simular): nada é baixado nem executado.");
    console.log("   passos que a oficina faria:");
    console.log("   1. instalar/abrir o Ollama local;");
    console.log(`   2. baixar os modelos: ${modelos.join(", ")};`);
    console.log("   3. rodar as rotinas locais (saúde de fontes, resumo, vetorização)");
    console.log(`      com paralelismo ${perfil.maxParalelo}.`);
    console.log("   simulação concluída com sucesso. ✅");
    return;
  }

  const responde = await ollamaResponde();
  console.log(`\n   Ollama em ${OLLAMA}: ${responde ? "respondendo ✅" : "não encontrei ⚠️"}`);

  if (!responde) {
    console.log("   Sem Ollama, a oficina não roda o modelo local.");
    console.log("   Instale em https://ollama.com e rode de novo.");
    return;
  }

  if (instalar) {
    console.log("\n📦 Baixando os modelos do perfil:");
    for (const modelo of modelos) baixarModelo(modelo);
    console.log("   modelos prontos. ✅");
  } else {
    console.log("   Para baixar os modelos, rode com --instalar-modelos.");
  }
}

principal().catch((erro) => {
  console.error("Oficina falhou:", erro instanceof Error ? erro.message : erro);
  process.exitCode = 1;
});
