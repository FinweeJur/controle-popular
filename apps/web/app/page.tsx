import type { Metadata } from "next";
import Link from "next/link";
import NextLink from "next/link";
import { ZONAS_PUBLICADAS, contagemZonasPublicadas } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";
import CapaFrente from "@/app/components/CapaFrente";
import ShapeBlur from "@/app/components/react-bits/ShapeBlur";
import Magnet from "@/app/components/react-bits/Magnet";
import BorderGlow from "@/app/components/react-bits/BorderGlow";
import BotaoBrilho from "@/app/components/react-bits/BotaoBrilho";
import SanfonaFrentes from "@/app/components/SanfonaFrentes";
import CartaoChatbotHome from "@/app/components/CartaoChatbotHome";
import Epigrafe from "@/app/components/Epigrafe";
import CardCarousel from "@/app/components/CarrosselEixos";
import MisticaDoDia from "@/app/components/MisticaDoDia";
import DiasImportantes from "@/app/components/DiasImportantes";
import { citacaoPorId } from "@/lib/citacoes";
import { formatNumberBR } from "@/lib/betim/format";
import basesPortal from "@/data/bases-portal.json";

/**
 * Home da marca Controle Popular, na raiz do domínio.
 *
 * Antes vivia em `app/hub/` dentro do repo do Betim e chegava em `/` por
 * um rewrite, porque `controlepopular.vercel.app` era o domínio
 * auto-gerado do projeto Vercel do Betim e domínio `.vercel.app` não se
 * transfere entre projetos — então quem atendia a raiz era o Betim.
 *
 * Com o monorepo isso deixou de ser verdade: as três zonas são
 * diretórios do mesmo build e a raiz é uma rota como outra qualquer. O
 * `ForaDoHub`, que escondia o cabeçalho do Betim aqui, saiu junto — como
 * o próprio comentário dele previa.
 *
 * Os links para as zonas usam `<a>` cru, não o `<Link>` de zona: daqui
 * eles apontam para `/betim`, `/congresso` e `/judiciario`, que são
 * caminhos absolutos e não devem receber prefixo nenhum.
 *
 * A ZONA DE CIDADES LISTA AS CIDADES, e não é enfeite: ela apontava para
 * `/betim` e só. Belo Horizonte e São Paulo entraram no ar e ficaram
 * inalcançáveis a partir da raiz — quem chegasse em controlepopular sem
 * saber a URL de cor só encontrava Betim. A lista vem de `listarCidades()`,
 * a mesma fonte que gera as rotas, então abrir a próxima cidade a faz
 * aparecer aqui sozinha, sem ninguém lembrar de editar esta página.
 */

export const metadata: Metadata = metadataEditavel("/", {
  title: "Controle Popular — Observatório Nacional Socioambiental (ONSA)",
  description:
    "Portal virtual do ONSA — Observatório Nacional Socioambiental. Com raízes na História e Geografia, esse portal se utiliza da tecnologia da Inteligência Artificial (IA) pra somar na busca por justiça socioambiental e fiscalização cidadã, acessível pela internet, gratuitamente e sem cadastro por qualquer celular ou computador.",
});

// A cópia das frentes mora em `lib/zonas.ts`, porque o bloco de remissão no
// pé de cada zona (`app/components/OutrasFrentes.tsx`) descreve as mesmas
// frentes — duplicar aqui garantiria deriva entre as duas telas.
//
// `ZONAS_PUBLICADAS`, não `ZONAS`: zona em construção existe no código e é
// alcançável por URL direta, mas não se anuncia na home antes de ter dado.
const SECOES = ZONAS_PUBLICADAS;

/** Item de zona publicada (o tipo de SECOES/ZONAS_PUBLICADAS). */
type ZonaItem = (typeof SECOES)[number];

/** Cidades listadas no build (mesmo tipo que listarCidades() devolve). */
type Cidades = Awaited<ReturnType<typeof listarCidades>>;

export default async function Hub() {
  const cidades = await listarCidades();
  return (
    // ⟲ 13/08, revisão de onboarding: era `<div>`, e `OuvirPagina.tsx` só
    // lê `document.querySelector("main")` — sem a tag, o botão "Ouvir esta
    // página" não tinha texto para achar e se ESCONDIA (`!temTexto` ⇒
    // `return null`) bem na página mais visitada do portal, a única sem
    // nenhum outro `<main>` por perto para salvar a leitura. Mesmo padrão
    // que `funcaosocialterra/page.tsx` já usa: `<main>` envolvendo
    // `<header>` e `<footer>` próprios da página.
    // O `py-12 sm:py-16` original abria 48–64 px entre o letreiro
    // ("✦ OLHO ABERTO ✦", dentro do TopNav) e o primeiro bloco da home. O
    // dono pediu (04/10/2026) que o letreiro e o cartão "Mística do Dia"
    // ficassem próximos: o topo vira um respiro fino (`pt-2`, 8 px) e o
    // rodapé da página mantém o espaço de sempre.
    // ⟲ 06/10, dono: a home VOLTOU ao que era antes da abertura viva —
    // título "CONTROLE POPULAR" em cima da foto da onça, entre as
    // citações. Sem AberturaHero aqui; os 4 eixos seguem com a abertura.
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-4xl px-4 pt-2 pb-12 sm:pb-16"
    >
      {/* ═══ DIAS IMPORTANTES DOS POVOS INDÍGENAS — antes da Mística, com o
          nome da data, objetivo e contexto de criação (dono, 03/10/2026),
          em no máximo duas linhas. Sem data no dia, não renderiza nada. */}
      <DiasImportantes />

      {/* ═══ MÍSTICA DO DIA — luta popular ou fato de resistência do dia,
          com fonte ABNT. Pedido do dev (29/09/2026): fica abaixo da nav
          bar e do letreiro "✦ OLHO ABERTO ✦" (que vivem no TopNav/Marquee)
          e acima da capa-hero. Sem entrada do dia, não renderiza nada. */}
      <MisticaDoDia />

      <CapaHome />

      <AvisoPortal />

      <CardMineracao />

      {/* ═══ CARROSSEL 3D INTERATIVO DOS 3 EIXOS TEMÁTICOS (ABAIXO DA HERO) ═══ */}
      <CardCarousel />

      <PainelDados />

      <header className="space-y-4">
        <AtalhosHome />
        <EixosTematicos />
      </header>

      {/* Sanfona das frentes (etapa 4 PLANO-TEMA-PEQUI, previa v7.1):
          escolha rapida — um painel por vez, rotacao 4,5s, pausa em
          hover/foco, setas do teclado navegam, reduced-motion so manual.
          O grid de seis cards continua abaixo para quem quer tudo de
          uma vez: a sanfona nao substitui, apresenta. */}
      <SanfonaFrentes />

      {/* ═══ CARTÃO INTERATIVO DO SEU NONÔ — IA CIDADÃ COM ATALHOS DIRETOS ═══ */}
      <CartaoChatbotHome />

      <GridFrentes cidades={cidades} />

      <BannerDireitos />

      <SecaoMultiportal />

      <Manifesto />

      <FechoHome />

      <FooterGlobal />
    </main>
  );
}

/**
 * Capa hero da home: foto da onca + ShapeBlur (anel de luz que segue o cursor).
 */
function CapaHome({ }) {
  return (
    <>

      {/* ═══ CAPA HOME — foto com overlay + texto (rebrand visual).
          ⟲ 06/10, dono: o <h1> "CONTROLE POPULAR" voltou para CIMA da
          foto da onça, entre as citações — a abertura viva saiu da home
          (continua nos 4 eixos). Dois <h1> não existem mais aqui: o
          título é só este.
          ⟲ 06/10, dono (rodada 7): a forma "anel" do ShapeBlur entra por
          cima da foto — luz que segue o cursor. É decoração: camada
          `pointer-events: none`, `aria-hidden` por natureza (canvas), e o
          componente NEM MONTA sob movimento reduzido ou alto contraste
          (`useEfeitoPermitido` no próprio `ShapeBlur.tsx`). */}
      <section className="relative">
        <CapaFrente
          imagem="capas/home-page.webp"
          alt="Capa do Controle Popular — Observatório Nacional Socioambiental"
          titulo="CONTROLE POPULAR"
          layout="home"
          epigrafes={[
            {
              texto:
                "Ela deita sementes para morrerem ou brotarem.\nEla semeia sonhos pra ver germinar sobrevivência.",
              atribuicao: "Itamar Vieira Junior, Coração Sem Medo, 2025",
            },
          ]}
          resumo="Portal virtual do ONSA — Observatório Nacional Socioambiental. Com raízes na História e Geografia, esse portal se utiliza da tecnologia da Inteligência Artificial (IA) pra somar na busca por justiça socioambiental e fiscalização cidadã, acessível pela internet, gratuitamente e sem cadastro por qualquer celular ou computador."
        />
        <div className="pointer-events-none absolute inset-0">
          <ShapeBlur variacao={2} />
        </div>
      </section>
    </>
  );
}

/**
 * Aviso de que o portal inteiro esta lancado, com creditos (pedido do dono, 01/10/2026).
 */
function AvisoPortal({ }) {
  return (
    <>

      {/* ═══ AVISO — O PORTAL INTEIRO LANÇADO — pedido do dono, 01/10/2026:
          o card de baixo dava a entender que só aquele cruzamento estava em
          revisão. A correção é esta frase, num card próprio, acima do card do
          cruzamento. O crédito vem em fonte menor, como pedido. ═══ */}
      <section
        aria-label="Portal lançado publicamente"
        className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-xs"
      >
        <p className="max-w-3xl text-base leading-relaxed">
          O portal inteiro está lançado publicamente para acesso, colaboração e revisão.
        </p>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-text-soft">
          Até agora, Desenvolvimento por:{" "}
          <a
            href="https://linktr.ee/arturcolito"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Artur Colito
          </a>{" "}
          - (Github:{" "}
          <a
            href="https://github.com/FinweeJur"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            FinweeJur
          </a>
          ), advogado popular mestrando em Estudos Rurais na{" "}
          <a
            href="https://guiaufvjm.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            UFVJM
          </a>{" "}
          em parceria com o Instituto Esperança Maria. Com inspiração em movimentos populares e
          sociedade civil organizada — Veja mais em{" "}
          <Link href="/sobre" className="underline underline-offset-2 hover:text-foreground">
            Sobre o Portal
          </Link>
          .
        </p>
      </section>
    </>
  );
}

/**
 * Card do cruzamento territorios x mineracao em MG (pedido do dono, 01/10/2026).
 */
function CardMineracao({ }) {
  return (
    <>

      {/* ═══ CRUZAMENTO DE TERRITÓRIOS E MINERAÇÃO — pedido do dono,
          01/10/2026: este card fica abaixo do aviso e não fala mais de
          revisão (a revisão agora é do portal inteiro, no card de cima).
          O destino não muda: /mineracao/ilegal é a página que faz o
          cruzamento. ═══ */}
      <section
        aria-label="Territórios e mineração em Minas Gerais"
        className="mt-4 rounded-2xl border border-alert/40 bg-alert/10 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
          Territórios e mineração
        </p>
        <h2 className="mt-1 text-xl font-semibold">
          Mineração e comunidades tradicionais em Minas Gerais
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
          Publicamos o cruzamento das terras indígenas e dos territórios quilombolas de Minas Gerais com a
          mineração detectada por satélite e com a bacia do rio Paraopeba. É material aberto — aponte erro,
          lacuna ou dado faltante e o portal corrige na fonte oficial.
        </p>
        <Magnet forca={0.15} className="mt-3 inline-block">
          <NextLink
            href="/mineracao/ilegal"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-ink"
          >
            Ver os dados →
          </NextLink>
        </Magnet>
      </section>
    </>
  );
}

/**
 * Painel de impacto: totais medidos (R$ monitorados, cidades, proposicoes) + acervo do bases-portal.json.
 */
function PainelDados({ }) {
  return (
    <>

      {/* ═══ RESUMO DE DADOS GERAIS (PAINEL DE IMPACTO POPULAR) ═══ */}
      <section aria-label="Painel de dados gerais monitorados" className="my-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-border">
          <div className="text-center sm:text-left sm:pr-4">
            <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
              MONITORADOS AGORA
            </p>
            <p className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              R$ 251 bi
            </p>
            <p className="mt-1 text-xs text-muted">
              Soma pública: Rio Doce (R$ 171 bi) + Brumadinho (R$ 37,7 bi) + Justiça MG (R$ 20,1 bi) + cidades monitoradas (R$ 22,7 bi)
            </p>
          </div>

          <div className="text-center sm:text-left sm:px-6">
            <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
              CIDADES NO RADAR
            </p>
            <p className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              203
            </p>
            <p className="mt-1 text-xs text-muted">
              27 capitais e 176 polos estratégicos mapeados em todo o Brasil
            </p>
          </div>

          <div className="text-center sm:text-left sm:pl-6">
            <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
              PROPOSIÇÕES FICHADAS
            </p>
            <p className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              1.389
            </p>
            <p className="mt-1 text-xs text-muted">
              Projetos de lei e atos oficiais analisados com régua de direitos humanos
            </p>
          </div>
        </div>
        <p className="mt-5 border-t border-border pt-3 text-center text-xs text-muted">
          Acervo reunido e medido: <strong className="text-foreground">{formatNumberBR(basesPortal.total_arquivos)} bases</strong>,{" "}
          <strong className="text-foreground">{formatNumberBR(basesPortal.total_registros)} registros</strong> em{" "}
          {basesPortal.temas.length} temas — cada um com link para a fonte oficial.
        </p>
      </section>
    </>
  );
}

/**
 * Paragrafo de abertura + atalhos magneticos (busca, cidades, alertas, paginas vistas).
 */
function AtalhosHome({ }) {
  return (
    <>

        {/* O wordmark da marca ficou só na barra global (`TopNav.tsx`), acima
            desta página — e o `<h1>` da página vive dentro do hero
            narrativo, logo acima deste bloco. */}
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Reunindo dezenas de portais e dados públicos, estamos cobrindo milhares de contratos, convênios, licenciamentos ambientais, pesquisas e autorizações minerárias e de barragens, legislação ambiental e de direitos humanos unificada, e o orçamento detalhado das prefeituras, governo de Minas, Congresso Brasileiro e Instituições de Justiça.
        </p>
        {/* `<div>`, não `<p>`: o Magnet embrulha cada atalho num `div`, e `div`
            dentro de `p` é HTML inválido — o navegador "conserta" fechando o
            parágrafo e a hidratação acusa divergência (regra dura do App
            Router). O estilo é o mesmo. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[.95em]">
          {/* Atalhos de texto: só o ímã, sem anel de brilho — moldura em texto
              corrido vira ruído (mesma régua dos créditos e do rodapé). */}
          <Magnet forca={0.2}>
            <NextLink href="/busca" className="font-medium text-primary hover:underline">
              Busca por tema, palavra-chave e território →
            </NextLink>
          </Magnet>
          <Magnet forca={0.2}>
            <NextLink href="/cidades" className="font-medium text-primary hover:underline">
              203 Cidades Estratégicas (Capitais & Polos) →
            </NextLink>
          </Magnet>
          <Magnet forca={0.2}>
            <NextLink href="/alertas" className="font-medium text-primary hover:underline">
              Alertas & Notificações (Telegram, E-mail & WhatsApp) →
            </NextLink>
          </Magnet>
          <Magnet forca={0.2}>
            <NextLink href="/dados/populares" className="font-medium text-primary hover:underline">
              Páginas mais vistas →
            </NextLink>
          </Magnet>
        </div>
    </>
  );
}

/**
 * Grade dos 4 eixos tematicos — a arquitetura civica atual do portal.
 */
function EixosTematicos({ }) {
  return (
    <>

        {/* ═══ OS 4 EIXOS TEMÁTICOS (ARQUITETURA CÍVICA ATUAL) ═══ */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Navegação por Eixos Temáticos
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted border border-border">
              4 Eixos • 36+ Subfrentes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <Magnet forca={0.08} className="h-full">
            <NextLink
              href="/terra-e-territorios"
              className="flex h-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3 text-xs font-semibold text-foreground transition-all hover:border-emerald-500/40 hover:bg-surface-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-eixo-terra, #1b6348)' }} />
              <div>
                <div className="font-bold text-foreground">1. Terra e Território</div>
                <div className="text-xs font-normal text-muted">203 Cidades, Bacias, Serras, Clima</div>
              </div>
            </NextLink>
            </Magnet>
            <Magnet forca={0.08} className="h-full">
            <NextLink
              href="/direitos-em-movimento"
              className="flex h-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3 text-xs font-semibold text-foreground transition-all hover:border-alert/40 hover:bg-surface-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-eixo-direitos, #c0392b)' }} />
              <div>
                <div className="font-bold text-foreground">2. Direitos em Movimento</div>
                <div className="text-xs font-normal text-muted">SUS, IDEB, Emprego, LAI, Ajuda</div>
              </div>
            </NextLink>
            </Magnet>
            <Magnet forca={0.08} className="h-full">
            <NextLink
              href="/estado-e-economia"
              className="flex h-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3 text-xs font-semibold text-foreground transition-all hover:border-sky-500/40 hover:bg-surface-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-eixo-estado, #1e3a8a)' }} />
              <div>
                <div className="font-bold text-foreground">3. Estado e Economia</div>
                <div className="text-xs font-normal text-muted">Orçamento, 27 ALs, Judiciário, ESG</div>
              </div>
            </NextLink>
            </Magnet>
            <Magnet forca={0.08} className="h-full">
            <NextLink
              href="/central"
              className="flex h-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-surface-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: 'var(--cp-primary, #b45309)' }} />
              <div>
                <div className="font-bold text-foreground">4. Central ONSA e Ferramentas</div>
                <div className="text-xs font-normal text-muted">Editais, 24k Docs, Rádios, Seu Nonô</div>
              </div>
            </NextLink>
            </Magnet>
          </div>
        </div>
    </>
  );
}

/**
 * Sanfona nao entra aqui: e o grid das frentes (id=frentes, alvo da ancora do hero) + o paragrafo de orientacao acima dele. O card de cidades vira CardCidades, os demais CardZona.
 */
function GridFrentes({ cidades }: { cidades: Cidades }) {
  return (
    <>

      {/* Linha de orientação -- decisão do dev, 22/08 (decisão 8 de
          `docs/ESTADO.md`; achado e redação candidata em
          `docs/planos/REVISAO-UX-E-ONBOARDING.md` §7 "seis cards + um
          banner"). Quem chega sem saber o nome de nenhuma das seis
          frentes varre 6 blocos de texto denso antes de confirmar qual
          é o certo -- o achado registrou duas saídas: redesenhar
          hierarquia (destacar/reordenar card, fora de escopo aqui, é
          decisão de identidade visual) ou uma linha simples acima do
          grid, sem tocar nos cards. Esta é a segunda: orienta sem
          decidir por quem lê ("é o seu", não "clique aqui"), e não
          nomeia o card por título -- o card de Cidades não estampa a
          palavra "Cidades" em lugar nenhum (`s.etiqueta` e `s.titulo`
          dizem outra coisa), só a posição é estável. "Sua cidade" ecoa
          de propósito o título desse card (`lib/zonas.ts`: "Para onde
          vai o dinheiro da sua cidade"). Token e tamanho são os MESMOS
          do parágrafo de abertura logo acima e da descrição de cada
          card (`text-text-soft`, `.95em`) -- sem cor nova, sem alarde
          visual, como o pedido exige. */}
      <p className="mt-10 max-w-2xl text-[.95em] text-text-soft">
        Procurando sua cidade? O primeiro card abaixo é o seu.
      </p>

      {/* `id="frentes"`: alvo da âncora real do hero narrativo ("Conhecer
          as frentes"). `scroll-margin-top` para não colar no topo. */}
      <div
        id="frentes"
        className="mt-3 grid scroll-mt-20 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SECOES.map((s) =>
          s.id === "cidades" ? (
            <CardCidades key={s.id} s={s} cidades={cidades} />
          ) : (
            <CardZona key={s.href} s={s} />
          )
        )}
      </div>
    </>
  );
}

/**
 * O card de cidades nao e UM link: e um cartao com N destinos — aninhar <a> dentro de <a> e HTML invalido.
 */
function CardCidades({ s, cidades }: { s: ZonaItem; cidades: Cidades }) {
  // O card de cidades não é UM link: é um cartão com N destinos.
  // Aninhar <a> dentro de <a> é HTML inválido e o navegador
  // "conserta" fechando o de fora — o que quebraria os links das
  // cidades em vez de dar erro visível.
  return (
    <>

      <Magnet key={s.id} forca={0.05} afastamento={40} className="h-full">
      <BorderGlow
        className="h-full rounded-lg border border-border bg-surface p-6"
        corFundo="var(--cp-surface)"
        raio={12}
      >
      <div className="flex h-full flex-col">
        <span
          className="text-[.88em] font-semibold uppercase tracking-wide"
          style={{ color: s.cor }}
        >
          {s.etiqueta}
        </span>
        <h2 className="mt-2 font-display text-xl font-semibold">{s.titulo}</h2>
        <p className="mt-2 text-[.95em] text-text-soft">{s.descricao}</p>
        <ul className="mt-4 flex flex-col gap-2">
          <li>
            <Magnet forca={0.12}>
              <NextLink
                href="/cidades"
                className="flex items-baseline justify-between gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-[.95em] font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <span>Ver todas as 203 Cidades Estratégicas (Capitais & Polos)</span>
                <span aria-hidden="true">→</span>
              </NextLink>
            </Magnet>
          </li>
          {cidades.map((c) => (
            <li key={c.slug}>
              <BotaoBrilho bloco raio={6} forca={0.14} afastamento={30}>
                <a
                  href={`/${c.slug}`}
                  className="flex items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-[.95em] font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  <span>
                    {c.nome}
                    <span className="text-text-soft"> · {c.uf}</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </a>
              </BotaoBrilho>
            </li>
          ))}
        </ul>
      </div>
      </BorderGlow>
      </Magnet>
    </>
  );
}

/**
 * Card generico de zona. <a> cru, nao next/link: estes caminhos estao FORA do basePath deste app e o next/link prefixaria (bug ja acontecido 3x, ver next.config.ts).
 */
function CardZona({ s }: { s: ZonaItem }) {
  // <a> puro, não next/link: estes caminhos estão FORA do basePath
  // deste app (`/betim`), e o next/link prefixaria, gerando
  // `/betim/congresso`. É a mesma classe de bug que os comentários
  // do `next.config.ts` registram já ter acontecido três vezes.
  return (
    <>

    <Magnet key={s.href} forca={0.05} afastamento={40} className="h-full">
      <BorderGlow
        className="h-full rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
        corFundo="var(--cp-surface)"
        raio={12}
      >
        <a href={s.href} className="group flex h-full flex-col">
          <span
            className="text-[.88em] font-semibold uppercase tracking-wide"
            style={{ color: s.cor }}
          >
            {s.etiqueta}
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
            {s.titulo}
          </h2>
          <p className="mt-2 text-[.95em] text-text-soft">{s.descricao}</p>
          <ul className="mt-4 space-y-1.5 text-[.9em] text-text-soft">
            {s.itens.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" style={{ color: s.cor }}>
                  ·
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <span className="mt-5 font-medium text-primary">Entrar →</span>
        </a>
      </BorderGlow>
    </Magnet>
    </>
  );
}

/**
 * Banner transversal de Direitos em Movimento — nao e uma frente do grid (decisao do dev, 13/08; ver lib/zonas.ts).
 */
function BannerDireitos({ }) {
  return (
    <>

      {/* ═══ DIREITOS EM MOVIMENTO — BLOCO PRÓPRIO, NÃO É UMA FRENTE ═══
          Decisão do dev (13/08): NÃO entra em `ZONAS`/`SECOES` acima. As
          frentes são EIXOS DE PODER — lugares onde alguém decide sobre a
          vida da pessoa (prefeitura/câmara, Congresso, tribunais, COPAM,
          terra, e agora a reparação de Brumadinho). Esta seção não é mais
          um desses lugares de decisão; é o que a pessoa FAZ com o que
          achou nas outras — transversal, não paralela. Entrar em `ZONAS`
          faria a seção reivindicar um estatuto que não tem, e arrastaria
          layout/nav/rodapé de zona que ela não precisa (ver
          `lib/zonas.ts`). Por isso o tratamento visual abaixo é
          deliberadamente diferente do grid de cards acima — cor própria
          (`--cp-alert`, não usada por nenhuma frente) e forma de banner
          largo, não mais um card na grade.
          ⟲ 13/08, Paraopeba: o texto renderizado usa
          `contagemZonasPublicadas()`, não o numeral cravado — a sexta
          frente que motivou essa troca é exatamente esta seção. */}
      <section
        className="mt-10 rounded-lg border-2 p-6"
        style={{ borderColor: "var(--cp-alert)" }}
      >
        <span
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-alert)" }}
        >
          Transversal às {contagemZonasPublicadas()} frentes
        </span>
        <h2 className="mt-2 font-display text-xl font-semibold">Direitos em Movimento</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Sofreu ou viu uma violação de direito? Que lei protege, onde buscar ajuda, como
          pedir informação e como denunciar — reunidos num lugar só, sem precisar saber em
          que frente do site cada resposta mora.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[.85em]">
          <BotaoBrilho raio={999} forca={0.16} afastamento={28}>
            <NextLink
              href="/ambiental/legislacao"
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary inline-block"
            >
              Que lei protege isso
            </NextLink>
          </BotaoBrilho>
          <BotaoBrilho raio={999} forca={0.16} afastamento={28}>
            <NextLink
              href="/direitos-em-movimento/ajuda"
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary inline-block"
            >
              Onde buscar ajuda
            </NextLink>
          </BotaoBrilho>
          <BotaoBrilho raio={999} forca={0.16} afastamento={28}>
            <NextLink
              href="/direitos-em-movimento/informacao"
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary inline-block"
            >
              Como pedir informação
            </NextLink>
          </BotaoBrilho>
          <BotaoBrilho raio={999} forca={0.16} afastamento={28}>
            <NextLink
              href="/direitos-em-movimento/denuncia"
              className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary inline-block"
            >
              Como denunciar
            </NextLink>
          </BotaoBrilho>
        </div>
        <Magnet forca={0.15} className="mt-4 inline-block">
          <NextLink
            href="/direitos-em-movimento"
            className="inline-block font-medium"
            style={{ color: "var(--cp-alert)" }}
          >
            Entrar em Direitos em Movimento →
          </NextLink>
        </Magnet>
      </section>
    </>
  );
}

/**
 * Por que mais de um portal: separa Poder de frente do portal; a contagem sai de lib/zonas.ts.
 */
function SecaoMultiportal({ }) {
  return (
    <>

      {/* ⟲ 13/08: dizia "Por que TRÊS portais", e o texto contava três
          frentes — a herança dos três sites que foram unificados num só.
          Ficou colado embaixo de CINCO cartões, e nessa vizinhança ele lia
          como contagem furada, não como história. O conceito não estava
          errado: os três Poderes continuam sendo três. O que envelheceu foi
          tratar "Poder" e "frente do portal" como a mesma coisa — meio
          ambiente é o estado agindo dentro do Executivo, e terra atravessa
          os três. Agora o texto separa as duas ideias em vez de fingir que
          coincidem, e a contagem sai de `lib/zonas.ts` como em todo lugar. */}
      <section className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold">Por que mais de um portal</h2>
        <p className="mt-2 text-[.95em] text-text-soft">
          O poder público se divide, e cada parte decide algo diferente: o dinheiro é
          executado na prefeitura e na câmara municipal, os direitos são definidos — e às
          vezes reduzidos — no Congresso, e é o Judiciário quem interpreta essas leis e
          resolve os conflitos, sem que ninguém tenha votado em quem ocupa essas cadeiras.
          A isso somam-se três frentes que não são um quarto Poder: duas são onde o Estado
          decide sobre o território — o licenciamento ambiental de Minas e quem é dev da
          terra —, e a terceira acompanha se uma reparação já decidida na Justiça está
          sendo paga de verdade, mês a mês. São {contagemZonasPublicadas()} ao todo, e
          acompanhar só uma deixa boa parte da história de fora.
        </p>
      </section>
    </>
  );
}

/**
 * Manifesto final (copy v6, PLANO-COPY-VOZ.md) com epigrafe de abertura.
 */
function Manifesto({ }) {
  const citacaoBirri = citacaoPorId("birri-utopia");
  return (
    <>

      {/* MANIFESTO — ⟲ 02/09, copy v6 (docs/planos/PLANO-COPY-VOZ.md,
          seção "Manifesto final"). */}
      <section className="mt-8 rounded-lg border border-border p-6 space-y-4">
        {citacaoBirri && <Epigrafe citacao={citacaoBirri} variante="inicio" />}
        <h2 className="font-display text-lg font-semibold">
          O povo pergunta. O número não mente.
        </h2>
        <p className="text-[.95em] text-text-soft leading-relaxed">
          De Vila Rica a Salvador, do sertão do Quebra-Quilos à Serra da Barriga, das
          sacadas de Diamantina ao Anhangabaú lotado: o povo deste país sempre perguntou,
          sempre se organizou — e sempre achou um jeito de cantar no meio do caminho.
          Direito não é favor, não é concessão, não é promessa. E o dinheiro continua
          sendo seu.
        </p>
      </section>
    </>
  );
}

/**
 * Rodape de fontes oficiais + fecho literario (epigrafe Guimaraes Rosa).
 */
function FechoHome({ }) {
  const citacaoGuimaraes = citacaoPorId("guimaraes-rosa-coragem");
  return (
    <>

      <footer className="mt-10 space-y-2 text-[.85em] text-text-soft">
        <p>
          Todos os dados vêm de fontes oficiais e cada número mostra de onde saiu. As
          classificações de ampliação ou restrição de direitos seguem uma régua declarada
          e auditável, publicada na seção do Congresso; a data de aposentadoria de cada
          ministro segue a mesma disciplina, publicada na seção do Judiciário.
        </p>
      </footer>
      {citacaoGuimaraes && (
        <section aria-label="Fecho literário" className="my-8">
          <Epigrafe citacao={citacaoGuimaraes} variante="fecho" />
        </section>
      )}
    </>
  );
}
