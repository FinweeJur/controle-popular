/**
 * Fonte única (client-safe) da pergunta: "esta cidade JÁ tem página no portal?"
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * O catálogo das 199 cidades estratégicas (`data/cidades-estrategicas.json`)
 * lista cidades PLANEJADAS, não atendidas. Enquanto isso, as páginas
 * `/[municipio]/**` só nascem para as cidades ativas — via
 * `generateStaticParams` → `slugsDasCidades()` → `listarCidades()`, que sem
 * banco devolve `CIDADES_DO_BUILD`. Linkar pelo código IBGE ou pelo nome de
 * uma cidade do catálogo que não está no build é 404 medido (2900702 → 404
 * em 03/09). Este módulo expõe o MESMO conjunto que alimenta o
 * `generateStaticParams` para componentes client, que não podem chamar a
 * função assíncrona.
 *
 * ═══ POR QUE É SEGURO IMPORTAR `CIDADES_DO_BUILD` AQUI ═══
 *
 * `cidades-do-build.ts` só importa TIPOS de `queries/municipios`
 * (`import type`) — não arrasta drizzle nem Postgres para o bundle. O
 * `TopNav.tsx` mantém sua lista curta à mão para não pesar na navbar global;
 * aqui o import é justificável: são ~17 KB de JSON congelado, e a alternativa
 * (lista à mão) é exatamente a segunda fonte de verdade que este módulo
 * existe para eliminar.
 *
 * ═══ LIMITE CONHECIDO ═══
 *
 * No alvo Cloudflare com Postgres, `listarCidades()` pode devolver mais
 * cidades que o congelado do build. Isto não quebra nada: o gate só fica
 * conservador (mostra "em breve" para uma cidade que o banco já ativou), e
 * cidade nova só entra no portal com build novo de qualquer jeito — as rotas
 * `/[municipio]/**` são geradas no build.
 */
import { CIDADES_DO_BUILD } from "@/lib/db/cidades-do-build";

/** Slug de URL das cidades cobertas, por código IBGE de 7 dígitos. */
const SLUG_POR_IBGE: Record<string, string> = Object.fromEntries(
  CIDADES_DO_BUILD.map((c) => [c.id_municipio, c.slug])
);

/** Slugs cobertos (mesmo conjunto do `generateStaticParams` sem banco). */
export const SLUGS_COBERTOS: ReadonlySet<string> = new Set(
  CIDADES_DO_BUILD.map((c) => c.slug)
);

/**
 * Slug da cidade coberta pelo código IBGE, ou `null` se ainda não há página.
 *
 * Aceita código de 7 dígitos (IBGE) ou de 6 (DATASUS) — o catálogo
 * estratégico usa os dois.
 */
export function slugCobertoPorIbge(idMunicipio: string): string | null {
  const direto = SLUG_POR_IBGE[idMunicipio];
  if (direto) return direto;
  if (idMunicipio.length === 6) {
    const pai = Object.keys(SLUG_POR_IBGE).find((ibge7) => ibge7.startsWith(idMunicipio));
    return pai ? SLUG_POR_IBGE[pai] : null;
  }
  return null;
}

/** A cidade (por slug OU por código IBGE) tem página publicada? */
export function cidadeEstaCoberta(cidade: { slug?: string | null; id_municipio?: string | null }): boolean {
  if (cidade.slug && SLUGS_COBERTOS.has(cidade.slug)) return true;
  if (cidade.id_municipio) return slugCobertoPorIbge(cidade.id_municipio) !== null;
  return false;
}
