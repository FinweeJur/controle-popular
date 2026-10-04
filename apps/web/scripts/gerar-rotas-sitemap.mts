/**
 * Varre a árvore `app/` e congela o inventário de rotas públicas num
 * módulo TypeScript que entra no bundle — `lib/sitemap/rotas-descobertas.ts`.
 *
 * ═══ POR QUE ISSO EXISTE ═══
 *
 * O `sitemap.ts` era lista escrita à mão: 122 rotas anunciadas contra 220
 * páginas reais. Medido em 04/10/2026: **147 páginas fora do sitemap**
 * (`/ambiental/car`, as 27 páginas `/cidades/<uf>`, `/internacional`,
 * `/assembleias`...). Quem cria página nova não lembra de editar o sitemap,
 * e a lista só envelhece.
 *
 * ═══ POR QUE CONGELAR, E NÃO `fs` DENTRO DO `sitemap.ts` ═══
 *
 * `sitemap.ts` roda no runtime do standalone: o `Dockerfile` copia só
 * `.next/standalone` + `public` — a árvore `app/` não existe lá. Mesma
 * escolha de `gerar-cidades.mts` (banco → `.ts` versionado): o build é o
 * momento em que o disco tem o código, então é nele que o inventário
 * atravessa a fronteira. Versionar custa poucas dezenas de linhas e o diff
 * mostra exatamente qual página entrou.
 *
 * ═══ COMO RODAR ═══
 *
 *     cd apps/web
 *     npx tsx scripts/gerar-rotas-sitemap.mts
 *
 * Roda sozinho no `prebuild`. O teste guardião
 * (`lib/sitemap/rotas-descobertas.test.ts`) falha quando o arquivo ficou
 * velho em relação ao `app/` — a régua que a lista manual nunca teve.
 *
 * Regras de exclusão (pontes, `/offline`, `/admin`...) moram em
 * `lib/sitemap/descoberta.ts`, com o motivo de cada uma escrito.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { descobrir, EXCLUIR, EXCLUIR_SUFIXO } from "../lib/sitemap/descoberta.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_APP = path.join(AQUI, "..", "app");
const DESTINO = path.join(AQUI, "..", "lib", "sitemap", "rotas-descobertas.ts");
const LOG = "[gerar-rotas-sitemap]";

const { globais, sufixos } = descobrir(DIR_APP);

// Guarda contra varredura quebrada: uma lista vazia publicaria um sitemap
// sem nenhuma página fixa — o mesmo acidente que `gerar-cidades.mts` barra
// com a lista de cidades vazia.
if (globais.length < 50 || sufixos.length < 30) {
  console.error(
    `${LOG} ERRO: varredura desconfiada — ${globais.length} rotas globais, ` +
      `${sufixos.length} sufixos de cidade. Esperado ~140 e ~60.`
  );
  process.exit(1);
}

/** Lista TS legível, uma rota por linha, para o diff mostrar página a página. */
function lista(nome: string, rotas: string[], comentario: string): string {
  const corpo = rotas.map((r) => `  ${JSON.stringify(r)},`).join("\n");
  return `/**\n * ${comentario}\n */\nexport const ${nome}: readonly string[] = [\n${corpo}\n];\n`;
}

const motivoExcluir = (mapa: Record<string, string>): string[] =>
  Object.entries(mapa).map(([rota, motivo]) => ` *   ${rota} — ${motivo}`);

const texto = `/**
 * GERADO por \`scripts/gerar-rotas-sitemap.mts\` — NÃO edite à mão.
 *
 * Inventário das rotas públicas fixas do portal, varrido da árvore
 * \`apps/web/app/\` no build. Regenerar:
 *
 *     cd apps/web && npx tsx scripts/gerar-rotas-sitemap.mts
 *
 * O teste guardião (\`lib/sitemap/rotas-descobertas.test.ts\`) falha se este
 * arquivo divergir do \`app/\` — página nova sem regenerar aqui não passa
 * pela suíte. Regras e exclusões: \`lib/sitemap/descoberta.ts\`.
 *
 * Excluídas de propósito (motivo em \`descoberta.ts\`):
${motivoExcluir(EXCLUIR).join("\n")}
 *
 * Sufixos de cidade excluídos:
${motivoExcluir(EXCLUIR_SUFIXO).join("\n")}
 */

${lista("ROTAS_GLOBAIS", globais, "Rotas fixas da raiz do portal (`/cidades/mg`), fora de `[municipio]`. Cada entrada vira exatamente uma URL no sitemap.")}
${lista("SUFIXOS_CIDADE", sufixos, "Sufixos sob `[municipio]` (`/saude`), expandidos por cidade ativa no sitemap — mesma semântica de `ROTAS_CIDADE` em `app/sitemap.ts`.")}
`;

await writeFile(DESTINO, texto, "utf-8");
console.log(
  `${LOG} ✓ ${path.relative(process.cwd(), DESTINO)} — ` +
    `${globais.length} rotas globais, ${sufixos.length} sufixos de cidade`
);
