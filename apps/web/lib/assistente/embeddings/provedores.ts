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
 * Fallback `AI_API_KEY`: quando NENHUMA variante existe mas `AI_API_KEY`
 * esta preenchida (caso do Guara Cloud, medido 23/09/2026), a chave generica
 * vale para o provedor deduzido de `AI_BASE_URL` (padrao Maritaca). Isto
 * conserta o 503 do Seu Nono em producao sem espelhar chave no painel.
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
  const especifica = (process.env[DEFINICOES[id].envKey] || "").trim();
  if (especifica) return especifica;
  // Fallback: quando NENHUMA variante existe, aceita a chave generica do
  // ambiente (`AI_API_KEY`). E o caso do Guara Cloud: la so existe
  // `AI_API_KEY` (chave Maritaca do chat das zonas), e as variantes
  // `AI_API_KEY_*` do Seu Nono nunca foram setadas — sem isto o RAG caia
  // em 503 (medido em 23/09/2026). O provedor e deduzido de `AI_BASE_URL`
  // (padrao Maritaca, o que o Guara injeta hoje). O VALOR da chave nunca
  // entra no codigo — so o NOME da env.
  if (temAlgumaVariante()) return "";
  if (id === idDoAmbienteGenerico()) return (process.env.AI_API_KEY || "").trim();
  return "";
}

/** Alguma variante `AI_API_KEY_*` preenchida? */
function temAlgumaVariante(): boolean {
  return (Object.keys(DEFINICOES) as IdProvedor[]).some(
    (id) => (process.env[DEFINICOES[id].envKey] || "").trim().length > 0
  );
}

/** Qual provedor a chave generica `AI_API_KEY` representa, pela URL base. */
function idDoAmbienteGenerico(): IdProvedor {
  const base = (process.env.AI_BASE_URL || "").toLowerCase();
  if (base.includes("deepseek")) return "deepseek";
  if (base.includes("ling")) return "ling";
  return "maritaca";
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
  return (
    provedorDisponivel("deepseek") ||
    provedorDisponivel("maritaca") ||
    provedorDisponivel("ling") ||
    // chave generica do ambiente (fallback do Guara) — `chaveDoProvedor`
    // e quem decide se ela vale para este provedor
    ((process.env.AI_API_KEY || "").trim().length > 0 && !temAlgumaVariante())
  );
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
