/**
 * @file falas.test.ts
 * @description Régua do catálogo de falas do companheiro (AGENTS §5.9: o
 * código diz como; o teste guarda o porquê). Garante que:
 *   - todo pet do Petdex tenha fala (nenhum bicho mudo);
 *   - slug desconhecido caia na fala padrão;
 *   - o texto seja curto, de uma linha, sem sobra de espaço;
 *   - a transcrição das falas aprovadas não mude por acidente.
 */

import { describe, expect, it } from "vitest";
import { PETS_COMPANHEIRO } from "../../app/components/companheiroPets";
import { FALAS, FALAS_PADRAO, escolherFala, falaPara } from "./falas";

describe("cobertura do catálogo de falas", () => {
  it("todo slug conhecido tem pelo menos uma fala", () => {
    for (const pet of PETS_COMPANHEIRO) {
      expect(FALAS[pet.slug], `pet sem fala: ${pet.slug}`).toBeDefined();
      expect(falaPara(pet.slug).length).toBeGreaterThan(0);
    }
  });

  it("o mapa não tem slug de pet que não existe no Petdex", () => {
    const conhecidos = new Set(PETS_COMPANHEIRO.map((p) => p.slug));
    for (const slug of Object.keys(FALAS)) {
      expect(conhecidos.has(slug), `fala órfã: ${slug}`).toBe(true);
    }
  });

  it("slug desconhecido cai na fala padrão", () => {
    expect(falaPara("pet-que-nao-existe")).toBe(FALAS_PADRAO);
    expect(FALAS_PADRAO.length).toBeGreaterThan(0);
  });
});

describe("formato das falas", () => {
  it("cada fala é uma linha curta e sem espaço sobrando", () => {
    for (const [slug, lista] of Object.entries(FALAS)) {
      for (const fala of lista) {
        expect(typeof fala, `${slug} com fala não-texto`).toBe("string");
        expect(fala.length, `${slug} com fala vazia`).toBeGreaterThan(3);
        expect(fala.length, `${slug} com fala longa demais`).toBeLessThanOrEqual(140);
        expect(fala, `${slug} com quebra de linha`).not.toMatch(/[\r\n]/);
        expect(fala, `${slug} com espaço nas pontas`).toBe(fala.trim());
      }
    }
  });

  it("a fala padrão também segue o formato", () => {
    for (const fala of FALAS_PADRAO) {
      expect(fala.length).toBeGreaterThan(3);
      expect(fala.length).toBeLessThanOrEqual(140);
      expect(fala).toBe(fala.trim());
    }
  });
});

describe("escolherFala", () => {
  it("sorteia dentro da lista do pet com a aleatoriedade injetada", () => {
    expect(escolherFala("qiaowei", () => 0)).toBe(FALAS.qiaowei[0]);
    expect(escolherFala("qiaowei", () => 0.99)).toBe(
      FALAS.qiaowei[FALAS.qiaowei.length - 1],
    );
  });

  it("pet de fala única devolve sempre a mesma", () => {
    expect(escolherFala("bubu-3", () => 0.5)).toBe(FALAS["bubu-3"][0]);
  });

  it("slug desconhecido sorteia da lista padrão", () => {
    expect(escolherFala("pet-que-nao-existe", () => 0)).toBe(FALAS_PADRAO[0]);
  });
});

describe("transcrição aprovada (guarda contra edição acidental)", () => {
  it("mantém a citação da Frida no qiaowei", () => {
    expect(FALAS.qiaowei[0]).toBe(
      "Pés, para que os quero, se tenho asas para voar? — Frida Kahlo",
    );
  });

  it("mantém a fala da capivara", () => {
    expect(FALAS.capy).toContain(
      "Sou a capivara: amiga de todo mundo, até do jacaré.",
    );
  });
});
