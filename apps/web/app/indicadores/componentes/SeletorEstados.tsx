"use client";

/**
 * @file apps/web/app/indicadores/componentes/SeletorEstados.tsx
 * @description Seletor multi-estado para análise comparativa de indicadores cívicos.
 *
 * Regras:
 *   - Regra 5.14: responsivo para celular (390 px) sem quebra lateral.
 *   - Regra 5.16: tipografia mínima de 12 px (text-xs).
 */

import React, { useState } from "react";
import { Filter, Check, X, RotateCcw } from "lucide-react";
import {
  ESTADOS_INDICADORES,
  RegiaoBrasil,
} from "@/lib/indicadores/dados-nacionais";

interface SeletorEstadosProps {
  selecionados: string[];
  onChange: (novos: string[]) => void;
  maximo?: number;
}

const REGIOES: { id: RegiaoBrasil | "Todas"; rotulo: string }[] = [
  { id: "Todas", rotulo: "Todas as Regiões" },
  { id: "Sudeste", rotulo: "Sudeste" },
  { id: "Sul", rotulo: "Sul" },
  { id: "Nordeste", rotulo: "Nordeste" },
  { id: "Norte", rotulo: "Norte" },
  { id: "Centro-Oeste", rotulo: "Centro-Oeste" },
];

export default function SeletorEstados({
  selecionados,
  onChange,
  maximo = 5,
}: SeletorEstadosProps) {
  const [filtroRegiao, setFiltroRegiao] = useState<RegiaoBrasil | "Todas">("Todas");

  const toggleEstado = (uf: string) => {
    if (selecionados.includes(uf)) {
      if (selecionados.length > 1) {
        onChange(selecionados.filter((item) => item !== uf));
      }
    } else {
      if (selecionados.length < maximo) {
        onChange([...selecionados, uf]);
      } else {
        // Substitui o último selecionado se atingiu o máximo
        onChange([...selecionados.slice(1), uf]);
      }
    }
  };

  const estadosFiltrados = ESTADOS_INDICADORES.filter((e) => {
    if (e.uf === "BR") return false; // Média Brasil tem botão de destaque separado
    if (filtroRegiao === "Todas") return true;
    return e.regiao === filtroRegiao;
  });

  const toggleMediaBrasil = () => {
    if (selecionados.includes("BR")) {
      if (selecionados.length > 1) {
        onChange(selecionados.filter((u) => u !== "BR"));
      }
    } else {
      onChange(["BR", ...selecionados.slice(0, maximo - 1)]);
    }
  };

  const resetarPadrao = () => {
    onChange(["BR", "MG", "SP", "CE", "PR"]);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Seletor de Estados para Comparação
            </h2>
          </div>
          <p className="text-xs text-text-soft mt-1">
            Selecione até {maximo} estados simultâneos para cruzar dados oficiais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMediaBrasil}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selecionados.includes("BR")
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "border-border bg-surface-2 text-text hover:border-primary/50"
            }`}
          >
            {selecionados.includes("BR") ? "✓ Média Brasil Ativa" : "+ Incluir Média Brasil"}
          </button>
          <button
            type="button"
            onClick={resetarPadrao}
            className="p-1.5 rounded-xl border border-border bg-surface-2 text-text-soft hover:text-foreground text-xs flex items-center gap-1 transition-all"
            title="Restaurar seleção padrão"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Padrão</span>
          </button>
        </div>
      </div>

      {/* Filtro por Região */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-xs font-medium text-text-soft mr-1">Filtrar região:</span>
        {REGIOES.map((reg) => (
          <button
            key={reg.id}
            type="button"
            onClick={() => setFiltroRegiao(reg.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filtroRegiao === reg.id
                ? "bg-primary/10 text-primary font-bold border border-primary/20"
                : "text-text-soft hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {reg.rotulo}
          </button>
        ))}
      </div>

      {/* Grade de Estados */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-1.5 sm:gap-2">
        {estadosFiltrados.map((est) => {
          const ativo = selecionados.includes(est.uf);
          return (
            <button
              key={est.uf}
              type="button"
              onClick={() => toggleEstado(est.uf)}
              className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                ativo
                  ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                  : "bg-surface-2 border-border text-text hover:border-primary/50 hover:bg-surface"
              }`}
            >
              <div className="font-bold">{est.uf}</div>
              <div className="truncate text-[12px] opacity-80">{est.nome}</div>
            </button>
          );
        })}
      </div>

      {/* Chips Selecionados */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-text-soft">
          Comparando ({selecionados.length}/{maximo}):
        </span>
        {selecionados.map((uf) => {
          const est = ESTADOS_INDICADORES.find((e) => e.uf === uf);
          return (
            <span
              key={uf}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold"
            >
              {uf} — {est?.nome ?? uf}
              {selecionados.length > 1 && (
                <button
                  type="button"
                  onClick={() => toggleEstado(uf)}
                  className="hover:text-primary/70 transition-colors"
                  aria-label={`Remover ${uf}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
