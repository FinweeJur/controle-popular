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
  EFEITO_POR_PAGINA,
  TOKEN_COR_PRIMARIA,
  TOKEN_COR_SECUNDARIA,
  deveRenderCanvas,
  opcoesDeCores,
  type EfeitoVanta,
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

  test("efeitos são todos do Vanta com three.js (sem p5, sem cells)", () => {
    // TOPOLOGY/TRUNK exigiriam p5.js — ficaram de fora. CELLS foi
    // abandonado pelo dono em 06/10/2026 junto com a home sem efeito.
    const permitidos = new Set(["globe", "dots", "birds", "net"]);
    for (const efeito of Object.values(EFEITO_POR_PAGINA)) {
      if (efeito === null) continue;
      expect(permitidos.has(efeito)).toBe(true);
    }
  });

  test("efeitos não se repetem — cada página tem identidade própria", () => {
    const valores = Object.values(EFEITO_POR_PAGINA).filter(
      (efeito): efeito is EfeitoVanta => efeito !== null,
    );
    expect(new Set(valores).size).toBe(valores.length);
  });

  test("home sem efeito; cada eixo com o efeito decidido (06/10/2026)", () => {
    expect(EFEITO_POR_PAGINA.home).toBeNull();
    expect(EFEITO_POR_PAGINA.terra).toBe("dots");
    expect(EFEITO_POR_PAGINA.direitos).toBe("birds");
    expect(EFEITO_POR_PAGINA.estado).toBe("globe");
    expect(EFEITO_POR_PAGINA.central).toBe("net");
  });
});

describe("tokens de cor — primária e secundária do tema, nunca hex", () => {
  test("valem para qualquer página: os dois tokens globais do tema", () => {
    expect(TOKEN_COR_PRIMARIA).toBe("--cp-primary");
    expect(TOKEN_COR_SECUNDARIA).toBe("--cp-secondary");
  });

  test("nenhum token é hex literal — a paleta vive no globals.css", () => {
    for (const token of [TOKEN_COR_PRIMARIA, TOKEN_COR_SECUNDARIA]) {
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
  const cores = {
    fundo: "#0b1220",
    cor: "#12467b",
    corSecundaria: "#6d28d9",
  };
  const efeitos = ["dots", "birds", "globe", "net"] as const;

  test("base comum: backgroundColor sempre presente", () => {
    for (const efeito of efeitos) {
      const opcoes = opcoesDeCores(efeito, cores);
      expect(opcoes.backgroundColor).toBe(cores.fundo);
    }
  });

  test("birds recebe color1 primária e color2 secundária (gradiente do tema)", () => {
    const opcoes = opcoesDeCores("birds", cores);
    expect(opcoes.color1).toBe(cores.cor);
    expect(opcoes.color2).toBe(cores.corSecundaria);
    // birds não usa as chaves simples dos outros efeitos
    expect(opcoes.color).toBeUndefined();
    expect(opcoes.glowColor).toBeUndefined();
  });

  test("globe ganha color primária e color2 secundária, sem glowColor", () => {
    // glowColor é chave morta: não existe na fonte do vanta 0.5.24.
    const opcoes = opcoesDeCores("globe", cores);
    expect(opcoes.color).toBe(cores.cor);
    expect(opcoes.color2).toBe(cores.corSecundaria);
    expect(opcoes.glowColor).toBeUndefined();
  });

  test("dots pinta pontos com primária e linhas com secundária", () => {
    const opcoes = opcoesDeCores("dots", cores);
    expect(opcoes.color).toBe(cores.cor);
    expect(opcoes.color2).toBe(cores.corSecundaria);
  });

  test("net tem slot único: só a primária, sem color2", () => {
    const opcoes = opcoesDeCores("net", cores);
    expect(opcoes.color).toBe(cores.cor);
    expect(opcoes.color2).toBeUndefined();
    expect(opcoes.glowColor).toBeUndefined();
  });
});
