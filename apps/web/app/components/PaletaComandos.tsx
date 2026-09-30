"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search, Sparkles } from "lucide-react";
import { buscarPaginasPortal } from "@/lib/busca/paginas-portal";
import { adicionarPaginaAtual, useItensPasta } from "@/app/pasta/pastaStore";

/**
 * Paleta de comandos (⌘K / Ctrl+K) — a "cola" de navegação do portal.
 *
 * ═══ O QUE É ═══
 *
 * Uma caixa que abre com Ctrl+K (ou ⌘K no Mac) e com o botão da navbar, e que
 * junta num só lugar três gestos: ir para uma página, perguntar ao Seu Nonô e
 * abrir a busca completa. É inspirada nas paletas de comando do Raycast, do
 * Linear e do VS Code — a ideia de "faça tudo digitando", sem caçar no menu.
 *
 * ═══ POR QUE EXISTE ═══
 *
 * O portal já tem busca, assistente e dezenas de hubs. O que faltava era uma
 * entrada ÚNICA que não obrigasse a pessoa a saber onde está cada coisa. A
 * paleta reusa o catálogo de páginas do portal (`buscarPaginasPortal`), que é
 * estático — sem rede, sem custo de servidor e sem novo índice para manter.
 *
 * ═══ AÇÕES E ACESSIBILIDADE ═══
 *
 * Navegação por teclado (↑ ↓ Enter Esc) com foco no campo e devolução do foco
 * ao fechar; `role="dialog"` + `aria-modal`; o item selecionado usa
 * `aria-activedescendant`. A paleta NÃO cobre leitura de tela de forma a
 * substituir os links — ela é atalho, os links continuam na página.
 */

interface ItemPaleta {
  id: string;
  titulo: string;
  descricao?: string;
  rotulo?: string;
  /** O que acontece ao ativar o item. */
  run: () => void;
}

/** Atalhos mostrados quando a caixa está vazia. */
const ATALHOS: { id: string; titulo: string; href: string; rotulo: string }[] = [
  { id: "cidades", titulo: "Cidades Estratégicas", href: "/cidades", rotulo: "203 municípios" },
  { id: "cidades-mg", titulo: "Municípios de MG (853)", href: "/cidades/mg", rotulo: "IBGE" },
  { id: "congresso", titulo: "Congresso Nacional", href: "/congresso", rotulo: "CEAP" },
  { id: "judiciario", titulo: "Judiciário", href: "/judiciario", rotulo: "Justiça" },
  { id: "ambiental", titulo: "Ambiental / ONSA", href: "/ambiental", rotulo: "Licenças" },
  { id: "paraopeba", titulo: "Bacia do Paraopeba", href: "/paraopeba", rotulo: "Brumadinho" },
  { id: "laboratorio", titulo: "Laboratório de Dados", href: "/laboratorio", rotulo: "Gráficos" },
  { id: "tecnologia", titulo: "Tecnologia & Ferramentas", href: "/tecnologia", rotulo: "Utilidades" },
  { id: "modelos", titulo: "Modelos prontos", href: "/modelos", rotulo: "LAI e mais" },
  { id: "comparar", titulo: "Comparar cidades", href: "/comparar", rotulo: "Lado a lado" },
  { id: "guia", titulo: "Guia de contatos", href: "/guia", rotulo: "Telefones" },
  { id: "recapitular", titulo: "Recapitular uma cidade", href: "/recapitular", rotulo: "Resumo" },
  { id: "aprender", titulo: "Aprender (lições curtas)", href: "/aprender", rotulo: "Cidadania" },
];

export default function PaletaComandos() {
  const router = useRouter();
  const itensPasta = useItensPasta();
  const [aberto, setAberto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  const abrir = useCallback(() => {
    focoAnterior.current =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    setConsulta("");
    setSelecionado(0);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => setAberto(false), []);

  // Atalho global (Ctrl/Cmd+K) e evento do botão da navbar.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setAberto((v) => !v);
        return;
      }
      if (evento.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("abrir-paleta-comandos", abrir);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("abrir-paleta-comandos", abrir);
    };
  }, [abrir]);

  // Foco no campo ao abrir; devolve o foco a quem estava antes ao fechar.
  useEffect(() => {
    if (aberto) inputRef.current?.focus();
    else focoAnterior.current?.focus?.();
  }, [aberto]);

  const itens = useMemo<ItemPaleta[]>(() => {
    const termo = consulta.trim();
    const lista: ItemPaleta[] = [];

    lista.push({
      id: "seu-nono",
      titulo: termo ? `Perguntar ao Seu Nonô: “${termo}”` : "Perguntar ao Seu Nonô",
      descricao: "Resposta com IA, citando a fonte oficial",
      rotulo: "Assistente",
      run: () => {
        if (termo) {
          window.dispatchEvent(
            new CustomEvent("abrir-seu-nono", { detail: { pergunta: termo } }),
          );
        } else {
          router.push("/assistente");
        }
      },
    });

    if (termo.length >= 2) {
      lista.push({
        id: "busca-completa",
        titulo: `Ver todos os resultados de “${termo}”`,
        descricao: "Abrir a página de busca com este termo",
        rotulo: "Busca",
        run: () => router.push(`/busca?q=${encodeURIComponent(termo)}`),
      });

      for (const p of buscarPaginasPortal(termo, 6)) {
        lista.push({
          id: `pag-${p.id}`,
          titulo: p.titulo,
          descricao: p.descricao,
          rotulo: p.rotulo,
          run: () => router.push(p.href),
        });
      }
    } else {
      lista.push({
        id: "adicionar-pasta",
        titulo: "Adicionar esta página à pasta",
        descricao: "Junte páginas e exporte tudo junto no fim",
        rotulo: "Dossiê",
        run: () => {
          adicionarPaginaAtual();
        },
      });
      lista.push({
        id: "abrir-pasta",
        titulo: "Abrir minha pasta de dossiê",
        descricao: "Rever os itens e exportar em planilha ou impressão",
        rotulo: itensPasta.length > 0 ? `${itensPasta.length} itens` : "vazia",
        run: () => router.push("/pasta"),
      });
      for (const a of ATALHOS) {
        lista.push({
          id: `atalho-${a.id}`,
          titulo: a.titulo,
          rotulo: a.rotulo,
          run: () => router.push(a.href),
        });
      }
    }

    return lista;
  }, [consulta, router, itensPasta.length]);

  /** Move a seleção, mantendo-a dentro da lista e visível. */
  const moverSelecao = useCallback(
    (proximo: number) => {
      const indice = Math.max(0, Math.min(proximo, itens.length - 1));
      setSelecionado(indice);
      document.getElementById(`paleta-item-${indice}`)?.scrollIntoView({ block: "nearest" });
    },
    [itens.length],
  );

  /** Ativa o item pelo índice. */
  const ativar = useCallback(
    (indice: number) => {
      const item = itens[indice];
      if (!item) return;
      fechar();
      item.run();
    },
    [itens, fechar],
  );

  function aoTeclarCampo(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      moverSelecao(selecionado + 1);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      moverSelecao(selecionado - 1);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      ativar(selecionado);
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      fechar();
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Fechar paleta de comandos"
        onClick={fechar}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={16} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setSelecionado(0);
            }}
            onKeyDown={aoTeclarCampo}
            placeholder="Ir para uma página ou perguntar ao Seu Nonô…"
            aria-label="Busca rápida"
            className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {itens.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">
              Nada encontrado para “{consulta}”.
            </li>
          ) : (
            itens.map((item, indice) => (
              <li key={item.id} id={`paleta-item-${indice}`}>
                <button
                  type="button"
                  onMouseEnter={() => setSelecionado(indice)}
                  onClick={() => ativar(indice)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    indice === selecionado ? "bg-primary/10" : "hover:bg-surface-2"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.titulo}
                    </span>
                    {item.descricao ? (
                      <span className="block truncate text-xs text-muted">{item.descricao}</span>
                    ) : null}
                  </span>
                  {item.rotulo ? (
                    <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {item.rotulo}
                    </span>
                  ) : null}
                  <ArrowRight
                    size={13}
                    className={`shrink-0 ${indice === selecionado ? "text-primary" : "text-muted opacity-0"}`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft size={12} aria-hidden="true" /> abrir
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} aria-hidden="true" /> ↑ ↓ navegar · Esc fechar
          </span>
        </div>
      </div>
    </div>
  );
}
