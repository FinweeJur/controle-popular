import { afterEach, describe, expect, test, vi } from "vitest";
import { OLLAMA_BASE_URL, OllamaIndisponivel, ollamaDisponivel, vetorizar, vetorizarLote } from "./ollama";

/**
 * Duas famílias de teste, por uma razão prática:
 *
 * 1. Tratamento de erro (HTTP não-200, corpo sem vetor, conexão recusada)
 *    usa `fetch` de mentira — mesmo padrão de `lib/assistente/documentos.test.ts`
 *    (`vi.stubGlobal`) — e roda sempre, em qualquer máquina, sem Ollama de pé.
 * 2. O contrato real do `/api/embed` — dimensão do vetor, ordem do lote —
 *    só pode ser verificado CONTRA O SERVIDOR DE VERDADE (é justamente o
 *    "nunca confie em status 200" da casa: um dublê só prova que o código
 *    lê o formato que EU digitei, não o que o Ollama realmente devolve).
 *    `describe.skipIf` pula esta segunda família quando não há Ollama nesta
 *    máquina, em vez de falhar a suíte inteira por causa de infra opcional
 *    — mesmo padrão de `temPython()` em `lib/sem-dado-pessoal-no-repo.test.ts`.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("vetorizar/vetorizarLote — tratamento de erro (fetch de mentira)", () => {
  test("HTTP não-200 vira OllamaIndisponivel com o status na mensagem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 500, text: async () => "internal error" } as Response))
    );
    await expect(vetorizar("teste")).rejects.toThrow(OllamaIndisponivel);
    await expect(vetorizar("teste")).rejects.toThrow(/500/);
  });

  test("conexão recusada vira OllamaIndisponivel, não erro cru de fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed")))
    );
    await expect(vetorizar("teste")).rejects.toThrow(OllamaIndisponivel);
  });

  test("200 sem `embeddings` vira erro em vez de vetor undefined — valida CONTEÚDO", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response))
    );
    await expect(vetorizar("teste")).rejects.toThrow(OllamaIndisponivel);
  });

  test("200 com `error` no corpo (Ollama documenta erro assim) vira OllamaIndisponivel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ ok: true, status: 200, json: async () => ({ error: "model not found" }) } as Response)
      )
    );
    await expect(vetorizar("teste")).rejects.toThrow(/model not found/);
  });

  test("vetorizarLote([]) não chama a rede", async () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal("fetch", fetchEspiao);
    expect(await vetorizarLote([])).toEqual([]);
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  test("lote com contagem de vetores diferente da de textos lança erro (contrato quebrado)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({ embeddings: [[1, 2]] }) } as Response))
    );
    await expect(vetorizarLote(["um", "dois"])).rejects.toThrow(/contrato de ordem quebrado/);
  });

  test("ollamaDisponivel() é false quando o fetch rejeita", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed")))
    );
    expect(await ollamaDisponivel()).toBe(false);
  });
});

// Checado UMA vez na coleta do arquivo (top-level await — suportado aqui:
// `tsconfig.json` já tem `module: "esnext"` + `target: "ES2017"`, e é o
// mesmo runtime de teste que já roda `sem-dado-pessoal-no-repo.test.ts`).
// Reusar esta constante evita perguntar duas vezes e mantém o aviso e o
// `skipIf` falando do mesmo resultado.
const OLLAMA_DISPONIVEL = await ollamaDisponivel();
if (!OLLAMA_DISPONIVEL) {
  console.warn(`[ollama.test.ts] Ollama local não respondeu em ${OLLAMA_BASE_URL} — pulando os testes contra o servidor real.`);
}

describe.skipIf(!OLLAMA_DISPONIVEL)("vetorizar/vetorizarLote — Ollama local real", () => {
  test("vetorizar devolve um vetor não vazio de números finitos", async () => {
    const vetor = await vetorizar("teste de conexão com o Ollama");
    expect(Array.isArray(vetor)).toBe(true);
    expect(vetor.length).toBeGreaterThan(0);
    expect(vetor.every((x) => typeof x === "number" && Number.isFinite(x))).toBe(true);
  });

  test("vetorizarLote devolve um vetor por texto, na mesma ordem, mesma dimensão", async () => {
    const textos = ["primeiro texto sobre barragens", "segundo texto sobre educação municipal"];
    const vetores = await vetorizarLote(textos);
    expect(vetores).toHaveLength(2);
    expect(vetores[0].length).toBe(vetores[1].length);
  });

  test("vetorizarLote de N textos bate, posição a posição, com N chamadas individuais a vetorizar", async () => {
    // Prova que o lote não embaralha ordem nem reaproveita o vetor errado —
    // o próprio contrato que `vetorizarLote` valida em runtime (ver
    // "contrato de ordem quebrado" acima), aqui contra o servidor de
    // verdade em vez de um dublê.
    const textos = ["laranja", "barragem de rejeito", "orçamento municipal"];
    const [porLote, ...porUm] = await Promise.all([vetorizarLote(textos), ...textos.map((t) => vetorizar(t))]);
    for (let i = 0; i < textos.length; i++) {
      expect(porLote[i]).toEqual(porUm[i]);
    }
  });
});
