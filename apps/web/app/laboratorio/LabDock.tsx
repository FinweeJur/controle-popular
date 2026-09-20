"use client";

import React from "react";
import {
  Mountain,
  Leaf,
  GraduationCap,
  TrendingUp,
  Users,
  Scale,
  Cloud,
  BarChart3,
} from "lucide-react";

export type DatasetKey =
  | "barragens"
  | "licencas"
  | "educacao"
  | "economia"
  | "congresso"
  | "judiciario"
  | "clima"
  | "esg";

interface DockItem {
  key: DatasetKey;
  label: string;
  icon: React.ElementType;
}

const DOCK_ITEMS: DockItem[] = [
  { key: "barragens", label: "Barragens", icon: Mountain },
  { key: "licencas", label: "Licenças", icon: Leaf },
  { key: "educacao", label: "Educação", icon: GraduationCap },
  { key: "economia", label: "Economia", icon: TrendingUp },
  { key: "congresso", label: "Congresso", icon: Users },
  { key: "judiciario", label: "Judiciário", icon: Scale },
  { key: "clima", label: "Clima", icon: Cloud },
  { key: "esg", label: "ESG", icon: BarChart3 },
];

interface LabDockProps {
  active: DatasetKey | null;
  onSelect: (key: DatasetKey) => void;
}

export default function LabDock({ active, onSelect }: LabDockProps) {
  return (
    <nav
      aria-label="Categorias de dados"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-2xl border border-border/50 bg-surface/80 px-3 py-2 shadow-lg backdrop-blur-md sm:gap-2"
    >
      {DOCK_ITEMS.map((item) => {
        const Icon = item.icon;
        const isAtivo = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            aria-pressed={isAtivo}
            title={item.label}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs ${
              isAtivo
                ? "bg-primary/15 text-primary"
                : "text-text-soft hover:bg-surface-hover hover:text-text"
            }`}
          >
            <Icon size={18} strokeWidth={isAtivo ? 2.2 : 1.6} />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
