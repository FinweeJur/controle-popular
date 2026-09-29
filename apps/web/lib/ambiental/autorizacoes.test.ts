/**
 * Testes da base "Destinações de Imóveis da União em Minas Gerais" (Plano 3).
 *
 * Papel: garantir que a base REAL (SPU, 553 imóveis) carrega, que todo registro
 * tem chave e fonte oficial, que não há CPF em texto claro, e que filtro,
 * métricas, CSV e microresumo cumprem o padrão das seis qualidades.
 */

import { describe, it, expect } from "vitest";
import {
  carregarDestinacoesUniaoMg,
  filtrarDestinacoes,
  calcularMetricasDestinacoes,
  gerarCsvDestinacoes,
  gerarMicroresumoDestinacoes,
} from "./autorizacoes";

const DESTINACAO_TOP = "Uso próprio em serviço público";
const REGEX_CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;

describe("Destinações de Imóveis da União em MG (Plano 3)", () => {
  it("carrega a base real com os 553 imóveis", () => {
    const { imoveis } = carregarDestinacoesUniaoMg();
    expect(imoveis.length).toBe(553);
  });

  it("todo imóvel tem RIP, município e fonte oficial com URL", () => {
    const { imoveis } = carregarDestinacoesUniaoMg();
    for (const item of imoveis) {
      expect(item.rip).toBeTruthy();
      expect(item.municipio).toBeTruthy();
      expect(item.fonteUrl.startsWith("http")).toBe(true);
    }
  });

  it("não contém CPF em texto claro em nenhum campo textual", () => {
    const { imoveis } = carregarDestinacoesUniaoMg();
    for (const item of imoveis) {
      for (const valor of Object.values(item)) {
        if (typeof valor === "string") {
          expect(REGEX_CPF.test(valor)).toBe(false);
        }
      }
    }
  });

  it("filtra por destinação e mantém a contagem do metadado", () => {
    const { imoveis, metadados } = carregarDestinacoesUniaoMg();
    const filtrados = filtrarDestinacoes(imoveis, { destinacao: DESTINACAO_TOP });

    expect(filtrados.length).toBeGreaterThan(0);
    expect(filtrados.every((i) => i.destinacao === DESTINACAO_TOP)).toBe(true);
    expect(filtrados.length).toBe(metadados.porDestinacao[DESTINACAO_TOP]);
  });

  it("calcula métricas com área total positiva e municípios medidos", () => {
    const { imoveis, metadados } = carregarDestinacoesUniaoMg();
    const metricas = calcularMetricasDestinacoes(imoveis);

    expect(metricas.total).toBe(553);
    expect(metricas.areaTotalHa).toBeGreaterThan(0);
    expect(metricas.municipiosAtendidos).toBe(metadados.totalMunicipios);
  });

  it("gera CSV com BOM UTF-8, separador ';' e uma linha por imóvel", () => {
    const { imoveis } = carregarDestinacoesUniaoMg();
    const csv = gerarCsvDestinacoes(imoveis);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("RIP;Município");
    expect(csv.split("\r\n").length).toBe(imoveis.length + 1);
  });

  it("gera microresumo com frases de até 13 palavras", () => {
    const { imoveis } = carregarDestinacoesUniaoMg();
    const resumo = gerarMicroresumoDestinacoes(
      calcularMetricasDestinacoes(imoveis),
    );

    expect(resumo.length).toBeGreaterThan(0);
    for (const frase of resumo) {
      expect(frase.trim().split(/\s+/).length).toBeLessThanOrEqual(13);
    }
  });
});
