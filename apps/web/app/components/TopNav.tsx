'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  ChevronDown,
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
  Shield,
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
  FileText,
  Sparkles,
  Leaf,
  FileSpreadsheet,
  Radio,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import BuscaGlobal from '@/app/components/BuscaGlobal';
import CvdToggle from '@/app/components/CvdToggle';
import FontSizeControl from '@/app/[municipio]/components/FontSizeControl';
import ThemeSwitcher from '@/app/[municipio]/components/ThemeSwitcher';
import Marquee from '@/app/components/Marquee';
import OuvirNavbar from '@/app/components/OuvirNavbar';

/**
 * Estrutura do menu do portal organizada nos 4 Grandes Eixos Temáticos e Central:
 * - Eixo 1: Terra e Território (verde/esmeralda)
 * - Eixo 2: Direitos em Movimento (vermelho/coral)
 * - Eixo 3: Estado e Economia (azul/celeste)
 * - Eixo 4: Central ONSA & Ferramentas (laranja pequi)
 */
interface ItemMenuLink {
  label: string;
  href: string;
  icone: any;
  destaque?: boolean;
}

interface SecaoMenu {
  id: string;
  badge: string;
  titulo: string;
  href: string;
  icone: any;
  cor: string;
  corClasse: string;
  badgeClasse: string;
  links: ItemMenuLink[];
}

const SECOES_MENU: SecaoMenu[] = [
  {
    id: 'terra',
    badge: 'EIXO 1',
    titulo: 'Terra e Território',
    href: '/terra-e-territorios',
    icone: Globe,
    cor: 'var(--cp-eixo-terra)',
    corClasse: 'text-emerald-500 hover:text-emerald-400',
    badgeClasse: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/terra-e-territorios', icone: Globe },
      { label: 'Função Social & Globo 3D', href: '/funcaosocialterra/mapa', icone: Globe, destaque: true },
      { label: 'Repactuação Rio Doce (Mariana)', href: '/ambiental/mariana', icone: Waves, destaque: true },
      { label: 'Reparação Paraopeba (Brumadinho)', href: '/paraopeba', icone: ShieldCheck, destaque: true },
      { label: 'Licenciamento Ambiental (11 UFs)', href: '/ambiental/licenciamento', icone: FileSpreadsheet, destaque: true },
      { label: 'Descaracterização Barragens', href: '/ambiental/barragens/descaracterizacao', icone: AlertTriangle, destaque: true },
      { label: '203 Cidades Estratégicas', href: '/cidades', icone: MapPin },
      { label: 'Cidades de Minas (853)', href: '/cidades/mg', icone: MapPin },
      { label: 'Nossos Rios & Bacias', href: '/terra-e-territorios/nossos-rios', icone: Waves },
      { label: 'Nossas Serras & Topos de Morro', href: '/terra-e-territorios/nossas-serras', icone: Mountain },
      { label: 'Cavas de Mineração (satélite)', href: '/mineracao/cavas', icone: Mountain },
      { label: 'Clima & Risco AdaptaBrasil', href: '/ambiental/clima-risco', icone: Activity },
      { label: 'Termos de Ajustamento (TAC)', href: '/ambiental/tac', icone: Shield },
      { label: 'Decisões do COPAM', href: '/ambiental/copam', icone: Scale },
      { label: 'Canadá & Mineração TSX', href: '/canada', icone: Globe },
      { label: 'América Latina & Mineração', href: '/america-latina', icone: Globe },
    ],
  },
  {
    id: 'direitos',
    badge: 'EIXO 2',
    titulo: 'Direitos em Movimento',
    href: '/direitos-em-movimento',
    icone: HeartHandshake,
    cor: 'var(--cp-eixo-direitos)',
    corClasse: 'text-alert hover:text-alert',
    badgeClasse: 'bg-alert/10 text-alert border-alert/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/direitos-em-movimento', icone: HeartHandshake },
      { label: 'Linha do Tempo das Lutas', href: '/memoria', icone: BookOpen, destaque: true },
      { label: 'Que Lei Protege Isso', href: '/ambiental/legislacao', icone: ShieldCheck, destaque: true },
      { label: 'Saúde Pública & SUS', href: '/direitos-em-movimento/saude-publica', icone: Activity, destaque: true },
      { label: 'Onde Buscar Ajuda & Tarifa Social', href: '/direitos-em-movimento/ajuda', icone: HelpCircle, destaque: true },
      { label: 'Educação & Escolas (IDEB)', href: '/direitos-em-movimento/educacao', icone: GraduationCap },
      { label: 'Trabalho & Emprego (CAGED)', href: '/direitos-em-movimento/trabalho-e-renda', icone: Briefcase },
      { label: 'Conselhos de Direitos (710)', href: '/direitos-em-movimento/conselhos', icone: Users },
      { label: 'Pedir Informação (LAI)', href: '/direitos-em-movimento/informacao', icone: FileQuestion },
      { label: 'Canal de Denúncia Local', href: '/direitos-em-movimento/denuncia', icone: Send },
      { label: 'Decisões de Acesso (LAI)', href: '/ambiental/decisoes-lai', icone: FileText },
      { label: 'Direitos Humanos & Relatórios', href: '/ambiental/direitos-humanos', icone: Shield },
    ],
  },
  {
    id: 'estado',
    badge: 'EIXO 3',
    titulo: 'Estado e Economia',
    href: '/estado-e-economia',
    icone: Landmark,
    cor: 'var(--cp-eixo-estado)',
    corClasse: 'text-sky-500 hover:text-sky-400',
    badgeClasse: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/estado-e-economia', icone: Landmark },
      { label: 'Orçamento & Receitas de MG', href: '/estado-e-economia/orcamento', icone: BarChart3, destaque: true },
      { label: 'Quem fiscaliza a Justiça', href: '/judiciario/instituicoes', icone: Scale, destaque: true },
      { label: 'Varas, Gabinetes e Balcão', href: '/judiciario/contatos', icone: PhoneCall, destaque: true },
      { label: 'Assembleias Legislativas (27 UFs)', href: '/assembleias', icone: Landmark, destaque: true },
      { label: 'Radar de Compras & Contratos', href: '/ambiental/contratos', icone: ShoppingBag, destaque: true },
      { label: 'Congresso Nacional & Gastos', href: '/congresso', icone: Landmark },
      { label: 'Bancada Federal de MG', href: '/congresso/mg', icone: Users },
      { label: 'Governos: Prometeu? Cumpriu?', href: '/governo', icone: Landmark },
      { label: 'Grandes Empresas & Fundos ESG', href: '/empresas', icone: Building2 },
      { label: '1.000 Maiores Fortunas Mundiais', href: '/empresas/fortunas', icone: Building2 },
      { label: 'EUA: SEC, Fundos & Comércio', href: '/eua', icone: Building2 },
      { label: 'Europa: Litígios Transnacionais', href: '/europa', icone: Globe },
      { label: 'Repasses Federais ComunicaBR', href: '/dados/comunicabr', icone: MapPin },
      { label: 'Concessões & PPP de MG', href: '/ambiental/ppp', icone: Building2 },
    ],
  },
  {
    id: 'transversal',
    badge: 'EIXO 4',
    titulo: 'Central & Ferramentas',
    href: '/central',
    icone: Compass,
    cor: 'var(--cp-primary)',
    corClasse: 'text-primary hover:text-primary',
    badgeClasse: 'bg-primary/10 text-primary border-primary/30',
    links: [
      { label: 'Página do Eixo Central', href: '/central', icone: Compass },
      { label: 'Radar Diário de Editais', href: '/editais', icone: ShoppingBag, destaque: true },
      { label: 'Biblioteca Geral & Pesquisa', href: '/biblioteca', icone: BookOpen, destaque: true },
      { label: 'Árvore de Conexões (Grafo 3D)', href: '/laboratorio/arvore', icone: Layers, destaque: true },
      { label: 'Assistente Cívico Seu Nonô', href: '/assistente', icone: Sparkles, destaque: true },
      { label: 'Índice Geral do Portal', href: '/indice', icone: List },
      { label: 'Busca Global no Acervo', href: '/busca', icone: Search },
      { label: 'Laboratório de Dados', href: '/laboratorio', icone: BarChart3 },
      { label: 'Blog & Notícias Analíticas', href: '/noticias', icone: Newspaper },
      { label: 'Rádios do Brasil e do Mundo', href: '/radio', icone: Radio },
      { label: 'Alertas & Notificações', href: '/alertas', icone: Bell },
      { label: 'Tecnologia & IA Livre', href: '/tecnologia', icone: Cpu },
      { label: 'Documentação do Sistema', href: '/documentacao', icone: FileText },
      { label: 'Sobre o ONSA & Método', href: '/sobre', icone: Info },
    ],
  },
] as const;

export default function TopNav() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [hoverAberto, setHoverAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function fecharFora(ev: MouseEvent) {
      if (!caixaRef.current?.contains(ev.target as Node)) {
        setMenuAberto(false);
        setHoverAberto(false);
      }
    }
    function fecharEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setMenuAberto(false);
        setHoverAberto(false);
      }
    }
    document.addEventListener('mousedown', fecharFora);
    document.addEventListener('keydown', fecharEsc);
    return () => {
      document.removeEventListener('mousedown', fecharFora);
      document.removeEventListener('keydown', fecharEsc);
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
    }, 600);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-x-3 gap-y-2 px-3 sm:px-6 py-2">
        {/* Bloco do Logo + Botão de Índice com Menu Suspenso via Hover/Clique */}
        <div
          ref={caixaRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="relative flex items-center gap-1.5 shrink-0"
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
            <span className="hidden xs:inline sm:inline">
              controlepopular<span className="text-primary">.com.br</span>
            </span>
          </Link>

          {/* Botão de Índice / Menu com indicador de dropdown */}
          <button
            type="button"
            onClick={() => setMenuAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-portal"
            className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-all duration-150 ${
              aberto
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/80 bg-surface-2 text-foreground hover:border-primary/50 hover:bg-surface-2'
            }`}
            title="Índice geral e eixos do portal"
          >
            <Menu size={15} strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-bold">Índice</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${aberto ? 'rotate-180 text-primary' : 'text-muted'}`}
            />
          </button>

          {/* Menu Dropdown com Navegação Completa dos 3 Eixos e Top 100 Páginas */}
          <nav
            id="menu-portal"
            aria-label="Menu do portal"
            className={`absolute top-full left-0 z-[60] w-[min(72rem,calc(100vw-1.5rem))] max-h-[calc(100vh-4.5rem)] overflow-y-auto ${
              aberto ? 'block' : 'hidden'
            }`}
          >
            <div className="rounded-2xl border border-border bg-surface p-3 sm:p-5 shadow-2xl">
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
                  <a
                    href="/central"
                    onClick={fechar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
                  >
                    <Compass size={13} aria-hidden="true" />
                    <span>Eixo Central (ONSA)</span>
                  </a>
                </div>
                <span className="text-xs font-semibold text-text-soft">
                  4 Eixos Temáticos • 36+ Subfrentes
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
                        className={`inline-block rounded px-1.5 py-0.5 text-[0.85em] font-bold uppercase tracking-wider border ${secao.badgeClasse}`}
                      >
                        {secao.badge}
                      </span>
                    </div>
                    <h2
                      id={`menu-${secao.id}`}
                      className="mb-2 text-[0.9em] font-bold tracking-tight"
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
                              className={`flex items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-[0.85em] leading-snug transition-colors duration-150 ${
                                link.destaque
                                  ? "font-medium text-foreground bg-primary/10 border-l-2 border-primary pl-2 shadow-xs hover:bg-primary/15"
                                  : "text-text hover:bg-surface hover:text-primary"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {IconeLink && (
                                  <IconeLink
                                    size={12}
                                    className={`shrink-0 ${link.destaque ? "text-primary font-bold" : "text-text-soft opacity-80"}`}
                                    aria-hidden="true"
                                  />
                                )}
                                <span className="truncate">{link.label}</span>
                              </div>
                              {link.destaque && (
                                <span className="shrink-0 text-[9px] font-bold tracking-wider text-primary uppercase">
                                  ✦
                                </span>
                              )}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>

              {/* Rodapé do menu com link de acesso rápido ao Eixo Central (ONSA) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 sm:mt-4 sm:pt-4">
                <div className="flex items-center gap-2 text-xs text-text-soft">
                  <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
                  <span>Observatório Nacional Socioambiental e ferramentas integradas em um só lugar.</span>
                </div>
                <a
                  href="/central"
                  onClick={fechar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <span>Conhecer o Eixo Central (ONSA)</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </nav>
        </div>

        {/* Barra de Busca Global */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md min-w-0 mx-1">
          <BuscaGlobal />
        </div>

        {/* Controles e Botões da Navbar (Sempre visíveis e alinhados) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/noticias"
            className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 sm:px-2.5 py-1 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
            aria-label="Blog e Notícias"
          >
            <Newspaper size={13} aria-hidden="true" />
            <span>Blog</span>
          </Link>
          <Link
            href="/alertas"
            className="flex items-center justify-center rounded-md border border-border p-1.5 text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
            aria-label="Alertas e Notificações"
            title="Alertas e Notificações"
          >
            <Bell size={14} aria-hidden="true" className="text-primary" />
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("abrir-paleta-comandos"))}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
            aria-label="Abrir busca rápida (Ctrl K)"
            title="Busca rápida (Ctrl+K)"
          >
            <Search size={13} aria-hidden="true" />
            <kbd className="font-mono text-[10px] opacity-70">Ctrl K</kbd>
          </button>
          <OuvirNavbar />
          <Link
            href="/busca"
            className="hidden xs:inline-flex rounded-md border border-border px-2 sm:px-2.5 py-1 text-xs font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
          >
            Busca →
          </Link>
          <span className="hidden md:inline-flex"><ThemeSwitcher /></span>
          <span className="hidden lg:inline-flex"><CvdToggle /></span>
          <span className="hidden sm:inline-flex"><FontSizeControl /></span>
        </div>
      </div>
      <Marquee frase="✦ FISCALIZA ✦ OLHO ABERTO ✦ O DINHEIRO É NOSSO ✦ TERRITÓRIO COMO ESPERANÇA ✦ NOSSA NATUREZA ✦ NOSSOS MISTÉRIOS ✦ CORAÇÃO SEM MEDO" />
    </header>
  );
}
