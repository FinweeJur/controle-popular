/**
 * @file apps/web/lib/internacional/dados-internacional.test.ts
 * @description Testes automatizados de paridade de cobertura e qualidade das fontes internacionais (EUA e Canadá).
 *
 * Papel no portal:
 * Garante que:
 * 1. As constantes `COBERTURA_CANADA` e `COBERTURA_EUA` batem exatamente com o número
 *    de registros gravados nos arquivos compactados (evitando números inventados ou defasados).
 * 2. 100% dos registros contêm URL oficial verificada (`https://...`), cumprindo a Qualidade 1 das 6 Qualidades.
 * 3. O dicionário trilíngue (`idiomas-internacional.ts`) não contém traduções vazias.
 */

import { describe, expect, it } from "vitest";
import {
  COBERTURA_CANADA,
  obterMineradorasCanada,
  obterAmbientalCanada,
  obterContratosCanada,
  obterInstitucionalCanada,
} from "./dados-canada";
import {
  COBERTURA_EUA,
  obterEmpresasSecEua,
  obterAmbientalEua,
  obterContratosEua,
  obterInstitucionalEua,
} from "./dados-eua";
import {
  GLOSSARIO_SIGLAS_INTERNACIONAL,
  UI_INTERNACIONAL,
  t,
  type IdiomaExibicao,
} from "./idiomas-internacional";

describe("Dados Internacionais — Canadá (/canada)", () => {
  const mineradoras = obterMineradorasCanada();
  const ambiental = obterAmbientalCanada();
  const contratos = obterContratosCanada();
  const institucional = obterInstitucionalCanada();

  it("deve bater exatamente com a constante COBERTURA_CANADA", () => {
    expect(mineradoras.length).toBe(COBERTURA_CANADA.mineradorasTsxBrasil);
    expect(ambiental.length).toBe(COBERTURA_CANADA.registrosAmbientais);
    expect(contratos.length).toBe(COBERTURA_CANADA.contratosGrants);
    expect(institucional.length).toBe(COBERTURA_CANADA.registrosInstitucionais);
    expect(mineradoras.length + ambiental.length + contratos.length + institucional.length).toBe(
      COBERTURA_CANADA.totalRegistros
    );
  });

  it("100% dos registros do Canadá devem ter URL oficial válida (Qualidade 1)", () => {
    const todos = [...mineradoras, ...ambiental, ...contratos, ...institucional];
    for (const item of todos) {
      expect(item.urlOficial).toBeDefined();
      expect(item.urlOficial).toMatch(/^https:\/\//);
      expect(item.id).toBeDefined();
    }
  });

  it("deve catalogar mineradoras estratégicas operando no Brasil (Sigma, Vale BM, Belo Sun, Ero, Equinox, Lundin, Aura)", () => {
    const nomes = mineradoras.map((m) => m.empresaMae);
    expect(nomes).toContain("Sigma Lithium Corporation");
    expect(nomes).toContain("Vale Base Metals (Vale Canada Limited)");
    expect(nomes).toContain("Belo Sun Mining Corp.");
    expect(nomes).toContain("Ero Copper Corp.");
    expect(nomes).toContain("Equinox Gold Corp.");
    expect(nomes).toContain("Lundin Mining Corporation");
    expect(nomes).toContain("Brazil Potash Corp.");
    expect(nomes).toContain("Aura Minerals Inc.");
    for (const m of mineradoras) {
      expect(m.processosAnm).toBeGreaterThanOrEqual(0);
      expect(m.barragensSigbm).toBeGreaterThanOrEqual(0);
      expect(m.ufBrasil.length).toBeGreaterThan(0);
    }
  });

  it("deve contemplar registros ambientais essenciais: Mount Polley, ECCC NPRI e Climate TRACE", () => {
    const titulos = ambiental.map((a) => a.titulo);
    expect(titulos.some((t) => t.includes("Mount Polley"))).toBe(true);
    expect(titulos.some((t) => t.includes("Sudbury"))).toBe(true);
    expect(titulos.some((t) => t.includes("Climate TRACE"))).toBe(true);
    expect(titulos.some((t) => t.includes("OpenAlex"))).toBe(true);
    for (const a of ambiental) {
      expect(a.valorMedido).toBeGreaterThan(0);
      expect(a.eloBrasil.length).toBeGreaterThan(0);
    }
  });

  it("deve contemplar contratos federais essenciais: EDC Brasil, Open Canada Grants e StatCan", () => {
    const orgaos = contratos.map((c) => c.orgaoOuFundo);
    expect(orgaos.some((o) => o.includes("Export Development Canada"))).toBe(true);
    expect(orgaos.some((o) => o.includes("Statistics Canada"))).toBe(true);
    expect(orgaos.some((o) => o.includes("Natural Resources Canada"))).toBe(true);
    for (const c of contratos) {
      expect(c.valorCad).toBeGreaterThan(0);
      expect(c.objetoResumo.length).toBeGreaterThan(0);
    }
  });

  it("deve contemplar registros institucionais: Cidades SGC, CanLII, CIRNAC e Ouvidoria CORE", () => {
    const nomes = institucional.map((i) => i.nome);
    expect(nomes.some((n) => n.includes("Greater Sudbury"))).toBe(true);
    expect(nomes.some((n) => n.includes("Toronto"))).toBe(true);
    expect(nomes.some((n) => n.includes("Nevsun"))).toBe(true);
    expect(nomes.some((n) => n.includes("Primeiras Nações"))).toBe(true);
    expect(nomes.some((n) => n.includes("CORE"))).toBe(true);
    for (const i of institucional) {
      expect(i.codigoOficial.length).toBeGreaterThan(0);
      expect(i.eloBrasil.length).toBeGreaterThan(0);
    }
  });
});

describe("Dados Internacionais — Estados Unidos (/eua)", () => {
  const empresasSec = obterEmpresasSecEua();
  const ambiental = obterAmbientalEua();
  const contratos = obterContratosEua();
  const institucional = obterInstitucionalEua();

  it("deve bater exatamente com a constante COBERTURA_EUA", () => {
    expect(empresasSec.length).toBe(COBERTURA_EUA.empresasSecCatalogadas);
    expect(ambiental.length).toBe(COBERTURA_EUA.registrosAmbientais);
    expect(contratos.length).toBe(COBERTURA_EUA.contratosEconomia);
    expect(institucional.length).toBe(COBERTURA_EUA.registrosInstitucionais);
    expect(empresasSec.length + ambiental.length + contratos.length + institucional.length).toBe(
      COBERTURA_EUA.totalRegistros
    );
  });

  it("100% dos registros dos EUA devem ter URL oficial válida (Qualidade 1)", () => {
    const todos = [...empresasSec, ...ambiental, ...contratos, ...institucional];
    for (const item of todos) {
      expect(item.urlOficial).toBeDefined();
      expect(item.urlOficial).toMatch(/^https:\/\//);
      expect(item.id).toBeDefined();
    }
  });

  it("todas as empresas SEC devem ter CIK válido com 10 dígitos", () => {
    for (const empresa of empresasSec) {
      expect(empresa.cik).toMatch(/^[0-9]{10}$/);
      expect(empresa.formulariosSec.length).toBeGreaterThan(0);
      expect(empresa.relacaoBrasil.length).toBeGreaterThan(0);
      expect(empresa.ativosSobGestaoUsdBilhoes).toBeGreaterThan(0);
    }
  });

  it("dados ambientais devem cobrir NID, EPA ECHO, Superfund CERCLA e Climate TRACE", () => {
    const categorias = ambiental.map((a) => a.categoria);
    expect(categorias).toContain("Barragens (NID)");
    expect(categorias).toContain("Multas & Fiscalização (EPA ECHO)");
    expect(categorias).toContain("Áreas Contaminadas (Superfund)");
    expect(categorias).toContain("Emissões & Clima (Climate TRACE)");

    const barragens = ambiental.find((a) => a.categoria === "Barragens (NID)");
    expect(barragens).toBeDefined();
    expect(barragens?.metricaPrincipalValor).toBe(COBERTURA_EUA.barragensHighHazardNid);
  });

  it("contratos e economia devem cobrir USAspending, Censo 3510 e fomento de minerais", () => {
    const programas = contratos.map((c) => c.programaOuAward);
    expect(programas.some((p) => p.includes("USAspending"))).toBe(true);
    expect(programas.some((p) => p.includes("3510"))).toBe(true);
    for (const contrato of contratos) {
      expect(contrato.valorUsdMilhoes).toBeGreaterThan(0);
      expect(contrato.eloBrasil.length).toBeGreaterThan(0);
    }
  });

  it("institucional deve cobrir Cidades FIPS, Congresso, Corte SDNY, BIA e FOIA", () => {
    const frentes = institucional.map((i) => i.frente);
    expect(frentes).toContain("Cidades-Polo (FIPS)");
    expect(frentes).toContain("Congresso (Congress.gov)");
    expect(frentes).toContain("Judiciário & Litígios (SCOTUS/SDNY)");
    expect(frentes).toContain("Função Social da Terra (BIA/BLM)");
    expect(frentes).toContain("Transparência & LAI (FOIA)");

    const foia = institucional.find((i) => i.codigoOficial === "US-FOIA-5USC552");
    expect(foia).toBeDefined();
    expect(foia?.metricaPrincipalValor).toBe(20); // 20 dias úteis
  });
});

describe("Sistema Trilíngue — Idiomas Internacional", () => {
  const idiomas: IdiomaExibicao[] = ["pt", "en", "es"];

  it("glossário de siglas deve ter descrições em PT, EN e ES sem campos vazios", () => {
    for (const item of GLOSSARIO_SIGLAS_INTERNACIONAL) {
      for (const idioma of idiomas) {
        const desc = t(item.explicacao, idioma);
        expect(desc).toBeDefined();
        expect(desc.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("textos de UI devem conter traduções para todos os idiomas suportados", () => {
    for (const [_chave, textoTrilingue] of Object.entries(UI_INTERNACIONAL)) {
      for (const idioma of idiomas) {
        const valor = t(textoTrilingue, idioma);
        expect(valor).toBeDefined();
        expect(valor.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
