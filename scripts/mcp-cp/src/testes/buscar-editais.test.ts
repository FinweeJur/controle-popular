import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { lerEditais } from "../acervo.js";
import { buscarEditais, formatarEditais } from "../ferramentas/buscar-editais.js";
import { ErroDeEntrada } from "../resultado.js";

const bruto = JSON.parse(readFileSync(new URL("./fixtures/editais.json", import.meta.url), "utf8"));
const editais = lerEditais(bruto);

describe("lerEditais", () => {
  it("descarta item sem id, sem título ou que não é objeto", () => {
    expect(editais).toHaveLength(5);
    expect(editais.map((edital) => edital.id)).not.toContain("sem-titulo-deve-sumir");
  });

  it("limpa título, corta objeto e derruba URL que não é http", () => {
    const hostil = editais.find((edital) => edital.id === "2026-09-11-dddd4444");
    expect(hostil?.titulo).not.toContain("\u0007");
    expect(hostil?.urlOficial).toBeNull();

    const longo = editais.find((edital) => edital.id === "2026-09-13-eeee5555");
    expect(longo?.objeto.length).toBeLessThanOrEqual(600);
    expect(longo?.objeto.endsWith("…")).toBe(true);
  });
});

describe("buscarEditais", () => {
  it("casa sem acento e sem caixa, do mais recente para o mais antigo", () => {
    const resultado = buscarEditais(editais, { termo: "credenciamento" });
    expect(resultado.total).toBe(2);
    expect(resultado.itens[0]?.id).toBe("2026-09-15-aaaa1111");
    expect(resultado.itens[1]?.id).toBe("2026-09-10-bbbb2222");
  });

  it("exige todos os termos", () => {
    const dois = buscarEditais(editais, { termo: "credenciamento urologia" });
    expect(dois.total).toBe(1);
    expect(dois.itens[0]?.orgao).toBe("FHEMIG");

    const nenhum = buscarEditais(editais, { termo: "credenciamento barragem" });
    expect(nenhum.total).toBe(0);
  });

  it("filtra por órgão por trecho e sem acento", () => {
    const porOrgao = buscarEditais(editais, { termo: "hostil", orgao: "sef" });
    expect(porOrgao.total).toBe(1);
    expect(porOrgao.itens[0]?.id).toBe("2026-09-11-dddd4444");
  });

  it("devolve conteúdo hostil como dado, sem executar e sem URL clicável", () => {
    const resultado = buscarEditais(editais, { termo: "instrucoes" });
    expect(resultado.itens[0]?.urlOficial).toBeNull();
    expect(resultado.itens[0]?.objeto).toContain("<script>");
    const texto = formatarEditais(resultado);
    expect(texto).toContain("URL oficial não informada");
  });

  it("pagina com limite e deslocamento", () => {
    const primeira = buscarEditais(editais, { termo: "edital", limite: 1 });
    expect(primeira.mostrando).toBe(1);
    expect(primeira.itens[0]?.id).toBe("2026-09-13-eeee5555");
    expect(primeira.temMais).toBe(true);

    const segunda = buscarEditais(editais, { termo: "edital", limite: 1, deslocamento: 1 });
    expect(segunda.consulta.deslocamento).toBe(1);
    expect(segunda.itens[0]?.id).toBe("2026-09-12-cccc3333");
  });

  it("explica o vazio e sugere órgãos", () => {
    const resultado = buscarEditais(editais, { termo: "termo-que-nao-existe" });
    expect(resultado.total).toBe(0);
    expect(resultado.itens).toEqual([]);
    expect(resultado.mensagem).toContain("Nenhum edital encontrado");
    expect(resultado.orgaosDisponiveis.length).toBeGreaterThan(0);
    expect(formatarEditais(resultado)).toContain("Órgãos com edital no acervo");
  });

  it("recusa termo vazio e limite fora da faixa", () => {
    expect(() => buscarEditais(editais, { termo: "   " })).toThrow(ErroDeEntrada);
    expect(() => buscarEditais(editais, { termo: "edital", limite: 21 })).toThrow(ErroDeEntrada);
    expect(() => buscarEditais(editais, { termo: "edital", limite: 0 })).toThrow(ErroDeEntrada);
    expect(() => buscarEditais(editais, { termo: "edital", deslocamento: -1 })).toThrow(ErroDeEntrada);
  });

  it("usa limite padrão de 10", () => {
    const resultado = buscarEditais(editais, { termo: "edital" });
    expect(resultado.consulta.limite).toBe(10);
    expect(resultado.consulta.deslocamento).toBe(0);
  });
});
