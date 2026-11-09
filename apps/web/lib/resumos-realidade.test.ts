import { describe, expect, it } from "vitest";
import { limparMarcas, parseResumo, resumoPublicavel } from "./resumos-realidade";

describe("parseResumo", () => {
  it("converte título, parágrafo e item de lista", () => {
    const blocos = parseResumo("# Título\n\nParágrafo com texto.\n\n- item um\n- item dois");
    expect(blocos.map((bloco) => bloco.tipo)).toEqual(["h2", "p", "li", "li"]);
    expect(blocos[0].texto).toBe("Título");
    expect(blocos[2].texto).toBe("item um");
  });

  it("converte tabela markdown em bloco de linhas", () => {
    const blocos = parseResumo("| Fonte | N |\n|---|---|\n| Guaicuy | 452 |\n| NACAB | 176 |");
    expect(blocos).toHaveLength(1);
    expect(blocos[0].tipo).toBe("tabela");
    expect(blocos[0].linhas).toEqual([
      ["Fonte", "N"],
      ["Guaicuy", "452"],
      ["NACAB", "176"],
    ]);
  });

  it("junta linhas consecutivas no mesmo parágrafo", () => {
    const blocos = parseResumo("Primeira linha\nsegunda linha\n\nOutro parágrafo");
    expect(blocos).toHaveLength(2);
    expect(blocos[0].texto).toBe("Primeira linha segunda linha");
    expect(blocos[1].texto).toBe("Outro parágrafo");
  });

  it("trata nível 1 como h2 e nível 2 como h3", () => {
    const blocos = parseResumo("# Um\n## Dois\n### Três");
    expect(blocos.map((bloco) => bloco.tipo)).toEqual(["h2", "h3", "h3"]);
  });

  it("ignora linha vazia e não quebra com texto vazio", () => {
    expect(parseResumo("")).toEqual([]);
    expect(parseResumo("\n\n  \n")).toEqual([]);
  });

  it("remove todas as marcas de evidência do texto renderizado", () => {
    const blocos = parseResumo("São 4.515 casos [medido — tabela medida].");
    expect(blocos[0].texto).toBe("São 4.515 casos.");
  });

  it("remove medido, inferido e não dá para concluir; esvazia o parágrafo inconclusivo", () => {
    expect(limparMarcas("Texto [inferido].")).toBe("Texto.");
    expect(limparMarcas("Texto [medido — dados da página].")).toBe("Texto.");
    expect(limparMarcas("Texto [medido — tabela medida].")).toBe("Texto.");
    expect(limparMarcas("Texto [medido].")).toBe("Texto.");
    expect(limparMarcas("Texto [não dá para concluir].")).toBe("Texto.");
    const blocos = parseResumo(
      "Fato medido [medido — dados da página].\n\nSó limite [não dá para concluir].\n\n| A | B |\n|---|---|\n| 1 [medido — dados da página] | 2 |",
    );
    expect(blocos[0].texto).toBe("Fato medido.");
    expect(blocos[1].tipo).toBe("tabela");
    expect(blocos[1].linhas?.[1][0]).toBe("1");
  });

  it("converte bloco de números e citação", () => {
    const blocos = parseResumo(
      ":::numeros\n4.515 | Dano moral | 83% dos casos\n:::\n\n> **Frase** de destaque.",
    );
    expect(blocos[0].tipo).toBe("numeros");
    expect(blocos[0].linhas).toEqual([["4.515", "Dano moral", "83% dos casos"]]);
    expect(blocos[1].tipo).toBe("citacao");
    expect(blocos[1].texto).toBe("**Frase** de destaque.");
  });

  it("remove marca quebrada em duas linhas", () => {
    const blocos = parseResumo("Fato [medido — tabela\nmedida].");
    expect(blocos[0].texto).toBe("Fato.");
  });
});

describe("resumoPublicavel", () => {
  it("exige verificado e texto", () => {
    expect(resumoPublicavel({ rota: "/x", geradoEm: "2026-11-08", verificado: true, markdown: "a" })).toBe(true);
    expect(resumoPublicavel({ rota: "/x", geradoEm: "2026-11-08", verificado: false, markdown: "a" })).toBe(false);
    expect(
      resumoPublicavel({
        rota: "/x",
        geradoEm: "2026-11-08",
        verificado: true,
        inconclusivo: true,
        markdown: "a",
      }),
    ).toBe(false);
    expect(resumoPublicavel({ rota: "/x", geradoEm: "2026-11-08", verificado: true, markdown: "  " })).toBe(false);
    expect(resumoPublicavel(null)).toBe(false);
  });
});
