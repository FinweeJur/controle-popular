import { describe, it, expect } from "vitest";
import {
  obterTodosCanaisInformacao,
  obterEstatisticasInformacao,
  obterCanaisPorCategoria,
  obterCanaisPorServico,
  obterCanaisPorUf,
  buscarCanais,
} from "./informacao";

describe("Canais de Acesso à Informação Pública (LAI) e Concessionárias", () => {
  it("carrega todos os canais cadastrados com volume mínimo esperado", () => {
    const canais = obterTodosCanaisInformacao();
    expect(canais.length).toBeGreaterThanOrEqual(440);
  });

  it("consolida estatísticas por categoria, esfera e serviços essenciais", () => {
    const stats = obterEstatisticasInformacao();
    expect(stats.totalGeral).toBeGreaterThanOrEqual(440);
    expect(stats.porEsfera["Municipal"]).toBe(398); // 199 Prefeituras + 199 Câmaras
    expect(stats.porEsfera["Federal"]).toBeGreaterThanOrEqual(15);
    expect(stats.porEsfera["Concessionaria"]).toBeGreaterThanOrEqual(25);
    expect(stats.porCategoria["Prefeitura"]).toBe(199);
    expect(stats.porCategoria["Câmara Municipal"]).toBe(199);
    expect(stats.porServicoEssencial["agua"]).toBeGreaterThanOrEqual(10);
    expect(stats.porServicoEssencial["luz"]).toBeGreaterThanOrEqual(8);
    expect(stats.porServicoEssencial["telecom"]).toBeGreaterThanOrEqual(6);
  });

  it("filtra corretamente canais por categoria", () => {
    const prefeituras = obterCanaisPorCategoria("Prefeitura");
    expect(prefeituras.length).toBe(199);
    expect(prefeituras.every((p) => p.categoria === "Prefeitura")).toBe(true);

    const camaras = obterCanaisPorCategoria("Câmara Municipal");
    expect(camaras.length).toBe(199);
    expect(camaras.every((c) => c.categoria === "Câmara Municipal")).toBe(true);

    const aguas = obterCanaisPorCategoria("Água e Saneamento");
    expect(aguas.length).toBeGreaterThanOrEqual(10);
  });

  it("filtra serviços essenciais (água, luz e telecom)", () => {
    const aguas = obterCanaisPorServico("agua");
    expect(aguas.some((a) => a.sigla.includes("COPASA"))).toBe(true);
    expect(aguas.some((a) => a.sigla.includes("Sabesp"))).toBe(true);

    const luzes = obterCanaisPorServico("luz");
    expect(luzes.some((l) => l.sigla.includes("CEMIG"))).toBe(true);
    expect(luzes.some((l) => l.sigla.includes("Enel"))).toBe(true);

    const telecoms = obterCanaisPorServico("telecom");
    expect(telecoms.some((t) => t.sigla === "ANATEL")).toBe(true);
    expect(telecoms.some((t) => t.sigla === "Vivo")).toBe(true);
    expect(telecoms.some((t) => t.sigla === "Claro")).toBe(true);
  });

  it("garante integridade de dados (telefones, e-mails, endereços com CEP e links)", () => {
    const canais = obterTodosCanaisInformacao();
    for (const canal of canais) {
      expect(canal.id).toBeTruthy();
      expect(canal.nome).toBeTruthy();
      expect(canal.sigla).toBeTruthy();
      expect(canal.cidade).toBeTruthy();
      expect(canal.uf).toMatch(/^[A-Z]{2}$/);
      expect(canal.telefone).toMatch(/\d/);
      expect(canal.email).toMatch(/@/);
      expect(canal.endereco).toMatch(/CEP \d{5}-\d{3}/);
      expect(canal.linkPortal).toMatch(/^https?:\/\//);
      expect(canal.responsavel.cargo).toBeTruthy();
      expect(canal.responsavel.nome).toBeTruthy();
    }
  });

  it("executa busca textual com precisão", () => {
    const buscaCemig = buscarCanais("CEMIG");
    expect(buscaCemig.length).toBeGreaterThanOrEqual(1);
    expect(buscaCemig[0].sigla).toBe("CEMIG");

    const buscaCopasa = buscarCanais("COPASA");
    expect(buscaCopasa.length).toBeGreaterThanOrEqual(1);

    const buscaBH = buscarCanais("Belo Horizonte");
    expect(buscaBH.length).toBeGreaterThanOrEqual(2);

    const buscaAnatel = buscarCanais("Anatel");
    expect(buscaAnatel.length).toBeGreaterThanOrEqual(1);
  });
});
