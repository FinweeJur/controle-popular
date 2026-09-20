import React from "react";

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
 * JSON-LD Schema.org/Dataset para indexação em buscadores (Google Dataset Search).
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
