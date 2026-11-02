/**
 * Guarda do mapa de áreas do painel da Prefeitura.
 *
 * O que protege: (1) nenhuma tela some nem aparece duas vezes — o painel
 * promete reunir a família inteira; (2) o href de uma tela nunca aponta para
 * rota absorvida (ponte), que é o link quebrado silencioso; (3) o N do botão
 * continua batendo com a lista que a seção entrega.
 *
 * Fonte: `lib/prefeitura/areas.ts`.
 */
import { describe, it, expect } from "vitest";
import { AREAS, TELAS, TOTAL_DE_TELAS, areaPorSlug, hrefDaArea } from "./areas";

/** Rotas vivas da família em 02/11/2026 (as pontes ficam de fora). */
const ROTAS_VIVAS = [
  "/prefeitura/contratos",
  "/prefeitura/cultura",
  "/prefeitura/despesas",
  "/prefeitura/diario",
  "/prefeitura/fornecedores",
  "/prefeitura/licitacoes",
  "/prefeitura/obras",
  "/prefeitura/servidores",
];

/** Rotas que viraram ponte ou recorte: não podem ser tela de nenhuma área. */
const ABSORVIDAS = ["/prefeitura/diarias", "/prefeitura/legislacao"];

describe("mapa de áreas do painel da Prefeitura", () => {
  it("tem seis recortes, todos com tela", () => {
    expect(AREAS).toHaveLength(6);
    for (const area of AREAS) {
      expect(area.telas.length, `área ${area.slug} sem tela`).toBeGreaterThan(0);
    }
  });

  it("não repete slug de área nem slug de tela", () => {
    const areas = AREAS.map((a) => a.slug);
    expect(new Set(areas).size).toBe(areas.length);
    const telas = TELAS.map((t) => t.slug);
    expect(new Set(telas).size).toBe(telas.length);
  });

  it("entrega todas as rotas vivas exatamente uma vez", () => {
    const hrefs = TELAS.map((t) => t.href).filter((h): h is string => h !== null);
    expect(hrefs.slice().sort()).toEqual(ROTAS_VIVAS.slice().sort());
  });

  it("não aponta para rota absorvida", () => {
    for (const tela of TELAS) {
      if (tela.href) {
        expect(ABSORVIDAS).not.toContain(tela.href);
      }
    }
  });

  it("tela sem href tem âncora na própria página", () => {
    for (const tela of TELAS) {
      if (tela.href === null) {
        expect(tela.ancora, `tela ${tela.slug} sem âncora`).toBeTruthy();
      }
    }
  });

  it("denominador é a soma das facetas, não um número digitado", () => {
    const soma = AREAS.reduce((total, area) => total + area.telas.length, 0);
    expect(TOTAL_DE_TELAS).toBe(soma);
    expect(TOTAL_DE_TELAS).toBe(9);
  });

  it("reconhece a área pedida e ignora o resto", () => {
    expect(areaPorSlug("pessoal")?.slug).toBe("pessoal");
    expect(areaPorSlug("nao-existe")).toBeUndefined();
    expect(areaPorSlug(undefined)).toBeUndefined();
    expect(areaPorSlug(["pessoal", "obras"])).toBeUndefined();
  });

  it("href do recorte carrega a âncora da seção", () => {
    expect(hrefDaArea("compras")).toBe("/prefeitura?area=compras#area-compras");
  });
});
