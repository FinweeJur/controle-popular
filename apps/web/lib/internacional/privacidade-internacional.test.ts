/**
 * @file privacidade-internacional.test.ts
 * @description Testes automatizados da guarda de privacidade para identificadores pessoais
 * dos Estados Unidos (SSN) e do Canadá (SIN por algoritmo de Luhn).
 *
 * Papel no portal:
 * Garante que a régua de proteção de dados pessoais internacionais bloqueie números reais
 * de pessoas físicas (SSN e SIN) sem nunca bloquear identificadores públicos de empresas
 * e órgãos governamentais (CIK da SEC, EIN, UEI e Business Number canadense com prefixo 8).
 */

import { describe, expect, test } from "vitest";
import {
  sinCanadenseValido,
  ssnAmericanoValido,
  sanitizarDadoPessoalInternacional,
} from "./privacidade-internacional";

describe("guarda de privacidade internacional (EUA & Canadá)", () => {
  test("valida SIN canadense real pelo algoritmo de Luhn (ex.: 046-454-286 é inválido por prefixo 0, 130-692-544 é válido)", () => {
    // 130692544: soma de Luhn = 1 + 6 + 0 + 3 + 9 + 4 + 5 + 8 + 4 = 40 (divisível por 10)
    expect(sinCanadenseValido("130-692-544")).toBe(true);
    expect(sinCanadenseValido("130692544")).toBe(true);

    // Dígito verificador adulterado -> falha no Luhn
    expect(sinCanadenseValido("130-692-545")).toBe(false);

    // Prefixo 8 é Business Number (empresa na CRA), nunca SIN de pessoa física
    expect(sinCanadenseValido("812-345-674")).toBe(false);

    // Dígitos repetidos sintéticos
    expect(sinCanadenseValido("111-111-111")).toBe(false);
    expect(sinCanadenseValido("000-000-000")).toBe(false);
  });

  test("valida formato e regras SSA de SSN americano (XXX-XX-XXXX)", () => {
    expect(ssnAmericanoValido("453-21-9876")).toBe(true);

    // Prefixos proibidos pela SSA (000, 666, 900-999)
    expect(ssnAmericanoValido("000-21-9876")).toBe(false);
    expect(ssnAmericanoValido("666-21-9876")).toBe(false);
    expect(ssnAmericanoValido("912-21-9876")).toBe(false);

    // Grupo 00 ou Serial 0000 inválidos
    expect(ssnAmericanoValido("453-00-9876")).toBe(false);
    expect(ssnAmericanoValido("453-21-0000")).toBe(false);

    // Exemplo canônico de teste ignorado
    expect(ssnAmericanoValido("123-45-6789")).toBe(false);
  });

  test("sanitizarDadoPessoalInternacional mascara SSN e SIN mas preserva CIK e Business Number", () => {
    const bruto =
      "Empresa CIK 0001364742 (BN 812-345-674) e registro PF SSN 453-21-9876 e SIN 130-692-544.";
    const sanitizado = sanitizarDadoPessoalInternacional(bruto);

    expect(sanitizado).toContain("0001364742");
    expect(sanitizado).toContain("812-345-674");
    expect(sanitizado).toContain("[SSN-PROTEGIDO]");
    expect(sanitizado).toContain("[SIN-PROTEGIDO]");
    expect(sanitizado).not.toContain("453-21-9876");
    expect(sanitizado).not.toContain("130-692-544");
  });
});
