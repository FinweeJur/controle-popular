import { describe, expect, it } from "vitest";
import { fatiar, indiceVazio, ORCAMENTO_PADRAO_BYTES } from "./fatiar";

/**
 * O corte por bytes é a peça de que depende o deploy inteiro do modo estático:
 * uma fatia acima de 25 MiB derruba a publicação DEPOIS do build inteiro ter
 * sido pago. Estes testes existem para essa conta não quebrar em silêncio.
 */

/** Mede o que o arquivo vai realmente ocupar, não o que a lib disse que ocupa. */
function bytesReais(fatia: unknown[]): number {
  return Buffer.byteLength(JSON.stringify(fatia), "utf8");
}

describe("fatiar", () => {
  it("não emite fatia acima do orçamento", () => {
    const linhas = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      nome: `Servidor ${i}`,
      cargo: "Analista de alguma coisa com nome comprido",
    }));
    const { manifesto, fatias } = fatiar(linhas, { orcamentoBytes: 4096 });

    for (const fatia of fatias) {
      expect(bytesReais(fatia)).toBeLessThanOrEqual(4096);
    }
    expect(manifesto.fatias).toBeGreaterThan(1);
  });

  it("o tamanho declarado no manifesto não subestima o arquivo real", () => {
    // Se `bytesPorFatia` mentir para baixo, a barra de progresso mente e, pior,
    // a conta de orçamento passa a autorizar fatias maiores que o teto.
    const linhas = Array.from({ length: 300 }, (_, i) => ({ i, s: "x".repeat(i % 40) }));
    const { manifesto, fatias } = fatiar(linhas, { orcamentoBytes: 2048 });

    fatias.forEach((fatia, idx) => {
      expect(manifesto.bytesPorFatia[idx]).toBeGreaterThanOrEqual(bytesReais(fatia));
    });
  });

  it("preserva a ordem e não perde nem duplica linha", () => {
    // A tabela mostra a primeira página assim que a fatia 0 chega — o que só é
    // a primeira página de verdade se a ordem vier pronta do build.
    const linhas = Array.from({ length: 250 }, (_, i) => ({ i }));
    const { fatias, manifesto } = fatiar(linhas, { orcamentoBytes: 512 });

    const remontado = fatias.flat();
    expect(remontado).toEqual(linhas);
    expect(manifesto.total).toBe(250);
    expect(manifesto.linhasPorFatia.reduce((a, b) => a + b, 0)).toBe(250);
  });

  it("linha maior que o orçamento vira fatia própria, com aviso, sem sumir", () => {
    const gigante = { id: 2, objeto: "y".repeat(5000) };
    const linhas = [{ id: 1, objeto: "curto" }, gigante, { id: 3, objeto: "curto" }];
    const { fatias, manifesto } = fatiar(linhas, { orcamentoBytes: 1024 });

    expect(fatias.flat()).toEqual(linhas);
    expect(fatias.some((f) => f.length === 1 && f[0] === gigante)).toBe(true);
    expect(manifesto.avisos).toHaveLength(1);
    expect(manifesto.avisos[0]).toContain("fatia");
  });

  it("caminho feliz não gera aviso", () => {
    const { manifesto } = fatiar(
      Array.from({ length: 50 }, (_, i) => ({ i })),
      { orcamentoBytes: ORCAMENTO_PADRAO_BYTES }
    );
    expect(manifesto.avisos).toEqual([]);
    expect(manifesto.fatias).toBe(1);
  });

  it("lista vazia não gera fatia vazia", () => {
    // Uma fatia `[]` viraria um arquivo servido para nada, e o cliente teria de
    // tratar "fatia existe mas está vazia" como caso à parte.
    const { fatias, manifesto } = fatiar([]);
    expect(fatias).toEqual([]);
    expect(manifesto.fatias).toBe(0);
    expect(manifesto.total).toBe(0);
  });

  it("acentuação conta como os bytes que ocupa, não como caracteres", () => {
    // UTF-8: 'ç' e 'ã' ocupam 2 bytes. Contar `.length` daria fatia maior que o
    // orçamento em qualquer tabela em português — que são todas as deste app.
    const linhas = Array.from({ length: 100 }, () => ({ t: "informação pública ção ã" }));
    const { fatias } = fatiar(linhas, { orcamentoBytes: 1024 });
    for (const fatia of fatias) {
      expect(bytesReais(fatia)).toBeLessThanOrEqual(1024);
    }
  });

  it("indiceVazio é um estado válido, não um erro", () => {
    const vazio = indiceVazio<{ id: number }>();
    expect(vazio.fatias).toEqual([]);
    expect(vazio.manifesto.total).toBe(0);
    expect(vazio.manifesto.avisos).toEqual([]);
  });
});
