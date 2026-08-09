import { describe, it, expect } from "vitest";
import { arquivosDoIndice, arquivosDeIndiceVazio, NOME_MANIFESTO } from "./emitir";
import type { ManifestoFatias } from "./fatiar";

const manifestoDe = (arquivos: { nome: string; conteudo: string }[]): ManifestoFatias =>
  JSON.parse(arquivos.find((a) => a.nome === NOME_MANIFESTO)!.conteudo);

describe("arquivosDoIndice", () => {
  it("emite manifesto mais uma fatia por corte, na ordem", () => {
    const linhas = Array.from({ length: 5 }, (_, i) => ({ id: i, texto: "x".repeat(200) }));
    const arquivos = arquivosDoIndice(linhas, { orcamentoBytes: 500 });

    expect(arquivos[0].nome).toBe(NOME_MANIFESTO);
    const fatias = arquivos.slice(1).map((a) => a.nome);
    expect(fatias).toEqual(fatias.map((_, i) => `${i}.json`));
  });

  it("o manifesto descreve o que foi realmente emitido", () => {
    const linhas = Array.from({ length: 5 }, (_, i) => ({ id: i, texto: "x".repeat(200) }));
    const arquivos = arquivosDoIndice(linhas, { orcamentoBytes: 500 });
    const m = manifestoDe(arquivos);

    // O manifesto mentir sobre a contagem é pior que não existir: o cliente
    // para de baixar cedo e mostra tabela incompleta com cara de completa.
    expect(m.fatias).toBe(arquivos.length - 1);
    expect(m.total).toBe(5);
    expect(m.linhasPorFatia.reduce((a, b) => a + b, 0)).toBe(5);
  });

  it("nao perde nem reordena linha ao fatiar", () => {
    const linhas = Array.from({ length: 40 }, (_, i) => ({ id: i }));
    const arquivos = arquivosDoIndice(linhas, { orcamentoBytes: 120 });
    const remontado = arquivos
      .filter((a) => a.nome !== NOME_MANIFESTO)
      .flatMap((a) => JSON.parse(a.conteudo) as { id: number }[]);

    // Ordem preservada é requisito: a tabela mostra a fatia 0 como primeira
    // pagina, e isso so e a primeira pagina de verdade se a ordem vier do build.
    expect(remontado.map((l) => l.id)).toEqual(linhas.map((l) => l.id));
  });

  it("cada fatia e JSON valido de array", () => {
    const arquivos = arquivosDoIndice([{ a: 1 }, { a: 2 }]);
    for (const arq of arquivos.filter((a) => a.nome !== NOME_MANIFESTO)) {
      expect(Array.isArray(JSON.parse(arq.conteudo))).toBe(true);
    }
  });

  it("uma linha gigante vira fatia propria e o manifesto avisa", () => {
    const linhas = [{ id: 1 }, { id: 2, texto: "x".repeat(5000) }, { id: 3 }];
    const m = manifestoDe(arquivosDoIndice(linhas, { orcamentoBytes: 1000 }));
    expect(m.total).toBe(3);
    expect(m.avisos.length).toBeGreaterThan(0);
  });
});

describe("arquivosDeIndiceVazio", () => {
  // Sem este arquivo, o cliente leva 404 e mostra "erro ao carregar" para uma
  // tabela que so nao tem linha. Num portal de transparencia, "nao ha contrato"
  // e "nao consegui buscar" nao podem parecer a mesma coisa.
  it("emite manifesto mesmo sem nenhuma fatia", () => {
    const arquivos = arquivosDeIndiceVazio();
    expect(arquivos).toHaveLength(1);
    expect(arquivos[0].nome).toBe(NOME_MANIFESTO);
    const m: ManifestoFatias = JSON.parse(arquivos[0].conteudo);
    expect(m.total).toBe(0);
    expect(m.fatias).toBe(0);
  });

  it("tem a mesma forma do manifesto normal, para o cliente nao ramificar", () => {
    const vazio = manifestoDe(arquivosDeIndiceVazio());
    const cheio = manifestoDe(arquivosDoIndice([{ a: 1 }]));
    expect(Object.keys(vazio).sort()).toEqual(Object.keys(cheio).sort());
  });
});
