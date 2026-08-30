import { describe, it, expect } from "vitest";
import { montarTimelineAmbiental, NoticiaMonitoramento } from "./sigma";
import { EVENTOS_AMBIENTAIS_SIGMA } from "./sigma-dados";

const NOTICIAS_MOCK: NoticiaMonitoramento[] = [
  {
    titulo: "Noticia anterior 1",
    href: "https://example.com/1",
    data: "2025-09-10",
    fonte: "Folha",
    descricao: "Descricao noticia anterior 1"
  },
  {
    titulo: "Noticia entre datas",
    href: "https://example.com/2",
    data: "2026-06-15",
    fonte: "G1",
    descricao: "Descricao noticia entre datas"
  },
  {
    titulo: "Noticia posterior",
    href: "https://example.com/3",
    data: "2026-08-01",
    fonte: "Estadao",
    descricao: "Descricao noticia posterior"
  }
];

describe("montarTimelineAmbiental", () => {
  it("mescla eventos e noticias em ordem cronologica", () => {
    const resultado = montarTimelineAmbiental(
      EVENTOS_AMBIENTAIS_SIGMA,
      NOTICIAS_MOCK
    );

    expect(resultado.length).toBe(8);
    for (let i = 1; i < resultado.length; i++) {
      expect(resultado[i].data >= resultado[i - 1].data).toBe(true);
    }
  });

  it("retorna array vazio com entradas vazias", () => {
    const resultado = montarTimelineAmbiental([], []);
    expect(resultado).toEqual([]);
  });

  it("retorna apenas eventos ordenados quando nao ha noticias", () => {
    const resultado = montarTimelineAmbiental(EVENTOS_AMBIENTAIS_SIGMA, []);

    expect(resultado.length).toBe(EVENTOS_AMBIENTAIS_SIGMA.length);
    expect(resultado.every((i) => i.tipo === "evento")).toBe(true);
    for (let i = 1; i < resultado.length; i++) {
      expect(resultado[i].data >= resultado[i - 1].data).toBe(true);
    }
  });

  it("retorna apenas noticias ordenadas quando nao ha eventos", () => {
    const resultado = montarTimelineAmbiental([], NOTICIAS_MOCK);

    expect(resultado.length).toBe(NOTICIAS_MOCK.length);
    expect(resultado.every((i) => i.tipo === "noticia")).toBe(true);
    for (let i = 1; i < resultado.length; i++) {
      expect(resultado[i].data >= resultado[i - 1].data).toBe(true);
    }
  });

  it("cores estao corretas para cada tipo de evento", () => {
    const resultado = montarTimelineAmbiental(EVENTOS_AMBIENTAIS_SIGMA, []);

    const coresMap: Record<string, string> = {};
    for (const item of resultado) {
      coresMap[item.titulo] = item.cor;
    }

    expect(coresMap["Pesquisadores pedem paralisacao da extracao de litio da Sigma"]).toBe("#ca8a04");
    expect(coresMap["Fundador da Sigma Lithium denuncia irregularidades"]).toBe("#ca8a04");
    expect(coresMap["A Sigma Lithium na geopolitica mundial do litio"]).toBe("#2563eb");
    expect(coresMap["FEAM embarga operacoes da Sigma Lithium"]).toBe("#dc2626");
    expect(coresMap["Sigma deu informacao falsa e operou antes de autorizacao"]).toBe("#ea580c");
  });
});
