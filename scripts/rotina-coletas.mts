/**
 * CLI unificado de orquestração de coletas — controlepopular.com.br
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * Em vez de manter chamadas dispersas em scripts avulsos ou depender
 * exclusivamente de execuções manuais, este CLI permite:
 * 1. Consultar o catálogo completo e estado das fontes (`--listar`).
 * 2. Disparar coletas modulares por frente (`--frente <nome>`) ou por fonte (`--fonte <slug>`).
 * 3. Executar o ciclo completo com verificação automática de integridade e varredura de dados pessoais (`--tudo`).
 *
 * Uso:
 *   npx tsx scripts/rotina-coletas.mts --listar
 *   npx tsx scripts/rotina-coletas.mts --fonte sigbm-barragens
 *   npx tsx scripts/rotina-coletas.mts --frente ambiental
 *   npx tsx scripts/rotina-coletas.mts --tudo
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGISTRY_FONTES,
  listarFontesPorFrente,
  listarTodasFontes,
  obterEstatisticasFontes,
  type FrenteSlug,
} from "../apps/web/lib/fontes/registry.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PYTHON = process.env.RADAR_PYTHON ?? "py";
const PYTHON_ARGS = process.env.RADAR_PYTHON ? [] : ["-3"];

// ── Notificação Telegram ─────────────────────────────────────────────────────
// Lê TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID de scripts/.env (gitignored).
// Falha silenciosamente se ausentes — não bloqueia a execução.
async function notificarTelegram(mensagem: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensagem, parse_mode: "HTML" }),
    });
  } catch {
    // silencioso — notificação não é crítica
  }
}

function formatarMensagemTelegram(
  escopo: string,
  sucesso: number,
  erros: number,
  varreduraCpf: boolean,
  duracao: number
): string {
  const hora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const icone = erros === 0 ? "✅" : erros < sucesso ? "⚠️" : "❌";
  return [
    `${icone} <b>Coleta concluída — Controle Popular</b>`,
    `Escopo: <code>${escopo}</code>`,
    `Sucesso: ${sucesso} fonte(s)  |  Falha: ${erros}`,
    `LGPD (mod-11): ${varreduraCpf ? "✓ limpo" : "⚠️ verificar"}`,
    `Duração: ${duracao}s`,
    `<i>${hora}</i>`,
  ].join("\n");
}


const MAPA_SCRIPTS: Record<string, { tipo: "ts" | "py"; comando: string }> = {
  "sigbm-barragens": {
    tipo: "ts",
    comando: "scripts/coletar-sigbm-anm.mts",
  },
  "ibama-licencas-sancoes": {
    tipo: "ts",
    comando: "scripts/coletar-ibama-mg.mts",
  },
  "cge-decisoes-lai": {
    tipo: "ts",
    comando: "scripts/coletar-decisoes-cge-mg.mts",
  },
  "gtac-semad": {
    tipo: "ts",
    comando: "scripts/coletar-tac-gtac-mg.mts",
  },
  "transferegov-convenios": {
    tipo: "ts",
    comando: "scripts/coletar-convenios-federais-mg.mts",
  },
  "comunicabr-repasses": {
    tipo: "ts",
    comando: "scripts/coletar-comunicabr.mts",
  },
  "salic-rouanet": {
    tipo: "ts",
    comando: "scripts/coletar-salic-rouanet.mts",
  },
  "repasse-brumadinho": {
    tipo: "ts",
    comando: "scripts/coletar-repasse-brumadinho-mg.mts",
  },
  "fgv-paraopeba": {
    tipo: "ts",
    comando: "scripts/coletar-execucao-fgv.mts",
  },
  "auditoria-ajri": {
    tipo: "ts",
    comando: "scripts/extrair-auditoria-ajri.mts",
  },
  "biblioteca-atis": {
    tipo: "py",
    comando: "scripts/coletar-biblioteca-ati.py",
  },
  "biblioteca-atis-mariana": {
    tipo: "py",
    comando: "scripts/coletar-biblioteca-ati-mariana.py",
  },
  "fundo-brasil": {
    tipo: "py",
    comando: "scripts/coletar-biblioteca-fundo-brasil.py",
  },
  "noticias-desastres": {
    tipo: "py",
    comando: "scripts/coletar-noticias-desastres.py",
  },
  "cnj-inspecoes": {
    tipo: "ts",
    comando: "scripts/gerar-inspecoes-cnj.mts",
  },
  "vale-b3-cvm": {
    tipo: "ts",
    comando: "scripts/coletar-vale-monitoramento.mts",
  },
};

function executarPasso(slug: string, seco = false): boolean {
  const meta = REGISTRY_FONTES[slug];
  const config = MAPA_SCRIPTS[slug];

  if (!config) {
    console.log(`⚠️  Fonte '${slug}' não possui coletor automatizado registrado ainda.`);
    return false;
  }

  console.log(`\n▶ [${meta?.frente.toUpperCase() ?? "COLETA"}] Executando: ${meta?.nome ?? slug}`);
  const inicio = Date.now();

  let resultado;
  if (config.tipo === "ts") {
    const caminhoScript = path.join(RAIZ, config.comando);
    if (!fs.existsSync(caminhoScript)) {
      console.log(`❌ Arquivo do coletor não encontrado: ${config.comando}`);
      return false;
    }
    const args = ["tsx", caminhoScript];
    if (seco) args.push("--seco");
    resultado = spawnSync("npx", args, {
      cwd: RAIZ,
      stdio: "inherit",
      shell: true,
      encoding: "utf-8",
    });
  } else {
    const caminhoScript = path.join(RAIZ, config.comando);
    if (!fs.existsSync(caminhoScript)) {
      console.log(`❌ Arquivo do coletor não encontrado: ${config.comando}`);
      return false;
    }
    const args = [...PYTHON_ARGS, caminhoScript];
    resultado = spawnSync(PYTHON, args, {
      cwd: RAIZ,
      stdio: "inherit",
      encoding: "utf-8",
    });
  }

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  const sucesso = resultado.status === 0;

  if (sucesso) {
    console.log(`✓ Coleta concluída com sucesso (${duracao}s).`);
  } else {
    console.log(`❌ Falha na execução da coleta (código: ${resultado.status}).`);
  }

  return sucesso;
}

function varrerDadoPessoal(): boolean {
  console.log("\n🔒 Executando varredura de dados pessoais (mod-11) nos acervos...");
  const scriptVarredura = path.join(RAIZ, "scripts", "checar-dado-pessoal-em-dado.py");
  const r = spawnSync(PYTHON, [...PYTHON_ARGS, scriptVarredura], {
    cwd: RAIZ,
    stdio: "inherit",
    encoding: "utf-8",
  });
  return r.status === 0;
}

function main() {
  const args = process.argv.slice(2);
  const seco = args.includes("--seco");
  const inicioRodada = Date.now();

  if (args.includes("--listar") || args.length === 0) {
    const stats = obterEstatisticasFontes();
    console.log("\n════════════════════════════════════════════════════════════════════════");
    console.log("  CATÁLOGO DE FONTES DE DADOS — CONTROLE POPULAR");
    console.log("════════════════════════════════════════════════════════════════════════\n");
    console.log(`Total de Fontes Mapeadas: ${stats.total}`);
    console.log("Por Frente:", stats.porFrente);
    console.log("Por Camada:", stats.porCamada);
    console.log("\nLista Detalhada:");

    for (const f of listarTodasFontes()) {
      const temScript = Boolean(MAPA_SCRIPTS[f.slug]);
      const statusIcon = temScript ? "⚡ [AUTO]" : "📋 [MAP]";
      console.log(`\n${statusIcon} ${f.slug.padEnd(26)} | Frente: ${f.frente.padEnd(11)} | Órgão: ${f.orgao}`);
      console.log(`   Nome: ${f.nome}`);
      console.log(`   URL: ${f.urlOficial} | Licença: ${f.licenca} | Camada: ${f.camada}`);
      if (f.caminhoArquivo) console.log(`   Destino: ${f.caminhoArquivo}`);
      if (f.ressalvaEditorial) console.log(`   ⚠️  Ressalva: ${f.ressalvaEditorial}`);
    }
    return;
  }

  const idxFonte = args.indexOf("--fonte");
  if (idxFonte !== -1 && args[idxFonte + 1]) {
    const slug = args[idxFonte + 1];
    const ok = executarPasso(slug, seco);
    const safe = ok ? varrerDadoPessoal() : false;
    const duracao = Math.round((Date.now() - inicioRodada) / 1000);
    notificarTelegram(formatarMensagemTelegram(slug, ok ? 1 : 0, ok ? 0 : 1, safe, duracao));
    process.exit(ok ? 0 : 1);
  }

  const idxFrente = args.indexOf("--frente");
  if (idxFrente !== -1 && args[idxFrente + 1]) {
    const frente = args[idxFrente + 1] as FrenteSlug;
    const fontes = listarFontesPorFrente(frente);
    console.log(`\nExecutando rodada para a frente '${frente}' (${fontes.length} fontes mapeadas)...`);
    let erros = 0;
    let sucesso = 0;
    for (const f of fontes) {
      if (MAPA_SCRIPTS[f.slug]) {
        const ok = executarPasso(f.slug, seco);
        if (ok) sucesso++; else erros++;
      }
    }
    const safe = varrerDadoPessoal();
    const duracao = Math.round((Date.now() - inicioRodada) / 1000);
    console.log(`\nFinalizado com ${erros} erro(s).`);
    notificarTelegram(formatarMensagemTelegram(`frente:${frente}`, sucesso, erros, safe, duracao));
    process.exit(erros > 0 ? 1 : 0);
  }

  if (args.includes("--tudo")) {
    console.log("\nExecutando rodada completa de todas as fontes automatizadas...");
    let erros = 0;
    let sucesso = 0;
    const slugs = Object.keys(MAPA_SCRIPTS);
    for (const slug of slugs) {
      const ok = executarPasso(slug, seco);
      if (ok) sucesso++; else erros++;
    }
    const safe = varrerDadoPessoal();
    const duracao = Math.round((Date.now() - inicioRodada) / 1000);
    console.log(`\nRodada concluída. Falhas de coleta: ${erros}. Varredura de dados pessoais: ${safe ? "OK" : "FALHOU"}.`);
    notificarTelegram(formatarMensagemTelegram("tudo", sucesso, erros, safe, duracao));
    process.exit(erros === 0 && safe ? 0 : 1);
  }

  console.log("Argumento não reconhecido. Use --listar, --fonte <slug>, --frente <nome> ou --tudo.");
}

main();
