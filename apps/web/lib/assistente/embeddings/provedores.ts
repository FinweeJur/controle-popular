/**
 * Provedores de geracao (degrau 3 do assistente) e a ordem em que sao
 * tentados: primeiro o provedor ativo (escolhido no painel de edicao),
 * depois o outro, como fallback automatico.
 *
 * As chaves moram SO em `apps/web/.env.local` (`AI_API_KEY_DEEPSEEK` e
 * `AI_API_KEY_MARITACA`), nunca no repositorio. A escolha de qual esta
 * ativo mora em `apps/web/data/ia-config.json` — estado de maquina,
 * ignorado pelo git, editavel pelo painel de edicao sem tocar no .env.
 *
 * Ambos os provedores sao compativeis com o formato OpenAI
 * (`POST /chat/completions`). Nenhum dos dois publica endpoint de
 * embeddings — medido em 22/08 e reafirmado em 30/08; a vetorizacao
 * continua local (Ollama) ou via SiliconFlow (`BAAI/bge-m3`).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export type IdProvedor = "deepseek" | "maritaca";

export interface ProvedorIa {
  id: IdProvedor;
  rotulo: string;
  baseUrl: string;
  modelo: string;
  apiKey: string;
}

interface ConfigIa {
  provedorAtivo: IdProvedor;
}

/**
 * Resolvido a CADA chamada, nao uma vez no topo do modulo — mesmo padrao
 * de `lib/painel/edicoes-io.ts`: testes trocam de diretorio e um caminho
 * preso ao primeiro import gravaria no lugar errado sem avisar.
 */
function caminhoConfig(): string {
  return path.join(process.cwd(), "data", "ia-config.json");
}

const DEFINICOES: Record<IdProvedor, { rotulo: string; baseUrl: string; modelo: string; envKey: string }> = {
  deepseek: {
    rotulo: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    modelo: "deepseek-chat",
    envKey: "AI_API_KEY_DEEPSEEK",
  },
  maritaca: {
    rotulo: "Maritaca (Sabiá-3)",
    baseUrl: "https://chat.maritaca.ai/v1",
    modelo: "sabia-3",
    envKey: "AI_API_KEY_MARITACA",
  },
};

export function lerConfigIa(): ConfigIa {
  try {
    const bruto = readFileSync(caminhoConfig(), "utf-8");
    const parsed = JSON.parse(bruto) as Partial<ConfigIa>;
    if (parsed.provedorAtivo === "deepseek" || parsed.provedorAtivo === "maritaca") {
      return { provedorAtivo: parsed.provedorAtivo };
    }
  } catch {
    // arquivo ausente ou ilegivel: cai no padrao abaixo
  }
  return { provedorAtivo: "deepseek" };
}

export function salvarConfigIa(config: ConfigIa): void {
  const destino = caminhoConfig();
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

function chaveDoProvedor(id: IdProvedor): string {
  return process.env[DEFINICOES[id].envKey] || "";
}

export function provedorDisponivel(id: IdProvedor): boolean {
  return chaveDoProvedor(id).length > 0;
}

/**
 * Provedores na ordem de tentativa: ativo primeiro, fallback depois.
 * Provedor sem chave configurada sai da lista.
 */
export function listarProvedoresNaOrdem(): ProvedorIa[] {
  const { provedorAtivo } = lerConfigIa();
  const ordem: IdProvedor[] = provedorAtivo === "deepseek" ? ["deepseek", "maritaca"] : ["maritaca", "deepseek"];
  return ordem
    .filter(provedorDisponivel)
    .map((id) => {
      const d = DEFINICOES[id];
      return { id, rotulo: d.rotulo, baseUrl: d.baseUrl, modelo: d.modelo, apiKey: chaveDoProvedor(id) };
    });
}

/** Alguma chave remota configurada? (decide entre API remota e Ollama local) */
export function temChaveRemota(): boolean {
  return provedorDisponivel("deepseek") || provedorDisponivel("maritaca");
}

/** Resumo para o painel de edicao — NUNCA devolve o valor das chaves. */
export function resumoParaPainel(): {
  provedorAtivo: IdProvedor;
  provedores: { id: IdProvedor; rotulo: string; modelo: string; chaveConfigurada: boolean }[];
} {
  const { provedorAtivo } = lerConfigIa();
  const provedores = (Object.keys(DEFINICOES) as IdProvedor[]).map((id) => ({
    id,
    rotulo: DEFINICOES[id].rotulo,
    modelo: DEFINICOES[id].modelo,
    chaveConfigurada: provedorDisponivel(id),
  }));
  return { provedorAtivo, provedores };
}
