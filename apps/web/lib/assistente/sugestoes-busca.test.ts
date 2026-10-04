/**
 * Teste da barra de sugestões do Seu Nonô (`sugestoes-busca.ts`).
 *
 * Trava o contrato que a tela assumiu em 03/10/2026: a barra fixa mostra
 * páginas relacionadas enquanto a pessoa digita e destaca a resposta
 * pré-curada quando existe. Sem estes casos, uma mudança no catálogo de
 * páginas ou na Regra de Escada esvaziaria a barra em silêncio — o modo de
 * falha clássico de sugestão ("nada aparece").
 */

import { describe, expect, it } from "vitest";
import { LIMITE_SUGESTOES, MINIMO_TERMO_BUSCA, montarSugestoesBuscaNono } from "./sugestoes-busca";

describe("montarSugestoesBuscaNono", () => {
  it("não sugere nada para termo curto (menos de 2 letras)", () => {
    const r = montarSugestoesBuscaNono("a");
    expect(r.curada).toBeNull();
    expect(r.paginas).toHaveLength(0);
    expect(MINIMO_TERMO_BUSCA).toBe(2);
  });

  it("sugere a página de orçamento quando a pessoa digita 'orçamento'", () => {
    const r = montarSugestoesBuscaNono("orçamento");
    const hrefs = r.paginas.map((p) => p.href);
    expect(hrefs).toContain("/estado-e-economia/orcamento");
  });

  it("é tolerante a acento e maiúscula, como a busca geral", () => {
    const comAcento = montarSugestoesBuscaNono("Orçamento");
    const semAcento = montarSugestoesBuscaNono("orcamento");
    const hrefs = (s: ReturnType<typeof montarSugestoesBuscaNono>) =>
      s.paginas.map((p) => p.href).sort();
    expect(hrefs(comAcento)).toEqual(hrefs(semAcento));
  });

  it("traz a resposta pré-curada quando o texto casa com a curadoria", () => {
    const r = montarSugestoesBuscaNono("acordo de mariana");
    expect(r.curada).not.toBeNull();
    expect(r.curada?.tipo).toBe("curada");
    expect(r.curada?.texto.length).toBeGreaterThan(0);
  });

  it("não repete href e respeita o teto da lista", () => {
    const r = montarSugestoesBuscaNono("contratos");
    const hrefs = r.paginas.map((p) => p.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.length).toBeLessThanOrEqual(LIMITE_SUGESTOES);
  });

  it("devolve lista vazia quando nada casa — vazio é resposta", () => {
    // Termo sem relação com o acervo. Cuidado com bigramas curtos: palavras da
    // lista de palavras-chave como "lo"/"li"/"lp" são substrings de muita
    // coisa (o "lo" de "xilofone" casaria Licença de Operação), então o caso
    // usa um termo que não contém nenhum deles.
    const r = montarSugestoesBuscaNono("asdkjhqwe");
    expect(r.curada).toBeNull();
    expect(r.paginas).toHaveLength(0);
  });
});
