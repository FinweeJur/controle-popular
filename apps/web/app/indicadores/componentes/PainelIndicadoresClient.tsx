"use client";

/**
 * @file apps/web/app/indicadores/componentes/PainelIndicadoresClient.tsx
 * @description Painel interativo estilo PowerBI para o Painel Nacional de Indicadores Cívicos.
 *
 * Regras:
 *   - Regra 5.1: sem coleções gigantestas em props; estado local apenas para filtros da tela.
 *   - Regra 5.14: responsividade mobile (390 px) e sem estouro horizontal.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 *   - QUALIDADES-DA-INFORMACAO: citação de órgãos oficiais e exportação CSV com BOM UTF-8.
 */

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  FileText,
  BarChart3,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Landmark,
  Globe2,
  Layers,
} from "lucide-react";
import {
  DimensaoIndicador,
  obterMetricasPorDimensao,
} from "@/lib/indicadores/dados-nacionais";
import SeletorEstados from "./SeletorEstados";
import GraficosBarrasComparativo from "./GraficosBarrasComparativo";
import TabelaComparativaMatricial from "./TabelaComparativaMatricial";
import AbaInternacional from "./AbaInternacional";
import PontesCivicasIndicadores from "./PontesCivicasIndicadores";

export interface RegiaoResumo {
  nome: string;
  ufs: string[];
  totalMunicipios: number;
  totalConselhos: number;
  totalContratos: number;
}

interface PainelIndicadoresClientProps {
  geradoEm: string;
  totalMunicipiosBrasil: number;
  totalConselhosBrasil: number;
  totalContratosBrasil: number;
  regioes: RegiaoResumo[];
}

const ABAS: {
  id: DimensaoIndicador;
  rotulo: string;
  icone: React.ComponentType<{ className?: string }>;
  descricao: string;
}[] = [
  {
    id: "visao-geral",
    rotulo: "Visão Geral",
    icone: Layers,
    descricao: "Panorama consolidado dos 5.571 municípios, regiões e conselhos participativos.",
  },
  {
    id: "saude",
    rotulo: "Saúde Pública SUS",
    icone: HeartPulse,
    descricao: "Capacidade hospitalar, leitos SUS por habitante, atenção primária e mortalidade.",
  },
  {
    id: "educacao",
    rotulo: "Educação Básica",
    icone: GraduationCap,
    descricao: "Desempenho no IDEB (fundamental e médio), matrículas e conclusão escolar.",
  },
  {
    id: "desenvolvimento",
    rotulo: "Desenvolvimento & Renda",
    icone: TrendingUp,
    descricao: "IDHM geral e setorial, índice de Gini, rendimento habitual e empregos CAGED.",
  },
  {
    id: "gestao",
    rotulo: "Gestão & Cidadania",
    icone: Landmark,
    descricao: "Conselhos de direitos, contratações no PNCP e transferências constitucionais.",
  },
  {
    id: "internacional",
    rotulo: "Comparador Global",
    icone: Globe2,
    descricao: "Comparações entre o Brasil e países da OCDE e da América Latina.",
  },
];

export default function PainelIndicadoresClient({
  geradoEm,
  totalMunicipiosBrasil,
  totalConselhosBrasil,
  totalContratosBrasil,
  regioes,
}: PainelIndicadoresClientProps) {
  const [abaAtiva, setAbaAtiva] = useState<DimensaoIndicador>("visao-geral");
  const [estadosSelecionados, setEstadosSelecionados] = useState<string[]>([
    "BR",
    "MG",
    "SP",
    "CE",
    "PR",
  ]);

  const metricasAtivas = obterMetricasPorDimensao(abaAtiva);
  const abaAtualInfo = ABAS.find((a) => a.id === abaAtiva)!;

  return (
    <div className="space-y-6">
      {/* 4 Cards de Destaque Nacional (KPIs do Painel) */}
      <section
        aria-label="Indicadores chave consolidados"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users className="h-4 w-4" />
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-soft">
              Municípios Cobertos
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {totalMunicipiosBrasil.toLocaleString("pt-BR")}
          </div>
          <div className="text-[12px] text-text-soft mt-1">100% do território nacional</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-soft">
              Unidades Federativas
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            27 UFs
          </div>
          <div className="text-[12px] text-text-soft mt-1">26 estados e o Distrito Federal</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-soft">
              Conselhos Mapeados
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {totalConselhosBrasil.toLocaleString("pt-BR")}
          </div>
          <div className="text-[12px] text-text-soft mt-1">Órgãos de controle social</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[12px] uppercase font-bold tracking-wider text-text-soft">
              Contratos PNCP
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {totalContratosBrasil.toLocaleString("pt-BR")}
          </div>
          <div className="text-[12px] text-text-soft mt-1">Contratações monitoradas</div>
        </div>
      </section>

      {/* Navegação de Abas Temáticas (PowerBI Estilo) */}
      <nav
        aria-label="Módulos temáticos do painel"
        className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border"
      >
        {ABAS.map((aba) => {
          const Icone = aba.icone;
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                ativo
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface border border-border text-text hover:border-primary/50 hover:bg-surface-2"
              }`}
            >
              <Icone className="h-4 w-4" />
              <span>{aba.rotulo}</span>
            </button>
          );
        })}
      </nav>

      {/* Descrição da Aba Selecionada */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <p className="text-xs sm:text-sm text-text-soft font-medium">
          {abaAtualInfo.descricao}
        </p>
        <span className="text-[12px] text-text-soft shrink-0">
          Dados consolidados com fontes oficiais atualizadas.
        </span>
      </div>

      {/* Conteúdo Dinâmico por Aba */}
      {abaAtiva === "visao-geral" && (
        <div className="space-y-6">
          {/* Tabela por Região */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
              Consolidação por Grandes Regiões Geográficas
            </h3>
            <p className="text-xs text-text-soft mb-4">
              Distribuição de municípios, estados, conselhos e contratações públicas catalogadas.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left min-w-[580px]">
                <thead className="bg-surface-2 text-text-soft uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3 font-bold text-foreground">Região</th>
                    <th className="p-3 text-right">Estados</th>
                    <th className="p-3 text-right">Municípios</th>
                    <th className="p-3 text-right">Conselhos de Direitos</th>
                    <th className="p-3 text-right">Contratos no PNCP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regioes.map((r) => (
                    <tr key={r.nome} className="hover:bg-surface-2/50 transition-colors">
                      <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                        <span>{r.nome}</span>
                        <span className="text-[12px] text-text-soft font-normal">
                          ({r.ufs.join(", ")})
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-text-soft">
                        {r.ufs.length}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {r.totalMunicipios.toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3 text-right font-mono text-foreground">
                        {r.totalConselhos.toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3 text-right font-mono text-foreground">
                        {r.totalContratos.toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Destaque das Frentes do Painel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setAbaAtiva("saude")}
              className="cursor-pointer rounded-2xl border border-border bg-surface p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 w-fit mb-3">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Saúde Pública e Capacidade do SUS
              </h4>
              <p className="text-xs text-text-soft mt-1.5 leading-relaxed">
                Compare leitos SUS, cobertura de equipes de Saúde da Família e mortalidade infantil entre os estados.
              </p>
              <div className="mt-3 text-xs font-bold text-primary">Abrir comparador de saúde →</div>
            </div>

            <div
              onClick={() => setAbaAtiva("educacao")}
              className="cursor-pointer rounded-2xl border border-border bg-surface p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-3">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Educação Básica e Desempenho IDEB
              </h4>
              <p className="text-xs text-text-soft mt-1.5 leading-relaxed">
                Acesse notas do IDEB 2023, taxa de conclusão do ensino médio e volume de matrículas estaduais.
              </p>
              <div className="mt-3 text-xs font-bold text-primary">Abrir comparador de educação →</div>
            </div>

            <div
              onClick={() => setAbaAtiva("internacional")}
              className="cursor-pointer rounded-2xl border border-border bg-surface p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit mb-3">
                <Globe2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Direitos Comparados Globais
              </h4>
              <p className="text-xs text-text-soft mt-1.5 leading-relaxed">
                Compare o investimento público do Brasil com países da OCDE e da América Latina.
              </p>
              <div className="mt-3 text-xs font-bold text-primary">Abrir comparador global →</div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva !== "visao-geral" && abaAtiva !== "internacional" && (
        <div className="space-y-6">
          {/* Seletor de Estados */}
          <SeletorEstados
            selecionados={estadosSelecionados}
            onChange={setEstadosSelecionados}
            maximo={5}
          />

          {/* Gráficos de Barras Comparativos */}
          <GraficosBarrasComparativo
            ufsSelecionadas={estadosSelecionados}
            metricas={metricasAtivas}
          />

          {/* Tabela Matricial com Download CSV */}
          <TabelaComparativaMatricial
            ufsSelecionadas={estadosSelecionados}
            metricas={metricasAtivas}
          />
        </div>
      )}

      {abaAtiva === "internacional" && <AbaInternacional />}

      {/* Conexões Cívicas e Hubs Relacionados */}
      <PontesCivicasIndicadores />
    </div>
  );
}
