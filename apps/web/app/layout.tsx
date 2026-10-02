import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { clashDisplay, generalSans, tabular } from "@/app/fonts";
import OuvirPagina from "@/app/components/OuvirPagina";
import PageViewBeacon from "@/app/components/PageViewBeacon";
import TopNav from "@/app/components/TopNav";
import FaixaDesenvolvimento from "@/app/components/FaixaDesenvolvimento";
import PaletaComandos from "@/app/components/PaletaComandos";
import { SeuNono } from "@/app/components/SeuNono";
import { PonteCompanheiro } from "@/app/components/PonteCompanheiro";
import { CompanheiroFlutuante } from "@/app/components/CompanheiroFlutuante";
import { BackToTop } from "@/app/components/BackToTop";
import RastroCursor from "@/app/components/RastroCursor";
import CursorTema from "@/app/components/CursorTema";
import PlayerRadio from "@/app/components/PlayerRadio";
import IndicePagina from "@/app/components/IndicePagina";
import BeaconDownloadsGlobal from "@/app/components/BeaconDownloadsGlobal";
import DicaHover from "@/app/components/DicaHover";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import ScrollbarExpansivel from "@/app/components/ScrollbarExpansivel";
import RegistrarServiceWorker from "@/app/components/RegistrarServiceWorker";
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
const BASE_URL = "https://www.controlepopular.com.br";
const SITE_NAME = "Controle Popular";
const DEFAULT_DESCRIPTION =
  "Quanto sua prefeitura gasta e com quem contrata, quais barragens e licenças existem perto de você, como votou seu parlamentar, o orçamento da Justiça e da saúde — com link para a fonte oficial.";

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
  // PWA: permite instalar o portal como app e abrir o casco sem rede.
  // O service worker (`public/sw.js`) faz network-first para HTML — dado
  // velho é dano. Ver `RegistrarServiceWorker.tsx`.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Controle Popular",
    statusBarStyle: "default",
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
      sameAs: ["https://github.com/FinweeJur/controle-popular"],
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
          {/* Faixa de aviso global ("site em desenvolvimento ... última
              atualização"), ACIMA da barra e em toda página: o portal está em
              construção e anunciar isso no topo é mais honesto do que deixar
              número provisório ser lido como definitivo. Não é sticky — a
              navbar logo abaixo é que gruda no topo; ver `FaixaDesenvolvimento.tsx`
              para as decisões de desenho e para a origem da data. */}
          <FaixaDesenvolvimento />
          {/* Barra superior global, fixa em TODA página: logo no canto abre
              o menu do portal (hover/foco/clique) e os controles de
              tema/tamanho/contraste moram aqui, em UMA cópia. Fica antes de
              {children} porque precisa estar ACIMA dos headers de zona (que
              deixaram de ser fixos — ver `TopNav.tsx` e os layouts de zona). */}
          <TopNav />
          {/* Paleta de comandos global (Ctrl/Cmd+K): ir, perguntar e buscar
              num só atalho. Ver `PaletaComandos.tsx`. */}
          <PaletaComandos />
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
          {/* Registra o service worker do PWA (modo offline do casco). */}
          <RegistrarServiceWorker />

          {/* Overlay global de carregamento — spinner + contador de segundos
              no canto inferior direito ao navegar entre páginas. */}
          <LoadingOverlay />

          {/* Barra de rolagem global: fina e engrossada perto da borda
              direita. Só liga um atributo no <html>; a aparência mora no
              globals.css. Padrão de todas as páginas, como a navbar. */}
          <ScrollbarExpansivel />

          {/* Botão acessível para retornar ao topo da página em rolagens longas */}
          <BackToTop />
          {/* Trilha de palavras que segue o mouse (efeito "cursor trail
              text"). Decorativa: pointer-events none, aria-hidden e desligada
              em prefers-reduced-motion e em tela de toque. Ver
              `RastroCursor.tsx`. */}
          <RastroCursor />
          {/* Pinta o preenchimento dos cursores com a cor primária do tema
              (contorno preto intacto). O binário `.cur` não lê custom
              property; a recoloração é feita em runtime e publicada em
              variáveis CSS lidas pelo `globals.css`. Ver `CursorTema.tsx`. */}
          <CursorTema />
          {/* Rádio Brasil de Fato — player PERSISTENTE. Montado no layout
              raiz de propósito: a raiz não desmonta na navegação entre
              páginas, então a transmissão continua ao trocar de página ou de
              eixo. Se ficasse no rodapé (renderizado por página), pararia a
              cada clique. Ver `PlayerRadio.tsx`. */}
          <PlayerRadio />
        <IndicePagina />
        <BeaconDownloadsGlobal />
          {/* Dica no hover: janelinha explicativa depois de 2 s parado
              sobre um botão ou link. Um componente aqui cobre as ~100
              páginas do portal — o texto sai do `data-dica`, do
              `aria-label` ou do `title` que a página já tem. */}
          <DicaHover />
          {/* Seu Nonô — assistente flutuante. Modo texto enquanto IA não está
              configurada; modo IA (RAG) quando houver chave de API. */}
          <SeuNono />
          {/* Ponte responsiva para o companheiro de desktop (bichinho). Só
              age com NEXT_PUBLIC_COMPANHEIRO_PONTE=1; sem a variável, é um
              no-op. Ver `PonteCompanheiro.tsx`. */}
          <PonteCompanheiro />
          {/* Companheiro Seu Nonô — galinha flutuante e arrastável no canto
              inferior esquerdo, acima do widget do Seu Nonô. Roda sozinha:
              clicar abre o assistente; sem código nem pareamento com app. */}
          <CompanheiroFlutuante />
        </ThemeProvider>
      </body>
    </html>
  );
}
