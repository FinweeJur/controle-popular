import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { clashDisplay, generalSans, tabular } from "@/app/fonts";
import OuvirPagina from "@/app/components/OuvirPagina";
import PageViewBeacon from "@/app/components/PageViewBeacon";
import TopNav from "@/app/components/TopNav";
import { SeuNono } from "@/app/components/SeuNono";
import { BackToTop } from "@/app/components/BackToTop";
import IndicePagina from "@/app/components/IndicePagina";
import BeaconDownloadsGlobal from "@/app/components/BeaconDownloadsGlobal";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import "./globals.css";

/**
 * Layout raiz do monorepo. Só o que é comum aos três eixos vive aqui:
 * `<html>`/`<body>`, as fontes, o tema e o anti-flash do tamanho de fonte.
 * Header, nav e footer são de cada zona (`app/<zona>/layout.tsx`), porque
 * divergem — o Betim tem Header/Footer próprios envolvidos em `ForaDoHub`,
 * o Congresso e o Judiciário montam a barra inline.
 *
 * Antes da unificação, cada um dos três repos tinha o seu próprio
 * RootLayout com `<html>`; num app só, apenas a raiz pode declará-lo.
 */
const BASE_URL = "https://controlepopular.com.br";
const SITE_NAME = "Controle Popular";
const DEFAULT_DESCRIPTION =
  "Mais de R$ 251 bilhões monitorados em dados públicos: 199 cidades estratégicas, acordos de Mariana e Brumadinho, 7 órgãos de Justiça de MG e diários oficiais com fontes e código aberto.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} — Portal Independente de Fiscalização Cidadã`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Portal Independente de Fiscalização Cidadã`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/capas/home-page.webp",
        width: 1200,
        height: 630,
        alt: "Controle Popular — R$ 251 bilhões em recursos públicos fiscalizados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Portal Independente de Fiscalização Cidadã`,
    description: DEFAULT_DESCRIPTION,
    images: ["/capas/home-page.webp"],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

// O controle A−/A/A+ vive num atributo próprio (`data-fs`) porque o
// next-themes só gerencia um. Ler o localStorage antes da pintura evita o
// texto redimensionar na hidratação — mesmo truque do next-themes.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: BASE_URL,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "pt-BR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/busca?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: `${BASE_URL}/capas/home-page.webp`,
      sameAs: ["https://github.com/melkepinho/controle-popular"],
    },
  ],
};

const FONT_SIZE_NO_FLASH_SCRIPT = `
(function() {
  try {
    var fs = localStorage.getItem('cp_fs');
    if (['sm','md','lg','xl'].indexOf(fs) === -1) fs = 'md';
    document.documentElement.setAttribute('data-fs', fs);
  } catch (e) {}
})();
`;

// Mesmo truque, para a paleta seguro-para-daltônicos (`CvdToggle.tsx`):
// atributo próprio (`data-cvd`), lido antes da pintura para não trocar
// --cp-accent/--cp-alert já com o primeiro frame na tela.
const CVD_NO_FLASH_SCRIPT = `
(function() {
  try {
    var cvd = localStorage.getItem('cp_cvd');
    document.documentElement.setAttribute('data-cvd', cvd === 'on' ? 'on' : 'off');
  } catch (e) {}
})();
`;

// Script síncrono para garantir carregamento instantâneo do tema Pequi:
// lê localStorage ou assume 'pequi', evitando qualquer flash de tema claro.
const THEME_NO_FLASH_SCRIPT = `
(function() {
  try {
    var th = localStorage.getItem('theme') || 'pequi';
    document.documentElement.setAttribute('data-theme', th);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="pequi"
      className={`h-full ${clashDisplay.variable} ${generalSans.variable} ${tabular.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="cp-theme-no-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }}
        />
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <Script
          id="cp-font-size-no-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FONT_SIZE_NO_FLASH_SCRIPT }}
        />
        <Script
          id="cp-cvd-no-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CVD_NO_FLASH_SCRIPT }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="pequi"
          enableSystem={false}
          themes={["pequi", "light", "dark", "high-contrast", "cerrado", "mata-atlantica", "caatinga", "pantanal"]}
        >
          {/* ⟲ 13/08, revisão de onboarding: WCAG 2.4.1 (Bypass Blocks).
              Precisa ser o PRIMEIRO elemento focável do `<body>` — antes
              de qualquer cabeçalho de zona — para valer a pena; por isso
              mora aqui e não dentro de cada `layout.tsx` de zona. Aponta
              para `#conteudo-principal`, o `id` que o `<main>` de cada
              zona compartilhada (Cidades/Congresso/Judiciário/Ambiental)
              e a home da marca já ganharam nesta revisão. Página sem o
              `id` (ainda faltam algumas fora das quatro zonas — ver
              `docs/REVISAO-UX-E-ONBOARDING.md`) só não faz nada ao
              clicar, não quebra. */}
          <a href="#conteudo-principal" className="cp-skip-link">
            Pular para o conteúdo
          </a>
          {/* Barra superior global, fixa em TODA página: logo no canto abre
              o menu do portal (hover/foco/clique) e os controles de
              tema/tamanho/contraste moram aqui, em UMA cópia. Fica antes de
              {children} porque precisa estar ACIMA dos headers de zona (que
              deixaram de ser fixos — ver `TopNav.tsx` e os layouts de zona). */}
          <TopNav />
          {children}
          {/* Global, fora do cabeçalho de zona: cobre TODA página que tem
              <main> (inclusive /busca e /funcaosocialterra, que não usam o
              Header/layout de nenhuma das quatro zonas) com um só
              componente, em vez de duplicar o botão zona por zona como
              ThemeSwitcher/FontSizeControl fazem hoje. Ver `OuvirPagina.tsx`. */}
          <OuvirPagina />
          {/* Mesmo motivo do <OuvirPagina /> acima: contador de
              visualizações precisa rodar em toda página das quatro zonas,
              não só nas que têm layout próprio. Ver `PageViewBeacon.tsx`. */}
          <PageViewBeacon />

          {/* Overlay global de carregamento — spinner + contador de segundos
              no canto inferior direito ao navegar entre páginas. */}
          <LoadingOverlay />

          {/* Botão acessível para retornar ao topo da página em rolagens longas */}
          <BackToTop />
        <IndicePagina />
        <BeaconDownloadsGlobal />
          {/* Seu Nonô — assistente flutuante. Modo texto enquanto IA não está
              configurada; modo IA (RAG) quando houver chave de API. */}
          <SeuNono />
        </ThemeProvider>
      </body>
    </html>
  );
}
