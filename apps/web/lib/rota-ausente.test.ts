import { describe, expect, test } from "vitest";

import {
  DESTINOS_SEM_ASSISTENTE,
  lerJsonDaRota,
  lerRespostaDoAssistente,
} from "./rota-ausente";

/**
 * A linha que estes testes guardam é UMA: distinguir "esta cópia do site não
 * tem essa rota" de "a rota existe e falhou".
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * O portal é publicado de duas formas, e no alvo `output: 'export'` as rotas
 * `*.din.ts` não são geradas (decisão do `next.config.ts`). O `fetch` do
 * cliente recebia o 404 em HTML, `res.json()` estourava, o `catch` dizia
 * "Falha de conexão. Tente de novo." — e o leitor ia depurar a própria rede
 * por causa de uma função que aquele build nunca teve.
 *
 * O modo de falha que isto impede de voltar é o INVERSO também, e é o pior
 * dos dois: tratar 429 ou 502 como "rota ausente" esconderia um portal que
 * está no ar e apenas limitou a taxa, mandando a pessoa embora para /busca
 * quando bastava esperar um minuto.
 */
function resposta(corpo: string, init: ResponseInit): Response {
  return new Response(corpo, init);
}

const JSON_H = { "Content-Type": "application/json" };
const HTML_H = { "Content-Type": "text/html" };

describe("lerJsonDaRota — rota que não existe neste build", () => {
  test("404 é ausente, sem sequer tentar ler o corpo", async () => {
    // O 404 do GitHub Pages: caminho não emitido no export.
    const r = await lerJsonDaRota(resposta("<!DOCTYPE html><h1>404</h1>", {
      status: 404,
      headers: HTML_H,
    }));
    expect(r.tipo).toBe("ausente");
  });

  test("405 é ausente — host estático que recusa o POST", async () => {
    const r = await lerJsonDaRota(resposta("", { status: 405 }));
    expect(r.tipo).toBe("ausente");
  });

  test("200 com corpo HTML é ausente: rota nossa SEMPRE devolve JSON", async () => {
    // Caso real de host estático que serve a página de 404 com status 200.
    // Sem esta regra, `res.json()` estouraria e cairia no catch de rede.
    const r = await lerJsonDaRota(resposta("<!DOCTYPE html><h1>Not found</h1>", {
      status: 200,
      headers: HTML_H,
    }));
    expect(r.tipo).toBe("ausente");
  });

  test("200 com JSON é ok, e devolve os dados", async () => {
    const r = await lerJsonDaRota<{ sugestoes: { titulo: string }[] }>(
      resposta(JSON.stringify({ sugestoes: [{ titulo: "Contratos" }] }), {
        status: 200,
        headers: JSON_H,
      })
    );
    expect(r.tipo).toBe("ok");
    if (r.tipo === "ok") expect(r.dados.sugestoes[0].titulo).toBe("Contratos");
  });
});

describe("lerRespostaDoAssistente — erro de rota VIVA continua chegando", () => {
  test("429 do rate limit é erro, não ausência", async () => {
    // A distinção que importa: aqui a rota existe e a espera resolve. Marcar
    // isto como "ausente" mandaria a pessoa para outra página por causa de um
    // limite de um minuto.
    const r = await lerRespostaDoAssistente(
      resposta(
        JSON.stringify({ erro: "Muitas perguntas em pouco tempo. Espere um minuto e tente de novo." }),
        { status: 429, headers: JSON_H }
      )
    );
    expect(r.tipo).toBe("erro");
    if (r.tipo === "erro") expect(r.texto).toContain("Espere um minuto");
  });

  test("502 do provedor de IA é erro, não ausência", async () => {
    const r = await lerRespostaDoAssistente(
      resposta(JSON.stringify({ erro: "O assistente está indisponível no momento." }), {
        status: 502,
        headers: JSON_H,
      })
    );
    expect(r.tipo).toBe("erro");
  });

  test("resposta sem IA (semIa) é resposta de verdade, e o sinal sobrevive", async () => {
    // Degradação HONESTA que já existia no servidor (`lib/chat-comum.ts` sem
    // AI_API_KEY): devolve o dado do banco e avisa que não há IA. Não pode ser
    // confundida com rota ausente — aqui veio conteúdo real.
    const r = await lerRespostaDoAssistente(
      resposta(JSON.stringify({ resposta: "Contrato X: R$ 1,2 mi.", semIa: true }), {
        status: 200,
        headers: JSON_H,
      })
    );
    expect(r.tipo).toBe("resposta");
    if (r.tipo === "resposta") {
      expect(r.semIa).toBe(true);
      expect(r.texto).toContain("R$ 1,2 mi");
    }
  });

  test("404 em HTML vira ausente — o defeito original, travado", async () => {
    const r = await lerRespostaDoAssistente(
      resposta("<!DOCTYPE html><title>Site not found</title>", {
        status: 404,
        headers: HTML_H,
      })
    );
    expect(r.tipo).toBe("ausente");
  });

  test("JSON 200 sem `resposta` nem `erro` é erro, nunca ausente", async () => {
    // Corpo malformado de rota que EXISTE. Chamar de ausente esconderia um
    // defeito de servidor atrás de "esta cópia não tem a função".
    const r = await lerRespostaDoAssistente(
      resposta(JSON.stringify({}), { status: 200, headers: JSON_H })
    );
    expect(r.tipo).toBe("erro");
  });
});

describe("DESTINOS_SEM_ASSISTENTE", () => {
  test("aponta para caminho de RAIZ, não para dentro de uma zona", async () => {
    // `/betim/busca` não existe. As duas páginas ficam fora de
    // `/[municipio]`, `/congresso` e `/judiciario` — e o reflexo de prefixar
    // com a zona atual é justamente o erro que este teste tranca.
    for (const d of DESTINOS_SEM_ASSISTENTE) {
      expect(d.href.startsWith("/")).toBe(true);
      expect(d.href.split("/").filter(Boolean)).toHaveLength(1);
    }
  });

  test("são as duas páginas que funcionam sem servidor", async () => {
    const hrefs = DESTINOS_SEM_ASSISTENTE.map((d) => d.href);
    expect(hrefs).toContain("/busca");
    expect(hrefs).toContain("/assistente");
  });
});
