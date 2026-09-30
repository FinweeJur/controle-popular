import { describe, expect, test } from "vitest";
import {
  classificarHardware,
  type Hardware,
  modelosNecessarios,
  PERFIS,
  recomendarConfig,
} from "./perfis";

/**
 * Guardas da oficina.
 *
 * Errar o perfil para CIMA é o pior erro: o `home-pc` é a máquina de produção
 * do dono; um 7B em 8 GB sem GPU trava o PC e ninguém trabalha. Estes testes
 * fixam o piso conservador.
 */
describe("classificarHardware", () => {
  const casos: { hw: Hardware; esperado: "leve" | "medio" | "forte" }[] = [
    { hw: { ramGb: 4, cpus: 2, temGpu: false }, esperado: "leve" },
    { hw: { ramGb: 8, cpus: 4, temGpu: false }, esperado: "leve" },
    { hw: { ramGb: 16, cpus: 4, temGpu: false }, esperado: "leve" }, // i7-3770-like
    { hw: { ramGb: 16, cpus: 8, temGpu: false }, esperado: "medio" },
    { hw: { ramGb: 64, cpus: 16, temGpu: true }, esperado: "forte" },
    { hw: { ramGb: 32, cpus: 8, temGpu: true }, esperado: "forte" },
    { hw: { ramGb: 32, cpus: 8, temGpu: false }, esperado: "medio" }, // sem GPU não sobe
  ];

  test.each(casos)("classifica $hw", ({ hw, esperado }) => {
    expect(classificarHardware(hw)).toBe(esperado);
  });
});

describe("recomendarConfig", () => {
  test("perfil leve é single-thread e usa modelo de 1B", () => {
    const perfil = recomendarConfig({ ramGb: 8, cpus: 4, temGpu: false });
    expect(perfil.id).toBe("leve");
    expect(perfil.maxParalelo).toBe(1);
    expect(perfil.modelos.resumo).toBe("llama3.2:1b");
  });
});

describe("modelosNecessarios", () => {
  test("não repete modelo", () => {
    for (const perfil of Object.values(PERFIS)) {
      const modelos = modelosNecessarios(perfil);
      expect(new Set(modelos).size).toBe(modelos.length);
      expect(modelos.length).toBeGreaterThanOrEqual(2);
    }
  });
});
