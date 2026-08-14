import { describe, expect, it } from "vitest";
import { contarPorCategoria, filtrarPatrimonio, municipiosDistintos } from "./patrimonio-tombado";
import type { PatrimonioTombadoRow } from "@/lib/db/queries/patrimonio-tombado";
import { semAcento } from "@/lib/busca/normalizar";

function bem(overrides: Partial<PatrimonioTombadoRow> = {}): PatrimonioTombadoRow {
  return {
    processoAno: "PTE001/1979",
    denominacao: "Capela de São Sebastião",
    denominacaoCompleta: "Capela de São Sebastião",
    categoria: "BI",
    classeSubclasse: "Edificação e acervo; templo",
    municipio: "Araxá",
    distrito: "Araxá",
    atoLegal: "Decreto 19908, de 22 de maio de 1979",
    livroDeTombo: "II, III",
    ...overrides,
  };
}

describe("filtrarPatrimonio", () => {
  const linhas = [
    bem(),
    bem({ processoAno: "PTE003/1978", denominacao: "Prédio do antigo Senado Mineiro", categoria: "BI", municipio: "Belo Horizonte" }),
    bem({ processoAno: "PTE072/1984", denominacao: "Praça Hugo Werneck", categoria: "CP", municipio: "Belo Horizonte" }),
  ];

  it("filtra por categoria", () => {
    const so_cp = filtrarPatrimonio(linhas, { categoria: "CP" }, semAcento);
    expect(so_cp).toHaveLength(1);
    expect(so_cp[0].denominacao).toBe("Praça Hugo Werneck");
  });

  it("filtra por município", () => {
    const bh = filtrarPatrimonio(linhas, { municipio: "Belo Horizonte" }, semAcento);
    expect(bh).toHaveLength(2);
  });

  it("busca por palavra-chave ignora acento", () => {
    const achou = filtrarPatrimonio(linhas, { termoNormalizado: semAcento("Senado") }, semAcento);
    expect(achou).toHaveLength(1);
  });

  it("combina filtros", () => {
    const nada = filtrarPatrimonio(linhas, { categoria: "CP", municipio: "Araxá" }, semAcento);
    expect(nada).toHaveLength(0);
  });
});

describe("contarPorCategoria", () => {
  it("conta as 4 categorias, mesmo com zero ocorrência", () => {
    const cont = contarPorCategoria([bem({ categoria: "BI" }), bem({ categoria: "BI" })]);
    expect(cont.BI).toBe(2);
    expect(cont.BM).toBe(0);
    expect(cont.CH).toBe(0);
    expect(cont.CP).toBe(0);
  });
});

describe("municipiosDistintos", () => {
  it("deduplica e ordena alfabeticamente", () => {
    const municipios = municipiosDistintos([
      bem({ municipio: "Ouro Preto" }),
      bem({ municipio: "Araxá" }),
      bem({ municipio: "Ouro Preto" }),
    ]);
    expect(municipios).toEqual(["Araxá", "Ouro Preto"]);
  });
});
