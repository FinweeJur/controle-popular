import { describe, expect, test } from "vitest";
import { contratosToCsv } from "./contratos";
// Indício importado do módulo puro — testar a lógica não precisa da cadeia
// de banco que `./contratos` carrega.
import {
  INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO,
  contarContratosPorFornecedorAno,
  fornecedorCriadoNoAnoDoContrato,
  fornecedorExcedeContratosNoAno,
} from "./contratos-indicios";
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

describe("contarContratosPorFornecedorAno + fornecedorExcedeContratosNoAno", () => {
  const linha = (over: Partial<ContratoRow>): ContratoRow =>
    contrato({ ano: 2025, fornecedor_cnpj: "11111111000111", fornecedor_nome: "Alfa LTDA", ...over });

  test("conta por CNPJ+ano e ignora linha sem identificacao ou sem ano", () => {
    const contagens = contarContratosPorFornecedorAno([
      linha({}),
      linha({}),
      linha({ ano: 2024 }),
      linha({ fornecedor_cnpj: null, fornecedor_nome: null }),
      linha({ ano: null }),
    ]);
    expect(contagens.get("11111111000111|2025")).toBe(2);
    expect(contagens.get("11111111000111|2024")).toBe(1);
    expect(contagens.size).toBe(2);
  });

  test("sem CNPJ, agrupa pelo nome publicado", () => {
    const contagens = contarContratosPorFornecedorAno([
      linha({ fornecedor_cnpj: null }),
      linha({ fornecedor_cnpj: null, fornecedor_nome: "ALFA ltda" }),
    ]);
    expect(contagens.size).toBe(2); // caixa diferente = grupo diferente (mesma chave do banco)
  });

  test("limiar e estrito: N contratos nao acusam, N+1 sim", () => {
    const linhas = [
      linha({}), linha({}), linha({}), // 3 no ano
      linha({ ano: 2026 }), // outro ano, nao soma
    ];
    const contagens = contarContratosPorFornecedorAno(linhas);
    expect(INDICIO_CONCENTRACAO_CONTRATOS_NO_ANO).toBe(3);
    expect(fornecedorExcedeContratosNoAno(linhas[0], contagens)).toBe(false);
    const quatro = [...linhas, linha({})];
    const c4 = contarContratosPorFornecedorAno(quatro);
    expect(fornecedorExcedeContratosNoAno(quatro[0], c4)).toBe(true);
  });

  test("limite configuravel muda o disparo sem tocar no dado", () => {
    const contagens = contarContratosPorFornecedorAno([linha({}), linha({}), linha({})]);
    expect(fornecedorExcedeContratosNoAno(linha({}), contagens, 2)).toBe(true);
    expect(fornecedorExcedeContratosNoAno(linha({}), contagens, 3)).toBe(false);
  });

  test("cnpj igual junta grafias diferentes do nome; nome so quando falta cnpj", () => {
    const contagens = contarContratosPorFornecedorAno([
      linha({ fornecedor_nome: "Alfa LTDA" }),
      linha({ fornecedor_nome: "alfa ltda" }),
    ]);
    expect(contagens.get("11111111000111|2025")).toBe(2);
  });
});
