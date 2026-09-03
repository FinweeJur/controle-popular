import { describe, it, expect } from "vitest";
import {
  carregarBibliotecaDesastres,
  listarDocumentosDesastres,
  obterEstatisticasBiblioteca,
  filtrarDocumentosPorDesastre,
} from "./biblioteca-desastres";

describe("biblioteca unificada de crimes socioambientais (PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md)", () => {
  it("carrega estatísticas consolidadas dos dois grandes desastres", () => {
    const totais = obterEstatisticasBiblioteca();
    expect(totais.brumadinho_paraopeba).toBe(645);
    expect(totais.mariana_rio_doce).toBe(291);
    expect(totais.ufs.MG).toBe(763);
    expect(totais.ufs.BR).toBe(173);
  });

  it("filtra documentos oficiais por desastre (Mariana e Brumadinho)", () => {
    const docsBrum = filtrarDocumentosPorDesastre("brumadinho");
    expect(docsBrum.length).toBeGreaterThan(0);
    expect(docsBrum.every((d) => d.desastre === "brumadinho" && d.bacia === "paraopeba")).toBe(true);

    const docsMari = filtrarDocumentosPorDesastre("mariana");
    expect(docsMari.length).toBeGreaterThan(0);
    expect(docsMari.every((d) => d.desastre === "mariana" && d.bacia === "doce")).toBe(true);

    const docMg = docsMari.find((d) => d.uf === "MG");
    expect(docMg).toBeDefined();
  });
});
