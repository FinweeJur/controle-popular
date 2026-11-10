"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  COR_TIPO_RIO_DOCE,
  MARCOS_RIO_DOCE,
  PERIODOS_RIO_DOCE,
  ROTULO_TIPO_RIO_DOCE,
  anoDoMarco,
  anosDaTimeline,
  contarPorPeriodo,
  formatarDataMarco,
  intervaloDeAnos,
  periodoDoMarco,
  type MarcoRioDoce,
  type PeriodoMarcoRioDoce,
  type TipoMarcoRioDoce,
} from "@/lib/riodoce/linha-do-tempo";

/**
 * A linha do tempo do Rio Doce, com filtro por período (2015–2019,
 * 2020–2023, 2024–2026), por ano e por tipo de marco.
 *
 * ═══ POR QUE CLIENTE, E POR QUE SEM `useSearchParams` ═══
 *
 * O alvo estático do portal (`output: "export"`) não tem servidor para ler
 * `searchParams`; a página precisa continuar pré-renderizada. Por isso a URL
 * é a fonte única do filtro, lida por `useSyncExternalStore`:
 * `?periodo=2024-2026&tipo=indenizacao&ano=2025` fica compartilhável, e o
 * voltar/avançar do navegador (evento `popstate`) restaura o estado.
 * `history.replaceState` não dispara evento, então cada clique avisa o store
 * com um evento próprio.
 *
 * A coleção tem 14 marcos — pequena o bastante para ir embutida no bundle
 * (a regra de "coleção nunca como prop de cliente" vale para listas grandes).
 */

type FiltroPeriodo = "todos" | PeriodoMarcoRioDoce;
type FiltroTipo = "todos" | TipoMarcoRioDoce;
type FiltroAno = "todos" | string;

interface Filtros {
  periodo: FiltroPeriodo;
  tipo: FiltroTipo;
  ano: FiltroAno;
}

const EVENTO_FILTROS = "riodoce:filtros";

const TIPOS: TipoMarcoRioDoce[] = [
  "rompimento",
  "acordo",
  "decisao",
  "norma",
  "indenizacao",
  "audiencia",
];

function ehPeriodoValido(valor: string | null): valor is PeriodoMarcoRioDoce {
  return PERIODOS_RIO_DOCE.some((p) => p.id === valor);
}

function ehTipoValido(valor: string | null): valor is TipoMarcoRioDoce {
  return valor !== null && (TIPOS as string[]).includes(valor);
}

/** Traduz a query string nos três filtros. Valor desconhecido cai em "todos". */
function filtrosDaBusca(busca: string): Filtros {
  const params = new URLSearchParams(busca);
  const periodo = params.get("periodo");
  const tipo = params.get("tipo");
  const ano = params.get("ano");
  return {
    periodo: ehPeriodoValido(periodo) ? periodo : "todos",
    tipo: ehTipoValido(tipo) ? tipo : "todos",
    ano: ano && anosDaTimeline().includes(ano) ? ano : "todos",
  };
}

/**
 * A URL é a fonte única do filtro. `useSyncExternalStore` lê a query string
 * sem `setState` dentro de efeito (regra do ESLint) e sem quebrar a
 * pré-renderização: no servidor o snapshot é vazio; no cliente, o React
 * compara os dois e re-renderiza uma vez se o link já vinha com filtro.
 */
function assinarUrl(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  window.addEventListener(EVENTO_FILTROS, avisar);
  return () => {
    window.removeEventListener("popstate", avisar);
    window.removeEventListener(EVENTO_FILTROS, avisar);
  };
}

function lerBusca() {
  return window.location.search;
}

function buscaDoServidor() {
  return "";
}

function aplicarFiltros(proximo: Filtros) {
  const params = new URLSearchParams();
  if (proximo.periodo !== "todos") params.set("periodo", proximo.periodo);
  if (proximo.tipo !== "todos") params.set("tipo", proximo.tipo);
  if (proximo.ano !== "todos") params.set("ano", proximo.ano);
  const query = params.toString();
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
  // `replaceState` não dispara evento: avisamos o store na mão.
  window.dispatchEvent(new Event(EVENTO_FILTROS));
}

function baixarCsv(linhas: MarcoRioDoce[]) {
  const cabecalho = ["data", "titulo", "descricao", "tipo", "periodo", "fontes"];
  const corpo = linhas.map((m) =>
    [
      m.data,
      m.titulo,
      m.descricao,
      ROTULO_TIPO_RIO_DOCE[m.tipo],
      periodoDoMarco(m.data),
      m.fontes.map((f) => `${f.rotulo}: ${f.url}`).join(" | "),
    ]
      .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
      .join(";")
  );
  // BOM UTF-8 + separador `;` — abre direto no Excel brasileiro.
  const csv = "\uFEFF" + [cabecalho.join(";"), ...corpo].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "linha-do-tempo-rio-doce.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function contarPorTipo(): Record<TipoMarcoRioDoce, number> {
  const contagem = {} as Record<TipoMarcoRioDoce, number>;
  for (const tipo of TIPOS) contagem[tipo] = 0;
  for (const marco of MARCOS_RIO_DOCE) contagem[marco.tipo] += 1;
  return contagem;
}

export default function LinhaDoTempo() {
  const busca = useSyncExternalStore(assinarUrl, lerBusca, buscaDoServidor);
  const { periodo, tipo, ano } = filtrosDaBusca(busca);

  function aplicarPeriodo(proximo: FiltroPeriodo) {
    aplicarFiltros({ periodo: proximo, tipo, ano });
  }

  function aplicarTipo(proximo: FiltroTipo) {
    aplicarFiltros({ periodo, tipo: proximo, ano });
  }

  function aplicarAno(proximo: FiltroAno) {
    aplicarFiltros({ periodo, tipo, ano: proximo });
  }

  function limparFiltros() {
    aplicarFiltros({ periodo: "todos", tipo: "todos", ano: "todos" });
  }

  const visiveis = useMemo(
    () =>
      MARCOS_RIO_DOCE.filter(
        (m) =>
          (periodo === "todos" || periodoDoMarco(m.data) === periodo) &&
          (tipo === "todos" || m.tipo === tipo) &&
          (ano === "todos" || anoDoMarco(m.data) === ano)
      ),
    [periodo, tipo, ano]
  );

  const porPeriodo = useMemo(() => contarPorPeriodo(), []);
  const porTipo = useMemo(() => contarPorTipo(), []);
  const anos = useMemo(() => anosDaTimeline(), []);
  const intervalo = useMemo(() => intervaloDeAnos(), []);
  const filtrando = periodo !== "todos" || tipo !== "todos" || ano !== "todos";

  return (
    <div className="mt-8 space-y-8">
      {/* Cartões de topo: os agregados que respondem "quanto é isso?". */}
      <section aria-label="Resumo da linha do tempo" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold">{MARCOS_RIO_DOCE.length}</p>
          <p className="text-sm text-text-soft">marcos</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-tabular text-2xl font-bold">
            {intervalo.primeiro}—{intervalo.ultimo}
          </p>
          <p className="text-sm text-text-soft">período coberto</p>
        </div>
        {PERIODOS_RIO_DOCE.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-tabular text-2xl font-bold">{porPeriodo[p.id]}</p>
            <p className="text-sm text-text-soft">{p.rotulo}</p>
          </div>
        ))}
      </section>

      {/* Filtros: período, tipo e ano. Cada botão atualiza a URL. */}
      <section aria-labelledby="filtros" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="filtros" className="font-display text-lg font-semibold">
            Filtrar os marcos
          </h2>
          <p className="text-sm text-text-soft" aria-live="polite">
            {visiveis.length} de {MARCOS_RIO_DOCE.length} marcos
          </p>
        </div>

        <div role="group" aria-label="Filtrar por período" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarPeriodo("todos")}
            aria-pressed={periodo === "todos"}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              periodo === "todos"
                ? "border-current bg-surface text-text"
                : "border-border text-text-soft hover:text-text"
            }`}
          >
            Todos os períodos
          </button>
          {PERIODOS_RIO_DOCE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarPeriodo(p.id)}
              aria-pressed={periodo === p.id}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                periodo === p.id
                  ? "border-current bg-surface text-text"
                  : "border-border text-text-soft hover:text-text"
              }`}
            >
              {p.rotulo} ({porPeriodo[p.id]})
            </button>
          ))}
        </div>

        <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarTipo("todos")}
            aria-pressed={tipo === "todos"}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              tipo === "todos"
                ? "border-current bg-surface text-text"
                : "border-border text-text-soft hover:text-text"
            }`}
          >
            Todos os tipos
          </button>
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => aplicarTipo(t)}
              aria-pressed={tipo === t}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                tipo === t
                  ? "border-current bg-surface"
                  : "border-border text-text-soft hover:text-text"
              }`}
              style={tipo === t ? { color: COR_TIPO_RIO_DOCE[t] } : undefined}
            >
              {ROTULO_TIPO_RIO_DOCE[t]} ({porTipo[t]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filtro-ano" className="text-sm text-text-soft">
            Ano
          </label>
          <select
            id="filtro-ano"
            value={ano}
            onChange={(e) => aplicarAno(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
          >
            <option value="todos">Todos os anos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {filtrando && (
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-soft transition-colors hover:border-current hover:text-text"
            >
              Limpar filtros
            </button>
          )}

          <button
            type="button"
            onClick={() => baixarCsv(visiveis)}
            className="ml-auto rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-soft transition-colors hover:border-current hover:text-text"
          >
            Baixar CSV do filtrado ({visiveis.length}) ↓
          </button>
        </div>
      </section>

      {/* Linha vertical: conector desenhado por item, ponto colorido pelo tipo. */}
      <section aria-labelledby="marcos">
        <h2 id="marcos" className="sr-only">
          Marcos em ordem
        </h2>
        <ol className="flex flex-col">
          {visiveis.map((m, i) => (
            <li key={`${m.data}-${m.titulo}`} className="relative flex gap-4 pb-6 last:pb-0">
              {i < visiveis.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-3 left-[7px] h-full w-0.5 bg-border"
                />
              )}
              <span
                aria-hidden="true"
                className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-surface"
                style={{ backgroundColor: COR_TIPO_RIO_DOCE[m.tipo] }}
              />
              <article className="flex-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time
                    dateTime={m.data}
                    className="font-tabular text-xs font-semibold text-text-soft"
                  >
                    {formatarDataMarco(m.data)}
                  </time>
                  <span
                    className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{
                      borderColor: COR_TIPO_RIO_DOCE[m.tipo],
                      color: COR_TIPO_RIO_DOCE[m.tipo],
                    }}
                  >
                    {ROTULO_TIPO_RIO_DOCE[m.tipo]}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-base font-semibold text-text">
                  {m.titulo}
                </h3>
                <p className="mt-1 text-sm text-text-soft">{m.descricao}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.fontes.map((fonte) => (
                    <a
                      key={fonte.url}
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Abrir ${fonte.rotulo} em nova aba`}
                      className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-text-soft transition-colors hover:border-current hover:text-text"
                    >
                      {fonte.rotulo} ↗
                    </a>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>

        {visiveis.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-soft">
            <p>Nenhum marco com esses filtros.</p>
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-current hover:text-text"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
