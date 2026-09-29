/**
 * @file corretor-digitacao.test.ts
 * @description Testes unitários para o corretor e normalizador tolerante a erros de digitação.
 */

import { describe, it, expect } from "vitest";
import {
  corrigirTermoUnico,
  corrigirDigitacaoFrase,
  normalizarFoneticaPtBr,
} from "./corretor-digitacao";

describe("Corretor de Digitação e Fonética do Seu Nonô", () => {
  it("corrige erros ortográficos comuns de c/s/ç e trocas de letras", () => {
    expect(corrigirTermoUnico("licensiamento")).toBe("licenciamento");
    expect(corrigirTermoUnico("licenciamneto")).toBe("licenciamento");
    expect(corrigirTermoUnico("licensas")).toBe("licencas");
    expect(corrigirTermoUnico("conveino")).toBe("convenios");
    expect(corrigirTermoUnico("orcameto")).toBe("orcamento");
    expect(corrigirTermoUnico("descaracterisacao")).toBe("descaracterizacao");
  });

  it("corrige nomes de cidades e empresas com grafia aproximada", () => {
    expect(corrigirTermoUnico("betin")).toBe("betim");
    expect(corrigirTermoUnico("diamantna")).toBe("diamantina");
    expect(corrigirTermoUnico("sygma")).toBe("sigma lithium");
    expect(corrigirTermoUnico("sigima")).toBe("sigma lithium");
    expect(corrigirDigitacaoFrase("belo orizonte")).toBe("belo horizonte");
  });

  it("corrige siglas institucionais e termos de tecnologia", () => {
    expect(corrigirTermoUnico("tjm")).toBe("tjmg");
    expect(corrigirTermoUnico("tce-mg")).toBe("tcemg");
    expect(corrigirTermoUnico("obsidiam")).toBe("obsidian");
    expect(corrigirTermoUnico("powerbii")).toBe("power bi");
    expect(corrigirTermoUnico("labortorio")).toBe("laboratorio");
  });

  it("corrige frases inteiras preservando o sentido cívico", () => {
    expect(corrigirDigitacaoFrase("quero ver o orcameto de betin")).toBe(
      "quero ver o orcamento de betim"
    );
    expect(corrigirDigitacaoFrase("licensas de barragen")).toBe(
      "licencas de barragens"
    );
    expect(corrigirDigitacaoFrase("abrir arvore obsidiam")).toBe(
      "abrir arvore obsidian"
    );
  });

  it("não distorce palavras curtas para evitar falsos positivos", () => {
    expect(corrigirTermoUnico("lei")).toBe("lei");
    expect(corrigirTermoUnico("rio")).toBe("rio");
    expect(corrigirTermoUnico("sus")).toBe("sus");
  });
});
