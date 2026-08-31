import { describe, it, expect } from "vitest";
import {
  verificarCitacao,
  normalizarNumero,
  extrairNumerosChecaveis,
  rotuloVerificacao,
} from "./verificador-citacao";
import { similaridadeLexical, tokensDe } from "./embeddings/similaridade";

/**
 * Testes do verificador de citação. A régua vem do F4-benchmark do
 * congresso: falso alarme em métrica de alucinação é pior que não ter a
 * métrica — então os casos de "número fora" aqui são SINAIS (parcial), e só
 * marcador `[n]` inválido é falha estrutural.
 */

const FONTES = [
  { texto: "Betim gastou R$ 1,65 bilhão em 2025 com 214 contratos." },
  { texto: "A auditoria AECOM analisou 467 documentos em 16 eixos." },
  { texto: "O repasse do acordo soma R$ 5,48 bilhões pagos a 26 municípios." },
];

describe("normalizarNumero e extrairNumerosChecaveis", () => {
  it("normaliza milhar e decimal: 1.214 → 1214, 1 214 → 1214, 5,48 → 5.48", () => {
    expect(normalizarNumero("1.214")).toBe("1214");
    expect(normalizarNumero("1 214")).toBe("1214");
    expect(normalizarNumero("5,48")).toBe("5.48");
    expect(normalizarNumero("2025")).toBe("2025");
  });

  it("extrai só números checáveis: 3+ dígitos ou decimal", () => {
    expect(extrairNumerosChecaveis("3 contratos, R$ 5,48 bi e 1214 linhas")).toEqual([
      "5.48",
      "1214",
    ]);
    expect(extrairNumerosChecaveis("votou 1 e 2 vezes")).toEqual([]);
  });

  it("deduplica números repetidos", () => {
    expect(extrairNumerosChecaveis("2025 e 2025 de novo")).toEqual(["2025"]);
  });
});

describe("verificarCitacao -- marcadores [n]", () => {
  it("aceita marcadores dentro do intervalo e lista os usados", () => {
    const v = verificarCitacao("Betim gastou [1]. A auditoria viu [2].", FONTES);
    expect(v.ok).toBe(true);
    expect(v.marcadoresUsados).toEqual([1, 2]);
    expect(v.marcadoresInvalidos).toEqual([]);
  });

  it("falha com marcador fora do intervalo (estrutural)", () => {
    const v = verificarCitacao("Veja a fonte [7].", FONTES);
    expect(v.ok).toBe(false);
    expect(v.marcadoresInvalidos).toEqual([7]);
    expect(rotuloVerificacao(v)).toBe("falhou");
  });

  it("aceita resposta sem marcador (ok continua true; número checa contra todas)", () => {
    const v = verificarCitacao("Betim gastou 1,65 bilhão.", FONTES);
    expect(v.ok).toBe(true);
    expect(v.marcadoresUsados).toEqual([]);
    expect(v.numerosFora).toEqual([]);
  });
});

describe("verificarCitacao -- números ↔ trecho citado", () => {
  it("número presente na fonte citada passa limpo", () => {
    const v = verificarCitacao("Foram 467 documentos analisados [2].", FONTES);
    expect(v.numerosFora).toEqual([]);
    expect(rotuloVerificacao(v)).toBe("ok");
  });

  it("número ausente de toda fonte vira sinal 'parcial'", () => {
    const v = verificarCitacao("Foram 9999 documentos analisados [2].", FONTES);
    expect(v.numerosFora).toContain("9999");
    expect(rotuloVerificacao(v)).toBe("parcial");
  });

  it("ignora número que o usuário já trouxe na pergunta", () => {
    const v = verificarCitacao(
      "Sim, a previsão para 2025 está na fonte [1].",
      FONTES,
      "Quanto Betim gastou em 2025?"
    );
    expect(v.numerosFora).not.toContain("2025");
  });

  it("casa grafias diferentes: R$ 1,65 bi na resposta vs '1,65 bilhão' na fonte", () => {
    const v = verificarCitacao("Betim gastou R$ 1,65 bi [1].", FONTES);
    expect(v.numerosFora).toEqual([]);
  });

  it("não acusa arredondamento: '5,5 bi' vs fonte '5,48 bi' vira sinal, não bloqueio", () => {
    const v = verificarCitacao("O repasse soma R$ 5,5 bi [3].", FONTES);
    expect(v.ok).toBe(true);
    expect(v.numerosFora).toContain("5.5");
    expect(rotuloVerificacao(v)).toBe("parcial");
  });
});

describe("similaridadeLexical -- o lado BM25-leve do ranking híbrido", () => {
  it("texto idêntico dá 1", () => {
    expect(similaridadeLexical("contratos de Betim", "contratos de Betim")).toBe(1);
  });

  it("textos sem token em comum dão 0", () => {
    expect(similaridadeLexical("contratos de Betim", "auditoria da barragem")).toBe(0);
  });

  it("sobreposição parcial fica entre 0 e 1", () => {
    const s = similaridadeLexical("licenciamento ambiental em Minas", "licenciamento de barragens");
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it("é insensível a acento e caixa", () => {
    expect(similaridadeLexical("Licenciamento", "licenciamento")).toBe(1);
  });

  it("texto só de stopwords ou vazio dá 0, não erro", () => {
    expect(similaridadeLexical("de e para", "qualquer coisa")).toBe(0);
    expect(similaridadeLexical("", "")).toBe(0);
  });

  it("tokensDe remove stopwords e palavras curtas", () => {
    expect(tokensDe("a de e o para contratos betim")).toEqual(["contratos", "betim"]);
  });
});
