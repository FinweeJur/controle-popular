/**
 * Provedores de geracao (degrau 3 do assistente) e a ordem em que sao
 * tentados: primeiro o provedor ativo (escolhido no painel de edicao),
 * depois os demais na ordem padrao GRATIS -> PAGO.
 *
 * ═══ POR QUE GRATIS PRIMEIRO, PAGO DEPOIS (10/11/2026) ═══
 *
 * A cascata agora espelha a coleta de jurisprudencia (`tjmg-jurimetria`,
 * `etl/resumir_normas.py`): GLM Flash (gratuito, `open.bigmodel.cn`) e o
 * primeiro; Maritaca `sabiazinho-4` e o principal pago; DeepSeek entra como
 * ultimo recurso de texto e o Ling so se a chave existir. Ordem padrao:
 * `glm -> maritaca -> deepseek -> ling`. Quem escolhe outro provedor ativo
 * no painel o coloca na frente — o resto continua de fallback na mesma
 * ordem.
 *
 * ═══ OLLAMA FORA DO CHATBOT ═══
 *
 * O container do Azure nao alcanca `172.18.176.1:11434` (Ollama do home-pc
 * via rede interna). Cada tentativa consumia 30-60 s e o endpoint
 * `/api/chatbot` passou de 44 s sem responder (medido em 10/11/2026). O
 * Ollama continua util em `scripts/` e no laboratorio local (`ollama.ts`),
 * mas nao e mais fallback do chatbot.
 *
 * As chaves moram SO em `apps/web/.env.local` (nunca no repositorio). A
 * escolha de qual esta ativo mora em `apps/web/data/ia-config.json` —
 * estado de maquina, ignorado pelo git, editavel pelo painel sem tocar no
 * .env.
 *
 * Fallback `AI_API_KEY`: quando NENHUMA variante existe mas `AI_API_KEY`
 * esta preenchida (caso do Guara Cloud, medido 23/09/2026), a chave generica
 * vale para o provedor deduzido de `AI_BASE_URL`. O VALOR da chave nunca
 * entra no codigo — so o NOME da env.
 *
 * Todos os provedores sao compativeis com o formato OpenAI
 * (`POST /chat/completions`) e usam a variante flash/mais barata de cada
 * familia. Nenhum deles publica endpoint de embeddings; a vetorizacao usa
 * SiliconFlow (`EMBED_API_KEY`) ou, sem chave, a busca cai para lexical.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export type IdProvedor = "glm" | "maritaca" | "deepseek" | "ling";

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

interface DefinicaoProvedor {
  rotulo: string;
  baseUrl: string;
  modelo: string;
  /** Envs aceitas, da principal para os apelidos. */
  envKeys: string[];
}

/**
 * Resolvido a CADA chamada, nao uma vez no topo do modulo — mesmo padrao
 * de `lib/painel/edicoes-io.ts`: testes trocam de diretorio e um caminho
 * preso ao primeiro import gravaria no lugar errado sem avisar.
 */
function caminhoConfig(): string {
  return path.join(process.cwd(), "data", "ia-config.json");
}

const DEFINICOES: Record<IdProvedor, DefinicaoProvedor> = {
  glm: {
    rotulo: "GLM (Flash, grátis)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    modelo: "glm-4.5-flash",
    envKeys: ["ZAI_API_KEY", "GLM_API_KEY", "AI_API_KEY_GLM"],
  },
  maritaca: {
    rotulo: "Maritaca (Sabiazinho-4)",
    baseUrl: "https://chat.maritaca.ai/api",
    modelo: "sabiazinho-4",
    envKeys: ["AI_API_KEY_MARITACA", "MARITACA_API_KEY"],
  },
  deepseek: {
    rotulo: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    modelo: "deepseek-v4-flash",
    envKeys: ["AI_API_KEY_DEEPSEEK"],
  },
  ling: {
    rotulo: "Ling (Flash)",
    baseUrl: "https://ling-1t.ai/api/v1",
    modelo: "Ling-2.6-flash",
    envKeys: ["AI_API_KEY_LING"],
  },
};

/** Ordem de prioridade da cascata: gratis primeiro, pago depois. */
export const ORDEM_PROVEDORES: readonly IdProvedor[] = ["glm", "maritaca", "deepseek", "ling"];

/** Erro de configuracao: nao ha provedor de IA remoto nenhum. */
export class IaIndisponivel extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "IaIndisponivel";
  }
}

export function lerConfigIa(): ConfigIa {
  try {
    const bruto = readFileSync(caminhoConfig(), "utf-8");
    const parsed = JSON.parse(bruto) as Partial<ConfigIa>;
    if (parsed.provedorAtivo && parsed.provedorAtivo in DEFINICOES) {
      return { provedorAtivo: parsed.provedorAtivo };
    }
  } catch {
    // arquivo ausente ou ilegivel: cai no padrao abaixo
  }
  return { provedorAtivo: "glm" };
}

export function salvarConfigIa(config: ConfigIa): void {
  const destino = caminhoConfig();
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

function chaveDoProvedor(id: IdProvedor): string {
  for (const nome of DEFINICOES[id].envKeys) {
    const valor = (process.env[nome] || "").trim();
    if (valor) return valor;
  }
  // Fallback: quando NENHUMA variante existe, aceita a chave generica do
  // ambiente (`AI_API_KEY`). E o caso do Guara Cloud: la so existe
  // `AI_API_KEY` (chave Maritaca do chat das zonas), e as variantes
  // `AI_API_KEY_*` do Seu Nono nunca foram setadas — sem isto o RAG caia
  // em 503 (medido em 23/09/2026). O provedor e deduzido de `AI_BASE_URL`
  // (padrao Maritaca, o que o Guara injeta hoje).
  if (temAlgumaVariante()) return "";
  if (id === idDoAmbienteGenerico()) return (process.env.AI_API_KEY || "").trim();
  return "";
}

/** Alguma variante especifica (incluindo apelidos) preenchida? */
function temAlgumaVariante(): boolean {
  return (Object.keys(DEFINICOES) as IdProvedor[]).some((id) =>
    DEFINICOES[id].envKeys.some((nome) => (process.env[nome] || "").trim().length > 0)
  );
}

/** Qual provedor a chave generica `AI_API_KEY` representa, pela URL base. */
function idDoAmbienteGenerico(): IdProvedor {
  const base = (process.env.AI_BASE_URL || "").toLowerCase();
  if (base.includes("deepseek")) return "deepseek";
  if (base.includes("ling")) return "ling";
  if (base.includes("bigmodel") || base.includes("zhipu") || base.includes("glm")) return "glm";
  return "maritaca";
}

export function provedorDisponivel(id: IdProvedor): boolean {
  return chaveDoProvedor(id).length > 0;
}

/**
 * Provedores na ordem de tentativa: ativo primeiro, depois os demais na
 * ordem padrao (GLM gratis, Maritaca, DeepSeek, Ling). Provedor sem chave
 * sai da lista, entao o Ling so entra na fila se `AI_API_KEY_LING` existir.
 */
export function listarProvedoresNaOrdem(): ProvedorIa[] {
  const { provedorAtivo } = lerConfigIa();
  const ordem: IdProvedor[] = [
    provedorAtivo,
    ...ORDEM_PROVEDORES.filter((id) => id !== provedorAtivo),
  ];
  return ordem
    .filter(provedorDisponivel)
    .map((id) => {
      const d = DEFINICOES[id];
      return { id, rotulo: d.rotulo, baseUrl: d.baseUrl, modelo: d.modelo, apiKey: chaveDoProvedor(id) };
    });
}

/** Alguma chave remota configurada? (decide entre API remota e degradacao) */
export function temChaveRemota(): boolean {
  return (
    provedorDisponivel("glm") ||
    provedorDisponivel("maritaca") ||
    provedorDisponivel("deepseek") ||
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
