import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ZONAS_PUBLICADAS, numeralPorExtenso, contagemZonasPublicadas } from "./zonas";

/**
 * Este arquivo abre jurando "NENHUM texto aqui diz quantas frentes
 * existem" — e três telas quebravam essa promessa mesmo assim, cravando
 * "cinco" à mão: `FooterGlobal.tsx`, e `sobre/page.tsx` duas vezes. Nenhum
 * dos três dava erro — a contagem real também era 5 — então o defeito
 * ficou invisível até alguém publicar a sexta frente.
 *
 * Mesma classe de falha que `taxa-erro-g0.test.ts` já travou para o card
 * de terras (30% digitado à mão): número que devia vir de contagem
 * publicado como texto solto, e são dias errado até alguém notar.
 */
describe("a contagem de frentes vive num lugar só", () => {
  test("a tabela por extenso cobre a contagem publicada hoje", () => {
    // Se `ZONAS_PUBLICADAS.length` passar do que `numeralPorExtenso`
    // cobre, a função ainda funciona (cai pro algarismo) — mas aqui é
    // decisão de quem publica a frente nova, não descoberta silenciosa de
    // quem lê a tela depois.
    const n = ZONAS_PUBLICADAS.length;
    expect(numeralPorExtenso(n)).not.toBe(String(n));
  });

  test("contagemZonasPublicadas() bate com o tamanho real da lista", () => {
    expect(contagemZonasPublicadas()).toBe(numeralPorExtenso(ZONAS_PUBLICADAS.length));
    // Medido agora: 6 frentes publicadas (a sexta, Paraopeba, entrou em
    // 13/08). Se este teste falhar por causa desta linha, é porque a
    // contagem mudou — atualize aqui a propósito, não porque a função
    // quebrou.
    expect(ZONAS_PUBLICADAS.length).toBe(6);
    expect(contagemZonasPublicadas()).toBe("seis");
  });

  const TELAS_QUE_JA_CRAVARAM: Array<{ arquivo: string[]; padroes: RegExp[] }> = [
    {
      arquivo: ["..", "app", "components", "FooterGlobal.tsx"],
      padroes: [/as cinco frentes/i],
    },
    {
      arquivo: ["..", "app", "sobre", "page.tsx"],
      padroes: [/as cinco frentes/i, /organiza em cinco frentes/i],
    },
  ];

  test.each(TELAS_QUE_JA_CRAVARAM)(
    "$arquivo não crava o numeral fora de comentário",
    ({ arquivo, padroes }) => {
      const fonte = readFileSync(path.resolve(__dirname, ...arquivo), "utf8");
      // Mesma técnica de `taxa-erro-g0.test.ts`: tira comentário antes de
      // procurar, porque ESTE PRÓPRIO teste e os comentários do código
      // citam "cinco frentes" de propósito, para contar a história do
      // defeito — só o texto que a tela renderiza importa aqui.
      const semComentarios = fonte
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const padrao of padroes) {
        expect(
          padrao.test(semComentarios),
          `${arquivo.join("/")} crava "${padrao}" em vez de usar contagemZonasPublicadas()`
        ).toBe(false);
      }
      // E a tela PRECISA estar de fato lendo a função — sem isso, o teste
      // acima passaria só por acaso (ex.: alguém tirar a palavra "frentes").
      expect(
        semComentarios.includes("contagemZonasPublicadas"),
        `${arquivo.join("/")} não importa/usa contagemZonasPublicadas()`
      ).toBe(true);
    }
  );
});
