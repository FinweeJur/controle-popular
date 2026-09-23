import { describe, it, expect } from "vitest";
import { montarCamadasCatalogo, listarCamadasLab, serieParaItens, dadoParaJanela } from "./lab-camadas";
import { CATALOGO_DADOS } from "@/lib/laboratorio/dados-catalogo";

describe("lab-camadas — 23 camadas PowerBI", () => {
  it("monta janela para cada id do catálogo", () => {
    const mapa = montarCamadasCatalogo();
    for (const d of CATALOGO_DADOS) {
      expect(mapa[d.id]).toBeDefined();
      expect(mapa[d.id].titulo).toBe(d.nome);
      expect(mapa[d.id].fonteUrl).toBe(d.rotaPortal);
    }
  });

  it("listarCamadasLab devolve ao menos 22 camadas ordenadas", () => {
    const lista = listarCamadasLab();
    expect(lista.length).toBeGreaterThanOrEqual(22);
    const nomes = lista.map((c) => c.nome);
    expect([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(nomes);
  });

  it("inclui a camada de salários do Judiciário", () => {
    expect(listarCamadasLab().some((c) => c.id === "judiciario-remuneracoes")).toBe(true);
  });

  it("serieParaItens trunca em 40 (agregado, não acervo bruto)", () => {
    const series = [{
      nome: "s",
      pontos: Array.from({ length: 100 }, (_, i) => ({ x: `x${i}`, y: i })),
    }];
    expect(serieParaItens(series)).toHaveLength(40);
  });

  it("dadoParaJanela sem pontos continua com titulo e fonte (lacuna é informação)", () => {
    const janela = dadoParaJanela({
      id: "vazio",
      nome: "Vazio",
      categoria: "ambiental",
      fonte: "teste",
      rotaPortal: "/x",
      dadosParaDither: () => [],
      filtrosDisponiveis: [],
      descricao: "vazio",
    });
    expect(janela.titulo).toBe("Vazio");
    expect(janela.itens).toEqual([]);
    expect(janela.fonteLabel).toContain("sem pontos");
  });
});
