import { describe, expect, it } from "vitest";
import {
  ACERVO_CONCURSOS,
  ITENS_CONCURSOS,
  METRICAS_CONCURSOS,
  concursosParaCsv,
  filtrarConcursos,
  listarEsferas,
  listarModalidades,
  listarPoderes,
  listarStatus,
  listarUfs,
  ordenarConcursos,
} from "./index";

describe("Radar de Concursos Públicos e Contratações Temporárias", () => {
  it("carrega com sucesso o acervo com dados estruturados", () => {
    expect(ACERVO_CONCURSOS).toBeDefined();
    expect(ITENS_CONCURSOS.length).toBeGreaterThan(50);
    expect(METRICAS_CONCURSOS.totalCertames).toBe(ITENS_CONCURSOS.length);
    expect(METRICAS_CONCURSOS.totalVagasImediatas).toBeGreaterThan(10000);
    expect(METRICAS_CONCURSOS.maiorRemuneracao).toBeGreaterThan(30000);
  });

  it("garante cobertura de todas as 27 UFs do Brasil", () => {
    const todasUfs = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
      "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
      "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    const ufsNoDataset = new Set(ITENS_CONCURSOS.map((i) => i.uf));
    for (const uf of todasUfs) {
      expect(
        ufsNoDataset.has(uf),
        `UF ${uf} deve estar representada no catálogo nacional`
      ).toBe(true);
    }
  });

  it("garante representação de todas as três esferas da federação", () => {
    const esferas = new Set(ITENS_CONCURSOS.map((i) => i.esfera));
    expect(esferas.has("Federal")).toBe(true);
    expect(esferas.has("Estadual")).toBe(true);
    expect(esferas.has("Municipal")).toBe(true);
  });

  it("garante representação dos seis poderes e funções essenciais à justiça", () => {
    const poderes = new Set(ITENS_CONCURSOS.map((i) => i.poder));
    expect(poderes.has("Executivo")).toBe(true);
    expect(poderes.has("Legislativo")).toBe(true);
    expect(poderes.has("Judiciário")).toBe(true);
    expect(poderes.has("Ministério Público")).toBe(true);
    expect(poderes.has("Tribunal de Contas")).toBe(true);
    expect(poderes.has("Defensoria Pública")).toBe(true);
  });

  it("garante cobertura de concursos efetivos e contratações temporárias/PSS", () => {
    const modalidades = new Set(ITENS_CONCURSOS.map((i) => i.modalidade));
    expect(modalidades.has("Concurso Efetivo")).toBe(true);
    expect(modalidades.has("Processo Seletivo Simplificado (PSS)")).toBe(true);
    expect(modalidades.has("Contratação Temporária")).toBe(true);
  });

  it("garante links oficiais e seguros em todos os editais", () => {
    for (const item of ITENS_CONCURSOS) {
      expect(item.linkEdital).toMatch(/^https?:\/\//);
      expect(item.linkEdital).not.toContain("javascript:");
      expect(item.linkEdital.length).toBeGreaterThan(10);
    }
  });

  it("garante ausência total de CPFs no dataset (Regra 5.2)", () => {
    const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
    for (const item of ITENS_CONCURSOS) {
      const serializado = JSON.stringify(item);
      expect(cpfRegex.test(serializado)).toBe(false);
    }
  });

  it("filtra certames tolerando acentuação gráfica", () => {
    const resultadoSemAcento = filtrarConcursos(ITENS_CONCURSOS, { busca: "saude" });
    const resultadoComAcento = filtrarConcursos(ITENS_CONCURSOS, { busca: "saúde" });

    expect(resultadoSemAcento.length).toBeGreaterThan(0);
    expect(resultadoSemAcento.length).toBe(resultadoComAcento.length);
  });

  it("filtra certames por facetas combinadas", () => {
    const federais = filtrarConcursos(ITENS_CONCURSOS, { esfera: "Federal" });
    expect(federais.every((i) => i.esfera === "Federal")).toBe(true);

    const temporarios = filtrarConcursos(ITENS_CONCURSOS, {
      modalidade: "Processo Seletivo Simplificado (PSS)",
    });
    expect(temporarios.every((i) => i.modalidade === "Processo Seletivo Simplificado (PSS)")).toBe(true);
  });

  it("ordena certames corretamente por salário e por vagas", () => {
    const ordenadoSalario = ordenarConcursos(ITENS_CONCURSOS, "remuneracao", "desc");
    expect(ordenadoSalario[0].remuneracaoNumMax).toBeGreaterThanOrEqual(
      ordenadoSalario[ordenadoSalario.length - 1].remuneracaoNumMax
    );

    const ordenadoVagas = ordenarConcursos(ITENS_CONCURSOS, "vagas", "desc");
    expect(ordenadoVagas[0].vagasImediatas).toBeGreaterThanOrEqual(
      ordenadoVagas[ordenadoVagas.length - 1].vagasImediatas
    );
  });

  it("gera CSV válido com BOM UTF-8 e separador ponto-e-vírgula", () => {
    const csv = concursosParaCsv(ITENS_CONCURSOS.slice(0, 5));
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("id;orgao;nome_completo;esfera;poder;natureza_juridica");
    expect(csv).toContain(";");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("fornece listas auxiliares completas para seletores de interface", () => {
    expect(listarEsferas().length).toBe(3);
    expect(listarPoderes().length).toBe(6);
    expect(listarModalidades().length).toBe(3);
    expect(listarStatus().length).toBeGreaterThanOrEqual(5);
    expect(listarUfs().length).toBeGreaterThanOrEqual(28); // 27 UFs + Nacional
  });
});
