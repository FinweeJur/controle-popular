import { describe, it, expect } from "vitest";
import {
  ORGAOS_CAPACIDADE,
  COBERTURA_CAPACIDADE,
} from "./capacidade-institucional";

describe("Capacidade Institucional dos Órgãos Ambientais", () => {
  it("deve carregar 12 órgãos mapeados", () => {
    expect(ORGAOS_CAPACIDADE.length).toBe(12);
    expect(COBERTURA_CAPACIDADE.totalOrgaos).toBe(12);
  });

  it("deve possuir a perda média de servidores de -31,4%", () => {
    const somaVariacoes = ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.variacaoEfetivoPct, 0);
    const mediaCalculada = Number((somaVariacoes / ORGAOS_CAPACIDADE.length).toFixed(1));
    expect(mediaCalculada).toBe(-31.4);
    expect(COBERTURA_CAPACIDADE.mediaPerdaServidoresPct).toBe(-31.4);
  });

  it("deve destacar IEF-MG como o maior índice de sobrecarga", () => {
    const maxSobrecarga = Math.max(...ORGAOS_CAPACIDADE.map((o) => o.sobrecargaProcessosPorAnalista));
    const orgaoMax = ORGAOS_CAPACIDADE.find((o) => o.sobrecargaProcessosPorAnalista === maxSobrecarga);
    expect(orgaoMax?.sigla).toBe("IEF-MG");
    expect(orgaoMax?.sobrecargaProcessosPorAnalista).toBe(2314);
    expect(COBERTURA_CAPACIDADE.orgaoMaiorSobrecarga).toBe("IEF-MG");
  });

  it("deve possuir volume consolidado de processos represados consistente", () => {
    const totalProcessos = ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.processosRepresados, 0);
    expect(COBERTURA_CAPACIDADE.volumeConsolidadoRepresado).toBe(totalProcessos);
    expect(totalProcessos).toBeGreaterThan(600000);
  });

  it("todos os órgãos devem possuir contatos institucionais e liderança preenchidos", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.lideranca.nome).toBeTruthy();
      expect(orgao.lideranca.cargo).toBeTruthy();
      expect(orgao.contatos.enderecoCompleto).toBeTruthy();
      expect(orgao.contatos.telefoneGeral).toBeTruthy();
      expect(orgao.contatos.emailGeral).toBeTruthy();
      expect(orgao.contatos.ouvidoriaCanal).toBeTruthy();
      expect(orgao.urlTransparencia.startsWith("http")).toBe(true);
      expect(orgao.organograma.length).toBeGreaterThan(0);
      for (const area of orgao.organograma) {
        expect(area.nomeArea).toBeTruthy();
        expect(area.responsavel).toBeTruthy();
        expect(area.telefone).toBeTruthy();
        expect(area.email).toBeTruthy();
        expect(area.siteUrl.startsWith("http")).toBe(true);
      }
    }
  });
});
