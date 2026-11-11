import { responderPedidoChatbot } from "@/lib/assistente/chatbot-http";

/**
 * Endpoint do chatbot IA do Seu Nonô com RAG.
 *
 * Roda no servidor Node real — no alvo principal (Azure Container Apps,
 * standalone), nos servidores de teste (home-pc, `next start`) e no
 * `next dev`. Com `output: export` (GitHub Pages) esta rota nao vira arquivo
 * estatico e a IA nao existe; o widget cai na escada deterministica.
 *
 * ═══ ORÇAMENTO DE TEMPO E DEGRADAÇÃO HONESTA (10/11/2026) ═══
 *
 * Medido em produção: `POST /api/chatbot` ficou mais de 44 s pendurado
 * (duas vezes) enquanto `/api/saude` respondia em ~5 s. Causa: o caminho
 * antigo tentava Ollama em `172.18.176.1:11434`, inalcançável a partir do
 * container do Azure, com 30-60 s de espera por tentativa.
 *
 * O corpo HTTP mora em `lib/assistente/chatbot-http.ts` (testável sem a
 * árvore de rotas do Next). Ali ficam o teto de ~25 s, o orçamento interno
 * do RAG, a degradação com as fontes (`responderSemModelo`, HTTP 200) e a
 * ordem dos provedores: GLM grátis -> Maritaca -> DeepSeek -> Ling. Ollama
 * não é importado neste caminho; sem `EMBED_API_KEY` a busca é lexical.
 */
export async function POST(req: Request): Promise<Response> {
  return responderPedidoChatbot(req);
}
