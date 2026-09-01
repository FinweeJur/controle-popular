// Roda `vitest run` com a letra da unidade em MAIÚSCULA.
//
// ═══ POR QUE ESTE WRAPPER EXISTE ═══
//
// Medido em 01/09/2026: o vitest 4.1.9+ no Windows falha com
// `Error: Vitest failed to find the current suite` (ou
// `TypeError: Cannot read properties of undefined (reading 'config')`) quando
// o caminho de trabalho tem a letra da unidade em MINÚSCULO (`c:\devcoder`).
// É bug conhecido do vitest (issue #10692), corrigido só parcialmente: na
// árvore de dependências desta máquina o mesmo comando passa de `C:\` e cai
// de `c:\`. `npm test` não pode depender da caixa que o terminal digitou —
// no Windows `cd` aceita as duas, então quem roda de `c:\` recebia uma suíte
// quebrada sem aviso.
//
// O wrapper sobe a letra da unidade da raiz do workspace (só a letra, nada
// mais) e entrega o controle ao `vitest.mjs` instalado. Quem chama não muda
// nada: `npm run test:lib` e `npm test` continuam o caminho de sempre.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// `apps/web/scripts/testar-lib.mjs` → `web` é `apps/web` (cwd do vitest) e
// `raiz` é a raiz do monorepo (onde o npm hoistou `vitest` — o workspace
// não tem `node_modules` próprio, o `apps/web/node_modules` é junção).
const aqui = path.dirname(fileURLToPath(import.meta.url));
const web = path.dirname(aqui);
// `apps/web` → raiz do monorepo são DOIS níveis acima: `apps/web` → `apps` → raiz.
const raiz = path.dirname(path.dirname(web));
const normalizado = /^[a-z]:/.test(web) ? web[0].toUpperCase() + web.slice(1) : web;
const raizNormalizada = /^[a-z]:/.test(raiz) ? raiz[0].toUpperCase() + raiz.slice(1) : raiz;

process.chdir(normalizado);

const vitestMjs = path.join(raizNormalizada, "node_modules", "vitest", "vitest.mjs");
const resultado = spawnSync(
  process.execPath,
  [vitestMjs, "run", ...process.argv.slice(2)],
  { stdio: "inherit" }
);

process.exit(resultado.status ?? 1);
