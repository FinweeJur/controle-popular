/**
 * @file espelho.test.ts
 * @description Guarda o espelho do companheiro: manifesto valido e zero segredo.
 *
 * O companheiro de desktop vive no fork `FinweeJur/clicky-ptbr` e e espelhado
 * em `companion/` por `scripts/sync-companion.mts`. Este teste garante que o
 * espelho esta presente, com commit registrado, e que nenhum arquivo com cara
 * de segredo (`.env`, `.pem`, `.key`, token) entrou junto.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Testes rodam com cwd em apps/web; a raiz do repo e dois niveis acima.
const RAIZ = path.resolve(process.cwd(), "..", "..");
const DIR_ESPELHO = path.join(RAIZ, "companion");

const SEGREDO = /(^|[\\/])\.env$|\.pem$|\.key$|service-account.*\.json$|token.*\.json$/i;

function listar(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listar(p) : [p];
  });
}

describe("espelho do companheiro", () => {
  it("tem manifesto com repo, commit e contagem", () => {
    const caminho = path.join(DIR_ESPELHO, "ESPELHO.json");
    expect(fs.existsSync(caminho)).toBe(true);

    const manifesto = JSON.parse(fs.readFileSync(caminho, "utf8")) as {
      repo: string;
      commit: string;
      arquivos: number;
    };
    expect(manifesto.repo).toBe("FinweeJur/clicky-ptbr");
    expect(manifesto.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(manifesto.arquivos).toBeGreaterThan(0);
  });

  it("nao espelha arquivo com cara de segredo", () => {
    const arquivos = listar(DIR_ESPELHO);
    expect(arquivos.filter((f) => SEGREDO.test(f))).toEqual([]);
  });
});
