import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { classificarAto, normalizarTituloAto, type TipoAto } from "./classificarAto";

/**
 * Calibração contra títulos REAIS do diário oficial de Diamantina
 * (Prefeitura e Câmara, via SIGPub/AMM-MG; extração em 16/08/2026, mais 5
 * títulos de 22/08/2026 — ver abaixo).
 *
 * Os 70 títulos originais de `fixtures/diamantina-75-titulos.json` foram
 * lidos um a um e rotulados à mão (coluna `esperado`). Quem muda uma regra do
 * classificador tem que passar nesta amostra inteira — é a mesma disciplina
 * de `etl/betim/etl/temas.py`, calibrado contra ementas reais.
 *
 * Os outros 5 vieram de rodar `--sondar` contra as 196 matérias REAIS de
 * julho/2026 (não só a amostra de 70): 32/196 (16%) caíam em "outro", bem
 * acima do ~4% esperado. Duas causas cobriam 21 dessas 32: "ATA DE REGISTRO
 * DE PREÇO" (instrumento de licitação, mas sem a palavra "LICIT") e "EXTRATO
 * DO TERMO DE RATIFICAÇÃO" isolado, sem o "DE DISPENSA DE LICITAÇÃO" que o
 * único exemplo anterior sempre trazia junto. `PALAVRAS_DE_LICITACAO` ganhou
 * as duas, e estes 5 títulos provam a correção contra o texto real que
 * motivou a mudança — não um título inventado para caber na regra.
 *
 * A fração que importa: 72 dos 75 (96%) recebem tipo ≠ `outro`. O pior modo
 * de falha do classificador é virar "outro" demais (o aviso do plano:
 * Diamantina ficou com 9% só nos temas; a regex não pode repetir isso).
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
});

describe("casos de borda das regras", () => {
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
  });

  test("acento e caixa não importam", () => {
    expect(classificarAto("aviso de licitação")).toBe("edital");
    expect(classificarAto("DECRETO Nº 338, DE 30 DE JUNHO DE 2026.")).toBe("decreto");
    expect(classificarAto("EXTRATO DO TERMO DE RATIFICAÇÃO DE DISPENSA DE LICITAÇÃO")).toBe("edital");
  });

  test("lei é reconhecida no começo do título", () => {
    expect(classificarAto("LEI Nº 1.234, DE 05 DE MAIO DE 2026.")).toBe("lei");
    expect(classificarAto("LEI COMPLEMENTAR Nº 10/2026")).toBe("lei");
  });

  test("projeto de lei não vira lei por engano", () => {
    expect(classificarAto("PROJETO DE LEI Nº 05/2026")).toBe("outro");
  });

  test("título sem pista nenhuma é outro", () => {
    expect(classificarAto("ORDEM DE SERVIÇO Nº 02/2026")).toBe("outro");
    expect(classificarAto("AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS")).toBe("outro");
    expect(classificarAto("RESULTADO DA ANÁLISE DE RECURSO")).toBe("outro");
  });

  test("título vazio é outro e nunca lança", () => {
    expect(classificarAto("")).toBe("outro");
  });
});

describe("normalizarTituloAto", () => {
  test("caixa alta e sem acento", () => {
    expect(normalizarTituloAto("Convênio de Colaboração")).toBe("CONVENIO DE COLABORACAO");
  });
});
