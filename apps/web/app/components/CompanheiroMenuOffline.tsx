"use client";

/**
 * CompanheiroMenuOffline — o menu de bichinhos com o companheiro DESLIGADO.
 *
 * Pedido do dono (21/10/2026): a pata do pet deve ABRIR O MENU de
 * companheiros mesmo com o passarinho desligado — mas nada pode ligar
 * sozinho. O menu do `CompanheiroFlutuante` não serve: ele só fica montado
 * com o companheiro ativo. Este componente mora no ramo DESLIGADO do
 * `CompanheiroOpcional` e escuta o MESMO evento da pata
 * (`cp:companheiro-menu-pet`). Abrir aqui não inicia bicho, não pré-carrega
 * nada: o passarinho SÓ nasce quando a pessoa clica num bichinho DENTRO do
 * menu (que grava a escolha em `CHAVE_PET` e liga o companheiro). Fecha com
 * Esc e clique fora. Sem pet escolhido, o menu só abre e fecha.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PetIcone } from "./PetIcone";
import {
  PETS_COMPANHEIRO,
  CHAVE_PET,
  type PetCompanheiro,
} from "./companheiroPets";
import { EVENTO_MENU_PET_FECHAR } from "@/lib/companheiro/eventos";

export default function CompanheiroMenuOffline() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const painelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Fecha avisando a pata (aria-expanded volta a false).
  const fechar = useCallback(() => {
    setMenu(null);
    window.dispatchEvent(new Event(EVENTO_MENU_PET_FECHAR));
  }, []);

  // A pata (e o menu do flutuante, se um dia voltar) pede o menu no ponto.
  useEffect(() => {
    const abrir = (e: Event) => {
      const d = (e as CustomEvent<{ x?: number; y?: number }>).detail ?? {};
      setMenu({ x: d.x ?? 40, y: d.y ?? 40 });
    };
    window.addEventListener("cp:companheiro-menu-pet", abrir);
    return () => window.removeEventListener("cp:companheiro-menu-pet", abrir);
  }, []);

  // Esc fecha — contrato de diálogo do resto do portal.
  useEffect(() => {
    if (!menu) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [menu, fechar]);

  // Clamp: o menu nasce no ponto da pata, mas nunca sai da tela. Mede o
  // painel num quadro e reposiciona se precisar (mesma ideia do flutuante).
  useLayoutEffect(() => {
    if (!menu) return;
    const el = painelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margem = 8;
    const x = Math.min(Math.max(margem, menu.x), window.innerWidth - r.width - margem);
    const y = Math.min(Math.max(margem, menu.y), window.innerHeight - r.height - margem);
    setPos({ x, y });
  }, [menu]);

  /**
   * A ÚNICA porta de saída do menu: a pessoa clicou num bichinho. Grava a
   * escolha no `CHAVE_PET` (mesma convenção do flutuante: slugs separados
   * por vírgula; um só aqui) e LIGA o companheiro — é este clique que
   * inicia o passarinho, nunca a abertura do menu.
   */
  const escolher = useCallback((pet: PetCompanheiro) => {
    try {
      window.localStorage.setItem(CHAVE_PET, pet.slug);
    } catch {
      // Armazenamento bloqueado: a escolha vale só nesta sessão.
    }
    // Import preguiçoso não vale a pena: importar `definirCompanheiroAtivo`
    // é barato (não monta bicho nenhum — só grava e avisa).
    import("./CompanheiroOpcional").then(({ definirCompanheiroAtivo }) => {
      definirCompanheiroAtivo(true);
    });
    fechar();
  }, [fechar]);

  if (!menu) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        data-nao-plataforma
        onPointerDown={fechar}
        aria-hidden="true"
      />
      <div
        ref={painelRef}
        role="menu"
        aria-label="Escolher o bichinho do companheiro"
        data-nao-plataforma
        data-lenis-prevent
        className="fixed z-[70] max-h-[60vh] w-60 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-2 shadow-lg"
        style={{
          left: pos ? Math.round(pos.x) : menu.x,
          top: pos ? Math.round(pos.y) : menu.y,
          // Medida zero no primeiro quadro: invisível até o clamp posicionar.
          visibility: pos ? "visible" : "hidden",
        }}
      >
        <div className="flex items-start justify-between gap-2 px-2 pb-1">
          <p className="text-[0.75rem] font-medium text-text-soft">
            Escolha um bichinho — ele só nasce se você clicar:
          </p>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar seletor de bichinhos"
            title="Fechar"
            className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-text-soft hover:bg-surface-2"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="space-y-0.5">
          {PETS_COMPANHEIRO.map((p) => (
            <li key={p.slug} data-cp-prox>
              <button
                type="button"
                role="menuitem"
                onClick={() => escolher(p)}
                className="flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 text-text"
              >
                <span className="flex items-center gap-1.5">
                  <PetIcone pet={p} altura={16} />
                  <span>{p.nome}</span>
                </span>
                <span className="truncate text-[0.75rem] font-normal text-text-soft">
                  {p.autor}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={fechar}
          className="mt-1 w-full rounded-lg px-2 py-1.5 text-right text-xs font-medium text-text-soft hover:bg-surface-2"
        >
          Fechar
        </button>
      </div>
    </>
  );
}
