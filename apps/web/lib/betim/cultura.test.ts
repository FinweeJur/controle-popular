import { describe, expect, test } from "vitest";
import { extrairGastosCultura, contratosCulturaToCsv } from "./cultura";
import type { DespesasPorFuncaoData } from "./despesas";
import type { ContratoRow } from "./contratos";

function despesaAno(ano: number, funcoes: { funcao: string; valor: number; pct: number }[]): DespesasPorFuncaoData {
  return {
    ano,
    anosDisponiveis: [ano],
    funcoes,
    total: funcoes.reduce((a, f) => a + f.valor, 0),
    configured: true,
    ok: funcoes.length > 0,
  };
}

describe("extrairGastosCultura", () => {
  test("pega só a função Cultura, um item por ano, mais recente primeiro", () => {
    const porAno = [
      despesaAno(2023, [{ funcao: "Cultura", valor: 100, pct: 1 }, { funcao: "Saúde", valor: 9000, pct: 90 }]),
      despesaAno(2024, [{ funcao: "Cultura", valor: 150, pct: 1.2 }, { funcao: "Saúde", valor: 9500, pct: 88 }]),
    ];
    expect(extrairGastosCultura(porAno)).toEqual([
      { ano: 2024, valor: 150, pct: 1.2 },
      { ano: 2023, valor: 100, pct: 1 },
    ]);
  });

  test("ano sem a função Cultura não aparece no resultado, mas não derruba os outros anos", () => {
    const porAno = [
      despesaAno(2022, [{ funcao: "Saúde", valor: 9000, pct: 100 }]),
      despesaAno(2023, [{ funcao: "Cultura", valor: 50, pct: 0.5 }]),
    ];
    expect(extrairGastosCultura(porAno)).toEqual([{ ano: 2023, valor: 50, pct: 0.5 }]);
  });

  test("ano com ok:false (banco fora, tabela vazia) é ignorado", () => {
    const porAno = [
      { ano: 2024, anosDisponiveis: [2024], funcoes: [], total: 0, configured: true, ok: false },
    ];
    expect(extrairGastosCultura(porAno)).toEqual([]);
  });

  test("nenhum ano disponível dá lista vazia, não erro", () => {
    expect(extrairGastosCultura([])).toEqual([]);
  });
});

function contrato(over: Partial<ContratoRow>): ContratoRow {
  return {
    id: "1",
    fornecedor_nome: "Fornecedor Teste",
    fornecedor_cnpj: null,
    objeto: "Objeto teste",
    valor_global: 1000,
    status: "ativo",
    data_assinatura: "2026-01-01",
    vigencia_inicio: null,
    vigencia_fim: null,
    ano: 2026,
    alerta: false,
    motivos_alerta: null,
    ...over,
  };
}

describe("contratosCulturaToCsv", () => {
  test("separador é ; e o arquivo abre com BOM UTF-8", () => {
    const csv = contratosCulturaToCsv([contrato({})]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("fornecedor;objeto;valor;status;data_assinatura;ano");
    expect(csv).toContain("Fornecedor Teste;Objeto teste;1000;ativo;2026-01-01;2026");
  });

  test("campo com ; ou aspas fica entre aspas, com aspas internas duplicadas", () => {
    const csv = contratosCulturaToCsv([
      contrato({ fornecedor_nome: 'Empresa "A"; Filial', objeto: "Show; apresentação" }),
    ]);
    expect(csv).toContain('"Empresa ""A""; Filial";"Show; apresentação"');
  });

  test("lista vazia ainda devolve o cabeçalho", () => {
    const csv = contratosCulturaToCsv([]);
    expect(csv).toBe("﻿fornecedor;objeto;valor;status;data_assinatura;ano\r\n");
  });
});
