import { describe, it, expect, beforeAll } from "vitest";
import { GOLDEN_SET } from "./golden-set";

/**
 * Teste do golden set do Seu Nonô (fase R4 do PLANO-RAG-COMPLETO).
 *
 * Roda a recuperação real sobre o acervo, em modo SÓ-LEXICAL (sem
 * embeddings), que é o modo determinístico do CI. Garante duas invariantes:
 * 1. pergunta dentro do escopo recupera a fonte certa no top-5;
 * 2. pergunta fora do escopo ABSTÉM — o assistente não responde bolo de
 *    cenoura com o orçamento do Judiciário.
 *
 * O modo é forçado com `EMBED_API_KEY` vazio e um `OLLAMA_BASE_URL`
 * inalcançável, antes do import dinâmico do `rag` (que lê a env no topo do
 * módulo). Ver `golden-set.ts` para o porquê de cada caso.
 */

type Buscar = typeof import("./embeddings/rag").buscarNoAcervo;
let buscar: Buscar;

describe("golden set do Seu Nonô — recuperação e abstenção (modo lexical)", () => {
  beforeAll(async () => {
    process.env.EMBED_API_KEY = "";
    delete process.env.EMBED_BASE_URL;
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:1";
    const rag = await import("./embeddings/rag");
    buscar = rag.buscarNoAcervo;
    rag.esquecerIndiceAcervo();
  });

  for (const caso of GOLDEN_SET) {
    it(`${caso.esperado.tipo === "abster" ? "[abster] " : "[fonte] "}${caso.pergunta}`, async () => {
      const { melhores, abstem } = await buscar(caso.pergunta, 5);

      if (caso.esperado.tipo === "abster") {
        expect(
          abstem,
          `deveria abster, mas casou ${melhores[0]?.fonte.id} (${melhores[0]?.score.toFixed(3)})`
        ).toBe(true);
        return;
      }

      expect(abstem, `não deveria abster (top=${melhores[0]?.fonte.id})`).toBe(false);
      const ids = melhores.map((m) => m.fonte.id);
      const casouId = (caso.esperado.ids ?? []).some((id) => ids.includes(id));
      const casouRota = (caso.esperado.rotas ?? []).some((r) =>
        melhores.some((m) => m.fonte.rota === r)
      );
      expect(
        casouId || casouRota,
        `esperado ${[...(caso.esperado.ids ?? []), ...(caso.esperado.rotas ?? [])].join(" | ")}; veio ${ids.join(", ")}`
      ).toBe(true);
    });
  }
});
