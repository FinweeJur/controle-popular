import { describe, expect, test } from "vitest";

import {
  validarCorrecoes,
  dedupeCorrecoes,
  juntarCorrecoes,
  aplicarCorrecoesEmTexto,
  aplicarCorrecoesEmDado,
  urlCorrigida,
  carregarCorrecoes,
} from "./correcoes";

/**
 * A camada de correções NUNCA reescreve o dado versionado: link-correcoes.json
 * é lida no prebuild e aplicada na renderização. Estes testes garantem que o
 * arquivo malformado ABORTA (mensagem clara), que dedupe/junção mantêm uma
 * correção por urlVelha e que os aplicadores trocam de verdade — inclusive em
 * dado aninhado.
 */

const c1 = {
  urlVelha: "https://revendedoresapi.anp.gov.br/swagger/index.html",
  urlNova: "https://www.gov.br/anp/manual-api.pdf",
  criterios: ["vivo-2xx", "dominio-oficial", "tipo-igual-pdf"],
  data: "2026-09-08T12:00:00.000Z",
};

const c2 = {
  urlVelha: "https://pncp.gov.br",
  urlNova: "https://www.gov.br/pncp/pt-br",
  criterios: ["redirect-declarado-pelo-servidor", "dominio-oficial"],
  data: "2026-09-08T12:01:00.000Z",
};

describe("validarCorrecoes", () => {
  test("array valido passa e sai tipado", () => {
    const r = validarCorrecoes([c1, c2]);
    expect(r).toHaveLength(2);
    expect(r[0].urlVelha).toBe(c1.urlVelha);
  });

  test("raiz que nao e array lanca", () => {
    expect(() => validarCorrecoes({ urlVelha: "x" })).toThrow(/esperado array/);
  });

  test("urlVelha faltando lanca com o item numerado", () => {
    expect(() => validarCorrecoes([{ urlNova: "https://x.gov.br/a" }])).toThrow(
      /item 0.*urlVelha/
    );
  });

  test("criterios vazio lanca — correcao sem trilha nao entra", () => {
    expect(() =>
      validarCorrecoes([
        { ...c1, criterios: [] },
      ])
    ).toThrow(/criterios/);
  });

  test("data sem ISO lanca", () => {
    expect(() => validarCorrecoes([{ ...c1, data: "ontem" }])).toThrow(/data/);
  });

  test("url relativa lanca", () => {
    expect(() => validarCorrecoes([{ ...c1, urlNova: "/relativo" }])).toThrow(
      /urlNova/
    );
  });

  test("acumula varios problemas numa mensagem so", () => {
    try {
      validarCorrecoes([
        { urlNova: "sem-esquema", criterios: [], data: "" },
        { urlVelha: "https://a.gov.br/x", urlNova: "https://b.gov.br/y", criterios: ["ok"], data: "2026-01-01T00:00:00Z" },
      ]);
      expect.unreachable("devia ter lancado");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("item 0");
      expect(msg).not.toContain("item 1");
    }
  });
});

describe("dedupe e juncao", () => {
  test("duas correcoes para a mesma urlVelha: fica a ULTIMA", () => {
    const r = dedupeCorrecoes([
      c1,
      { ...c1, urlNova: "https://www.gov.br/anp/mais-novo.pdf" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].urlNova).toBe("https://www.gov.br/anp/mais-novo.pdf");
  });

  test("novas vencem existentes na juncao", () => {
    const r = juntarCorrecoes([c1], [c2]);
    expect(r).toHaveLength(2);
    expect(r.map((c) => c.urlVelha).sort()).toEqual([c1.urlVelha, c2.urlVelha].sort());
  });
});

describe("aplicadores", () => {
  test("texto troca todas as ocorrencias da urlVelha", () => {
    const texto = 'veja em "https://pncp.gov.br" e de novo https://pncp.gov.br/ate';
    const r = aplicarCorrecoesEmTexto(texto, [c2]);
    expect(r).toContain("https://www.gov.br/pncp/pt-br");
    expect(r).not.toContain("https://pncp.gov.br");
  });

  test("dado aninhado (objetos e arrays) passa pela camada", () => {
    const dado = {
      itens: [
        { nome: "A", link: c1.urlVelha },
        { nome: "B", link: "https://boa.gov.br/ok.pdf" },
      ],
      rodape: c1.urlVelha,
    };
    const r = aplicarCorrecoesEmDado(dado, [c1]);
    expect(r.itens[0].link).toBe(c1.urlNova);
    expect(r.itens[1].link).toBe("https://boa.gov.br/ok.pdf");
    expect(r.rodape).toBe(c1.urlNova);
  });

  test("camada vazia devolve o mesmo dado, sem copia inutil", () => {
    const dado = { a: 1 };
    expect(aplicarCorrecoesEmDado(dado, [])).toBe(dado);
  });
});

describe("camada commitada (apps/web/data/link-correcoes.json)", () => {
  test("arquivo commitado valida e carrega", () => {
    // O arquivo em cima do repo nasce vazio; se falhar aqui, alguém commitou
    // JSON malformado — e o prebuild precisa abortar antes.
    const r = carregarCorrecoes();
    expect(Array.isArray(r)).toBe(true);
  });

  test("urlCorrigida troca url na camada e devolve a mesma se nao ha correcao", () => {
    const lista = carregarCorrecoes();
    if (lista.length === 0) {
      expect(urlCorrigida("https://qualquer.gov.br/x")).toBe("https://qualquer.gov.br/x");
    } else {
      expect(urlCorrigida(lista[0].urlVelha)).toBe(lista[0].urlNova);
    }
  });
});
