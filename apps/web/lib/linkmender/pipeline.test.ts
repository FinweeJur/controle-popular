import { describe, expect, test } from "vitest";

import { processarLink } from "./pipeline";
import type { FetchFn } from "./busca";

/**
 * O pipeline INTEIRO com fetch mockado: link quebrado → 3 buscas com
 * palavras-chave diferentes → candidato confirmado pelos critérios → proposta
 * com trilha. É o mesmo código que o home-pc vai rodar com fetch real.
 */

/** Fetch simulado por tabela: "metodo url" → Response | erro. */
function fetchDeTabela(
  tabela: Record<string, Response | string>,
  log: { requisicoes: string[]; consultas: string[] } = { requisicoes: [], consultas: [] }
): FetchFn {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const metodo = init?.method ?? "GET";
    const chave = `${metodo} ${url}`;
    log.requisicoes.push(chave);
    if (url.startsWith("https://duckduckgo.com/html/")) {
      const q = new URL(url).searchParams.get("q") ?? "";
      log.consultas.push(decodeURIComponent(q));
    }
    const valor = tabela[chave];
    if (valor === undefined) throw new Error(`fetch falhou (simulado) para ${chave}`);
    if (typeof valor === "string") throw new Error(valor);
    return valor;
  }) as unknown as FetchFn;
}

const SEM_PAUSA = async () => {};

function corpoPdf(): Response {
  return new Response("%PDF-1.7 substituto real", {
    status: 200,
    headers: { "content-type": "application/pdf" },
  });
}

describe("processarLink (pipeline inteiro, fetch mockado)", () => {
  test("link quebrado: 3 buscas e candidato aceito pelos criterios", async () => {
    const urlQuebrada = "https://revendedoresapi.anp.gov.br/api-manual-usuario.pdf";
    const urlNova = "https://www.gov.br/anp/manual-api-revendedores.pdf";
    const tabela: Record<string, Response | string> = {
      [`HEAD ${urlQuebrada}`]: new Response(null, { status: 404 }),
      [`GET ${urlQuebrada}`]: new Response(null, { status: 404 }),
      [`HEAD ${urlNova}`]: new Response(null, {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
      [`GET ${urlNova}`]: corpoPdf(),
    };
    const fetchReal = fetchDeTabela(tabela);
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith("https://duckduckgo.com/html/")) {
        const q = decodeURIComponent(new URL(url).searchParams.get("q") ?? "");
        // Distingue as 3 estratégias pela cara da consulta:
        //   (a) tem filetype:pdf  → devolve o candidato bom
        //   (b) aspas exatas      → devolve um terceiro que os critérios vetam
        //   (c) site:dominio      → devolve o candidato bom de novo
        const alvo = q.includes("filetype:pdf") || q.includes("site:")
          ? urlNova
          : q.startsWith('"')
            ? "https://terceiro.com/outro.pdf"
            : "";
        const hrefs = alvo
          ? `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent(alvo)}">A</a>`
          : "";
        return new Response(hrefs, { status: 200 });
      }
      return fetchReal(input, init);
    }) as unknown as FetchFn;

    const r = await processarLink(
      { url: urlQuebrada, titulo: "Manual de usuario da API de revendedores", orgao: "ANP" },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );

    expect(r.proposta).not.toBeNull();
    expect(r.proposta?.urlNova).toBe(urlNova);
    expect(r.proposta?.criterios).toContain("vivo-2xx");
    expect(r.proposta?.criterios).toContain("dominio-oficial");
    expect(r.proposta?.criterios.some((c) => c.startsWith("tipo-igual-"))).toBe(true);
    // A primeira busca que produz candidato valido encerra o pipeline — as 3
    // consultas PLANEJADAS (com palavras-chave diferentes) sao garantia de
    // busca.test.ts; aqui, so a executada entra na trilha.
    expect(r.consultas.length).toBeGreaterThanOrEqual(1);
    expect(r.consultas[0].estrategia).toBe("titulo-orgao-filetype");
  });

  test("candidato em dominio NAO oficial nunca e aceito, mesmo que a busca o traga", async () => {
    const urlQuebrada = "https://www.gov.br/anp/antigo.pdf";
    const candidatoRuim = "https://espelho-nao-oficial.com/antigo.pdf";
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith("https://duckduckgo.com/html/")) {
        const hrefs = `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent(candidatoRuim)}">A</a>`;
        return new Response(hrefs, { status: 200 });
      }
      if (url === urlQuebrada) return new Response(null, { status: 404 });
      return new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as unknown as FetchFn;

    const r = await processarLink(
      { url: urlQuebrada },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );
    expect(r.proposta).toBeNull();
    expect(r.semPropostaMotivo).toContain("nenhum candidato bateu");
    expect(r.consultas.length).toBe(3);
  });

  test("REDIRECT para dominio aceitavel e proposto, com destino re-verificado", async () => {
    const urlVelha = "https://pncp.gov.br";
    const destino = "https://www.gov.br/pncp/pt-br";

    class RespostaRedirect extends Response {
      get url(): string {
        return destino;
      }
    }

    const fetchFn = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url === destino) {
        return new Response("<html>portal nacional pncp</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }
      return new RespostaRedirect(null, { status: 200 });
    }) as unknown as FetchFn;

    const r = await processarLink(
      { url: urlVelha },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );
    expect(r.verificacao.classe).toBe("REDIRECT");
    expect(r.proposta?.urlNova).toBe(destino);
    expect(r.proposta?.criterios).toContain("redirect-declarado-pelo-servidor");
    expect(r.proposta?.criterios).toContain("destino-verificado-vivo");
  });

  test("REDIRECT para dominio NAO aceitavel nao vira proposta", async () => {
    const urlVelha = "https://pncp.gov.br";
    const destino = "https://exemplo.com/redirecionei";

    class RespostaRedirect extends Response {
      get url(): string {
        return destino;
      }
    }

    const fetchFn = (async () => new RespostaRedirect(null, { status: 200 })) as unknown as FetchFn;

    const r = await processarLink(
      { url: urlVelha },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );
    expect(r.verificacao.classe).toBe("REDIRECT");
    expect(r.proposta).toBeNull();
    expect(r.semPropostaMotivo).toContain("nao aceitavel");
  });

  test("link mentiroso (200 com corpo de erro) entra no fluxo de busca", async () => {
    const urlMentira = "https://www.gov.br/anp/painel.pdf";
    const urlNova = "https://pub-abc.r2.dev/ab/abcd1234.pdf";
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith("https://duckduckgo.com/html/")) {
        const hrefs = `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent(urlNova)}">A</a>`;
        return new Response(hrefs, { status: 200 });
      }
      if (init?.method === "HEAD") {
        return new Response(null, {
          status: 200,
          headers: { "content-type": "application/pdf" },
        });
      }
      if (url === urlMentira) {
        return new Response("<html>Página não encontrada</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }
      return new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as unknown as FetchFn;

    // Sem título conhecido: critério de título fica "nao-avaliado" e não veta.
    const r = await processarLink(
      { url: urlMentira },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );
    expect(r.verificacao.classe).toBe("MENTIROSO");
    expect(r.proposta?.urlNova).toBe(urlNova);
    expect(r.proposta?.criterios).toContain("dominio-r2-ou-proprio");
  });

  test("link vivo nao gera proposta nem dispara busca", async () => {
    const consultas: string[] = [];
    const fetchFn = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith("https://duckduckgo.com/html/")) {
        consultas.push(url);
        return new Response("", { status: 200 });
      }
      return new Response("%PDF-1.7", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as unknown as FetchFn;

    const r = await processarLink(
      { url: "https://www.gov.br/anp/vivo.pdf" },
      { fetchFn, sleepFn: SEM_PAUSA, pausaMs: 0 }
    );
    expect(r.verificacao.classe).toBe("OK");
    expect(r.proposta).toBeNull();
    expect(consultas.length).toBe(0);
  });
});
