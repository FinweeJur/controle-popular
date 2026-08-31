import { describe, expect, it } from "vitest";
import { calcularIndiceRiscoDireitos, classificarNivelRisco } from "./risco-direitos";

describe("Índice de Risco a Direitos", () => {
  it("classifica faixas de risco corretamente", () => {
    expect(classificarNivelRisco(15).nivel).toBe("baixo");
    expect(classificarNivelRisco(40).nivel).toBe("medio");
    expect(classificarNivelRisco(65).nivel).toBe("alto");
    expect(classificarNivelRisco(85).nivel).toBe("critico");
  });

  it("eleva o score na presença de barragens críticas e contratos com inidôneos", () => {
    const indice = calcularIndiceRiscoDireitos({
      barragensCriticasQtd: 2,
      sobreposicoesTiCarHa: 500,
      infracoesIbamaAtivasQtd: 3,
      contratosDoadoresReais: 5000000,
      empresasSancionadasContratosQtd: 1,
      camaraSemApiAberta: true,
      internacoesCidsAmbientaisQtd: 250,
      taxaMortalidadeEvitavel: 25,
      indiceTransparenciaPntp: 30,
    });

    expect(indice.scoreGeral).toBeGreaterThan(60);
    expect(indice.dimensoes.socioambientalClima.score).toBeGreaterThan(70);
    expect(indice.dimensoes.integridadeErario.score).toBeGreaterThan(70);
    expect(indice.fatoresCriticos.length).toBeGreaterThanOrEqual(4);
  });
});
