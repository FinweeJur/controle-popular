"use client";

/**
 * LinhaDoTempo — lista cronológica dos verbetes da memória (fontes MST e
 * Blog Aos que Virão), com busca, filtros, ordenação, exportação CSV e
 * impressão.
 *
 * Papel no portal: dar à página `/memoria` a leitura de "linha do tempo da
 * história" — todos os fatos com sua citação curta. Os 533 verbetes são
 * passados pelo servidor já recortados (`VerbeteLinha`), abaixo do teto de
 * ~2 mil linhas do AGENTS.md §5.1, então não há índice fatiado aqui.
 *
 * Decisões técnicas:
 * - a busca normaliza acento (NFD) e ignora caixa, como o resto do portal;
 * - a "fonte" é derivada da própria citação curta (`Insurgente` × MST),
 *   sem campo novo no dado;
 * - o CSV sai do RECORTE FILTRADO na tela (regra do dono, AGENTS §8.6) e
 *   com BOM UTF-8, via `BotoesExportar`.
 */

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import BotoesExportar from "@/app/components/BotoesExportar";
import { TagChip } from "@/app/components/TagChip";
import type { ColunaCsv } from "@/lib/tabela/csv";
import {
  ROTULO_TIPO,
  TIPOS_ORDEM,
  numeroDoSeculo,
  seculoDe,
} from "@/lib/memoria/rotulos";
import type { TipoLuta } from "@/lib/memoria/tipos";

/** Verbete já recortado para a tela (menos campos que `EntradaCalendario`). */
export interface VerbeteLinha {
  diaMes: string;
  ano: string;
  titulo: string;
  resumo?: string;
  tipo: TipoLuta[];
  fonteCurta: string;
  url?: string;
  semData?: boolean;
  /** Rótulo do dia do fato, ex.: "12 de janeiro". */
  dataLabel: string;
}

interface Props {
  verbetes: VerbeteLinha[];
}

type Fonte = "todas" | "mst" | "blog";

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const nomeFonte = (v: VerbeteLinha): Exclude<Fonte, "todas"> =>
  /insurgente/i.test(v.fonteCurta) ? "blog" : "mst";

export default function LinhaDoTempo({ verbetes }: Props) {
  const [busca, setBusca] = useState("");
  const [tipos, setTipos] = useState<Set<TipoLuta>>(new Set());
  const [fonte, setFonte] = useState<Fonte>("todas");
  const [seculo, setSeculo] = useState<string>("todos");
  const [maisAntigosPrimeiro, setMaisAntigosPrimeiro] = useState(true);

  const seculos = useMemo(() => {
    const conjunto = new Set(verbetes.map((v) => seculoDe(v.ano)));
    return [...conjunto].sort((a, b) => {
      if (a === "Sem data") return 1;
      if (b === "Sem data") return -1;
      return a.localeCompare(b, "pt-BR");
    });
  }, [verbetes]);

  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    return verbetes.filter((v) => {
      if (fonte !== "todas" && nomeFonte(v) !== fonte) return false;
      if (seculo !== "todos" && seculoDe(v.ano) !== seculo) return false;
      if (tipos.size > 0 && !v.tipo.some((t) => tipos.has(t))) return false;
      if (alvo) {
        const texto = normalizar(`${v.titulo} ${v.resumo ?? ""} ${v.fonteCurta} ${v.dataLabel}`);
        if (!texto.includes(alvo)) return false;
      }
      return true;
    });
  }, [verbetes, busca, fonte, seculo, tipos]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, VerbeteLinha[]>();
    for (const v of filtrados) {
      const chave = seculoDe(v.ano);
      const lista = mapa.get(chave) ?? [];
      lista.push(v);
      mapa.set(chave, lista);
    }
    const ordem = [...mapa.entries()].sort(([a], [b]) => {
      if (a === "Sem data") return 1;
      if (b === "Sem data") return -1;
      const na = numeroDoSeculo(mapa.get(a)?.[0]?.ano ?? "");
      const nb = numeroDoSeculo(mapa.get(b)?.[0]?.ano ?? "");
      return maisAntigosPrimeiro ? na - nb : nb - na;
    });
    for (const [, lista] of ordem) {
      lista.sort((x, y) => {
        const ax = Number(x.ano) || 0;
        const ay = Number(y.ano) || 0;
        if (ax !== ay) return maisAntigosPrimeiro ? ax - ay : ay - ax;
        return x.diaMes.localeCompare(y.diaMes);
      });
    }
    return ordem;
  }, [filtrados, maisAntigosPrimeiro]);

  const alternarTipo = (t: TipoLuta) => {
    setTipos((atual) => {
      const novo = new Set(atual);
      if (novo.has(t)) novo.delete(t);
      else novo.add(t);
      return novo;
    });
  };

  const colunasCsv: ColunaCsv<VerbeteLinha>[] = [
    { chave: "dataLabel", rotulo: "Dia" },
    { chave: "ano", rotulo: "Ano" },
    { chave: "titulo", rotulo: "Título" },
    { chave: "resumo", rotulo: "Resumo" },
    { chave: "tipo", rotulo: "Tipo", formatar: (v: TipoLuta[]) => v.map((t) => ROTULO_TIPO[t]).join(", ") },
    { chave: "fonteCurta", rotulo: "Fonte" },
    { chave: "url", rotulo: "Link" },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Controles (não imprimem) ─── */}
      <div className="space-y-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex flex-1 items-center min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por fato, pessoa, lugar ou fonte…"
              aria-label="Buscar na linha do tempo"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Século</span>
            <select
              value={seculo}
              onChange={(e) => setSeculo(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
            >
              <option value="todos">Todos</option>
              {seculos.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Fonte</span>
            <select
              value={fonte}
              onChange={(e) => setFonte(e.target.value as Fonte)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
            >
              <option value="todas">As duas</option>
              <option value="mst">Calendário do MST</option>
              <option value="blog">Blog Aos que Virão</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setMaisAntigosPrimeiro((v) => !v)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary"
            aria-pressed={!maisAntigosPrimeiro}
          >
            {maisAntigosPrimeiro ? "↑ Mais antigos primeiro" : "↓ Mais recentes primeiro"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tipo de luta</span>
          {TIPOS_ORDEM.map((t) => (
            <TagChip
              key={t}
              label={ROTULO_TIPO[t]}
              ativo={tipos.has(t)}
              onClick={() => alternarTipo(t)}
            />
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="font-tabular text-sm text-text-soft" aria-live="polite">
            {filtrados.length.toLocaleString("pt-BR")} de {verbetes.length.toLocaleString("pt-BR")} verbetes
          </p>
          <BotoesExportar
            dados={filtrados}
            colunas={colunasCsv}
            nomeArquivo="linha-do-tempo-memoria"
          />
        </div>
      </div>

      {/* ─── A linha do tempo ─── */}
      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-sm text-text-soft">
          Nenhum verbete corresponde a “{busca}”. A busca cobre o acervo inteiro —
          este resultado é definitivo, não parcial.
        </p>
      ) : (
        <div className="space-y-10">
          {grupos.map(([rotuloSeculo, lista]) => (
            <section key={rotuloSeculo} aria-label={rotuloSeculo}>
              <h2 className="sticky top-0 z-10 -mx-1 border-b border-border bg-bg/95 px-1 py-2 font-display text-lg font-bold text-foreground backdrop-blur">
                {rotuloSeculo}
                <span className="ml-2 font-mono text-xs font-normal text-muted">
                  {lista.length} {lista.length === 1 ? "verbete" : "verbetes"}
                </span>
              </h2>
              <ol className="mt-2 space-y-1 border-l-2 border-border/70">
                {lista.map((v, i) => (
                  <li
                    key={`${v.diaMes}-${v.titulo}-${i}`}
                    className="relative py-3 pl-5 print:break-inside-avoid"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-[-5px] top-5 h-2 w-2 rounded-full bg-primary"
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {v.ano || "sem data"}
                      </span>
                      <span className="text-xs text-muted">{v.dataLabel}</span>
                    </div>
                    <h3 className="mt-0.5 font-semibold text-foreground">{v.titulo}</h3>
                    {v.resumo ? (
                      <p className="mt-1 text-sm leading-relaxed text-text-soft">{v.resumo}</p>
                    ) : null}
                    {v.semData ? (
                      <p className="mt-1 text-xs italic text-muted">
                        Fato do calendário sem data no original — exibido para não deixar o dia vazio.
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      <span className="font-semibold">Fonte: </span>
                      {v.url ? (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {v.fonteCurta}
                          <ExternalLink className="ml-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
                        </a>
                      ) : (
                        v.fonteCurta
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
