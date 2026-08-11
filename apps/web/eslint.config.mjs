import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Globo 3D vendorizado (terras-devolutas/backend/static/globe, ver
    // apps/web/public/terras/globo/): app pronto, servido como arquivo
    // estático, não código-fonte deste projeto. Sem este ignore, o
    // three.module.js sozinho (vendorizado, minificado) derruba o lint com
    // centenas de erros de regra React/TS que não se aplicam a ele.
    "public/terras/globo/**",
  ]),
]);

export default eslintConfig;
