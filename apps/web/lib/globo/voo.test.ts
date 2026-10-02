import { describe, expect, it } from "vitest";
import { enderecoVoarAte } from "./voo";

/**
 * O contrato do deep link "Voe até aqui" tem dois lados: este (monta o
 * endereço) e o do globo (`public/terras/globo/js/core/voo.js`, que lê). O
 * teste aqui trava o FORMATO — se alguém renomear um parâmetro de um lado, o
 * link deixa de levar ao ponto e ninguém percebe até um leitor reclamar.
 */
describe("enderecoVoarAte", () => {
  it("monta o endereço com voe, nome e ctx", () => {
    const url = enderecoVoarAte({ lat: -20.3856, lon: -43.5036, nome: "Ouro Preto", ctx: "ouro-preto" });
    expect(url.startsWith("/terras/globo/index.html?")).toBe(true);
    const p = new URLSearchParams(url.slice(url.indexOf("?")));
    expect(p.get("voe")).toBe("-20.3856,-43.5036");
    expect(p.get("nome")).toBe("Ouro Preto");
    expect(p.get("ctx")).toBe("ouro-preto");
  });

  it("omite nome/ctx/z quando não vêm", () => {
    const p = new URLSearchParams(enderecoVoarAte({ lat: -1, lon: -2 }).split("?")[1]);
    expect(p.get("voe")).toBe("-1,-2");
    expect(p.get("nome")).toBeNull();
    expect(p.get("ctx")).toBeNull();
    expect(p.get("z")).toBeNull();
  });

  it("escapa acento e vírgula do rótulo", () => {
    const url = enderecoVoarAte({ lat: -20, lon: -43, nome: "Araçuaí, Coronel Murta" });
    const p = new URLSearchParams(url.slice(url.indexOf("?")));
    expect(p.get("nome")).toBe("Araçuaí, Coronel Murta");
  });
});
