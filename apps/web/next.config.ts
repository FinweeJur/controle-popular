import type { NextConfig } from "next";

/**
 * App único do monorepo, servindo as três zonas em rotas próprias:
 * `/betim`, `/congresso` e `/judiciario`.
 *
 * O que saiu daqui na unificação:
 * - `basePath`: um app tem UM basePath, e agora são três zonas. O prefixo
 *   passou a ser o próprio diretório da rota, e o que o basePath fazia por
 *   `next/link` é feito pelo `<Link>` de cada zona (`lib/link-zona.tsx`).
 * - os `rewrites()` de proxy para `controle-popular-congresso.vercel.app`
 *   e `...-judiciario.vercel.app`: as zonas irmãs eram deploys separados e
 *   agora são diretórios do mesmo build. Some o salto de rede.
 * - os `redirects()` de `/` das zonas e o `vercel.json` do Betim (que
 *   reescrevia `/` para `/betim/hub`): a home real agora é `app/page.tsx`.
 *
 * As URLs públicas continuam idênticas às de produção — essa foi a razão
 * de mover cada app para `app/<zona>/` em vez de achatá-los na raiz.
 */
/**
 * ALVO DE PUBLICAÇÃO. O mesmo código serve dois destinos, e a diferença
 * entre eles não é cosmética:
 *
 * - **Cloudflare Workers** (padrão, `npm run cf:deploy`): SSG servido de
 *   Static Assets, mas com um runtime Node atrás. As rotas de API
 *   funcionam — busca, chat, classificados, painel de anúncios.
 * - **GitHub Pages** (`PAGES_BASE_PATH` definido): `output: 'export'`, HTML
 *   puro num CDN. Não existe servidor: nada de POST, de Route Handler que
 *   leia a Request, de cookie, de `redirects()`.
 *
 * `PAGES_BASE_PATH` é o output `base_path` de `actions/configure-pages@v5`
 * — `/controle-popular` num repo comum, string VAZIA quando há domínio
 * próprio. Ler do ambiente em vez de fixar no arquivo é o que faz plugar um
 * CNAME depois não exigir mudança de código. É também o sinal de "estou
 * exportando", porque a variável só existe dentro daquele workflow.
 *
 * A string vazia é um valor legítimo, então o teste é `!== undefined`: um
 * `if (PAGES_BASE_PATH)` trataria o caso do domínio próprio como
 * "Cloudflare" e publicaria o build errado, sem falhar.
 */
const PAGES_BASE_PATH = process.env.PAGES_BASE_PATH;
const exportandoEstatico = PAGES_BASE_PATH !== undefined;

const nextConfig: NextConfig = {
  ...(exportandoEstatico
    ? {
        output: "export" as const,
        basePath: PAGES_BASE_PATH || undefined,
        /**
         * O otimizador de imagem é um serviço de runtime; sem servidor o
         * build falha. `unoptimized` serve o arquivo como está.
         */
        images: { unoptimized: true },
        /**
         * Emite `rota/index.html` em vez de `rota.html`. Sem isso, abrir uma
         * URL aninhada direto dá 404 no GitHub Pages, que não reescreve
         * caminho.
         */
        trailingSlash: true,
        /**
         * O que de fato separa os dois alvos. As rotas que dependem da
         * Request (`searchParams`, POST, corpo, IP) vivem em arquivos
         * `*.din.ts`/`*.din.tsx`; fora desta lista de extensões o Next não
         * as enxerga, e o export nem tenta gerá-las.
         *
         * A alternativa seria apagá-las ou embrulhar cada uma num `if` de
         * ambiente — as duas fazem o build passar e o site perder função sem
         * avisar. Aqui a ausência fica declarada num lugar só.
         */
        pageExtensions: ["tsx", "ts"],
      }
    : {
        pageExtensions: ["tsx", "ts", "din.tsx", "din.ts"],
      }),
  experimental: {
    /**
     * Fase 6: o prerender das 354 páginas de `/congresso/bancadas/[id]` bateu
     * no endpoint HTTP do Neon com a concorrência padrão (8) e DUAS páginas
     * morreram com `fetch failed` / "took more than 60 seconds" — o build
     * seguia e publicava um Worker com páginas faltando, sem falhar.
     *
     * Cada bancada faz um join que devolve ~200 membros (os `.cache` saem com
     * 1,8 MB), então o gargalo é o banco, não a CPU do build. Baixar a
     * concorrência e permitir retry troca alguns minutos de build por um
     * build determinístico — que é o que importa quando a saída vai virar
     * SSG servido de Static Assets.
     */
    staticGenerationMaxConcurrency: 3,
    staticGenerationRetryCount: 3,
  },
  // `redirects()` consta da lista de recursos NÃO suportados por
  // `output: 'export'` — e o modo de falha é silencioso, porque não há
  // servidor para aplicá-lo e o Next não avisa. Declarar só no alvo que o
  // executa deixa a ausência visível aqui, em vez de virar um 404 que só
  // aparece em produção. O equivalente estático é a página-ponte com
  // `<meta http-equiv="refresh">` (ver `components/PaginaPonte.tsx`).
  ...(exportandoEstatico
    ? {}
    : {
        async redirects() {
          return [
            // A home da marca era servida em `/betim/hub` (e chegava em `/`
            // por rewrite do vercel.json). Agora ela É `/`. Este redirect
            // existe só para não quebrar link salvo ou indexado na URL
            // antiga: verificado por diff das tabelas de rota, `/betim/hub`
            // é a ÚNICA URL pública que mudou na unificação — as outras 77
            // continuam idênticas.
            { source: "/betim/hub", destination: "/", permanent: true },
          ];
        },
      }),
};

export default nextConfig;
