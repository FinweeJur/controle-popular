import { describe, expect, test } from "vitest";

import {
  montarConsultasBusca,
  parsearResultadosDdg,
  buscarNoDuckDuckGo,
  termosDaUrl,
} from "./busca";

/**
 * As 3 estratégias de busca (plano Fase 3) têm que nascer com palavras-chave
 * DIFERENTES — e o parse do DuckDuckGo é testado com HTML fixture, sem rede.
 */

describe("montarConsultasBusca", () => {
  test("tres estrategias distintas quando ha titulo e orgao", () => {
    const consultas = montarConsultasBusca({
      url: "https://revendedoresapi.anp.gov.br/swagger/index.html",
      titulo: "Manual de usuario da API de revendedores",
      orgao: "ANP",
    });
    expect(consultas.map((c) => c.estrategia)).toEqual([
      "titulo-orgao-filetype",
      "titulo-exato",
      "site-dominio",
    ]);
    expect(consultas[0].query).toContain("Manual de usuario");
    expect(consultas[0].query).toContain("ANP");
    expect(consultas[0].query).not.toContain("filetype:pdf");
    expect(consultas[1].query).toBe('"Manual de usuario da API de revendedores"');
    expect(consultas[2].query).toContain("site:revendedoresapi.anp.gov.br");
  });

  test("URL de PDF acrescenta filetype:pdf na estrategia (a)", () => {
    const consultas = montarConsultasBusca({
      url: "https://www.gov.br/anp/doc/relatorio.pdf",
      titulo: "Relatorio anual",
    });
    expect(consultas[0].query).toContain("filetype:pdf");
  });

  test("sem titulo: degrada para termos do path, sem inventar palavras", () => {
    const consultas = montarConsultasBusca({
      url: "https://www.gov.br/anp/paineis-dinamicos/api-revendedores",
    });
    expect(consultas[1].query).toContain("paineis dinamicos");
    expect(consultas[2].query).toContain("site:www.gov.br");
    expect(consultas.length).toBe(3);
  });
});

describe("termosDaUrl", () => {
  test("extrai segmentos do path, sem extensao, hifen vira espaco", () => {
    expect(termosDaUrl("https://x.gov.br/a/b/painel-dinamico-abastecimento.pdf")).toBe(
      "painel dinamico abastecimento"
    );
  });
});

describe("parsearResultadosDdg", () => {
  test("extrai links uddg do HTML do DuckDuckGo", () => {
    const html = `
      <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.gov.br%2Fanp%2Fmanual.pdf&amp;rut=abc">Manual</a>
      <a rel="nofollow" class="result__a" href="https://exemplo.com/direto">Direto</a>
      <a class="outra" href="https://nao-deve-entrar.com/x">X</a>
    `;
    const links = parsearResultadosDdg(html);
    expect(links).toEqual([
      "https://www.gov.br/anp/manual.pdf",
      "https://exemplo.com/direto",
    ]);
  });

  test("HTML sem resultados devolve array vazio", () => {
    expect(parsearResultadosDdg("<html><body>anomaly</body></html>")).toEqual([]);
  });
});

describe("buscarNoDuckDuckGo com fetch mockado", () => {
  test("resposta 200 com resultados devolve os links", async () => {
    const html =
      '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fgov.br%2Fa.pdf">A</a>';
    const fetchFalso = (async () =>
      new Response(html, { status: 200, headers: { "content-type": "text/html" } })) as unknown as typeof fetch;
    const r = await buscarNoDuckDuckGo("teste", fetchFalso);
    expect(r.ok).toBe(true);
    expect(r.links).toEqual(["https://gov.br/a.pdf"]);
  });

  test("resposta 429 (rate limit) volta como busca mal-sucedida, nao lanca", async () => {
    const fetchFalso = (async () => new Response("", { status: 429 })) as unknown as typeof fetch;
    const r = await buscarNoDuckDuckGo("teste", fetchFalso);
    expect(r.ok).toBe(false);
    expect(r.erro).toBe("HTTP 429");
    expect(r.links).toEqual([]);
  });

  test("erro de rede (WinError 10013) volta como busca mal-sucedida, nao lanca", async () => {
    const fetchFalso = (async () => {
      throw new Error("fetch failed");
    }) as unknown as typeof fetch;
    const r = await buscarNoDuckDuckGo("teste", fetchFalso);
    expect(r.ok).toBe(false);
    expect(r.erro).toBe("fetch failed");
  });
});
