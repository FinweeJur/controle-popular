"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Índice de página genérico (TOC) — pedido do dono: "toda página tem índice".
 *
 * Componente client montado no LAYOUT RAIZ: em qualquer página, ele procura os
 * `h2`/`h3` dentro do `<main>` e monta âncoras sozinho — sem tocar em nenhuma
 * das ~4.800 páginas. Esconde-se quando a página tem menos de 2 títulos
 * (home, 404, telas de API), para não virar ruído.
 *
 * Interação: botão flutuante "Índice" (canto inferior direito, mesmo padrão
 * do `BackToTop`); abre um painel com os títulos; clique rola suave até a
 * seção. Acessível: `aria-expanded`, Escape e clique fora fecham.
 */

interface ItemIndice {
  id: string;
  titulo: string;
  nivel: 2 | 3;
}

function slugificar(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
  );
}

export default function IndicePagina() {
  const [itens, setItens] = useState<ItemIndice[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const main =
      document.querySelector("main[id]") ?? document.querySelector("main");
    if (!main) return;

    const vistos = new Set<string>();
    const achados: ItemIndice[] = [];
    for (const el of Array.from(main.querySelectorAll("h2, h3"))) {
      // Ignora títulos dentro de nav/details/footer/aside (menus, acordeões).
      if (el.closest("nav, details, footer, aside")) continue;
      const nivel = el.tagName === "H2" ? 2 : 3;
      const texto = (el.textContent ?? "").trim();
      if (!texto) continue;
      let id = el.id || slugificar(texto) || `secao-${achados.length}`;
      if (vistos.has(id)) id = `${id}-${achados.length}`;
      vistos.add(id);
      el.id = id;
      achados.push({ id, titulo: texto, nivel });
    }
    setItens(achados);
  }, []);

  const visivel = useMemo(() => itens.length >= 2, [itens]);

  useEffect(() => {
    if (!aberto) return;
    function fecharEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") setAberto(false);
    }
    function fecharFora(ev: PointerEvent) {
      const alvo = ev.target as Node;
      if (!document.querySelector("[data-indice-pagina]")?.contains(alvo)) {
        setAberto(false);
      }
    }
    document.addEventListener("keydown", fecharEsc);
    document.addEventListener("pointerdown", fecharFora);
    return () => {
      document.removeEventListener("keydown", fecharEsc);
      document.removeEventListener("pointerdown", fecharFora);
    };
  }, [aberto]);

  if (!visivel) return null;

  function rolar(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setAberto(false);
  }

  return (
    <div data-indice-pagina className="fixed right-4 bottom-4 z-40">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls="indice-pagina-painel"
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-lg transition-colors hover:bg-surface-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10"></path>
        </svg>
        Índice da página
      </button>
      {aberto && (
        <div
          id="indice-pagina-painel"
          className="absolute right-0 bottom-full mb-2 max-h-[60vh] w-64 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-lg"
        >
          <ul className="space-y-0.5">
            {itens.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => rolar(item.id)}
                  className={`block w-full cursor-pointer rounded-lg px-2 py-1.5 text-left hover:bg-surface-2 ${
                    item.nivel === 3 ? "pl-5 text-[.82em] text-text-soft" : "text-sm font-medium text-text"
                  }`}
                >
                  {item.titulo}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
