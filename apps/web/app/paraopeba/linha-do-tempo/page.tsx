import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { MARCOS_PARAOPEBA } from "@/lib/paraopeba";
import { formatDateBR } from "@/lib/betim/format";

export const metadata: Metadata = {
  title: "Linha do tempo — Paraopeba | Controle Popular",
  description:
    "Os marcos do processo de reparação pelo rompimento da barragem da Vale em Brumadinho, do corte do auxílio emergencial à confirmação do pagamento de agosto de 2026.",
};

export default function LinhaDoTempoPage() {
  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto de
  // `clipping/page.tsx` (ver o comentário lá): sem `<main>`,
  // `OuvirPagina.tsx` não achava texto e o botão "Ouvir esta página"
  // sumia nesta tela.
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Linha do tempo</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Do corte do auxílio à confirmação de agosto
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {MARCOS_PARAOPEBA.length} marcos do processo de reparação, em ordem — cada decisão
        judicial, cada resposta da Vale, cada passo do caso no STF.
      </p>

      <ol className="mt-8 flex flex-col gap-0">
        {MARCOS_PARAOPEBA.map((m, i) => (
          <li key={`${m.data}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
            {i < MARCOS_PARAOPEBA.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-3 left-[7px] h-full w-0.5 bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-surface"
              style={{ backgroundColor: m.cor }}
            />
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="font-tabular text-xs font-semibold text-text-soft">
                {formatDateBR(m.data)}
              </p>
              <p className="mt-0.5 font-display text-base font-semibold text-text">{m.titulo}</p>
              <p className="mt-1 text-sm text-text-soft">{m.descricao}</p>
            </div>
          </li>
        ))}
      </ol>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
