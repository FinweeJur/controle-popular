/**
 * Provedores de geracao (degrau 3 do assistente) e a ordem em que sao
 * tentados: primeiro o provedor ativo (escolhido no painel de edicao),
 * depois os demais como fallback automatico. O Ling entra por ultimo na
 * cascata (DeepSeek -> Maritaca -> Ling) a menos que seja escolhido ativo.
 *
 * As chaves moram SO em `apps/web/.env.local` (`AI_API_KEY_DEEPSEEK`,
 * `AI_API_KEY_MARITACA` e `AI_API_KEY_LING`), nunca no repositorio. A escolha
 * de qual esta ativo mora em `apps/web/data/ia-config.json` — estado de
 * maquina, ignorado pelo git, editavel pelo painel de edicao sem tocar no .env.
 *
 * Todos os provedores sao compativeis com o formato OpenAI
 * (`POST /chat/completions`) e usam a variante flash/mais barata de cada
 * familia (deepseek-v4-flash, sabiazinho-4 e Ling-2.6-flash). Nenhum deles
 * publica endpoint de embeddings — medido em 22/08 e reafirmado em 30/08;
 * a vetorizacao continua local (Ollama) ou via SiliconFlow (`BAAI/bge-m3`).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export type IdProvedor = "deepseek" | "maritaca" | "ling";

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
    modelo: "deepseek-v4-flash",
    envKey: "AI_API_KEY_DEEPSEEK",
  },
  maritaca: {
    rotulo: "Maritaca (Sabiazinho-4)",
    baseUrl: "https://chat.maritaca.ai/api",
    modelo: "sabiazinho-4",
    envKey: "AI_API_KEY_MARITACA",
  },
  ling: {
    rotulo: "Ling (Flash)",
    baseUrl: "https://ling-1t.ai/api/v1",
    modelo: "Ling-2.6-flash",
    envKey: "AI_API_KEY_LING",
  },
};

/** Ordem de prioridade da cascata quando o provedor ativo nao define tudo. */
const ORDEM_PRIORIDADE: IdProvedor[] = ["deepseek", "maritaca", "ling"];

export function lerConfigIa(): ConfigIa {
  try {
    const bruto = readFileSync(caminhoConfig(), "utf-8");
    const parsed = JSON.parse(bruto) as Partial<ConfigIa>;
    if (parsed.provedorAtivo === "deepseek" || parsed.provedorAtivo === "maritaca" || parsed.provedorAtivo === "ling") {
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
 * Provedores na ordem de tentativa: ativo primeiro, depois os demais na
 * ordem fixa (DeepSeek, Maritaca, Ling). Provedor sem chave sai da lista,
 * entao o Ling so entra na fila se `AI_API_KEY_LING` estiver preenchida.
 */
export function listarProvedoresNaOrdem(): ProvedorIa[] {
  const { provedorAtivo } = lerConfigIa();
  const ordem: IdProvedor[] = [provedorAtivo, ...ORDEM_PRIORIDADE.filter((id) => id !== provedorAtivo)];
  return ordem
    .filter(provedorDisponivel)
    .map((id) => {
      const d = DEFINICOES[id];
      return { id, rotulo: d.rotulo, baseUrl: d.baseUrl, modelo: d.modelo, apiKey: chaveDoProvedor(id) };
    });
}

/** Alguma chave remota configurada? (decide entre API remota e Ollama local) */
export function temChaveRemota(): boolean {
  return provedorDisponivel("deepseek") || provedorDisponivel("maritaca") || provedorDisponivel("ling");
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
