"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Bell } from "lucide-react";
import Link from "next/link";

import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import BuscaGlobal from "@/app/components/BuscaGlobal";
import CvdToggle from "@/app/components/CvdToggle";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";

/**
 * Cidades atendidas pelo eixo Cidades. Lista curta e estável — mantida aqui
 * (não importada de `cidades-do-build.ts`) para não arrastar o JSON completo
 * do build para o bundle client-side da navbar, que é carregada em todas as
 * páginas.
 */
const CIDADES_MENU = [
  { nome: "Betim", slug: "betim" },
  { nome: "Belo Horizonte", slug: "bh" },
  { nome: "Araçuaí", slug: "aracuai" },
  { nome: "Diamantina", slug: "diamantina" },
  { nome: "Itinga", slug: "itinga" },
  { nome: "São Paulo", slug: "sp" },
] as const;

/**
 * Estrutura do novo menu do portal: um índice expansível agrupado por frente,
 * com as principais subpáginas de cada uma. A navegação funciona como a wiki
 * do site: cada seção é um capítulo e os links são as páginas dentro dele.
 *
 * Todos os links são `<a href>` cru, NUNCA o `<Link>` de zona
 * (`lib/link-zona.tsx`): este componente é global e um wrapper de zona
 * prefixaria caminhos absolutos como `/congresso/proposicoes` com o segmento
 * da zona atual, gerando 404s mudos. Ver o mesmo aviso em `FooterGlobal.tsx`.
 */
const SECOES_MENU = [
  {
    id: "cidades",
    titulo: "Cidades",
    href: "/betim",
    links: CIDADES_MENU.map((c) => ({ label: c.nome, href: `/${c.slug}` })),
  },
  {
    id: "congresso",
    titulo: "Congresso",
    href: "/congresso",
    links: [
      { label: "Proposições", href: "/congresso/proposicoes" },
      { label: "Votações", href: "/congresso/votacoes" },
      { label: "Comissões", href: "/congresso/comissoes" },
      { label: "Bancadas", href: "/congresso/bancadas" },
      { label: "Parlamentares", href: "/congresso/parlamentares" },
      { label: "Agenda", href: "/congresso/agenda" },
      { label: "Alertas", href: "/congresso/alertas" },
      { label: "Bons exemplos", href: "/congresso/bons-exemplos" },
      { label: "Metodologia", href: "/congresso/metodologia" },
    ],
  },
  {
    id: "judiciario",
    titulo: "Judiciário",
    href: "/judiciario",
    links: [
      { label: "Tribunais", href: "/judiciario/tribunais" },
      { label: "Indicações", href: "/judiciario/indicacoes" },
      { label: "Vagas", href: "/judiciario/vagas" },
      { label: "Inspeções", href: "/judiciario/inspecoes" },
      { label: "Correições trabalhistas", href: "/judiciario/correicoes-trabalhistas" },
      { label: "Presídios", href: "/judiciario/presidios" },
      { label: "Defensoria", href: "/judiciario/defensoria" },
      { label: "Instituições", href: "/judiciario/instituicoes" },
      { label: "Números", href: "/judiciario/numeros" },
      { label: "Metodologia", href: "/judiciario/metodologia" },
    ],
  },
  {
    id: "ambiental",
    titulo: "ONSA",
    href: "/ambiental",
    links: [
      { label: "COPAM", href: "/ambiental/copam" },
      { label: "Licenciamento", href: "/ambiental/licenciamento" },
      { label: "Barragens", href: "/ambiental/barragens" },
      { label: "Legislação", href: "/ambiental/legislacao" },
      { label: "Direito crítico", href: "/ambiental/direito-critico" },
      { label: "Decisões", href: "/ambiental/decisoes" },
      { label: "TAC", href: "/ambiental/tac" },
      { label: "Patrimônio cultural", href: "/ambiental/patrimonio-cultural" },
      { label: "Convênios", href: "/ambiental/convenios" },
      { label: "Crimes socioambientais", href: "/ambiental/crimes-socioambientais" },
      { label: "Clima e risco", href: "/ambiental/clima-risco" },
      { label: "Conselhos e bacias", href: "/ambiental/conselhos" },
      { label: "Direitos humanos", href: "/ambiental/direitos-humanos" },
      { label: "Rio Doce (Mariana)", href: "/ambiental/mariana" },
    ],
  },
  {
    id: "paraopeba",
    titulo: "Paraopeba",
    href: "/paraopeba",
    links: [
      { label: "Entenda", href: "/paraopeba/entenda" },
      { label: "Execução do Acordo", href: "/paraopeba/execucao" },
      { label: "Auditoria", href: "/paraopeba/auditoria" },
      { label: "Análise", href: "/paraopeba/analise" },
      { label: "Perícia", href: "/paraopeba/pericia" },
      { label: "Auxílio Emergencial", href: "/paraopeba/auxilio" },
      { label: "Documentos", href: "/paraopeba/documentos" },
      { label: "Biblioteca", href: "/paraopeba/biblioteca" },
      { label: "Clipping", href: "/paraopeba/clipping" },
      { label: "Linha do tempo", href: "/paraopeba/linha-do-tempo" },
      { label: "Quem atua", href: "/paraopeba/quem-atua" },
    ],
  },
  {
    id: "terras",
    titulo: "Terra e território",
    href: "/funcaosocialterra",
    links: [
      { label: "Mapa 3D", href: "/funcaosocialterra/mapa" },
      { label: "Alertas", href: "/funcaosocialterra/alertas" },
    ],
  },
  {
    id: "transversal",
    titulo: "Transversal",
    href: "/indice",
    links: [
      { label: "Índice do portal", href: "/indice" },
      { label: "Alertas e Notificações", href: "/alertas" },
      { label: "Direitos em Movimento", href: "/direitos-em-movimento" },
      { label: "Busca", href: "/busca" },
      { label: "Dados populares", href: "/dados/populares" },
      { label: "Governo federal nas cidades", href: "/dados/comunicabr" },
      { label: "Sobre o projeto", href: "/sobre" },
      { label: "Termos e origem dos dados", href: "/termos" },
    ],
  },
] as const;

/**
 * ═══ BARRA SUPERIOR GLOBAL (pedido do dono, 16/08/2026) ═══
 *
 * A navbar fixa de TODAS as páginas do portal. Antes dela, cada zona tinha
 * a sua própria barra: a de cidade era a única fixa, e na home e nas páginas
 * raiz não havia barra nenhuma — "nem sempre aparece". Agora há UMA barra,
 * no layout raiz, fixa (`sticky`), em toda página.
 *
 * Declutter ao mesmo tempo: o logo fica no canto e abre o MENU DO PORTAL no
 * hover/foco/clique — as zonas, Direitos em Movimento, Sobre —, tirando da
 * barra a fileira de botões de zona irmã que cada header repetia. Os
 * controles de tema/tamanho/contraste também sobem pra cá (uma cópia só, em
 * vez de quatro). Com isso os headers de zona ficam só com a navegação da
 * própria zona e a faixa de busca.
 *
 * ═══ MENU EXPANSÍVEL POR FRENTE (wiki) ═══
 *
 * O botão do logo abre um painel de índice organizado em seções: Cidades,
 * Congresso, Judiciário, Meio ambiente, Paraopeba, Terra e território, e
 * Transversal. Cada seção lista as principais subpáginas, como um sumário de
 * wiki. O objetivo é permitir que o leitor salte entre frentes e entre páginas
 * de uma mesma frente sem voltar à home.
 *
 * ═══ POR QUE É CLIENT E COMO O MENU ABRE ═══
 *
 * `hover` sozinho quebra celular e teclado (o skill de acessibilidade do
 * projeto lista os dois como críticos). O menu abre por TRÊS caminhos:
 *
 *   1. hover (desktop) — `group-hover` no CSS, sem JS;
 *   2. teclado — `group-focus-within`: Tab até o logo mantém o menu aberto e
 *      os links entram na tabulação normal (são `<a>` puros, não role="menu");
 *   3. toque/clique — um estado real (`menuAberto`) no botão do logo, com
 *      `aria-expanded`/`aria-controls`, Escape e clique-fora para fechar.
 *
 * O estado `hoverAberto` existe para o `aria-expanded` dizer a verdade quando
 * o menu abriu por hover — sem ele o botão anunciaria "recolhido" com o menu
 * aberto na tela. E o clique NÃO fecha em desktop com o cursor ainda em cima:
 * `hoverAberto` continua verdadeiro, o menu segue aberto (é um menu de hover),
 * e fecha ao sair, no Escape ou no clique fora.
 */
export default function TopNav() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [hoverAberto, setHoverAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function fecharFora(ev: PointerEvent) {
      if (!caixaRef.current?.contains(ev.target as Node)) setMenuAberto(false);
    }
    function fecharEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    };
  }, []);

  const aberto = menuAberto || hoverAberto;

  function fechar() {
    setMenuAberto(false);
    setHoverAberto(false);
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function onMouseEnter() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHoverAberto(true);
  }

  function onMouseLeave() {
    hoverTimer.current = setTimeout(() => {
      setHoverAberto(false);
      hoverTimer.current = null;
    }, 300);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8">
        <div
          ref={caixaRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="relative"
        >
          <button
            type="button"
            onClick={() => setMenuAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-portal"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 font-display text-[1.05em] font-bold tracking-tight text-text transition-colors duration-150 hover:border-border hover:bg-surface-2"
          >
            <Menu size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>
              controlepopular<span className="text-primary">.br</span>
            </span>
          </button>

          <nav
            id="menu-portal"
            aria-label="Menu do portal"
            className={`absolute top-full left-0 z-50 mt-1 max-h-[calc(100vh-5rem)] w-[min(48rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-lg ${
              aberto ? "block" : "hidden"
            } sm:p-4`}
          >
            {/* Header: atalhos globais */}
            <div className="mb-3 flex flex-wrap gap-2 border-b border-border pb-3 sm:mb-4 sm:pb-4">
              <a
                href="/"
                onClick={fechar}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface-2"
              >
                Início
              </a>
              <a
                href="/indice"
                onClick={fechar}
                className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/10"
              >
                Índice do portal
              </a>
            </div>

            {/* Grade de seções por frente */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SECOES_MENU.map((secao) => (
                <section key={secao.id} aria-labelledby={`menu-${secao.id}`}>
                  <h2
                    id={`menu-${secao.id}`}
                    className="mb-1.5 text-[.72em] font-semibold uppercase tracking-wide text-text-soft"
                  >
                    <a
                      href={secao.href}
                      onClick={fechar}
                      className="hover:text-primary focus-visible:outline-none focus-visible:underline"
                    >
                      {secao.titulo}
                    </a>
                  </h2>
                  <ul className="space-y-0.5">
                    {secao.links.map((link) => (
                      <li key={link.href + link.label}>
                        <a
                          href={link.href}
                          onClick={fechar}
                          className="block rounded-md px-2 py-1 text-[.9em] text-text transition-colors duration-150 hover:bg-surface-2 hover:text-primary"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
        </div>
        <BuscaGlobal />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/alertas"
            className="cp-btn-anim flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
            aria-label="Central de Alertas e Notificações"
          >
            <Bell size={13} aria-hidden="true" className="text-primary" />
            <span className="hidden sm:inline">Alertas</span>
          </Link>
          <Link
            href="/busca"
            className="cp-btn-anim rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
          >
            Busca →
          </Link>
          <ThemeSwitcher />
          <CvdToggle />
          <FontSizeControl />
        </div>
      </div>
    </header>
  );
}
