import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

/**
 * Leitura de baixo nível dos GeoJSON publicados em
 * `public/terras/globo/dados/camadas/` — a MESMA pasta que o globo 3D serve.
 *
 * Extraído de `lib/terras/alertas.ts` quando `lib/terras/mapa-resumo.ts`
 * nasceu precisando da mesma função `lerGeoJSON` para contar camadas que
 * não são alerta (terras indígenas, SIGMINE, CFEM…) — duplicar a função
 * teria as duas lendo `.gz` de um jeito e um dia divergindo.
 *
 * NUNCA escreve em `public/terras/globo/`: só leitura, sempre, sem cache em
 * disco. Ver o cabeçalho de `alertas.ts` para o porquê (outra frente
 * reprocessa essas mesmas camadas).
 */

export const DIR_CAMADAS = path.join(
  process.cwd(),
  "public/terras/globo/dados/camadas"
);

export interface FeatureCollectionBruta<P> {
  type: string;
  features: Array<{ type: string; properties: P; geometry: unknown }>;
}

export function lerGeoJSON<P>(nomeArquivo: string): FeatureCollectionBruta<P> {
  const caminho = path.join(DIR_CAMADAS, nomeArquivo);
  const bruto = nomeArquivo.endsWith(".gz")
    ? gunzipSync(readFileSync(caminho))
    : readFileSync(caminho);
  return JSON.parse(bruto.toString("utf-8")) as FeatureCollectionBruta<P>;
}
