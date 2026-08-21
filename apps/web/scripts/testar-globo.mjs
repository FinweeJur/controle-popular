#!/usr/bin/env node
/**
 * Roda os testes do globo 3D (`public/terras/globo/js/**\/*.test.mjs`) com o
 * runner nativo do Node, descobrindo os arquivos aqui em vez de delegar a
 * descoberta ao shell ou à engine do `--test`.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * O alvo do `test:globo` já foi trocado três vezes, e cada correção quebrava a
 * outra ponta — o histórico está no `//test:globo` do `package.json`:
 *
 * | forma                | Node 20.19        | Node 22.x            |
 * |----------------------|-------------------|----------------------|
 * | glob por subpasta    | cmd.exe não expande — falha nas duas         |
 * | diretório bare       | funciona          | MODULE_NOT_FOUND     |
 * | glob como string     | "Could not find"  | funciona             |
 *
 * A máquina de hoje tem Node 20.19 e o script estava na terceira forma, então
 * `npm test` — que `docs/` chama de gate obrigatório — estava **vermelho em
 * checkout limpo da main**, e os 121 testes do globo não rodavam há dias.
 * Ninguém percebeu porque a falha aparece depois do `test:lib`, que passa.
 *
 * Enumerar em JavaScript encerra a série: `readdirSync` se comporta igual em
 * toda versão de Node e em todo shell, e a lista sai por argumento, que é a
 * única forma que as duas versões aceitam sem divergir.
 *
 * Descobre recursivamente a partir de `js/`, de propósito: o alvo já foi só
 * `js/ui` uma vez, e um teste novo em `js/data/mesorregioes.test.mjs` nasceu
 * fora do alcance — suíte verde que ninguém executa é pior que suíte vermelha.
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_GLOBO = path.resolve(AQUI, "..", "public", "terras", "globo", "js");

/** Todos os `*.test.mjs` sob `raiz`, recursivo, em ordem estável. */
function acharTestes(raiz) {
  const achados = [];
  for (const entrada of readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) achados.push(...acharTestes(caminho));
    else if (entrada.name.endsWith(".test.mjs")) achados.push(caminho);
  }
  return achados.sort();
}

const testes = acharTestes(RAIZ_GLOBO);

// Zero arquivo é erro, não sucesso: se um refactor mover a pasta, o modo de
// falha silencioso seria exatamente "0 testes, tudo verde".
if (testes.length === 0) {
  console.error(`[testar-globo] nenhum *.test.mjs sob ${RAIZ_GLOBO} — isso é erro, não suíte vazia.`);
  process.exit(1);
}

console.log(`[testar-globo] ${testes.length} arquivo(s) de teste`);
const r = spawnSync(process.execPath, ["--test", ...testes], { stdio: "inherit" });
process.exit(r.status ?? 1);
