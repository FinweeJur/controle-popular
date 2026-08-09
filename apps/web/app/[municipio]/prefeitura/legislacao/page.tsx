import PaginaPonte from "@/app/[municipio]/components/PaginaPonte";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

/**
 * Ponte de `/prefeitura/legislacao` para `/camara/legislacao`.
 *
 * A rota mudou em 2026-08-07. O motivo é o de sempre neste projeto — a URL é
 * o único lugar da tela onde não se pode explicar com texto: em Araçuaí e
 * Diamantina o acervo de normas é da CÂMARA (SAPL e portal da Casa), e o
 * `<h1>` já dizia isso desde `orgaoDoAcervoNormativo`, enquanto o endereço
 * continuava dizendo "prefeitura".
 *
 * POR QUE PONTE **E** `redirects()`, e não um dos dois. Os dois alvos de
 * publicação se comportam de forma diferente (ver o topo de `next.config.ts`):
 *
 *   - Cloudflare Workers: o `redirects()` do `next.config` roda ANTES do
 *     roteamento de arquivo, então quem chega aqui leva um 301 de verdade e
 *     **o query string é preservado** — que importa, porque a lista de leis
 *     é filtrada por `?categoria=&tema=&ano=&direito=`. Esta página nunca é
 *     alcançada nesse alvo.
 *   - GitHub Pages (`output: 'export'`): não há servidor, `redirects()`
 *     simplesmente NÃO EXISTE — e falha em silêncio. Aí esta página é o
 *     único redirecionamento possível, via `<meta http-equiv="refresh">`.
 *
 * Confiar só no `redirects()` deixaria um 404 no alvo estático; confiar só na
 * ponte perderia os filtros no alvo que é a produção. Daí os dois.
 *
 * Diferente de `/zap-betim` e `/nota-betim`, esta URL existiu em TODAS as
 * cidades — por isso `fonte={null}`, sem o gate de `fontes.rotas_legadas`.
 */
export const generateMetadata = metadataDaCidade(
  (c) => `Legislação — ${nomePortal(c)}`,
  () => "Esta página mudou de endereço."
);

export default async function LegislacaoMudouDeEndereco({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <PaginaPonte
      cidade={cidade}
      destino="/camara/legislacao"
      titulo="A Legislação agora fica na Câmara"
      fonte={null}
    />
  );
}
