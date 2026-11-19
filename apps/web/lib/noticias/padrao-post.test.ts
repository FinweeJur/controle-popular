import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { verificarPostServico } from "./padrao-post";

/**
 * O vigia do post de serviço roda duas vezes: aqui, na suíte, e no
 * `scripts/vigia-post-servico.mts`, no pre-commit. A lógica é uma só — este
 * teste é a catraca que impede a remoção silenciosa de countup, barras,
 * tabela interativa ou camada de jornal.
 */
const RAIZ = fileURLToPath(new URL("../../../..", import.meta.url));

describe("vigia do post de serviço (5.19)", () => {
  const resultado = verificarPostServico(RAIZ);

  it("componentes mantêm countup, barras, tabela interativa e camada de jornal", () => {
    expect(resultado.componentesOk, JSON.stringify(resultado.falhas, null, 1)).toBe(true);
  });

  it("todo post de serviço publicado desde 2026-11-17 cumpre o padrão", () => {
    expect(resultado.falhas, JSON.stringify(resultado.falhas, null, 1)).toEqual([]);
  });
});
