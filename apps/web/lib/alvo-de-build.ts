/**
 * Qual dos dois alvos de publicação este build está produzindo.
 *
 * O projeto publica o MESMO código de duas formas (ver
 * `docs/deploy-github-pages.md`):
 *
 * - **Cloudflare Workers** — SSG com runtime Node atrás. Rota dinâmica pode
 *   devolver lista vazia em `generateStaticParams()` e contar com
 *   `dynamicParams` para renderizar sob demanda e cachear.
 * - **GitHub Pages** (`output: 'export'`) — HTML puro. Não existe "sob
 *   demanda": o que não for enumerado no build simplesmente não existe.
 *
 * `PAGES_BASE_PATH` é o output `base_path` de `actions/configure-pages@v5`,
 * e é o mesmo sinal que o `next.config.ts` usa. **String vazia é um valor
 * legítimo** (é o que o action devolve quando há domínio próprio), então o
 * teste é `!== undefined`. Um `Boolean(process.env.PAGES_BASE_PATH)` trataria
 * o caso do domínio próprio como Cloudflare e geraria um site com rotas
 * faltando, sem erro.
 */
export const exportandoEstatico = process.env.PAGES_BASE_PATH !== undefined;

/**
 * Teto de páginas por rota dinâmica no build estático.
 *
 * Existe por causa de dois limites reais que se somam: o site publicado no
 * GitHub Pages não pode passar de 1 GB (limite rígido), e cada página
 * pré-renderizada é uma leitura no Neon, cujo plano gratuito dá 5 GB de
 * egress por mês — o `rebuild.yml` já mede 0,3-0,45 GB por build com ~486
 * páginas.
 *
 * `/congresso/proposicoes/[id]` sozinha tem 5.500+ itens e, com a rota
 * irmã `/oficio`, viraria ~11 mil páginas num build só. Cortar é uma perda
 * real de cobertura; por isso quem corta tem de DIZER que cortou — ver o
 * `console.warn` nos call sites. Truncar em silêncio faria o site parecer
 * completo.
 */
export const TETO_PAGINAS_ESTATICAS = 1500;
