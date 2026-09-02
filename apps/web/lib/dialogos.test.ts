import { describe, it, expect } from "vitest";
import {
  DIALOGOS_CATALOGO,
  obterDialogosPorRota,
  obterTopicoDialogo,
} from "./dialogos";

describe("Diálogos Inter-Frentes (Painéis-Sanfona)", () => {
  it("nenhuma rota devolve mais de 3 pontes ativas (regra editorial do portal)", () => {
    for (const dialogo of DIALOGOS_CATALOGO) {
      const pontes = obterDialogosPorRota(dialogo.rotaOrigem);
      expect(pontes.length).toBeGreaterThan(0);
      expect(pontes.length).toBeLessThanOrEqual(3);
    }
  });

  it("todas as pontes possuem razão editorial e nível de confiança declarados", () => {
    for (const dialogo of DIALOGOS_CATALOGO) {
      for (const ponte of dialogo.pontes) {
        expect(ponte.id.trim().length).toBeGreaterThan(0);
        expect(ponte.rotuloAmigavel.trim().length).toBeGreaterThan(5);
        expect(ponte.razaoEditorial.trim().length).toBeGreaterThan(15);
        expect(["fato_documentado", "sinal_investigacao"]).toContain(ponte.nivelConfianca);
        expect(ponte.rotaDestino.startsWith("/")).toBe(true);
        expect(ponte.rotaOrigem.startsWith("/")).toBe(true);
      }
    }
  });

  it("Diamantina possui pontes ativas para ONSA, Executivo e Congresso", () => {
    const pontesDiamantina = obterDialogosPorRota("/diamantina");
    expect(pontesDiamantina.length).toBe(3);

    const frentesDestino = pontesDiamantina.map((p) => p.frenteDestino);
    expect(frentesDestino).toContain("ambiental");
    expect(frentesDestino).toContain("executivo_estadual");
    expect(frentesDestino).toContain("congresso");

    const ponteExecutivo = pontesDiamantina.find((p) => p.frenteDestino === "executivo_estadual");
    expect(ponteExecutivo?.ressalva).toBeDefined();
    expect(ponteExecutivo?.ressalva?.toLowerCase()).toContain("concessão");
  });

  it("Rio Paraopeba possui ponte para reparação judicial e cidades banhadas", () => {
    const pontes = obterDialogosPorRota("/ambiental/nossos-rios/rio-paraopeba");
    expect(pontes.length).toBe(3);

    const frentes = pontes.map((p) => p.frenteDestino);
    expect(frentes).toContain("paraopeba");
    expect(frentes).toContain("cidades");
  });

  it("obterTopicoDialogo devolve o título temático", () => {
    const topico = obterTopicoDialogo("/diamantina");
    expect(topico).toContain("Biribiri");
  });

  it("rota sem pontes cadastradas devolve array vazio com segurança", () => {
    const pontes = obterDialogosPorRota("/rota-que-nao-existe");
    expect(pontes).toEqual([]);
  });
});
