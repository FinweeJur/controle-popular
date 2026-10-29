'use client';

import { useEffect, useRef, useState } from 'react';
import { SECOES_MENU } from './menu-portal';
import RodapeMenu from './RodapeMenu';
import { Menu, ChevronDown, Bell, Newspaper, Compass, Search, X } from "lucide-react";
import Link from 'next/link';
import NextLink from 'next/link';
import Image from 'next/image';

import BuscaGlobal from '@/app/components/BuscaGlobal';
import CvdToggle from '@/app/components/CvdToggle';
import FontSizeControl from '@/app/[municipio]/components/FontSizeControl';
import ThemeSwitcher from '@/app/[municipio]/components/ThemeSwitcher';
import Marquee from '@/app/components/Marquee';
import OuvirNavbar from '@/app/components/OuvirNavbar';
import { useProximidadeLinha } from '@/app/components/react-bits/useProximidadeLinha';

/**
 * Estrutura do menu do portal organizada nos 4 Grandes Eixos Temáticos e Central:
 * - Eixo 1: Terra e Território (verde/esmeralda)
 * - Eixo 2: Direitos em Movimento (vermelho/coral)
 * - Eixo 3: Estado e Economia (azul/celeste)
 * - Eixo 4: Central ONSA & Ferramentas (laranja pequi)
 */


export default function TopNav() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [hoverAberto, setHoverAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lista de links do índice: o mesmo efeito de proximidade das rádios e do
  // menu de bichinhos ("LineSidebar de leve", dono 06/10/2026) — o item perto
  // do ponteiro acende uma barrinha de acento e desliza poucos pixels. O hook
  // resolve o contêiner a cada quadro, então o índice pode abrir e fechar.
  const indiceRef = useRef<HTMLDivElement>(null);
  useProximidadeLinha(indiceRef, { raio: 110, suavizacao: 90 });

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
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 sm:px-6 py-2">
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
            // `data-lenis-prevent`: a rolagem suave da página (Lenis) engole
            // a roda do mouse e só devolve o controle aos contêineres mar-
            // cados com este atributo. Sem ele, o índice com `overflow-y-auto`
            // NÃO rolava pela roda — só clicando e arrastando a barra
            // (bug do dono, 10/10/2026; mesmo conserto do chat do Seu Nonô,
            // do índice do rádio e do menu de pets).
            data-lenis-prevent
            className={`absolute top-full left-0 z-[60] w-[min(72rem,calc(100vw-1.5rem))] max-h-[calc(100vh-4.5rem)] overflow-y-auto ${
              aberto ? 'block' : 'hidden'
            }`}
          >
            <div
              ref={indiceRef}
              className="relative rounded-2xl border border-border bg-surface p-3 sm:p-5 shadow-2xl"
            >
              {/* Header: atalhos globais. O "X" de fechar vive DENTRO desta
                  linha (era `absolute right-3 top-3` e caía em cima do texto
                  "…36+ Subfrentes", medido em 06/10/2026): como item do flex,
                  ele reserva o próprio espaço em qualquer largura. */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 sm:mb-4 sm:pb-4">
                <div className="flex flex-wrap gap-2">
                  <NextLink
                    href="/"
                    onClick={fechar}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors duration-150 hover:bg-surface-2"
                  >
                    Início
                  </NextLink>
                  <NextLink
                    href="/indice"
                    onClick={fechar}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
                  >
                    Índice Geral do Portal
                  </NextLink>
                  <NextLink
                    href="/central"
                    onClick={fechar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-primary/20"
                  >
                    <Compass size={13} aria-hidden="true" />
                    <span>Eixo Central (ONSA)</span>
                  </NextLink>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-soft">
                    4 Eixos Temáticos • 36+ Subfrentes
                  </span>
                  <button
                    type="button"
                    onClick={fechar}
                    aria-label="Fechar o índice"
                    title="Fechar o índice"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-soft transition-colors hover:bg-surface-2 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
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
                          <li key={link.href + link.label} data-cp-prox>
                            <a
                              href={link.href}
                              onClick={fechar}
                              data-dica={link.dica}
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
                                <span className="shrink-0 text-[12px] font-bold tracking-wider text-primary uppercase">
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

              <RodapeMenu onFechar={fechar} />
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
            <kbd className="font-mono text-[12px] opacity-70">Ctrl K</kbd>
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
