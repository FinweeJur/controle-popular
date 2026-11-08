import { describe, expect, it } from "vitest";
import { caminhoDe, paginasDoEixo, portaDoEixo, EIXOS } from "./mapa";

describe("caminhoDe", () => {
  it("resolve prefixo antigo pela trilha do eixo novo", () => {
    const trilha = caminhoDe("/paraopeba/auxilio").map((n) => n.rotulo);
    expect(trilha).toEqual(["Início", "Casos", "Brumadinho", "Auxílio emergencial"]);
  });

  it("mantém a página no último nível com o href completo", () => {
    const trilha = caminhoDe("/riodoce/processos");
    expect(trilha.at(-1)).toEqual({ rotulo: "Processos", href: "/riodoce/processos" });
  });

  it("não repete eixo e frente na porta do eixo", () => {
    expect(caminhoDe("/ambiental/barragens").map((n) => n.rotulo)).toEqual([
      "Início",
      "Meio ambiente",
      "Barragens",
    ]);
  });

  it("devolve trilha curta para rota fora do mapa", () => {
    const trilha = caminhoDe("/pagina-inexistente");
    expect(trilha).toHaveLength(2);
    expect(trilha[1].rotulo).toBe("Pagina inexistente");
  });

  it("ignora query string na resolução", () => {
    expect(caminhoDe("/jurisprudencia?frente=dh").at(-1)?.href).toBe("/jurisprudencia");
  });
});

describe("EIXOS", () => {
  it("não repete slug de eixo", () => {
    const slugs = EIXOS.map((eixo) => eixo.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("toda frente aponta para rota de entrada", () => {
    for (const eixo of EIXOS) {
      for (const frente of eixo.frentes) {
        expect(frente.rota.startsWith("/")).toBe(true);
        // frente pode não ter rotas próprias (Itatiaiuçu é uma visão filtrada
        // da jurisprudência), mas a lista precisa existir.
        expect(Array.isArray(frente.rotas)).toBe(true);
      }
    }
  });

  it("conta rotas por eixo", () => {
    expect(paginasDoEixo("casos")).toBeGreaterThanOrEqual(20);
    expect(paginasDoEixo("inexistente")).toBe(0);
  });

  it("porta do eixo proposta cai numa página que existe", () => {
    // `/casos` e `/direitos` ainda não têm page.tsx; o menu linkava para
    // elas e o leitor via "página não encontrada" (dono, 08/11/2026).
    const casos = EIXOS.find((e) => e.slug === "casos");
    const direitos = EIXOS.find((e) => e.slug === "direitos");
    expect(casos && portaDoEixo(casos)).toBe("/paraopeba");
    expect(direitos && portaDoEixo(direitos)).toBe("/direitos-em-movimento");

    for (const eixo of EIXOS) {
      expect(portaDoEixo(eixo).startsWith("/")).toBe(true);
    }
  });
});
