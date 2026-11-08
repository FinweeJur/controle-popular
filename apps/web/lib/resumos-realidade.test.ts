import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseResumo, resumoPublicavel, type ResumoRealidade } from "./resumos-realidade";

describe("parseResumo", () => {
  it("converte título, parágrafo e item de lista", () => {
    const blocos = parseResumo("# Título\n\nParágrafo com texto.\n\n- item um\n- item dois");
    expect(blocos.map((bloco) => bloco.tipo)).toEqual(["h2", "p", "li", "li"]);
    expect(blocos[0].texto).toBe("Título");
    expect(blocos[2].texto).toBe("item um");
  });

  it("trata nível 1 como h2 e nível 2 como h3", () => {
    const blocos = parseResumo("# Um\n## Dois\n### Três");
    expect(blocos.map((bloco) => bloco.tipo)).toEqual(["h2", "h3", "h3"]);
  });

  it("ignora linha vazia e não quebra com texto vazio", () => {
    expect(parseResumo("")).toEqual([]);
    expect(parseResumo("\n\n  \n")).toEqual([]);
  });

  it("preserva a marca de evidência dentro do parágrafo", () => {
    const blocos = parseResumo("São 4.515 casos [medido — tabela medida].");
    expect(blocos[0].texto).toContain("[medido — tabela medida]");
  });
});

describe("resumoPublicavel", () => {
  it("exige verificado e texto", () => {
    expect(resumoPublicavel({ rota: "/x", geradoEm: "2026-11-08", verificado: true, markdown: "a" })).toBe(true);
    expect(resumoPublicavel({ rota: "/x", geradoEm: "2026-11-08", verificado: false, markdown: "a" })).toBe(false);
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
      expect(resumoPublicavel(resumo)).toBe(true);
      const blocos = parseResumo(resumo.markdown);
      expect(blocos[0]?.tipo).toBe("h2");
      expect(blocos[0].texto.trim().length).toBeGreaterThan(10);
    },
  );
});

describe("piloto F2 — concursos, jurisprudência penal e cavas", () => {
  it.each(ROTAS_PILOTO)("%s tem no máximo 6 parágrafos, todos com marca", (rota) => {
    const { resumo } = RESUMOS_DO_DISCO.find((r) => r.resumo.rota === rota)!;
    const paragrafos = parseResumo(resumo.markdown)
      .slice(1)
      .filter((bloco) => bloco.tipo === "p");
    expect(paragrafos.length).toBeLessThanOrEqual(6);
    for (const paragrafo of paragrafos) {
      const marcado = MARCA.test(paragrafo.texto) || paragrafo.texto.startsWith("Fonte:");
      expect(marcado).toBe(true);
    }
  });
});
