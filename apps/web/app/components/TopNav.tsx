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
 * Estrutura do menu do portal organizada nos 3 Grandes Eixos Temáticos e Central:
 * - Eixo 1: Direitos em Movimento (vermelho/coral)
 * - Eixo 2: Terra e Territórios (verde/esmeralda)
 * - Eixo 3: Estado e Economia (azul/celeste)
 * - Central: Notícias, Tecnologia e Ferramentas ONSA (laranja pequi)
 */
const SECOES_MENU = [
  {
    id: 'direitos',
    badge: 'EIXO 1',
    titulo: 'Direitos em Movimento',
    href: '/direitos-em-movimento',
    icone: HeartHandshake,
    cor: 'var(--cp-eixo-direitos)',
    corClasse: 'text-alert hover:text-alert',
    badgeClasse: 'bg-alert/10 text-alert border-alert/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/direitos-em-movimento', icone: HeartHandshake },
      { label: 'Saúde Pública & SUS', href: '/direitos-em-movimento/saude-publica', icone: Activity },
      { label: 'Educação & Escolas (IDEB)', href: '/direitos-em-movimento/educacao', icone: GraduationCap },
      { label: 'Trabalho & Emprego (CAGED)', href: '/direitos-em-movimento/trabalho-e-renda', icone: Briefcase },
      { label: 'Que Lei Protege Isso', href: '/ambiental/legislacao', icone: ShieldCheck },
      { label: 'Conselhos de Direitos', href: '/direitos-em-movimento/conselhos', icone: Users },
      { label: 'Onde Buscar Ajuda', href: '/direitos-em-movimento/ajuda', icone: HelpCircle },
      { label: 'Pedir Informação (LAI)', href: '/direitos-em-movimento/informacao', icone: FileQuestion },
      { label: 'Canal de Denúncia Local', href: '/direitos-em-movimento/denuncia', icone: Send },
      { label: 'Decisões de Acesso (LAI)', href: '/decisoes-lai', icone: FileText },
      { label: 'Guia Cívico de Direitos', href: '/noticias/direitos-em-movimento-guia', icone: BookOpen },
    ],
  },
  {
    id: 'terra',
    badge: 'EIXO 2',
    titulo: 'Terra e Territórios',
    href: '/terra-e-territorios',
    icone: Globe,
    cor: 'var(--cp-eixo-terra)',
    corClasse: 'text-emerald-500 hover:text-emerald-400',
    badgeClasse: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    links: [
      { label: 'Visão Geral do Eixo', href: '/terra-e-territorios', icone: Globe },
      { label: '203 Cidades Estratégicas', href: '/cidades', icone: MapPin },
      { label: 'Betim (Painel Completo)', href: '/betim', icone: MapPin },
      { label: 'Brumadinho (Reparação)', href: '/brumadinho', icone: MapPin },
      { label: 'Nossos Rios (Doce & Paraopeba)', href: '/terra-e-territorios/nossos-rios', icone: Waves },
      { label: 'Nossas Serras & Mineração', href: '/terra-e-territorios/nossas-serras', icone: Mountain },
      { label: 'Descaracterização Barragens', href: '/ambiental/barragens/descaracterizacao', icone: AlertTriangle },
      { label: 'Repactuação Rio Doce', href: '/ambiental/mariana', icone: Waves },
      { label: 'Reparação Paraopeba', href: '/paraopeba', icone: ShieldCheck },
      { label: 'Função Social & Globo 3D', href: '/funcaosocialterra', icone: Globe },
      { label: 'Licenciamento Ambiental (11 UFs)', href: '/ambiental/licenciamento', icone: FileSpreadsheet },
      { label: 'Termos de Ajustamento (TAC)', href: '/ambiental/tac', icone: Shield },
      { label: 'Decisões do COPAM', href: '/ambiental/copam', icone: Scale },
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
      { label: 'Governos: Prometeu? Cumpriu?', href: '/governo', icone: Landmark },
      { label: 'Recomendações CNJ & CNMP', href: '/judiciario/recomendacoes', icone: Scale },
      { label: 'Quem fiscaliza a Justiça', href: '/judiciario/instituicoes', icone: Scale },
      { label: 'Varas, Gabinetes e Balcão', href: '/judiciario/contatos', icone: PhoneCall },
      { label: 'Congresso Nacional & Gastos', href: '/congresso', icone: Landmark },
      { label: 'Bancada Federal de MG', href: '/congresso/mg', icone: Users },
      { label: 'Radar Cívico de Editais', href: '/editais', icone: ShoppingBag },
      { label: 'Grandes Empresas & Fundos', href: '/empresas', icone: Building2 },
      { label: 'Repasses Federais ComunicaBR', href: '/dados/comunicabr', icone: MapPin },
      { label: 'Convênios & Transferências', href: '/convenios', icone: FileSpreadsheet },
      { label: 'Orçamento & Receitas de MG', href: '/estado-e-economia/orcamento', icone: BarChart3 },
    ],
  },
  {
    id: 'transversal',
    badge: 'ONSA',
    titulo: 'Central & Ferramentas',
    href: '/indice',
    icone: Compass,
    cor: 'var(--cp-primary)',
    corClasse: 'text-primary hover:text-primary',
    badgeClasse: 'bg-primary/10 text-primary border-primary/30',
    links: [
      { label: 'Índice Geral do Portal', href: '/indice', icone: List },
      { label: 'Top 100 Páginas Catalogadas', href: '/indice#catalogo-100-paginas', icone: Sparkles },
      { label: 'Busca Global no Acervo', href: '/busca', icone: Search },
      { label: 'Blog & Notícias Analíticas', href: '/noticias', icone: Newspaper },
      { label: 'Alertas & Notificações', href: '/alertas', icone: Bell },
      { label: 'Biblioteca Geral & Pesquisa', href: '/biblioteca', icone: BookOpen },
      { label: 'Tecnologia & IA Livre', href: '/tecnologia', icone: Cpu },
      { label: 'Documentação do Sistema', href: '/documentacao', icone: FileText },
      { label: 'Sobre o ONSA & Método', href: '/sobre', icone: Info },
      { label: 'Sala de Imprensa & Dados', href: '/imprensa', icone: Building2 },
      { label: 'Termos de Uso & LGPD', href: '/termos', icone: ShieldCheck },
    ],
  },
] as const;

export default function TopNav() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [hoverAberto, setHoverAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function fecharFora(ev: PointerEvent) {
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
    document.addEventListener('pointerdown', fecharFora);
    document.addEventListener('keydown', fecharEsc);
    return () => {
      document.removeEventListener('pointerdown', fecharFora);
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
    }, 450);
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
            className={`absolute top-full left-0 z-50 pt-2 w-[min(72rem,calc(100vw-1.5rem))] max-h-[calc(100vh-4.5rem)] overflow-y-auto ${
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
                    href="/indice#catalogo-100-paginas"
                    onClick={fechar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors duration-150 hover:bg-emerald-500/20"
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    <span>Top 100 Páginas</span>
                  </a>
                </div>
                <span className="text-xs font-semibold text-text-soft">
                  3 Eixos Temáticos • 18 Subfrentes
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
                              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.85em] leading-snug text-text transition-colors duration-150 hover:bg-surface hover:text-primary"
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

              {/* Rodapé do menu com link de acesso rápido ao catálogo */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 sm:mt-4 sm:pt-4">
                <div className="flex items-center gap-2 text-xs text-text-soft">
                  <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
                  <span>Base unificada com 100 páginas catalogadas, microresumos e busca em tempo real.</span>
                </div>
                <a
                  href="/indice#catalogo-100-paginas"
                  onClick={fechar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <span>Ver Catálogo Completo das 100 Páginas</span>
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
          <OuvirNavbar />
          <Link
            href="/busca"
            className="hidden xs:inline-flex rounded-md border border-border px-2 sm:px-2.5 py-1 text-xs font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
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
