import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { limparMarcas, parseResumo, resumoPublicavel, type ResumoRealidade } from "./resumos-realidade";

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

/**
 * Contrato dos arquivos publicados — o portão da fase F2.
 *
 * POR QUE AQUI: o componente só confere `verificado`; nada impedia publicar
 * arquivo com rota trocada, data impossível ou parágrafo sem marca. Estes
 * testes leem a pasta e reprovam antes do build, sem depender de modelo.
 *
 * Convenção de nome: a rota `/jurisprudencia/penal` vira
 * `jurisprudencia-penal.json` — a pasta lista as rotas em ordem e dois
 * resumos nunca se sobrescrevem.
 */
const PASTA_RESUMOS = path.resolve(__dirname, "..", "data", "resumos-realidade");
const ROTAS_PILOTO = ["/concursos", "/jurisprudencia/penal", "/mineracao/cavas"];
const MARCA = /\[(medido|inferido|não dá para concluir)/;

function lerResumosDoDisco(): { arquivo: string; resumo: ResumoRealidade }[] {
  return readdirSync(PASTA_RESUMOS)
    .filter((nome) => nome.endsWith(".json"))
    .sort()
    .map((arquivo) => ({
      arquivo,
      resumo: JSON.parse(
        readFileSync(path.join(PASTA_RESUMOS, arquivo), "utf-8"),
      ) as ResumoRealidade,
    }));
}

const RESUMOS_DO_DISCO = lerResumosDoDisco();

describe("arquivos de data/resumos-realidade", () => {
  it("existe pelo menos um resumo publicado", () => {
    expect(RESUMOS_DO_DISCO.length).toBeGreaterThan(0);
  });

  it.each(RESUMOS_DO_DISCO.map(({ arquivo }) => arquivo))(
    "%s respeita o contrato e o nome da rota",
    (arquivo) => {
      const { resumo } = RESUMOS_DO_DISCO.find((r) => r.arquivo === arquivo)!;
      expect(resumo.rota).toMatch(/^\/[a-z0-9/-]+$/);
      expect(arquivo).toBe(`${resumo.rota.slice(1).replaceAll("/", "-")}.json`);
      expect(resumo.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${resumo.geradoEm}T00:00:00Z`))).toBe(false);
      expect(resumo.verificado).toBe(true);
      // Arquivo inconclusivo fica no disco como pendência medida e fora do ar
      // (P6 em docs/02-estado/PENDENCIAS-RESUMOS.md): público só sem a marca.
      if (resumo.inconclusivo) {
        expect(resumo.motivo?.trim().length ?? 0).toBeGreaterThan(0);
        expect(resumoPublicavel(resumo)).toBe(false);
      } else {
        expect(resumoPublicavel(resumo)).toBe(true);
      }
      const blocos = parseResumo(resumo.markdown);
      expect(blocos[0]?.tipo).toBe("h2");
      expect(blocos[0].texto.trim().length).toBeGreaterThan(10);
    },
  );
});

/**
 * Parágrafos do markdown de origem. A marca tem de ser conferida aqui, antes do
 * parse: desde f6c22c58 (09/11/2026) o renderizador apaga `[medido]`,
 * `[inferido]` e `[não dá para concluir]` da tela, por decisão do dono.
 */
function paragrafosCrus(markdown: string): string[] {
  return markdown
    .split(/\r?\n\s*\r?\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter((paragrafo) => paragrafo && !/^(#|\||:::|-|>)/.test(paragrafo));
}

describe("piloto F2 — concursos, jurisprudência penal e cavas", () => {
  it.each(ROTAS_PILOTO)("%s tem no máximo 6 parágrafos, todos com marca", (rota) => {
    const { resumo } = RESUMOS_DO_DISCO.find((r) => r.resumo.rota === rota)!;
    const paragrafos = paragrafosCrus(resumo.markdown);
    expect(paragrafos.length).toBeLessThanOrEqual(6);
    for (const paragrafo of paragrafos) {
      const marcado = MARCA.test(paragrafo) || paragrafo.startsWith("Fonte:");
      expect(marcado).toBe(true);
    }
  });
});
