import { describe, expect, test } from "vitest";
import {
  LIMITE_CONTRATOS_CONCENTRACAO,
  fornecedoresToCsv,
  fornecedorAbertoNoPeriodo,
  fornecedorConcentradoNoAno,
  resumoDosFornecedores,
  type FornecedorRow,
} from "./fornecedores-puro";

function fornecedor(over: Partial<FornecedorRow>): FornecedorRow {
  return {
    chave: "12345678000199",
    razao_social: "Empresa Teste LTDA",
    cnpj: "12345678000199",
    valor_total: 1000,
    num_contratos: 1,
    num_orgaos: 1,
    ano_primeiro: 2024,
    ano_ultimo: 2025,
    tem_alerta: false,
    data_abertura: null,
    ...over,
  };
}

describe("fornecedorAbertoNoPeriodo", () => {
  test("abertura dentro da janela de contratos dispara o indicio", () => {
    expect(
      fornecedorAbertoNoPeriodo({ data_abertura: "2024-07-10", ano_primeiro: 2024, ano_ultimo: 2025 })
    ).toBe(true);
    // limite inclusivo dos dois lados
    expect(
      fornecedorAbertoNoPeriodo({ data_abertura: "2025-01-01", ano_primeiro: 2024, ano_ultimo: 2025 })
    ).toBe(true);
  });

  test("abertura antes ou depois da janela nao dispara", () => {
    expect(
      fornecedorAbertoNoPeriodo({ data_abertura: "2010-05-05", ano_primeiro: 2024, ano_ultimo: 2025 })
    ).toBe(false);
    expect(
      fornecedorAbertoNoPeriodo({ data_abertura: "2030-05-05", ano_primeiro: 2024, ano_ultimo: 2025 })
    ).toBe(false);
  });

  test("sem dado (nulo) nao dispara - ausencia nao e indicio", () => {
    expect(fornecedorAbertoNoPeriodo({ data_abertura: null, ano_primeiro: 2024, ano_ultimo: 2025 })).toBe(false);
    expect(fornecedorAbertoNoPeriodo({ data_abertura: "2024-01-01", ano_primeiro: null, ano_ultimo: 2025 })).toBe(false);
    expect(fornecedorAbertoNoPeriodo({ data_abertura: "2024-01-01", ano_primeiro: 2024, ano_ultimo: null })).toBe(false);
  });

  test("janela invertida (fonte inconsistente) ainda compara certo", () => {
    expect(
      fornecedorAbertoNoPeriodo({ data_abertura: "2024-07-10", ano_primeiro: 2025, ano_ultimo: 2024 })
    ).toBe(true);
  });
});

describe("fornecedorConcentradoNoAno", () => {
  test("so significa algo com recorte de ano ativo", () => {
    expect(fornecedorConcentradoNoAno({ num_contratos: 50 }, undefined)).toBe(false);
    expect(fornecedorConcentradoNoAno({ num_contratos: 50 }, "")).toBe(false);
    expect(fornecedorConcentradoNoAno({ num_contratos: 50 }, null)).toBe(false);
  });

  test("acima do limiar com ano ativo dispara; abaixo ou igual, nao", () => {
    const noLimite = LIMITE_CONTRATOS_CONCENTRACAO;
    expect(fornecedorConcentradoNoAno({ num_contratos: noLimite }, "2025")).toBe(false);
    expect(fornecedorConcentradoNoAno({ num_contratos: noLimite + 1 }, "2025")).toBe(true);
  });
});

describe("resumoDosFornecedores", () => {
  test("lista vazia devolve zeros e fatias nulas", () => {
    expect(resumoDosFornecedores([])).toEqual({
      totalValor: 0,
      totalFornecedores: 0,
      top1Pct: null,
      top5Pct: null,
    });
  });

  test("fatia do maior e do top 5 sobre a soma listada", () => {
    const linhas = [
      fornecedor({ chave: "a", valor_total: 500 }),
      fornecedor({ chave: "b", valor_total: 300 }),
      fornecedor({ chave: "c", valor_total: 200 }),
    ];
    const r = resumoDosFornecedores(linhas);
    expect(r.totalValor).toBe(1000);
    expect(r.totalFornecedores).toBe(3);
    expect(r.top1Pct).toBeCloseTo(50);
    expect(r.top5Pct).toBeCloseTo(100);
  });

  test("fornecedor unico: top5 fica nulo - concentracao entre um so nao e informacao", () => {
    const r = resumoDosFornecedores([fornecedor({ valor_total: 700 })]);
    expect(r.top1Pct).toBeCloseTo(100);
    expect(r.top5Pct).toBeNull();
  });

  test("nao muta a lista de entrada", () => {
    const linhas = [fornecedor({ chave: "a", valor_total: 100 }), fornecedor({ chave: "b", valor_total: 900 })];
    resumoDosFornecedores(linhas);
    expect(linhas[0].chave).toBe("a");
  });
});

describe("fornecedoresToCsv", () => {
  test("separador ; e BOM UTF-8 no primeiro byte", () => {
    const csv = fornecedoresToCsv([fornecedor({})]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("razao_social;cnpj;valor_total_contratado;num_contratos;num_orgaos");
  });

  test("valores numericos e datas na linha, tem_alerta como sim/nao", () => {
    const csv = fornecedoresToCsv([fornecedor({ data_abertura: "2024-03-01", tem_alerta: true })]);
    expect(csv).toContain("Empresa Teste LTDA;12345678000199;1000;1;1;2024;2025;2024-03-01;sim");
  });

  test("razao social com ; ou aspas fica entre aspas com aspas duplicadas", () => {
    const csv = fornecedoresToCsv([
      fornecedor({ razao_social: 'Construtora "A"; Filial' }),
    ]);
    expect(csv).toContain('"Construtora ""A""; Filial";');
  });

  test("lista vazia ainda devolve o cabecalho", () => {
    const csv = fornecedoresToCsv([]);
    expect(csv).toBe(
      "\ufeffrazao_social;cnpj;valor_total_contratado;num_contratos;num_orgaos;ano_primeiro_contrato;ano_ultimo_contrato;data_abertura_cnpj;tem_alerta\r\n"
    );
  });
});
