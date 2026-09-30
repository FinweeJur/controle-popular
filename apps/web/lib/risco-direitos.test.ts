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

  it("devolve o DETALHAMENTO item a item, com o valor medido e a fonte", () => {
    const indice = calcularIndiceRiscoDireitos({
      barragensCriticasQtd: 2,
      sobreposicoesTiCarHa: null,
      infracoesIbamaAtivasQtd: 3,
      contratosDoadoresReais: 5_000_000,
      empresasSancionadasContratosQtd: 1,
      camaraSemApiAberta: true,
      internacoesCidsAmbientaisQtd: 250,
      taxaMortalidadeEvitavel: null,
      indiceTransparenciaPntp: 30,
    });

    const saude = indice.dimensoes.saudeVida;
    expect(saude.piso).toBe(15);
    const cid = saude.itens.find((i) => i.rotulo.includes("CID"))!;
    expect(cid.somou).toBe(true);
    expect(cid.pontos).toBe(40);
    expect(cid.valorMedido).toContain("250");
    expect(cid.fonte).toContain("DATASUS");
  });

  it("insumo NÃO COLETADO aparece como tal e não soma pontos", () => {
    const indice = calcularIndiceRiscoDireitos({
      barragensCriticasQtd: 0,
      sobreposicoesTiCarHa: null,
      infracoesIbamaAtivasQtd: 0,
      contratosDoadoresReais: 0,
      empresasSancionadasContratosQtd: 0,
      camaraSemApiAberta: null,
      internacoesCidsAmbientaisQtd: null,
      taxaMortalidadeEvitavel: null,
      indiceTransparenciaPntp: null,
    });

    const mortalidade = indice.dimensoes.saudeVida.itens.find((i) =>
      i.rotulo.includes("Mortalidade")
    )!;
    expect(mortalidade.coletado).toBe(false);
    expect(mortalidade.valorMedido).toBe("não coletado");
    expect(mortalidade.somou).toBe(false);

    // Tudo no piso: 0,30×15 + 0,30×10 + 0,25×15 + 0,15×10 = 12,75 → 13.
    expect(indice.scoreGeral).toBe(13);
  });
});
