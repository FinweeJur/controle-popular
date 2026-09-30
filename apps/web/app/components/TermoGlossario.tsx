"use client";

import { useState } from "react";
import Link from "next/link";
import { TERMOS } from "@/lib/glossario/termos";

/**
 * Termo com definição inline — o "o que é isto" no meio do texto.
 *
 * ═══ O QUE É ═══
 *
 * Envolve uma sigla ou palavra (`LAI`, `TAC`, `condicionante`) e põe ao lado um
 * botãozinho `?`. Ao tocar, a definição do glossário aparece ali mesmo, com a
 * fonte. Usa a FONTE ÚNICA (`lib/glossario/termos.ts`) — não duplica definição.
 *
 * ═══ POR QUE BOTÃO, E NÃO HOVER ═══
 *
 * A doutrina do portal (herdada do globo 3D) é: **explicação sempre visível,
 * nunca só em hover** — porque no celular não existe hover, e o leitor está
 * sob estresse. Um `<button>` funciona no toque e no teclado. Por ser
 * `span`/`button` (conteúdo frasal), o termo cabe DENTRO de um parágrafo.
 *
 * ═══ FALHA SEGURA ═══
 *
 * Se o id não existir no glossário, renderiza o texto normal, sem botão — um
 * termo mal ligado não deve quebrar a frase.
 */

export default function TermoGlossario({
  id,
  children,
}: {
  /** Id do termo em `lib/glossario/termos.ts`. */
  id: string;
  /** Rótulo mostrado; sem ele, usa o próprio termo do glossário. */
  children?: React.ReactNode;
}) {
  const termo = TERMOS.find((t) => t.id === id);
  const [aberto, setAberto] = useState(false);

  if (!termo) return <>{children ?? id}</>;

  return (
    <span className="inline">
      <span className="font-medium text-foreground">{children ?? termo.termo}</span>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={`O que é ${termo.termo}?`}
        title={`O que é ${termo.termo}?`}
        className="ml-0.5 rounded px-1 align-super text-[10px] font-bold text-primary hover:bg-primary/10"
      >
        ?
      </button>
      {aberto && (
        <span
          role="status"
          aria-live="polite"
          className="mt-1 block rounded-lg border border-border bg-surface-2 p-2 text-xs leading-relaxed text-muted"
        >
          <strong className="text-foreground">{termo.termo}: </strong>
          {termo.definicao}
          {termo.fonte && (
            <>
              {" "}
              Fonte:{" "}
              {termo.fonte.url.startsWith("/") ? (
                <Link href={termo.fonte.url} className="font-medium text-primary hover:underline">
                  {termo.fonte.nome}
                </Link>
              ) : (
                <a
                  href={termo.fonte.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {termo.fonte.nome}
                </a>
              )}
              .
            </>
          )}{" "}
          <Link href={`/glossario#${termo.id}`} className="font-medium text-primary hover:underline">
            Ver no glossário
          </Link>
        </span>
      )}
    </span>
  );
}
