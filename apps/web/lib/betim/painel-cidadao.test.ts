import { describe, expect, test } from "vitest";
import { empresaDoMunicipio, resumoDinheiro } from "./painel-cidadao";
import type { ContratoRow } from "@/lib/betim/contratos";

function contrato(over: Partial<ContratoRow>): ContratoRow {
  return {
    id: "1",
    fornecedor_nome: "Fornecedor Teste",
    fornecedor_cnpj: "11111111000111",
    objeto: "Objeto teste",
    valor_global: 1000,
    status: "ativo",
    data_assinatura: "2026-01-01",
    vigencia_inicio: null,
    vigencia_fim: null,
    ano: 2026,
    alerta: false,
    motivos_alerta: null,
    ...over,
  };
}

describe("resumoDinheiro", () => {
  test("sem banco ou sem linhas: disponivel false e zeros - estado vazio honesto", () => {
    const vazio = resumoDinheiro([], false);
    expect(vazio.disponivel).toBe(false);
    expect(vazio.top5Contratos).toHaveLength(0);
    expect(vazio.concentracao).toBe(0);
    const nada = resumoDinheiro([], true);
    expect(nada.disponivel).toBe(false);
  });

  test("contagens reusam as MESMAS regras da tela de contratos", () => {
    const linhas = [
      // 4 contratos do mesmo CNPJ no mesmo ano => os 4 entram em concentracao (>3)
      contrato({ id: "a" }),
      contrato({ id: "b" }),
      contrato({ id: "c" }),
      contrato({ id: "d" }),
      // dispensa proxima do limite (Regra 2 do ETL)
      contrato({
        id: "e",
        fornecedor_cnpj: "22222222000222",
        valor_global: 95_000,
        motivos_alerta: ["regra_2_dispensa_proxima_limite"],
        ano: 2025,
      }),
      // empresa criada no mesmo ano
      contrato({
        id: "f",
        fornecedor_cnpj: "33333333000333",
        fornecedor_abertura: "2026-02-01",
        valor_global: 50_000,
      }),
      // outro ano, nao soma na concentracao de 2026
      contrato({ id: "g", ano: 2024 }),
    ];
    const r = resumoDinheiro(linhas, true);
    expect(r.disponivel).toBe(true);
    expect(r.totalContratos).toBe(7);
    expect(r.concentracao).toBe(4);
    expect(r.dispensaLimite).toBe(1);
    expect(r.recemCriada).toBe(1);
  });

  test("top 5 ordenado por valor desc; contrato sem valor nao disputa o topo", () => {
    const linhas = [500, 900, null, 7000, 300, 1200, 600].map((v, i) =>
      contrato({ id: String(i), valor_global: v })
    );
    const r = resumoDinheiro(linhas, true);
    expect(r.top5Contratos.map((c) => c.valor_global)).toEqual([7000, 1200, 900, 600, 500]);
  });
});

describe("empresaDoMunicipio - derivado do observatorio, nunca copiado", () => {
  test("Itinga e Aracuai apontam Sigma Lithium", () => {
    expect(empresaDoMunicipio("Itinga")).toEqual({
      nomeCurto: "Sigma Lithium",
      href: "/empresas/sigma-lithium",
    });
    expect(empresaDoMunicipio("ARAÇUAÍ")).toMatchObject({ nomeCurto: "Sigma Lithium" });
  });

  test("Brumadinho, Betim e Sarzedo apontam Vale (sem acento/caixa)", () => {
    for (const nome of ["Brumadinho", "BETIM", "sarzedo"]) {
      expect(empresaDoMunicipio(nome)).toEqual({
        nomeCurto: "Vale",
        href: "/empresas/vale",
      });
    }
  });

  test("municipio fora da lista prioritaria: null, sem card", () => {
    expect(empresaDoMunicipio("Diamantina")).toBeNull();
    expect(empresaDoMunicipio("")).toBeNull();
  });
});
