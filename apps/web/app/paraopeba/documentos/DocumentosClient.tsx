"use client";

import { useMemo, useState } from "react";
import { DOCUMENTOS_PROCESSO, type DocumentoProcesso } from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * Filtro por município no cliente — mesmo padrão de `ClippingClient.tsx`:
 * estado local, dado já carregado por inteiro (471 itens), sem
 * `useSearchParams()`/`<Suspense>` porque não precisa de link
 * compartilhável nem de leitura de query no servidor.
 */
export default function DocumentosClient() {
  const [municipio, setMunicipio] = useState<string>("todos");

  const municipiosComContagem = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const d of DOCUMENTOS_PROCESSO) {
      for (const m of d.municipios) {
        contagem.set(m.nome, (contagem.get(m.nome) ?? 0) + 1);
      }
    }
    return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  }, []);

  const lista = useMemo(() => {
    const base =
      municipio === "todos"
        ? DOCUMENTOS_PROCESSO
        : DOCUMENTOS_PROCESSO.filter((d) => d.municipios.some((m) => m.nome === municipio));
    return [...base].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  }, [municipio]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">
          {formatNumberBR(lista.length)} de {formatNumberBR(DOCUMENTOS_PROCESSO.length)} documentos
        </h2>
        <div className="flex flex-col">
          <label htmlFor="municipio" className="mb-1 text-xs font-medium text-text-soft">
            Município citado
          </label>
          <select
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="todos">Todos ({municipiosComContagem.length} municípios)</option>
            {municipiosComContagem.map(([nome, n]) => (
              <option key={nome} value={nome}>
                {nome} ({n})
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.map((d) => (
          <ItemDocumento key={d.id} doc={d} />
        ))}
      </ul>

      {lista.length === 0 && (
        <p className="mt-6 text-sm text-text-soft">Nenhum documento com esse filtro.</p>
      )}
    </section>
  );
}

function ItemDocumento({ doc }: { doc: DocumentoProcesso }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{doc.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {doc.tipo}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(doc.data)} · processo {doc.processo} · cita{" "}
        {doc.municipios.map((m) => m.nome).join(", ")}
      </p>

      {doc.citacao ? (
        <p className="mt-2 text-sm text-text-soft">&ldquo;{doc.citacao}&rdquo;</p>
      ) : (
        <p className="mt-2 text-sm text-text-soft italic">
          Resumo não publicado — a triagem de dado pessoal deste portal identificou risco no
          texto original. Metadado e link seguem abaixo; o conteúdo pode ser conferido na fonte.
        </p>
      )}

      <a
        href={doc.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver o documento na Plataforma Brumadinho UFMG ↗
      </a>
    </li>
  );
}
