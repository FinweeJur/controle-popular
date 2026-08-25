/**
 * SERVER-ONLY: leitura preguiçosa de JSON versionado em `etl/betim/dados/`.
 *
 * Por que existe: `import` estático de JSON embute o arquivo no bundle do
 * Worker (teto de 3 MiB gzip do plano Free — erro 10027 no deploy de
 * 2026-08-24 estourou com ~25 MB de dado embutido). O padrão do repo para
 * dado grande fora do bundle é `readFileSync` resolvido a partir de
 * `process.cwd()` (ver `lib/assistente/embeddings/demonstracao.ts` e
 * `lib/ambiental/estudos-dados.ts`) — roda só em Node, no prerender das
 * rotas ● SSG; nunca no runtime do Worker.
 *
 * NÃO importe este módulo de código que roda no navegador (`"use client"`):
 * `node:fs` não existe lá e o build falha com UnhandledSchemeError.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const cache = new Map<string, unknown>();

export function carregarJsonEtl<T = unknown>(arquivo: string): T {
  const hit = cache.get(arquivo);
  if (hit !== undefined) return hit as T;
  const caminho = path.resolve(process.cwd(), "..", "..", "etl", "betim", "dados", arquivo);
  let bruto: string;
  try {
    bruto = readFileSync(caminho, "utf-8");
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `json-etl: não consegui ler ${caminho} — rode o build a partir de apps/web ou gere o arquivo no coletor (${causa})`
    );
  }
  const dado = JSON.parse(bruto) as T;
  cache.set(arquivo, dado);
  return dado;
}
