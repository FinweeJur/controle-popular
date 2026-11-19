import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTE_EIXO, arteDoEixo, arteDoHeroEixo } from "./arte-eixos";

/**
 * O defeito que este teste trava: a home carregava o arquivo original de
 * 1376 px com `loading="lazy"` e o cartão de 345 px ficava sem arte até a
 * rolagem (eixos 5, 6, 8 e 9 vazios na captura do dono, 18/11/2026).
 * A miniatura de `public/images/eixos/hero/` tem de existir para todo eixo,
 * senão o cartão volta a ficar em branco.
 */
const PUBLIC = path.join(process.cwd(), "public");

describe("arte dos eixos", () => {
  it("todo eixo tem miniatura de hero existente no public", () => {
    const faltando = Object.entries(ARTE_EIXO)
      .filter(([, arte]) => !arte.srcHero)
      .map(([slug]) => slug);
    expect(faltando).toEqual([]);

    for (const [slug, arte] of Object.entries(ARTE_EIXO)) {
      const arquivo = path.join(PUBLIC, arte.srcHero!.replace(/^\//, ""));
      expect(existsSync(arquivo), `${slug}: ${arte.srcHero}`).toBe(true);
    }
  });

  it("cada eixo aponta para uma miniatura própria", () => {
    const hero = Object.values(ARTE_EIXO).map((arte) => arteDoHeroEixo(arte));
    expect(new Set(hero).size).toBe(hero.length);
  });

  it("eixo desconhecido cai na cachoeira do Cerrado", () => {
    expect(arteDoEixo("nao-existe").src).toBe(ARTE_EIXO["meio-ambiente"].src);
  });
});
