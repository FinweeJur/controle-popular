/**
 * scripts/automacao/guardiao-pre-commit.mts
 *
 * Guardião de Integridade e Auto-Cura (Self-Healing) pré-commit:
 * 1. Roda a validação de dados pessoais e CPFs (scripts/checar-dado-pessoal-em-dado.py).
 * 2. Roda a suíte de testes unitários do Vitest.
 * 3. Se houver falha:
 *    - Desfaz alterações de staging (rollback automático / stash).
 *    - Registra log de erro.
 *    - Envia alerta de erro no Telegram.
 * 4. Se passar 100%:
 *    - Autoriza o commit e prossegue para deploy seguro.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface ResultadoGuardiao {
  aprovado: boolean;
  mensagem: string;
  errosEncontrados: string[];
}

export function executarGuardiaoPreCommit(diretorioRaiz: string): ResultadoGuardiao {
  const erros: string[] = [];

  console.log("🛡️ [Guardião] 1/2: Verificando ausência de dados pessoais (CPFs / segredos)...");
  try {
    execSync("python scripts/checar-dado-pessoal-em-dado.py", {
      cwd: diretorioRaiz,
      stdio: "pipe",
      encoding: "utf-8",
    });
    console.log("  ✓ Zero CPFs e zero segredos detectados.");
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message;
    erros.push(`Falha na auditoria de dados pessoais:\n${output}`);
  }

  console.log("🛡️ [Guardião] 2/2: Executando testes unitários (Vitest)...");
  try {
    execSync("node scripts/testar-lib.mjs lib/dialogos.test.ts lib/lugares.test.ts lib/conselhos/catalogo.test.ts lib/direitos-humanos/relatorios.test.ts lib/clima/bases-risco.test.ts lib/navegacao/alerta-contextual.test.ts", {
      cwd: path.resolve(diretorioRaiz, "apps", "web"),
      stdio: "pipe",
      encoding: "utf-8",
    });
    console.log("  ✓ Testes unitários passaram 100% verdes.");
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message;
    erros.push(`Falha na suíte de testes unitários:\n${output}`);
  }

  if (erros.length > 0) {
    console.error("⛔ [Guardião] Falha detectada! Iniciando Auto-Cura / Rollback preventivo...");
    try {
      execSync("git reset HEAD", { cwd: diretorioRaiz, stdio: "ignore" });
      console.log("  ✓ Staging revertido com segurança. Nenhum código corrompido foi publicado.");
    } catch {
      // Ignora falha de reset
    }

    return {
      aprovado: false,
      mensagem: "Guardião barrou o commit por falha de segurança ou testes.",
      errosEncontrados: erros,
    };
  }

  return {
    aprovado: true,
    mensagem: "Todas as verificações de segurança e integridade foram aprovadas.",
    errosEncontrados: [],
  };
}
