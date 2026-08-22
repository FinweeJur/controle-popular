import Script from "next/script";

interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * JSON-LD de BreadcrumbList para páginas que já têm breadcrumb visível.
 *
 * O schema ajuda buscadores a entenderem a hierarquia do site e pode
 * renderizar o caminho nos resultados de busca.
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
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
