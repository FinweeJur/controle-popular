import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THEMES } from "@/app/[municipio]/components/ThemeSwitcher";

/**
 * Os dois swatches do menu de temas são a identidade visual do bioma. Eles são
 * hex escritos à mão no `THEMES`; o tema real vive em `globals.css`. Sem esta
 * catraca, mudar `--cp-primary` no CSS deixa o menu mentindo em silêncio.
 *
 * A exceção é Alto contraste: a promessa da linha é "Preto & branco puro", não
 * os tokens azul/violeta do bloco de acessibilidade.
 */
const CSS = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8"
);

/** Junta todos os blocos de um seletor (pode haver mais de um `:root`). */
function blocos(seletor: string): string {
  const re = new RegExp(`${seletor}\\s*\\{([^}]*)\\}`, "gi");
  let texto = "";
  let achado: RegExpExecArray | null;
  while ((achado = re.exec(CSS)) !== null) texto += achado[1];
  return texto;
}

function token(bloco: string, nome: string): string | null {
  const achado = bloco.match(new RegExp(`${nome}\\s*:\\s*([^;]+);`));
  return achado ? achado[1].trim().toLowerCase() : null;
}

const RAIZ = blocos(":root");

/** Qual token do CSS cada swatch deve reproduzir. */
const TOKENS: Record<string, [string, string]> = {
  pequi: ["--cp-primary", "--cp-bg"],
  cerrado: ["--cp-primary", "--cp-secondary"],
  "mata-atlantica": ["--cp-primary", "--cp-accent"],
  caatinga: ["--cp-primary", "--cp-secondary"],
  pantanal: ["--cp-primary", "--cp-secondary"],
  light: ["--cp-primary", "--cp-bg"],
  dark: ["--cp-primary", "--cp-bg"],
};

describe("swatches do menu de temas", () => {
  it("tem dois swatches por tema, com valores únicos", () => {
    const valores = THEMES.map((t) => t.value);
    expect(new Set(valores).size).toBe(valores.length);

    for (const tema of THEMES) {
      expect(tema.cor, `${tema.value}: sem cor`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tema.cor2, `${tema.value}: sem cor2`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tema.cor, `${tema.value}: cores iguais`).not.toBe(tema.cor2);
    }
  });

  it("as duas cores batem com os tokens do globals.css", () => {
    for (const tema of THEMES) {
      if (tema.value === "high-contrast") {
        expect(tema.desc).toMatch(/preto & branco/i);
        continue;
      }

      const mapa = TOKENS[tema.value];
      expect(mapa, `${tema.value}: tema sem mapa de token`).toBeDefined();

      const bloco =
        tema.value === "light"
          ? RAIZ
          : blocos(`\\[data-theme=["']?${tema.value}["']?\\]`);

      const [tokenA, tokenB] = mapa;
      expect(token(bloco, tokenA), `${tema.value}: ${tokenA} ausente no CSS`).toBe(
        tema.cor.toLowerCase()
      );
      expect(token(bloco, tokenB), `${tema.value}: ${tokenB} ausente no CSS`).toBe(
        tema.cor2.toLowerCase()
      );
    }
  });
});
