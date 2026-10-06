/**
 * @file DatasetJsonLd.tsx
 * @description JSON-LD Schema.org/Dataset para indexação em buscadores
 * (Google Dataset Search) nas páginas de acervo — /cidades, /editais,
 * /governo, /instituicoes, /estudos-rurais e /transparencia-internacional.
 *
 * Decisão técnica (MEDIDA em 06/10/2026): o script sai como `<script>` cru
 * neste componente de SERVIDOR — exatamente o que já era — e NÃO pelo
 * `<Script>` do `next/script`. A tentativa de "consertar" o aviso do React 19
 * trocando por `next/script` foi descartada pela medição: o `next/script` é
 * componente de CLIENTE e, em página (fora do layout raiz), renderiza um
 * `<script>` de bootstrap (`self.__next_s.push(...)`) na hidratação, que é
 * justamente o que o React 19 recusa ("Encountered a script tag while
 * rendering React component"). O `<script>` cru chega pronto no HTML
 * (melhor para o crawler) e não passa pelo render do cliente.
 *
 * Prova: duas páginas temporárias — a que usa `next/script` acusa o erro; a
 * que usa `<script>` cru não acusa nenhum. O erro que o dono viu vinha do
 * `BreadcrumbJsonLd` (que usava `next/script`), não deste arquivo.
 */

interface DatasetJsonLdProps {
  name: string;
  description: string;
  url: string;
  keywords: string[];
  license?: string;
  temporalCoverage?: string;
  spatialCoverage?: string;
  creator?: string;
}

/**
 * Etiqueta o acervo como Dataset para o Google Dataset Search.
 */
export function DatasetJsonLd({
  name,
  description,
  url,
  keywords,
  license = "https://opendatacommons.org/licenses/pddl/1.0/",
  temporalCoverage = "2020-01-01/2026-12-31",
  spatialCoverage = "Minas Gerais, Brasil",
  creator = "ONSA — Observatório Nacional Socioambiental / Controle Popular",
}: DatasetJsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url: url.startsWith("http") ? url : `https://www.controlepopular.com.br${url}`,
    keywords: keywords.join(", "),
    license,
    temporalCoverage,
    spatialCoverage: {
      "@type": "Place",
      name: spatialCoverage,
    },
    creator: {
      "@type": "Organization",
      name: creator,
      url: "https://www.controlepopular.com.br",
    },
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
