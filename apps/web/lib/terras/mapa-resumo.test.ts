import { describe, expect, test } from "vitest";
import { carregarResumoMapaEstadual } from "./mapa-resumo";

/**
 * Números medidos em 13/08 nas camadas publicadas — mesmo padrão de
 * `alertas.test.ts`: se a contagem mudar (camada reprocessada, ANM
 * atualizada), este teste quebra de propósito para o hub não continuar
 * anunciando um número velho em silêncio.
 */
describe("resumo estadual do mapa — cada número vem de .length, não digitado", () => {
  test("bate com o que está medido hoje nas camadas", () => {
    const r = carregarResumoMapaEstadual();
    expect(r.terrasIndigenas).toBe(16);
    expect(r.barragensComManchaPublicada).toBe(156);
    expect(r.sigmineOperacao).toBe(7090);
    expect(r.sigmineInteresse).toBe(47830);
    expect(r.cfemMunicipios).toBe(10);
    expect(r.cruzamentoDinheiroEmpresas).toBe(11);
    expect(r.cruzamentoDinheiroCobertura).toContain("4 dos 854");
    // ⟲ Fonte única: 27 polígonos (23 territórios), Minas inteira.
    expect(r.territoriosQuilombolas).toBe(27);
  });
});
