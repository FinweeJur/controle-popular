/**
 * @file sync-companion.mts
 * @description Espelha o fork do companheiro (clicky-ptbr) dentro deste monorepo.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O companheiro de desktop (bichinho-preguica) mora no fork
 * `FinweeJur/clicky-ptbr`, onde e desenvolvido. Este monorepo guarda uma COPIA
 * somente-leitura em `companion/`, para versionar a integracao junto do portal
 * e deixar claro o que o site espera do app.
 *
 * REGRA DE OURO
 * -------------
 * `companion/` e espelho. Ninguem edita a mao: este script sobrescreve.
 * Ele copia SOMENTE arquivos versionados no fork (`git ls-files`), entao
 * `.env`, `.venv` e qualquer coisa ignorada nunca entram — nem segredo.
 *
 * DECISAO TECNICA
 * ---------------
 * Sem submódulo git: o fluxo de worktree/juncao de node_modules deste repo
 * nao combina bem com submódulo. Um espelho com manifesto (commit + data)
 * resolve o "sem divergir" com menos atrito.
 *
 * USO
 * ---
 *   CLICKY_PTBR_DIR="C:\\DevCoder\\clicky-ptbr" npx tsx scripts/sync-companion.mts
 *   # sem a variavel, usa C:\DevCoder\clicky-ptbr
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");
const DEST = path.join(RAIZ, "companion");
const FORK = process.env.CLICKY_PTBR_DIR ?? "C:\\DevCoder\\clicky-ptbr";

/** Nomes que nunca devem ser espelhados, por seguranca. */
const PROIBIDOS = [/\.env$/, /\.env\./, /\.pem$/, /\.key$/, /service-account.*\.json$/i, /token.*\.json$/i];
/** Excecoes seguras: modelos de .env sem valor nenhum dentro. */
const PERMITIDOS = [/\.env\.example$/, /\.env\.sample$/, /\.env\.template$/];

function main(): void {
  if (!fs.existsSync(path.join(FORK, ".git"))) {
    throw new Error(`Fork nao encontrado em ${FORK}. Defina CLICKY_PTBR_DIR.`);
  }

  const commit = execFileSync("git", ["-C", FORK, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const sujo = execFileSync("git", ["-C", FORK, "status", "--porcelain"], { encoding: "utf8" }).trim();
  const arquivos = execFileSync("git", ["-C", FORK, "ls-files"], { encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Trava de seguranca: nada com cara de segredo entra no espelho.
  const vazados = arquivos.filter(
    (a) => !PERMITIDOS.some((re) => re.test(a)) && PROIBIDOS.some((re) => re.test(a)),
  );
  if (vazados.length > 0) {
    throw new Error(`Espelho abortado: arquivos com risco de segredo — ${vazados.join(", ")}`);
  }

  fs.rmSync(DEST, { recursive: true, force: true });
  for (const rel of arquivos) {
    const src = path.join(FORK, rel);
    const dst = path.join(DEST, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }

  fs.writeFileSync(
    path.join(DEST, "ESPELHO.json"),
    JSON.stringify(
      {
        repo: "FinweeJur/clicky-ptbr",
        commit,
        data: new Date().toISOString().slice(0, 10),
        arquivos: arquivos.length,
        sujoNaOrigem: sujo.length > 0,
        aviso: "ESPELHO gerado por scripts/sync-companion.mts. Nao editar a mao.",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log(`[sync-companion] ${arquivos.length} arquivos de ${FORK} @ ${commit.slice(0, 8)} → ${DEST}`);
  if (sujo) {
    console.log("[sync-companion] ⚠️ o fork tinha alteracoes nao commitadas; so os arquivos versionados entraram.");
  }
}

main();
