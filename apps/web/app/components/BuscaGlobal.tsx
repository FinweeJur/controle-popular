"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { buscar, type IndiceBusca } from "@/lib/busca/indice";
import { carregarIndiceBusca } from "@/lib/busca/carregarIndice";
import { buscarPaginasPortal } from "@/lib/busca/paginas-portal";
import { DotsRing } from "@/app/components/loaders";

/**
 * Barra de busca GLOBAL da navbar — pedido do dono (01/09/2026):
 * sempre visível, em todas as páginas, sem sair para /busca.
 *
 * Reusa o motor estático do portal (`lib/busca/indice.ts`) e o índice
 * fatiado que `scripts/gerar-indice-busca.mts` grava em `/busca-indice`
 * no prebuild. O índice é PRÉ-CARREGADO no primeiro monte (e cacheado em
 * módulo), então a primeira busca pode mostrar "carregando", e as seguintes
 * são instantâneas — nenhum keystroke espera rede.
 *
 * Enter abre a página completa de busca com o termo; o dropdown mostra os
 * 8 melhores resultados e o link "ver todos".
 */

// Cache em módulo: TopNav remonta em toda navegação; o índice não é
// recarregado. Falha reseta o cache para permitir nova tentativa.
let promessaIndice: Promise<IndiceBusca> | null = null;
function obterIndice(): Promise<IndiceBusca> {
  if (!promessaIndice) {
    promessaIndice = carregarIndiceBusca("/busca-indice").catch((e) => {
      promessaIndice = null;
      throw e;
    });
  }
  return promessaIndice;
}

export default function BuscaGlobal() {
  const [indice, setIndice] = useState<IndiceBusca | null>(null);
  const [falha, setFalha] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;
    obterIndice()
      .then((i) => {
        if (ativo) setIndice(i);
      })
      .catch(() => {
        if (ativo) setFalha(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    function fecharFora(ev: PointerEvent) {
      if (!caixaRef.current?.contains(ev.target as Node)) setAberto(false);
    }
    function fecharEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") setAberto(false);
    }
    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    };
  }, []);

  const paginasPortal = useMemo(() => {
    if (!consulta.trim() || consulta.trim().length < 2) return [];
    return buscarPaginasPortal(consulta, 3);
  }, [consulta]);

  const resultados = useMemo(() => {
    if (!indice || !consulta.trim()) return [];
    return buscar(consulta, indice, { limite: 8 });
  }, [indice, consulta]);

  const mostrar = aberto && consulta.trim().length > 0;

  return (
    <div ref={caixaRef} role="search" className="relative min-w-0 flex-1">
      <div className="relative flex items-center">
        {/* Ícone fixo de lupa na esquerda — sempre visível */}
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft shrink-0"
          aria-hidden="true"
        />

        <input
          type="search"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          disabled={falha}
          placeholder={
            falha
              ? "Índice de busca indisponível"
              : indice
                ? "Buscar no portal…"
                : "Carregando índice de busca…"
          }
          aria-label="Buscar no portal"
          className="w-full rounded-lg border border-border bg-surface-2 pr-9 pl-8.5 py-1.5 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
        />

        {/* Lado direito: spinner se carregando, botão limpar se tiver busca, ou atalho Enter */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {!indice && !falha ? (
            <div title="Carregando índice...">
              <DotsRing size={16} className="text-text-soft" />
            </div>
          ) : consulta.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setConsulta("");
                setAberto(false);
              }}
              className="p-0.5 rounded-full hover:bg-surface text-text-soft hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              className="hidden sm:inline-block text-[10px] font-mono text-text-soft opacity-60 bg-surface border border-border/80 px-1 py-0.2 rounded"
              title="Pressione Enter para pesquisar"
            >
              ↵
            </kbd>
          )}
        </div>
      </div>
      {mostrar && (
        <ul className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {/* Páginas e Hubs do Portal em destaque */}
          {paginasPortal.length > 0 && (
            <li className="mb-2 space-y-1">
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-soft">
                Páginas do Portal
              </span>
              {paginasPortal.map((p) => (
                <a
                  key={p.id}
                  href={
                    // F4 do laboratório: a consulta atual alimenta as janelas
                    p.id === "laboratorio"
                      ? `/laboratorio?q=${encodeURIComponent(consulta)}`
                      : p.href
                  }
                  onClick={() => setAberto(false)}
                  className="block rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text">{p.titulo}</span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {p.rotulo}
                    </span>
                  </div>
                  <span className="mt-0.5 block truncate text-xs text-text-soft">{p.descricao}</span>
                </a>
              ))}
            </li>
          )}

          {/* Atos e documentos catalogados */}
          {resultados.length === 0 && paginasPortal.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-soft">
              Nada encontrado para “{consulta}”.
            </li>
          ) : (
            resultados.map((r) => (
              <li key={r.doc.i}>
                <a
                  href={r.doc.h}
                  onClick={() => setAberto(false)}
                  className="block rounded-xl px-3 py-2 hover:bg-surface-2"
                >
                  <span className="block text-sm font-medium text-text">{r.doc.t}</span>
                  {r.doc.e ? (
                    <span className="block truncate text-xs text-text-soft">{r.doc.e}</span>
                  ) : null}
                </a>
              </li>
            ))
          )}
          <li className="mt-1 border-t border-border pt-1">
            <a
              href={`/busca?q=${encodeURIComponent(consulta)}`}
              onClick={() => setAberto(false)}
              className="block rounded-xl px-3 py-2 text-xs font-medium text-primary hover:bg-surface-2"
            >
              Ver todos os resultados na página de busca →
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
