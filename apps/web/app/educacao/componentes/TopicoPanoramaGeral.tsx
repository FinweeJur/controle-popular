"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoPanoramaGeral.tsx
 * @description Dashboard executivo visual estilo PowerBI cívico para /educacao.
 *
 * Papel no portal:
 *   Reúne visualizações nativas em CSS e SVG puro (sem bibliotecas externas) para
 *   demonstrar o panorama completo da educação brasileira e da produção científica aberta:
 *   1. Gráfico histórico da evolução do IDEB nacional (2015-2023) em relação à meta.
 *   2. Gráfico proporcional de revistas científicas gratuitas (Diamante) vs comerciais.
 *   3. Distribuição dos 1.414 grupos de pesquisa CNPq por grande área do conhecimento.
 *   4. Matriz de programas internacionais e alcance de mobilidade universitária.
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade mobile (390 px) e sem rolagem horizontal falsa.
 *   - Regra 5.16: texto nunca menor que 12 px (text-xs = 12px).
 */

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Plane,
  Scale,
  School,
  Briefcase,
  ArrowRight
} from "lucide-react";
import type { TopicoEducacao } from "./KpisExecutivos";

interface TopicoPanoramaGeralProps {
  onSelecionarTopico: (topico: TopicoEducacao) => void;
  metricasIdeb: { ano: string; nota: number; meta: number }[];
  metricasPeriodicos: {
    total: number;
    diamante: number;
    comTaxa: number;
    continua: number;
    ciclica: number;
  };
  metricasGrupos: {
    totalGrupos: number;
    totalProjetos: number;
    totalInstituicoes: number;
    areas: { nome: string; quantidade: number; pct: number }[];
  };
  metricasIntercambio: {
    totalProgramas: number;
    totalDepartamentos: number;
    totalCursos: number;
    regioes: { regiao: string; count: number }[];
  };
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TopicoPanoramaGeral({
  onSelecionarTopico,
  metricasIdeb,
  metricasPeriodicos,
  metricasGrupos,
  metricasIntercambio,
}: TopicoPanoramaGeralProps) {
  const pctDiamante = Math.round(
    (metricasPeriodicos.diamante / (metricasPeriodicos.total || 1)) * 100
  );
  const pctComTaxa = 100 - pctDiamante;

  return (
    <div className="mt-8 space-y-8">
      {/* Bloco 1: Gráficos Centrais do PowerBI Cívico (SVG/CSS Puro) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Histórica do IDEB Nacional (INEP) */}
        <section
          aria-labelledby="titulo-grafico-ideb-exec"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <School className="w-3.5 h-3.5" />
                Educação Básica Nacional
              </span>
              <span className="text-xs text-muted">Série INEP 2015-2023</span>
            </div>

            <h2
              id="titulo-grafico-ideb-exec"
              className="text-base sm:text-lg font-bold text-foreground"
            >
              Evolução Histórica do IDEB vs Meta Nacional (6,0)
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Média ponderada do fluxo escolar e desempenho no Saeb (anos iniciais). Em 2021 reflete
              o impacto do fechamento de escolas na pandemia.
            </p>

            {/* Visualização em SVG/CSS Nativo */}
            <div className="mt-6 pt-4 pb-2 border-b border-border">
              <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end h-48">
                {metricasIdeb.map((item) => {
                  const alturaPct = Math.round((item.nota / 7.0) * 100);
                  const atingiuMeta = item.nota >= item.meta;

                  return (
                    <div
                      key={item.ano}
                      className="flex flex-col items-center justify-end h-full gap-2 group"
                    >
                      <span className="text-xs font-extrabold text-foreground">
                        {item.nota.toFixed(1)}
                      </span>

                      {/* Barra interativa com tooltip visual nativo */}
                      <div className="w-full max-w-[48px] bg-surface-2 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 group-hover:opacity-85 ${
                            atingiuMeta
                              ? "bg-emerald-600 dark:bg-emerald-500"
                              : "bg-primary"
                          }`}
                          style={{ height: `${alturaPct}%` }}
                          role="img"
                          aria-label={`Ano ${item.ano}: Nota ${item.nota}, Meta ${item.meta}`}
                        />
                      </div>

                      <span className="text-xs font-semibold text-muted">
                        {item.ano}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Linha indicadora de meta */}
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  <span>IDEB Medido</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-amber-500 inline-block" />
                  <span className="font-semibold text-foreground">Meta Nacional: 6,0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-xs text-muted">178.416 escolas mapeadas</span>
            <button
              type="button"
              onClick={() => onSelecionarTopico("basica")}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Abrir ferramenta de cruzamento municipal →
            </button>
          </div>
        </section>

        {/* Gráfico 2: Modelo de Acesso Aberto (Diamante vs Comercial) */}
        <section
          aria-labelledby="titulo-grafico-periodicos-exec"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BookOpen className="w-3.5 h-3.5" />
                Ciência Aberta Mundial
              </span>
              <span className="text-xs text-muted">DOAJ & SciELO</span>
            </div>

            <h2
              id="titulo-grafico-periodicos-exec"
              className="text-base sm:text-lg font-bold text-foreground"
            >
              Periódicos Científicos: Gratuito (Diamante) vs Com APC
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Distribuição de 23.577 revistas auditadas em 141 países. O modelo Diamante garante
              publicação sem taxas para o autor e leitura livre sem paywall.
            </p>

            {/* Barra Proporcional em CSS */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-emerald-700 dark:text-emerald-400">
                  {fmt(metricasPeriodicos.diamante)} Títulos Diamante ({pctDiamante}%)
                </span>
                <span className="text-muted">
                  {fmt(metricasPeriodicos.comTaxa)} com Taxa APC ({pctComTaxa}%)
                </span>
              </div>

              <div className="h-6 w-full rounded-full bg-surface-2 overflow-hidden flex p-1 border border-border">
                <div
                  className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pctDiamante}%` }}
                  title={`Diamante: ${pctDiamante}%`}
                />
                <div
                  className="h-full rounded-full bg-surface-hover transition-all duration-500"
                  style={{ width: `${pctComTaxa}%` }}
                  title={`Com taxa APC: ${pctComTaxa}%`}
                />
              </div>

              {/* Indicadores complementares */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
                  <span className="font-bold text-foreground block">
                    {fmt(metricasPeriodicos.continua)} revistas
                  </span>
                  <span className="text-muted block mt-0.5">
                    Fluxo contínuo (aceitam o ano todo)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
                  <span className="font-bold text-foreground block">
                    {fmt(metricasPeriodicos.ciclica)} revistas
                  </span>
                  <span className="text-muted block mt-0.5">
                    Chamadas cíclicas (semestrais/anuais)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-xs text-muted">141 países cobertos</span>
            <button
              type="button"
              onClick={() => onSelecionarTopico("periodicos")}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Buscar periódicos com submissão aberta →
            </button>
          </div>
        </section>
      </div>

      {/* Bloco 2: Grupos de Pesquisa CNPq e Mobilidade Internacional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição dos Grupos CNPq por Grande Área */}
        <section
          aria-labelledby="titulo-grafico-grupos-exec"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Pesquisa & Extensão Universitária
            </span>
            <span className="text-xs text-muted">DGP / CNPq</span>
          </div>

          <h2
            id="titulo-grafico-grupos-exec"
            className="text-base sm:text-lg font-bold text-foreground"
          >
            Distribuição dos 1.414 Grupos de Estudo e Pesquisa por Grande Área
          </h2>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Mapeamento oficial com linhas de pesquisa, contatos institucionais de líderes e
            170 projetos de extensão comunitária.
          </p>

          <div className="mt-5 space-y-3">
            {metricasGrupos.areas.slice(0, 6).map((area) => (
              <div key={area.nome} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{area.nome}</span>
                  <span className="text-muted">
                    {area.quantidade} grupos ({area.pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
                    style={{ width: `${Math.max(area.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              {metricasGrupos.totalInstituicoes} universidades cadastradas
            </span>
            <button
              type="button"
              onClick={() => onSelecionarTopico("universidades")}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Explorar índice de grupos e projetos →
            </button>
          </div>
        </section>

        {/* Mobilidade Internacional e Editais */}
        <section
          aria-labelledby="titulo-grafico-mobilidade-exec"
          className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Plane className="w-3.5 h-3.5" />
              Intercâmbio & Calendário Anual
            </span>
            <span className="text-xs text-muted">Editais & Bolsas</span>
          </div>

          <h2
            id="titulo-grafico-mobilidade-exec"
            className="text-base sm:text-lg font-bold text-foreground"
          >
            Programas Mundiais de Intercâmbio & Diretorias de R.I.
          </h2>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Editais ativos de graduação sanduíche, bolsas integrais e calendário 12 meses para
            planejamento de candidaturas.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {metricasIntercambio.regioes.map((reg) => (
              <div
                key={reg.regiao}
                className="p-3.5 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between"
              >
                <span className="text-xs font-semibold text-muted block">
                  {reg.regiao}
                </span>
                <span className="text-lg font-extrabold text-foreground mt-1">
                  {reg.count} diretorias DRI
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted leading-relaxed">
            <strong className="text-foreground">Programas mapeados: </strong>
            Erasmus+ (União Europeia), PILA (América Latina), AUGM/Escala (Mercosul), Brafitec
            (França/Engenharias), Santander Universidades, Fulbright e DAAD.
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              {metricasIntercambio.totalCursos} cursos com coordenações mapeadas
            </span>
            <button
              type="button"
              onClick={() => onSelecionarTopico("intercambio")}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Acessar calendário anual e DRIs →
            </button>
          </div>
        </section>
      </div>

      {/* Bloco 3: Guia de Direitos Fundamentais e Marcos Legais */}
      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2">
              <Scale className="w-3.5 h-3.5" />
              Direitos Comparados & Controle Cívico
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
              A Educação como Direito Constitucional e Transformação Social
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Consulte a matriz comparativa entre os 27 estados da federação, os marcos da
              Constituição de 1988 (art. 205 a 214), o Fundeb Permanente (EC 108/2020), as 20 metas do
              Plano Nacional de Educação (PNE) e os tratados da UNESCO e ONU.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelecionarTopico("comparados")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap"
          >
            Abrir Direitos Comparados
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Bloco 4: Carreiras Públicas, Magistério e Pesquisa */}
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-500/20">
              <Briefcase className="w-3.5 h-3.5" />
              Carreiras Públicas, Magistério & Ciência
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
              Concursos Públicos e Contratações Temporárias (PSS) na Educação
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Consulte vagas abertas e autorizadas para professores do magistério superior federal e estadual,
              docentes da educação básica municipal, pesquisadores em institutos públicos (Fiocruz, Embrapa, IBGE, INEP)
              e processos seletivos simplificados (PSS) em todo o país.
            </p>
          </div>

          <Link
            href="/concursos"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Acessar Radar de Concursos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
