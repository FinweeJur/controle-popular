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
    include: ["lib/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
