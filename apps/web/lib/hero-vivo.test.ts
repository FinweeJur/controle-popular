/**
 * Testes da lógica pura da abertura viva (`lib/hero-vivo.ts`).
 *
 * Padrão do repo: lógica em `lib/` com teste ao lado, no vitest
 * (o config da suíte inclui todo teste dentro da pasta lib). As guardas
 * aqui existem porque o mapa página→efeito é a fonte única consumida por
 * DOIS componentes (`AberturaHero` e `AberturaCanvas`): divergência entre
 * eles seria defeito silencioso na tela.
 */
import { describe, expect, test } from "vitest";
import {
  COR_TOKEN_POR_PAGINA,
  EFEITO_POR_PAGINA,
  deveRenderCanvas,
  opcoesDeCores,
  type PaginaAbertura,
} from "./hero-vivo";

describe("EFEITO_POR_PAGINA — um efeito por página (dono, 05/10/2026)", () => {
  const PAGINAS: PaginaAbertura[] = [
    "home",
    "terra",
    "direitos",
    "estado",
    "central",
  ];

  test("cobre exatamente as 5 páginas nobres", () => {
    expect(Object.keys(EFEITO_POR_PAGINA).sort()).toEqual(
      [...PAGINAS].sort(),
    );
  });

  test("efeitos são todos do Vanta com three.js (sem p5)", () => {
    // TOPOLOGY/TRUNK exigiriam p5.js — decisão: CELLS na Central.
    const permitidos = new Set(["globe", "dots", "birds", "net", "cells"]);
    for (const efeito of Object.values(EFEITO_POR_PAGINA)) {
      expect(permitidos.has(efeito)).toBe(true);
    }
  });

  test("efeitos não se repetem — cada página tem identidade própria", () => {
    const valores = Object.values(EFEITO_POR_PAGINA);
    expect(new Set(valores).size).toBe(valores.length);
  });

  test("home usa globo; cada eixo usa o efeito decidido", () => {
    expect(EFEITO_POR_PAGINA.home).toBe("globe");
    expect(EFEITO_POR_PAGINA.terra).toBe("dots");
    expect(EFEITO_POR_PAGINA.direitos).toBe("birds");
    expect(EFEITO_POR_PAGINA.estado).toBe("net");
    expect(EFEITO_POR_PAGINA.central).toBe("cells");
  });
});

describe("COR_TOKEN_POR_PAGINA — cor vem do tema, nunca de hex cravado", () => {
  test("home lê --cp-primary; eixos leem --eixo-ativo-cor", () => {
    expect(COR_TOKEN_POR_PAGINA.home).toBe("--cp-primary");
    expect(COR_TOKEN_POR_PAGINA.terra).toBe("--eixo-ativo-cor");
    expect(COR_TOKEN_POR_PAGINA.direitos).toBe("--eixo-ativo-cor");
    expect(COR_TOKEN_POR_PAGINA.estado).toBe("--eixo-ativo-cor");
    expect(COR_TOKEN_POR_PAGINA.central).toBe("--eixo-ativo-cor");
  });

  test("nenhum token é hex literal — a paleta vive no globals.css", () => {
    for (const token of Object.values(COR_TOKEN_POR_PAGINA)) {
      expect(token.startsWith("--")).toBe(true);
    }
  });
});

describe("deveRenderCanvas — reduced-motion é lei, não enfeite", () => {
  const base = {
    reducedMotion: false,
    pointerCoarse: false,
    temaAltoContraste: false,
  };

  test("desktop com mouse fino e sem restrição: canvas ligado", () => {
    expect(deveRenderCanvas(base)).toBe(true);
  });

  test("prefers-reduced-motion: NENHUM canvas", () => {
    expect(deveRenderCanvas({ ...base, reducedMotion: true })).toBe(false);
  });

  test("celular (pointer: coarse): sem canvas — economia de bateria", () => {
    expect(deveRenderCanvas({ ...base, pointerCoarse: true })).toBe(false);
  });

  test("tema alto contraste: sem decoração nenhuma", () => {
    expect(deveRenderCanvas({ ...base, temaAltoContraste: true })).toBe(false);
  });

  test("reduced-motion vence mesmo combinado com tudo ligado", () => {
    expect(
      deveRenderCanvas({
        reducedMotion: true,
        pointerCoarse: false,
        temaAltoContraste: false,
      }),
    ).toBe(false);
  });
});

describe("opcoesDeCores — cada efeito recebe as chaves que aceita", () => {
  const cores = { fundo: "#0b1220", cor: "#12467b" };

  test("base comum: backgroundColor sempre presente", () => {
    for (const efeito of Object.values(EFEITO_POR_PAGINA)) {
      const opcoes = opcoesDeCores(efeito, cores);
      expect(opcoes.backgroundColor).toBe(cores.fundo);
    }
  });

  test("birds recebe color1 e color2 da cor primária (bando do tema)", () => {
    const opcoes = opcoesDeCores("birds", cores);
    expect(opcoes.color1).toBe(cores.cor);
    expect(opcoes.color2).toBe(cores.cor);
    // birds não usa as chaves simples dos outros efeitos
    expect(opcoes.color).toBeUndefined();
    expect(opcoes.glowColor).toBeUndefined();
  });

  test("globe ganha glowColor acompanhando a cor primária", () => {
    const opcoes = opcoesDeCores("globe", cores);
    expect(opcoes.color).toBe(cores.cor);
    expect(opcoes.glowColor).toBe(cores.cor);
  });

  test("cells usa color e color2", () => {
    const opcoes = opcoesDeCores("cells", cores);
    expect(opcoes.color).toBe(cores.cor);
    expect(opcoes.color2).toBe(cores.cor);
  });

  test("dots e net recebem color simples, sem glow", () => {
    for (const efeito of ["dots", "net"] as const) {
      const opcoes = opcoesDeCores(efeito, cores);
      expect(opcoes.color).toBe(cores.cor);
      expect(opcoes.glowColor).toBeUndefined();
      expect(opcoes.color2).toBeUndefined();
    }
  });
});
