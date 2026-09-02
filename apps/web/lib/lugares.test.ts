import { describe, it, expect } from "vitest";
import {
  LUGARES_CATALOGO,
  obterLugar,
  listarLugares,
  lugaresPorMunicipioIbge,
} from "./lugares";

describe("Registro central de Lugares (ONSA Meio Ambiente & Territórios)", () => {
  it("todos os lugares contêm obrigatoriamente as tags 'natureza' e 'ecossistema'", () => {
    for (const lugar of LUGARES_CATALOGO) {
      expect(lugar.tags).toContain("natureza");
      expect(lugar.tags).toContain("ecossistema");
    }
  });

  it("nenhum lugar tem campos obrigatórios vazios", () => {
    for (const lugar of LUGARES_CATALOGO) {
      expect(lugar.id.trim().length).toBeGreaterThan(0);
      expect(lugar.nome.trim().length).toBeGreaterThan(0);
      expect(lugar.resumoVozCidada.trim().length).toBeGreaterThan(10);
      expect(lugar.biomas.length).toBeGreaterThan(0);
      expect(lugar.municipiosIbge.length).toBeGreaterThan(0);
    }
  });

  it("obterLugar encontra rio-paraopeba e serra-do-espinhaco", () => {
    const paraopeba = obterLugar("rio-paraopeba");
    expect(paraopeba).toBeDefined();
    expect(paraopeba?.tipo).toBe("rio");
    expect(paraopeba?.subfrenteOnsa).toBe("nossos-rios");

    const espinhaco = obterLugar("serra-do-espinhaco");
    expect(espinhaco).toBeDefined();
    expect(espinhaco?.tipo).toBe("serra");
    expect(espinhaco?.subfrenteOnsa).toBe("nossas-serras");
  });

  it("listarLugares filtra corretamente por tipo", () => {
    const rios = listarLugares("rio");
    expect(rios.length).toBeGreaterThanOrEqual(4);
    for (const r of rios) {
      expect(r.tipo).toBe("rio");
    }

    const serras = listarLugares("serra");
    expect(serras.length).toBeGreaterThanOrEqual(3);
    for (const s of serras) {
      expect(s.tipo).toBe("serra");
    }
  });

  it("lugaresPorMunicipioIbge localiza bacias e serras por código IBGE", () => {
    // Diamantina: 3121605
    const lugaresDiamantina = lugaresPorMunicipioIbge("3121605");
    const ids = lugaresDiamantina.map((l) => l.id);
    expect(ids).toContain("serra-do-espinhaco");
    expect(ids).toContain("rio-jequitinhonha");
  });
});
