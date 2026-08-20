import { describe, expect, test } from "vitest";
import { SINTESE_AJRI } from "./sintese-ajri";

const CODIGO = /\d{5}-ACM-[A-Z0-9-]{8,}/;

/**
 * A síntese é conteúdo auditado que transpila para TS — o teste impede que a
 * integração corte, misture ou descaracterize a estrutura do texto-fonte
 * (`X:\DevCoder\_ajri\SINTESE-TEMATICA.md`, gerado por
 * `scripts/gerar-sintese-ajri.mts`). O gerador já aborta no mesmo conjunto de
 * checagens; aqui é a rede de segurança no arquivo versionado.
 */
describe("síntese temática da auditoria", () => {
  test("tem os 16 eixos, cada um com as quatro marcas preenchidas", () => {
    expect(SINTESE_AJRI.eixos).toHaveLength(16);
    for (const eixo of SINTESE_AJRI.eixos) {
      expect(eixo.titulo.length, `eixo sem título: ${eixo.titulo}`).toBeGreaterThan(0);
      expect(eixo.estadoGeral.length, `${eixo.titulo} sem estado geral`).toBeGreaterThan(20);
      expect(eixo.evolucao.length, `${eixo.titulo} sem evolução`).toBeGreaterThan(20);
      expect(eixo.achados.length, `${eixo.titulo} sem achados`).toBeGreaterThan(0);
      expect(eixo.numerosChave.length, `${eixo.titulo} sem números-chave`).toBeGreaterThan(10);
    }
  });

  test("todo achado cita um documento, exceto a negação documentada de varredura", () => {
    for (const eixo of SINTESE_AJRI.eixos) {
      for (const achado of eixo.achados) {
        const negacaoDeAusencia = /^Nenhuma? menção|^Nenhum dos relatórios/.test(achado);
        if (CODIGO.test(achado) || negacaoDeAusencia) continue;
        expect.fail(`Achado sem código no eixo '${eixo.titulo}': ${achado}`);
      }
    }
  });

  test("títulos dos eixos são únicos", () => {
    const titulos = SINTESE_AJRI.eixos.map((e) => e.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  test("tem as pendências transversais e as fragilidades do acervo", () => {
    expect(SINTESE_AJRI.transversais.length).toBeGreaterThanOrEqual(7);
    expect(SINTESE_AJRI.fragilidades.length).toBeGreaterThanOrEqual(6);
    for (const item of [...SINTESE_AJRI.transversais, ...SINTESE_AJRI.fragilidades]) {
      expect(item.titulo.length).toBeGreaterThan(0);
      expect(item.texto.length).toBeGreaterThan(20);
    }
  });

  test("resumo executivo é um parágrafo completo", () => {
    expect(SINTESE_AJRI.executivo.length).toBeGreaterThan(500);
  });
});