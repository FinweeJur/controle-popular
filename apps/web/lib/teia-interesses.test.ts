import { describe, expect, it } from "vitest";
import { gerarRelatorioCidadao } from "./teia-interesses";

const FICHA = {
  idMunicipio: "3106705",
  nome: "Betim",
  uf: "MG",
  cnpjPrefeitura: "18715391000196",
  linksOficiais: [
    { rotulo: "Prefeitura Municipal", url: "https://betim.mg.gov.br/" },
    { rotulo: "Câmara Municipal", url: "" },
  ],
};

describe("gerarRelatorioCidadao", () => {
  it("inclui a ficha do municipio e só os links oficiais validos", () => {
    const rel = gerarRelatorioCidadao(FICHA, []);
    expect(rel.municipio.id_municipio).toBe("3106705");
    expect(rel.municipio.cnpj_prefeitura).toBe("18715391000196");
    expect(rel.linksOficiais).toEqual([
      { rotulo: "Prefeitura Municipal", url: "https://betim.mg.gov.br/" },
    ]);
  });

  it("filtra links em branco", () => {
    const rel = gerarRelatorioCidadao(
      {
        ...FICHA,
        linksOficiais: [
          { rotulo: "X", url: "   " },
          { rotulo: "Y", url: "https://y.gov.br" },
        ],
      },
      []
    );
    expect(rel.linksOficiais).toHaveLength(1);
    expect(rel.linksOficiais[0].rotulo).toBe("Y");
  });

  it("declara a regra da lacuna na metodologia", () => {
    const rel = gerarRelatorioCidadao(FICHA, []);
    expect(rel.tipo).toBe("relatorio-controle-popular");
    expect(rel.metodologia.some((m) => m.includes("lacuna é declarada"))).toBe(true);
    expect(rel.metodologia.some((m) => m.includes("comprovação em fonte oficial"))).toBe(true);
  });

  it("lista as secoes com dado existente", () => {
    const secoes = [{ nome: "Saúde", href: "/saude", desc: "Internações" }];
    const rel = gerarRelatorioCidadao(FICHA, secoes);
    expect(rel.secoesComDado).toEqual(secoes);
  });
});
