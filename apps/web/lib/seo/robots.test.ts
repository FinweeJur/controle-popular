/**
 * Guarda do `robots.txt` — política de crawling do portal.
 *
 * Três medições de 04/10/2026 que viraram teste em vez de comentário:
 *
 *  1. **Sombra:** existiam DOIS robos — `public/robots.txt` (o servido, 24
 *     blocos de User-agent) e `app/robots.ts` (11 blocos, nunca foi ao ar).
 *     Duas fontes de regra é a mesma armadilha do webhook do bot (AGENTS
 *     5.11): quem edita a errada sai achando que consertou.
 *  2. **Host misto:** o `Sitemap:`/`Host:` apontava para a raiz
 *     `controlepopular.com.br`, que devolve 301 para o `www` — anunciava
 *     ao buscador uma URL que redireciona.
 *  3. **Política de IA:** o cabeçalho editorial veda treinamento comercial,
 *     e a regra que torna isso real é o bloco `User-agent: GPTBot` etc.
 *     Apagar um bloco por engano não quebra build nenhum.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const PUBLICO = fileURLToPath(new URL("../../public/robots.txt", import.meta.url));
const SOMBRA = fileURLToPath(new URL("../../app/robots.ts", import.meta.url));

/** Host canônico — precisa bater com `metadataBase` do `app/layout.tsx`. */
const WWW = "https://www.controlepopular.com.br";

describe("public/robots.txt", () => {
  const texto = readFileSync(PUBLICO, "utf-8");

  it("é a única fonte: app/robots.ts não existe mais", () => {
    expect(
      existsSync(SOMBRA),
      "app/robots.ts voltou — o robo servido é o de public/robots.txt"
    ).toBe(false);
  });

  it("anuncia Sitemap e Host no host www", () => {
    expect(texto).toContain(`Sitemap: ${WWW}/sitemap.xml`);
    expect(texto).toContain(`Host: ${WWW}`);
  });

  it("nenhum sitemap anunciado sem o www", () => {
    // A raiz devolve 301 para o www — o buscador não precisa dessa ida e volta.
    const semWww = texto
      .split("\n")
      .filter((l) => /^(Sitemap|Host):/.test(l.trim()) && l.includes("://controlepopular"));
    expect(semWww, `linhas sem www: ${semWww.join(" | ")}`).toEqual([]);
  });

  it("mantém os blocos que aplicam a política de IA", () => {
    for (const bot of ["GPTBot", "CCBot", "anthropic-ai", "ClaudeBot", "Google-Extended"]) {
      expect(texto, `bloco ${bot} sumiu`).toContain(`User-agent: ${bot}`);
    }
  });

  it("mantém as regras de admin e painel fora do índice", () => {
    for (const regra of ["/*/admin", "/*/api/", "/painel/", "/api/painel/"]) {
      expect(texto, `regra ${regra} sumiu`).toContain(`Disallow: ${regra}`);
    }
  });
});
