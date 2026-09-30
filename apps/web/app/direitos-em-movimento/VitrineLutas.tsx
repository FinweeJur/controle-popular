"use client";

/**
 * VitrineLutas — vitrine das lutas curadas (camadas país, região e UF).
 *
 * Papel no portal: a porta `/direitos-em-movimento` mostra as lutas que já
 * têm verbete com fonte fechada, com busca por texto e filtro por tipo de
 * luta (AGENTS.md §8: buscável e filtrável; cor nunca é o único canal —
 * o tipo sai por extenso). Cada cartão traz período, lugar e o botão
 * "Fonte" (link direto).
 *
 * Os verbetes chegam prontos do servidor (poucas dezenas), então não há
 * índice fatiado.
 */

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TagChip } from "@/app/components/TagChip";
import { ROTULO_TIPO, TIPOS_ORDEM } from "@/lib/memoria/rotulos";
import type { TipoLuta } from "@/lib/memoria/tipos";

export interface FonteVitrine {
  orgao: string;
  ano: string;
  titulo: string;
  url: string;
}

export interface VerbeteVitrine {
  /** "Brasil" | "Região" | "Estado" — o degrau da vitrine. */
  ambito: string;
  lugar?: string;
  titulo: string;
  periodo: string;
  resumo: string;
  tipo: TipoLuta[];
  fonte: FonteVitrine[];
}

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function VitrineLutas({ verbetes }: { verbetes: VerbeteVitrine[] }) {
  const [busca, setBusca] = useState("");
  const [tipos, setTipos] = useState<Set<TipoLuta>>(new Set());

  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    return verbetes.filter((v) => {
      if (tipos.size > 0 && !v.tipo.some((t) => tipos.has(t))) return false;
      if (alvo) {
        const texto = normalizar(`${v.titulo} ${v.resumo} ${v.lugar ?? ""} ${v.ambito}`);
        if (!texto.includes(alvo)) return false;
      }
      return true;
    });
  }, [verbetes, busca, tipos]);

  const alternarTipo = (t: TipoLuta) => {
    setTipos((atual) => {
      const novo = new Set(atual);
      if (novo.has(t)) novo.delete(t);
      else novo.add(t);
      return novo;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por luta, lugar ou período…"
            aria-label="Buscar nas lutas"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <p className="font-tabular text-xs text-text-soft" aria-live="polite">
          {filtrados.length} de {verbetes.length}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tipo de luta</span>
        {TIPOS_ORDEM.map((t) => (
          <TagChip key={t} label={ROTULO_TIPO[t]} ativo={tipos.has(t)} onClick={() => alternarTipo(t)} />
        ))}
        {tipos.size > 0 && (
          <button
            type="button"
            onClick={() => setTipos(new Set())}
            className="text-xs text-muted underline hover:text-foreground"
          >
            limpar
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-sm text-text-soft">
          Nenhuma luta corresponde a “{busca}”.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtrados.map((v, i) => (
            <li
              key={`${v.titulo}-${i}`}
              className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <span className="text-[.75em] font-semibold uppercase tracking-wide text-primary">
                {v.ambito}
                {v.lugar ? ` · ${v.lugar}` : ""}
              </span>
              <h3 className="mt-1 font-display text-[1.05em] font-semibold text-text">
                {v.titulo}
                {v.periodo ? (
                  <span className="ml-2 text-[.75em] font-normal text-muted">{v.periodo}</span>
                ) : null}
              </h3>
              <p className="mt-1 flex-1 text-[.92em] text-text-soft">{v.resumo}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.tipo.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[.7em] text-text-soft"
                  >
                    {ROTULO_TIPO[t]}
                  </span>
                ))}
              </div>
              {v.fonte.length > 0 ? (
                <p className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 text-[.78em]">
                  <span className="font-semibold text-text">Fonte:</span>
                  {v.fonte.map((f) => (
                    <a
                      key={f.url}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${f.titulo} — ${f.orgao}, ${f.ano}`}
                      className="rounded-md border border-border px-2 py-0.5 font-semibold text-primary hover:border-primary hover:bg-primary/5"
                    >
                      {f.orgao} ({f.ano})
                    </a>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
