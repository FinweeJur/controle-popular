import { describe, expect, test } from "vitest";
import { contratosToCsv } from "./contratos";
// Indício importado do módulo puro — testar a lógica não precisa da cadeia
// de banco que `./contratos` carrega.
import { fornecedorCriadoNoAnoDoContrato } from "./contratos-indicios";
import type { ContratoRow } from "./contratos";

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

describe("fornecedorCriadoNoAnoDoContrato", () => {
  test("abertura no mesmo ano do contrato dispara o indicio", () => {
    expect(fornecedorCriadoNoAnoDoContrato({ ano: 2025, fornecedor_abertura: "2025-03-10" })).toBe(true);
  });

  test("ano diferente nao dispara", () => {
    expect(fornecedorCriadoNoAnoDoContrato({ ano: 2025, fornecedor_abertura: "2019-03-10" })).toBe(false);
    expect(fornecedorCriadoNoAnoDoContrato({ ano: 2025, fornecedor_abertura: "2026-01-01" })).toBe(false);
  });

  test("sem dado de abertura ou sem ano, nao dispara - ausencia nao e indicio", () => {
    expect(fornecedorCriadoNoAnoDoContrato({ ano: 2025, fornecedor_abertura: null })).toBe(false);
    expect(fornecedorCriadoNoAnoDoContrato({ ano: null, fornecedor_abertura: "2025-03-10" })).toBe(false);
  });
});

describe("contratosToCsv", () => {
  test("BOM UTF-8 e colunas novas tipo/orgao/ano/link_fonte", () => {
    const csv = contratosToCsv([
      contrato({
        tipo: "Contrato de Obra",
        orgao_nome: "Secretaria de Obras",
        link_fonte: "https://pncp.gov.br/app/editais/123",
      }),
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(
      "fornecedor,objeto,valor,status,data,alerta,motivos_alerta,fundamentacao_dos_motivos,tipo,orgao,ano,link_fonte"
    );
    expect(csv).toContain("Objeto teste,1000,ativo,2026-01-01,não,,,Contrato de Obra,Secretaria de Obras,2026,");
    expect(csv).toContain(",https://pncp.gov.br/app/editais/123");
  });

  test("lista vazia ainda devolve o cabecalho", () => {
    const csv = contratosToCsv([]);
    expect(csv).toBe(
      "\ufefffornecedor,objeto,valor,status,data,alerta,motivos_alerta,fundamentacao_dos_motivos,tipo,orgao,ano,link_fonte\n"
    );
  });
});
