import { describe, expect, test } from "vitest";

import { sondar, classificarVerificacao, verificarLink } from "./verificar";

/**
 * Verificação HTTP + conteúdo com fetch mockado — o coração da regra
 * "API responde 200 e mente".
 */

function respostaStatus(status: number): Response {
  return new Response(null, { status });
}

function respostaComCorpo(status: number, corpo: string, contentType?: string): Response {
  return new Response(corpo, {
    status,
    headers: contentType ? { "content-type": contentType } : {},
  });
}

describe("sondar com fetch mockado", () => {
  test("HEAD 200 seguido de GET amostra o corpo", async () => {
    const chamadas: string[] = [];
    const fetchFalso = (async (url: string, init?: RequestInit) => {
      chamadas.push(`${init?.method} ${url}`);
      if (init?.method === "HEAD") {
        return respostaComCorpo(200, "", "application/pdf");
      }
      return respostaComCorpo(200, "%PDF-1.7", "application/pdf");
    }) as unknown as typeof fetch;

    const s = await sondar("https://x.gov.br/a.pdf", fetchFalso);
    expect(s.statusHttp).toBe(200);
    expect(s.corpoInicial).toBe("%PDF-1.7");
    expect(s.contentType).toBe("application/pdf");
    expect(chamadas[0]).toContain("HEAD");
  });

  test("HEAD recusado com 405 cai no GET-range", async () => {
    const fetchFalso = (async (_url: string, init?: RequestInit) => {
      if (init?.method === "HEAD") return respostaStatus(405);
      return respostaComCorpo(200, "<html>ok</html>", "text/html");
    }) as unknown as typeof fetch;

    const s = await sondar("https://x.gov.br/pagina", fetchFalso);
    expect(s.metodo).toBe("GET");
    expect(s.corpoInicial).toBe("<html>ok</html>");
  });

  test("erro de rede nao lanca: volta statusHttp null com o motivo", async () => {
    const fetchFalso = (async () => {
      throw new Error("fetch failed");
    }) as unknown as typeof fetch;
    const s = await sondar("https://x.gov.br/a.pdf", fetchFalso);
    expect(s.statusHttp).toBeNull();
    expect(s.erro).toBe("fetch failed");
  });
});

describe("classificarVerificacao", () => {
  test("404 e quebrado", () => {
    expect(
      classificarVerificacao("https://x.gov.br/a", {
        statusHttp: 404, contentType: null, finalUrl: "https://x.gov.br/a",
        corpoInicial: null, metodo: "HEAD",
      }).classe
    ).toBe("QUEBRADO");
  });

  test("200 que aterrissa noutra URL e redirect", () => {
    expect(
      classificarVerificacao("https://x.gov.br/a", {
        statusHttp: 200, contentType: "text/html", finalUrl: "https://y.gov.br/b",
        corpoInicial: "<html>oi</html>", metodo: "GET",
      }).classe
    ).toBe("REDIRECT");
  });

  test("200 com corpo de erro mole e MENTIROSO, nao OK", () => {
    const v = classificarVerificacao("https://x.gov.br/pagina", {
      statusHttp: 200, contentType: "text/html", finalUrl: "https://x.gov.br/pagina",
      corpoInicial: "<title>Página não encontrada</title>", metodo: "GET",
    });
    expect(v.classe).toBe("MENTIROSO");
    expect(v.motivo).toContain("marcador");
  });

  test("200 real e OK", () => {
    expect(
      classificarVerificacao("https://x.gov.br/pagina", {
        statusHttp: 200, contentType: "text/html", finalUrl: "https://x.gov.br/pagina",
        corpoInicial: "<html>conteudo real</html>", metodo: "GET",
      }).classe
    ).toBe("OK");
  });

  test("500 e inconsistente com o motivo", () => {
    const v = classificarVerificacao("https://x.gov.br/a", {
      statusHttp: 500, contentType: null, finalUrl: "https://x.gov.br/a",
      corpoInicial: null, metodo: "GET",
    });
    expect(v.classe).toBe("INCONSISTENTE");
  });
});

describe("verificarLink ponta a ponta com fetch mockado", () => {
  test("PDF mentiroso (servidor devolve HTML com 200) e MENTIROSO", async () => {
    const fetchFalso = (async (_url: string, init?: RequestInit) => {
      if (init?.method === "HEAD") return respostaStatus(200);
      return respostaComCorpo(200, "<html>nao sou pdf</html>", "text/html");
    }) as unknown as typeof fetch;
    const v = await verificarLink("https://x.gov.br/doc.pdf", fetchFalso);
    expect(v.classe).toBe("MENTIROSO");
  });

  test("PDF de verdade com %PDF e OK", async () => {
    const fetchFalso = (async (_url: string, init?: RequestInit) => {
      if (init?.method === "HEAD") return respostaStatus(200);
      return respostaComCorpo(200, "%PDF-1.4 ...", "application/pdf");
    }) as unknown as typeof fetch;
    const v = await verificarLink("https://x.gov.br/doc.pdf", fetchFalso);
    expect(v.classe).toBe("OK");
  });
});
