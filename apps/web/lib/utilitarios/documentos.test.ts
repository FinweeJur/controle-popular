import { describe, expect, test } from "vitest";
import {
  apenasDigitos,
  validarCNPJ,
  validarCPF,
  validarCodigoIBGE,
  verificarDocumento,
} from "./documentos";

/**
 * Testes dos verificadores de dígito.
 *
 * ⚠️ Números usados aqui são sintéticos ou públicos de propósito:
 * - CPF `123.456.789-09` é o CPF canônico de teste do Brasil, isento na lista
 *   `SINTETICOS` de `lib/sem-cpf-no-repo.test.ts` — precisa ser válido para
 *   provar que o validador aceita, sem ser de pessoa real.
 * - CNPJ `11.222.333/0001-81` é público de teste.
 * - Códigos IBGE são de municípios reais e públicos (Belo Horizonte, Betim,
 *   Diamantina, São Paulo), usados para provar a régua contra a fonte.
 */
describe("validarCPF", () => {
  test("aceita o CPF canônico de teste", () => {
    expect(validarCPF("123.456.789-09")).toBe(true);
    expect(validarCPF("12345678909")).toBe(true);
  });

  test("recusa dígitos repetidos, DV errado e tamanho errado", () => {
    expect(validarCPF("000.000.000-00")).toBe(false);
    expect(validarCPF("111.111.111-11")).toBe(false);
    expect(validarCPF("123.456.789-00")).toBe(false);
    expect(validarCPF("123")).toBe(false);
    expect(validarCPF("")).toBe(false);
  });
});

describe("validarCNPJ", () => {
  test("aceita CNPJ público de teste", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validarCNPJ("11222333000181")).toBe(true);
  });

  test("recusa DV errado, repetidos e tamanho errado", () => {
    expect(validarCNPJ("11.222.333/0001-00")).toBe(false);
    expect(validarCNPJ("00000000000000")).toBe(false);
    expect(validarCNPJ("1122233300018")).toBe(false);
  });
});

describe("validarCodigoIBGE", () => {
  test("aceita códigos reais de municípios (fonte: IBGE)", () => {
    expect(validarCodigoIBGE("3106200")).toBe(true); // Belo Horizonte
    expect(validarCodigoIBGE("3106705")).toBe(true); // Betim
    expect(validarCodigoIBGE("3121605")).toBe(true); // Diamantina
    expect(validarCodigoIBGE("3550308")).toBe(true); // São Paulo
  });

  test("recusa dígito verificador errado e tamanho errado", () => {
    expect(validarCodigoIBGE("3106201")).toBe(false);
    expect(validarCodigoIBGE("310620")).toBe(false);
    expect(validarCodigoIBGE("12345678")).toBe(false);
  });
});

describe("apenasDigitos", () => {
  test("limpa máscara e espaços", () => {
    expect(apenasDigitos("123.456.789-09")).toBe("12345678909");
    expect(apenasDigitos(" 31 06200 ")).toBe("3106200");
    expect(apenasDigitos("")).toBe("");
  });
});

describe("verificarDocumento", () => {
  test("despacha para o validador do tipo", () => {
    expect(verificarDocumento("cpf", "12345678909")).toBe(true);
    expect(verificarDocumento("cnpj", "11222333000181")).toBe(true);
    expect(verificarDocumento("ibge", "3106705")).toBe(true);
    expect(verificarDocumento("ibge", "3106700")).toBe(false);
  });
});
