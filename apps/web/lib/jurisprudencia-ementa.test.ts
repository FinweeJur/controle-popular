import { describe, expect, it } from "vitest";
import { analisarEmenta, LIMITE_FONTE_MAX, LIMITE_FONTE_MIN, LIMITE_GERADOR } from "./jurisprudencia-ementa";

/**
 * O risco que este teste tranca: deixar um trecho de 500 caracteres passar
 * como "Ementa:" inteira. O leitor do portal lê o fim da frase no meio e
 * acredita que o acórdão termina ali — foi o chamado do processo
 * 0032284-30.2018.8.13 (TJMG), com 500 caracteres e "…" no fim.
 *
 * O outro risco é o oposto: marcar como trecho uma ementa completa que só
 * tem 500 caracteres e termina em ponto. Há 5 casos assim no acervo.
 */

/** Texto de tamanho exato, sem pontuação final — simula o corte da fonte. */
const semPontuacao = (tamanho: number): string => "a".repeat(tamanho);
/** Texto de tamanho exato, terminando em ponto — ementa completa. */
const comPonto = (tamanho: number): string => `${"a".repeat(tamanho - 1)}.`;

describe("analisarEmenta", () => {
  it("marca o recorte de 500 caracteres com reticências como trecho", () => {
    const ementa = `${"a".repeat(499)}…`;
    expect(analisarEmenta(ementa)).toEqual({
      texto: ementa,
      truncada: true,
      caracteres: 500,
      motivo: "reticencias",
    });
  });

  it("reconhece o exemplo real do TJMG (500 caracteres, '…' no fim)", () => {
    const comeco = "CURSOS DESPROVIDOS. I. CASO EM EXAME 1. Apelação cível prin";
    const ementa = `${comeco}${"a".repeat(499 - comeco.length)}…`;
    const analise = analisarEmenta(ementa);
    expect(analise.truncada).toBe(true);
    expect(analise.motivo).toBe("reticencias");
    expect(analise.caracteres).toBe(500);
  });

  it("reconhece reticências em três pontos (ASCII)", () => {
    const ementa = `${"a".repeat(497)}...`;
    expect(analisarEmenta(ementa)).toMatchObject({
      truncada: true,
      caracteres: 500,
      motivo: "reticencias",
    });
  });

  it("marca como limite da fonte o texto de ~500 caracteres sem pontuação final", () => {
    const ementa = semPontuacao(500);
    expect(analisarEmenta(ementa)).toEqual({
      texto: ementa,
      truncada: true,
      caracteres: 500,
      motivo: "limite-fonte",
    });
    // Borda inferior e superior da faixa também contam.
    expect(analisarEmenta(semPontuacao(LIMITE_FONTE_MIN)).motivo).toBe("limite-fonte");
    expect(analisarEmenta(semPontuacao(LIMITE_FONTE_MAX)).motivo).toBe("limite-fonte");
  });

  it("marca o teto de 12.000 caracteres como limite do gerador", () => {
    const ementa = semPontuacao(LIMITE_GERADOR);
    expect(analisarEmenta(ementa)).toEqual({
      texto: ementa,
      truncada: true,
      caracteres: LIMITE_GERADOR,
      motivo: "limite-gerador",
    });
  });

  it("não marca ementa completa curta", () => {
    const ementa = "Recurso conhecido e não provido. Dano moral não configurado.";
    expect(analisarEmenta(ementa)).toEqual({
      texto: ementa,
      truncada: false,
      caracteres: ementa.length,
      motivo: null,
    });
  });

  it("não marca ementa completa de 500 caracteres terminada em ponto", () => {
    // Casos reais: 5007405-83.2020.8.13 e 0033948-32.2018.8.08.0024.
    const analise = analisarEmenta(comPonto(500));
    expect(analise.truncada).toBe(false);
    expect(analise.motivo).toBeNull();
  });

  it("não marca súmula completa terminada em parêntese de remissão", () => {
    // Súmulas 98, 132, 390 e 411 do TST medem 483–518 caracteres e terminam
    // em "(ex-OJ nº … - DJ …)" — completas, não são corte da fonte.
    const ementa = `${"a".repeat(470)} (ex-OJ nº 299 da SBDI-I - DJ 11.08.2003)`;
    const analise = analisarEmenta(ementa);
    expect(analise.caracteres).toBeGreaterThanOrEqual(LIMITE_FONTE_MIN);
    expect(analise.caracteres).toBeLessThanOrEqual(LIMITE_FONTE_MAX);
    expect(analise.truncada).toBe(false);
    expect(analise.motivo).toBeNull();
  });

  it("não confunde reticências no meio do texto com corte no fim", () => {
    const ementa =
      "O acórdão cita o art. 5º... e conclui que o recurso não provido, mantendo a sentença.";
    expect(analisarEmenta(ementa)).toMatchObject({ truncada: false, motivo: null });
  });

  it("tolera aspas de fechamento depois das reticências", () => {
    expect(analisarEmenta(`${"a".repeat(497)}…”`)).toMatchObject({
      truncada: true,
      motivo: "reticencias",
    });
  });

  it("ignora espaços nas pontas ao medir", () => {
    const analise = analisarEmenta(`   ${"a".repeat(500)}   `);
    expect(analise.caracteres).toBe(500);
    expect(analise.truncada).toBe(true);
  });

  it("devolve texto vazio sem corte para ementa ausente", () => {
    expect(analisarEmenta("")).toEqual({ texto: "", truncada: false, caracteres: 0, motivo: null });
    expect(analisarEmenta(null)).toEqual({ texto: "", truncada: false, caracteres: 0, motivo: null });
    expect(analisarEmenta(undefined)).toEqual({
      texto: "",
      truncada: false,
      caracteres: 0,
      motivo: null,
    });
  });
});
