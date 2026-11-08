"use client";

/**
 * Caixa de explicação do rastro mágico.
 *
 * Fica acima do dock, com `role="status"` para o leitor de tela anunciar sem
 * tirar o foco do botão. O id é usado pelo `aria-describedby` do item.
 */
export const ID_EXPLICACAO_RASTRO = "cp-dock-explicacao";

export default function DockExplicacao() {
  return (
    <div
      id={ID_EXPLICACAO_RASTRO}
      role="status"
      className="mb-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-text shadow-xl"
    >
      <strong className="font-semibold">Rastro mágico.</strong> Deixa uma trilha
      atrás do cursor. No celular, arraste o dedo na tela.
    </div>
  );
}
