import { describe, it, expect } from "vitest";
import {
  carregarBasesClimaRisco,
  listarFontesClimaRisco,
  listarMunicipiosRisco,
  obterRiscoPorIbge,
  obterEstatisticasMacroRisco,
} from "./bases-risco";

describe("bases de clima e vulnerabilidade — BATER, CEMADEN, INMET, INPE, SNIS, MapBiomas", () => {
  it("carrega as 6 fontes oficiais descritas no plano mestre", () => {
    const fontes = listarFontesClimaRisco();
    expect(fontes.length).toBe(6);

    const ids = fontes.map((f) => f.id);
    expect(ids).toContain("bater-ibge-cemaden");
    expect(ids).toContain("cemaden-pluviometros");
    expect(ids).toContain("inmet-avisos");
    expect(ids).toContain("inpe-queimadas");
    expect(ids).toContain("mdr-snis-esgotos");
    expect(ids).toContain("mapbiomas-uso-terra");
  });

  it("valida estatísticas macro do BATER em Minas Gerais", () => {
    const stats = obterEstatisticasMacroRisco();
    expect(stats.total_poligonos_bater_brasil).toBe(8309);
    expect(stats.total_poligonos_bater_mg).toBe(1631);
    expect(stats.populacao_risco_mg).toBe(1377577);
    expect(stats.estacoes_pluvio_mg).toBe(500);
  });

  it("recupera dados de risco por código IBGE", () => {
    // Belo Horizonte (3106200)
    const bh = obterRiscoPorIbge("3106200");
    expect(bh).toBeDefined();
    expect(bh?.nome).toBe("Belo Horizonte");
    expect(bh?.populacao_area_risco).toBe(389218);
    expect(bh?.poligonos_bater).toBe(142);

    // Betim (3106705)
    const betim = obterRiscoPorIbge("3106705");
    expect(betim).toBeDefined();
    expect(betim?.nome).toBe("Betim");
    expect(betim?.populacao_area_risco).toBe(82410);

    // Ribeirão das Neves (3154606)
    const neves = obterRiscoPorIbge("3154606");
    expect(neves).toBeDefined();
    expect(neves?.percentual_populacao_risco).toBe(60.5);
  });

  it("garante ressalvas e links oficiais em todas as fontes", () => {
    const fontes = listarFontesClimaRisco();
    for (const f of fontes) {
      expect(f.link_oficial).toMatch(/^https?:\/\//);
      expect(f.ressalva.length).toBeGreaterThan(15);
      expect(f.metodologia.length).toBeGreaterThan(15);
    }
  });
});
