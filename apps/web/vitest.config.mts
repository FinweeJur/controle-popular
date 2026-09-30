import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Roda só as funções puras de `lib/` — nada de banco, nada de rede.
 * O alias `@/*` espelha `tsconfig.json`, senão os imports do app não resolvem.
 *
 * ⚠️ `__dirname` NÃO pode voltar aqui. Medido em 01/09/2026: o Vite 7 carrega
 * este config com `configLoader: 'native'` (ESM), onde `__dirname` não existe —
 * o config quebra no load e QUALQUER teste falha com
 * `TypeError: Cannot read properties of undefined (reading 'config')` antes de
 * rodar (era o que fazia `npm test` cair em todos os arquivos). O
 * `fileURLToPath(import.meta.url)` resolve o diretório nas duas formas.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "."),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/laboratorio/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Paralelismo ENTRE ARQUIVOS — medido em 30/09/2026: a suíte lib caiu de
    // ~120-160 s (serial) para ~20 s, verde (218 arquivos, 2.154 testes). Cada
    // arquivo já roda isolado no próprio worker, então o paralelismo não muda
    // o resultado — muda só quanto tempo a máquina leva. Se um dia aparecer
    // flakiness por disputa de recurso (porta, arquivo), o remédio é marcar o
    // teste culpado com `sequential`/`describe.sequential`, NÃO desligar isto.
    fileParallelism: true,
  },
});
