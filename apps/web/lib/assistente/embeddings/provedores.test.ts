import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { temChaveRemota, provedorDisponivel, listarProvedoresNaOrdem, resumoParaPainel } from "./provedores";

const ENV_ANTERIOR = { ...process.env };

function limparIa() {
  delete process.env.AI_API_KEY;
  delete process.env.AI_API_KEY_DEEPSEEK;
  delete process.env.AI_API_KEY_MARITACA;
  delete process.env.AI_API_KEY_LING;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_MODEL;
}

beforeEach(() => {
  limparIa();
});

afterEach(() => {
  process.env = { ...ENV_ANTERIOR };
});

describe("provedores — fallback AI_API_KEY generica (caso Guara, 23/09)", () => {
  it("sem nenhuma chave, temChaveRemota e false", () => {
    expect(temChaveRemota()).toBe(false);
  });

  it("so AI_API_KEY + AI_BASE_URL Maritaca: maritaca fica disponivel", () => {
    process.env.AI_API_KEY = "sk-generico";
    process.env.AI_BASE_URL = "https://chat.maritaca.ai/api";
    expect(temChaveRemota()).toBe(true);
    expect(provedorDisponivel("maritaca")).toBe(true);
    expect(provedorDisponivel("deepseek")).toBe(false);
    expect(provedorDisponivel("ling")).toBe(false);
  });

  it("AI_BASE_URL DeepSeek direciona a chave generica ao deepseek", () => {
    process.env.AI_API_KEY = "sk-generico";
    process.env.AI_BASE_URL = "https://api.deepseek.com";
    expect(provedorDisponivel("deepseek")).toBe(true);
    expect(provedorDisponivel("maritaca")).toBe(false);
  });

  it("sem AI_BASE_URL, padrao e maritaca (Guara injeta Maritaca)", () => {
    process.env.AI_API_KEY = "sk-generico";
    expect(provedorDisponivel("maritaca")).toBe(true);
    expect(provedorDisponivel("deepseek")).toBe(false);
  });

  it("variante especifica tem prioridade sobre a generica", () => {
    process.env.AI_API_KEY = "sk-generico";
    process.env.AI_API_KEY_DEEPSEEK = "sk-deepseek";
    process.env.AI_BASE_URL = "https://chat.maritaca.ai/api";
    // variante existe => generica NAO e usada para ninguem
    expect(provedorDisponivel("deepseek")).toBe(true);
    expect(provedorDisponivel("maritaca")).toBe(false);
    expect(temChaveRemota()).toBe(true);
  });

  it("listarProvedoresNaOrdem inclui so o provedor da chave generica", () => {
    process.env.AI_API_KEY = "sk-generico";
    process.env.AI_BASE_URL = "https://chat.maritaca.ai/api";
    const lista = listarProvedoresNaOrdem();
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe("maritaca");
    expect(lista[0].apiKey).toBe("sk-generico");
  });

  it("resumoParaPainel nunca expoe o valor da chave", () => {
    process.env.AI_API_KEY = "sk-secreto-nao-pode-vazar";
    process.env.AI_BASE_URL = "https://chat.maritaca.ai/api";
    const resumo = resumoParaPainel();
    const texto = JSON.stringify(resumo);
    expect(texto).not.toContain("sk-secreto");
    const maritaca = resumo.provedores.find((p) => p.id === "maritaca");
    expect(maritaca?.chaveConfigurada).toBe(true);
  });
});
