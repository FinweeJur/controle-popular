/**
 * @file apps/web/lib/intercambio/intercambio.test.ts
 * @description Testes automatizados de integridade dos dados de intercâmbio, calendário mensal e cursos mundiais.
 */

import { describe, it, expect } from "vitest";
import {
  listarDepartamentos,
  listarProgramas,
  listarCursos,
  listarEventosCalendario,
  listarEventosPorMes,
  resumirIntercambio,
  filtrarCursos,
} from "./index";

describe("Módulo de Intercâmbio, Cursos e Calendário Acadêmico", () => {
  it("lista departamentos mundiais com regiões, campos obrigatórios e links válidos", () => {
    const deps = listarDepartamentos();
    expect(deps.length).toBeGreaterThanOrEqual(30);

    const regioes = new Set(deps.map((d) => d.regiao));
    expect(regioes.has("Brasil")).toBe(true);
    expect(regioes.has("Lusófonos")).toBe(true);
    expect(regioes.has("América Latina")).toBe(true);
    expect(regioes.has("Europa")).toBe(true);
    expect(regioes.has("América do Norte")).toBe(true);
    expect(regioes.has("Ásia e China")).toBe(true);
    expect(regioes.has("África")).toBe(true);
    expect(regioes.has("Oceania")).toBe(true);

    for (const d of deps) {
      expect(d.instituicao).toBeTruthy();
      expect(d.nomeDepartamento).toBeTruthy();
      expect(d.pais).toBeTruthy();
      expect(d.cidade).toBeTruthy();
      expect(d.email).toContain("@");
      expect(d.site).toMatch(/^https?:\/\//);
      expect(d.programas.length).toBeGreaterThan(0);
      expect(d.fonteUrl).toMatch(/^https?:\/\//);
    }
  });

  it("lista programas oficiais de intercâmbio incluindo Erasmus, PILA, AUGM e Brafitec", () => {
    const progs = listarProgramas();
    expect(progs.length).toBeGreaterThanOrEqual(10);

    const siglas = progs.map((p) => p.sigla);
    expect(siglas).toContain("Erasmus+");
    expect(siglas).toContain("PILA");
    expect(siglas).toContain("AUGM / Escala");
    expect(siglas).toContain("Brafitec");
    expect(siglas).toContain("Santander");

    for (const p of progs) {
      expect(p.nome).toBeTruthy();
      expect(p.beneficios).toBeTruthy();
      expect(p.requisitos.length).toBeGreaterThan(0);
      expect(p.urlOficial).toMatch(/^https?:\/\//);
    }
  });

  it("cobre todos os 12 meses do ano no calendário acadêmico de publicações e intercâmbio", () => {
    const eventos = listarEventosCalendario();
    expect(eventos.length).toBeGreaterThanOrEqual(24);

    // Valida que cada mês de 1 a 12 possui eventos cadastrados
    for (let mes = 1; mes <= 12; mes++) {
      const eventosMes = listarEventosPorMes(mes);
      expect(eventosMes.length).toBeGreaterThanOrEqual(2);
      for (const ev of eventosMes) {
        expect(ev.titulo).toBeTruthy();
        expect(ev.linkOficial).toMatch(/^https?:\/\//);
        expect(ev.categoria).toMatch(/^(intercambio|periodico_ciclico|edital_pesquisa)$/);
      }
    }
  });

  it("lista cursos oferecidos com coordenadores e e-mails institucionais", () => {
    const cursos = listarCursos();
    expect(cursos.length).toBeGreaterThanOrEqual(25);

    for (const c of cursos) {
      expect(c.curso).toBeTruthy();
      expect(c.instituicao).toBeTruthy();
      expect(c.coordenador).toBeTruthy();
      expect(c.emailInstitucional).toContain("@");
      expect(c.siteCurso).toMatch(/^https?:\/\//);
      expect(c.conveniosIntercambio.length).toBeGreaterThan(0);
    }
  });

  it("calcula o resumo matemático exato sem valores nulos", () => {
    const resumo = resumirIntercambio();
    expect(resumo.totalDepartamentos).toBeGreaterThan(25);
    expect(resumo.totalProgramas).toBeGreaterThan(0);
    expect(resumo.totalCursosMapeados).toBeGreaterThan(0);
    expect(resumo.totalInstituicoes).toBeGreaterThan(0);
    expect(resumo.totalPaisesAlcancados).toBeGreaterThanOrEqual(15);
    expect(resumo.totalEventosCalendario).toBeGreaterThanOrEqual(24);
    expect(resumo.eventosPorMes.length).toBe(12);
    expect(resumo.verificadoEm).toBe("2026-11-02");
  });

  it("filtra cursos por termo de busca tolerante a acentos", () => {
    const resDireito = filtrarCursos("direito");
    expect(resDireito.length).toBeGreaterThan(0);

    const resMinas = filtrarCursos("minas");
    expect(resMinas.length).toBeGreaterThan(0);

    const resErasmus = filtrarCursos(undefined, undefined, undefined, "Erasmus");
    expect(resErasmus.length).toBeGreaterThan(0);
  });
});
