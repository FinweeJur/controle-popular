import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import type { BigTechDados, LinhaGasto, MetaGastos, PartidoAnalise, UfAnalise } from "./gastos-2026";

/**
 * Teste-guarda dos dados de gastos de campanha 2026.
 *
 * Por que existe: a página publica número de eleição — número errado é dano
 * (AGENTS.md § 1). O ETL roda fora da CI, sozinho, e regenera os JSONs; o
 * que protege aqui é a COERÊNCIA ENTRE os sete arquivos gerados (somas que
 * precisam bater — inclusive os agregados de análise por partido e por UF,
 * que somam o universo completo e não a tabela), o selo de parcialidade
 * (que não pode sumir num refactor) e a ausência de CPF/SQ de 11 dígitos
 * (guarda de dado pessoal do § 5.2, duplicada aqui para falhar em segundos
 * no vitest, e não só na suíte Python).
 *
 * Leitura por `fs` + caminho relativo ao arquivo (padrão de
 * `paginas-portal.test.ts`): não depende do cwd do executor.
 */

const DIR = fileURLToPath(new URL("../../data/eleicoes/gastos-2026/", import.meta.url));

function lerTexto(nome: string): string {
  return readFileSync(join(DIR, nome), "utf8");
}

function lerJson<T>(nome: string): T {
  return JSON.parse(lerTexto(nome)) as T;
}

const meta = lerJson<MetaGastos>("meta.json");
const bigtech = lerJson<BigTechDados>("bigtech.json");
const linhas = lerJson<LinhaGasto[]>("linhas.json");
const porPartido = lerJson<PartidoAnalise[]>("por-partido.json");
const porUf = lerJson<UfAnalise[]>("por-uf.json");

const arquivos = [
  "linhas.json",
  "meta.json",
  "bigtech.json",
  "fornecedores.json",
  "partidos.json",
  "por-partido.json",
  "por-uf.json",
];

/** Tolerância de soma em float (os valores saem arredondados a 2 casas). */
const TOLERANCIA = 1;

describe("gastos de campanha 2026 — coerência entre os JSONs do ETL", () => {
  it("soma dos grupos bate com a soma das naturezas de despesa", () => {
    const somaGrupos = Object.values(meta.grupos);
    const gruposContratado = somaGrupos.reduce((s, g) => s + g.contratado, 0);
    const gruposPago = somaGrupos.reduce((s, g) => s + g.pago, 0);
    const naturezasContratado = meta.naturezas.reduce((s, n) => s + n.contratado, 0);
    const naturezasPago = meta.naturezas.reduce((s, n) => s + n.pago, 0);
    expect(Math.abs(gruposContratado - naturezasContratado)).toBeLessThan(TOLERANCIA);
    expect(Math.abs(gruposPago - naturezasPago)).toBeLessThan(TOLERANCIA);
  });

  it("receita por fonte soma o mesmo total da capa", () => {
    const soma = meta.receitaPorFonte.reduce((s, r) => s + r.total, 0);
    expect(Math.abs(soma - meta.totais.receita)).toBeLessThan(0.01);
  });

  it("total de big tech é a soma das empresas declaradas", () => {
    const soma = bigtech.empresas.reduce((s, e) => s + e.total, 0);
    expect(Math.abs(soma - bigtech.total)).toBeLessThan(0.01);
    expect(bigtech.empresas.length).toBeGreaterThan(0);
    expect(bigtech.naoLocalizadas.length).toBeGreaterThan(0);
    // X e Kwai estão no radar do ETL; nesta coleta vieram zero (lacuna
    // declarada, não erro de casa).
    expect(bigtech.naoLocalizadas).toContain("X Corp (Twitter)");
    expect(bigtech.naoLocalizadas).toContain("Kwai");
  });

  it("meta por plataforma soma o total do grupo Meta", () => {
    expect(bigtech.metaPlataformas.length).toBeGreaterThan(0);
    const somaMeta = bigtech.empresas
      .filter((e) => e.grupo === "meta")
      .reduce((s, e) => s + e.total, 0);
    const somaPlataformas = bigtech.metaPlataformas.reduce((s, p) => s + p.total, 0);
    expect(Math.abs(somaPlataformas - somaMeta)).toBeLessThan(TOLERANCIA);
    const permitidas = new Set(["WhatsApp", "Instagram", "Facebook", "sem plataforma declarada"]);
    for (const p of bigtech.metaPlataformas) {
      expect(permitidas.has(p.plataforma), p.plataforma).toBe(true);
    }
  });

  it("a tabela publicada tem as linhas que a meta anuncia", () => {
    expect(linhas.length).toBe(meta.totais.linhasTabela);
  });

  it("linhas seguem o combinado: cargo válido, eleito 0/1/2, valores não negativos", () => {
    const cargosValidos = new Set(meta.porCargo.map((c) => c.cargo));
    expect(cargosValidos.size).toBeGreaterThan(0);
    for (const l of linhas) {
      expect(cargosValidos.has(l.cargo)).toBe(true);
      expect([0, 1, 2]).toContain(l.eleito);
      expect(l.receita).toBeGreaterThanOrEqual(0);
      expect(l.contratado).toBeGreaterThanOrEqual(0);
      expect(l.pago).toBeGreaterThanOrEqual(0);
      expect(l.bigtech).toBeGreaterThanOrEqual(0);
      if (l.custoVoto != null) expect(l.custoVoto).toBeGreaterThanOrEqual(0);
    }
  });

  it("o selo de parcialidade e as lacunas continuam na meta", () => {
    expect(meta.coleta.parcial).toBe(true);
    expect(meta.coleta.motivo_parcial.length).toBeGreaterThan(0);
    expect(meta.coleta.recoleta.length).toBeGreaterThan(0);
    expect(meta.lacunas.length).toBeGreaterThan(0);
    expect(meta.metodologia.length).toBeGreaterThan(0);
  });

  it("análise por partido soma os totais da capa (universo completo)", () => {
    expect(porPartido.length).toBeGreaterThan(0);
    const somaDinheiro = (campo: "receita" | "contratado" | "pago") =>
      porPartido.reduce((s, p) => s + p[campo], 0);
    expect(Math.abs(somaDinheiro("receita") - meta.totais.receita)).toBeLessThan(TOLERANCIA);
    expect(Math.abs(somaDinheiro("contratado") - meta.totais.contratado)).toBeLessThan(TOLERANCIA);
    expect(Math.abs(somaDinheiro("pago") - meta.totais.pago)).toBeLessThan(TOLERANCIA);
    const eleitos = porPartido.reduce((s, p) => s + p.eleitos, 0);
    const pendentes = porPartido.reduce((s, p) => s + p.pendentes2t, 0);
    expect(eleitos).toBe(meta.totais.eleitos1Turno);
    expect(pendentes).toBe(meta.totais.pendentes2Turno);
  });

  it("análise por UF (sem presidência) soma com o cargo Presidente nos totais", () => {
    expect(porUf.length).toBeGreaterThan(0);
    expect(porUf.every((u) => u.uf !== "BR")).toBe(true);
    const presidente = meta.porCargo.find((c) => c.cargo === "Presidente");
    expect(presidente).toBeDefined();
    const somaDinheiro = (campo: "receita" | "contratado" | "pago") =>
      porUf.reduce((s, u) => s + u[campo], 0);
    // Em 2026 ninguém foi eleito presidente no 1º turno: os eleitos 1T do
    // país estão todos nas UFs; os 2 pendentes do 2º turno presidencial
    // estão no cargo Presidente, não em nenhuma UF.
    expect(
      Math.abs(somaDinheiro("receita") + (presidente?.receita ?? 0) - meta.totais.receita)
    ).toBeLessThan(TOLERANCIA);
    expect(
      Math.abs(somaDinheiro("contratado") + (presidente?.contratado ?? 0) - meta.totais.contratado)
    ).toBeLessThan(TOLERANCIA);
    expect(Math.abs(somaDinheiro("pago") + (presidente?.pago ?? 0) - meta.totais.pago)).toBeLessThan(
      TOLERANCIA
    );
    const eleitos = porUf.reduce((s, u) => s + u.eleitos, 0);
    expect(eleitos).toBe(meta.totais.eleitos1Turno);
    const pendentes = porUf.reduce((s, u) => s + u.pendentes2t, 0) + 2;
    expect(pendentes).toBe(meta.totais.pendentes2Turno);
  });

  it("cada UF soma seus partidos em contratado", () => {
    for (const u of porUf) {
      const contratado = u.partidos.reduce((s, p) => s + p.contratado, 0);
      expect(Math.abs(contratado - u.contratado), `UF ${u.uf}`).toBeLessThan(TOLERANCIA);
    }
  });

  it("nenhum CPF nem sequencial de 11 dígitos nos JSONs versionados", () => {
    // Guarda do AGENTS.md § 5.2: o repositório é público e já publicou CPF
    // duas vezes. SQ de candidato tem 11 dígitos e é indistinguível de CPF
    // na varredura — por isso o ETL não emite SQ nenhum.
    const reCpfOuSq = /(?<!\d)\d{11}(?!\d)/;
    for (const nome of arquivos) {
      expect(lerTexto(nome), `${nome} não pode conter 11 dígitos seguidos`).not.toMatch(reCpfOuSq);
    }
  });
});
