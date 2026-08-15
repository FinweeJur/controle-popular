import { NextResponse } from "next/server";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { painelAutorizado } from "@/lib/painel/edicoes-io";
import { lerEstadoDoRepo } from "@/lib/painel/git-estado";
import { lerUltimoBuild } from "@/lib/painel/ultimo-build";

/**
 * API do painel de edição — `POST` puxa a `main` do GitHub para a máquina.
 *
 * ═══ O QUE ELE FAZ, E POR QUE ═══
 *
 * O painel roda numa máquina que pode estar atrás da outra (quem publicou
 * por último ficou à frente). Até agora, atualizar era `git pull` no
 * terminal. Este botão faz exatamente isso, com a trava de segurança que o
 * resto do painel já usa: `--ff-only`, que recusa se houver divergência —
 * nada de merge automático que misture trabalho de duas máquinas.
 *
 * ═══ QUANDO ELE RECUSA ═══
 *
 * - `origin/main` divergiu do local (merge seria necessário): recusa com a
 *   explicação, porque resolver conflito é trabalho humano e no terminal.
 * - Sem rede (fetch falha): recusa com a mesma mensagem que a tela já usa.
 * - Não está na `main` (branch de trabalho): recusa — o painel só sabe
 *   publicar a `main`, e puxar para uma branch de trabalho confundiria.
 *
 * Como toda rota do painel, só existe com `PAINEL_LOCAL=1` e dev server:
 * `next.config.ts` deixa `.local.ts` fora de qualquer build.
 */

/** Sem `force-static`: esta rota lê disco e git a cada chamada, de propósito. */
export const dynamic = "force-dynamic";

/** Raiz do repositório: `apps/web` -> `..` -> `..`. */
const RAIZ = path.resolve(process.cwd(), "..", "..");

function git(...args: string[]): string {
  return execFileSync("git", args, {
    cwd: RAIZ,
    encoding: "utf-8",
    timeout: 60_000,
  }).trim();
}

function negado() {
  return NextResponse.json(
    { erro: "Não autorizado. Defina PAINEL_TOKEN no .env.local e envie no header Authorization." },
    { status: 401 }
  );
}

export async function POST(request: Request) {
  if (!painelAutorizado(request)) return negado();

  const ramo = git("rev-parse", "--abbrev-ref", "HEAD");
  if (ramo !== "main") {
    return NextResponse.json(
      { erro: `Sincronizar só faz sentido na main — você está em "${ramo}".` },
      { status: 409 }
    );
  }

  try {
    git("fetch", "--quiet", "origin");
    git("pull", "--ff-only", "origin", "main");
  } catch (e) {
    const detalhe =
      e instanceof Error
        ? String(e.message).replace(/^.*?:\s*/, "").split("\n")[0].trim()
        : "git falhou sem detalhe.";
    return NextResponse.json(
      {
        erro: `Não consegui sincronizar. ${detalhe} Se houver divergência ou arquivo local modificado, rode \`git pull\` no terminal.`,
        repo: lerEstadoDoRepo(),
        ultimoBuild: lerUltimoBuild(),
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    aviso: "Local atualizado com a main do GitHub.",
    repo: lerEstadoDoRepo(),
    ultimoBuild: lerUltimoBuild(),
  });
}