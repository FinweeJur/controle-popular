"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { buscarTermos, type TermoGlossario } from "@/lib/glossario/termos";

/**
 * Glossário cívico (`/glossario`).
 *
 * Busca instantânea sobre a lista de termos; a explicação é sempre visível
 * (nunca só em hover — a doutrina do globo 3D). A definição e a fonte vêm de
 * `lib/glossario/termos.ts`, fonte única.
 */

function Fonte({ nome, url }: { nome: string; url: string }) {
  if (url.startsWith("/")) {
    return (
      <Link href={url} className="font-medium text-primary hover:underline">
        {nome}
      </Link>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
    >
      {nome}
      <ExternalLink size={11} aria-hidden="true" />
    </a>
  );
}

export default function GlossarioClient() {
  const [consulta, setConsulta] = useState("");
  const termos = useMemo(() => buscarTermos(consulta), [consulta]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar um termo (licitação, TAC, ICMS...)"
          aria-label="Buscar no glossário"
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <p role="status" aria-live="polite" className="text-xs text-muted">
        {termos.length} de {buscarTermos("").length} termos.
      </p>

      <dl className="space-y-3">
        {termos.map((t: TermoGlossario) => (
          <div key={t.id} className="rounded-2xl border border-border bg-surface p-4">
            <dt className="font-display text-base font-bold text-foreground">{t.termo}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">
              {t.definicao}
              {t.fonte && (
                <span className="mt-1 block text-xs">
                  Fonte: <Fonte {...t.fonte} />
                </span>
              )}
            </dd>
          </div>
        ))}
        {termos.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-surface-2/50 p-4 text-sm text-muted">
            Nenhum termo encontrado. Tente outra palavra.
          </p>
        )}
      </dl>
    </div>
  );
}
