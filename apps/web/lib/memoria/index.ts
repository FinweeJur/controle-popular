/**
 * API pública do acervo de memória das resistências.
 *
 * Papel no portal: ser o único ponto de importação para quem lê memória.
 * `app/[municipio]/page.tsx` continua chamando `memoriaDaCidade(slug)` —
 * a assinatura foi preservada — enquanto as páginas novas podem usar as
 * camadas e as guardas diretamente.
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md` e
 * AGENTS.md §7 e §8. A copy das seis cidades vive em `camadas.ts`
 * (`MEMORIA_CIDADES_LEGADO`); `lib/memoria-cidades.ts` apenas delega
 * para cá, para não duplicar texto nem permitir deriva.
 */

export * from "./tipos";
export { verbeteValido, fontesPrimarias, resolverMemoria } from "./guardas";
export {
  VERBETES_PAIS,
  VERBETES_REGIAO,
  VERBETES_UF,
  REGIAO_POR_UF,
  UF_POR_MUNICIPIO,
  MEMORIA_CIDADES_LEGADO,
  CAMADAS_MEMORIA,
} from "./camadas";

import { MEMORIA_CIDADES_LEGADO } from "./camadas";
import type { MemoriaCidade } from "./tipos";

/**
 * A memória e a cultura da cidade, pelo slug da rota, ou `null` para
 * cidade sem cartão definido. Mantém a MESMA assinatura que o painel
 * municipal já usava em `lib/memoria-cidades.ts`.
 */
export function memoriaDaCidade(slug: string): MemoriaCidade | null {
  return MEMORIA_CIDADES_LEGADO[slug] ?? null;
}
