import { describe, it, expect } from "vitest";
import {
  carregarAcordosReparacao,
  listarAcordos,
  listarMunicipiosAcordos,
  obterEstatisticasAcordos,
  obterReparacaoPorIbge,
} from "./reparacao-mg";

describe("acordos de reparação socioambiental em Minas Gerais (PLANO-EXPANSAO-ACORDOS-MG.md)", () => {
  it("carrega os dois grandes acordos judiciais homologados", () => {
    const acordos = listarAcordos();
    expect(acordos.length).toBe(2);

    const ids = acordos.map((a) => a.id);
    expect(ids).toContain("acordo-brumadinho");
    expect(ids).toContain("acordo-rio-doce");

    const brumadinho = acordos.find((a) => a.id === "acordo-brumadinho");
    expect(brumadinho?.valor_total_nominal).toBe(37680000000);
    expect(brumadinho?.anexos.length).toBe(6);

    const rioDoce = acordos.find((a) => a.id === "acordo-rio-doce");
    expect(rioDoce?.valor_total_nominal).toBe(132000000000);
  });

  it("consolida totais financeiros globais da reparação", () => {
    const totais = obterEstatisticasAcordos();
    expect(totais.total_acordos_reparacao_reais).toBe(169680000000);
    expect(totais.acordo_brumadinho_vale_reais).toBe(37680000000);
    expect(totais.acordo_rio_doce_samarco_vale_bhp_reais).toBe(132000000000);
  });

  it("recupera dados de execução por código IBGE", () => {
    // Brumadinho (3109006)
    const brum = obterReparacaoPorIbge("3109006");
    expect(brum).toBeDefined();
    expect(brum?.nome).toBe("Brumadinho");
    expect(brum?.valor_destinado_nominal).toBe(1500000000);

    // Betim (3106705)
    const betim = obterReparacaoPorIbge("3106705");
    expect(betim).toBeDefined();
    expect(betim?.nome).toBe("Betim");
    expect(betim?.bacia).toBe("Rio Paraopeba");

    // Mariana (3140001)
    const mariana = obterReparacaoPorIbge("3140001");
    expect(mariana).toBeDefined();
    expect(mariana?.nome).toBe("Mariana");
    expect(mariana?.bacia).toBe("Rio Doce");
  });
});
