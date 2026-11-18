/**
 * SERVER-ONLY: leitura de JSON versionado em `apps/web/data`, sem `import`
 * estático.
 *
 * Por que não `import ... from "@/data/x.json"`: o JSON entra no bundle do
 * Worker e no chunk cliente. O teto do plano Free é 3 MiB gzip e o erro 10027
 * já foi medido no deploy de 2026-08-24 (ver `estudos-dados.ts`). Os dois
 * arquivos do fundiário somam 4,4 MB e o da CFEM 1,1 MB — nenhum cabe.
 *
 * A leitura é `readFileSync` preguiçoso resolvido a partir de
 * `process.cwd()`: só roda em Node (build/prerender), e as rotas que usam
 * isto são SSG. Cache em memória porque a mesma requisição pode pedir o
 * arquivo para cartões, tabela e gráfico.
 *
 * Mesmo contrato de `lib/ambiental/estudos-dados.ts`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const cache = new Map<string, unknown>();

export function lerDadoDeArquivo<T>(nome: string): T {
  const guardado = cache.get(nome);
  if (guardado !== undefined) return guardado as T;

  const caminho = path.resolve(process.cwd(), "data", nome);
  try {
    const dados = JSON.parse(readFileSync(caminho, "utf-8")) as T;
    cache.set(nome, dados);
    return dados;
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `lerDadoDeArquivo: não consegui ler ${caminho} — rode a partir de ` +
        `apps/web ou confira se o coletor gerou o arquivo (${causa})`,
    );
  }
}
