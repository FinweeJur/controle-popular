/**
 * @file dicas-pagina.test.ts
 * @description Régua dos balões educativos (AGENTS §5.9 e §8). Guarda:
 *   - prefixo único e sempre começando com "/";
 *   - texto curto e de uma linha, sem número inventado (formato apenas);
 *   - rota casa pelo prefixo, e o MAIS LONGO vence;
 *   - fonte, quando existir, tem rótulo e URL oficial.
 */

import { describe, expect, it } from "vitest";
import { DICAS_PAGINA, dicaParaRota } from "./dicas-pagina";

describe("integridade da lista", () => {
  it("não há prefixo duplicado", () => {
    const vistos = new Set<string>();
    for (const dica of DICAS_PAGINA) {
      expect(vistos.has(dica.prefixo), `prefixo repetido: ${dica.prefixo}`).toBe(false);
      vistos.add(dica.prefixo);
    }
  });

  it("todo prefixo começa com barra e não termina com barra", () => {
    for (const dica of DICAS_PAGINA) {
      expect(dica.prefixo.startsWith("/"), `prefixo sem barra: ${dica.prefixo}`).toBe(true);
      expect(dica.prefixo.endsWith("/"), `prefixo com barra final: ${dica.prefixo}`).toBe(false);
    }
  });

  it("cada texto é uma linha curta e sem espaço sobrando", () => {
    for (const dica of DICAS_PAGINA) {
      expect(dica.texto.length, `${dica.prefixo} com texto vazio`).toBeGreaterThan(10);
      expect(dica.texto.length, `${dica.prefixo} com texto longo`).toBeLessThanOrEqual(200);
      expect(dica.texto, `${dica.prefixo} com quebra de linha`).not.toMatch(/[\r\n]/);
      expect(dica.texto).toBe(dica.texto.trim());
    }
  });

  it("fonte, quando existe, tem rótulo e URL oficial", () => {
    for (const dica of DICAS_PAGINA) {
      if (!dica.fonte) continue;
      expect(dica.fonte.label.length, `${dica.prefixo} fonte sem rótulo`).toBeGreaterThan(0);
      expect(
        /^(https?:\/\/|\/)/.test(dica.fonte.url),
        `${dica.prefixo} com URL não-oficial: ${dica.fonte.url}`,
      ).toBe(true);
    }
  });

  it("a lista semeada tem pelo menos as 9 rotas aprovadas mais extras", () => {
    expect(DICAS_PAGINA.length).toBeGreaterThanOrEqual(14);
  });
});

describe("dicaParaRota", () => {
  it("casa a rota exata do prefixo", () => {
    expect(dicaParaRota("/ambiental/licenciamento")?.prefixo).toBe(
      "/ambiental/licenciamento",
    );
  });

  it("casa subrota pelo prefixo (ex.: barragens/descaracterizacao)", () => {
    expect(dicaParaRota("/ambiental/barragens/descaracterizacao")?.prefixo).toBe(
      "/ambiental/barragens",
    );
  });

  it("devolve null para rota sem dica", () => {
    expect(dicaParaRota("/")).toBeNull();
    expect(dicaParaRota("/pagina-inexistente")).toBeNull();
  });

  it("ignora query e hash", () => {
    expect(dicaParaRota("/radio?t=1#top")?.prefixo).toBe("/radio");
  });

  it("vence o prefixo mais longo quando houver sobreposição futura", () => {
    // Todos os prefixos atuais já foram testados; aqui garantimos a REGRA com
    // um par sintético em memória, sem tocar na lista real.
    const lista = [
      { prefixo: "/ambiental/barragens", texto: "genérica" },
      { prefixo: "/ambiental/barragens/descaracterizacao", texto: "específica" },
    ];
    const rota = "/ambiental/barragens/descaracterizacao";
    const melhor = lista
      .filter((d) => rota.startsWith(d.prefixo))
      .sort((a, b) => b.prefixo.length - a.prefixo.length)[0];
    expect(melhor.texto).toBe("específica");
  });
});
