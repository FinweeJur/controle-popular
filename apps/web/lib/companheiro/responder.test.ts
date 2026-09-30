/**
 * @file responder.test.ts
 * @description Testes do responder do companheiro de desktop: a fala curta
 * (sem marcadores de citacao) e o caminho deterministico, que nao usa rede.
 */

import { describe, it, expect } from "vitest";
import { montarFala, responderComoCompanheiro } from "./responder";

describe("montarFala", () => {
  it("remove os marcadores [n] da resposta", () => {
    const fala = montarFala("Betim gastou R$ 1,65 bilhao [1] em 2024 [2].");
    expect(fala).not.toContain("[");
    expect(fala).toContain("Betim gastou");
  });

  it("cola a fonte pelo titulo que veio do dado", () => {
    const fala = montarFala("As licencas ficam naquela pagina [1].", [
      "Licenciamento Ambiental",
    ]);
    expect(fala).toContain("Fonte: Licenciamento Ambiental.");
  });

  it("encurta fala longa com reticencias", () => {
    const longa = "palavra ".repeat(60) + "fim [1].";
    const fala = montarFala(longa);
    expect(fala.length).toBeLessThanOrEqual(260);
    expect(fala.endsWith("...") || fala.includes("Fonte:")).toBe(true);
  });

  it("nao acrescenta dado: so reembala o texto de entrada", () => {
    const fala = montarFala("Resposta curta [1].");
    expect(fala).toBe("Resposta curta.");
  });
});

describe("responderComoCompanheiro (caminho deterministico)", () => {
  it("responde o degrau sem IA e devolve galhos reais", async () => {
    const r = await responderComoCompanheiro({
      pergunta: "quero ver o laboratorio de dados",
    });
    expect(r.modelo).toBe("deterministico");
    expect(r.abstencao).toBe(false);
    expect(r.galhos.length).toBeGreaterThan(0);
    expect(r.atalhos.length).toBeGreaterThan(0);
    // Todo galho tem rotulo; a fala nunca carrega marcador.
    expect(r.galhos.every((g) => g.rotulo.length > 0)).toBe(true);
    expect(r.fala).not.toContain("[");
    expect(r.ressalva).toBe(true);
    expect(r.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("todo galho tem destino (rota) no caminho deterministico", () => {
    return responderComoCompanheiro({ pergunta: "laboratorio" }).then((r) => {
      expect(r.galhos.every((g) => Boolean(g.rota))).toBe(true);
    });
  });
});
