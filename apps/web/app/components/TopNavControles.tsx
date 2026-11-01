"use client";

import Link from "next/link";
import { Bell, Newspaper, Search } from "lucide-react";
import OuvirNavbar from "@/app/components/OuvirNavbar";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";
import CvdToggle from "@/app/components/CvdToggle";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";

/**
 * @file Controles da navbar superior.
 *
 * Saíram de `TopNav.tsx` em 01/11/2026 por saúde de código: o componente
 * já tinha 269 linhas (limite 120) e qualquer ajuste de layout piorava a
 * nota. Aqui ficam só os botões; o menu do índice continua no TopNav.
 */
export default function TopNavControles() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
  );
}
