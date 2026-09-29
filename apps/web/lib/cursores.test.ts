/**
 * ═══ CURSORES DO SITE — KORKHON 2.0 XS ═══
 *
 * O ponteiro do mouse do portal é o pacote de domínio público de EfeMaden
 * (https://www.rw-designer.com/cursor-set/korkhon-2-0-sx), copiado para
 * `public/cursor/` e referenciado em dois lugares que mudam juntos:
 *
 *  - `apps/web/app/globals.css`  — todo o portal (Next);
 *  - `apps/web/public/terras/globo/css/hud.css` — o globo 3D, que não
 *    passa pelo CSS do Next e por isso espelha o bloco.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Cursores falham em silêncio: se a URL estiver errada, o navegador cai no
 * fallback (`auto`, `pointer`, `text`) e a página continua "funcionando"
 * com o ponteiro nativo do sistema. Ninguém abre o DevTools para descobrir
 * isso. Aqui o arquivo é conferido dos dois lados, como manda o AGENTS:
 *
 *  1. CSS → disco: todo `url("/cursor/...")` aponta para arquivo existente;
 *  2. disco → CSS: nenhum `.cur` órfão em `public/cursor/`;
 *  3. hotspot: o par `x y` escrito no CSS tem que ser o mesmo que está
 *     gravado no cabeçalho do `.cur` (offset 10 = X, offset 12 = Y, os
 *     campos `wPlanes`/`wBitCount` do ICONDIRENTRY). Divergiu, o clique
 *     cai fora do desenho.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do app Next (`apps/web`), derivada deste arquivo, não do cwd. */
const RAIZ = fileURLToPath(new URL("../", import.meta.url));

const CSS = [
  "app/globals.css",
  "public/terras/globo/css/hud.css",
].map((rel) => ({
  rel,
  texto: fs.readFileSync(path.join(RAIZ, rel), "utf-8"),
}));

const DIR_CURSOR = path.join(RAIZ, "public", "cursor");

/** Lê o hotspot gravado no cabeçalho de um .cur (ICONDIRENTRY). */
function hotspotDoArquivo(caminho: string): { x: number; y: number } {
  const b = fs.readFileSync(caminho);
  return { x: b.readInt16LE(10), y: b.readInt16LE(12) };
}

describe("cursores do site -- CSS e disco batem", () => {
  it("todo url('/cursor/...') do CSS existe em public/cursor e o hotspot bate", () => {
    for (const { rel, texto } of CSS) {
      const re = /url\("\/cursor\/([\w-]+)\.cur"\)\s+(\d+)\s+(\d+)/g;
      const achados = [...texto.matchAll(re)];
      expect(achados.length, `${rel} sem url de cursor`).toBeGreaterThan(0);
      for (const [, nome, x, y] of achados) {
        const arquivo = path.join(DIR_CURSOR, `${nome}.cur`);
        expect(
          fs.existsSync(arquivo),
          `${rel} aponta /cursor/${nome}.cur, que não existe`
        ).toBe(true);
        expect(fs.statSync(arquivo).size, `${nome}.cur vazio`).toBeGreaterThan(0);
        const hotspot = hotspotDoArquivo(arquivo);
        expect(
          { x: Number(x), y: Number(y) },
          `hotspot do CSS difere do .cur em ${nome}.cur (${rel})`
        ).toEqual(hotspot);
      }
    }
  });

  it("nenhum .cur órfão: tudo que está em public/cursor é referenciado", () => {
    const referenciados = new Set(
      CSS.flatMap(({ texto }) =>
        [...texto.matchAll(/url\("\/cursor\/([\w-]+)\.cur"\)/g)].map((m) => m[1])
      )
    );
    for (const arquivo of fs.readdirSync(DIR_CURSOR)) {
      expect(
        referenciados.has(arquivo.replace(/\.cur$/, "")),
        `${arquivo} está em public/cursor e ninguém o usa`
      ).toBe(true);
    }
  });

  it("os quatro estados essenciais estão ligados no portal", () => {
    const { texto } = CSS[0];
    expect(texto, "seta padrão sem arquivo").toMatch(
      /\*\s*\{\s*cursor: url\("\/cursor\/pointer\.cur"\)/
    );
    expect(texto).toMatch(/url\("\/cursor\/link\.cur"\)/);
    expect(texto).toMatch(/url\("\/cursor\/beam\.cur"\)/);
    expect(texto).toMatch(/url\("\/cursor\/unavailable\.cur"\)/);
    expect(texto, "sem !important o Tailwind vence").toMatch(/!important/);
  });
});
