/**
 * @file BreadcrumbJsonLd.tsx
 * @description JSON-LD de BreadcrumbList para páginas com breadcrumb visível,
 * nas seis frentes do portal (cidades, editais, governo, instituições,
 * estudos rurais, transparência internacional).
 *
 * Decisão técnica (MEDIDA em 06/10/2026, não suposta): o script sai como
 * `<script>` cru neste componente de SERVIDOR, e NÃO pelo `<Script>` do
 * `next/script`. O `next/script` é um componente de CLIENTE: em página (fora
 * do layout raiz) ele renderiza um `<script>` de bootstrap
 * (`self.__next_s.push(...)`) durante a hidratação, e o React 19 recusa isso
 * com "Encountered a script tag while rendering React component" — o erro
 * aparecia no console de TODA página que usa este componente. O `<script>`
 * cru, por ser server component, chega pronto no HTML (melhor para o
 * crawler) e não passa pelo render do cliente.
 *
 * A prova foi um par de páginas temporárias: com `next/script` o erro
 * aparece; com `<script>` cru, nenhum erro. (O `layout.tsx` continua usando
 * `next/script` porque lá, na raiz, a estratégia `beforeInteractive` é
 * tratada no SSR e não cai nesse caminho.)
 */

interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * Emite o BreadcrumbList do Schema.org para a página atual.
 *
 * @param items Degraus do caminho, na ordem (Início → … → página atual).
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
