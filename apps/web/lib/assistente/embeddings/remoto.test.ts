import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  temChaveEmbed,
  vetorizarRemoto,
  vetorizarLoteRemoto,
  EmbedIndisponivel,
  EMBED_BASE_URL_PADRAO,
  EMBED_MODEL_PADRAO,
} from "./remoto";

const ENV_ANTERIOR = { ...process.env };

beforeEach(() => {
  delete process.env.EMBED_API_KEY;
  delete process.env.EMBED_BASE_URL;
  delete process.env.EMBED_MODEL;
});

afterEach(() => {
  process.env = { ...ENV_ANTERIOR };
});

describe("embeddings remotos (SiliconFlow)", () => {
  it("sem EMBED_API_KEY não há chave", () => {
    expect(temChaveEmbed()).toBe(false);
  });

  it("com EMBED_API_KEY há chave", () => {
    process.env.EMBED_API_KEY = "sk-teste";
    expect(temChaveEmbed()).toBe(true);
  });

  it("chave em branco não conta", () => {
    process.env.EMBED_API_KEY = "   ";
    expect(temChaveEmbed()).toBe(false);
  });

  it("defaults de URL e modelo são os da SiliconFlow", () => {
    expect(EMBED_BASE_URL_PADRAO).toBe("https://api.siliconflow.cn/v1");
    expect(EMBED_MODEL_PADRAO).toBe("BAAI/bge-m3");
  });

  it("sem chave, vetorizarRemoto lança EmbedIndisponivel sem ir à rede", async () => {
    await expect(vetorizarRemoto("texto")).rejects.toBeInstanceOf(EmbedIndisponivel);
  });

  it("lote vazio devolve [] sem chamada de rede", async () => {
    process.env.EMBED_API_KEY = "sk-teste";
    await expect(vetorizarLoteRemoto([])).resolves.toEqual([]);
  });

  it("com chave e rede mockada, devolve vetores na ordem", async () => {
    process.env.EMBED_API_KEY = "sk-teste";
    const original = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      const corpo = JSON.parse(String(init?.body)) as { input: string[] | string };
      const inputs = Array.isArray(corpo.input) ? corpo.input : [corpo.input];
      return new Response(
        JSON.stringify({
          data: inputs.map((_, i) => ({ embedding: [i + 0.1, i + 0.2] })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    try {
      const lote = await vetorizarLoteRemoto(["a", "b", "c"]);
      expect(lote).toHaveLength(3);
      expect(lote[0]).toEqual([0.1, 0.2]);
      expect(lote[2]).toEqual([2.1, 2.2]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("resposta 200 sem data é rejeitada (conteudo, nao so status)", async () => {
    process.env.EMBED_API_KEY = "sk-teste";
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({}), { status: 200 })) as typeof fetch;

    try {
      await expect(vetorizarRemoto("x")).rejects.toBeInstanceOf(EmbedIndisponivel);
    } finally {
      globalThis.fetch = original;
    }
  });
});
