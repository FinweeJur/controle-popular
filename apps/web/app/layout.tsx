import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
import { ThemeProvider } from "next-themes";
import { clashDisplay, generalSans, tabular } from "@/app/fonts";
import OuvirPagina from "@/app/components/OuvirPagina";
import PageViewBeacon from "@/app/components/PageViewBeacon";
import TopNav from "@/app/components/TopNav";
import FaixaDesenvolvimento from "@/app/components/FaixaDesenvolvimento";
import PaletaComandos from "@/app/components/PaletaComandos";
import WidgetsFlutuantes from "@/app/components/WidgetsFlutuantes";
import { BackToTop } from "@/app/components/BackToTop";
import RastroCursor from "@/app/components/RastroCursor";
import CursorTema from "@/app/components/CursorTema";
import PlayerRadio from "@/app/components/PlayerRadio";
import { InterceptadorLinks } from "@/app/components/InterceptadorLinks";
import IndicePagina from "@/app/components/IndicePagina";
import { CapitulosFlutuantes } from "@/app/components/wiki";
import BeaconDownloadsGlobal from "@/app/components/BeaconDownloadsGlobal";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import ScrollbarExpansivel from "@/app/components/ScrollbarExpansivel";
import RegistrarServiceWorker from "@/app/components/RegistrarServiceWorker";
import RolagemSuave from "@/app/components/rolagem/RolagemSuave";
import { ChaoRolagem } from "@/app/components/rolagem/ChaoRolagem";
import FundoOnda from "@/app/components/react-bits/FundoOnda";
import "./globals.css";

/**
 * Layout raiz do monorepo. SÃ³ o que Ã© comum aos trÃªs eixos vive aqui:
 * `<html>`/`<body>`, as fontes, o tema e o anti-flash do tamanho de fonte.
 * Header, nav e footer sÃ£o de cada zona (`app/<zona>/layout.tsx`), porque
 * divergem â€” o Betim tem Header/Footer prÃ³prios envolvidos em `ForaDoHub`,
 * o Congresso e o JudiciÃ¡rio montam a barra inline.
 *
 * Antes da unificaÃ§Ã£o, cada um dos trÃªs repos tinha o seu prÃ³prio
 * RootLayout com `<html>`; num app sÃ³, apenas a raiz pode declarÃ¡-lo.
 */
const BASE_URL = "https://www.controlepopular.com.br";
const SITE_NAME = "Controle Popular";
const DEFAULT_DESCRIPTION =
  "Quanto sua prefeitura gasta e com quem contrata, quais barragens e licenÃ§as existem perto de vocÃª, como votou seu parlamentar, o orÃ§amento da JustiÃ§a e da saÃºde â€” com link para a fonte oficial.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} â€” Portal Independente de FiscalizaÃ§Ã£o CidadÃ£`,
    template: `%s â€” ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} â€” Portal Independente de FiscalizaÃ§Ã£o CidadÃ£`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/capas/home-page.webp",
        width: 1200,
        height: 630,
        alt: "Controle Popular â€” R$ 251 bilhÃµes em recursos pÃºblicos fiscalizados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} â€” Portal Independente de FiscalizaÃ§Ã£o CidadÃ£`,
    description: DEFAULT_DESCRIPTION,
    images: ["/capas/home-page.webp"],
  },
  // SEM `alternates.canonical` aqui. O merge de metadata do Next Ã© raso: o
  // canonical "/" declarado na raiz era herdado por TODA rota sem
  // `alternates` prÃ³prio â€” medido no ar em 04/10/2026: /ambiental/car,
  // /cidades e /congresso devolviam <link rel="canonical" href=".../">,
  // ou seja, diziam ao Google que eram a home. Canonical errado derruba a
  // pÃ¡gina do Ã­ndice; canonical ausente nÃ£o (o buscador escolhe sozinho).
  // Cada rota declara a sua: `metadataEditavel()` (maioria), o
  // `metadataDaCidade()` das pÃ¡ginas municipais e a home, abaixo.
  // PWA: permite instalar o portal como app e abrir o casco sem rede.
  // O service worker (`public/sw.js`) faz network-first para HTML â€” dado
  // velho Ã© dano. Ver `RegistrarServiceWorker.tsx`.
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

// O controle Aâˆ’/A/A+ vive num atributo prÃ³prio (`data-fs`) porque o
// next-themes sÃ³ gerencia um. Ler o localStorage antes da pintura evita o
// texto redimensionar na hidrataÃ§Ã£o â€” mesmo truque do next-themes.
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

// Mesmo truque, para a paleta seguro-para-daltÃ´nicos (`CvdToggle.tsx`):
// atributo prÃ³prio (`data-cvd`), lido antes da pintura para nÃ£o trocar
// --cp-accent/--cp-alert jÃ¡ com o primeiro frame na tela.
const CVD_NO_FLASH_SCRIPT = `
(function() {
  try {
    var cvd = localStorage.getItem('cp_cvd');
    document.documentElement.setAttribute('data-cvd', cvd === 'on' ? 'on' : 'off');
  } catch (e) {}
})();
`;

// Script sÃ­ncrono para o tema inicial. Desde 02/11/2026 o padrÃ£o Ã© o tema
// CLARO (`light`): quem chega sem escolha vÃª a pÃ¡gina branca e recebe um
// convite discreto para experimentar o escuro ou um dos temas de bioma.
// O atributo Ã© escrito antes da primeira pintura para nÃ£o haver flash.
const THEME_NO_FLASH_SCRIPT = `
(function() {
  try {
    var th = localStorage.getItem('theme') || 'light';
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
      data-theme="light"
      className={`h-full ${clashDisplay.variable} ${generalSans.variable} ${tabular.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* â•â•â• SCRIPTS DO CASCO: <script> CRU DE SERVIDOR, NUNCA `next/script` â•â•â•
            Medido em 06/10/2026 (o dono viu o erro no overlay do Next):
            "Encountered a script tag while rendering React component" apontando
            para as linhas de `<Script strategy="beforeInteractive">` daqui.

            O `next/script` Ã© componente de CLIENTE. Em qualquer posiÃ§Ã£o ele
            renderiza um `<script>` de bootstrap (`self.__next_s.push(...)`) na
            hidrataÃ§Ã£o, e o React 19 recusa `<script>` como filho de componente
            no cliente â€” o erro aparecia em TODA pÃ¡gina, com quatro avisos por
            carga (um por script abaixo).

            A prova foi um par de pÃ¡ginas de teste: com `next/script` o erro
            aparece; com `<script>` cru (componente de SERVIDOR) nÃ£o aparece
            nenhum. E o `<script>` cru Ã© MELHOR aqui: ele nasce no HTML servido,
            roda durante a leitura do documento (antes da primeira pintura, que
            Ã© a razÃ£o de existir do anti-flash) e o crawler o vÃª sem executar JS.

            As trÃªs armadilhas do id: ele fica sÃ³ para leitura do HTML (nada
            depende dele). O anti-flash de tema precisa vir PRIMEIRO â€” Ã© ele que
            escolhe a paleta antes de qualquer pixel. */}
        <script
          id="cp-theme-no-flash"
          dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }}
        />
        <script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <script
          id="cp-font-size-no-flash"
          dangerouslySetInnerHTML={{ __html: FONT_SIZE_NO_FLASH_SCRIPT }}
        />
        <script
          id="cp-cvd-no-flash"
          dangerouslySetInnerHTML={{ __html: CVD_NO_FLASH_SCRIPT }}
        />
        {/* Simple Analytics â€” analytics sem cookie, sem fingerprint e sem
            dado pessoal; respeita Do-Not-Track. Oferta do GitHub Student
            Pack; preenche a lacuna de analytics do portal (hoje so ha a
            contagem de page_views no D1, sem leitura de trafego).
            `async` (e nÃ£o `next/script`): carrega sem bloquear a leitura do
            documento e sem passar pelo render do React â€” era o Ãºltimo
            `next/script` do casco, e a causa raiz do erro do overlay.
            âš ï¸ O CSP do portal ainda e Report-Only: ao promove-lo a
            bloqueante, liberar scripts.simpleanalyticscdn.com (script) e
            queue.simpleanalyticscdn.com (pixel). Ver
            docs/planos/PLANO-STUDENT-PACK-2026-10.md. */}
        <script
          id="simple-analytics"
          async
          src="https://scripts.simpleanalyticscdn.com/latest.js"
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        {/* Fundo de ondas (dono, 06/10/2026): grade que acende no cursor e
            ondula no clique, presa ao viewport, atrÃ¡s de TUDO. Substituiu o
            fundo de Cubes no mesmo dia. `pointer-events: none` e
            `aria-hidden`; desliga em movimento reduzido, alto contraste e
            tela de toque (ver `FundoOnda.tsx`). Fica no layout raiz para nÃ£o
            desmontar na navegaÃ§Ã£o (casca persistente, AGENTS Â§5.13). */}
        <FundoOnda />
        {/* Pixel do Simple Analytics para quem navega com JavaScript
            desligado. `alt=""` porque e decorativo; `no-referrer` para nao
            mandar a URL de origem. */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- pixel de
              rastreio 1x1 dentro de <noscript>; next/image depende de JS. */}
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
          themes={["pequi", "light", "dark", "high-contrast", "cerrado", "mata-atlantica", "caatinga", "pantanal"]}
        >
          {/* âŸ² 13/08, revisÃ£o de onboarding: WCAG 2.4.1 (Bypass Blocks).
              Precisa ser o PRIMEIRO elemento focÃ¡vel do `<body>` â€” antes
              de qualquer cabeÃ§alho de zona â€” para valer a pena; por isso
              mora aqui e nÃ£o dentro de cada `layout.tsx` de zona. Aponta
              para `#conteudo-principal`, o `id` que o `<main>` de cada
              zona compartilhada (Cidades/Congresso/JudiciÃ¡rio/Ambiental)
              e a home da marca jÃ¡ ganharam nesta revisÃ£o. PÃ¡gina sem o
              `id` (ainda faltam algumas fora das quatro zonas â€” ver
              `docs/REVISAO-UX-E-ONBOARDING.md`) sÃ³ nÃ£o faz nada ao
              clicar, nÃ£o quebra. */}
          <a href="#conteudo-principal" className="cp-skip-link">
            Pular para o conteÃºdo
          </a>
          {/* Faixa de aviso global ("site em desenvolvimento ... Ãºltima
              atualizaÃ§Ã£o"), ACIMA da barra e em toda pÃ¡gina: o portal estÃ¡ em
              construÃ§Ã£o e anunciar isso no topo Ã© mais honesto do que deixar
              nÃºmero provisÃ³rio ser lido como definitivo. NÃ£o Ã© sticky â€” a
              navbar logo abaixo Ã© que gruda no topo; ver `FaixaDesenvolvimento.tsx`
              para as decisÃµes de desenho e para a origem da data. */}
          <FaixaDesenvolvimento />
          {/* Barra superior global, fixa em TODA pÃ¡gina: logo no canto abre
              o menu do portal (hover/foco/clique) e os controles de
              tema/tamanho/contraste moram aqui, em UMA cÃ³pia. Fica antes de
              {children} porque precisa estar ACIMA dos headers de zona (que
              deixaram de ser fixos â€” ver `TopNav.tsx` e os layouts de zona). */}
          <TopNav />
          {/* Rede de seguranÃ§a da casca persistente: captura cliques em
              qualquer `<a>` interno de PÃGINA (inclusive os de `href`
              dinÃ¢mico que o ESLint nÃ£o vÃª) e navega no cliente. Sem isto um
              `<a>` cru faz reload e mata o Ã¡udio do `PlayerRadio` e o estado
              do pet. Ver `InterceptadorLinks.tsx`. */}
          <InterceptadorLinks />
          {/* Paleta de comandos global (Ctrl/Cmd+K): ir, perguntar e buscar
              num sÃ³ atalho. Ver `PaletaComandos.tsx`. */}
          <PaletaComandos />
          {/* Rolagem suave (Lenis) â€” envolve o CONTEÃšDO das pÃ¡ginas no
              modo raiz do Lenis: a rolagem Ã© do documento inteiro, e a
              raiz nÃ£o desmonta na navegaÃ§Ã£o, entÃ£o sobe uma vez e fica.
              reduced-motion e o toggle do rodapÃ© desligam de verdade
              (children volta cru, scroll nativo). Ver `RolagemSuave.tsx`. */}
          <RolagemSuave>{children}</RolagemSuave>
          {/* Global, fora do cabeÃ§alho de zona: cobre TODA pÃ¡gina que tem
              <main> (inclusive /busca e /funcaosocialterra, que nÃ£o usam o
              Header/layout de nenhuma das quatro zonas) com um sÃ³
              componente, em vez de duplicar o botÃ£o zona por zona como
              ThemeSwitcher/FontSizeControl fazem hoje. Ver `OuvirPagina.tsx`. */}
          <OuvirPagina />
          {/* Mesmo motivo do <OuvirPagina /> acima: contador de
              visualizaÃ§Ãµes precisa rodar em toda pÃ¡gina das quatro zonas,
              nÃ£o sÃ³ nas que tÃªm layout prÃ³prio. Ver `PageViewBeacon.tsx`. */}
          <PageViewBeacon />
          {/* Registra o service worker do PWA (modo offline do casco). */}
          <RegistrarServiceWorker />

          {/* Overlay global de carregamento â€” spinner + contador de segundos
              no canto inferior direito ao navegar entre pÃ¡ginas. */}
          <LoadingOverlay />

          {/* Barra de rolagem global: fina e engrossada perto da borda
              direita. SÃ³ liga um atributo no <html>; a aparÃªncia mora no
              globals.css. PadrÃ£o de todas as pÃ¡ginas, como a navbar. */}
          <ScrollbarExpansivel />

          {/* BotÃ£o acessÃ­vel para retornar ao topo da pÃ¡gina em rolagens longas */}
          <BackToTop />
          {/* Trilha de palavras que segue o mouse (efeito "cursor trail
              text"). Decorativa: pointer-events none, aria-hidden e desligada
              em prefers-reduced-motion e em tela de toque. Ver
              `RastroCursor.tsx`. */}
          <RastroCursor />
          {/* Pinta o preenchimento dos cursores com a cor primÃ¡ria do tema
              (contorno preto intacto). O binÃ¡rio `.cur` nÃ£o lÃª custom
              property; a recoloraÃ§Ã£o Ã© feita em runtime e publicada em
              variÃ¡veis CSS lidas pelo `globals.css`. Ver `CursorTema.tsx`. */}
          <CursorTema />
          {/* RÃ¡dio Brasil de Fato â€” player PERSISTENTE. Montado no layout
              raiz de propÃ³sito: a raiz nÃ£o desmonta na navegaÃ§Ã£o entre
              pÃ¡ginas, entÃ£o a transmissÃ£o continua ao trocar de pÃ¡gina ou de
              eixo. Se ficasse no rodapÃ© (renderizado por pÃ¡gina), pararia a
              cada clique. Ver `PlayerRadio.tsx`. */}
          <PlayerRadio />
        <IndicePagina />
        {/* Teto real (header + subnav do hub) publicado em `--cp-chao`, lido
            pelo scroll-margin-top das Ã¢ncoras. Sem isso, tÃ­tulo para sob a
            barra em hub/colapso de menu (medido 15/10/2026). */}
        <ChaoRolagem />
        {/* CapÃ­tulos da pÃ¡gina (wiki lateral / scroll-spy): montado aqui
            para valer nas 100 rotas do catÃ¡logo sem editar pÃ¡gina a pÃ¡gina.
            Coleta os h2 do `main`; pÃ¡gina com menos de 2 headings nÃ£o ganha
            widget. SÃ³ aparece em tela grande (xl), como sempre. */}
        <CapitulosFlutuantes />
        <BeaconDownloadsGlobal />
        <WidgetsFlutuantes />
        </ThemeProvider>
      </body>
    </html>
  );
}
