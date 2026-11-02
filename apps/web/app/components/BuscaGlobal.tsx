"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { buscar, type IndiceBusca } from "@/lib/busca/indice";
import { carregarIndiceBusca } from "@/lib/busca/carregarIndice";
import { buscarPaginasPortal } from "@/lib/busca/paginas-portal";
import { DotsRing } from "@/app/components/loaders";
import { ExpandableSearch } from "./ExpandableSearch";

/**
 * Barra de busca GLOBAL expansível da navbar — padrão Lightswind UI.
 *
 * Em repouso, preserva espaço da navbar (ícone de 36px em mobile e pílula compacta
 * em desktop). Ao clicar, focar ou teclar Ctrl+K, expande suavemente com física de mola
 * (Framer Motion) e revela os resultados e páginas do portal em tempo real.
 *
 * Reusa o motor estático do portal (`lib/busca/indice.ts`) e a ponte busca → RAG
 * com o assistente Seu Nonô (`/api/chatbot`).
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

  const paginasPortal = useMemo(() => {
    if (!consulta.trim() || consulta.trim().length < 2) return [];
    return buscarPaginasPortal(consulta, 3);
  }, [consulta]);

  const resultados = useMemo(() => {
    if (!indice || !consulta.trim()) return [];
    return buscar(consulta, indice, { limite: 8 });
  }, [indice, consulta]);

  const mostrar = aberto && consulta.trim().length > 0;

  /** Ponte busca → RAG: abre o Seu Nonô já com a pergunta deste termo. */
  function perguntarAoSeuNono() {
    const p = consulta.trim();
    if (!p) return;
    window.dispatchEvent(
      new CustomEvent("abrir-seu-nono", { detail: { pergunta: p } })
    );
    setAberto(false);
  }

  function handleSearch(query: string) {
    if (query.trim().length > 0) {
      window.location.href = `/busca?q=${encodeURIComponent(query.trim())}`;
    }
  }

  return (
    <ExpandableSearch
      value={consulta}
      onChange={(val) => {
        setConsulta(val);
        setAberto(true);
      }}
      onSearch={handleSearch}
      onExpand={() => setAberto(true)}
      onCollapse={() => setAberto(false)}
      showDropdown={mostrar}
      isLoading={!indice && !falha}
      disabled={falha}
      placeholder={
        falha
          ? "Índice de busca indisponível"
          : indice
            ? "Buscar no portal…"
            : "Carregando busca…"
      }
      rightSlot={
        !indice && !falha ? (
          <div title="Carregando índice...">
            <DotsRing size={14} className="text-text" />
          </div>
        ) : (
          <kbd
            className="hidden sm:inline-block rounded border border-border/80 bg-surface px-1 py-0.2 font-mono text-[12px] text-text-soft opacity-60"
            title="Pressione Enter para pesquisar"
          >
            ↵
          </kbd>
        )
      }
    >
      <ul className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-2xl backdrop-blur-md">
        {/* Páginas e Hubs do Portal em destaque */}
        {paginasPortal.length > 0 && (
          <li className="mb-2 space-y-1">
            <span className="px-3 text-[12px] font-semibold tracking-wider text-text-soft uppercase">
              Páginas do Portal
            </span>
            {paginasPortal.map((p) => (
              <a
                key={p.id}
                href={
                  p.id === "laboratorio"
                    ? `/laboratorio?q=${encodeURIComponent(consulta)}`
                    : p.href
                }
                onClick={() => setAberto(false)}
                className="block rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text">{p.titulo}</span>
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[12px] font-semibold text-primary">
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
          <button
            type="button"
            onClick={perguntarAoSeuNono}
            title="Abrir o Seu Nonô e responder com IA, citando a fonte"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary transition-colors hover:bg-surface-2"
          >
            <Sparkles size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">
              Perguntar ao Seu Nonô: “{consulta.trim()}”
            </span>
          </button>
        </li>
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
    </ExpandableSearch>
  );
}
