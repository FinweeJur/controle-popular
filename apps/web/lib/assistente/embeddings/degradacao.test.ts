/**
 * Degradação honesta do chatbot — o contrato medido em 10/11/2026.
 *
 * Em produção, `POST /api/chatbot` ficou mais de 44 s pendurado porque o
 * caminho antigo esperava Ollama (`172.18.176.1:11434`), inalcançável a
 * partir do container do Azure, com 30-60 s por tentativa. Este arquivo
 * prova as três garantias que substituíram aquilo:
 *
 * 1. `responderSemModelo` devolve texto curto e verdadeiro, SEM número, e
 *    mantém as fontes (título e link) que a busca achou;
 * 2. com `fetch` que nunca resolve (só aborta), `responderComRag` termina
 *    dentro do orçamento e NÃO lança — devolve a degradada;
 * 3. o route do `/api/chatbot` responde 200 (nunca 500) nesse cenário.
 *
 * O env `CHATBOT_ORCAMENTO_MS` é lido no import de `rag.ts`; por isso este
 * teste usa import dinâmico e só depois de encolher o orçamento (~1,2 s),
 * para não gastar 25 s de relógio por caso.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FonteRag } from "./geracao";
import type { RespostaRag } from "./rag";

const ENV_ANTERIOR = { ...process.env };

/** Orçamento curto só neste arquivo — o padrão de produção é 25 s. */
process.env.CHATBOT_ORCAMENTO_MS = "1200";
process.env.RAG_ORCAMENTO_MS = "900";

function limparChaves() {
  delete process.env.AI_API_KEY;
  delete process.env.AI_API_KEY_DEEPSEEK;
  delete process.env.AI_API_KEY_MARITACA;
  delete process.env.MARITACA_API_KEY;
  delete process.env.AI_API_KEY_LING;
  delete process.env.ZAI_API_KEY;
  delete process.env.GLM_API_KEY;
  delete process.env.AI_API_KEY_GLM;
  delete process.env.AI_BASE_URL;
  delete process.env.EMBED_API_KEY;
}

/**
 * `fetch` que NUNCA resolve sozinho: só rejeita quando o `AbortSignal`
 * dispara. É o comportamento real de uma conexão pendurada com timeout.
 */
function fetchQueSoAborta(): typeof fetch {
  return vi.fn((_url: string | URL | Request, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const sinal = init?.signal;
      const abortar = () => reject(new DOMException("The operation was aborted.", "AbortError"));
      if (!sinal) return;
      if (sinal.aborted) {
        abortar();
        return;
      }
      sinal.addEventListener("abort", abortar, { once: true });
    });
  }) as unknown as typeof fetch;
}

function fonteDeTeste(): FonteRag {
  return {
    indice: 1,
    texto: "Contratos da prefeitura publicados no portal.",
    score: 0.72,
    titulo: "Contratos da prefeitura",
    url: "https://www.controlepopular.com.br/betim/prefeitura/contratos",
    rota: "/betim/prefeitura/contratos",
  };
}

beforeAll(async () => {
  // Aquece o módulo com o orçamento curto já no ambiente.
  await import("./rag");
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...ENV_ANTERIOR, CHATBOT_ORCAMENTO_MS: "1200", RAG_ORCAMENTO_MS: "900" };
});

describe("responderSemModelo — degradação honrada", () => {
  it("mantém as fontes (título e link) e não afirma número nenhum", async () => {
    const { responderSemModelo } = await import("./rag");
    const fontes = [fonteDeTeste()];
    const resposta: RespostaRag = responderSemModelo(fontes, "geracao-falhou");

    expect(resposta.fontes).toEqual(fontes);
    expect(resposta.fontes[0].titulo).toBe("Contratos da prefeitura");
    expect(resposta.fontes[0].url).toContain("controlepopular.com.br");
    expect(resposta.ressalva).toBe(true);
    expect(resposta.textoGeradoPorModelo).toBe(false);
    expect(resposta.motivoDegradacao).toBe("geracao-falhou");
    expect(resposta.modelo).toBe("sem-modelo");
    expect(resposta.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // A frase não pode afirmar valor, data nem número: nada de "R$ 1,65
    // bilhão" saindo de um texto que nenhum modelo escreveu.
    expect(resposta.resposta).not.toMatch(/\d/);
    expect(resposta.resposta.toLowerCase()).not.toContain("r$");
  });

  it("sem fontes, a frase honesta continua valendo", async () => {
    const { responderSemModelo } = await import("./rag");
    const resposta = responderSemModelo([], "orcamento-esgotado");
    expect(resposta.fontes).toEqual([]);
    expect(resposta.textoGeradoPorModelo).toBe(false);
    expect(resposta.resposta).not.toMatch(/\d/);
    expect(resposta.resposta.length).toBeGreaterThan(20);
  });
});

describe("responderComRag — orçamento não estoura e não lança", () => {
  it("com fetch mudo, degrada dentro do prazo e devolve as fontes que houver", async () => {
    limparChaves();
    process.env.ZAI_API_KEY = "chave-de-teste";
    vi.stubGlobal("fetch", fetchQueSoAborta());

    const { responderComRag, esquecerIndiceAcervo } = await import("./rag");
    esquecerIndiceAcervo();

    const inicio = Date.now();
    const resposta = await responderComRag("Quais são os maiores contratos da prefeitura de Betim?", {
      timeoutMs: 300,
      timeoutBuscaMs: 600,
      orcamentoMs: 1_800,
    });
    const gasto = Date.now() - inicio;

    expect(gasto).toBeLessThan(3_000);
    expect(resposta.ressalva).toBe(true);
    expect(Array.isArray(resposta.fontes)).toBe(true);
    // Ou o modelo gerou (não é o caso aqui), ou a degradação se declara.
    if (resposta.textoGeradoPorModelo === false) {
      expect(resposta.modelo).toBe("sem-modelo");
      expect(["geracao-falhou", "orcamento-esgotado", "sem-fontes"]).toContain(
        resposta.motivoDegradacao
      );
      expect(resposta.resposta).not.toMatch(/\d/);
      // Fonte degradada, quando existe, precisa levar o leitor a algum lugar.
      for (const fonte of resposta.fontes) {
        expect(fonte.url ?? fonte.rota).toBeTruthy();
      }
    }
  }, 15_000);
});

describe("route /api/chatbot — 200 com degradação, nunca 500", () => {
  it("responde 200 e o corpo declara que o texto não saiu de modelo", async () => {
    limparChaves();
    process.env.ZAI_API_KEY = "chave-de-teste";
    // O orçamento curto deste arquivo (1,2 s) é lido no import do route.
    vi.stubGlobal("fetch", fetchQueSoAborta());

    const { responderPedidoChatbot } = await import("../chatbot-http");

    const req = new Request("https://www.controlepopular.com.br/api/chatbot", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.77" },
      body: JSON.stringify({ pergunta: "Quais são os maiores contratos da prefeitura de Betim?" }),
    });

    const inicio = Date.now();
    const resp = await responderPedidoChatbot(req);
    const gasto = Date.now() - inicio;

    expect(resp.status).toBe(200);
    expect(gasto).toBeLessThan(5_000);

    const corpo = (await resp.json()) as RespostaRag & { erro?: string };
    expect(corpo.erro).toBeUndefined();
    expect(typeof corpo.resposta).toBe("string");
    expect(corpo.resposta.length).toBeGreaterThan(10);
    expect(corpo.ressalva).toBe(true);
    expect(corpo.textoGeradoPorModelo).toBe(false);
    expect(Array.isArray(corpo.fontes)).toBe(true);
    expect(corpo.motivoDegradacao).toBeTruthy();
    expect(corpo.resposta).not.toMatch(/\d/);
  }, 20_000);
});
