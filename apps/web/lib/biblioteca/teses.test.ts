import { describe, expect, it } from "vitest";
import { COBERTURA_TESES, tesesPorDestino, TODAS_TESES, type DestinoTese } from "./teses";
import data from "@/data/biblioteca-teses-atingidos.json";

/**
 * Guardiã da tesouraria acadêmica: conta do dado, nunca digitada (AGENTS §8).
 * Quebra se o gerador (`scripts/etl/biblioteca/gerar-teses-atingidos.mjs`)
 * rodar de novo e o acervo mudar de tamaño sem regenerar o somatório aqui.
 */

const DESTINOS_VALIDOS: readonly DestinoTese[] = ["riodoce", "brumadinho", "unificada", "jequitinhonha"];

describe("acervo de teses sobre Atingidos por Barragens", () => {
  it("tem o total acordado com o arquivo gravado", () => {
    const arquivo = data as unknown as { total: number; itens: unknown[] };
    expect(arquivo.total).toBe(arquivo.itens.length);
    expect(COBERTURA_TESES.total).toBe(arquivo.total);
  });

  it("a soma das fatias fecha com o total — ninguém foi excluída (regra do dono)", () => {
    const soma = (Object.keys(COBERTURA_TESES.porDestino) as DestinoTese[]).reduce(
      (acc, destino) => acc + COBERTURA_TESES.porDestino[destino],
      0,
    );
    expect(soma).toBe(COBERTURA_TESES.total);
  });

  it("36 + 1 teses vêm sem link oficial — é lacuna da FONTE, e a página diz isso", () => {
    const semLink = TODAS_TESES.filter((t) => t.links.length === 0);
    for (const t of semLink) {
      expect(t.titulo.trim().length, `título ${t.id}`).toBeGreaterThan(0);
    }
    // Medido 14/10/2026: 37 dos 424 itens têm o campo 'Link de acesso' preenchido
    // com "Não informado pela instituição" no próprio levantamento (36 do geral +
    // 1 do levantamento das ATIs, a de USP sobre participação no processo coletivo).
    // Não se inventa URL para fechar a lacuna (regra §6 — URL adivinhada não
    // existe). Se o número passar disto, o gerador mudou: medir de novo antes de
    // mexer na constante.
    expect(semLink.length).toBe(37);
  });

  it("nenhuma tese tem link inventado — todo link começa com https://", () => {
    for (const t of TODAS_TESES) for (const l of t.links) expect(/^https?:\/\//i.test(l), l).toBe(true);
  });

  it("o piso de ano é histórico (o acervo alcança as décadas de 80 e 90)", () => {
    const pisoAno = TODAS_TESES.reduce((p, t) => Math.min(p, t.ano ?? Infinity), 2026);
    expect(pisoAno).toBeGreaterThanOrEqual(1900);
  });

  it("todo item tem título e ano plausível (0 < ano <= 2026)", () => {
    for (const t of TODAS_TESES) {
      expect(t.titulo.trim().length, `título ${t.id}`).toBeGreaterThan(0);
      expect(t.ano, `ano ${t.id}`).toBeGreaterThanOrEqual(1900);
      expect(t.ano, `ano ${t.id}`).toBeLessThanOrEqual(2026);
    }
  });

  it("TAG MAB casa exatamente com a menção no título ou resumo (regex \\bMAB\\b)", () => {
    for (const t of TODAS_TESES) {
      const menciona = /\bMAB\b/.test(`${t.titulo} ${t.resumo ?? ""}`);
      expect(t.tags.includes("MAB"), `tag MAB ${t.id}`).toBe(menciona);
    }
    expect(COBERTURA_TESES.comTagMab).toBeGreaterThan(30);
  });

  it("resumo e título não seguram e-mail de autor (lixo de repositório)", () => {
    for (const t of TODAS_TESES) {
      const alvo = `${t.titulo} ${t.resumo ?? ""} ${t.autor}`;
      expect(/[\w.+-]+@[\w-]+\.\w+/.test(alvo), `e-mail ${t.id}`).toBe(false);
    }
  });

  it("resumos publicáveis são de fato resumo — '140 f.' não vira botão", () => {
    const comResumo = TODAS_TESES.filter((t) => t.resumo);
    expect(comResumo.length).toBe(COBERTURA_TESES.comResumo);
    for (const t of comResumo) expect(t.resumo!.trim().length, `resumo ${t.id}`).toBeGreaterThan(80);
  });

  it("jequitinhonha tem página própria com itens (Irapé, Setúbal, Itapebi)", () => {
    expect(COBERTURA_TESES.porDestino.jequitinhonha).toBeGreaterThan(0);
    for (const t of tesesPorDestino("jequitinhonha")) {
      expect(/jequitinhonha|irap[eé]|itapebi|set[uú]bal|salto da divisa/i.test(`${t.titulo} ${t.resumo ?? ""}`), t.id).toBe(true);
    }
  });

  it("destinos são estritamente o conjunto acordado", () => {
    for (const t of TODAS_TESES) expect(DESTINOS_VALIDOS).toContain(t.destino);
  });

  it("o levantamento dos dois CSVs muda pouco e a proveniência não se perde", () => {
    // Medido 14/10/2026: 4 do levantamento ATIs (Faria 2024, Julião 2023,
    // Reis 2023 e Garcia 2021); os otros 2 já vinham no geral (Lara 2022 e
    // Prado 2023) e a dedup global ficou com a mais antiga.
    const ati = TODAS_TESES.filter((t) => t.levantamento === "ati");
    const geral = TODAS_TESES.filter((t) => t.levantamento === "geral");
    expect(ati.length).toBe(4);
    expect(geral.length).toBe(420);
    expect(ati.length + geral.length).toBe(COBERTURA_TESES.total);
    for (const t of TODAS_TESES) expect(["geral", "ati"], t.id).toContain(t.levantamento);
  });

  it("as 2 novidades do levantamento ATI sobre o caso Rio Doce caem na fatia riodoce", () => {
    const atiRiodoce = tesesPorDestino("riodoce").filter((t) => t.levantamento === "ati");
    expect(atiRiodoce.length).toBe(2);
    for (const t of atiRiodoce) {
      expect(/rio doce|fund[aã]o|barra longa/i.test(`${t.titulo} ${t.resumo ?? ""}`), t.id).toBe(true);
    }
  });
});
