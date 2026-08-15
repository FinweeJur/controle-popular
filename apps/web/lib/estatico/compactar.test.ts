import { describe, expect, test } from "vitest";
import { compactar, expandir, serializarCompacto, type TabelaCompacta } from "./compactar";

/**
 * O teste que importa é o de ida e volta: compactar só vale se `expandir`
 * devolver exatamente o que entrou. O resto confere que a DECISÃO de internar
 * é medida, e não um palpite que às vezes aumenta o arquivo.
 */

/** Registros com uma coluna de baixa cardinalidade e uma quase única. */
function amostra(n: number) {
  const situacoes = ["Aguarda publicação de portaria", "Projeto em avaliação documental"];
  return Array.from({ length: n }, (_, i) => ({
    PRONAC: String(266000 + i),
    nome: `Festival número ${i} com nome razoavelmente longo`,
    situacao: situacoes[i % situacoes.length],
    valor_aprovado: i * 1000,
  }));
}

describe("compactar/expandir", () => {
  test("ida e volta devolve os registros idênticos", () => {
    const itens = amostra(200);
    expect(expandir(compactar(itens))).toEqual(itens);
  });

  test("lista vazia não é erro — vai e volta vazia", () => {
    const vazio = compactar([]);
    expect(vazio).toEqual({ esqueleto: [], dicionarios: {}, linhas: [] });
    expect(expandir(vazio)).toEqual([]);
  });

  test("interna a coluna repetitiva e NÃO interna a quase única", () => {
    const { dicionarios } = compactar(amostra(200));
    expect(Object.keys(dicionarios)).toContain("situacao");
    // `nome` tem 200 valores distintos em 200 linhas: internar custaria o texto
    // inteiro no dicionário MAIS o índice em cada linha. É o erro que a medição
    // por bytes existe para evitar.
    expect(Object.keys(dicionarios)).not.toContain("nome");
    expect(Object.keys(dicionarios)).not.toContain("PRONAC");
  });

  test("número nunca vira índice de dicionário", () => {
    // Coluna numérica de baixíssima cardinalidade — a tentação máxima.
    const itens = Array.from({ length: 100 }, (_, i) => ({ id: String(i), ano: 2026 }));
    expect(compactar(itens).dicionarios).not.toHaveProperty("ano");
    expect(expandir(compactar(itens))[0].ano).toBe(2026);
  });

  test("compacta de verdade: o texto encolhe", () => {
    const itens = amostra(500);
    const antes = Buffer.byteLength(JSON.stringify(itens), "utf8");
    const depois = Buffer.byteLength(JSON.stringify(compactar(itens)), "utf8");
    expect(depois).toBeLessThan(antes / 2);
  });

  test("`nuncaInternar` vence a medição", () => {
    const itens = amostra(200);
    const { dicionarios } = compactar(itens, { nuncaInternar: ["situacao"] });
    expect(dicionarios).not.toHaveProperty("situacao");
    // E continua sendo lido corretamente, por extenso.
    expect(expandir(compactar(itens, { nuncaInternar: ["situacao"] }))).toEqual(itens);
  });

  test("o dicionário é ordenado por frequência, com desempate estável", () => {
    // Repetido 100× de propósito: com 7 linhas só, internar NÃO paga (o
    // dicionário custa mais que a coluna por extenso) e o campo sai sem
    // dicionário nenhum — que é o comportamento certo, e foi o que este teste
    // acusou na primeira versão.
    const itens = Array.from({ length: 100 }, () => [
      { uf: "MG" }, { uf: "MG" }, { uf: "MG" },
      { uf: "SP" }, { uf: "SP" },
      { uf: "BA" },
      { uf: "AL" },
    ]).flat();
    const { dicionarios } = compactar(itens);
    // MG (3), SP (2), depois AL e BA empatados em 1 — alfabético.
    expect(dicionarios.uf).toEqual(["MG", "SP", "AL", "BA"]);
  });

  test("mesma entrada duas vezes dá exatamente o mesmo texto", () => {
    // Sem isto, uma recoleta idêntica poderia produzir diff — e diff que não
    // corresponde a mudança de dado treina quem revisa a ignorar o diff.
    const itens = amostra(50);
    const a = serializarCompacto({ fonte: "x" }, compactar(itens));
    const b = serializarCompacto({ fonte: "x" }, compactar([...itens]));
    expect(a).toBe(b);
  });

  test("aborta quando um registro traz campo que o primeiro não tinha", () => {
    expect(() =>
      compactar([{ a: "1" }, { a: "2", b: "novo" } as Record<string, unknown>])
    ).toThrow(/campo que o primeiro não tinha/);
  });

  test("aborta em linha truncada e em índice fora do dicionário", () => {
    const boa = compactar(amostra(10));
    const truncada: TabelaCompacta = { ...boa, linhas: [boa.linhas[0].slice(0, 2)] };
    expect(() => expandir(truncada)).toThrow(/truncado/);

    const foraDaFaixa: TabelaCompacta = {
      ...boa,
      linhas: [boa.esqueleto.map((c) => (c === "situacao" ? 99 : "x"))],
    };
    expect(() => expandir(foraDaFaixa)).toThrow(/posição 99 do dicionário/);
  });
});

describe("serializarCompacto", () => {
  test("uma linha por registro, e o cabeçalho vem antes", () => {
    const texto = serializarCompacto({ fonte: "SALIC" }, compactar(amostra(4)));
    expect(texto.indexOf('"fonte"')).toBeLessThan(texto.indexOf('"linhas"'));
    // 4 registros = 4 linhas dentro de `linhas`, para o diff mostrar qual mudou.
    const corpo = texto.slice(texto.indexOf('"linhas"'));
    expect(corpo.split("\n").filter((l) => l.trim().startsWith("["))).toHaveLength(4);
  });

  test("o texto gerado é JSON válido e reexpande", () => {
    const itens = amostra(30);
    const lido = JSON.parse(serializarCompacto({ fonte: "SALIC" }, compactar(itens)));
    expect(lido.fonte).toBe("SALIC");
    expect(expandir(lido as TabelaCompacta)).toEqual(itens);
  });
});
