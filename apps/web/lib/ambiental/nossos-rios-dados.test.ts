import { describe, it, expect } from "vitest";
import { DADOS_RIOS, obterDadosRio } from "./nossos-rios-dados";
import { LUGARES_CATALOGO } from "../lugares";

describe("DADOS_RIOS (Observatório de Bacias e Calhas Fluviais)", () => {
  it("todos os rios do LUGARES_CATALOGO possuem dados hidrológicos completos", () => {
    const riosCatalogo = LUGARES_CATALOGO.filter((l) => l.tipo === "rio");
    expect(riosCatalogo.length).toBe(9);

    for (const r of riosCatalogo) {
      const dados = obterDadosRio(r.id);
      expect(dados, `Rio ${r.id} não possui registro em DADOS_RIOS`).toBeDefined();
      expect(dados!.nome).toBe(r.nome);
    }
  });

  it("nenhum rio tem indicador protagonista indefinido ou pendente de fonte", () => {
    for (const [id, dados] of Object.entries(DADOS_RIOS)) {
      expect(dados.numeroProtagonista.valor).not.toContain("ligar à fonte");
      expect(dados.numeroProtagonista.valor).not.toBe("");
      expect(dados.numeroProtagonista.fonte.trim().length).toBeGreaterThan(3);
      expect(dados.numeroProtagonista.rotulo.trim().length).toBeGreaterThan(10);
      expect(dados.municipiosBacia).toBeGreaterThan(0);
      expect(dados.estacoesMonitoramento).toBeGreaterThan(0);
      expect(dados.dadosGrafico.length).toBeGreaterThanOrEqual(4);
      expect(dados.itensTabela.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("obterDadosRio retorna null para slugs inexistentes", () => {
    expect(obterDadosRio("rio-inexistente")).toBeNull();
  });
});
