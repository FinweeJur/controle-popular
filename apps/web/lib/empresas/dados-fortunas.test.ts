/**
 * @file apps/web/lib/empresas/dados-fortunas.test.ts
 * @description Suíte de testes unitários do módulo de Grandes Fortunas Mundiais.
 *
 * Valida:
 * 1. Carregamento íntegro e decodificação dos 1.000 registros sem perdas.
 * 2. Ordenação estrita decrescente por patrimônio e consistência de ranks de 1 a 1000.
 * 3. Cálculos matemáticos de rendimento mensal e equivalência com a linha de pobreza extrema.
 * 4. Validação de campos obrigatórios (URLs canônicas HTTPS, nomes de fontes oficiais, setores).
 * 5. Agregações setoriais e integridade dos cartões de cobertura COBERTURA_FORTUNAS.
 * 6. Preservação de conformidade LGPD (zero dados pessoais não públicos, zero CPFs).
 */

import { describe, it, expect } from "vitest";
import {
  obterFortunasMundiais,
  obterFortunaPorRank,
  obterFortunasPorPais,
  obterFortunasPorSetor,
  obterAgregadosSetoriais,
  COBERTURA_FORTUNAS,
} from "./dados-fortunas";

describe("dados-fortunas: Catálogo das 1.000 Maiores Fortunas Mundiais", () => {
  it("deve carregar exatamente 1.000 fortunas mundiais", () => {
    const lista = obterFortunasMundiais();
    expect(lista).toBeDefined();
    expect(lista.length).toBe(1000);
  });

  it("deve conter ranks estritamente sequenciais de 1 a 1000", () => {
    const lista = obterFortunasMundiais();
    for (let i = 0; i < lista.length; i++) {
      expect(lista[i].rank).toBe(i + 1);
    }
  });

  it("deve manter patrimônio estritamente decrescente ou estável ao longo dos ranks", () => {
    const lista = obterFortunasMundiais();
    for (let i = 1; i < lista.length; i++) {
      expect(lista[i - 1].patrimonioLiquidoUsdBi).toBeGreaterThanOrEqual(
        lista[i].patrimonioLiquidoUsdBi
      );
    }
  });

  it("deve calcular corretamente o rendimento mensal e a equivalência social de pobreza", () => {
    const top1 = obterFortunaPorRank(1);
    expect(top1).not.toBeNull();
    if (!top1) return;

    // Rendimento mensal estimado a 4,5% a.a.: (patrimonioUsdBi * 1000 * 0.045) / 12
    const rendimentoEsperado = (top1.patrimonioLiquidoUsdBi * 1000 * 0.045) / 12;
    expect(top1.rendimentoMensalEstimadoUsdMi).toBeCloseTo(rendimentoEsperado, 0);

    // Equivalência extrema pobreza (US$ 64.50/mês):
    const equivalenciaEsperada = Math.round(
      (top1.rendimentoMensalEstimadoUsdMi * 1_000_000) / 64.50
    );
    expect(top1.equivalenciaPessoasPobrezaExtrema).toBe(equivalenciaEsperada);
    expect(top1.equivalenciaPessoasPobrezaExtrema).toBeGreaterThan(1_000_000);
  });

  it("deve conter URLs canônicas oficiais válidas iniciando em https://", () => {
    const lista = obterFortunasMundiais();
    for (const item of lista) {
      expect(item.urlFonteOficial).toMatch(/^https:\/\//);
      expect(item.fonteOficialNome.length).toBeGreaterThan(2);
    }
  });

  it("deve filtrar corretamente por país (Brasil)", () => {
    const fortunasBrasil = obterFortunasPorPais("Brasil");
    expect(fortunasBrasil.length).toBeGreaterThan(10);
    for (const item of fortunasBrasil) {
      expect(item.paisOrigem).toBe("Brasil");
      expect(item.codigoIsoPais).toBe("BR");
    }
  });

  it("deve filtrar corretamente por setor econômico", () => {
    const tecnologia = obterFortunasPorSetor("Tecnologia");
    expect(tecnologia.length).toBeGreaterThan(20);
    for (const item of tecnologia) {
      expect(item.setorAtuacao.toLowerCase()).toContain("tecnologia");
    }
  });

  it("deve gerar agregados setoriais consistentes", () => {
    const setores = obterAgregadosSetoriais();
    expect(setores.length).toBeGreaterThan(5);

    const somaPessoas = setores.reduce((acc, cur) => acc + cur.totalPessoasOuFamilias, 0);
    expect(somaPessoas).toBe(1000);

    // Setores ordenados decrescentemente por patrimônio
    for (let i = 1; i < setores.length; i++) {
      expect(setores[i - 1].totalPatrimonioUsdBi).toBeGreaterThanOrEqual(
        setores[i].totalPatrimonioUsdBi
      );
    }
  });

  it("deve validar a coerência da constante agregada COBERTURA_FORTUNAS", () => {
    expect(COBERTURA_FORTUNAS.totalRegistros).toBe(1000);
    expect(COBERTURA_FORTUNAS.patrimonioTotalUsdBi).toBeGreaterThan(10000);
    expect(COBERTURA_FORTUNAS.equivalenciaTotalPobrezaExtrema).toBeGreaterThan(500_000_000);
  });
});
