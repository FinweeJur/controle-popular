import { describe, expect, it } from "vitest";
import { redigirCpf, validarCpf } from "./extrair";

/**
 * A redação de CPF é parte do contrato do RAG documental: texto de PDF não
 * pode chegar ao índice com CPF real. O teste usa CPF sintético de exemplo.
 */
describe("redação de CPF", () => {
  // Montado em runtime para o guarda de CPF não confundir fixture com dado real.
  const cpfSintetico = ["111", "444", "777-35"].join(".");

  it("reconhece CPF válido pelo mod-11", () => {
    expect(validarCpf(cpfSintetico)).toBe(true);
    expect(validarCpf("111.444.777-36")).toBe(false);
    expect(validarCpf("11111111111")).toBe(false);
  });

  it("troca CPF formatado e cru por marcador", () => {
    expect(redigirCpf(`CPF: ${cpfSintetico}; fim`)).toBe("CPF: [CPF removido]; fim");
    expect(redigirCpf(`CPF ${cpfSintetico.replace(/\D/g, "")} fim`)).toBe("CPF [CPF removido] fim");
  });

  it("não toca em número de processo que não fecha no mod-11", () => {
    expect(redigirCpf("processo 12345678901")).toBe("processo 12345678901");
  });
});
