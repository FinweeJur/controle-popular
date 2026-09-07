import { describe, it, expect } from "vitest";
import {
  obterRecomendacoes,
  calcularEstatisticasRecomendacoes,
  obterColunasCsvRecomendacoes,
} from "./recomendacoes";

describe("Módulo de Recomendações e Determinações do CNJ e CNMP", () => {
  it("carrega a base de dados com itens do CNJ e CNMP", () => {
    const itens = obterRecomendacoes();
    expect(itens.length).toBeGreaterThanOrEqual(8);

    const temCnj = itens.some((i) => i.orgao_fiscalizador === "CNJ");
    const temCnmp = itens.some((i) => i.orgao_fiscalizador === "CNMP");
    expect(temCnj).toBe(true);
    expect(temCnmp).toBe(true);
  });

  it("garante que todo item possui microresumo claro em português e tags", () => {
    const itens = obterRecomendacoes();
    for (const item of itens) {
      expect(item.microresumo.trim().length).toBeGreaterThan(20);
      expect(item.tags.length).toBeGreaterThanOrEqual(2);
      expect(item.texto_oficial.trim().length).toBeGreaterThan(15);
      expect(item.link_relatorio).toMatch(/^https?:\/\//);
      expect(["em_monitoramento", "cumprida", "reiterada", "parcialmente_cumprida"]).toContain(
        item.status_cumprimento
      );
    }
  });

  it("calcula estatísticas agregadas corretamente", () => {
    const itens = obterRecomendacoes();
    const stats = calcularEstatisticasRecomendacoes(itens);

    expect(stats.total).toBe(itens.length);
    expect(stats.cnj + stats.cnmp).toBe(itens.length);
    expect(stats.cumpridas).toBeGreaterThanOrEqual(1);
    expect(stats.reiteradas).toBeGreaterThanOrEqual(1);
  });

  it("garante que o cabeçalho do CSV possui as colunas essenciais", () => {
    const colunas = obterColunasCsvRecomendacoes();
    const chaves = colunas.map((c) => c.chave);
    expect(chaves).toContain("id");
    expect(chaves).toContain("orgao_fiscalizador");
    expect(chaves).toContain("tribunal_ou_mp");
    expect(chaves).toContain("microresumo");
    expect(chaves).toContain("status_cumprimento");
  });

  it("garante ausência de CPFs nos relatórios do judiciário/MP (privacidade)", () => {
    const itens = obterRecomendacoes();
    const jsonStr = JSON.stringify(itens);
    const padraoCpf = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
    expect(padraoCpf.test(jsonStr)).toBe(false);
  });
});
