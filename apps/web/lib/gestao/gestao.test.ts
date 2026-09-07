import { describe, it, expect } from "vitest";
import { obterMandato, listarMandatos, calcularResumoGestao, obterColunasCsvGestao } from "./dados";
import type { MandatoGestao } from "./tipos";

describe("Módulo de Gestão / Prometeu? Cumpriu? (Plano v8)", () => {
  it("carrega com sucesso os mandatos pilotos de MG, SP, RJ, ES, PA, DF, União, Betim, BH, Araçuaí e Brumadinho", () => {
    const mg = obterMandato("mg");
    const sp = obterMandato("sp");
    const rj = obterMandato("rj");
    const es = obterMandato("es");
    const pa = obterMandato("pa");
    const df = obterMandato("df");
    const uniao = obterMandato("uniao");
    const betim = obterMandato("betim");
    const bh = obterMandato("bh");
    const aracuai = obterMandato("aracuai");
    const brumadinho = obterMandato("brumadinho");

    expect(mg?.gestor).toBe("Romeu Zema");
    expect(sp?.gestor).toBe("Tarcísio de Freitas");
    expect(rj?.gestor).toBe("Cláudio Castro");
    expect(es?.gestor).toBe("Renato Casagrande");
    expect(pa?.gestor).toBe("Helder Barbalho");
    expect(df?.gestor).toBe("Ibaneis Rocha");
    expect(uniao?.gestor).toBe("Luiz Inácio Lula da Silva");
    expect(betim?.gestor).toBe("Vittorio Medioli");
    expect(bh?.gestor).toBe("Fuad Noman");
    expect(aracuai?.gestor).toBe("Tadeu Barbosa de Oliveira");
    expect(brumadinho?.gestor).toBe("Neném da Asa (Avimar de Melo Barcelos)");
  });

  it("calcula corretamente os agregados de resumo para os cartões de topo", () => {
    const mg = obterMandato("mg") as MandatoGestao;
    const resumo = calcularResumoGestao(mg);

    expect(resumo.totalPropostas).toBe(mg.propostas.length);
    expect(resumo.porStatus.sem_sinal).toBeGreaterThanOrEqual(1);
    expect(resumo.porStatus.concluida).toBeGreaterThanOrEqual(1);
    expect(resumo.totalForaDoPlano).toBe(mg.iniciativas_fora_do_plano.length);
    expect(resumo.percentualComSinal).toBeGreaterThan(0);
    expect(resumo.percentualComSinal).toBeLessThanOrEqual(100);
  });

  it("garante que toda proposta tem citação literal (verbatim) e página no PDF do TSE", () => {
    const mandatos = listarMandatos();
    expect(mandatos.length).toBeGreaterThanOrEqual(4);

    for (const m of mandatos) {
      expect(m.plano_pdf_url).toMatch(/^https?:\/\//);
      for (const p of m.propostas) {
        expect(p.trecho_verbatim.trim().length).toBeGreaterThan(10);
        expect(p.plano_pagina).toBeGreaterThan(0);
        expect(["sem_sinal", "anunciada", "em_andamento", "concluida", "contrariada", "revogada"]).toContain(
          p.status
        );
        for (const ev of p.evidencias) {
          expect(ev.url).toMatch(/^https?:\/\//);
          expect(ev.titulo.trim().length).toBeGreaterThan(5);
        }
      }
    }
  });

  it("garante que as colunas de exportação CSV cobrem os campos fundamentais", () => {
    const colunas = obterColunasCsvGestao();
    const chaves = colunas.map((c) => c.chave);
    expect(chaves).toContain("id");
    expect(chaves).toContain("tema");
    expect(chaves).toContain("orgao_alvo");
    expect(chaves).toContain("trecho_verbatim");
    expect(chaves).toContain("status");
  });

  it("assegura que nenhum CPF real está presente nos dados de gestão (privacidade)", () => {
    const mandatos = listarMandatos();
    const jsonStr = JSON.stringify(mandatos);

    // Regex para detecção de padrão de CPF 000.000.000-00 ou 11 dígitos contínuos
    const padraoCpfFormatado = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
    expect(padraoCpfFormatado.test(jsonStr)).toBe(false);
  });
});
