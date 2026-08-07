/**
 * Nenhum slug de cidade pode colidir com uma rota estática da raiz.
 *
 * npx tsx --env-file=.env.local scripts/rotas-reservadas.mts
 *
 * POR QUE ISTO EXISTE: as zonas moram em segmentos ESTÁTICOS (`/congresso`,
 * `/judiciario`, `/ambiental`) e as cidades no segmento DINÂMICO
 * `app/[municipio]`. O Next resolve estático antes de dinâmico, então a
 * zona sempre ganha — e é justamente esse o problema: no dia em que uma
 * cidade nascer com o slug de uma zona, a cidade fica INALCANÇÁVEL, sem
 * erro nenhum. O build passa, a rota existe, e o que aparece é a outra
 * página. Não é hipótese remota: o slug sai de `branding.slug` no banco,
 * digitado à mão numa migration de seed.
 *
 * O inverso também: `dynamicParams = false` em `app/[municipio]/layout.tsx`
 * fecha `/qualquercoisa`, mas não protege a cidade contra a zona.
 *
 * A lista de reservadas sai do DISCO (as pastas de `app/`), não de uma
 * constante — pasta nova entra sozinha, sem ninguém lembrar deste arquivo.
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { listarCidades } from "../lib/db/queries/municipios.js";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const reservadas = new Set(
  readdirSync(join(raiz, "app"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    // `[municipio]` é o próprio segmento dinâmico; `components` e `fonts`
    // não viram rota (não têm page.tsx), mas reservar não custa nada e uma
    // cidade chamada "components" seria bizarra o bastante para barrar.
    .filter((d) => !d.name.startsWith("[") && !d.name.startsWith("_"))
    .map((d) => d.name)
);

console.log(`Rotas estáticas na raiz: ${[...reservadas].sort().join(", ")}\n`);

const cidades = await listarCidades();
if (cidades.length === 0) {
  console.error("FALHA  listarCidades() devolveu vazio — sem banco, este teste não prova nada.");
  console.error("       Rodar com --env-file=.env.local. Falhando de propósito: teste cego");
  console.error("       que passa é pior do que teste que não roda.");
  process.exit(1);
}

let colisoes = 0;
for (const cidade of cidades) {
  if (reservadas.has(cidade.slug)) {
    console.error(
      `  COLISÃO  cidade "${cidade.nome}" (${cidade.id_municipio}) tem slug "${cidade.slug}", ` +
        `que é uma rota estática — /${cidade.slug} nunca vai chegar na cidade.`
    );
    colisoes++;
  } else {
    console.log(`  OK       ${cidade.slug}`);
  }
}

console.log(`\n${cidades.length} cidade(s) conferida(s), ${colisoes} colisão(ões).`);
if (colisoes > 0) process.exit(1);
