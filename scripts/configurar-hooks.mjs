#!/usr/bin/env node
/**
 * @file configurar-hooks.mjs
 * @description Liga os hooks de Git versionados em `.githooks/` (pre-commit e
 * pre-push) NESTE clone, rodando `git config core.hooksPath .githooks`.
 *
 * POR QUE EXISTE. Os hooks do repo são a ÚNICA camada que barra dado pessoal
 * (CPF) e segredo ANTES de o dado ir ao ar — a CI só pega DEPOIS do push
 * (AGENTS §5.2). O comando que os liga é manual e já foi medido esquecido
 * nesta máquina em 01/10/2026: o hook morava no repositório e não executava.
 * Rodar no `postinstall` transforma "lembrar de rodar à mão" em automático.
 *
 * SEGURANÇA. Nunca derruba o `npm install`: fora de um clone Git (build de
 * Docker sem `.git`, tarball, CI sem checkout) sai em silêncio com código 0.
 * Fora isso, qualquer falha vira aviso no stderr, nunca exceção — instalação
 * não pode quebrar por causa de configuração de hook.
 *
 * Uso: roda sozinho no `npm install`/`npm ci` (postinstall) ou à mão com
 * `npm run setup`.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/** Pasta versionada dos hooks, relativa à raiz do repositório. */
const PASTA_HOOKS = ".githooks";

/**
 * Estamos na raiz de um clone Git?
 *
 * `.git` é DIRETÓRIO num clone normal e ARQUIVO num worktree — `existsSync`
 * cobre os dois. Ausente = não é clone (Docker, tarball): não há o que ligar.
 */
function emCloneGit() {
  return existsSync(".git");
}

/** O `core.hooksPath` já aponta para a nossa pasta? */
function hooksJaLigados() {
  try {
    const atual = execFileSync("git", ["config", "--get", "core.hooksPath"], {
      encoding: "utf8",
    }).trim();
    return atual === PASTA_HOOKS;
  } catch {
    return false; // `git config --get` sai com erro quando a chave não existe
  }
}

function main() {
  if (!emCloneGit()) return; // nada a fazer fora de um clone
  if (hooksJaLigados()) return; // já correto: silêncio total

  try {
    execFileSync("git", ["config", "core.hooksPath", PASTA_HOOKS]);
    console.log(
      `[setup] hooks de Git ligados em ${PASTA_HOOKS}/ (pre-commit e pre-push).`
    );
  } catch (erro) {
    console.warn(`[setup] não foi possível ligar os hooks: ${erro.message}`);
    console.warn(`[setup] rode à mão: git config core.hooksPath ${PASTA_HOOKS}`);
  }
}

main();
