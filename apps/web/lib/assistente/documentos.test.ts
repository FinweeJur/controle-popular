import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BASE_INDICE,
  IndiceIndisponivel,
  carregarIndice,
  esquecerIndice,
  indiceJaCarregado,
  procurarDocumentos,
} from "./documentos";
import { NOME_MANIFESTO } from "@/lib/estatico/emitir";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";

/**
 * O que estes testes guardam é o BOTÃO DE INTERROMPER.
 *
 * O N8 exige, por escrito, que ele interrompa de verdade em vez de esconder
 * a resposta — e a diferença entre as duas coisas é invisível na tela: as
 * duas fazem a mensagem sumir. A única forma de provar a diferença é contar
 * requisições e olhar o `signal` que cada uma recebeu, que é o que
 * `fetchFalso` abaixo faz.
 *
 * `fetch` é substituído em vez de tocar a rede: `public/busca-indice/**` é
 * artefato de build e não existe em worktree nenhum desta máquina (precisa
 * do Postgres local, que está fora — Neon em 402).
 */

/** Manifesto de duas fatias, o mínimo para testar abort ENTRE fatias. */
function manifesto(fatias: number): ManifestoFatias {
  return {
    total: fatias,
    fatias,
    linhasPorFatia: Array(fatias).fill(1),
    bytesPorFatia: Array(fatias).fill(100),
    orcamentoBytes: 2 * 1024 * 1024,
    avisos: [],
  };
}

/** Índice mínimo, com um documento achável por "saude". */
const CORPO: Record<string, unknown> = {
  [`${BASE_INDICE}/docs/${NOME_MANIFESTO}`]: manifesto(1),
  [`${BASE_INDICE}/docs/0.json`]: [
    { i: 0, t: "Lei 1/2020", e: "Politica de saude", h: "/betim/prefeitura/legislacao", f: "cidades", m: "betim" },
  ],
  [`${BASE_INDICE}/vocabulario/${NOME_MANIFESTO}`]: manifesto(1),
  [`${BASE_INDICE}/vocabulario/0.json`]: [["saud", [0]]],
  [`${BASE_INDICE}/formas/${NOME_MANIFESTO}`]: manifesto(1),
  [`${BASE_INDICE}/formas/0.json`]: [["saude", 0]],
};

interface Chamada {
  url: string;
  signal: AbortSignal | undefined;
}

let chamadas: Chamada[] = [];

/**
 * `fetch` de mentira que RESPEITA o sinal — como o de verdade.
 *
 * Rejeitar com `AbortError` quando o sinal já está abortado é o
 * comportamento real da plataforma, e é justamente ele que o teste de
 * interrupção precisa exercitar: um dublê que ignora o sinal deixaria
 * passar um código que esquece de repassá-lo.
 */
function fetchFalso(corpo: Record<string, unknown> = CORPO, status404: string[] = []) {
  return vi.fn((entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada);
    const signal = init?.signal ?? undefined;
    chamadas.push({ url, signal });
    if (signal?.aborted) return Promise.reject(new DOMException("Interrompido", "AbortError"));
    if (status404.includes(url) || !(url in corpo)) {
      return Promise.resolve({ ok: false, status: 404 } as Response);
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => corpo[url] } as Response);
  });
}

beforeEach(() => {
  chamadas = [];
  esquecerIndice();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("carregarIndice — o sinal chega em toda requisicao", () => {
  it("passa o AbortSignal em TODA requisicao, nao so na primeira", () => {
    // Um sinal so no manifesto deixaria as fatias correndo depois do
    // clique em "interromper" — o download continuaria, invisivel.
    vi.stubGlobal("fetch", fetchFalso());
    const ctrl = new AbortController();
    return carregarIndice(ctrl.signal).then(() => {
      expect(chamadas.length).toBeGreaterThan(0);
      for (const c of chamadas) expect(c.signal).toBe(ctrl.signal);
    });
  });

  it("abortado antes de comecar nao emite requisicao de conteudo", async () => {
    vi.stubGlobal("fetch", fetchFalso());
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(carregarIndice(ctrl.signal)).rejects.toMatchObject({ name: "AbortError" });
    // Cada grupo tenta o manifesto e ja leva o `AbortError` do proprio
    // fetch; nenhuma FATIA chega a ser pedida.
    expect(chamadas.filter((c) => c.url.endsWith("0.json"))).toHaveLength(0);
  });

  it("interrompido NAO guarda indice pela metade", async () => {
    vi.stubGlobal("fetch", fetchFalso());
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(carregarIndice(ctrl.signal)).rejects.toThrow();
    // Indice pela metade nao serve para busca nenhuma: um termo pode estar
    // so na ultima fatia do vocabulario. Guardar seria pior que nao ter.
    expect(indiceJaCarregado()).toBe(false);
  });
});

describe("carregarIndice — indice ausente nao e erro de rede", () => {
  it("manifesto 404 vira IndiceIndisponivel dizendo que nao foi publicado", async () => {
    vi.stubGlobal("fetch", fetchFalso({}, []));
    const ctrl = new AbortController();
    const erro = await carregarIndice(ctrl.signal).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(IndiceIndisponivel);
    expect((erro as IndiceIndisponivel).status).toBe(404);
    // A frase importa: e o estado normal de `next dev` sem Postgres, e
    // chamar isso de "erro de conexao" manda alguem depurar a rede a toa.
    expect((erro as IndiceIndisponivel).message).toContain("não foi publicado");
    expect((erro as IndiceIndisponivel).message).toContain("navegação por páginas continua");
  });

  it("HTTP diferente de 404 diz o status em vez de inventar causa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 503 } as Response))
    );
    const erro = await carregarIndice(new AbortController().signal).catch((e: unknown) => e);
    expect((erro as IndiceIndisponivel).message).toContain("503");
  });
});

describe("procurarDocumentos", () => {
  it("acha documento e devolve o href da pagina, nunca um numero solto", async () => {
    vi.stubGlobal("fetch", fetchFalso());
    const r = await procurarDocumentos("saúde", new AbortController().signal);
    expect(r).toHaveLength(1);
    // O assistente linka a pagina; quem afirma o dado e a pagina.
    expect(r[0].doc.h).toBe("/betim/prefeitura/legislacao");
  });

  it("carrega uma vez por sessao — o segundo pedido nao toca a rede", async () => {
    vi.stubGlobal("fetch", fetchFalso());
    const sinal = new AbortController().signal;
    await procurarDocumentos("saúde", sinal);
    const depoisDoPrimeiro = chamadas.length;
    await procurarDocumentos("saúde", sinal);
    // 5 MB medidos (commit 1ce7f77) nao podem ser baixados de novo so
    // porque a pessoa voltou no menu e perguntou outra coisa.
    expect(chamadas.length).toBe(depoisDoPrimeiro);
  });

  it("consulta sem resultado devolve lista vazia, nao o acervo inteiro", async () => {
    vi.stubGlobal("fetch", fetchFalso());
    const r = await procurarDocumentos("hipopotamo", new AbortController().signal);
    expect(r).toEqual([]);
  });
});
