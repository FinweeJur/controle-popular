"use client";

/**
 * Componente cliente para o Hub Nacional das Assembleias Legislativas.
 *
 * Papel no portal:
 * Permite navegação interativa, busca instantânea e filtragem por macrorregião
 * das 27 Casas Legislativas estaduais brasileiras (1.059 deputados estaduais).
 *
 * Fontes oficiais:
 * - Portais oficiais de transparência e dados abertos das 27 Assembleias Legislativas.
 * - Constituição Federal de 1988 (Artigo 27: definição do número de deputados estaduais).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Building2,
  Users,
  Coins,
  Video,
  ExternalLink,
  ChevronRight,
  Landmark,
} from "lucide-react";
import type { AssembleiaEstadual, MetricasNacionais, RegiaoBrasil } from "@/lib/assembleias/types";

interface HubAssembleiasClientProps {
  assembleias: AssembleiaEstadual[];
  metricas: MetricasNacionais;
}

const REGIOES: Array<"Todas" | RegiaoBrasil> = [
  "Todas",
  "Sudeste",
  "Sul",
  "Nordeste",
  "Centro-Oeste",
  "Norte",
];

export default function HubAssembleiasClient({
  assembleias,
  metricas,
}: HubAssembleiasClientProps) {
  const [busca, setBusca] = useState("");
  const [regiaoFiltro, setRegiaoFiltro] = useState<"Todas" | RegiaoBrasil>("Todas");

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return assembleias.filter((a) => {
      const matchBusca =
        !termo ||
        a.sigla.toLowerCase().includes(termo) ||
        a.estado.toLowerCase().includes(termo) ||
        a.capital.toLowerCase().includes(termo) ||
        a.uf.toLowerCase().includes(termo) ||
        a.mesaDiretora.presidente.nome.toLowerCase().includes(termo) ||
        a.mesaDiretora.presidente.partido.toLowerCase().includes(termo);

      const matchRegiao = regiaoFiltro === "Todas" || a.regiao === regiaoFiltro;

      return matchBusca && matchRegiao;
    });
  }, [assembleias, busca, regiaoFiltro]);

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO NACIONAIS ═══ */}
      <section
        aria-label="Indicadores nacionais consolidados"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Casas Legislativas
          </span>
          <span className="mt-1 block font-display text-2xl sm:text-3xl font-bold text-foreground">
            {metricas.totalAssembleias} UFs
          </span>
          <span className="mt-1 block text-xs text-muted">
            26 Estados + Distrito Federal
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Deputados em Exercício
          </span>
          <span className="mt-1 block font-display text-2xl sm:text-3xl font-bold text-primary">
            {metricas.totalDeputados}
          </span>
          <span className="mt-1 block text-xs text-muted">
            Cadeiras estaduais (Art. 27 CF)
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Comissões Mapeadas
          </span>
          <span className="mt-1 block font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {metricas.totalComissoes}+
          </span>
          <span className="mt-1 block text-xs text-muted">
            Permanentes, especiais e CPIs
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Transparência & Processos
          </span>
          <span className="mt-1 block font-display text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            100%
          </span>
          <span className="mt-1 block text-xs text-muted">
            Sistemas e diários auditados
          </span>
        </div>
      </section>

      {/* ═══ 2. BARRA DE BUSCA E FILTRO POR MACRORREGIÃO ═══ */}
      <section
        aria-label="Controles de busca e filtro"
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs"
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar Assembleia por estado, sigla, capital, presidente ou partido (ex: ALESP, MG, Ceará, Lira)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Abas de Região (com rolagem suave sem quebra) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="font-bold uppercase tracking-wider text-muted shrink-0 text-[10px] mr-1">
            Região:
          </span>
          {REGIOES.map((reg) => {
            const ativo = regiaoFiltro === reg;
            return (
              <button
                key={reg}
                type="button"
                onClick={() => setRegiaoFiltro(reg)}
                className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold transition ${
                  ativo
                    ? "bg-primary text-primary-ink shadow-xs"
                    : "border border-border bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {reg}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ 3. GRADE DE ASSEMBLEIAS LEGISLATIVAS ESTADUAIS ═══ */}
      <section aria-label="Lista de Assembleias Legislativas Estaduais">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            Assembleias Legislativas Catalogadas ({filtradas.length})
          </h2>
          <span className="text-xs text-muted">
            Clique na Assembleia para abrir os dados completos
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((a) => (
            <div
              key={a.uf}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/50 hover:bg-surface-2/40"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {a.sigla}
                  </span>
                  <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {a.regiao} • {a.uf}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {a.estado}
                </h3>
                <p className="text-xs text-muted">
                  Capital: <strong>{a.capital}</strong>
                </p>

                {/* Métricas rápidas */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Deputados:</span>
                    <span className="font-display text-base font-bold text-foreground">
                      {a.totalDeputados} cadeiras
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted block">Orçamento:</span>
                    <span className="font-display text-base font-bold text-foreground">
                      R$ {a.orcamentoAnual.valorMilhoes.toLocaleString("pt-BR")} mi
                    </span>
                  </div>
                </div>

                {/* Presidência atual */}
                <div className="mt-3 rounded-xl bg-surface-2 p-2.5 text-xs">
                  <span className="text-[10px] text-muted block">Presidência da Casa:</span>
                  <span className="font-semibold text-foreground">
                    {a.mesaDiretora.presidente.nome}{" "}
                    <span className="text-[10px] text-muted">
                      ({a.mesaDiretora.presidente.partido})
                    </span>
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-5 space-y-2 pt-3 border-t border-border/40">
                <Link
                  href={`/assembleias/${a.uf.toLowerCase()}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-ink shadow-xs transition hover:opacity-90"
                >
                  <span>Ver Assembleia Completa</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>

                <div className="flex gap-2">
                  <a
                    href={a.contatos.processoLegislativo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:text-foreground transition"
                    title="Processo Legislativo oficial"
                  >
                    <span>Processo</span>
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>

                  <a
                    href={a.transmissao.tvAssembleia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:text-foreground transition"
                    title="Transmissão ao vivo / TV Assembleia"
                  >
                    <Video size={11} aria-hidden="true" />
                    <span>TV Assembleia</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
