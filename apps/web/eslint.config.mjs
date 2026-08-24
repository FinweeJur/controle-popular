import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import nextPlugin from "@next/eslint-plugin-next";

/**
 * ═══ DEDUPE DO `no-html-link-for-pages` (bug upstream, 2026-08-23) ═══
 *
 * Sintoma: 986 reports para 70 âncoras reais (~14× cada).
 *
 * Causa-raiz medida (@next/eslint-plugin-next 16.2.12 E 16.3.2, dist/rules/
 * no-html-link-for-pages.js): `allUrlRegex.forEach(foundUrl => { if
 * (foundUrl.test(href)) context.report() })` — a regra REPORTA UMA VEZ POR
 * REGEX DE ROTA que casa com o href. Este app tem 14 páginas opcionais-
 * catch-all cujo regex gerado é idêntico (`/^\/((?!…\..+).*?)$/`) e casa
 * com QUALQUER caminho interno, então um `<a href="/">` recebia 15 reports
 * idênticos e links mais fundos recebiam 14 ou menos, conforme a profundidade.
 * Testado contra 16.3.2: `getUrlFromAppDirectory('/')` continua devolvendo
 * os 15 regexes duplicados.
 *
 * O WRAPPER abaixo NÃO DESLIGA a detecção: executa a regra original e
 * descarta apenas mensagem repetida para o MESMO nó (linha:coluna|texto).
 * Resultado: uma mensagem por âncora de verdade.
 *
 * Severidade `warn`, deliberadamente: os ~70 `<a>` internos remanescentes
 * são majoritariamente INTENCIONAIS — o repositório documenta o padrão
 * "<a> puro, não o Link de zona" (ver `lib/betim/link.tsx`,
 * `lib/betim/basePath.ts` e os comentários nas telas): converter em massa
 * para `next/link` trocaria navegação client-side por reload e ignoraria o
 * prefixo de zona; converter para o Link de zona fora da zona Cidades
 * exigiria o wrapper certo de cada frente. É dívida real, sinalizada como
 * warning legítimo — errado seria esconder atrás de `off`.
 */
const regraNoHtmlLinkDedup = (() => {
  const original = nextPlugin.rules["no-html-link-for-pages"];
  return {
    ...original,
    create(context) {
      // Cópia do contexto com TODAS as propriedades (próprias e herdadas),
      // substituindo apenas `report` por uma versão que ignora mensagem
      // repetida para o mesmo nó. Proxy não serve aqui: `report` é
      // read-only/non-configurable no contexto do ESLint 9.
      const vistos = new Set();
      const ctx = {};
      for (const fonte of [context, Object.getPrototypeOf(context)]) {
        if (!fonte) continue;
        for (const chave of Reflect.ownKeys(fonte)) {
          if (chave === "report" || chave === "constructor") continue;
          if (chave in ctx) continue;
          const d = Object.getOwnPropertyDescriptor(fonte, chave);
          if (!d) continue;
          if ("value" in d) {
            ctx[chave] = typeof d.value === "function" ? d.value.bind(context) : d.value;
          } else if (d.get) {
            Object.defineProperty(ctx, chave, d);
          }
        }
      }
      ctx.report = (desc) => {
        const start = desc.node?.loc?.start;
        const chave = `${start?.line}:${start?.column}|${desc.message ?? ""}`;
        if (vistos.has(chave)) return;
        vistos.add(chave);
        context.report(desc);
      };
      return original.create(ctx);
    },
  };
})();

/** Remove SOMENTE a chave da regra dos presets (os outros ~20 rules do
 *  bloco `@next/next` — no-img-element, no-sync-scripts… — continuam). */
function semNoHtmlLinkForPages(blocos) {
  return blocos.map((b) =>
    b.rules && "@next/next/no-html-link-for-pages" in b.rules
      ? {
          ...b,
          rules: Object.fromEntries(
            Object.entries(b.rules).filter(
              ([k]) => k !== "@next/next/no-html-link-for-pages"
            )
          ),
        }
      : b
  );
}

const eslintConfig = defineConfig([
  ...semNoHtmlLinkForPages(nextVitals),
  ...semNoHtmlLinkForPages(nextTs),
  {
    // Convenção do repo para "intencionalmente sem uso": prefixo _
    // (parâmetros de callback ignorados, rest-sibling de destructure).
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "next-no-html-dedup": { rules: { "no-html-link-for-pages": regraNoHtmlLinkDedup } },
    },
    rules: { "next-no-html-dedup/no-html-link-for-pages": "warn" },
  },
  {
    // ═══ Exceção pontual: scripts de paridade Supabase×Neon ═══
    // Comparam linhas de shape ARBITRÁRIO entre dois bancos, campo a campo,
    // via JSON.stringify — tipar exigiria espelhar os schemas dos dois
    // lados em ferramentas de uso esporádico. `any` aqui é o contrato real
    // ("linha qualquer"); reavaliar se virarem rotina de produção.
    files: ["scripts/_sonda.mts", "scripts/paridade-*.mts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".open-next/**",
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
