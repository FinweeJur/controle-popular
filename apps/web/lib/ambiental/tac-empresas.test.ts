import { describe, expect, test } from "vitest";
import { COBERTURA_TAC_EMPRESAS, TAC_EMPRESAS, TAC_EMPRESAS_REPETIDAS } from "./tac-empresas";

/**
 * Gerado a partir da captura `_tacs_empresas.json` (visual "totais por
 * empresa" do Painel TACs Final, SEMAD/MG). Ver docstring de
 * `tac-empresas.ts` para por que são 17 linhas para 15 empresas.
 */
describe("Totais por empresa dos TACs das mineradoras (Painel TACs Final, SEMAD/MG)", () => {
  const C = COBERTURA_TAC_EMPRESAS;

  test("17 linhas para 15 empresas — medido em 2026-08-21, com data cravada", () => {
    expect(TAC_EMPRESAS.length).toBe(17);
    expect(C.linhas).toBe(17);
    const unicas = new Set(TAC_EMPRESAS.map((l) => l.empresa));
    expect(unicas.size).toBe(15);
    expect(C.empresasUnicas).toBe(15);
  });

  test("a única empresa repetida é a Alcoa, com 3 linhas de valores diferentes", () => {
    // Trava a ANOMALIA, não a ausência dela: se a decodificação regredir e
    // passar a fundir ou duplicar linhas, este teste muda de forma visível.
    expect(TAC_EMPRESAS_REPETIDAS.length).toBe(1);
    expect(TAC_EMPRESAS_REPETIDAS[0].empresa).toBe("Alcoa Alumínio S.A");
    expect(TAC_EMPRESAS_REPETIDAS[0].ocorrencias).toBe(3);
    const linhasAlcoa = TAC_EMPRESAS.filter((l) => l.empresa === "Alcoa Alumínio S.A");
    expect(linhasAlcoa.length).toBe(3);
    // As 3 linhas trazem valores DIFERENTES — não é duplicata de decodificação.
    const totais = new Set(linhasAlcoa.map((l) => l.valorTotal));
    expect(totais.size).toBe(3);
  });

  test("Valor Estado + Valor MP fecha com Valor Total em toda linha — armadilha de tipo fechada", () => {
    // O DSR manda número como string quando o double não faz round-trip
    // limpo em JSON; se a normalização regredir, a soma abaixo concatenaria
    // string em vez de somar, e este teste falharia de forma óbvia.
    for (const l of TAC_EMPRESAS) {
      expect(typeof l.valorEstado, `${l.empresa}.valorEstado`).toBe("number");
      expect(typeof l.valorMp, `${l.empresa}.valorMp`).toBe("number");
      expect(typeof l.valorTotal, `${l.empresa}.valorTotal`).toBe("number");
      expect(l.valorEstado + l.valorMp, `${l.empresa}: Estado+MP vs Total`).toBeCloseTo(l.valorTotal, 1);
    }
  });

  test("os totais agregados batem com a soma da base", () => {
    expect(TAC_EMPRESAS.reduce((t, l) => t + l.valorEstado, 0)).toBeCloseTo(C.valorEstadoTotal, 1);
    expect(TAC_EMPRESAS.reduce((t, l) => t + l.valorMp, 0)).toBeCloseTo(C.valorMpTotal, 1);
    expect(TAC_EMPRESAS.reduce((t, l) => t + l.valorTotal, 0)).toBeCloseTo(C.valorTotalGeral, 1);
  });

  test("as duas ressalvas do painel viajam coladas ao dado", () => {
    expect(C.dadoCongeladoEm).toBe("2026-05-05");
    expect(C.ressalvaCongelamento).toMatch(/congelado/i);
    expect(C.workspaceDeOrigem).toBe("My workspace");
    expect(C.ressalvaWorkspace).toMatch(/institucional/i);
  });

  test("nenhum CPF sobreviveu — só razão social de pessoa jurídica", () => {
    // Varrer o JSON inteiro daria falso positivo: os valores monetários têm
    // até 17 dígitos de ruído de ponto flutuante (ex. "23675972.200000003"),
    // e uma sequência assim cruza o padrão de CPF por coincidência. O campo
    // de texto (nome da empresa) é o único lugar onde um CPF real apareceria.
    for (const l of TAC_EMPRESAS) {
      expect(l.empresa, `empresa "${l.empresa}"`).not.toMatch(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
      expect(l.empresa).not.toMatch(/^\d+$/);
    }
  });
});
