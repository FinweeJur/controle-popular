import { describe, expect, it } from "vitest";
import { rotularPath, type CidadeRotulo } from "./rotulos";

const CIDADES: CidadeRotulo[] = [
  { slug: "betim", nome: "Betim" },
  { slug: "bh", nome: "Belo Horizonte" },
];

describe("rotularPath", () => {
  it("rotula páginas de zona (fora de cidade)", () => {
    expect(rotularPath("/", CIDADES)).toBe("Início — Controle Popular");
    expect(rotularPath("/congresso", CIDADES)).toBe("Congresso — Início");
    expect(rotularPath("/judiciario", CIDADES)).toBe("Judiciário — Início");
  });

  it("rotula a home de uma cidade", () => {
    expect(rotularPath("/betim", CIDADES)).toBe("Betim — Início");
    expect(rotularPath("/bh", CIDADES)).toBe("Belo Horizonte — Início");
  });

  it("rotula subpáginas principais conhecidas", () => {
    expect(rotularPath("/betim/prefeitura/contratos", CIDADES)).toBe(
      "Contratos da Prefeitura — Betim"
    );
    expect(rotularPath("/betim/camara/proposicoes", CIDADES)).toBe(
      "Proposições da Câmara — Betim"
    );
    expect(rotularPath("/betim/dados", CIDADES)).toBe("Betim em Dados");
  });

  it("devolve null para página de entidade individual", () => {
    expect(rotularPath("/betim/vereadores/fulano-de-tal", CIDADES)).toBeNull();
    expect(rotularPath("/betim/noticias/algum-titulo", CIDADES)).toBeNull();
  });

  it("devolve null para path desconhecido", () => {
    expect(rotularPath("/nao-existe", CIDADES)).toBeNull();
  });

  it("não confunde prefixo de uma cidade com outra", () => {
    // "/betim2" não é "/betim" + sufixo válido nem bate o prefixo de nenhuma
    // cidade da lista.
    expect(rotularPath("/betim2", CIDADES)).toBeNull();
  });
});
