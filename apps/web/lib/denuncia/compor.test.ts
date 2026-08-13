import { describe, expect, test } from "vitest";
import type { ItemPainel } from "@/lib/betim/redeProtecao";
import { comporDocumentoDenuncia } from "./compor";
import { respostasVazias, type RespostasDenuncia } from "./tipos";

/**
 * Montagem do texto do documento — lógica pura, mesmo tipo de teste que
 * `lib/congresso/oficio/compor.ts` teria (ver `render-binario.ts` para o
 * porquê de a geração de bytes do DOCX não ser testada aqui: ela só roda no
 * navegador e depende de `docx`). O que importa provar: o documento nunca
 * inventa dado que a pessoa não informou, o aviso de urgência aparece
 * exatamente quando devia, e nenhuma resposta vazia quebra a montagem —
 * porque é exatamente sob estresse, respondendo rápido e pulando campo, que
 * a pessoa vai usar isto.
 */

const ITEM_EXEMPLO: ItemPainel = {
  id: "rede-defensoria-mg",
  tipo: "ajuda",
  nome: "Defensoria Pública de Minas Gerais",
  oQueAtende: "Representa de graça na Justiça quem não tem dinheiro para advogado.",
  necessidades: ["defesa_gratuita"],
  abrangencia: "estadual",
  natureza: "oficial",
  site: "https://defensoria.mg.def.br/",
  endereco: "Rua dos Guajajaras, 1707 — Belo Horizonte/MG",
  gratuito: true,
  verificadoEm: "2026-08-13",
};

function respostas(overrides: Partial<RespostasDenuncia> = {}): RespostasDenuncia {
  return { ...respostasVazias(), ...overrides };
}

function textoCompleto(blocos: { texto: string }[]): string {
  return blocos.map((b) => b.texto).join("\n");
}

describe("comporDocumentoDenuncia", () => {
  test("respostas totalmente vazias não quebram e marcam tudo como não informado", () => {
    const doc = comporDocumentoDenuncia(respostas(), {
      cidadeNome: null,
      itensSugeridos: [],
      data: new Date("2026-08-13T10:00:00Z"),
    });
    const texto = textoCompleto(doc.blocos);
    expect(texto).toMatch(/Não informado\./);
    expect(texto).not.toMatch(/undefined/);
    expect(doc.titulo).toBe("Registro de violação de direitos humanos");
  });

  test("aviso de urgência aparece quando a violação continua, e só nesse caso", () => {
    const comUrgencia = comporDocumentoDenuncia(respostas({ continua: "sim" }), {
      cidadeNome: null,
      itensSugeridos: [],
      data: new Date("2026-08-13T10:00:00Z"),
    });
    expect(textoCompleto(comUrgencia.blocos)).toMatch(/190/);

    const semUrgencia = comporDocumentoDenuncia(respostas({ continua: "nao" }), {
      cidadeNome: null,
      itensSugeridos: [],
      data: new Date("2026-08-13T10:00:00Z"),
    });
    expect(textoCompleto(semUrgencia.blocos)).not.toMatch(/190/);
  });

  test("o relato da pessoa aparece verbatim, sem reescrita", () => {
    const relato = "O fiscal ameaçou derrubar minha barraca sem aviso, na frente de todo mundo.";
    const doc = comporDocumentoDenuncia(respostas({ relato }), {
      cidadeNome: null,
      itensSugeridos: [],
    });
    expect(textoCompleto(doc.blocos)).toContain(relato);
  });

  test("item sugerido entra com nome, o que atende e contato — não reescrito de memória", () => {
    const doc = comporDocumentoDenuncia(respostas(), {
      cidadeNome: "Betim/MG",
      itensSugeridos: [ITEM_EXEMPLO],
    });
    const texto = textoCompleto(doc.blocos);
    expect(texto).toContain(ITEM_EXEMPLO.nome);
    expect(texto).toContain(ITEM_EXEMPLO.oQueAtende);
    expect(texto).toContain(ITEM_EXEMPLO.endereco!);
  });

  test("aviso de agente do Estado aparece quando marcado como violador", () => {
    const doc = comporDocumentoDenuncia(respostas({ violadores: ["agente_estado"] }), {
      cidadeNome: null,
      itensSugeridos: [],
    });
    expect(textoCompleto(doc.blocos)).toMatch(/não é caso para resolver sozinho/i);
  });

  test("aviso de \"não é aconselhamento jurídico\" e nota da CIDH sempre aparecem", () => {
    const doc = comporDocumentoDenuncia(respostas(), { cidadeNome: null, itensSugeridos: [] });
    const texto = textoCompleto(doc.blocos);
    expect(texto).toMatch(/não protocola nada/i);
    expect(texto).toMatch(/Comissão Interamericana/);
  });

  test("nome de quem denuncia é opcional — documento continua válido sem ele", () => {
    const doc = comporDocumentoDenuncia(respostas({ nomeDenunciante: "" }), {
      cidadeNome: null,
      itensSugeridos: [],
    });
    expect(textoCompleto(doc.blocos)).toMatch(/Não identificado\./);
  });
});
