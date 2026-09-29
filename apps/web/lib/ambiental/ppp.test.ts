/**
 * Testes unitários do módulo de PPPs e concessões de Minas Gerais.
 *
 * Papel: travar o contrato da base real (`data/ppp-mg.json`) e as funções puras
 * de filtro, métricas, CSV e microresumo. Cada teste falha se a base mudar de
 * forma incompatível — por exemplo, se um contrato perder `fonteUrl` ou se o
 * CNPJ deixar de ser 14 dígitos.
 */

import { describe, it, expect } from "vitest";
import {
  carregarPppsMg,
  filtrarPpps,
  calcularMetricasPpp,
  gerarCsvPpp,
  gerarMicroresumoPpp,
} from "./ppp";

describe("PPPs e concessões de MG", () => {
  it("carrega a base com os 20 contratos reais", () => {
    const { metadados, contratos } = carregarPppsMg();
    expect(contratos.length).toBe(20);
    expect(metadados.total).toBe(20);
    expect(metadados.ressalva).toBeTruthy();
  });

  it("todo contrato tem número, objeto e fonte oficial http", () => {
    const { contratos } = carregarPppsMg();
    for (const item of contratos) {
      expect(item.numeroContrato).toBeTruthy();
      expect(item.objeto.trim().length).toBeGreaterThan(10);
      expect(item.fonteUrl.startsWith("http")).toBe(true);
    }
  });

  it("o CNPJ é 14 dígitos ou 'Nao informado'", () => {
    const { contratos } = carregarPppsMg();
    for (const item of contratos) {
      const ok = /^\d{14}$/.test(item.cnpjConcessionaria) || item.cnpjConcessionaria === "Nao informado";
      expect(ok, `CNPJ inesperado: ${item.cnpjConcessionaria}`).toBe(true);
    }
  });

  it("filtra por natureza devolvendo só aquele tipo", () => {
    const { contratos } = carregarPppsMg();
    const concessoes = filtrarPpps(contratos, { natureza: "instrumento_concessao" });
    expect(concessoes.length).toBeGreaterThan(0);
    expect(concessoes.every((c) => c.natureza === "instrumento_concessao")).toBe(true);
    expect(concessoes.length).toBeLessThan(contratos.length);
  });

  it("busca textual é tolerante a acento e caixa", () => {
    const { contratos } = carregarPppsMg();
    const comAcento = filtrarPpps(contratos, { busca: "concessão" });
    const semAcento = filtrarPpps(contratos, { busca: "concessao" });
    expect(semAcento.length).toBe(comAcento.length);
    expect(semAcento.length).toBeGreaterThan(0);
  });

  it("as métricas somam valor inicial positivo e contam por natureza", () => {
    const { contratos } = carregarPppsMg();
    const metricas = calcularMetricasPpp(contratos);
    expect(metricas.total).toBe(contratos.length);
    expect(metricas.valorInicialTotal).toBeGreaterThan(0);
    expect(metricas.valorAtualTotal).toBeGreaterThan(0);
    expect(Object.values(metricas.porNatureza).reduce((s, n) => s + n, 0)).toBe(20);
  });

  it("gera CSV com BOM UTF-8, separador ';' e uma linha por contrato", () => {
    const { contratos } = carregarPppsMg();
    const csv = gerarCsvPpp(contratos);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Nº Contrato;Processo;Ano");
    expect(csv.split("\r\n").length).toBe(contratos.length + 1);
  });

  it("microresumo tem frases de até 13 palavras", () => {
    const { contratos } = carregarPppsMg();
    const resumo = gerarMicroresumoPpp(calcularMetricasPpp(contratos));
    expect(resumo.length).toBeGreaterThan(0);
    for (const frase of resumo) {
      expect(frase.trim().split(/\s+/).length).toBeLessThanOrEqual(13);
    }
  });
});
