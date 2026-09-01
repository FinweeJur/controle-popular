import { describe, expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Nenhum CPF de pessoa real pode entrar em DADO ingerido.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * `sem-cpf-no-repo.test.ts` varre o que uma PESSOA escreveu à mão (código e
 * doc). O portal passou a ingerir acervo — JSON de fonte pública nos
 * diretórios listados em `DIRETORIOS_DADO` (topo do script abaixo) — e esse
 * caminho ficou sem rede: a varredura de 13/08/2026 que achou seis CPF reais
 * em código acha de novo em dado (registrado em `docs/FONTES-ROUANET-
 * SALIC.md`: um CPF pego só porque alguém abriu o arquivo à mão).
 *
 * Este teste roda a rede de DADO — `scripts/checar-dado-pessoal-em-dado.py`,
 * o mesmo regex de CPF mod-11 de `sem-cpf-no-repo.test.ts` e de
 * `scripts/checar-dado-pessoal.py`, mas lendo JSON estruturado (só valores de
 * texto, não geometria) em vez de `git grep`. A régua semântica por acervo
 * (`lib/paraopeba/triagem.ts`) continua sendo a triagem de verdade para o
 * Brumadinho — esta rede pega o que tem CPF no texto e não substitui aquela.
 *
 * ⚠️ PULA quando não há Python: o guarda é portátil por design (roda no hook
 * e na CI), mas quem não tem Python não fica protegido por este teste — a CI
 * (`dado-pessoal.yml`) roda o script direto e é a segunda camada.
 */

function temPython(): boolean {
  try {
    execFileSync("python", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

const raiz = path.resolve(__dirname, "..", "..", "..");
const script = path.join(raiz, "scripts", "checar-dado-pessoal-em-dado.py");

describe.skipIf(!temPython())("nenhum CPF real em dado ingerido", () => {
  test("varre os JSON de acervo e valida por mod-11", { timeout: 180000 }, () => {
    let code = 0;
    try {
      execFileSync("python", [script], { cwd: raiz, encoding: "utf8" });
    } catch (e) {
      code = (e as { status?: number }).status ?? -1;
    }
    expect(
      code,
      `CPF válido em dado ingerido — este repositório é PÚBLICO.\n`
      + `Rode \`python ${script}\` para ver o arquivo e o caminho.\n`
      + `Redija o campo na ingestão (ou troque por 000.000.000-00).`,
    ).toBe(0);
  });

  test("a régua vê e não é cega (self-test)", { timeout: 60000 }, () => {
    // Se um bug no validador ou no parser fizesse o teste acima passar sempre,
    // este cairia — o pior modo de falha para um guarda de privacidade.
    execFileSync("python", [script, "--self-test"], { cwd: raiz, encoding: "utf8" });
  });
});
