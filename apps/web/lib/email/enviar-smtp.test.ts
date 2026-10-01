/**
 * Testes das partes PURAS do cliente SMTP: a preparação do corpo DATA
 * (dot-stuffing + terminador) e a montagem de CSV. Não abre soquete — o
 * `enviarEmail` depende de rede e fica fora da suíte automatizada.
 */
import { describe, it, expect } from "vitest";
import { prepararDadosSmtp, jsonParaCsv, extrairLinhas } from "./enviar-smtp";

describe("enviar-smtp (partes puras)", () => {
  it("estofa ponto no início de linha e fecha o DATA com CRLF.CRLF", () => {
    expect(prepararDadosSmtp("a\r\n.b\r\n")).toBe("a\r\n..b\r\n.\r\n");
    expect(prepararDadosSmtp(".\r\n")).toBe("..\r\n.\r\n");
  });

  it("não estofa o terminador — regressão de 30/09/2026", () => {
    const corpo = "--limite--\r\n";
    expect(prepararDadosSmtp(corpo)).toBe("--limite--\r\n.\r\n");
    expect(prepararDadosSmtp(corpo).endsWith("..\r\n")).toBe(false);
  });

  it("monta CSV com BOM UTF-8, ponto-e-vírgula e aspas escapadas", () => {
    const csv = jsonParaCsv([{ a: "x;y", b: 'as"pe' }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"x;y";"as""pe"');
  });

  it("extrai o primeiro array de objetos de dataset heterogêneo", () => {
    expect(extrairLinhas([{ a: 1 }])).toEqual([{ a: 1 }]);
    expect(extrairLinhas({ x: 1, lista: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(extrairLinhas({ x: 1 })).toBeNull();
  });
});
