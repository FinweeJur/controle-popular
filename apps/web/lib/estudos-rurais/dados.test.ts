import { describe, expect, it } from "vitest";
import {
  ACERVO,
  COBERTURA,
  ITENS,
  POR_ANO,
  POR_TIPO,
  SERIE_GRAFICO,
  itensParaCsv,
  listarAnos,
  listarFontes,
  listarTipos,
} from "./dados";

/**
 * Testes da lib de Estudos Rurais. O dado é coletado (não fixo), então os
 * testes validam INVARIANTES — consistência interna, regras de CSV, e as
 * decisões do AGENTS.md — e não contagens literais.
 */
describe("estudos-rurais/dados", () => {
  it("o acervo é coletado, nunca exemplo", () => {
    expect(ACERVO.exemplo).toBe(false);
    expect(ACERVO.schema).toBe(1);
    expect(Number.isFinite(Date.parse(ACERVO.coletadoEm))).toBe(true);
  });

  it("todo item tem título, fonte com link, url e resumo curto", () => {
    expect(ITENS.length).toBeGreaterThan(0);
    for (const i of ITENS) {
      expect(i.id.length).toBeGreaterThan(0);
      expect(i.titulo.length).toBeGreaterThan(0);
      expect(i.fonte.length).toBeGreaterThan(0);
      expect(i.fonte_url.startsWith("http")).toBe(true);
      expect(i.url.startsWith("http")).toBe(true);
      // resumo truncado em 300 caracteres na coleta
      expect(i.resumo.length).toBeLessThanOrEqual(300);
      expect(i.resumo).not.toMatch(/<[^>]+>/); // sem HTML cru
    }
  });

  it("ids são únicos (dedup da coleta)", () => {
    const ids = new Set(ITENS.map((i) => i.id));
    expect(ids.size).toBe(ITENS.length);
  });

  it("datas, quando presentes, são ISO AAAA-MM-DD", () => {
    for (const i of ITENS) {
      if (i.data === null) continue;
      expect(i.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(i.data))).toBe(true);
    }
  });

  it("COBERTURA.itens bate com o array e declara semData", () => {
    expect(COBERTURA.itens).toBe(ITENS.length);
    expect(COBERTURA.semData).toBe(ITENS.filter((i) => !i.data).length);
  });

  it("POR_TIPO cobre os quatro tipos declarados e soma o total", () => {
    expect(POR_TIPO.map((t) => t.tipo)).toEqual(["noticia", "artigo", "evento", "publicacao"]);
    expect(POR_TIPO.reduce((t, x) => t + x.total, 0)).toBe(ITENS.length);
  });

  it("SERIE_GRAFICO soma o total de itens datados, sem duplicar linha", () => {
    const datados = ITENS.filter((i) => i.data).length;
    const soma = SERIE_GRAFICO.reduce((t, x) => t + x.total, 0);
    expect(soma).toBe(datados);
    expect(SERIE_GRAFICO.length).toBeGreaterThan(0);
    expect(new Set(SERIE_GRAFICO.map((s) => s.rotulo)).size).toBe(SERIE_GRAFICO.length);
  });

  it("POR_ANO é consistente com a série (mesmo total) e ordenado", () => {
    const anos = POR_ANO.map((a) => a.ano);
    expect([...anos].sort((a, b) => a - b)).toEqual(anos);
    expect(POR_ANO.reduce((t, a) => t + a.total, 0)).toBe(SERIE_GRAFICO.reduce((t, s) => t + s.total, 0));
  });

  it("seletores derivam do dado real, sem lista fixa envelhecida", () => {
    const fontes = listarFontes();
    expect(fontes.length).toBeGreaterThan(0);
    expect([...fontes].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(fontes);
    expect(listarTipos().map((t) => t.tipo)).toEqual(["noticia"]); // primeira rodada só noticia
    for (const ano of listarAnos()) {
      expect(ITENS.some((i) => i.data?.startsWith(String(ano)))).toBe(true);
    }
  });

  it("lacunas da coleta chegam no acervo e são não-vazias", () => {
    expect(ACERVO.lacunas.length).toBeGreaterThan(0);
    for (const l of ACERVO.lacunas) expect(l.length).toBeGreaterThan(20);
  });

  it("CSV: BOM UTF-8 no primeiro byte, separador ; e aspas quando precisa", () => {
    const csv = itensParaCsv(ITENS.slice(0, 5));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const semBom = csv.slice(1);
    expect(semBom.split("\r\n")[0]).toBe("titulo;tipo;data;fonte;url;resumo");
    for (const linha of semBom.trimEnd().split("\r\n")) {
      expect(linha).toContain(";");
    }
  });

  it("CSV escapa célula com ; e aspas internas (RFC-4180)", () => {
    const csv = itensParaCsv([
      {
        id: "t1",
        titulo: 'Vai "dar" certo; sim',
        tipo: "noticia",
        fonte: "Teste",
        fonte_url: "https://exemplo.org",
        data: "2026-09-01",
        resumo: "",
        url: "https://exemplo.org/a",
      },
    ]);
    expect(csv).toContain('"Vai ""dar"" certo; sim"');
  });

  it("CSV é determinístico: mesmas linhas, mesmo arquivo", () => {
    expect(itensParaCsv(ITENS.slice(0, 3))).toBe(itensParaCsv(ITENS.slice(0, 3)));
  });
});
