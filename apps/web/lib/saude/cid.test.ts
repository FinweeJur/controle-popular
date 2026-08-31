import { describe, expect, it } from "vitest";
import { enriquecerRegistroCid, CIDS_MONITORAMENTO_AMBIENTAL } from "./cid";

describe("Módulo de CIDs e Vigilância Ambiental", () => {
  it("enriquece CID com correlação ambiental de saneamento (A09)", () => {
    const registro = enriquecerRegistroCid("A09", 100, 2, 4.0, 50000);
    expect(registro.codigo).toBe("A09");
    expect(registro.capitulo).toBe("I");
    expect(registro.taxaMortalidade).toBe(2);
    expect(registro.correlacaoAmbiental).toBeDefined();
    expect(registro.correlacaoAmbiental?.fator).toBe("saneamento_hidrico");
  });

  it("enriquece CID de mineração e silicose (J62)", () => {
    const registro = enriquecerRegistroCid("J62", 50, 5, 10.0, 150000);
    expect(registro.codigo).toBe("J62");
    expect(registro.capitulo).toBe("X");
    expect(registro.correlacaoAmbiental?.fator).toBe("mineracao_poeira");
    expect(registro.correlacaoAmbiental?.rotulo).toContain("Silicose");
  });

  it("calcula taxa de mortalidade zero quando não há óbitos", () => {
    const registro = enriquecerRegistroCid("J45", 200, 0, 3.0, 40000);
    expect(registro.taxaMortalidade).toBe(0);
  });
});
