"use client";

/**
 * Componente cliente para visualização do Ranking de Atuação dos Deputados Estaduais.
 *
 * Papel no portal:
 * Apresenta a produtividade parlamentar com métricas objetivas (proposições,
 * participação em comissões temáticas e assiduidade plenária), seguindo a
 * consagrada metodologia cívica da Câmara de Betim (AGENTS.md § 7 e § 8).
 *
 * Fontes oficiais:
 * - Registros públicos de votações, presenças e matérias protocoladas em cada
 *   Assembleia Legislativa Estadual.
 *
 * Princípios editoriais:
 * - O número vem estritamente do dado público oficial.
 * - Pontuação aberta e auditável (sem adjetivações nem insinuações morais).
 */

import { useState } from "react";
import { Award, CheckCircle2, FileText, Users, HelpCircle } from "lucide-react";
import type { DeputadoEstadual } from "@/lib/assembleias/types";

interface RankingDeputadosProps {
  deputados: DeputadoEstadual[];
  siglaAssembleia: string;
}

export default function RankingDeputados({
  deputados,
  siglaAssembleia,
}: RankingDeputadosProps) {
  const [mostrarMetodologia, setMostrarMetodologia] = useState(false);

  // Ordena por pontuação cívica decrescente
  const ordenados = [...deputados].sort((a, b) => b.pontuacaoCivica - a.pontuacaoCivica);
  const maxProposicoes = Math.max(...deputados.map((d) => d.totalProposicoes), 1);

  return (
    <div className="space-y-6">
      {/* ═══ CABEÇALHO DO RANKING COM BOTÃO DE METODOLOGIA ═══ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Ranking de Atuação Cívica — {siglaAssembleia}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Índice técnico baseado em proposições de interesse público, assiduidade e atuação em comissões.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarMetodologia(!mostrarMetodologia)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-foreground"
        >
          <HelpCircle size={14} aria-hidden="true" />
          <span>{mostrarMetodologia ? "Ocultar Metodologia" : "Como Funciona o Cálculo"}</span>
        </button>
      </div>

      {/* ═══ BOX DE METODOLOGIA ABERTA (CONFORMIDADE AGENTS.MD § 7) ═══ */}
      {mostrarMetodologia && (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-xs leading-relaxed text-foreground">
          <h4 className="font-display text-sm font-bold text-primary mb-2">
            Metodologia Transparente do Índice Cívico (Padrão Betim)
          </h4>
          <p className="text-muted mb-2">
            A pontuação de 0 a 100 reflete critérios estritamente objetivos extraídos dos registros oficiais da Casa:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted">
            <li>
              <strong>Volume e Qualidade Propositiva (40%):</strong> Projetos de lei, requerimentos fiscalizatórios e indicações protocoladas no ano legislativo.
            </li>
            <li>
              <strong>Assiduidade em Plenário (35%):</strong> Presença confirmada em chamadas das sessões ordinárias e extraordinárias.
            </li>
            <li>
              <strong>Participação em Comissões (25%):</strong> Atuação ativa como presidente, vice ou membro titular em comissões permanentes e CPIs.
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted italic">
            * Ressalva editorial: O índice é instrumento de fiscalização cidadã, não constitui juízo de valor pessoal sobre qualquer parlamentar.
          </p>
        </div>
      )}

      {/* ═══ LISTA DE DEPUTADOS RANQUEADOS COM GRÁFICO NATIVO ═══ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordenados.map((dep, index) => {
          const posicao = index + 1;
          const pctBarra = Math.round((dep.totalProposicoes / maxProposicoes) * 100);

          return (
            <div
              key={dep.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs transition hover:border-border/80 hover:bg-surface-2/40"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      posicao === 1
                        ? "bg-amber-500 text-black font-extrabold shadow-sm"
                        : posicao === 2
                        ? "bg-slate-300 text-black font-bold"
                        : posicao === 3
                        ? "bg-amber-700/60 text-white font-bold"
                        : "bg-surface-2 text-muted border border-border"
                    }`}
                  >
                    {posicao}º
                  </span>
                  <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {dep.partido}
                  </span>
                </div>

                <h4 className="font-display text-base font-bold text-foreground">
                  {dep.nome}
                </h4>

                <div className="mt-3 space-y-2 text-xs">
                  {/* Pontuação de atuação */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Pontuação Cívica:</span>
                    <strong className="font-mono text-sm text-primary font-bold">
                      {dep.pontuacaoCivica}/100
                    </strong>
                  </div>

                  {/* Proposições protocoladas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} aria-hidden="true" />
                        <span>Proposições:</span>
                      </span>
                      <strong className="text-foreground">{dep.totalProposicoes}</strong>
                    </div>
                    {/* Barra de progresso nativa */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pctBarra}%` }}
                      />
                    </div>
                  </div>

                  {/* Assiduidade */}
                  <div className="flex items-center justify-between text-muted pt-1">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" aria-hidden="true" />
                      <span>Presença Plenária:</span>
                    </span>
                    <strong className="text-foreground">{dep.assiduidadePct}%</strong>
                  </div>
                </div>
              </div>

              {/* Comissões integradas */}
              {dep.comissoesIntegradas.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/40">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
                    Comissões:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {dep.comissoesIntegradas.map((sigla) => (
                      <span
                        key={sigla}
                        className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-foreground border border-border"
                      >
                        {sigla}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
