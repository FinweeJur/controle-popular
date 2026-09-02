"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buscar, type IndiceBusca } from "@/lib/busca/indice";
import { carregarIndiceBusca } from "@/lib/busca/carregarIndice";

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

  const resultados = useMemo(() => {
    if (!indice || !consulta.trim()) return [];
    return buscar(consulta, indice, { limite: 8 });
  }, [indice, consulta]);

  const mostrar = aberto && consulta.trim().length > 0;

  return (
    <div ref={caixaRef} role="search" className="relative min-w-0 flex-1">
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
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
      />
      {mostrar && (
        <ul className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-lg">
          {resultados.length === 0 ? (
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
