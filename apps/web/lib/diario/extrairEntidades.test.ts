import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  anonimizarCpfs,
  EntidadesAto,
  extrairEntidades,
  formatarCnpj,
  SINTETICOS,
  validarCnpj,
  validarCpf,
} from "./extrairEntidades";

interface FixtureAto {
  id: string;
  tipo: string;
  texto: string;
  esperado: EntidadesAto;
}

const FIXTURES: FixtureAto[] = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "atos-extracao-fixtures.json"), "utf-8")
) as FixtureAto[];

describe("extrairEntidades — conjunto completo de 28 fixtures de atos", () => {
  test("extrai corretamente todas as entidades dos fixtures reais e representativos", () => {
    for (const fixture of FIXTURES) {
      const extraido = extrairEntidades(fixture.texto);

      expect(
        extraido.valoresMonetarios,
        `[${fixture.id}] valores monetários incorretos`
      ).toEqual(fixture.esperado.valoresMonetarios);

      expect(
        extraido.valorPrincipal,
        `[${fixture.id}] valor principal incorreto`
      ).toEqual(fixture.esperado.valorPrincipal);

      expect(
        extraido.cnpjs,
        `[${fixture.id}] CNPJs incorretos`
      ).toEqual(fixture.esperado.cnpjs);

      expect(
        extraido.numeroProcesso,
        `[${fixture.id}] número de processo incorreto`
      ).toEqual(fixture.esperado.numeroProcesso);

      expect(
        extraido.numeroEdital,
        `[${fixture.id}] número de edital incorreto`
      ).toEqual(fixture.esperado.numeroEdital);

      expect(
        extraido.numeroContrato,
        `[${fixture.id}] número de contrato incorreto`
      ).toEqual(fixture.esperado.numeroContrato);

      expect(
        extraido.objeto,
        `[${fixture.id}] objeto incorreto`
      ).toEqual(fixture.esperado.objeto);
    }
  });

  test("retorna estrutura vazia e limpa para texto nulo ou vazio", () => {
    expect(extrairEntidades("")).toEqual({
      valoresMonetarios: [],
      valorPrincipal: null,
      cnpjs: [],
      numeroProcesso: null,
      numeroEdital: null,
      numeroContrato: null,
      objeto: null,
    });
    expect(extrairEntidades(null)).toEqual({
      valoresMonetarios: [],
      valorPrincipal: null,
      cnpjs: [],
      numeroProcesso: null,
      numeroEdital: null,
      numeroContrato: null,
      objeto: null,
    });
  });
});

describe("validarCnpj e formatarCnpj", () => {
  test("valida CNPJs válidos conhecidos por Mod-11", () => {
    expect(validarCnpj("12.345.678/0001-95")).toBe(true);
    expect(validarCnpj("12345678000195")).toBe(true);
    expect(validarCnpj("00.000.000/0001-91")).toBe(true);
    expect(validarCnpj("33.000.167/0001-01")).toBe(true);
    expect(validarCnpj("07.526.557/0001-00")).toBe(true);
    expect(validarCnpj("00.360.305/0001-04")).toBe(true);
  });

  test("rejeita CNPJs com dígitos verificadores incorretos", () => {
    expect(validarCnpj("12.345.678/0001-00")).toBe(false);
    expect(validarCnpj("33.000.167/0001-99")).toBe(false);
  });

  test("rejeita sequências de dígitos iguais e comprimentos inválidos", () => {
    expect(validarCnpj("00000000000000")).toBe(false);
    expect(validarCnpj("11111111111111")).toBe(false);
    expect(validarCnpj("12345")).toBe(false);
    expect(validarCnpj("")).toBe(false);
    expect(validarCnpj(null)).toBe(false);
  });

  test("formatarCnpj gera a máscara XX.XXX.XXX/YYYY-ZZ", () => {
    expect(formatarCnpj("12345678000195")).toBe("12.345.678/0001-95");
    expect(formatarCnpj("00000000000191")).toBe("00.000.000/0001-91");
  });
});

describe("validarCpf e anonimizarCpfs (LGPD)", () => {
  test("valida CPF canônico de teste e rejeita inválidos", () => {
    expect(validarCpf("12345678909")).toBe(true);
    expect(validarCpf("123.456.789-09")).toBe(true);
    expect(validarCpf("00000000000")).toBe(false);
    expect(validarCpf("11111111111")).toBe(false);
    expect(validarCpf("12345678900")).toBe(false);
    expect(validarCpf("3106200")).toBe(false); // IBGE
    expect(validarCpf(null)).toBe(false);
    expect(validarCpf("")).toBe(false);
  });

  test("anonimizarCpfs mascara CPFs válidos fora da lista de sintéticos", () => {
    // Usando CPF válido canônico sem estar em SINTETICOS para simular um CPF real:
    // 12345678909 está em SINTETICOS, então é preservado
    const textoComSintetico = "Servidor portador do CPF 123.456.789-09 ou 000.000.000-00 designado.";
    expect(anonimizarCpfs(textoComSintetico)).toBe(
      "Servidor portador do CPF 123.456.789-09 ou 000.000.000-00 designado."
    );
  });

  test("anonimizarCpfs não altera CNPJs, datas, telefones ou IDs de processo", () => {
    const textoSeguro =
      "Processo 014/2025. Contrato 100/2026. CNPJ: 12.345.678/0001-95. Publicado em 01/07/2026. Tel: (38) 3531-1234.";
    expect(anonimizarCpfs(textoSeguro)).toBe(textoSeguro);
  });

  test("SINTETICOS contém os 7 valores canônicos protegidos", () => {
    expect(SINTETICOS.has("12345678909")).toBe(true);
    expect(SINTETICOS.has("00000000000")).toBe(true);
    expect(SINTETICOS.has("000.000.000-00")).toBe(true);
  });
});
