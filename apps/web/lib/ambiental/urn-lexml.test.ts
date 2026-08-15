import { describe, expect, it } from "vitest";
import {
  linkCanonicoDaNorma,
  normaResolveu,
  normalizarNumero,
  normalizarTipo,
  RESOLVEDOR_NORMAS_LEG_BR,
  urlApiNormasLegBr,
  urnLexmlDaNorma,
} from "./urn-lexml";
import type { NormaParaUrn } from "./urn-lexml";

/**
 * O peso desta suíte está nos casos em que a URN NÃO pode ser montada — é
 * onde mora o defeito que o leitor veria: um link canônico bem-formado que
 * abre uma página sem norma nenhuma. O caminho feliz é uma linha; a recusa
 * tem quatro motivos e cada um deles é uma fatia grande do acervo real.
 *
 * Os dados dos casos positivos são normas REAIS do acervo
 * (`etl/betim/dados/legislacao-mma.json`), conferidas contra o portal em
 * 2026-08-15 — ver `docs/URN-LEXML-NORMAS-LEG-BR.md`. Não são exemplos
 * inventados que casam com a implementação.
 */

function norma(overrides: Partial<NormaParaUrn> = {}): NormaParaUrn {
  return {
    esfera: "nacional",
    tipo: "LEI",
    numero: "9605",
    data: "1998-02-12",
    ...overrides,
  };
}

describe("urnLexmlDaNorma — os formatos por tipo (esfera nacional)", () => {
  it("lei: o formato de referência, o mesmo que o portal publica", () => {
    expect(urnLexmlDaNorma(norma())).toBe("urn:lex:br:federal:lei:1998-02-12;9605");
  });

  it("decreto usa 'decreto', NUNCA 'decreto.numerado'", () => {
    // Medido nos dois formatos com a mesma norma: só este resolve.
    expect(urnLexmlDaNorma(norma({ tipo: "DECRETO", numero: "47446", data: "1959-12-17" }))).toBe(
      "urn:lex:br:federal:decreto:1959-12-17;47446"
    );
  });

  it("decreto-lei vira 'decreto.lei' (ponto, não hífen, no código da URN)", () => {
    expect(urnLexmlDaNorma(norma({ tipo: "DECRETO-LEI", numero: "25", data: "1937-11-30" }))).toBe(
      "urn:lex:br:federal:decreto.lei:1937-11-30;25"
    );
  });

  it("medida provisória: o acento do acervo não entra na URN", () => {
    expect(
      urnLexmlDaNorma(norma({ tipo: "MEDIDA PROVISÓRIA", numero: "1276", data: "2024-11-22" }))
    ).toBe("urn:lex:br:federal:medida.provisoria:2024-11-22;1276");
  });

  it("o tipo é lido sem depender de caixa nem de acento — as fontes divergem", () => {
    // "PORTARIA IBAMA" e "Portaria IBAMA" convivem no acervo do MMA; o mesmo
    // vale para os tipos que entram.
    expect(urnLexmlDaNorma(norma({ tipo: "Lei" }))).toBe("urn:lex:br:federal:lei:1998-02-12;9605");
    expect(urnLexmlDaNorma(norma({ tipo: "  lei  " }))).toBe("urn:lex:br:federal:lei:1998-02-12;9605");
  });

  it("'DECRETO LEI' sem hífen é o mesmo tipo que 'DECRETO-LEI'", () => {
    expect(urnLexmlDaNorma(norma({ tipo: "DECRETO LEI", numero: "25", data: "1937-11-30" }))).toBe(
      "urn:lex:br:federal:decreto.lei:1937-11-30;25"
    );
  });

  it("número com separador de milhar e zero à esquerda normaliza igual ao ETL", () => {
    expect(urnLexmlDaNorma(norma({ tipo: "DECRETO-LEI", numero: "1.035", data: "1939-01-10" }))).toBe(
      "urn:lex:br:federal:decreto.lei:1939-01-10;1035"
    );
    expect(urnLexmlDaNorma(norma({ numero: "09605" }))).toBe("urn:lex:br:federal:lei:1998-02-12;9605");
  });
});

describe("urnLexmlDaNorma — quando NÃO dá para montar (devolve null)", () => {
  it("esfera estadual: o portal é federal, a URN de MG não resolve", () => {
    // Lei nº 26.040/2026 de Minas, dado real da API da ALMG. A URN
    // `urn:lex:br;minas.gerais:estadual:lei:2026-08-06;26040` é bem-formada
    // e mesmo assim o portal não a conhece — publicá-la seria link morto.
    expect(
      urnLexmlDaNorma({ esfera: "estadual", tipo: "LEI", numero: "26040", data: "2026-08-06" })
    ).toBeNull();
  });

  it("esfera municipal e internacional também são null — nenhuma foi medida resolvendo", () => {
    expect(urnLexmlDaNorma(norma({ esfera: "municipal" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ esfera: "internacional" }))).toBeNull();
  });

  it("portaria: o vocabulário do portal não tem o tipo — 5.595 normas do acervo", () => {
    expect(
      urnLexmlDaNorma(norma({ tipo: "PORTARIA IBAMA", numero: "349", data: "1990-03-14" }))
    ).toBeNull();
    expect(urnLexmlDaNorma(norma({ tipo: "PORTARIA ICMBIO" }))).toBeNull();
  });

  it("resolução Conama e recomendação do CNDH: mesmo motivo, tipo inexistente lá", () => {
    expect(
      urnLexmlDaNorma(norma({ tipo: "RESOLUÇÃO CONAMA", numero: "237", data: "1997-12-19" }))
    ).toBeNull();
    expect(urnLexmlDaNorma(norma({ tipo: "Recomendação", numero: "1", data: "2019-02-19" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ tipo: "INSTRUÇÃO NORMATIVA IBAMA" }))).toBeNull();
  });

  it("tipo vazio ou nulo não vira URN", () => {
    expect(urnLexmlDaNorma(norma({ tipo: "" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ tipo: null as unknown as string }))).toBeNull();
  });

  it("sem data: 855 normas do MMA e 33 do CNDH não têm data completa", () => {
    expect(urnLexmlDaNorma(norma({ data: null }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ data: "" }))).toBeNull();
  });

  it("data incompleta NÃO é completada com 1º de janeiro", () => {
    // Inventar o dia produziria uma URN que aponta para outro ato (ou para
    // nenhum) com cara de certeza — o oposto do que a URN serve.
    expect(urnLexmlDaNorma(norma({ data: "1998" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ data: "1998-02" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ data: "12/02/1998" }))).toBeNull();
  });

  it("data que não existe no calendário é recusada", () => {
    expect(urnLexmlDaNorma(norma({ data: "1998-02-31" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ data: "1998-13-01" }))).toBeNull();
  });

  it("sem número em dígitos: 'S/N' e nulo não viram ';' vazio", () => {
    expect(urnLexmlDaNorma(norma({ numero: null }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ numero: "S/N" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ numero: "0" }))).toBeNull();
    expect(urnLexmlDaNorma(norma({ numero: "" }))).toBeNull();
  });
});

describe("linkCanonicoDaNorma — o que a tela receberia", () => {
  it("norma que resolve vira link do resolvedor público", () => {
    expect(linkCanonicoDaNorma(norma())).toBe(
      `${RESOLVEDOR_NORMAS_LEG_BR}urn:lex:br:federal:lei:1998-02-12;9605`
    );
  });

  it("norma sem URN devolve null — a tela não tem link para mostrar", () => {
    // O contrato que impede link quebrado: quem chama testa `null`, não
    // recebe string vazia nem a raiz do portal.
    expect(linkCanonicoDaNorma(norma({ esfera: "estadual" }))).toBeNull();
    expect(linkCanonicoDaNorma(norma({ tipo: "PORTARIA MMA" }))).toBeNull();
  });
});

describe("normaResolveu — por que status 200 não serve de prova", () => {
  it("o eco da URN (200 do portal para norma inexistente) NÃO é resolução", () => {
    // Corpo real medido em 2026-08-15 para uma lei que não existe.
    expect(normaResolveu({ urn: "urn:lex:br:federal:lei:1998-02-12;9999999" })).toBe(false);
  });

  it("resolve quando o corpo traz `legislationIdentifier`", () => {
    expect(
      normaResolveu({
        "@type": "Legislation",
        legislationIdentifier: "urn:lex:br:federal:lei:1998-02-12;9605",
        name: "Lei nº 9.605 de 12/02/1998",
      })
    ).toBe(true);
  });

  it("corpo vazio, nulo ou não-objeto não resolve", () => {
    expect(normaResolveu(null)).toBe(false);
    expect(normaResolveu(undefined)).toBe(false);
    expect(normaResolveu({})).toBe(false);
    expect(normaResolveu("Lei nº 9.605")).toBe(false);
    expect(normaResolveu({ legislationIdentifier: "" })).toBe(false);
  });
});

describe("urlApiNormasLegBr — a forma exata que a API aceita", () => {
  it("mantém a URN crua e o parâmetro obrigatório", () => {
    // Sem `tipo_documento` a API devolve 400 até para norma existente, e
    // percent-encodar `:`/`;` também dá 400 — os dois medidos.
    expect(urlApiNormasLegBr("urn:lex:br:federal:lei:1998-02-12;9605")).toBe(
      "https://normas.leg.br/api/public/normas?urn=urn:lex:br:federal:lei:1998-02-12;9605&&tipo_documento=maior-detalhe"
    );
  });
});

describe("normalizadores", () => {
  it("normalizarTipo tira acento e caixa, e junta espaço", () => {
    expect(normalizarTipo("Medida  Provisória")).toBe("MEDIDA PROVISORIA");
    expect(normalizarTipo("resolução conama")).toBe("RESOLUCAO CONAMA");
    expect(normalizarTipo(null)).toBe("");
  });

  it("normalizarNumero devolve dígitos sem zero à esquerda, ou null", () => {
    expect(normalizarNumero("1.035")).toBe("1035");
    expect(normalizarNumero("007")).toBe("7");
    expect(normalizarNumero("nº 62/1995")).toBe("621995"); // junta tudo: é por isso que
    // o acervo grava o número num campo só, e o chamador não passa texto livre aqui.
    expect(normalizarNumero("S/N")).toBeNull();
    expect(normalizarNumero(null)).toBeNull();
  });
});
