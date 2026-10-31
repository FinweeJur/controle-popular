/**
 * @file apps/web/lib/vigia-fonte-minima.test.ts
 * @description Teste automatizado para garantir fonte mínima de 12px (§5.16).
 */

import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

describe("Vigia de Tipografia — Tamanho Mínimo de Fonte (§5.16)", () => {
  it("nenhum arquivo do portal possui texto com fonte inferior a 12px (text-xs / 0.75rem)", () => {
    const raiz = path.resolve(__dirname, "../../..");
    const saida = execSync("npx tsx scripts/vigia-fonte-minima.mts", {
      cwd: raiz,
      encoding: "utf-8",
    });
    expect(saida).toContain("Nenhuma fonte menor que 12px encontrada no portal");
  });
});
