import { describe, expect, test } from "vitest";
import type { ItemPainel } from "@/lib/betim/redeProtecao";
import { comporDocumentoDenuncia, type OpcoesDocumento } from "./compor";
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

const ITEM_COM_NOTA: ItemPainel = {
  id: "rede-deam-bh",
  tipo: "ajuda",
  nome: "DEAM — Delegacia da Mulher (Belo Horizonte)",
  oQueAtende: "Registro de ocorrência em violência contra a mulher.",
  necessidades: ["violencia_mulher"],
  abrangencia: "municipal",
  natureza: "oficial",
  site: "https://www.mg.gov.br/",
  endereco: "Rua Rio Grande do Sul, 661, Barro Preto, Belo Horizonte/MG",
  gratuito: true,
  verificadoEm: "2026-08-13",
  nota: "Fora de BH, use a busca oficial da PCMG.",
};

function respostas(overrides: Partial<RespostasDenuncia> = {}): RespostasDenuncia {
  return { ...respostasVazias(), ...overrides };
}

/** `cidadeCadastrada: true` por padrão — os testes que não são sobre a Fase 3
 * (lacuna municipal) não precisam pensar nisso; quem testa a lacuna passa
 * `false` explicitamente. */
function opcoes(overrides: Partial<OpcoesDocumento> = {}): OpcoesDocumento {
  return { cidadeNome: null, itensSugeridos: [], cidadeCadastrada: true, ...overrides };
}

function textoCompleto(blocos: { texto: string }[]): string {
  return blocos.map((b) => b.texto).join("\n");
}

describe("comporDocumentoDenuncia", () => {
  test("respostas totalmente vazias não quebram e marcam tudo como não informado", () => {
    const doc = comporDocumentoDenuncia(respostas(), {
      ...opcoes(),
      data: new Date("2026-08-13T10:00:00Z"),
    });
    const texto = textoCompleto(doc.blocos);
    expect(texto).toMatch(/Não informado\./);
    expect(texto).not.toMatch(/undefined/);
    expect(doc.titulo).toBe("Registro de violação de direitos humanos");
  });

  test("aviso de urgência aparece quando a violação continua, e só nesse caso", () => {
    const comUrgencia = comporDocumentoDenuncia(respostas({ continua: "sim" }), {
      ...opcoes(),
      data: new Date("2026-08-13T10:00:00Z"),
    });
    expect(textoCompleto(comUrgencia.blocos)).toMatch(/190/);

    const semUrgencia = comporDocumentoDenuncia(respostas({ continua: "nao" }), {
      ...opcoes(),
      data: new Date("2026-08-13T10:00:00Z"),
    });
    expect(textoCompleto(semUrgencia.blocos)).not.toMatch(/190/);
  });

  test("o relato da pessoa aparece verbatim, sem reescrita", () => {
    const relato = "O fiscal ameaçou derrubar minha barraca sem aviso, na frente de todo mundo.";
    const doc = comporDocumentoDenuncia(respostas({ relato }), opcoes());
    expect(textoCompleto(doc.blocos)).toContain(relato);
  });

  test("item sugerido entra com nome, o que atende e contato — não reescrito de memória", () => {
    const doc = comporDocumentoDenuncia(respostas(), {
      ...opcoes({ cidadeNome: "Betim/MG", itensSugeridos: [ITEM_EXEMPLO] }),
    });
    const texto = textoCompleto(doc.blocos);
    expect(texto).toContain(ITEM_EXEMPLO.nome);
    expect(texto).toContain(ITEM_EXEMPLO.oQueAtende);
    expect(texto).toContain(ITEM_EXEMPLO.endereco!);
  });

  test("aviso de agente do Estado aparece quando marcado como violador", () => {
    const doc = comporDocumentoDenuncia(respostas({ violadores: ["agente_estado"] }), opcoes());
    expect(textoCompleto(doc.blocos)).toMatch(/não é caso para resolver sozinho/i);
  });

  test("aviso de \"não é aconselhamento jurídico\" e nota da CIDH sempre aparecem", () => {
    const doc = comporDocumentoDenuncia(respostas(), opcoes());
    const texto = textoCompleto(doc.blocos);
    expect(texto).toMatch(/não protocola nada/i);
    expect(texto).toMatch(/Comissão Interamericana/);
  });

  test("nome de quem denuncia é opcional — documento continua válido sem ele", () => {
    const doc = comporDocumentoDenuncia(respostas({ nomeDenunciante: "" }), opcoes());
    expect(textoCompleto(doc.blocos)).toMatch(/Não identificado\./);
  });

  // ═══════════════════════ Fase 3 — lacuna municipal ═══════════════════════

  test("cidade não cadastrada: documento avisa que não há canal municipal catalogado", () => {
    const doc = comporDocumentoDenuncia(respostas(), opcoes({ cidadeCadastrada: false }));
    expect(textoCompleto(doc.blocos)).toMatch(/Nenhum canal municipal.*catalogado/i);
  });

  test("cidade cadastrada: documento NÃO leva o aviso de lacuna municipal", () => {
    const doc = comporDocumentoDenuncia(respostas(), opcoes({ cidadeCadastrada: true }));
    expect(textoCompleto(doc.blocos)).not.toMatch(/Nenhum canal municipal/i);
  });

  test("nota de um item (ex.: ressalva de fora-de-BH) entra junto do item, não é silenciada", () => {
    const doc = comporDocumentoDenuncia(
      respostas(),
      opcoes({ cidadeNome: "Betim/MG", itensSugeridos: [ITEM_COM_NOTA] })
    );
    expect(textoCompleto(doc.blocos)).toContain(ITEM_COM_NOTA.nota);
  });
});
