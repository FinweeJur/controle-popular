/**
 * Sincroniza com o `origin/main` e publica — o passo que faltava entre "há
 * commit novo no GitHub" e "o site mudou".
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `scripts/rotina-local.mts` builda e publica o que já está no checkout desta
 * máquina; ele não mexe em git. Isso é correto para a rotina das 06:00 (o
 * dono decide quando integrar), mas cria um buraco para o gatilho remoto: o
 * pedido "sincronize e publique" vindo de outra máquina (via
 * `gatilho-remoto.mts`) precisa da parte de git que a rotina não faz.
 *
 * ═══ O QUE ESTE SCRIPT NUNCA FAZ SOZINHO ═══
 *
 * - **Não publica com a árvore de trabalho suja.** Working tree com mudança
 *   não commitada aborta antes de tocar em qualquer coisa — pode ser trabalho
 *   de uma sessão manual em andamento, e um gatilho remoto não tem como saber
 *   se é seguro descartar ou incluir.
 * - **Não resolve conflito de merge.** `git merge --ff-only` primeiro; se
 *   as histórias divergiram de verdade, mede com `git merge-tree` se o merge
 *   seria limpo — só integra se for, e aborta relatando os arquivos em
 *   conflito quando não for. Resolver merge é julgamento, e julgamento não
 *   roda sem gente olhando.
 * - **Não força deploy.** Chama `rotina-local.mts --so-build`, sem
 *   `--forcar-deploy` — as travas de página e de tamanho de asset continuam
 *   valendo. Se alguma acender, este script reporta e para; forçar é decisão
 *   de quem está vendo o motivo, não de um gatilho automático.
 *
 * ═══ POR QUE `--so-build`, NÃO A ROTINA INTEIRA ═══
 *
 * O gatilho é para pegar código/conteúdo novo (commit do painel de edição,
 * merge de outra sessão) e republicar — não para rodar o ETL de novo. O ETL
 * já tem sua própria cadência mensal/semanal/diária em `etl-*.yml`, lida pela
 * própria rotina; repeti-la aqui só por causa de um sync de código bateria a
 * mesma fonte duas vezes no mesmo dia sem necessidade.
 *
 * Uso:
 *   npx tsx scripts/sincronizar-e-publicar.mts              # sync + build + deploy
 *   npx tsx scripts/sincronizar-e-publicar.mts --sem-deploy # sync + build, sem publicar
 */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const BANDEIRAS = new Set(["--sem-deploy"]);
for (const a of argv) {
  if (!BANDEIRAS.has(a)) {
    console.error(`argumento desconhecido: ${a}\nconhecidos: ${[...BANDEIRAS].join(" ")}`);
    process.exit(2);
  }
}
const SEM_DEPLOY = new Set(argv).has("--sem-deploy");

interface Resultado {
  ok: boolean;
  etapa: string;
  motivo: string;
  commitAntes?: string;
  commitDepois?: string;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf-8" }).trim();
}

function falhar(etapa: string, motivo: string): Resultado {
  return { ok: false, etapa, motivo };
}

export function sincronizarEPublicar(): Resultado {
  const commitAntes = git("rev-parse", "HEAD");

  // 1. Árvore suja aborta antes de qualquer coisa.
  const sujo = git("status", "--porcelain");
  if (sujo) {
    return falhar(
      "arvore-suja",
      `há mudança não commitada, não mexo:\n${sujo}`
    );
  }

  // 2. Fetch.
  try {
    git("fetch", "origin", "--quiet");
  } catch (e) {
    return falhar("fetch", String((e as Error).message));
  }

  const origem = git("rev-parse", "origin/main");
  const localAdiantado = git("rev-list", "--count", "origin/main..HEAD") !== "0";
  if (origem === commitAntes && !localAdiantado) {
    // Nada mudou dos dois lados: nem o origin trouxe commit novo, nem este
    // checkout tem algo para enviar. É o caso comum de uma checagem
    // periódica (a cada duas horas, ou a cada acionamento manual) — sai
    // sem tocar em build/deploy, que é o custo caro desta rotina (~7 min de
    // build mais o deploy). Só entra em "houve novidade" quando há mesmo o
    // que integrar ou publicar.
    return { ok: true, etapa: "sem-novidades", motivo: "nada para sincronizar", commitAntes, commitDepois: commitAntes };
  }
  if (origem === commitAntes) {
    // Nada novo no origin, mas há commit local não enviado — trata no push
    // abaixo, sem passar pelo merge (não há o que integrar).
  } else {
    // 3. Tenta fast-forward primeiro — é o caso comum e não precisa de
    //    julgamento nenhum.
    const ff = spawnSync("git", ["merge", "--ff-only", "origin/main"], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (ff.status !== 0) {
      // Histórias divergiram: só integra se o merge for LIMPO. Medir com
      // merge-tree antes de tentar — mesma disciplina usada nas sessões
      // manuais de hoje.
      const arvore = spawnSync(
        "git",
        ["merge-tree", "--write-tree", "--name-only", "HEAD", "origin/main"],
        { cwd: RAIZ, encoding: "utf-8" }
      );
      if (/CONFLICT/.test(arvore.stdout)) {
        return falhar(
          "merge-conflito",
          `origin/main divergiu e o merge teria conflito — precisa de sessão manual:\n${arvore.stdout}`
        );
      }
      const merge = spawnSync("git", ["merge", "origin/main", "--no-edit"], {
        cwd: RAIZ,
        encoding: "utf-8",
      });
      if (merge.status !== 0) {
        return falhar("merge-falhou", merge.stderr || merge.stdout);
      }
    }
  }

  // 4. Guarda de dado pessoal, sempre — antes de qualquer push. As DUAS: o
  //    hook pre-push já roda as duas (.githooks/pre-push), mas só quando
  //    `core.hooksPath` está ligado no clone, e este script não confia nisso
  //    — mesma razão de rodar explícito em vez de deixar para o hook.
  for (const script of ["checar-dado-pessoal.py", "checar-dado-pessoal-em-dado.py"]) {
    const guarda = spawnSync("python", [`scripts/${script}`], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (guarda.status !== 0) {
      return falhar(`guarda-${script}`, guarda.stdout || guarda.stderr);
    }
  }

  // 5. Push, se este checkout tem commit que o origin não tem — com uma
  //    retentativa: se alguém publicou entre o fetch e agora, refaz
  //    fetch+ff-only uma vez antes de desistir.
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const aFrente = git("rev-list", "--count", "origin/main..HEAD");
    if (aFrente === "0") break;
    const push = spawnSync("git", ["push", "origin", "main"], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (push.status === 0) break;
    if (tentativa === 1) return falhar("push-falhou", push.stderr || push.stdout);
    git("fetch", "origin", "--quiet");
    const ff2 = spawnSync("git", ["merge", "--ff-only", "origin/main"], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    if (ff2.status !== 0) {
      return falhar(
        "push-rejeitado-com-divergencia-nova",
        "outra máquina publicou de novo enquanto este sync rodava — precisa de sessão manual"
      );
    }
  }

  const commitDepois = git("rev-parse", "HEAD");

  // 6. Build + travas + deploy, delegado à rotina existente. Nunca
  //    --forcar-deploy: se a trava de página ou de asset acender, é decisão
  //    de quem está vendo o log, não deste gatilho.
  const args = ["tsx", "scripts/rotina-local.mts", "--so-build"];
  if (SEM_DEPLOY) args.push("--sem-deploy");
  // shell: true não é preguiça — ver o comentário de `npm()` em
  // rotina-local.mts: desde o Node 18.20/20.12 o spawn RECUSA .cmd sem shell
  // (CVE-2024-27980), e `npx` no Windows resolve para `npx.cmd`. Sem isto o
  // passo "falha" em zero segundo com status null, parecendo build quebrado
  // quando na verdade o processo nem começou.
  const rotina = spawnSync("npx", args, { cwd: RAIZ, encoding: "utf-8", shell: true });
  if (rotina.status !== 0) {
    return {
      ok: false,
      etapa: "build-ou-deploy",
      motivo: (rotina.stdout || "") + (rotina.stderr || ""),
      commitAntes,
      commitDepois,
    };
  }

  return {
    ok: true,
    etapa: "concluido",
    motivo: rotina.stdout || "",
    commitAntes,
    commitDepois,
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const r = sincronizarEPublicar();
  console.log(`\n[sincronizar-e-publicar] etapa=${r.etapa} ok=${r.ok}`);
  console.log(r.motivo);
  process.exit(r.ok ? 0 : 1);
}
