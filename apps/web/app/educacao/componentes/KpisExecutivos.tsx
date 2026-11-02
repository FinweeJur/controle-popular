"use client";

/**
 * @file apps/web/app/educacao/componentes/KpisExecutivos.tsx
 * @description Cartões KPI de topo com cross-filtering do Painel PowerBI de Educação.
 *
 * Papel no portal:
 *   Apresenta os grandes números consolidados e auditados do ecossistema educacional
 *   (Educação Básica, Universidades CNPq, Periódicos Abertos, Mobilidade Acadêmica
 *   e Direitos Comparados). Ao clicar em qualquer cartão, o painel filtra imediatamente
 *   para o tópico temático correspondente (cross-filtering).
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho com fonte oficial e motivo.
 *   - Regra 5.14: layout responsivo fluido (390 px para celulares até 4K).
 *   - Regra 5.16: fonte mínima de 12 px (classe text-xs).
 *   - QUALIDADES-DA-INFORMACAO item 4: totais medidos derivados diretamente dos dados.
 */

import React from "react";
import {
  GraduationCap,
  BookOpen,
  Plane,
  Scale,
  Sparkles,
  ArrowRight,
  School
} from "lucide-react";

export type TopicoEducacao =
  | "todos"
  | "basica"
  | "universidades"
  | "periodicos"
  | "intercambio"
  | "comparados";

export interface TotaisEducacaoProps {
  escolasBasica: number;
  matriculasBasica: string;
  idebMedio: number;
  gruposCnpq: number;
  projetosExtensao: number;
  instituicoesEnsino: number;
  periodicosMundiais: number;
  periodicosDiamante: number;
  programasIntercambio: number;
  diretoriasRI: number;
  ufsComparadas: number;
}

interface KpisExecutivosProps {
  topicoAtivo: TopicoEducacao;
  onSelecionarTopico: (topico: TopicoEducacao) => void;
  totais: TotaisEducacaoProps;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function KpisExecutivos({
  topicoAtivo,
  onSelecionarTopico,
  totais,
}: KpisExecutivosProps) {
  const cards = [
    {
      id: "basica" as TopicoEducacao,
      titulo: "Educação Básica & IDEB",
      numeroPrincipal: fmt(totais.escolasBasica),
      rotuloPrincipal: "Escolas no Censo Escolar",
      subtitulo: `${totais.matriculasBasica} matrículas · IDEB ${totais.idebMedio.toFixed(1)}`,
      badge: "INEP / MEC",
      corBadge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icone: School,
      corIcone: "text-blue-600 dark:text-blue-400",
      descricaoAcao: "Ver série do IDEB e cruzamentos municipais",
    },
    {
      id: "universidades" as TopicoEducacao,
      titulo: "Universidades & CNPq",
      numeroPrincipal: fmt(totais.gruposCnpq),
      rotuloPrincipal: "Grupos de pesquisa CNPq",
      subtitulo: `${fmt(totais.projetosExtensao)} extensão · ${totais.instituicoesEnsino} instituições`,
      badge: "DGP / CNPq",
      corBadge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icone: GraduationCap,
      corIcone: "text-purple-600 dark:text-purple-400",
      descricaoAcao: "Buscar grupos, linhas e contatos de líderes",
    },
    {
      id: "periodicos" as TopicoEducacao,
      titulo: "Periódicos Científicos",
      numeroPrincipal: fmt(totais.periodicosMundiais),
      rotuloPrincipal: "Revistas científicas abertas",
      subtitulo: `${fmt(totais.periodicosDiamante)} Diamante (sem taxa APC)`,
      badge: "DOAJ / SciELO",
      corBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icone: BookOpen,
      corIcone: "text-emerald-600 dark:text-emerald-400",
      descricaoAcao: "Consultar fluxo contínuo e chamadas",
    },
    {
      id: "intercambio" as TopicoEducacao,
      titulo: "Mobilidade & Calendário",
      numeroPrincipal: `${totais.programasIntercambio} editais`,
      rotuloPrincipal: "Bolsas internacionais",
      subtitulo: `${totais.diretoriasRI} diretorias DRI · 12 meses`,
      badge: "DRI / Relações Internacionais",
      corBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icone: Plane,
      corIcone: "text-amber-600 dark:text-amber-400",
      descricaoAcao: "Ver calendário anual e prazos de editais",
    },
    {
      id: "comparados" as TopicoEducacao,
      titulo: "Direitos Comparados",
      numeroPrincipal: `${totais.ufsComparadas} estados`,
      rotuloPrincipal: "Matriz comparativa e metas",
      subtitulo: "CF/88, LDB, Fundeb, PNE e UNESCO",
      badge: "Marcos Normativos",
      corBadge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      icone: Scale,
      corIcone: "text-rose-600 dark:text-rose-400",
      descricaoAcao: "Comparar índices e garantias fundamentais",
    },
  ];

  return (
    <section
      aria-label="Indicadores executivos e cartões com filtro rápido"
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Cartões Executivos · Clique para filtrar o painel
          </h2>
        </div>
        {topicoAtivo !== "todos" && (
          <button
            onClick={() => onSelecionarTopico("todos")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver Panorama Geral (remover filtro)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((c) => {
          const Icone = c.icone;
          const ativo = topicoAtivo === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelecionarTopico(ativo ? "todos" : c.id)}
              aria-pressed={ativo}
              className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                ativo
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                  : "border-border bg-surface hover:border-primary/50 hover:bg-surface-hover shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.corBadge}`}
                  >
                    <Icone className="w-3.5 h-3.5" />
                    {c.badge}
                  </span>
                  {ativo && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-muted tracking-tight">
                  {c.titulo}
                </h3>

                <div className="mt-1 text-2xl font-extrabold text-foreground tracking-tight">
                  {c.numeroPrincipal}
                </div>

                <div className="text-xs font-medium text-muted">
                  {c.rotuloPrincipal}
                </div>

                <div className="mt-2 text-xs text-foreground/80 font-medium border-t border-border/60 pt-2">
                  {c.subtitulo}
                </div>
              </div>

              <div className="mt-3 pt-2 flex items-center justify-between text-xs font-semibold text-primary">
                <span>{ativo ? "Filtro ativo" : c.descricaoAcao}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
