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
  Coins,
  FileText,
  Gavel,
  Globe,
  MapPin,
  Radio,
  Shield,
  Landmark,
  Briefcase,
  Handshake,
  Calculator,
  BookOpen,
  Cpu,
} from "lucide-react";

export type DatasetKey = string;

const ICONES: Record<string, React.ElementType> = {
  "sigbm-barragens": Mountain,
  "licencas-unificadas": Leaf,
  "convenios-ambientais-mg": Handshake,
  "decisoes-licenciamento": Gavel,
  "legislacao-unificada": BookOpen,
  "biblioteca-desastres": Cloud,
  "educacao-mg": GraduationCap,
  "series-economicas-bcb": TrendingUp,
  "ceap-nacional": Coins,
  "judiciario-contatos": Scale,
  "judiciario-poder-indicacao": Gavel,
  "judiciario-remuneracoes": Coins,
  "clima-risco": Cloud,
  "esg-vale": BarChart3,
  "comunicabr-mg": MapPin,
  "rouanet-mg": BookOpen,
  "telefonia-mg": Radio,
  "risco-direitos": Shield,
  "legislativo-estaduais": Landmark,
  "fornecedores-multinacionais": Briefcase,
  "acordos-internacionais": Globe,
  "pncp-mg": FileText,
};

/** Atalhos de tela cheia para as 8 camadas históricas (dock compacto). */
export const DOCK_HISTORICO: DatasetKey[] = [
  "sigbm-barragens",
  "licencas-unificadas",
  "educacao-mg",
  "series-economicas-bcb",
  "ceap-nacional",
  "judiciario-contatos",
  "clima-risco",
  "esg-vale",
];

interface DockItem {
  key: DatasetKey;
  label: string;
  icon: React.ElementType;
}

interface LabDockProps {
  active: DatasetKey | null;
  onSelect: (key: DatasetKey) => void;
  /** Camadas do catálogo (id → nome). Se vier, o dock mostra TODAS. */
  camadas?: { id: string; nome: string }[];
  /** Ids ligados (checkbox do Seu Nonô) — só essas aparecem no dock. */
  ligadas?: Set<string>;
}

export default function LabDock({ active, onSelect, camadas, ligadas }: LabDockProps) {
  const itens: DockItem[] = (camadas ?? DOCK_HISTORICO.map((id) => ({ id, nome: id })))
    .filter((c) => !ligadas || ligadas.has(c.id))
    .map((c) => ({
      key: c.id,
      label: c.nome,
      icon: ICONES[c.id] ?? Cpu,
    }));

  return (
    <nav
      aria-label="Camadas de dados"
      className="fixed bottom-4 left-1/2 z-50 flex max-w-[min(96vw,1100px)] -translate-x-1/2 gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-surface/80 px-3 py-2 shadow-lg backdrop-blur-md sm:gap-2"
    >
      {itens.map((item) => {
        const Icon = item.icon;
        const isAtivo = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            aria-pressed={isAtivo}
            title={item.label}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors sm:px-3 sm:text-xs ${
              isAtivo
                ? "bg-primary/15 text-primary"
                : "text-text-soft hover:bg-surface-hover hover:text-text"
            }`}
          >
            <Icon size={18} strokeWidth={isAtivo ? 2.2 : 1.6} aria-hidden="true" />
            <span className="hidden max-w-24 truncate sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
