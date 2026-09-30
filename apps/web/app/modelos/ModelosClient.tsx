"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Lightbulb } from "lucide-react";
import {
  type CategoriaModelo,
  CATEGORIAS_MODELO,
  listarModelos,
  type ModeloPronto,
} from "@/lib/modelos/textos";

/**
 * Lista interativa dos modelos prontos (`/modelos`).
 *
 * ═══ O QUE É ═══
 *
 * Mostra cada modelo com a base legal, o canal oficial e o texto para copiar
 * ou baixar. O filtro por categoria é client-side: a lista é pequena e vive
 * no bundle, sem rede.
 *
 * ═══ PRIVACIDADE ═══
 *
 * Copiar e baixar acontecem no aparelho de quem usa. O portal não recebe o
 * texto preenchido nem o dado pessoal de quem protocola.
 */

type FiltroCategoria = CategoriaModelo | "todas";

/** Nome de arquivo seguro a partir do id do modelo. */
function nomeArquivo(modelo: ModeloPronto): string {
  return `controle-popular-modelo-${modelo.id}.txt`;
}

export default function ModelosClient() {
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");
  const [copyId, setCopyId] = useState<string | null>(null);

  const modelos = useMemo(() => listarModelos(categoria), [categoria]);

  async function copiar(modelo: ModeloPronto) {
    try {
      await navigator.clipboard.writeText(modelo.corpo);
      setCopyId(modelo.id);
      window.setTimeout(() => setCopyId((atual) => (atual === modelo.id ? null : atual)), 2000);
    } catch {
      setCopyId(null);
    }
  }

  function baixar(modelo: ModeloPronto) {
    const conteudo = "\uFEFF" + modelo.corpo;
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo(modelo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /** Renderiza a referência: link interno vira `<Link>`, externo vira `<a>`. */
  function Referencia({ nome, url }: { nome: string; url: string }) {
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
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro por categoria */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          onClick={() => setCategoria("todas")}
          aria-pressed={categoria === "todas"}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            categoria === "todas"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          Todos os modelos
        </button>
        {CATEGORIAS_MODELO.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoria(c)}
            aria-pressed={categoria === c}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              categoria === c
                ? "bg-primary text-white shadow-xs"
                : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-6">
        {modelos.map((modelo) => (
          <li
            key={modelo.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-xs"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {modelo.categoria}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                  {modelo.titulo}
                </h2>
                <p className="mt-1 text-sm text-muted leading-relaxed">{modelo.descricao}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => copiar(modelo)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {copyId === modelo.id ? (
                    <>
                      <Check size={14} aria-hidden="true" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" /> Copiar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => baixar(modelo)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
                >
                  <Download size={14} aria-hidden="true" /> Baixar
                </button>
              </div>
            </div>

            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/60 p-4 text-sm leading-relaxed text-foreground">
              {modelo.corpo}
            </pre>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
              <Lightbulb size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="leading-relaxed">
                <span className="font-semibold text-foreground">Dica: </span>
                {modelo.dica}
              </p>
            </div>

            <dl className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-foreground">Base legal</dt>
                <dd className="mt-0.5">
                  <Referencia {...modelo.fonte} />
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Onde protocolar</dt>
                <dd className="mt-0.5">
                  <Referencia {...modelo.canal} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted leading-relaxed">
        Os modelos são um ponto de partida, não um parecer jurídico. O portal
        não envia nada: você copia, preenche e protocola no canal oficial.
      </p>
    </div>
  );
}
