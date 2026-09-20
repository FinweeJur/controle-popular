import { describe, it, expect } from "vitest";
import {
  obterAssembleiaEstadual,
  listarUfsAssembleias,
  calcularAgregadosAssembleia,
  gerarCsvDeputadosEstaduais,
} from "./ranking-estadual";

describe("ranking-estadual", () => {
  it("carrega assembleia de Minas Gerais e São Paulo com sucesso", () => {
    const almg = obterAssembleiaEstadual("mg");
    expect(almg).toBeDefined();
    expect(almg?.sigla).toBe("ALMG");
    expect(almg?.deputados.length).toBeGreaterThan(0);

    const alesp = obterAssembleiaEstadual("sp");
    expect(alesp).toBeDefined();
    expect(alesp?.sigla).toBe("ALESP");
    expect(alesp?.deputados.length).toBeGreaterThan(0);
  });

  it("calcula agregados parlamentares corretamente", () => {
    const almg = obterAssembleiaEstadual("mg");
    expect(almg).not.toBeNull();
    if (!almg) return;

    const agregados = calcularAgregadosAssembleia(almg.deputados);
    expect(agregados.totalDeputados).toBe(almg.deputados.length);
    expect(agregados.mediaPresencaPct).toBeGreaterThan(0);
    expect(agregados.mediaPresencaPct).toBeLessThanOrEqual(100);
    expect(agregados.totalGastoCotaBrl).toBeGreaterThan(0);
    expect(agregados.totalProjetosApresentados).toBeGreaterThan(0);
  });

  it("gera CSV no padrão RFC-4180 com BOM UTF-8 e ponto-e-vírgula", () => {
    const almg = obterAssembleiaEstadual("mg");
    expect(almg).not.toBeNull();
    if (!almg) return;

    const csv = gerarCsvDeputadosEstaduais(almg.deputados, almg.sigla);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Assembleia;Posição no Ranking;Deputado(a)");
    expect(csv).toContain("ALMG");
    expect(csv).toContain("Tadeu Martins Leite");
  });

  it("contém cobertura de todas as 27 Unidades Federativas do Brasil", () => {
    const ufs = listarUfsAssembleias();
    expect(ufs.length).toBe(27);

    const todasUfs = [
      "ac", "al", "am", "ap", "ba", "ce", "df", "es", "go", "ma",
      "mg", "ms", "mt", "pa", "pb", "pe", "pi", "pr", "rj", "rn",
      "ro", "rr", "rs", "sc", "se", "sp", "to",
    ];

    for (const uf of todasUfs) {
      const assembleia = obterAssembleiaEstadual(uf);
      expect(assembleia).not.toBeNull();
      expect(assembleia?.uf).toBe(uf);
      expect(assembleia?.sigla.length).toBeGreaterThan(0);
      expect(assembleia?.deputados.length).toBeGreaterThan(0);
    }
  });
});

