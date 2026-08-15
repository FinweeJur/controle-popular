/**
 * `next dev` com o ALVO ESTÁTICO ligado — o alvo que ninguém conseguia abrir.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * O portal é publicado de duas formas, e a diferença entre elas é grande: no
 * alvo GitHub Pages (`PAGES_BASE_PATH` definido) o `next.config.ts` troca
 * `pageExtensions` para `["tsx", "ts"]`, e TODA rota `*.din.ts` deixa de
 * existir — as três `api/chat`, as três `api/busca`, classificados, ofício,
 * painel de anúncios.
 *
 * O `npm run dev` sobe sempre o alvo Cloudflare, onde essas rotas existem.
 * Resultado prático: a cópia estática só era exercitada em produção, por
 * visitante. Foi assim que o assistente ficou respondendo "Falha de conexão.
 * Tente de novo." no GitHub Pages — um 404 de rota que aquele build nunca
 * teve, apresentado como problema de rede do leitor. Ver `lib/rota-ausente.ts`.
 *
 * `PAGES_BASE_PATH=""` (string vazia) e não um caminho: é exatamente o que o
 * `actions/configure-pages@v5` devolve quando há domínio próprio, que é o
 * caso de produção (controlepopular.com.br). E string vazia é valor legítimo
 * — o teste em `lib/alvo-de-build.ts` é `!== undefined` justamente por isso,
 * então definir assim LIGA o alvo estático sem inventar um basePath que a
 * produção não tem.
 *
 * ═══ O QUE ISTO NÃO É ═══
 *
 * Não é `next build`. Não gera o site estático nem valida
 * `generateStaticParams` — para isso é `PAGES_BASE_PATH= npm run build`, que
 * passa pelo `prebuild` e CONSULTA O BANCO. Aqui não há build, não há
 * prebuild e não há consulta: serve para ver a TELA do alvo estático, que é
 * onde moram os defeitos de degradação.
 *
 * Uso (porta própria por worktree, ver `.claude/launch.json`):
 *   node scripts/dev-alvo-estatico.mjs --port 3033
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raizWeb = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// `createRequire` e não um caminho montado à mão: este é um workspace npm, e
// `next` fica HOISTED na raiz do monorepo, não em `apps/web/node_modules`.
// Um `resolve(raizWeb, "node_modules/next/...")` funcionaria só por acidente
// de instalação.
const binNext = createRequire(resolve(raizWeb, "package.json")).resolve(
  "next/dist/bin/next"
);

const filho = spawn(process.execPath, [binNext, "dev", ...process.argv.slice(2)], {
  cwd: raizWeb,
  stdio: "inherit",
  env: { ...process.env, PAGES_BASE_PATH: process.env.PAGES_BASE_PATH ?? "" },
});

filho.on("exit", (codigo, sinal) => {
  if (sinal) process.kill(process.pid, sinal);
  else process.exit(codigo ?? 0);
});
