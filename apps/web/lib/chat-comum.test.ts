import { describe, expect, test } from "vitest";

import { ipDoVisitante } from "./chat-comum";

/**
 * O rate limit do assistente (`permitido()`, em chat-comum.ts) só vale
 * alguma coisa se o IP que ele conta for um que o cliente não escolhe.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Medido: a Cloudflare ACRESCENTA o IP real ao FIM de `X-Forwarded-For`,
 * não substitui. Ler `X-Forwarded-For.split(",")[0]` pega o valor que o
 * PRÓPRIO CLIENTE mandou — qualquer um manda um XFF diferente a cada
 * requisição e ganha um balde novo por vez. `CF-Connecting-IP` é a borda
 * quem escreve sempre, e é isso que precisa vencer quando os dois chegam
 * juntos.
 */
describe("ipDoVisitante", () => {
  test("usa CF-Connecting-IP quando presente — é a borda quem escreve, não falsificável", () => {
    const req = new Request("http://localhost/api/chat", {
      headers: { "cf-connecting-ip": "203.0.113.9" },
    });
    expect(ipDoVisitante(req)).toBe("203.0.113.9");
  });

  test("CF-Connecting-IP vence mesmo com X-Forwarded-For forjado presente junto", () => {
    // Este é o ataque que a Fase anterior deixava passar: um XFF diferente
    // a cada requisição, para o rate limit nunca fechar o balde de ninguém.
    const req = new Request("http://localhost/api/chat", {
      headers: {
        "cf-connecting-ip": "203.0.113.9",
        "x-forwarded-for": "1.2.3.4, 203.0.113.9",
      },
    });
    expect(ipDoVisitante(req)).toBe("203.0.113.9");
  });

  test("sem CF-Connecting-IP (dev local, sem borda), cai para o primeiro X-Forwarded-For", () => {
    const req = new Request("http://localhost/api/chat", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    expect(ipDoVisitante(req)).toBe("127.0.0.1");
  });

  test("sem cabeçalho nenhum, devolve 'anon' em vez de quebrar", () => {
    const req = new Request("http://localhost/api/chat");
    expect(ipDoVisitante(req)).toBe("anon");
  });
});
