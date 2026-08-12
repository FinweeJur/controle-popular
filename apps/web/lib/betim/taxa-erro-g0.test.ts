import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { TAXA_ERRO_G0 } from "./taxa-erro-g0";
import { ZONAS } from "@/lib/zonas";

/**
 * A taxa de erro do gate G0 não pode aparecer digitada à mão em lugar nenhum.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * `taxa-erro-g0.ts` diz de si mesmo que é constante única "para a tela por
 * cidade e o hub da zona não poderem divergir". Isso era uma promessa em
 * prosa, e ela foi quebrada: até 12/08 o card da porta de entrada
 * (`lib/zonas.ts`) trazia `"30% da amostra checada a olho"` escrito à mão,
 * enquanto a constante era importada por um único componente.
 *
 * O defeito não fazia barulho — os dois números eram iguais. Ele só apareceria
 * na PRÓXIMA rodada do gate, quando a taxa mudasse e o card continuasse
 * anunciando 30% com toda a confiança. Num portal que cobra dos outros que
 * publiquem número com margem, é o pior tipo de erro: silencioso e no texto
 * mais lido.
 *
 * Promessa em comentário não segura nada. Este teste segura.
 */
describe("a taxa do gate G0 vive num lugar só", () => {
  test("os números derivados batem com os medidos", () => {
    const t = TAXA_ERRO_G0;
    // 12/40 = 30,0%. Se alguém mexer num sem mexer no outro, para aqui.
    expect(+((t.falsoPositivos / t.julgados) * 100).toFixed(1)).toBe(t.taxaPct);
    expect(+((t.dirigido.falsoPositivos / t.dirigido.julgados) * 100).toFixed(1))
      .toBe(t.dirigido.taxaPct);
    // O intervalo contém o ponto estimado — guarda contra troca de um só lado.
    expect(t.ic95[0]).toBeLessThan(t.taxaPct);
    expect(t.ic95[1]).toBeGreaterThan(t.taxaPct);
  });

  test("o recorte dirigido NÃO é somado à taxa publicada", () => {
    const t = TAXA_ERRO_G0;
    // O dirigido escolhe as áreas mais compactas de propósito — justamente a
    // forma que o erro (faixa de estrada) não tem. Ele descreve o melhor caso.
    // Somar os dois daria 18/63 = 28,6%, que parece mais preciso e é menos
    // interpretável. A taxa publicada é, e só pode ser, a do sorteio aleatório.
    expect(t.julgados).toBe(40);
    expect(t.taxaPct).toBe(30);
    const somaIndevida = ((t.falsoPositivos + t.dirigido.falsoPositivos)
      / (t.julgados + t.dirigido.julgados)) * 100;
    expect(t.taxaPct).not.toBe(+somaIndevida.toFixed(1));
  });

  test("o teto de aceitação é decisão, não medição — e está acima da taxa", () => {
    // Se a taxa passar o teto, o portal tem de dizer que NÃO deveria estar
    // publicado (ver TaxaDeErroTerras.tsx). O teste não impede isso; só
    // garante que a comparação continue possível.
    expect(typeof TAXA_ERRO_G0.criterioPct).toBe("number");
    expect(TAXA_ERRO_G0.criterioPct).toBeGreaterThan(0);
  });

  test("nenhuma descrição de zona repete a taxa digitada à mão", () => {
    // O caso real: `zonas.ts` trazia "30%" fixo. Agora interpola a constante,
    // então o número aparece — o que este teste barra é ele aparecer sem
    // acompanhar a constante. Muda-se `taxaPct` e o texto muda junto; se
    // alguém voltar a digitar, o valor antigo sobra aqui.
    const fonte = readFileSync(
      path.resolve(__dirname, "..", "zonas.ts"), "utf8",
    );
    // Procura percentuais literais só na parte de CÓDIGO, ignorando os
    // comentários — que citam o histórico do defeito de propósito.
    const semComentarios = fonte
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const literais = semComentarios.match(/\b\d{1,3}(?:,\d)?%/g) ?? [];
    expect(literais, `percentual digitado à mão em zonas.ts: ${literais.join(", ")}`)
      .toEqual([]);
  });

  test("o texto publicado do card carrega a taxa da constante", () => {
    const terras = ZONAS.find((z) => z.id === "terras");
    expect(terras).toBeDefined();
    expect(terras!.descricao).toContain(`${TAXA_ERRO_G0.taxaPct}%`);
  });
});
