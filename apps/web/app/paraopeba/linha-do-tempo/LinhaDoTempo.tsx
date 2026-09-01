"use client";

import { useMemo, useState } from "react";
import {
  MARCOS_PARAOPEBA,
  ROTULO_TIPO_MARCO,
  formatarDataMarco,
  tipoDeMarco,
  type MarcoParaopeba,
  type TipoMarco,
} from "@/lib/paraopeba/linha-do-tempo";

/**
 * A linha do tempo com a régua das 5 coisas (AGENTS.md): cartões de topo,
 * gráfico SVG (sem biblioteca — a rota vive no teto de 3 MiB gzip do
 * Worker), filtro por tipo de leitura, ordenação e planilha CSV do que está
 * filtrado na tela. O dado (23 marcos) é pequeno e vai como prop de
 * servidor — a régua de "coleção nunca como prop de cliente" vale para
 * listas grandes, não para esta.
 *
 * A régua dos tipos (`tipoDeMarco`) vive no `lib`, com teste: o filtro, o
 * gráfico e a legenda nunca discordam do que o painel-fonte pintou.
 */

const TIPOS: TipoMarco[] = ["favoravel", "desfavoravel", "neutro"];

const COR_TIPO: Record<TipoMarco, string> = {
  favoravel: "#3A6B10",
  desfavoravel: "#9B1C1C",
  neutro: "#1A5FA8",
};

type Filtro = "todos" | TipoMarco;

function anoDe(data: string): string {
  return data.slice(0, 4);
}

function baixarCsv(linhas: MarcoParaopeba[]) {
  const cabecalho = ["data", "titulo", "descricao", "tipo", "cor"];
  const corpo = linhas.map((m) =>
    [m.data, m.titulo, m.descricao, ROTULO_TIPO_MARCO[tipoDeMarco(m.cor)], m.cor]
      .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
      .join(";")
  );
  // BOM UTF-8 + separador `;` — abre direto no Excel brasileiro.
  const csv = "\uFEFF" + [cabecalho.join(";"), ...corpo].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "linha-do-tempo-paraopeba.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function LinhaDoTempo() {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [recentePrimeiro, setRecentePrimeiro] = useState(false);

  const visiveis = useMemo(() => {
    const lista = filtro === "todos" ? MARCOS_PARAOPEBA : MARCOS_PARAOPEBA.filter((m) => tipoDeMarco(m.cor) === filtro);
    return recentePrimeiro ? [...lista].reverse() : lista;
  }, [filtro, recentePrimeiro]);

  const totais = useMemo(() => {
    const c: Record<TipoMarco, number> = { favoravel: 0, desfavoravel: 0, neutro: 0 };
    for (const m of MARCOS_PARAOPEBA) c[tipoDeMarco(m.cor)] += 1;
    return c;
  }, []);

  // Gráfico: marcos por ano, empilhados por tipo. SVGs pequenos e acessíveis.
  const porAno = useMemo(() => {
    const mapa = new Map<string, Record<TipoMarco, number>>();
    for (const m of MARCOS_PARAOPEBA) {
      const ano = anoDe(m.data);
      const linha = mapa.get(ano) ?? { favoravel: 0, desfavoravel: 0, neutro: 0 };
      linha[tipoDeMarco(m.cor)] += 1;
      mapa.set(ano, linha);
    }
    return Array.from(mapa.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, []);

  const maxAno = Math.max(...porAno.map(([, linha]) => linha.favoravel + linha.desfavoravel + linha.neutro), 1);
  const LARGURA = 640;
  const ALTURA = 140;
  const PASSO = porAno.length > 1 ? LARGURA / (porAno.length - 1) : LARGURA;
  const TOPO = 16;
  const BARRA_MAX = ALTURA - 32;

  const anoPrimeiro = porAno[0]?.[0] ?? "2019";
  const anoUltimo = porAno[porAno.length - 1]?.[0] ?? "2026";

  return (
    <div className="mt-8 space-y-6">
      {/* Cartões de topo — os agregados que respondem "quanto é isso?" */}
      <section aria-label="Resumo da linha do tempo" className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold">{MARCOS_PARAOPEBA.length}</p>
          <p className="text-sm text-text-soft">marcos do processo</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold">
            {formatarDataMarco(anoPrimeiro)} — {formatarDataMarco(anoUltimo)}
          </p>
          <p className="text-sm text-text-soft">período coberto</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold" style={{ color: COR_TIPO.favoravel }}>
            {totais.favoravel}
          </p>
          <p className="text-sm text-text-soft">{ROTULO_TIPO_MARCO.favoravel}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold" style={{ color: COR_TIPO.desfavoravel }}>
            {totais.desfavoravel}
          </p>
          <p className="text-sm text-text-soft">{ROTULO_TIPO_MARCO.desfavoravel}</p>
        </div>
      </section>

      {/* Gráfico SVG — marcos por ano, com alternativa em texto */}
      <section aria-label="Marcos por ano">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Marcos por ano</h2>
          <p className="text-xs text-text-soft">Barras empilhadas: {ROTULO_TIPO_MARCO.favoravel} · {ROTULO_TIPO_MARCO.desfavoravel} · {ROTULO_TIPO_MARCO.neutro}</p>
        </div>
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          className="mt-2 w-full"
          role="img"
          aria-label={`${MARCOS_PARAOPEBA.length} marcos entre ${anoPrimeiro} e ${anoUltimo}, por ano e por tipo.`}
        >
          {porAno.map(([ano, linha], i) => {
            const x = porAno.length === 1 ? LARGURA / 2 : 16 + i * PASSO;
            const total = linha.favoravel + linha.desfavoravel + linha.neutro;
            const hFav = (linha.favoravel / maxAno) * BARRA_MAX;
            const hDes = (linha.desfavoravel / maxAno) * BARRA_MAX;
            const hNeu = (linha.neutro / maxAno) * BARRA_MAX;
            const yFav = TOPO + BARRA_MAX - hFav;
            const yDes = yFav - hDes;
            const yNeu = yDes - hNeu;
            return (
              <g key={ano}>
                <rect x={x - 14} y={yNeu} width={28} height={hNeu} fill={COR_TIPO.neutro} rx={2} />
                <rect x={x - 14} y={yDes} width={28} height={hDes} fill={COR_TIPO.desfavoravel} rx={2} />
                <rect x={x - 14} y={yFav} width={28} height={hFav} fill={COR_TIPO.favoravel} rx={2} />
                <text x={x} y={TOPO + BARRA_MAX + 12} textAnchor="middle" fontSize="11" className="fill-text-soft">
                  {ano}
                </text>
                <text x={x} y={total === 0 ? TOPO + 8 : yNeu - 4} textAnchor="middle" fontSize="10" className="fill-text-soft">
                  {total}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Alternativa em texto do gráfico — cor nunca é o único canal. */}
        <details className="mt-1 text-sm text-text-soft">
          <summary className="cursor-pointer">Ver os números em texto</summary>
          <ul className="mt-2 space-y-1">
            {porAno.map(([ano, linha]) => (
              <li key={ano}>
                {ano}: {linha.favoravel + linha.desfavoravel + linha.neutro} marcos (
                {linha.favoravel} favoráveis, {linha.desfavoravel} desfavoráveis, {linha.neutro} neutros)
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* Filtro + ordenação + planilha */}
      <section aria-label="Filtros e exportação" className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === "todos" ? "border-current bg-surface text-text" : "border-border text-text-soft hover:text-text"
            }`}
          >
            Todos ({MARCOS_PARAOPEBA.length})
          </button>
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltro(t)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === t ? "border-current bg-surface" : "border-border text-text-soft hover:text-text"
              }`}
              style={filtro === t ? { color: COR_TIPO[t] } : undefined}
            >
              {ROTULO_TIPO_MARCO[t]} ({totais[t]})
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-text-soft">
            <input
              type="checkbox"
              checked={recentePrimeiro}
              onChange={(e) => setRecentePrimeiro(e.target.checked)}
              className="accent-current"
            />
            Mais recente primeiro
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(visiveis)}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-soft transition-colors hover:border-current hover:text-text"
          >
            Baixar CSV do filtrado ({visiveis.length}) ↓
          </button>
        </div>
      </section>

      {/* A lista, com a legenda do tipo ao lado de cada marco */}
      <ol className="flex flex-col gap-0">
        {visiveis.map((m, i) => {
          const tipo = tipoDeMarco(m.cor);
          return (
            <li key={`${m.data}-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
              {i < visiveis.length - 1 && (
                <span aria-hidden="true" className="absolute top-3 left-[7px] h-full w-0.5 bg-border" />
              )}
              <span
                aria-hidden="true"
                className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-surface"
                style={{ backgroundColor: m.cor }}
              />
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-tabular text-xs font-semibold text-text-soft">
                    {formatarDataMarco(m.data)}
                  </p>
                  <p className="text-[.7em] font-semibold uppercase tracking-wide" style={{ color: COR_TIPO[tipo] }}>
                    {ROTULO_TIPO_MARCO[tipo]}
                  </p>
                </div>
                <p className="mt-0.5 font-display text-base font-semibold text-text">{m.titulo}</p>
                <p className="mt-1 text-sm text-text-soft">{m.descricao}</p>
              </div>
            </li>
          );
        })}
        {visiveis.length === 0 && (
          <li className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-soft">
            Nenhum marco neste grupo.
          </li>
        )}
      </ol>
    </div>
  );
}
