"use client";

/**
 * @file apps/web/app/educacao/componentes/SlicersBar.tsx
 * @description Barra de Slicers e Facetas multidimensionais estilo PowerBI cívico.
 *
 * Papel no portal:
 *   Permite ao cidadão e pesquisador alternar entre tópicos educacionais e filtrar
 *   simultaneamente por Nível de Ensino, Território Geográfico e Gratuidade/Financiamento,
 *   além de disparar a exportação de dados em CSV estruturado com BOM UTF-8 (\uFEFF) e ';'.
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade para celulares de 390 px sem transbordamento.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs = 12px).
 */

import React from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  Download,
  School,
  GraduationCap,
  BookOpen,
  Plane,
  Scale,
  LayoutGrid,
  Globe2,
  BadgeCheck,
  Filter
} from "lucide-react";
import type { TopicoEducacao } from "./KpisExecutivos";

export type NivelEnsino =
  | "todos"
  | "basica"
  | "superior"
  | "pesquisa"
  | "internacional";

export type TerritorioEducacao =
  | "todos"
  | "brasil"
  | "lusofonos"
  | "latam"
  | "global";

export type GratuidadeFiltro =
  | "todos"
  | "gratuito"
  | "bolsas";

interface SlicersBarProps {
  topicoAtivo: TopicoEducacao;
  onSelecionarTopico: (topico: TopicoEducacao) => void;
  nivelEnsino: NivelEnsino;
  onSelecionarNivel: (nivel: NivelEnsino) => void;
  territorio: TerritorioEducacao;
  onSelecionarTerritorio: (territorio: TerritorioEducacao) => void;
  gratuidade: GratuidadeFiltro;
  onSelecionarGratuidade: (gratuidade: GratuidadeFiltro) => void;
  onLimparFiltros: () => void;
  onExportarCSV: () => void;
  totalFiltradoTexto?: string;
}

export default function SlicersBar({
  topicoAtivo,
  onSelecionarTopico,
  nivelEnsino,
  onSelecionarNivel,
  territorio,
  onSelecionarTerritorio,
  gratuidade,
  onSelecionarGratuidade,
  onLimparFiltros,
  onExportarCSV,
  totalFiltradoTexto,
}: SlicersBarProps) {
  const temFiltroCustomizado =
    topicoAtivo !== "todos" ||
    nivelEnsino !== "todos" ||
    territorio !== "todos" ||
    gratuidade !== "todos";

  const topicos = [
    { id: "todos" as TopicoEducacao, label: "Panorama Geral", icone: LayoutGrid },
    { id: "basica" as TopicoEducacao, label: "Educação Básica & IDEB", icone: School },
    { id: "universidades" as TopicoEducacao, label: "Universidades & CNPq", icone: GraduationCap },
    { id: "periodicos" as TopicoEducacao, label: "Periódicos Abertos", icone: BookOpen },
    { id: "intercambio" as TopicoEducacao, label: "Mobilidade & Calendário", icone: Plane },
    { id: "comparados" as TopicoEducacao, label: "Direitos Comparados", icone: Scale },
  ];

  return (
    <section
      aria-label="Controles e Slicers do Painel PowerBI"
      className="mt-8 rounded-3xl border border-border bg-surface p-4 sm:p-6 shadow-xs"
    >
      {/* Abas Superiores de Tópicos (Estilo PowerBI Ribbon) */}
      <div className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Painel Interativo · Selecione o Tópico de Análise
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {temFiltroCustomizado && (
              <button
                type="button"
                onClick={onLimparFiltros}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 text-xs font-semibold text-muted hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Slicers
              </button>
            )}

            <button
              type="button"
              onClick={onExportarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              title="Baixar planilha CSV com delimitador ';' e BOM UTF-8"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Abas com scroll horizontal em telas pequenas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {topicos.map((t) => {
            const Icone = t.icone;
            const ativo = topicoAtivo === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelecionarTopico(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  ativo
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-surface-2 text-muted hover:text-foreground hover:bg-surface-hover border border-border"
                }`}
              >
                <Icone className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slicers Multidimensionais (PowerBI Slicers) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Slicer 1: Nível de Ensino */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-primary" />
            Nível Educacional
          </label>
          <select
            value={nivelEnsino}
            onChange={(e) => onSelecionarNivel(e.target.value as NivelEnsino)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Níveis (Básica ao Superior)</option>
            <option value="basica">Educação Básica (Infantil, Fund., Médio)</option>
            <option value="superior">Ensino Superior (Graduação & Pós)</option>
            <option value="pesquisa">Pesquisa Científica & Extensão</option>
            <option value="internacional">Mobilidade Internacional</option>
          </select>
        </div>

        {/* Slicer 2: Território */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            Âmbito Geográfico
          </label>
          <select
            value={territorio}
            onChange={(e) => onSelecionarTerritorio(e.target.value as TerritorioEducacao)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Âmbitos</option>
            <option value="brasil">Brasil (Nacional, Estados & Municípios)</option>
            <option value="lusofonos">Países Lusófonos (CPLP)</option>
            <option value="latam">América Latina</option>
            <option value="global">Global (141 Países Cobertos)</option>
          </select>
        </div>

        {/* Slicer 3: Financiamento / Gratuidade */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-primary" />
            Gratuidade / Financiamento
          </label>
          <select
            value={gratuidade}
            onChange={(e) => onSelecionarGratuidade(e.target.value as GratuidadeFiltro)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Formatos</option>
            <option value="gratuito">100% Gratuito (Sem APC / Público)</option>
            <option value="bolsas">Bolsas Integrais & Isenções de Taxa</option>
          </select>
        </div>
      </div>

      {/* Faixa de Contexto do Recorte Atual */}
      {totalFiltradoTexto && (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>{totalFiltradoTexto}</span>
          </div>
          <span className="text-xs text-muted">Sincronizado na URL com ?topico=...</span>
        </div>
      )}
    </section>
  );
}
