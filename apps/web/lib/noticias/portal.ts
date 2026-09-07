import noticiasRaw from "@/data/noticias-portal.json";

export interface MetricaNoticia {
  rotulo: string;
  valor: string;
}

export interface FonteOficialNoticia {
  nome: string;
  url: string;
}

export interface NoticiaPortal {
  slug: string;
  titulo: string;
  subtitulo: string;
  resumo: string;
  categoria: "Relatório Técnico" | "Investigação Cívica" | "Explicador" | "Divulgação Científica";
  frente: "terra" | "estado" | "congresso" | "judiciario" | "ambiental" | "paraopeba" | "cidades";
  subfrente: string;
  autor: string;
  declaracaoIa: string;
  publicadoEm: string;
  atualizadoEm: string;
  tempoLeituraMin: number;
  palavrasChave: string[];
  citacaoAbnt: string;
  citacaoBibtex: string;
  fontesOficiais: FonteOficialNoticia[];
  metricas: MetricaNoticia[];
  recomendacaoVerificar?: string;
  paragrafos: string[];
}

const NOTICIAS: NoticiaPortal[] = noticiasRaw as NoticiaPortal[];

export function listarNoticiasPortal(): NoticiaPortal[] {
  return NOTICIAS;
}

export function obterNoticiaPorSlug(slug: string): NoticiaPortal | null {
  return NOTICIAS.find((n) => n.slug === slug) ?? null;
}

export function listarNoticiasPorFrente(frente: string): NoticiaPortal[] {
  return NOTICIAS.filter((n) => n.frente === frente);
}

export function listarNoticiasPorCategoria(categoria: string): NoticiaPortal[] {
  return NOTICIAS.filter((n) => n.categoria === categoria);
}

/**
 * Gera os metadados acadêmicos (Google Scholar / Highwire Press / Dublin Core)
 * para inclusão no campo `other` do Next.js Metadata.
 */
export function metadadosAcademicosNoticia(n: NoticiaPortal) {
  const urlArtigo = `https://controlepopular.com.br/noticias/${n.slug}`;
  const dataIso = n.publicadoEm.slice(0, 10).replace(/-/g, "/");

  return {
    // Google Scholar / Highwire Press
    "citation_title": n.titulo,
    "citation_author": n.autor,
    "citation_publication_date": dataIso,
    "citation_journal_title": "Controle Popular — Observatório Nacional Socioambiental",
    "citation_language": "pt-BR",
    "citation_fulltext_html_url": urlArtigo,

    // Dublin Core (DC)
    "DC.title": n.titulo,
    "DC.creator": n.autor,
    "DC.date": n.publicadoEm,
    "DC.description": n.resumo,
    "DC.publisher": "Controle Popular",
    "DC.language": "pt-BR",
    "DC.identifier": urlArtigo,
    "DC.subject": n.palavrasChave.join(", "),
  };
}

/**
 * Gera o schema.org estruturado em JSON-LD (NewsArticle + BreadcrumbList)
 */
export function gerarJsonLdNoticia(n: NoticiaPortal) {
  const urlArtigo = `https://controlepopular.com.br/noticias/${n.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${urlArtigo}#article`,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://controlepopular.com.br/#website",
          "name": "Controle Popular — Observatório Nacional Socioambiental",
          "url": "https://controlepopular.com.br",
        },
        "headline": n.titulo,
        "description": n.resumo,
        "inLanguage": "pt-BR",
        "mainEntityOfPage": urlArtigo,
        "datePublished": n.publicadoEm,
        "dateModified": n.atualizadoEm,
        "author": {
          "@type": "Organization",
          "name": n.autor,
          "url": "https://controlepopular.com.br/sobre",
        },
        "publisher": {
          "@type": "Organization",
          "name": "Controle Popular",
          "url": "https://controlepopular.com.br",
          "logo": {
            "@type": "ImageObject",
            "url": "https://controlepopular.com.br/seunono/avatar.webp",
          },
        },
        "keywords": n.palavrasChave.join(", "),
        "articleSection": n.subfrente,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${urlArtigo}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Início",
            "item": "https://controlepopular.com.br",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Notícias",
            "item": "https://controlepopular.com.br/noticias",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": n.titulo,
            "item": urlArtigo,
          },
        ],
      },
    ],
  };
}
