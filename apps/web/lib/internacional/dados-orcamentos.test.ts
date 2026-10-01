/**
 * @file apps/web/lib/internacional/dados-orcamentos.test.ts
 * @description Suíte de testes unitários do módulo de orçamentos internacionais (EUA, Canadá e Europa).
 *
 * Validações obrigatórias:
 * 1. Integridade do carregamento da tabela compacta e conformidade com `COBERTURA_ORCAMENTOS`.
 * 2. Presença dos 3 blocos geopolíticos e dos 7 eixos orçamentários solicitados pelo usuário.
 * 3. Validação das URLs canônicas oficiais (100% iniciando com `https://`).
 * 4. Consistência dos valores em bilhões de dólares e cálculo do comparativo Militar vs Clima.
 * 5. Guarda estrita de ausência de CPF (mod-11) em todos os campos textuais.
 */

import { describe, it, expect } from "vitest";
import {
  obterTodosOrcamentos,
  obterOrcamentosPorBloco,
  obterOrcamentosPorEixo,
  obterOrcamentoPorId,
  obterComparativoMilitarVsClima,
  COBERTURA_ORCAMENTOS,
  ROTULOS_EIXOS,
  ROTULOS_BLOCOS,
  type EixoOrcamentario,
  type BlocoGeopolitico,
} from "./dados-orcamentos";

describe("dados-orcamentos (Orçamentos Comparados: EUA, Canadá e Europa)", () => {
  it("deve carregar com sucesso todos os registros catalogados", () => {
    const orcamentos = obterTodosOrcamentos();
    expect(orcamentos.length).toBeGreaterThanOrEqual(25);
    expect(orcamentos.length).toBe(COBERTURA_ORCAMENTOS.totalRegistros);
  });

  it("deve cobrir os três blocos geopolíticos mandatários (EUA, Canadá, Europa)", () => {
    const blocosEsperados: BlocoGeopolitico[] = ["EUA", "Canada", "Europa"];
    for (const b of blocosEsperados) {
      const filtrados = obterOrcamentosPorBloco(b);
      expect(filtrados.length).toBeGreaterThan(0);
      expect(ROTULOS_BLOCOS[b]).toBeDefined();
    }
  });

  it("deve cobrir todos os 7 eixos orçamentários solicitados", () => {
    const eixosEsperados: EixoOrcamentario[] = [
      "militar",
      "inteligencia",
      "economico",
      "tecnologico",
      "hidrico",
      "energetico",
      "clima",
    ];

    for (const eixo of eixosEsperados) {
      const filtrados = obterOrcamentosPorEixo(eixo);
      expect(filtrados.length).toBeGreaterThan(0);
      expect(ROTULOS_EIXOS[eixo]).toBeDefined();
    }
  });

  it("deve conter URLs canônicas oficiais válidas iniciando em https:// em todos os registros", () => {
    const orcamentos = obterTodosOrcamentos();
    for (const o of orcamentos) {
      expect(o.urlFonteOficial).toMatch(/^https:\/\//);
      expect(o.fonteOficialNome.length).toBeGreaterThan(2);
      expect(o.programaAgencia.length).toBeGreaterThan(3);
    }
  });

  it("deve conter valores numéricos e percentuais consistentes", () => {
    const orcamentos = obterTodosOrcamentos();
    for (const o of orcamentos) {
      expect(o.valorUsdBi).toBeGreaterThan(0);
      expect(o.pctPib).toBeGreaterThanOrEqual(0);
      expect(o.cruzamentoBrasil.length).toBeGreaterThan(15);
      expect(Array.isArray(o.destaqueProjetos)).toBe(true);
      expect(o.destaqueProjetos.length).toBeGreaterThan(0);
    }
  });

  it("deve calcular o comparativo Militar vs Clima evidenciando a desproporção orçamentária", () => {
    const comparativo = obterComparativoMilitarVsClima();
    expect(comparativo.length).toBeGreaterThan(0);

    const euaComp = comparativo.find((item) => item.pais === "Estados Unidos");
    expect(euaComp).toBeDefined();
    expect(euaComp!.razaoMilitarSobreClima).toBeGreaterThan(15);
  });

  it("deve recuperar um registro específico pelo ID", () => {
    const registro = obterOrcamentoPorId("orc-eua-militar-dod");
    expect(registro).toBeDefined();
    expect(registro?.pais).toBe("Estados Unidos");
    expect(registro?.eixo).toBe("militar");
  });

  it("não deve conter nenhum CPF válido por mod-11 em nenhum campo textual", () => {
    const orcamentos = obterTodosOrcamentos();
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

    function validarCpfMod11(cpfRaw: string): boolean {
      const digitos = cpfRaw.replace(/\D/g, "");
      if (digitos.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(digitos)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(digitos[i], 10) * (10 - i);
      }
      let resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(digitos[9], 10)) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(digitos[i], 10) * (11 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      return resto === parseInt(digitos[10], 10);
    }

    for (const o of orcamentos) {
      const textoGeral = `${o.descricao} ${o.cruzamentoBrasil} ${o.programaAgencia} ${o.destaqueProjetos.join(" ")}`;
      const matches = textoGeral.match(regexCpf) || [];
      for (const m of matches) {
        expect(validarCpfMod11(m)).toBe(false);
      }
    }
  });
});
