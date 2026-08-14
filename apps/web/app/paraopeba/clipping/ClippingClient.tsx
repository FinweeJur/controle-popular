"use client";

import { useMemo, useState } from "react";
import {
  CLIPPING_PARAOPEBA,
  TIPO_NOTICIA_LABEL,
  type NoticiaClipping,
  type TipoNoticia,
} from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

const TODOS_OS_TIPOS = Object.keys(TIPO_NOTICIA_LABEL) as TipoNoticia[];

/**
 * Filtro por tipo + período no cliente — sem `useSearchParams()`: é estado
 * local, não precisa de link compartilhável, e evita o `<Suspense>` que
 * `ListaProjetos.tsx` (`/[municipio]/meio-ambiente/paraopeba`) precisa por
 * ler a query. Dado já carregado por inteiro (149 itens, ~poucos KB) —
 * filtrar em memória é suficiente, não justifica paginação no servidor.
 */
export default function ClippingClient() {
  const [tiposAtivos, setTiposAtivos] = useState<Set<TipoNoticia>>(new Set(TODOS_OS_TIPOS));
  const [ano, setAno] = useState<string>("todos");

  const anosDisponiveis = useMemo(
    () =>
      [...new Set(CLIPPING_PARAOPEBA.map((n) => n.data.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a)
      ),
    []
  );

  const lista = useMemo(() => {
    return CLIPPING_PARAOPEBA.filter(
      (n) => tiposAtivos.has(n.tipo) && (ano === "todos" || n.data.startsWith(ano))
    ).sort((a, b) => b.data.localeCompare(a.data));
  }, [tiposAtivos, ano]);

  function alternarTipo(tipo: TipoNoticia) {
    setTiposAtivos((atual) => {
      const novo = new Set(atual);
      if (novo.has(tipo)) novo.delete(tipo);
      else novo.add(tipo);
      return novo;
    });
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">
          {formatNumberBR(lista.length)} de {formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <select
              id="ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="todos">Todos</option>
              {anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TODOS_OS_TIPOS.map((tipo) => {
          const ativo = tiposAtivos.has(tipo);
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => alternarTipo(tipo)}
              aria-pressed={ativo}
              className={`cp-btn-anim rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-border bg-surface text-text-soft"
              }`}
            >
              {TIPO_NOTICIA_LABEL[tipo]}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.map((n) => (
          <ItemNoticia key={n.id} noticia={n} />
        ))}
      </ul>

      {lista.length === 0 && (
        <p className="mt-6 text-sm text-text-soft">
          Nenhuma notícia com esse filtro. Tente outro tipo ou ano.
        </p>
      )}
    </section>
  );
}

function ItemNoticia({ noticia }: { noticia: NoticiaClipping }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{noticia.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {TIPO_NOTICIA_LABEL[noticia.tipo]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(noticia.data)} · {noticia.portal}
      </p>
      <p className="mt-2 text-sm text-text-soft">{noticia.resumo}</p>
      {noticia.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {noticia.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft">
              {t}
            </span>
          ))}
        </div>
      )}
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver a notícia na fonte original ↗
      </a>
    </li>
  );
}
