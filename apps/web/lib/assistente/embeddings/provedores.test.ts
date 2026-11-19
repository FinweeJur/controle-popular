import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  temChaveRemota,
  provedorDisponivel,
  listarProvedoresNaOrdem,
  resumoParaPainel,
  lerConfigIa,
  ORDEM_PROVEDORES,
} from "./provedores";

const ENV_ANTERIOR = { ...process.env };

function limparIa() {
  delete process.env.AI_API_KEY;
  delete process.env.AI_API_KEY_DEEPSEEK;
  delete process.env.AI_API_KEY_MARITACA;
  delete process.env.MARITACA_API_KEY;
  delete process.env.AI_API_KEY_LING;
  delete process.env.ZAI_API_KEY;
  delete process.env.GLM_API_KEY;
  delete process.env.AI_API_KEY_GLM;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_MODEL;
}

beforeEach(() => {
  limparIa();
});

afterEach(() => {
  process.env = { ...ENV_ANTERIOR };
});

describe("provedores — cascata grátis primeiro (10/11/2026)", () => {
  it("ordem padrão é glm -> maritaca -> deepseek -> ling", () => {
    expect([...ORDEM_PROVEDORES]).toEqual(["glm", "maritaca", "deepseek", "ling"]);
  });

  it("provedor ativo vem primeiro e o resto segue a ordem grátis -> pago", () => {
    process.env.ZAI_API_KEY = "chave-glm";
    process.env.AI_API_KEY_MARITACA = "chave-maritaca";
    process.env.AI_API_KEY_DEEPSEEK = "chave-deepseek";
    process.env.AI_API_KEY_LING = "chave-ling";

    const ativo = lerConfigIa().provedorAtivo;
    const ids = listarProvedoresNaOrdem().map((p) => p.id);
    expect(ids).toEqual([ativo, ...ORDEM_PROVEDORES.filter((id) => id !== ativo)]);
  });

  it("GLM aceita ZAI_API_KEY, GLM_API_KEY e AI_API_KEY_GLM, nessa precedência", () => {
    expect(provedorDisponivel("glm")).toBe(false);
    process.env.AI_API_KEY_GLM = "terceiro";
    expect(provedorDisponivel("glm")).toBe(true);
    process.env.GLM_API_KEY = "segundo";
    process.env.ZAI_API_KEY = "primeiro";
    const glm = listarProvedoresNaOrdem().find((p) => p.id === "glm");
    expect(glm?.apiKey).toBe("primeiro");
    expect(glm?.baseUrl).toBe("https://open.bigmodel.cn/api/paas/v4");
    expect(glm?.modelo).toBe("glm-4.5-flash");
  });

  it("Maritaca aceita AI_API_KEY_MARITACA e MARITACA_API_KEY", () => {
    process.env.MARITACA_API_KEY = "chave-apelido";
    expect(provedorDisponivel("maritaca")).toBe(true);
    process.env.AI_API_KEY_MARITACA = "chave-principal";
    const maritaca = listarProvedoresNaOrdem().find((p) => p.id === "maritaca");
    expect(maritaca?.apiKey).toBe("chave-principal");
  });

  it("provedor sem chave sai da fila, inclusive o Ling (opcional)", () => {
    process.env.ZAI_API_KEY = "chave-glm";
    expect(listarProvedoresNaOrdem().map((p) => p.id)).toEqual(["glm"]);
  });

  it("resumoParaPainel lista os quatro provedores e nunca expõe chave", () => {
    process.env.ZAI_API_KEY = "sk-nao-pode-vazar";
    const resumo = resumoParaPainel();
    expect(resumo.provedores.map((p) => p.id).sort()).toEqual(
      ["deepseek", "glm", "ling", "maritaca"].sort()
    );
    expect(JSON.stringify(resumo)).not.toContain("sk-nao-pode-vazar");
    expect(resumo.provedores.find((p) => p.id === "glm")?.chaveConfigurada).toBe(true);
  });
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

  it("AI_BASE_URL do GLM direciona a chave generica ao glm", () => {
    process.env.AI_API_KEY = "sk-generico";
    process.env.AI_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
    expect(provedorDisponivel("glm")).toBe(true);
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
