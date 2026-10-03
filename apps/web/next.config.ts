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
const standaloneBuild = process.env.BUILD_TARGET === "standalone" || process.env.DOCKER_BUILD === "1";

/**
 * ═══ O PAINEL DE EDIÇÃO SÓ EXISTE EM `next dev`. NUNCA EM BUILD. ═══
 *
 * `docs/PLANO-PAINEL-EDICAO.md` gasta uma seção inteira explicando por que
 * este painel não pode estar na internet: ele apaga página e renomeia URL, e
 * um token vazado ali derruba conteúdo do ar em massa. A conclusão de lá é
 * "nunca exposto por `custom_domain` nem por `workers_dev`", e — palavras do
 * plano — **"isso não é intenção, é verificação"**.
 *
 * Esta é a verificação, e ela é estrutural em vez de disciplinar. As rotas do
 * painel moram em arquivos `*.local.tsx` / `*.local.ts`, e essa extensão só
 * entra em `pageExtensions` quando as DUAS condições valem:
 *
 *   1. `PAINEL_LOCAL=1` — quem quer o painel pede por ele, explicitamente;
 *   2. `NODE_ENV !== "production"` — e `next build` sempre define
 *      `production`, enquanto `next dev` define `development`.
 *
 * A condição 2 é a que fecha a porta de verdade: mesmo que alguém exporte
 * `PAINEL_LOCAL=1` no ambiente de build por engano — ou que a variável vaze
 * para o CI —, o `next build` continua sem enxergar os arquivos, o Worker sai
 * sem as rotas e não há o que vazar. Não depende de ninguém lembrar de
 * desligar nada.
 *
 * O mecanismo é o mesmo que o alvo estático já usa para `*.din.ts` logo
 * abaixo: fora da lista de extensões, o Next não enxerga o arquivo e nem
 * tenta gerar a rota. Aqui ele é usado ao contrário — para tirar do build o
 * que existe no repositório.
 *
 * Como subir o painel: `PAINEL_LOCAL=1 npx next dev --port 3028`.
 */
const painelLocalLigado =
  process.env.PAINEL_LOCAL === "1" && process.env.NODE_ENV !== "production";
const extensoesDoPainel = painelLocalLigado ? ["local.tsx", "local.ts"] : [];

/**
 * Cabeçalhos de segurança HTTP.
 *
 * ═══ POR QUE ISTO NÃO BASTA SOZINHO — LEIA ANTES DE MEXER ═══
 *
 * Medido em 2026-08-10 (comentário de `public/_headers`): todo arquivo
 * estático em produção — inclusive HTML pré-renderizado — sai direto do
 * binding de Static Assets do Cloudflare Workers, e NUNCA passa pelo Worker
 * (logo nunca passa por este `headers()` do Next). `wrangler.jsonc` não tem
 * `run_worker_first`, então só as rotas que o Worker de fato executa — API
 * routes, páginas com `runtime = "nodejs"` — recebem o que está aqui embaixo.
 * Todo o resto (as páginas SSG das três zonas, e tudo em `public/`, inclusive
 * o globo 3D) só ganha estes mesmos cabeçalhos porque `public/_headers`
 * repete a mesma política pro binding de assets. Os dois arquivos precisam
 * mudar JUNTOS — um sem o outro deixa metade do site sem proteção, do jeito
 * mais silencioso que existe: sem erro, sem 404, só ausência.
 *
 * ═══ CSP: REPORT-ONLY DE PROPÓSITO ═══
 *
 * Começa em `Content-Security-Policy-Report-Only`. Uma CSP restritiva que
 * quebra o mapa 3D ou o globo e é revertida na semana seguinte vale menos
 * que uma em observação que ninguém precisa reverter. Promover para
 * `Content-Security-Policy` (bloqueante) é um passo separado, depois de
 * alguns dias sem violação inesperada no relatório/console.
 *
 * `script-src 'unsafe-inline'`: NÃO é preguiça. `app/layout.tsx` injeta dois
 * `<script>` inline via `dangerouslySetInnerHTML` (anti-flash de tamanho de
 * fonte e de modo daltônico) em TODA página, e o próprio Next.js RSC emite
 * `<script>__next_f.push(...)</script>` inline pra hidratar — conteúdo que
 * muda por página/build, não por request. Hash por script exigiria recalcular
 * um hash por rota a cada build (inviável com ~80 rotas) e nonce por request
 * exigiria middleware rodando em TODA resposta — que é exatamente o que
 * `run_worker_first: false` acima evita. Dado que quase o site inteiro é SSG
 * servido como arquivo estático (sem request handler nenhum no meio),
 * 'unsafe-inline' é a opção real, não a preguiçosa.
 *
 * `style-src 'unsafe-inline'`: os componentes de gráfico
 * (`app/[municipio]/components/charts/*`) calculam largura/cor em JS e
 * escrevem via `style={{...}}` do React — vira atributo `style` no HTML. O
 * globo 3D faz o mesmo via `.style.propriedade =` em `rotulos.js`,
 * `layerspanel.js` e `listapanel.js` (posição de item virtualizado, cor do
 * indicador de camada). CSP trata as duas formas — atributo HTML e escrita
 * via `.style` do DOM — como "inline style", e bloqueia as duas sem esta
 * permissão. Sem CSSOM dinâmico dá pra tirar depois; hoje não dá.
 *
 * `img-src`: `server.arcgisonline.com` é o tile de satélite Esri que
 * `public/terras/globo/detalhe.html` carrega (ver plano do globo, §Esri).
 * `tile.openstreetmap.org` é o basemap OSM da mesma página. Os dois só
 * servem imagem (tile PNG/JPEG), nunca script.
 *
 * `frame-src 'self'`: o mapa em `/funcaosocialterra/mapa`
 * (`GloboIframe.tsx`) embute `/terras/globo/index.html` num `<iframe>` do
 * PRÓPRIO domínio — sem isto, o iframe fica em branco.
 *
 * `frame-ancestors 'self'`: substitui `X-Frame-Options` pras CSP-aware; o
 * `X-Frame-Options: SAMEORIGIN` abaixo fica como reforço pra navegador que
 * ainda não lê `frame-ancestors`.
 *
 * `connect-src 'self'`: toda chamada `fetch()` client-side no app
 * (busca, chat, classificados, admin, ofício) é pra rota relativa do próprio
 * domínio — conferido, não tem `fetch()` client-side pra host de fora.
 *
 * Nada de `unsafe-eval`: nem o bundle do Next nem o Three.js vendorizado
 * usam `eval`/`new Function` (conferido no vendor de `public/terras/globo`).
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // Os scripts do portal são servidos por ele mesmo. `'wasm-unsafe-eval'` e
  // `blob:` entram para a transcrição LOCAL de rádio: a bolha carrega o
  // `transformers.js` (WebAssembly) e o Whisper roda no navegador, sem API.
  // A importação vem de `cdn.jsdelivr.net` (origem de script, não de dados).
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://static.cloudflareinsights.com https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  // ⟲ `api.fontshare.com` entrou depois: a revisao abriu o mapa com o console
  // e viu violacao de style-src A CADA CARREGAMENTO, vinda de
  // `public/terras/globo/css/tokens/fonts.css`, que importa as fontes
  // Switzer/Tabular do Fontshare. O comentario anterior afirmava ter auditado
  // as origens de estilo -- e nao tinha. Como a politica esta em Report-Only,
  // ninguem via: promover para bloqueante confiando naquele comentario
  // quebraria a tipografia do mapa em silencio.
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
  // `https:` cobre as logos das rádios: o diretório `/radio` hotlinka o ícone
  // oficial de cada emissora, e são dezenas de domínios — listá-los um a um
  // viraria manutenção eterna. A marca continua sendo do dono da rádio.
  "img-src 'self' data: https:",
  // Mesmo caso do style-src acima: os arquivos woff/woff2/ttf vem do CDN do
  // Fontshare, num host DIFERENTE do CSS que os importa.
  "font-src 'self' https://cdn.fontshare.com",
  // Player persistente e diretório de rádios: os streams de áudio vêm de
  // dezenas de emissoras (EBC, Câmara, Senado, UFMG, rádios do Sul Global).
  // CP sem `media-src` liberado derruba o áudio; aqui `https:` cobre todas.
  "media-src 'self' https:",
  // `data`/`blob` não entram aqui. `huggingface.co` e o CDN sustêm o download
  // do modelo Whisper da transcrição local — o áudio NÃO sai do aparelho.
  "connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://cloudflareinsights.com https://static.cloudflareinsights.com",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Permissions-Policy: nenhuma página do portal usa câmera, microfone,
 * geolocalização do navegador (o globo usa coordenadas dos dados, não do
 * visitante) nem pagamento — desliga tudo isso explicitamente em vez de
 * herdar o padrão do navegador.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // `max-age` de 1 ano (31536000s) com `includeSubDomains` e `preload` atende
  // a recomendacao OWASP e as verificacoes do Guara Shield / HSTS Preload list.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  /**
   * ═══ TYPE-CHECK SAI DO BUILD PAGO (Guara cobra por minuto) ═══
   *
   * O `next build` roda o `tsc` inteiro antes de compilar. No alvo standalone
   * (Docker/Guara) isso custa ~2,8 min de cota paga por build (medido
   * 02/10/2026). A checagem passa a rodar no CI do GitHub, que e gratis:
   * `guara-deploy.yml` (push/PR) e `pr-revisor.yml` (PR).
   *
   * Só o standalone pula. O alvo Cloudflare Workers e o `output: export`
   * continuam checando tipos normalmente.
   *
   * ARMADILHA: sem o passo de typecheck no CI, um erro de tipo passa batido
   * ate o deploy. O script `typecheck` de apps/web e a rede que cobre isso.
   */
  ...(standaloneBuild
    ? {
        // Type-check e lint rodam no CI (`typecheck`/`lint`) e na suíte local;
        // no build do Docker só gastariam minutos pagos. Sem `eslint`, o
        // `next build` roda o ESLint quando existe config — mesma razão do
        // `typescript`. Medido 03/10/2026: build abaixo de 10 min.
        typescript: { ignoreBuildErrors: true },
        eslint: { ignoreDuringBuilds: true },
      }
    : {}),
  /**
   * DATA_PUBLICACAO: a data da última publicação, congelada NO BUILD.
   *
   * A faixa global "site em desenvolvimento ... Última atualização: <data>"
   * (`app/components/FaixaDesenvolvimento.tsx`) precisa de uma data que seja
   * a do DEPLOY, não a do momento em que a página é renderizada. As três
   * formas erradas de conseguir isso já foram consideradas aqui:
   *
   * - `new Date()` dentro do componente: o servidor que atende rota dinâmica
   *   reinicia sozinho quando o Guara muda uma variável de ambiente, e a
   *   faixa passaria a anunciar uma atualização que não aconteceu. Pior: as
   *   páginas SSG guardariam a data do build e as dinâmicas a do restart —
   *   dois valores diferentes para a mesma afirmação, no mesmo site.
   * - arquivo gerado no `prebuild`: mudaria a cada build, e um arquivo
   *   versionado que muda a cada build é ruído de `git status` para toda
   *   sessão paralela (é exatamente o problema do manifesto de cavas).
   * - variável de ambiente no painel do Guara: valor digitado à mão, e a
   *   regra do portal é que número na tela vem de medição, não de digitação.
   *
   * A chave `env` do Next resolve as três de uma vez: ela é lida quando o
   * `next build` carrega esta config e o valor é INLINED no bundle — para o
   * cliente e para o servidor (`build/define-env.js` mescla `nextConfigEnv`
   * em `defineEnv` sem separar alvo). Confirmado na fonte, não suposto: não
   * depende de `fs`, de `ARG` no Dockerfile nem de nada em runtime, então
   * vale nos dois alvos (Guara standalone e Cloudflare Workers) e em
   * `output: 'export'`.
   *
   * Sobrescrever sem mexer no código: exportar `DATA_PUBLICACAO` antes do
   * build (caso raro — ex.: reimprimir a mesma publicação).
   */
  env: {
    DATA_PUBLICACAO: process.env.DATA_PUBLICACAO ?? new Date().toISOString(),
  },
  /**
   * `pg` é carregado por `createRequire` em `lib/db/client.ts` (motor TCP
   * para host não-Neon). O tracer (`@vercel/nft`) não segue
   * `createRequire` com argumento variável — sem as duas marcas abaixo o
   * Docker da Guara morre ao criar o Pool (`Cannot find module 'pg'`,
   * medido 2026-09-20): `serverExternalPackages` impede o bundler de
   * deduplicar o pacote dentro dos chunks e
   * `outputFileTracingIncludes` o copia para o diretorio standalone.
   *
   * ═══ O `pg` NÃO É UM PACOTE SÓ — É UMA ÁRVORE DE 13 ═══
   *
   * Copiar só a pasta `pg` resolve o erro de 20/09 e derruba o seguinte:
   * o `pg` importa `pg-types` (e ela importa `pg-int8`, `postgres-array`,
   * `postgres-bytea`, `postgres-date`, `postgres-interval`...), e esses
   * pacotes também moram fora do bundle por serem exigidos em runtime.
   * Medido em 03/10/2026 em produção: `Cannot find module 'pg-types'` no
   * log do container, banco primário (Postgres do Guara, host
   * `.cluster.local`) morto em TODA consulta, e as páginas respondendo
   * **200 sem dado nenhum** — o fallback da Neon veio vazio e o site
   * seguiu de pé parecendo saudável, que é a pior forma de cair.
   *
   * A árvore abaixo foi medida com `node` em 03/10/2026 (fechamento de
   * dependências do `pg@8.23.0`, 13 pacotes, todos no `node_modules` da
   * raiz do monorepo). Tire uma linha daqui e o standalone volta a quebrar
   * do mesmo jeito — a falha não aparece no build, só no container.
   */
  ...(standaloneBuild
    ? {
        serverExternalPackages: ["pg"],
        outputFileTracingIncludes: {
          "*": [
            "../../node_modules/pg/**/*",
            "../../node_modules/pg-connection-string/**/*",
            "../../node_modules/pg-pool/**/*",
            "../../node_modules/pg-protocol/**/*",
            "../../node_modules/pg-types/**/*",
            "../../node_modules/pgpass/**/*",
            "../../node_modules/pg-int8/**/*",
            "../../node_modules/postgres-array/**/*",
            "../../node_modules/postgres-bytea/**/*",
            "../../node_modules/postgres-date/**/*",
            "../../node_modules/postgres-interval/**/*",
            "../../node_modules/split2/**/*",
            "../../node_modules/xtend/**/*",
          ],
        },
      }
    : {}),
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
        ...(standaloneBuild ? { output: "standalone" as const } : {}),
        pageExtensions: ["tsx", "ts", "din.tsx", "din.ts", ...extensoesDoPainel],
      }),
  /**
   * ═══ POR QUE ISTO EXISTE: `readFileSync` DE CAMINHO ESTÁTICO EMBUTE O
   * ARQUIVO NO BUNDLE DO WORKER, MESMO NUM RAMO QUE NUNCA RODA LÁ ═══
   *
   * `lib/comunicabr/mg.ts` lê `public/data/comunicabr-31.json` (2,16 MiB, 688
   * KiB gzip) por `env.ASSETS.fetch()` quando publicado — mas mantém um
   * `readFileSync` do MESMO caminho como fallback para build local e teste
   * (sem Worker de pé, sem binding). Medido em 16/08/2026: mesmo esse
   * `readFileSync` estando dentro de um `catch`, atrás de um `if (env.ASSETS)`
   * que nunca é falso em produção, o tracer de saída do Next (`@vercel/nft`)
   * SEGUE o caminho estático de qualquer jeito e embute o arquivo — ele
   * analisa alcançabilidade do código, não se o ramo executa em runtime.
   * O bundle mal encolheu (35,5 KiB de ~688 esperados) até esta exclusão
   * entrar. Ver `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`.
   */
  outputFileTracingExcludes: {
    "*": [
      "public/data/**/*",
      "etl/betim/dados/**/*",
      "public/terras/globo/dados/**/*",
      // @neondatabase NÃO pode ser excluído no standalone — é necessário em
      // runtime no Docker da Guara Cloud para conectar ao Postgres via HTTP.
      // A exclusão só faz sentido no Cloudflare Workers (que usa fetch direto).
      // Se BUILD_TARGET=standalone, manter no bundle.
      ...(standaloneBuild ? [] : ["node_modules/@neondatabase/**/*"]),
      "node_modules/docx/**/*",
      "node_modules/pdf-lib/**/*",
    ],
    "**/*": [
      "public/data/**/*",
      "etl/betim/dados/**/*",
      "public/terras/globo/dados/**/*",
    ],
    "/api/*": [
      "public/data/**/*",
      "etl/betim/dados/**/*",
      "public/terras/globo/dados/**/*",
    ],
    "/dados/comunicabr": ["public/data/comunicabr-31.json"],
    "/dados/comunicabr/[codigo]": ["public/data/comunicabr-31.json"],
    "/paraopeba": ["public/data/biblioteca-ati.json"],
    "/paraopeba/analise": ["public/data/**/*", "etl/betim/dados/**/*"],
    "/paraopeba/biblioteca": ["public/data/biblioteca-ati.json", "public/data/biblioteca-pro-brumadinho.json"],
    "/paraopeba/vale": ["public/data/vale3-cotacoes.csv"],
    "/[municipio]/prefeitura": ["public/data/repasse-brumadinho-mg.json"],
    "/[municipio]/clima": ["public/data/risco-climatico.json"],
    // Asset buscado pelo cliente na biblioteca unificada de desastres — sem
    // `readFileSync` no runtime hoje, mas o tracer embutiria de qualquer jeito
    // se um fallback de servidor aparecer (mesmo mecanismo das linhas acima).
    "/ambiental/crimes-socioambientais": ["public/data/biblioteca-desastres.json"],
  },
  experimental: {
    /**
     * Otimização de concorrência por alvo:
     * - No alvo `standalone` (Docker / Guara Cloud), o banco e a CPU executam
     *   localmente/privado; concorrência 16 gera as páginas pré-renderizadas em
     *   paralelo para economizar minutos pagos. Subiu de 8 para 16 em
     *   03/10/2026 (o build já vinha abaixo de 10 min); se o runner reclamar de
     *   memória, é esta linha a voltar para 8.
     * - No alvo Cloudflare Workers (`output: export`), mantém concorrência 3 e
     *   retry 3 para não estourar subrequests e rate-limit do endpoint HTTP da Neon.
     */
    staticGenerationMaxConcurrency: standaloneBuild ? 16 : 3,
    staticGenerationRetryCount: standaloneBuild ? 1 : 3,
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
            // Unificação dos painéis de legislação ambiental (2026-08-13,
            // decisão do dono): `/ambiental/direito-critico` (legislação
            // nacional/internacional + precedentes, migration 0067) virou
            // filtro dentro de `/ambiental/legislacao` (as 6.378 normas
            // estaduais, migration 0063). Cobre o alvo Cloudflare; o alvo
            // `output: 'export'` usa o bridge estático em
            // `app/ambiental/direito-critico/page.tsx` (ver comentário lá).
            {
              source: "/ambiental/direito-critico",
              destination: "/ambiental/legislacao",
              permanent: true,
            },
            // A Legislação saiu de `/prefeitura` em 2026-08-07: o acervo é da
            // CÂMARA em Araçuaí e Diamantina, e a URL era o único lugar onde
            // isso não dava para corrigir com texto.
            //
            // Este redirect é o que **preserva o query string** — a lista é
            // filtrada por `?categoria=&tema=&ano=&direito=`, e um link
            // compartilhado com filtro perderia o filtro se o salto fosse só
            // pela página-ponte.
            //
            // A página-ponte em `app/[municipio]/prefeitura/legislacao/` NÃO é
            // redundante: no alvo `output: 'export'` esta função nem existe, e
            // lá a ponte é o único redirecionamento possível.
            {
              source: "/:municipio/prefeitura/legislacao",
              destination: "/:municipio/camara/legislacao",
              permanent: true,
            },
            // IBGE codes → slugs: URLs like `/3106200` redirect to `/bh`.
            { source: "/3103405", destination: "/aracuai", permanent: true },
            { source: "/3106200", destination: "/bh", permanent: true },
            { source: "/3106705", destination: "/betim", permanent: true },
            { source: "/3121605", destination: "/diamantina", permanent: true },
            { source: "/3134004", destination: "/itinga", permanent: true },
            { source: "/3550308", destination: "/sp", permanent: true },
            // "Radar de Compras & Contratos" (menu, índice e hub de economia)
            // apontava para `/ambiental/contratos`, rota que nunca existiu — o
            // leitor via 404. Sem uma página própria de contratos hoje, o
            // destino vivo mais próximo é o Radar Diário de Editais.
            { source: "/ambiental/contratos", destination: "/editais", permanent: false },
            // Typo corrigido em 29/09/2026: a rota nasceu como `/mineraicao`
            // (erro de digitação no diretório). Agora é `/mineracao/cavas`.
            // O redirect preserva link salvo ou indexado na URL errada.
            { source: "/mineraicao", destination: "/mineracao", permanent: true },
            {
              source: "/mineraicao/:path*",
              destination: "/mineracao/:path*",
              permanent: true,
            },
          ];
        },
      }),
  // `headers()` também consta da lista de recursos não suportados por
  // `output: 'export'`, pela mesma razão do `redirects()` acima: sem
  // servidor, não há quem aplique. E mesmo no alvo Cloudflare esta função só
  // cobre as respostas que o Worker de fato gera — ver o comentário grande
  // em `SECURITY_HEADERS` sobre por que `public/_headers` carrega a mesma
  // política pro resto do site.
  ...(exportandoEstatico
    ? {}
    : {
        async headers() {
          return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
        },
      }),

  /**
   * ═══ OTIMIZAÇÃO DE DISCO NO BUILDKIT (GUARA CLOUD / DOCKER STANDALONE) ═══
   * Em contêineres de CI/CD descartáveis, o cache de compilação em disco
   * do Webpack (.next/cache/webpack) consome entre 4 a 6 GiB no volume temporário,
   * provocando despejo do pod Kubernetes ("EmptyDir buildkitd exceeds 12Gi").
   * Como o contêiner de build é efêmero, desativar o cache de filesystem faz o
   * Webpack processar diretamente na memória RAM, poupando gigabytes de I/O em disco.
   */
  webpack: (config, { dev }) => {
    if (!dev && standaloneBuild) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
