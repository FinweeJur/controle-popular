"use client";

import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Bell,
  Newspaper,
  HeartHandshake,
  Globe,
  Landmark,
  Compass,
  Activity,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  HelpCircle,
  FileQuestion,
  Send,
  MapPin,
  Waves,
  Mountain,
  AlertTriangle,
  Scale,
  ShoppingBag,
  Building2,
  BarChart3,
  Cpu,
  List,
  Search,
  Info,
  Code2,
  BookOpen,
  PhoneCall,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import BuscaGlobal from "@/app/components/BuscaGlobal";
import CvdToggle from "@/app/components/CvdToggle";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";
import Marquee from "@/app/components/Marquee";
import OuvirNavbar from "@/app/components/OuvirNavbar";

/**
 * Cidades atendidas pelo eixo Cidades. Lista curta e estável.
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
 * Estrutura do menu do portal organizada nos 3 Grandes Eixos Temáticos e Central:
 * - Eixo 1: Direitos em Movimento (vermelho/coral)
 * - Eixo 2: Terra e Territórios (verde/esmeralda)
 * - Eixo 3: Estado e Economia (azul/celeste)
 * - Central: Notícias, Tecnologia e Ferramentas ONSA (laranja pequi)
 */
const SECOES_MENU = [
  {
    id: "direitos",
    badge: "EIXO 1",
    titulo: "Direitos em Movimento",
    href: "/direitos-em-movimento",
    icone: HeartHandshake,
    cor: "var(--cp-eixo-direitos)",
    corClasse: "text-alert hover:text-alert",
    badgeClasse: "bg-alert/10 text-alert border-alert/30",
    links: [
      { label: "Visão Geral do Eixo", href: "/direitos-em-movimento", icone: HeartHandshake },
      { label: "Saúde Pública & SUS", href: "/direitos-em-movimento/saude-publica", icone: Activity },
      { label: "Educação & Escolas (IDEB)", href: "/direitos-em-movimento/educacao", icone: GraduationCap },
      { label: "Trabalho & Emprego (CAGED)", href: "/direitos-em-movimento/trabalho-e-renda", icone: Briefcase },
      { label: "Que Lei Protege Isso", href: "/ambiental/legislacao", icone: ShieldCheck },
      { label: "Conselhos de Direitos", href: "/direitos-em-movimento/conselhos", icone: Users },
      { label: "Onde Buscar Ajuda", href: "/direitos-em-movimento/ajuda", icone: HelpCircle },
      { label: "Pedir Informação (LAI)", href: "/direitos-em-movimento/informacao", icone: FileQuestion },
      { label: "Canal de Denúncia Local", href: "/direitos-em-movimento/denuncia", icone: Send },
    ],
  },
  {
    id: "terra",
    badge: "EIXO 2",
    titulo: "Terra e Territórios",
    href: "/terra-e-territorios",
    icone: Globe,
    cor: "var(--cp-eixo-terra)",
    corClasse: "text-emerald-500 hover:text-emerald-400",
    badgeClasse: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    links: [
      { label: "Visão Geral do Eixo", href: "/terra-e-territorios", icone: Globe },
      { label: "199 Cidades Estratégicas", href: "/cidades", icone: MapPin },
      { label: "Nossos Rios (Doce/Paraopeba)", href: "/terra-e-territorios/nossos-rios", icone: Waves },
      { label: "Nossas Serras & Mineração", href: "/terra-e-territorios/nossas-serras", icone: Mountain },
      { label: "Descaracterização Barragens", href: "/ambiental/barragens/descaracterizacao", icone: AlertTriangle },
      { label: "Repactuação Rio Doce", href: "/ambiental/mariana", icone: Waves },
      { label: "Reparação Paraopeba", href: "/paraopeba", icone: ShieldCheck },
      { label: "Função Social & Globo 3D", href: "/funcaosocialterra", icone: Globe },
    ],
  },
  {
    id: "estado",
    badge: "EIXO 3",
    titulo: "Estado e Economia",
    href: "/estado-e-economia",
    icone: Landmark,
    cor: "var(--cp-eixo-estado)",
    corClasse: "text-sky-500 hover:text-sky-400",
    badgeClasse: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    links: [
      { label: "Visão Geral do Eixo", href: "/estado-e-economia", icone: Landmark },
      { label: "Governos: Prometeu? Cumpriu?", href: "/governo", icone: Landmark },
      { label: "Recomendações CNJ & CNMP", href: "/judiciario/recomendacoes", icone: Scale },
      { label: "Orçamento & Receitas de MG", href: "/estado-e-economia/orcamento", icone: BarChart3 },
      { label: "Compras Públicas & PNCP", href: "/noticias/estado-e-economia-pncp-compras", icone: ShoppingBag },
      { label: "Congresso Nacional & CEAP", href: "/congresso", icone: Landmark },
      { label: "Quem fiscaliza a Justiça", href: "/judiciario/instituicoes", icone: Scale },
      { label: "Varas, Gabinetes e Balcão", href: "/judiciario/contatos", icone: PhoneCall },
      { label: "Fichas TJMG, MPMG e DPMG", href: "/judiciario/instituicoes#fichas-instituicoes", icone: Building2 },
      { label: "Grandes Empresas & Fundos", href: "/empresas", icone: Building2 },
      { label: "Repasses Federais ComunicaBR", href: "/dados/comunicabr", icone: MapPin },
    ],
  },
  {
    id: "transversal",
    badge: "ONSA",
    titulo: "Central & Ferramentas",
    href: "/indice",
    icone: Compass,
    cor: "var(--cp-primary)",
    corClasse: "text-primary hover:text-primary",
    badgeClasse: "bg-primary/10 text-primary border-primary/30",
    links: [
      { label: "Biblioteca Geral & Pesquisa", href: "/biblioteca", icone: BookOpen },
      { label: "Central de Notícias", href: "/noticias", icone: Newspaper },
      { label: "Tecnologia & IA Livre", href: "/tecnologia", icone: Cpu },
      { label: "Alertas & Notificações", href: "/alertas", icone: Bell },
      { label: "Índice Geral do Portal", href: "/indice", icone: List },
      { label: "Busca Global no Acervo", href: "/busca", icone: Search },
      { label: "Sobre o ONSA & Método", href: "/sobre", icone: Info },
      { label: "API Pública Aberta (v1)", href: "/api", icone: Code2 },
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
          className="relative flex items-center gap-2"
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-[0.88em] sm:text-[0.96em] font-bold tracking-tight text-text transition-colors duration-150 hover:text-primary"
          >
            <Image
              src="/marca/emblema.webp"
              alt="Emblema Controle Popular"
              width={26}
              height={26}
              className="h-6.5 w-6.5 rounded-full object-cover border border-border/80 shadow-2xs shrink-0"
              priority
            />
            <span>
              controlepopular<span className="text-primary">.com.br</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-portal"
            className="flex cursor-pointer items-center rounded-lg border border-transparent px-1.5 py-1 transition-colors duration-150 hover:border-border hover:bg-surface-2"
          >
            <Menu size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <nav
            id="menu-portal"
            aria-label="Menu do portal"
            className={`absolute top-full left-0 z-50 mt-1 max-h-[calc(100vh-5rem)] w-[min(58rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-xl ${
              aberto ? "block" : "hidden"
            } sm:p-5`}
          >
            {/* Header: atalhos globais */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 sm:mb-4 sm:pb-4">
              <div className="flex flex-wrap gap-2">
                <a
                  href="/"
                  onClick={fechar}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors duration-150 hover:bg-surface-2"
                >
                  Início
                </a>
                <a
                  href="/indice"
                  onClick={fechar}
                  className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
                >
                  Índice Geral do Portal
                </a>
              </div>
              <span className="text-[0.72em] font-medium text-text-soft">
                Navegação por Eixos Temáticos e Central
              </span>
            </div>

            {/* Grade de seções pelos 3 Eixos Temáticos + Central */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SECOES_MENU.map((secao) => (
                <section
                  key={secao.id}
                  aria-labelledby={`menu-${secao.id}`}
                  className="flex flex-col rounded-xl border border-border/70 bg-surface-2/40 p-3 transition-colors hover:border-border hover:bg-surface-2/70"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[0.62em] font-bold uppercase tracking-wider border ${secao.badgeClasse}`}
                    >
                      {secao.badge}
                    </span>
                  </div>
                  <h2
                    id={`menu-${secao.id}`}
                    className="mb-2 text-[0.84em] font-bold tracking-tight"
                  >
                    <a
                      href={secao.href}
                      onClick={fechar}
                      className="flex items-center gap-1.5 hover:opacity-80 focus-visible:outline-none focus-visible:underline"
                      style={{ color: secao.cor }}
                    >
                      <secao.icone size={14} className="shrink-0" aria-hidden="true" />
                      <span>{secao.titulo} →</span>
                    </a>
                  </h2>
                  <ul className="space-y-0.5 border-t border-border/40 pt-2">
                    {secao.links.map((link) => {
                      const IconeLink = link.icone;
                      return (
                        <li key={link.href + link.label}>
                          <a
                            href={link.href}
                            onClick={fechar}
                            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.78em] leading-snug text-text transition-colors duration-150 hover:bg-surface hover:text-primary"
                          >
                            {IconeLink && (
                              <IconeLink size={12} className="shrink-0 text-text-soft opacity-80" aria-hidden="true" />
                            )}
                            <span className="truncate">{link.label}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
        </div>
        <BuscaGlobal />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/noticias"
            className="cp-btn-anim flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[.8em] font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
            aria-label="Notícias e Relatórios de Dados Públicos"
          >
            <Newspaper size={13} aria-hidden="true" />
            <span>Notícias</span>
          </Link>
          <Link
            href="/alertas"
            className="cp-btn-anim flex items-center justify-center rounded-md border border-border p-2 text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
            aria-label="Central de Alertas e Notificações"
          >
            <Bell size={14} aria-hidden="true" className="text-primary" />
          </Link>
          <OuvirNavbar />
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
      <Marquee frase="✦ FISCALIZA ✦ OLHO ABERTO ✦ O DINHEIRO É NOSSO ✦ TERRITÓRIO COMO ESPERANÇA ✦ NOSSA NATUREZA ✦ NOSSOS MISTÉRIOS ✦ CORAÇÃO SEM MEDO" />
    </header>
  );
}
