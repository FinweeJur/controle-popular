/**
 * SERVER-ONLY: dado bruto de `/ambiental/estudos`.
 *
 * Por que separado de `estudos.ts`: o JSON bruto tem 4,9 MB e NÃO pode ser
 * `import` estático — embutiria o bundle do Worker (teto de 3 MiB gzip do
 * plano Free, erro 10027 medido no deploy de 2026-08-24) e também o chunk
 * cliente, já que `BuscaEstudos.tsx` importa os rótulos de `estudos.ts`.
 * A leitura é `readFileSync` preguiçoso resolvido a partir de
 * `process.cwd()` — só roda em Node (build/prerender); as rotas consumidoras
 * (`/ambiental/estudos`, `/ambiental`, `dados/[arquivo]`) são todas ● SSG.
 * Mesmo padrão de `lib/assistente/embeddings/demonstracao.ts`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { AudienciaEstudo, EstudoLinha, ResumoEstudos } from "./estudos";

interface DadosEstudosBrutos {
  gerado_em: string;
  fonte: string;
  linhas: unknown[];
  audiencias: unknown[];
  resumo: ResumoEstudos;
}

let cacheDadosEstudos: DadosEstudosBrutos | null = null;

function carregarDadosEstudos(): DadosEstudosBrutos {
  if (cacheDadosEstudos) return cacheDadosEstudos;
  const caminho = path.resolve(
    process.cwd(),
    "..",
    "..",
    "etl",
    "betim",
    "dados",
    "ambiental-estudos.json"
  );
  try {
    cacheDadosEstudos = JSON.parse(readFileSync(caminho, "utf-8")) as DadosEstudosBrutos;
  } catch (erro) {
    const causa = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `estudos-dados: não consegui ler ${caminho} — rode o build a partir de apps/web ou confira se o coletor gerou o arquivo (${causa})`
    );
  }
  return cacheDadosEstudos;
}

/** Dado pronto do coletor `ambiental_audiencias` (ver docstring de
 *  `estudos.ts` para o contrato). Chame só em contexto Node/build. */
export function lerEstudos(): {
  geradoEm: string;
  fonte: string;
  linhas: EstudoLinha[];
  audiencias: AudienciaEstudo[];
  resumo: ResumoEstudos;
} {
  const dados = carregarDadosEstudos();
  return {
    geradoEm: dados.gerado_em,
    fonte: dados.fonte,
    linhas: dados.linhas as EstudoLinha[],
    audiencias: dados.audiencias as AudienciaEstudo[],
    resumo: dados.resumo as ResumoEstudos,
  };
}
