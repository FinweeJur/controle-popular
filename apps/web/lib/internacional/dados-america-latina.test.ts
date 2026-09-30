/**
 * @file apps/web/lib/internacional/dados-america-latina.test.ts
 * @description Suíte de testes unitários para o módulo de dados da América Latina.
 */

import { describe, it, expect } from "vitest";
import {
  COBERTURA_AMERICA_LATINA,
  obterInstalacoesAmericaLatina,
  obterMineradorasAmericaLatina,
  obterInstalacaoPorId,
  filtrarInstalacoesLatam,
} from "./dados-america-latina";

describe("dados-america-latina.ts", () => {
  it("agregações e contagens de COBERTURA_AMERICA_LATINA batem com dados reais", () => {
    const instalacoes = obterInstalacoesAmericaLatina();
    const mineradoras = obterMineradorasAmericaLatina();

    expect(instalacoes.length).toBe(COBERTURA_AMERICA_LATINA.totalInstalacoes);
    expect(instalacoes.length).toBe(51);

    expect(mineradoras.length).toBe(COBERTURA_AMERICA_LATINA.totalMineradoras);
    expect(mineradoras.length).toBe(45);

    const paisesDistintos = new Set(instalacoes.map((i) => i.pais));
    expect(paisesDistintos.size).toBe(COBERTURA_AMERICA_LATINA.totalPaises);
    expect(paisesDistintos.size).toBe(9);

    for (const p of COBERTURA_AMERICA_LATINA.paises) {
      expect(paisesDistintos.has(p)).toBe(true);
    }
  });

  it("todas as 51 instalações possuem coordenadas válidas em WGS84 e fontes oficiais", () => {
    const instalacoes = obterInstalacoesAmericaLatina();

    for (const inst of instalacoes) {
      expect(inst.id).toBeTruthy();
      expect(inst.nome).toBeTruthy();
      expect(inst.empresa).toBeTruthy();
      expect(inst.pais).toBeTruthy();
      expect(inst.mineralPrincipal).toBeTruthy();
      expect(inst.fonteOficial).toBeTruthy();
      expect(inst.descricao).toBeTruthy();

      // Coordenadas válidas em WGS84 na América Latina
      expect(inst.latitude).toBeGreaterThanOrEqual(-60);
      expect(inst.latitude).toBeLessThanOrEqual(35);
      expect(inst.longitude).toBeGreaterThanOrEqual(-120);
      expect(inst.longitude).toBeLessThanOrEqual(-30);
    }
  });

  it("permite obter instalação por ID único", () => {
    const carajas = obterInstalacaoPorId("br-vale-carajas");
    expect(carajas).toBeDefined();
    expect(carajas?.empresa).toBe("Vale S.A.");
    expect(carajas?.pais).toBe("Brasil");

    const escondida = obterInstalacaoPorId("cl-bhp-escondida");
    expect(escondida).toBeDefined();
    expect(escondida?.pais).toBe("Chile");

    const inexistente = obterInstalacaoPorId("id-ficticio-inexistente");
    expect(inexistente).toBeUndefined();
  });

  it("filtrarInstalacoesLatam filtra corretamente por país", () => {
    const instalacoes = obterInstalacoesAmericaLatina();
    const apenasPeru = filtrarInstalacoesLatam(instalacoes, { pais: "Peru" });

    expect(apenasPeru.length).toBeGreaterThan(0);
    expect(apenasPeru.every((i) => i.pais === "Peru")).toBe(true);
  });

  it("filtrarInstalacoesLatam filtra por tipo de instalação", () => {
    const instalacoes = obterInstalacoesAmericaLatina();
    const apenasLitio = filtrarInstalacoesLatam(instalacoes, {
      tipo: "projeto_litio",
    });

    expect(apenasLitio.length).toBe(COBERTURA_AMERICA_LATINA.totalProjetosLitio);
    expect(apenasLitio.length).toBe(7);
    expect(apenasLitio.every((i) => i.tipo === "projeto_litio")).toBe(true);
  });

  it("filtrarInstalacoesLatam filtra com busca textual insensível a acentos e maiúsculas", () => {
    const instalacoes = obterInstalacoesAmericaLatina();

    // Termo sem acento buscando registros com acento
    const buscaLitio = filtrarInstalacoesLatam(instalacoes, {
      termoBusca: "litio",
    });
    expect(buscaLitio.length).toBeGreaterThanOrEqual(7);

    const buscaCobre = filtrarInstalacoesLatam(instalacoes, {
      termoBusca: "cobre",
    });
    expect(buscaCobre.length).toBeGreaterThanOrEqual(10);
  });

  it("nenhum registro contém CPF ou informação pessoal desprotegida", () => {
    const instalacoes = obterInstalacoesAmericaLatina();
    const padraoCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const inst of instalacoes) {
      expect(padraoCpf.test(inst.nome)).toBe(false);
      expect(padraoCpf.test(inst.descricao)).toBe(false);
      expect(padraoCpf.test(inst.baciaOuRegiao)).toBe(false);
    }
  });
});
