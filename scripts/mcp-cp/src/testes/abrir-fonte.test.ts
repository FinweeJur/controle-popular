import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { achatarEstado, lerEditais, montarIndiceDeFontes, type EntradaFontes } from "../acervo.js";
import { abrirFonte, formatarFonte } from "../ferramentas/abrir-fonte.js";
import { ErroDeEntrada } from "../resultado.js";

const ler = (nome: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${nome}`, import.meta.url), "utf8"));

const entrada: EntradaFontes = {
  editais: lerEditais(ler("editais.json")),
  documentos: ler("documentos.json"),
  catalogo: ler("catalogo.json"),
  estados: ler("estados.json"),
  metaBarragens: {
    fonte: "ANM — SIGBM (dados abertos)",
    url: "https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv",
    data: "2026-11-11",
  },
};

const fontes = montarIndiceDeFontes(entrada);

describe("montarIndiceDeFontes", () => {
  it("indexa só fonte com id, título e URL http(s)", () => {
    expect(fontes).toHaveLength(14);
    expect(fontes.every((fonte) => /^https?:\/\//.test(fonte.url))).toBe(true);
    expect(fontes.map((fonte) => fonte.id)).not.toContain("edital:2026-09-11-dddd4444");
    expect(fontes.map((fonte) => fonte.id)).not.toContain("documento:url-perigosa");
    expect(fontes.map((fonte) => fonte.id)).not.toContain("base:sem-url");
  });

  it("não repete id", () => {
    const ids = fontes.map((fonte) => fonte.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa urlPdf quando o campo url não serve", () => {
    const documento = fontes.find((fonte) => fonte.id === "documento:somente-pdf");
    expect(documento?.url).toBe("https://www.betim.mg.gov.br/plano-diretor.pdf");
  });

  it("carrega a data de coleta da base SIGBM", () => {
    const sigbm = fontes.find((fonte) => fonte.id === "base:sigbm-barragens");
    expect(sigbm?.data).toBe("2026-11-11");
    expect(sigbm?.orgao).toContain("Mineração");
  });

  it("rotula o portal com a sigla do órgão", () => {
    const tjmg = fontes.find((fonte) => fonte.id === "portal:MG-judiciario_e_controle-tribunal_justica-portal");
    expect(tjmg?.titulo).toBe("Minas Gerais — TJMG: portal oficial");
    expect(tjmg?.orgao).toBe("TJMG");
  });
});

describe("achatarEstado", () => {
  it("descarta estado sem UF e não entra em estrutura inesperada", () => {
    expect(achatarEstado({ uf: "", nome: "Sem UF" })).toEqual([]);
    expect(achatarEstado({ uf: "MG", nome: "Minas Gerais", executivo: "não é objeto" })).toEqual([]);
  });
});

describe("abrirFonte por id", () => {
  it("acha o edital pelo id completo e pelo id curto", () => {
    const completo = abrirFonte(fontes, { id: "edital:2026-09-15-aaaa1111" });
    expect(completo.encontrado).toBe(true);
    expect(completo.fonte?.data).toBe("2026-09-15");
    expect(completo.fonte?.orgao).toBe("IPSM");

    const curto = abrirFonte(fontes, { id: "2026-09-15-aaaa1111" });
    expect(curto.encontrado).toBe(true);
    expect(curto.fonte?.id).toBe("edital:2026-09-15-aaaa1111");
  });

  it("ignora caixa no id", () => {
    const resultado = abrirFonte(fontes, { id: "BASE:MUNICIPIOS-MG" });
    expect(resultado.encontrado).toBe(true);
    expect(resultado.fonte?.titulo).toContain("Municípios de Minas Gerais");
  });

  it("não acha id de item que ficou fora do índice", () => {
    const resultado = abrirFonte(fontes, { id: "edital:2026-09-11-dddd4444" });
    expect(resultado.encontrado).toBe(false);
    expect(resultado.fonte).toBeNull();
    expect(resultado.totalIndexado).toBe(fontes.length);
  });

  it("sugere por id parecido e explica o vazio", () => {
    const resultado = abrirFonte(fontes, { id: "lei-organica" });
    expect(resultado.encontrado).toBe(false);
    expect(resultado.sugestoes.map((fonte) => fonte.id)).toContain("documento:lei-organica-pbh");
    expect(formatarFonte(resultado)).toContain("Talvez seja uma destas");
  });
});

describe("abrirFonte por URL", () => {
  it("acha a URL mesmo com caixa alta e barra final", () => {
    const resultado = abrirFonte(fontes, { url: "https://PREFEITURA.pbh.gov.br/lei-organica.pdf/" });
    expect(resultado.encontrado).toBe(true);
    expect(resultado.fonte?.id).toBe("documento:lei-organica-pbh");
  });

  it("acha portal oficial por UF", () => {
    const resultado = abrirFonte(fontes, { url: "https://www.almg.gov.br" });
    expect(resultado.fonte?.tipo).toBe("portal-oficial");
    expect(resultado.fonte?.titulo).toContain("ALMG");
  });

  it("sugere outra fonte do mesmo domínio", () => {
    const resultado = abrirFonte(fontes, { url: "https://prefeitura.pbh.gov.br/pagina-interna" });
    expect(resultado.encontrado).toBe(false);
    expect(resultado.sugestoes).toHaveLength(1);
    expect(resultado.sugestoes[0]?.id).toBe("documento:lei-organica-pbh");
  });

  it("recusa esquema perigoso sem devolver link", () => {
    const resultado = abrirFonte(fontes, { url: "javascript:alert(1)" });
    expect(resultado.encontrado).toBe(false);
    expect(resultado.sugestoes).toEqual([]);
  });
});

describe("abrirFonte validação de entrada", () => {
  it("exige id ou url, e só um dos dois", () => {
    expect(() => abrirFonte(fontes, {})).toThrow(ErroDeEntrada);
    expect(() => abrirFonte(fontes, { id: "x", url: "https://x.gov.br" })).toThrow(ErroDeEntrada);
  });
});

describe("formatarFonte", () => {
  it("mostra título, URL oficial e data", () => {
    const texto = formatarFonte(abrirFonte(fontes, { id: "base:sigbm-barragens" }));
    expect(texto).toContain("URL oficial: https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv");
    expect(texto).toContain("Data: 11/11/2026");
  });
});
