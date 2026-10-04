"use client";

/**
 * @file SeuNonoBusca.tsx
 * @description Barra de busca fixa do Seu Nonô — o novo degrau de entrada do
 * assistente (pedido do dono, 03/10/2026).
 *
 * Papel no portal: a janelinha do assistente deixou de abrir com o botão
 * "Perguntar à IA". Agora ela abre com uma barra de texto sempre visível.
 * Enquanto a pessoa digita, as sugestões sobem ACIMA da barra: páginas e hubs
 * do portal (o mesmo catálogo da busca geral) e a resposta pré-curada quando o
 * texto casa. Só quando não há correspondência e a pessoa aperta Enter é que a
 * IA (RAG, `/api/chatbot`) entra.
 *
 * Fonte dos dados e regras reaproveitadas (nada recriado aqui):
 * - `montarSugestoesBuscaNono` (`lib/assistente/sugestoes-busca.ts`) junta o
 *   catálogo de páginas (`buscarPaginasPortal`), a navegação determinística
 *   (`interpretar`) e a curadoria da Regra de Escada (`avaliarEscadaDeterminista`).
 * - Navegação interna pelo `next/link`: a casca do portal (rádio, pet, o
 *   próprio assistente) vive no layout raiz e não pode recarregar (AGENTS §5.13).
 *
 * Decisões técnicas não triviais:
 * - As sugestões são posicionadas com `absolute bottom-full` DENTRO do painel,
 *   e não pelo utilitário `lib/posicionar-painel.ts`. Aquele utilitário clampa
 *   um painel `position: fixed` contra a viewport e converte coordenadas por
 *   causa do `transform` do arrasto; aqui a "âncora" é a própria barra, que já
 *   mora dentro do painel clampiado — usar o utilitário brigaria com o
 *   `marginLeft`/`maxHeight` que o `usePosicaoPainel` aplica no painel. O
 *   `bottom-full` é o comportamento pedido ("expande para cima") com uma linha
 *   de CSS, sem estado de medição.
 * - Debounce curto (~140 ms) para não rodar o catálogo a cada tecla, mas ainda
 *   parecer "em tempo real".
 * - Acessibilidade no padrão combobox/listbox: `role="combobox"` no input,
 *   `role="listbox"` na lista, `role="option"` em cada item, setas para mover,
 *   Enter para acionar e `aria-activedescendant` apontando o item ativo.
 * - Os tipos são explícitos e não há `any`.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, CornerDownLeft, FileText } from "lucide-react";
import { montarSugestoesBuscaNono } from "@/lib/assistente/sugestoes-busca";
import type { ResultadoEscada } from "@/lib/assistente/escada-determinista";

/** Atraso curto entre a tecla e a busca, para não rodar o catálogo a cada letra. */
const ATRASO_DEBOUNCE_MS = 140;

/** Item achatado que a lista desenha (curadoria + páginas/destinos). */
interface ItemLista {
  chave: string;
  tipo: "curada" | "pagina" | "navegacao";
  titulo: string;
  descricao: string;
  href?: string;
  rotulo?: string;
  curada?: ResultadoEscada;
}

export interface SeuNonoBuscaProps {
  /** Caminho atual, para o contexto de zona/cidade da curadoria. */
  pathname: string | null;
  /** Ref para a tela cheia devolver o foco à barra. */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Enquanto a IA pensa, a barra não aceita nova pergunta. */
  desabilitado?: boolean;
  /** Enter sem correspondência: entrega o termo ao caminho de IA existente. */
  aoEnviarIa: (termo: string) => void;
  /** Clique/Enter numa sugestão de resposta pré-curada. */
  aoEscolherCuradoria: (resultado: ResultadoEscada, termo: string) => void;
}

/**
 * Barra fixa do Seu Nonô com sugestões em tempo real expandindo para cima.
 */
export function SeuNonoBusca({
  pathname,
  inputRef,
  desabilitado = false,
  aoEnviarIa,
  aoEscolherCuradoria,
}: SeuNonoBuscaProps) {
  const router = useRouter();
  const caixaRef = useRef<HTMLDivElement>(null);

  const [termo, setTermo] = useState("");
  const [termoDebounced, setTermoDebounced] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);

  // Debounce: `termoDebounced` só muda depois de uma pausa curta. É ele que
  // alimenta a busca — o valor digitado continua instantâneo na tela.
  useEffect(() => {
    const timer = window.setTimeout(() => setTermoDebounced(termo), ATRASO_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [termo]);

  const sugestoes = useMemo(
    () => montarSugestoesBuscaNono(termoDebounced, pathname),
    [termoDebounced, pathname]
  );

  const itens = useMemo<ItemLista[]>(() => {
    const lista: ItemLista[] = [];
    if (sugestoes.curada) {
      lista.push({
        chave: "curada",
        tipo: "curada",
        titulo: sugestoes.curada.titulo,
        descricao: sugestoes.curada.texto,
        curada: sugestoes.curada,
      });
    }
    for (const p of sugestoes.paginas) {
      lista.push({
        chave: p.id,
        tipo: p.tipo,
        titulo: p.titulo,
        descricao: p.descricao,
        href: p.href,
        rotulo: p.rotulo,
      });
    }
    return lista;
  }, [sugestoes]);

  const total = itens.length;
  // Se a lista encolheu enquanto o usuário navegava por ela, o índice antigo não
  // pode apontar para fora. -1 significa "nenhum item destacado".
  const ativoClamp = total === 0 ? -1 : Math.min(Math.max(ativo, -1), total - 1);
  const mostrar = aberto && termoDebounced.trim().length >= 2 && total > 0;

  // Fecha ao clicar fora da caixa (padrão da `BuscaGlobal`), sem roubar o
  // clique do item — o `onMouseDown` de cada item já evita o blur.
  useEffect(() => {
    function fecharFora(ev: PointerEvent) {
      if (!caixaRef.current?.contains(ev.target as Node)) {
        setAberto(false);
        setAtivo(-1);
      }
    }
    document.addEventListener("pointerdown", fecharFora);
    return () => document.removeEventListener("pointerdown", fecharFora);
  }, []);

  /** Aciona o item da posição `i`: curadoria responde, página navega. */
  function ativar(i: number) {
    const item = itens[i];
    if (!item) return;
    if (item.tipo === "curada" && item.curada) {
      aoEscolherCuradoria(item.curada, termo.trim());
    } else if (item.href) {
      // `router.push` navega no cliente, igual ao `<Link>`: a casca não
      // desmonta (AGENTS §5.13).
      router.push(item.href);
    }
    setTermo("");
    setTermoDebounced("");
    setAberto(false);
    setAtivo(-1);
  }

  /** Enter: aciona a sugestão destacada (ou a primeira); sem lista, chama a IA. */
  function enviar() {
    const limpo = termo.trim();
    if (!limpo) return;
    if (total > 0) {
      ativar(ativoClamp >= 0 ? ativoClamp : 0);
      return;
    }
    aoEnviarIa(limpo);
    setTermo("");
    setTermoDebounced("");
    setAberto(false);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (total === 0) return;
      e.preventDefault();
      setAtivo((a) => Math.min((a < 0 ? -1 : a) + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      if (total === 0) return;
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, 0));
    } else if (e.key === "Escape") {
      setAberto(false);
      setAtivo(-1);
    }
  }

  return (
    <div ref={caixaRef} className="relative">
      {mostrar && (
        <div
          id="nono-lista-sugestoes"
          role="listbox"
          aria-label="Sugestões de busca no portal"
          data-testid="nono-sugestoes"
          className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-[min(50vh,20rem)] overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl"
        >
          {itens.map((item, i) => {
            const id = `nono-sugestao-${i}`;
            const selecionado = i === ativoClamp;
            const classe = `flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
              selecionado ? "bg-primary/10" : "hover:bg-surface-2"
            }`;

            if (item.tipo === "curada") {
              return (
                <button
                  key={item.chave}
                  type="button"
                  role="option"
                  id={id}
                  aria-selected={selecionado}
                  data-testid="nono-sugestao"
                  data-tipo="curada"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ativar(i)}
                  className={classe}
                >
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">
                      Resposta pronta: {item.titulo}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-text-soft">
                      {item.descricao}
                    </span>
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.chave}
                href={item.href ?? "#"}
                role="option"
                id={id}
                aria-selected={selecionado}
                data-testid="nono-sugestao"
                data-tipo={item.tipo}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTermo("");
                  setTermoDebounced("");
                  setAberto(false);
                }}
                className={classe}
              >
                <FileText size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text">{item.titulo}</span>
                    {item.rotulo ? (
                      <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {item.rotulo}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-text-soft">
                    {item.descricao}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={mostrar}
            aria-controls={mostrar ? "nono-lista-sugestoes" : undefined}
            aria-activedescendant={ativoClamp >= 0 ? `nono-sugestao-${ativoClamp}` : undefined}
            aria-autocomplete="list"
            aria-label="Buscar no portal ou perguntar ao Seu Nonô"
            data-testid="nono-busca"
            autoComplete="off"
            value={termo}
            disabled={desabilitado}
            onChange={(e) => {
              setTermo(e.target.value);
              setAtivo(-1);
              setAberto(true);
            }}
            onFocus={() => setAberto(true)}
            onKeyDown={aoTeclar}
            placeholder="Digite para buscar no portal…"
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-text outline-none focus:border-primary disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={desabilitado || !termo.trim()}
          title="Buscar ou perguntar à IA"
          aria-label="Buscar ou perguntar à IA"
          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-primary-ink transition-opacity hover:bg-primary/90 disabled:opacity-50"
        >
          <CornerDownLeft size={15} />
        </button>
      </form>
    </div>
  );
}
