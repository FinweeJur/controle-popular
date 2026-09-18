"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Filter, Sparkles } from "lucide-react";

export interface PaginaCatalogo {
  numero: number;
  id: string;
  titulo: string;
  href: string;
  eixo: string;
  badge: string;
  resumo: string;
}

interface Props {
  paginas: PaginaCatalogo[];
}

const EIXOS = [
  "Todos",
  "Eixo 1: Direitos em Movimento",
  "Eixo 2: Terra e Territórios",
  "Eixo 3: Estado e Economia",
  "Central ONSA & Ferramentas",
] as const;

function obterBadgeEstilo(eixo: string) {
  if (eixo.includes("Direitos")) {
    return "bg-alert/10 text-alert border-alert/30";
  }
  if (eixo.includes("Terra")) {
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
  }
  if (eixo.includes("Estado")) {
    return "bg-sky-500/10 text-sky-500 border-sky-500/30";
  }
  return "bg-primary/10 text-primary border-primary/30";
}

export default function Catalogo100PaginasClient({ paginas }: Props) {
  const [busca, setBusca] = useState("");
  const [eixoAtivo, setEixoAtivo] = useState<string>("Todos");

  const paginasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return paginas.filter((p) => {
      const casaEixo =
        eixoAtivo === "Todos" ||
        p.eixo === eixoAtivo ||
        (eixoAtivo.includes("Central") && p.eixo.includes("Central"));
      if (!casaEixo) return false;
      if (!termo) return true;
      return (
        p.titulo.toLowerCase().includes(termo) ||
        p.resumo.toLowerCase().includes(termo) ||
        p.href.toLowerCase().includes(termo) ||
        p.badge.toLowerCase().includes(termo)
      );
    });
  }, [paginas, busca, eixoAtivo]);

  return (
    <section id="catalogo-100-paginas" className="space-y-6 scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            As 100 Principais Páginas do Portal
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Catálogo completo e auditado de rotas com potencial de interesse social, microresumos e fontes oficiais.
          </p>
        </div>
        <div className="text-xs font-mono text-text-soft bg-surface-2 px-3 py-1.5 rounded-lg self-start sm:self-auto border border-border">
          Exibindo <span className="font-bold text-primary">{paginasFiltradas.length}</span> de {paginas.length}
        </div>
      </div>

      {/* Controles: Busca e Filtro de Eixo */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por título, assunto, rota ou município (ex: SUS, Mariana, Betim, Editais)..."
            aria-label="Filtrar catálogo das 100 páginas"
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-soft focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist" aria-label="Filtrar por eixo">
          <span className="flex items-center gap-1 text-xs font-semibold text-text-soft mr-1">
            <Filter className="h-3 w-3" /> Eixos:
          </span>
          {EIXOS.map((e) => {
            const ativo = eixoAtivo === e;
            const rotuloCurto = e.replace("Eixo 1: ", "").replace("Eixo 2: ", "").replace("Eixo 3: ", "");
            return (
              <button
                key={e}
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => setEixoAtivo(e)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  ativo
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border border-border bg-surface-2/60 text-text-soft hover:bg-surface-2 hover:text-text"
                }`}
              >
                {rotuloCurto}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Páginas */}
      {paginasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-soft">
          <p className="text-base font-medium text-text">Nenhuma página encontrada para esta busca.</p>
          <p className="mt-1 text-xs">Tente buscar por termos mais genéricos ou selecionar &quot;Todos&quot; os eixos.</p>
          <button
            type="button"
            onClick={() => { setBusca(""); setEixoAtivo("Todos"); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginasFiltradas.map((p) => {
            const isExternal = p.href.startsWith("http");
            const badgeClasse = obterBadgeEstilo(p.eixo);
            return (
              <article
                key={p.numero}
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-primary/50 hover:bg-surface-2/40 hover:shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-text-soft/70">
                      #{String(p.numero).padStart(2, "0")}
                    </span>
                    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${badgeClasse}`}>
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-text group-hover:text-primary transition-colors">
                    {isExternal ? (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      >
                        <span>{p.titulo}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        href={p.href}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      >
                        {p.titulo}
                      </Link>
                    )}
                  </h3>

                  <p className="text-xs text-text-soft leading-relaxed line-clamp-3">
                    {p.resumo}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <code className="font-mono text-text-soft truncate max-w-[190px]">
                    {p.href.replace("https://github.com/FinweeJur/", "gh:")}
                  </code>
                  {isExternal ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      Acessar <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link href={p.href} className="font-medium text-primary hover:underline flex items-center gap-1">
                      Acessar →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
