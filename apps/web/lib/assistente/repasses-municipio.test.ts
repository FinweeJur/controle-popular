/**
 * Guarda do bloco de repasses por município do chatbot.
 *
 * Papel: depois do refatorado anti-complexidade do CodeScene (15/10), este
 * teste prova que `perguntaComRepasses()`/`repassesMunicipioNaPergunta()`
 * continuam devolvendo o VALOR REAL do arquivo (ComunicaBR, coleta
 * 15/08/2026) para cidade de MG e `null`/pergunta pura fora dela — a
 * disciplina "o número vem do dado; sem dado, nenhuma promessa".
 *
 * Fonte: `public/data/comunicabr-31.json` via `lib/comunicabr/mg.ts`
 * (mesmo codec expandido que a página /dados/comunicabr usa).
 */
import { describe, expect, it } from "vitest";
import { perguntaComRepasses, repassesMunicipioNaPergunta } from "./acervo";

describe("repasses federais por município no chatbot", () => {
  it("Betim: programas com corte próprio e total medido", async () => {
    const bloco = await repassesMunicipioNaPergunta("Quanto Betim recebe de transferências federais?");
    expect(bloco).toContain("Betim/MG");
    expect(bloco).toContain("Prefeituras: R$ 306,9 mi");
    expect(bloco).toContain("Bolsa Família: R$ 132");
    expect(bloco).toContain("Total: R$ 900,8 mi");
  }, 60_000);

  it("fora dos 853 de MG: null — nenhum número prometido", async () => {
    expect(await repassesMunicipioNaPergunta("Quanto Curitiba recebe da União?")).toBeNull();
  }, 60_000);

  it("perguntaComRepasses enriquece a cidade e preserva o resto", async () => {
    expect(await perguntaComRepasses("O que é o PNCP?")).toBe("O que é o PNCP?");
    const rica = await perguntaComRepasses("Quanto Contagem recebe da União?");
    expect(rica).toContain("DADO DIRETO DO PORTAL");
    expect(rica).toContain("Contagem/MG");
  }, 60_000);
});
