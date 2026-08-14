"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import type { PatrimonioTombadoRow, CategoriaPatrimonioTombado } from "@/lib/db/queries/patrimonio-tombado";
import {
  CATEGORIA_LABEL,
  contarPorCategoria,
  filtrarPatrimonio,
  municipiosDistintos,
} from "@/lib/ambiental/patrimonio-tombado";

/**
 * Busca de `/ambiental/patrimonio-cultural` — 153 bens tombados por Minas
 * Gerais (IEPHA-MG, migration `0072`). Mesmo padrão de filtro-no-cliente de
 * `BuscaLegislacaoUnificada.tsx` (corpus pequeno, sem `searchParams`).
 */

const CATEGORIA_ORDEM: CategoriaPatrimonioTombado[] = ["BI", "CP", "CH", "BM"];

interface Props {
  linhas: PatrimonioTombadoRow[];
}

export default function BuscaPatrimonioTombado({ linhas }: Props) {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPatrimonioTombado | "">("");
  const [municipio, setMunicipio] = useState("");

  const municipios = useMemo(() => municipiosDistintos(linhas), [linhas]);
  const termoNormalizado = semAcento(q.trim());

  const filtrados = useMemo(
    () => filtrarPatrimonio(linhas, { termoNormalizado, categoria, municipio }, semAcento),
    [linhas, termoNormalizado, categoria, municipio]
  );

  const contagemCategoria = useMemo(() => contarPorCategoria(linhas), [linhas]);
  const temFiltro = Boolean(q || categoria || municipio);

  function limpar() {
    setQ("");
    setCategoria("");
    setMunicipio("");
  }

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="flex min-w-[220px] flex-1 flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Palavra-chave
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ex.: igreja, casarão, praça..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="municipio" className="mb-1 text-xs font-medium text-text-soft">
            Município
          </label>
          <select
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {temFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="cursor-pointer pb-1.5 text-sm text-text-soft hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-soft">Categoria:</span>
        {CATEGORIA_ORDEM.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoria((atual) => (atual === c ? "" : c))}
            aria-pressed={categoria === c}
            className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              categoria === c
                ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                : { borderColor: "var(--border)", color: "var(--color-text-soft, inherit)" }
            }
          >
            {CATEGORIA_LABEL[c]} ({formatNumberBR(contagemCategoria[c])})
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-text-soft">
        <strong className="font-tabular text-text">{formatNumberBR(filtrados.length)}</strong>{" "}
        {filtrados.length === 1 ? "bem encontrado" : "bens encontrados"}
        {temFiltro ? " com este filtro" : ""} — de {formatNumberBR(linhas.length)} tombados ao todo.
      </p>

      {filtrados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhum bem para esse filtro.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {filtrados.map((r) => (
            <li key={`${r.processoAno}-${r.denominacao}`} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-text-soft">
                    {CATEGORIA_LABEL[r.categoria]}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                    {r.municipio}
                  </span>
                </div>
                <span className="font-tabular text-xs text-text-soft">{r.processoAno}</span>
              </div>

              <p className="mt-2 font-medium text-text">{r.denominacao}</p>
              {r.denominacaoCompleta !== r.denominacao && (
                <p className="mt-0.5 text-sm text-text-soft">{r.denominacaoCompleta}</p>
              )}
              {r.classeSubclasse && <p className="mt-1 text-sm text-text-soft">{r.classeSubclasse}</p>}
              {r.atoLegal && (
                <p className="mt-2 text-xs text-text-soft">
                  <span className="font-medium text-text">Ato de tombamento: </span>
                  {r.atoLegal}
                  {r.livroDeTombo ? ` — Livro do Tombo ${r.livroDeTombo}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
