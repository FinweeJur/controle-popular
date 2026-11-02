/**
 * @file Registro das URLs antigas que viraram recorte de um painel.
 *
 * O QUE É: a lista única `rota antiga → rota nova` das rotas absorvidas por
 * painel de facetas. Cada entrada tem DOIS consumidores, de propósito:
 *
 *  1. a página-ponte (`app/<rota>/page.tsx`) chama `destinoAntigo(ROTA)` para
 *     montar o `<meta http-equiv="refresh">` e o `canonical`;
 *  2. o `redirects()` do `next.config.ts` pode espalhar `ROTAS_ANTIGAS` para
 *     responder 301 onde há servidor (Azure/Cloudflare). O alvo estático
 *     (`output: 'export'`, GitHub Pages) não aplica `redirects()` — lá quem
 *     redireciona é só a ponte, e o Next não avisa dessa diferença.
 *
 * POR QUE NÃO APAGAR A ROTA: link salvo, e-mail antigo e resultado de busca
 * continuam chegando. Apagar sem ponte transforma histórico em 404.
 *
 * ORDEM: só acrescentar no fim. A lista é lida pelo teste
 * `rotas-antigas.test.ts`, que confere se toda rota tem `page.tsx` de ponte.
 *
 * FONTE: nenhuma. É decisão editorial de rota, registrada no commit que a
 * tomou.
 */

export interface RotaAntiga {
  /** Caminho que existia antes, absoluto no site (`/congresso/alertas`). */
  source: string;
  /** Caminho novo, com a query que preserva o recorte. */
  destination: string;
  /** Sempre 301: a rota antiga não volta. */
  permanent: true;
}

/**
 * Acréscimos por família migrada.
 *
 * 02/11/2026 — família `/congresso`: `/congresso/alertas` e
 * `/congresso/bons-exemplos` eram a mesma lista de proposições analisadas,
 * separada só pelo sentido do rótulo. Viraram `?recorte=` no painel
 * `/congresso/analises`.
 */
export const ROTAS_ANTIGAS: readonly RotaAntiga[] = [
  {
    source: "/congresso/alertas",
    destination: "/congresso/analises?recorte=restringem",
    permanent: true,
  },
  {
    source: "/congresso/bons-exemplos",
    destination: "/congresso/analises?recorte=ampliam",
    permanent: true,
  },
];

/** Destino de uma rota absorvida. Rota fora da lista é erro de programação. */
export function destinoAntigo(rota: string): string {
  const achada = ROTAS_ANTIGAS.find((r) => r.source === rota);
  if (!achada) {
    throw new Error(
      `rota antiga sem destino registrado: ${rota}. Acrescente em lib/redirects/rotas-antigas.ts.`
    );
  }
  return achada.destination;
}
