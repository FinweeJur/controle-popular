import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { PERIODO_CLIPPING, CLIPPING_PARAOPEBA } from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import ClippingClient from "./ClippingClient";

/**
 * `/paraopeba/clipping` — clipping de imprensa sobre a reparação de
 * Brumadinho.
 *
 * ═══ POR QUE O TÍTULO CITA O PERÍODO, NUNCA "NOTÍCIAS DE HOJE" ═══
 *
 * `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.3): é um snapshot manual, sem
 * atualização automática. Rotular pelo período real (`PERIODO_CLIPPING`) é
 * o que separa "acervo histórico honesto" de "página que mente a partir de
 * amanhã".
 */
export const metadata: Metadata = {
  title: `Clipping — Paraopeba | Controle Popular`,
  description: `${formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias sobre a reparação do rompimento da barragem da Vale em Brumadinho, de ${formatDateBR(PERIODO_CLIPPING.de)} a ${formatDateBR(PERIODO_CLIPPING.ate)}.`,
};

export default function ClippingPage() {
  // ⟲ 13/08, revisão de onboarding: era `<div>` — `OuvirPagina.tsx` só lê
  // `document.querySelector("main")`, e as cinco páginas de /paraopeba
  // nasceram sem a tag, então o botão "Ouvir esta página" se escondia
  // (`!temTexto` ⇒ `return null`) na frente mais nova do portal inteira.
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Clipping</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Cobertura midiática da reparação
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Acervo de{" "}
        <strong className="text-text">
          {formatDateBR(PERIODO_CLIPPING.de)} a {formatDateBR(PERIODO_CLIPPING.ate)}
        </strong>{" "}
        — não é notícia do dia. É um retrato datado, reunido à mão, que não se atualiza
        sozinho. O Instituto Guaicuy mantém a fonte viva em{" "}
        <a
          href="https://guaicuy.org.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          guaicuy.org.br ↗
        </a>
        .
      </p>

      <ClippingClient />

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
