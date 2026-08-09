import { slugsDasCidades } from "@/lib/db/queries/municipios";

/**
 * `generateStaticParams` do segmento `[municipio]`, para ser RE-EXPORTADO por
 * cada página da zona Cidades.
 *
 * ═══ POR QUE ISTO EXISTE, SE O LAYOUT JÁ TEM UM ═══
 *
 * `app/[municipio]/layout.tsx` já declara `generateStaticParams`, e no alvo
 * Cloudflare isso basta. Em `output: 'export'` **não basta**: o Next confere
 * página por página e aborta o build inteiro no primeiro arquivo sem a função,
 * com a mensagem
 *
 *     Page "/[municipio]/citrolandia" is missing "generateStaticParams()"
 *     so it cannot be used with "output: export" config.
 *
 * Medido em 2026-08-09: são **56 páginas** sob `[municipio]`, e só duas
 * (`noticias/[slug]` e `vereadores/[slug]`) tinham a função — porque têm
 * segmento dinâmico próprio e precisavam dela de qualquer jeito.
 *
 * Este blocker não estava em `docs/deploy-github-pages.md`, que só listava o
 * problema dos `searchParams`. Ele aparece ANTES: o export morre aqui, na
 * coleta de dados das páginas, sem chegar a reclamar de `searchParams`.
 *
 * ═══ RE-EXPORT NÃO FUNCIONA. MEDIDO. ═══
 *
 * A forma óbvia seria uma linha por página:
 *
 *     export { generateStaticParams } from "@/lib/betim/staticParams";
 *
 * **Não funciona em `output: 'export'`.** Aplicado às 53 páginas, o build
 * continuou abortando com a mesma mensagem de "missing generateStaticParams()"
 * — em `coleta-lixo` e `compra-e-venda`, que nem leem `searchParams` e tinham
 * o re-export na linha 6. A coleta de dados de página do Turbopack procura a
 * função DECLARADA no módulo da página; re-export não conta.
 *
 * A armadilha é que o re-export **passa** no alvo Cloudflare, onde a função
 * nem é exigida por página. Ele parece certo em todo lugar menos no único
 * lugar onde importa.
 *
 * Daí o formato: a página declara a função, e o corpo dela é esta chamada. A
 * consulta continua definida num lugar só — uma cidade nova segue sendo UMA
 * LINHA em `municipios`, nenhum código de rota, que é a promessa registrada no
 * layout e no runbook de cidade nova.
 *
 *     import { paramsDasCidades } from "@/lib/betim/staticParams";
 *     export async function generateStaticParams() {
 *       return paramsDasCidades();
 *     }
 *
 * ═══ SEM BANCO ═══
 *
 * `slugsDasCidades()` devolve `[]` quando não há `DATABASE_URL`. O export
 * então gera zero páginas de município em vez de falhar — comportamento certo
 * para clonar o repo e buildar sem credencial, e o motivo de o build estático
 * local não provar nada sobre as páginas de cidade.
 */
export async function paramsDasCidades(): Promise<{ municipio: string }[]> {
  return (await slugsDasCidades()).map((municipio) => ({ municipio }));
}
