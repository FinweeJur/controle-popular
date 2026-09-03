import { describe, it, expect } from "vitest";
import { filtrarTrechosRelevantes } from "../../../../scripts/automacao/triagem-diarios-ollama.mjs";
import { gerarTextoBoletim } from "../../../../scripts/automacao/boletim-matinal.mjs";

describe("plano de automação local (Ollama, triagem de diários e boletim matinal)", () => {
  it("filtra atos de dispensa, aditivos e multas ambientais pelo filtro de 1º estágio", () => {
    const textoDiario = `
PORTARIA Nº 101/2026
Concede 30 dias de férias ao servidor João da Silva.

EXTRATO DE DISPENSA DE LICITAÇÃO Nº 14/2026
O Secretário Municipal declara a dispensa de licitação para contratação de obra emergencial de contenção de encosta no valor de R$ 2.450.000,00 com base no Art. 75 da Lei 14.133/2021.

PORTARIA Nº 102/2026
Designa comissão de inventário patrimonial.
`;

    const trechos = filtrarTrechosRelevantes(textoDiario);
    expect(trechos.length).toBe(1);
    expect(trechos[0]).toContain("DISPENSA DE LICITAÇÃO");
    expect(trechos[0]).toContain("2.450.000,00");
  });

  it("monta o boletim matinal com resumo de saúde, acessos e novos contratos", () => {
    const texto = gerarTextoBoletim({
      data: "quinta-feira, 3 de setembro de 2026",
      rotasVerificadas: 118,
      rotasComErro: 0,
      novosContratos: 3,
      alertasClima: 1,
      acessosUltimas24h: 1540,
      atendimentosBot: 12,
      destaques: ["Nova dispensa de R$ 2,4M detectada.", "Avisos de chuva monitorados."],
    });

    expect(texto).toContain("Boletim do Controle Popular");
    expect(texto).toContain("118 rotas ativas");
    expect(texto).toContain("1.540 visualizações");
    expect(texto).toContain("3 novos atos");
    expect(texto).toContain("Nova dispensa de R$ 2,4M detectada.");
  });
});
