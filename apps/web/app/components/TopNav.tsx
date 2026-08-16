"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";

import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import CvdToggle from "@/app/components/CvdToggle";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";

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
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8">
        <div
          ref={caixaRef}
          className="group relative"
          onMouseEnter={() => setHoverAberto(true)}
          onMouseLeave={() => setHoverAberto(false)}
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
            className={`absolute top-full left-0 z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-2 shadow-lg ${
              aberto ? "block" : "hidden"
            } group-hover:block group-focus-within:block`}
          >
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/"
                  onClick={fechar}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-medium text-text transition-colors duration-150 hover:bg-surface-2"
                >
                  <span>Início</span>
                  <span className="text-[.8em] text-text-soft">home</span>
                </Link>
              </li>
            </ul>

            <p className="mt-3 px-3 text-[.72em] font-semibold uppercase tracking-wide text-text-soft">
              Frentes do portal
            </p>
            <ul className="mt-1 space-y-0.5">
              {ZONAS_PUBLICADAS.map((z) => (
                <li key={z.id}>
                  <Link
                    href={z.href}
                    onClick={fechar}
                    className="flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-[.95em] font-medium text-text transition-colors duration-150 hover:bg-surface-2"
                  >
                    <span>{z.nomeCurto}</span>
                    <span className="text-[.78em] text-text-soft">{z.etiqueta}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-3 px-3 text-[.72em] font-semibold uppercase tracking-wide text-text-soft">
              Páginas e funções
            </p>
            <ul className="mt-1 space-y-0.5">
              <li>
                <Link
                  href="/direitos-em-movimento"
                  onClick={fechar}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[.95em] font-medium transition-colors duration-150 hover:bg-surface-2"
                  style={{ color: "var(--cp-alert)" }}
                >
                  <span>Direitos em Movimento</span>
                  <span aria-hidden="true" className="text-[.8em]">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre"
                  onClick={fechar}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[.95em] font-medium text-text transition-colors duration-150 hover:bg-surface-2"
                >
                  <span>Sobre o projeto</span>
                  <span aria-hidden="true" className="text-[.8em]">
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
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
