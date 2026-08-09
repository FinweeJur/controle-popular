import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Roda só as funções puras de `lib/` — nada de banco, nada de rede.
 * O alias `@/*` espelha `tsconfig.json`, senão os imports do app não resolvem.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
