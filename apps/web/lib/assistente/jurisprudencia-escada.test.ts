/**
 * @file jurisprudencia-escada.test.ts
 * @description Teste do degrau de contagem da jurisprudência.
 *
 * O risco que este teste cobre é o número silenciosamente errado: o cartão do
 * assistente afirma "203 casos" e manda a pessoa para uma lista. Se a conta, o
 * filtro do link ou a tabela compacta divergirem do acervo, o portal publica
 * um número que a própria página não sustenta — o dano que a regra editorial
 * do projeto mais teme.
 *
 * Por isso NADA é cravado aqui: os esperados saem de `ACERVO_JURISPRUDENCIA`
 * a cada execução. A única constante que o teste fixa é a REGRA (igualdade de
 * tema sem acento e sem caixa), que é a mesma do filtro `tema` da página.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import contagensJson from "./jurisprudencia-contagens.json";
import {
  medirContagens,
  responderJurisprudencia,
  interpretarPerguntaJurisprudencial,
  type ArquivoContagens,
} from "./jurisprudencia-escada";
import { avaliarEscadaDeterminista } from "./escada-determinista";
import { ACERVO_JURISPRUDENCIA } from "../jurisprudencia-acervo";
import type { CasoJurisprudencia } from "../jurisprudencia";

const RAIZ_APP = fileURLToPath(new URL("../..", import.meta.url));

function chave(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Recorte independente do módulo: a régua do filtro `tema` da página. */
function recorte(frente: string, tema?: string): CasoJurisprudencia[] {
  return ACERVO_JURISPRUDENCIA.casos.filter(
    (caso) =>
      caso.frente === frente &&
      (!tema || caso.temas.some((rotulo) => chave(rotulo) === chave(tema)))
  );
}

function contarPor(casos: CasoJurisprudencia[], campo: "polo" | "resultado"): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const caso of casos) {
    const valor = chave(caso[campo] ?? "") || (campo === "polo" ? "indeterminado" : "nao consta");
    mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
  }
  return mapa;
}

describe("interpretarPerguntaJurisprudencial", () => {
  it("reconhece a pergunta de contagem com desastre e tema", () => {
    const interpretacao = interpretarPerguntaJurisprudencial(
      "Quantos casos favoráveis a dano moral aos atingidos do Rio Doce?"
    );
    expect(interpretacao).not.toBeNull();
    expect(interpretacao?.frente).toBe("riodoce");
    expect(interpretacao?.tema).toBe("dano moral");
    expect(interpretacao?.querContagem).toBe(true);
  });

  it("reconhece os nomes dos desastres e a frente penal", () => {
    const casos: [string, string][] = [
      ["quantos casos de Mariana", "riodoce"],
      ["quantos casos do Fundão", "riodoce"],
      ["quantos casos de Brumadinho", "brumadinho"],
      ["quantos casos de Itatiaiaçu", "itatiaiaucu"],
      ["quantos casos de direitos humanos", "dh"],
      ["quantos casos penais", "penal"],
    ];
    for (const [pergunta, frente] of casos) {
      expect(interpretarPerguntaJurisprudencial(pergunta)?.frente, pergunta).toBe(frente);
    }
  });

  it("não reconhece pergunta sem sinal de contagem", () => {
    expect(interpretarPerguntaJurisprudencial("me fala de dano moral no Rio Doce")).toBeNull();
    expect(interpretarPerguntaJurisprudencial("o que é dano moral")).toBeNull();
  });

  it("não reconhece pergunta de contagem sem desastre", () => {
    expect(interpretarPerguntaJurisprudencial("quantos casos de dano moral")).toBeNull();
    expect(interpretarPerguntaJurisprudencial("quantos vereadores Betim tem")).toBeNull();
  });
});

describe("responderJurisprudencia", () => {
  it("conta os casos de dano moral no Rio Doce e mostra as duas leituras", () => {
    const esperados = recorte("riodoce", "dano moral");
    const porPolo = contarPor(esperados, "polo");
    const porResultado = contarPor(esperados, "resultado");

    const resposta = responderJurisprudencia(
      "Quantos casos favoráveis a dano moral aos atingidos do Rio Doce?"
    );
    expect(resposta).not.toBeNull();
    expect(resposta?.frente).toBe("riodoce");
    expect(resposta?.tema).toBe("dano moral");
    expect(resposta?.total).toBe(esperados.length);

    // As duas leituras de "favorável aos atingidos": polo vencedor ou resultado.
    expect(resposta?.porPolo.atingido).toBe(porPolo.get("atingido") ?? 0);
    expect(resposta?.porResultado.provido).toBe(porResultado.get("provido") ?? 0);
    expect(resposta?.texto).toContain(`${porPolo.get("atingido") ?? 0} casos têm o atingido como polo vencedor`);
    expect(resposta?.texto).toContain(`${porResultado.get("provido") ?? 0} têm resultado provido`);

    // O texto tem de dizer de onde vem o número, a data e o que é polo vencedor.
    expect(resposta?.texto).toMatch(/acervo de jurisprudência do portal/i);
    expect(resposta?.texto).toContain(resposta!.geradoEm.slice(8, 10) + "/" + resposta!.geradoEm.slice(5, 7) + "/" + resposta!.geradoEm.slice(0, 4));
    expect(resposta?.texto).toMatch(/polo vencedor é quem ganhou a decisão, não quem processou/i);
  });

  it("conta a frente inteira de Brumadinho com o total do acervo", () => {
    const total = ACERVO_JURISPRUDENCIA.casos.filter((caso) => caso.frente === "brumadinho").length;

    const resposta = responderJurisprudencia("quantos casos de Brumadinho");
    expect(resposta).not.toBeNull();
    expect(resposta?.frente).toBe("brumadinho");
    expect(resposta?.tema).toBeUndefined();
    expect(resposta?.total).toBe(total);
    expect(resposta?.link).toBe("/jurisprudencia?frente=brumadinho#lista");
  });

  it("devolve null quando a pergunta não é de contagem ou não tem desastre", () => {
    expect(responderJurisprudencia("me fala de dano moral no Rio Doce")).toBeNull();
    expect(responderJurisprudencia("quantos casos de dano moral")).toBeNull();
  });

  it("o link gerado aponta para rota que existe", () => {
    const resposta = responderJurisprudencia(
      "Quantos casos favoráveis a dano moral aos atingidos do Rio Doce?"
    );
    expect(resposta?.link.startsWith("/jurisprudencia?frente=riodoce")).toBe(true);
    expect(resposta?.link).toContain("tema=dano%20moral");
    expect(existsSync(path.join(RAIZ_APP, "app", "jurisprudencia", "page.tsx"))).toBe(true);

    // Penal tem página própria: `frente=penal` em /jurisprudencia lista zero.
    const penal = responderJurisprudencia("quantos casos penais");
    expect(penal?.link).toBe("/jurisprudencia/penal");
    expect(existsSync(path.join(RAIZ_APP, "app", "jurisprudencia", "penal", "page.tsx"))).toBe(true);
  });
});

describe("tabela compacta publicada", () => {
  const publicada = contagensJson as unknown as ArquivoContagens;

  it("bate com a medição do acervo (derruba número velho)", () => {
    expect(publicada.geradoEm).toBe(ACERVO_JURISPRUDENCIA.geradoEm);
    expect(publicada.frentes).toEqual(medirContagens(ACERVO_JURISPRUDENCIA.casos));
  });

  it("tem o total de cada frente igual ao acervo", () => {
    for (const [frente, contagem] of Object.entries(publicada.frentes)) {
      const noAcervo = ACERVO_JURISPRUDENCIA.casos.filter((caso) => caso.frente === frente).length;
      expect(contagem.total, frente).toBe(noAcervo);
    }
  });
});

describe("degrau da escada", () => {
  it("devolve cartão de ferramenta com título da frente e link da lista", () => {
    const resposta = avaliarEscadaDeterminista("quantos casos de Brumadinho");
    expect(resposta?.tipo).toBe("ferramenta");
    expect(resposta?.titulo).toBe("Jurisprudência: Brumadinho");
    expect(resposta?.atalhos.some((atalho) => atalho.href.includes("/jurisprudencia?frente=brumadinho"))).toBe(true);
    expect(resposta?.texto).toMatch(/polo vencedor/i);
  });
});
