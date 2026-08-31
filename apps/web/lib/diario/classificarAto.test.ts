import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  classificarAto,
  DESCRICAO_TIPO,
  normalizarTituloAto,
  ROTULOS_TIPO,
  type TipoAto,
  TIPOS_ATO,
} from "./classificarAto";

/**
 * Calibração contra títulos REAIS do diário oficial de Diamantina
 * (Prefeitura e Câmara, via SIGPub/AMM-MG; extração em 16/08/2026, mais 5
 * títulos de 22/08/2026).
 */

interface Amostra {
  titulo: string;
  data: string;
  entidade: string;
  esperado: TipoAto;
}

const AMOSTRA: Amostra[] = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "diamantina-75-titulos.json"), "utf-8")
) as Amostra[];

describe("amostra real de Diamantina — 75 títulos", () => {
  test("toda a amostra é classificada como esperado", () => {
    const erros: string[] = [];
    for (const a of AMOSTRA) {
      const obtido = classificarAto(a.titulo);
      if (obtido !== a.esperado) {
        erros.push(`[${a.data} ${a.entidade}] esperado ${a.esperado}, obtido ${obtido}: ${a.titulo}`);
      }
    }
    expect(erros).toEqual([]);
  });

  test("95% ou mais da amostra recebe tipo distinto de 'outro'", () => {
    const comTipo = AMOSTRA.filter((a) => classificarAto(a.titulo) !== "outro").length;
    expect(comTipo / AMOSTRA.length).toBeGreaterThanOrEqual(0.95);
  });

  test("amostra tem pelo menos 75 títulos reais", () => {
    expect(AMOSTRA.length).toBeGreaterThanOrEqual(75);
  });
});

describe("constantes e tipagem canônica", () => {
  test("TIPOS_ATO contém exatamente os 7 tipos canônicos", () => {
    expect(TIPOS_ATO).toEqual([
      "decreto",
      "edital",
      "contrato",
      "convenio",
      "portaria",
      "lei",
      "outro",
    ]);
  });

  test("ROTULOS_TIPO e DESCRICAO_TIPO cobrem todos os 7 tipos", () => {
    for (const tipo of TIPOS_ATO) {
      expect(ROTULOS_TIPO[tipo]).toBeDefined();
      expect(DESCRICAO_TIPO[tipo]).toBeDefined();
    }
  });
});

describe("casos de borda das regras e precedência", () => {
  test("homologação de CONTRATO é contrato, não edital (ordem das regras)", () => {
    expect(classificarAto("TERMO DE HOMOLOGAÇÃO AO CONTRATO Nº 08/2025")).toBe("contrato");
    expect(classificarAto("EXTRATO DE CONTRATO AO PROCESSO LICITATÓRIO Nº 14/2025")).toBe("contrato");
  });

  test("homologação de processo LICITATÓRIO é edital", () => {
    expect(classificarAto("TERMO DE HOMOLOGAÇÃO AO PROCESSO LICITATÓRIO 08/2026")).toBe("edital");
  });

  test("ata de registro de preço é edital mesmo sem nenhuma palavra de licitação", () => {
    expect(classificarAto("EXTRATO: ATA DE REGISTRO DE PREÇO N° 043/2026")).toBe("edital");
    expect(classificarAto("INTENÇÃO DE REGISTRO DE PREÇOS 015/2026")).toBe("edital");
  });

  test("termo de ratificação isolado é edital, sem precisar de 'DE DISPENSA DE LICITAÇÃO' junto", () => {
    expect(classificarAto("EXTRATO DO TERMO DE RATIFICAÇÃO")).toBe("edital");
  });

  test("aditivo de convênio é convênio mesmo sem a palavra convênio", () => {
    expect(classificarAto("2º TERMO ADITIVO AO TERMO DE COLABORAÇÃO Nº 002/2025")).toBe("convenio");
    expect(classificarAto("TERMO DE FOMENTO Nº 010/2026")).toBe("convenio");
    expect(classificarAto("ACORDO DE COOPERAÇÃO TÉCNICA Nº 003/2026")).toBe("convenio");
    expect(classificarAto("TERMO DE PARCERIA Nº 001/2026")).toBe("convenio");
  });

  test("acento e caixa não importam", () => {
    expect(classificarAto("aviso de licitação")).toBe("edital");
    expect(classificarAto("DECRETO Nº 338, DE 30 DE JUNHO DE 2026.")).toBe("decreto");
    expect(classificarAto("EXTRATO DO TERMO DE RATIFICAÇÃO DE DISPENSA DE LICITAÇÃO")).toBe("edital");
  });

  test("lei é reconhecida no começo do título ou com limite de palavra", () => {
    expect(classificarAto("LEI Nº 1.234, DE 05 DE MAIO DE 2026.")).toBe("lei");
    expect(classificarAto("LEI COMPLEMENTAR Nº 10/2026")).toBe("lei");
    expect(classificarAto("LEI ORDINÁRIA Nº 555/2026")).toBe("lei");
  });

  test("projeto de lei não vira lei por engano", () => {
    expect(classificarAto("PROJETO DE LEI Nº 05/2026")).toBe("outro");
    expect(classificarAto("PROJETO DE LEI COMPLEMENTAR Nº 01/2026")).toBe("outro");
  });

  test("portaria com limites de palavra", () => {
    expect(classificarAto("PORTARIA SMS Nº 09, DE 27 DE MAIO DE 2026.")).toBe("portaria");
    expect(classificarAto("PORTARIA CONJUNTA Nº 02/2026")).toBe("portaria");
  });

  test("título sem pista nenhuma é outro", () => {
    expect(classificarAto("ORDEM DE SERVIÇO Nº 02/2026")).toBe("outro");
    expect(classificarAto("AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS")).toBe("outro");
    expect(classificarAto("RESULTADO DA ANÁLISE DE RECURSO")).toBe("outro");
  });

  test("título vazio ou nulo é outro e nunca lança", () => {
    expect(classificarAto("")).toBe("outro");
    expect(classificarAto(null)).toBe("outro");
    expect(classificarAto(undefined)).toBe("outro");
  });
});

describe("fallback seguro por categoriaOriginal (ex: DOM-PBH)", () => {
  test("quando título é genérico, categoriaOriginal define o tipo", () => {
    expect(classificarAto("EXTRATO", "Licitações e Editais")).toBe("edital");
    expect(classificarAto("CONVOCAÇÃO", "Portarias")).toBe("portaria");
    expect(classificarAto("COMUNICADO", "Decretos do Executivo")).toBe("decreto");
    expect(classificarAto("EXTRATO DE INSTRUMENTO", "Contratos")).toBe("contrato");
    expect(classificarAto("RESULTADO", "Termos de Colaboração")).toBe("convenio");
    expect(classificarAto("ATO NORMATIVO", "Leis Municipais")).toBe("lei");
  });

  test("quando título já tem tipo específico, categoriaOriginal não o sobrescreve", () => {
    expect(classificarAto("DECRETO Nº 123", "Editais")).toBe("decreto");
    expect(classificarAto("EXTRATO DE CONTRATO Nº 05", "Geral")).toBe("contrato");
  });

  test("categoriaOriginal nula ou vazia mantém 'outro' sem erro", () => {
    expect(classificarAto("CONVOCAÇÃO GERAL", null)).toBe("outro");
    expect(classificarAto("CONVOCAÇÃO GERAL", "")).toBe("outro");
  });
});

describe("normalizarTituloAto", () => {
  test("caixa alta e sem acento", () => {
    expect(normalizarTituloAto("Convênio de Colaboração")).toBe("CONVENIO DE COLABORACAO");
    expect(normalizarTituloAto("Licitação & Preço")).toBe("LICITACAO & PRECO");
    expect(normalizarTituloAto(null)).toBe("");
    expect(normalizarTituloAto(undefined)).toBe("");
  });
});
