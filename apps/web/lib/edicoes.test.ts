import { describe, it, expect } from "vitest";
import { aplicarEdicao } from "./edicoes";

/**
 * A garantia que importa aqui é a NEGATIVA: sem arquivo de edições, o site
 * publica exatamente o que o código gera. Todo o resto do repo depende disso —
 * se a sobreposição alterasse texto por conta própria, os números que as
 * descrições carregam (contagens reais, vindas do banco) passariam a mentir
 * sem que nada no código mudasse.
 */
describe("aplicarEdicao", () => {
  const base = { title: "Saúde — Betim", description: "1.234 estabelecimentos." };

  it("devolve o texto do código quando não há edição para a rota", () => {
    expect(aplicarEdicao("/betim/saude", base)).toEqual(base);
  });

  it("não confunde rotas parecidas", () => {
    expect(aplicarEdicao("/betim/saude/detalhe", base)).toEqual(base);
    expect(aplicarEdicao("/bh/saude", base)).toEqual(base);
  });

  it("aceita rota com e sem barra sem tratá-las como páginas diferentes", () => {
    // Se "/betim/saude" e "/betim/saude/" fossem chaves distintas, uma edição
    // gravada com barra final ficaria invisível para a página — e o autor veria
    // "salvo com sucesso" seguido de nenhuma mudança no site.
    expect(aplicarEdicao("/betim/saude/", base)).toEqual(aplicarEdicao("/betim/saude", base));
    expect(aplicarEdicao("betim/saude", base)).toEqual(aplicarEdicao("/betim/saude", base));
  });
});
