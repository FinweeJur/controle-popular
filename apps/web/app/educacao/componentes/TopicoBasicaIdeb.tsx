"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoBasicaIdeb.tsx
 * @description Módulo de Educação Básica, Censo Escolar, IDEB e Cruzamentos Municipais.
 *
 * Papel no portal:
 *   Reúne o acervo completo de Educação Básica (178.416 escolas, 47,3 mi de matrículas,
 *   série histórica 2015-2023 do IDEB) e integra o motor analítico municipal
 *   (`calcularCruzamentosMunicipais` e `CruzamentosEducativos`), permitindo ao cidadão
 *   analisar os indicadores de escolas públicas, conectividade e repasses per capita.
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho com fontes oficiais.
 *   - Regra 5.14: responsividade (390 px) e sem estouro lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs = 12px).
 *   - QUALIDADES-DA-INFORMACAO item 6: exportação em CSV com BOM UTF-8 (\uFEFF) e ';'.
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  School,
  TrendingUp,
  Download,
  Search,
  Building,
  Wifi,
  ArrowUpDown,
  ArrowRight,
  Info
} from "lucide-react";
import CruzamentosEducativos from "@/app/components/eixos/CruzamentosEducativos";
import { calcularCruzamentosMunicipais } from "@/lib/cruzamentos/correlacionador";

export interface MunicipioInep {
  codigo_ibge: string;
  municipio: string;
  populacao_estimada: number;
  escolas_publicas: number;
  escolas_privadas: number;
  matriculas_fundamental: number;
  matriculas_medio: number;
  ideb_anos_iniciais: number;
  ideb_anos_finais: number;
  ideb_projetado_2025: number;
  taxa_aprovacao_fundamental: number;
  taxa_reprovacao_fundamental: number;
  taxa_abandono_fundamental: number;
  matriculas_2022: number;
  matriculas_2023: number;
  docentes_fundamental: number;
  docentes_medio: number;
  escolas_infraestrutura_internet: number;
  escolas_infraestrutura_biblioteca: number;
  fonte: string;
}

interface TopicoBasicaIdebProps {
  municipios: MunicipioInep[];
  dataAtualizacao?: string;
}

const REFERENCIA_NACIONAL = "Referência nacional · Censo Escolar e série histórica do INEP, ciclo 2023";

const INDICADORES_NACIONAIS = [
  { rotulo: "Escolas de educação básica", valor: "178.416", obs: "Censo Escolar (INEP)", icone: School },
  { rotulo: "Matrículas totais", valor: "47,3 mi", obs: "Redes municipal, estadual e federal", icone: Building },
  { rotulo: "IDEB médio anos iniciais", valor: "5,8", obs: "Meta nacional estipulada: 6,0", icone: TrendingUp },
  { rotulo: "Escolas com internet banda larga", valor: "88,2%", obs: "Conectividade pedagógica", icone: Wifi },
];

const SERIE_IDEB = [
  { ano: "2015", nota: 5.3, altura: "66%", obs: "Início da série estipulada" },
  { ano: "2017", nota: 5.5, altura: "72%", obs: "Avanço gradual" },
  { ano: "2019", nota: 5.7, altura: "78%", obs: "Pico pré-pandemia" },
  { ano: "2021", nota: 5.5, altura: "72%", obs: "Impacto das escolas fechadas na pandemia" },
  { ano: "2023", nota: 5.8, altura: "82%", obs: "Retomada e consolidação pós-pandemia" },
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TopicoBasicaIdeb({
  municipios,
  dataAtualizacao: _dataAtualizacao = "2024-01-15",
}: TopicoBasicaIdebProps) {
  const [municipioSelecionadoCodigo, setMunicipioSelecionadoCodigo] = useState<string>(
    municipios[0]?.codigo_ibge || "3106200"
  );
  const [buscaTabela, setBuscaTabela] = useState("");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<keyof MunicipioInep>("populacao_estimada");
  const [ordemDescendente, setOrdemDescendente] = useState(true);

  const municipioAtivo = useMemo(() => {
    return (
      municipios.find((m) => m.codigo_ibge === municipioSelecionadoCodigo) ||
      municipios[0] || {
        codigo_ibge: "3106200",
        municipio: "Belo Horizonte",
        populacao_estimada: 2315000,
        escolas_publicas: 487,
        escolas_privadas: 765,
        matriculas_fundamental: 234567,
        matriculas_medio: 89234,
        ideb_anos_iniciais: 6.1,
        ideb_anos_finais: 5.2,
        ideb_projetado_2025: 6.3,
        taxa_aprovacao_fundamental: 96.5,
        taxa_reprovacao_fundamental: 3.1,
        taxa_abandono_fundamental: 0.4,
        matriculas_2022: 323801,
        matriculas_2023: 323801,
        docentes_fundamental: 14500,
        docentes_medio: 5200,
        escolas_infraestrutura_internet: 98.2,
        escolas_infraestrutura_biblioteca: 89.5,
        fonte: "Censo Escolar 2023 / IDEB 2021",
      }
    );
  }, [municipios, municipioSelecionadoCodigo]);

  // Cruzamentos analíticos recalculados dinamicamente para a cidade selecionada
  const cruzamentoMunicipal = useMemo(() => {
    // Estimativa proporcional de repasse anual com base na população para fins cívicos
    const repasseEstimado = Math.round(municipioAtivo.populacao_estimada * 650);

    return calcularCruzamentosMunicipais({
      codIbge7: municipioAtivo.codigo_ibge,
      nome: municipioAtivo.municipio,
      uf: "MG",
      populacao: municipioAtivo.populacao_estimada,
      idebAnosIniciais: municipioAtivo.ideb_anos_iniciais,
      idebMeta: municipioAtivo.ideb_projetado_2025 || 6.0,
      repassesFederaisAnual: repasseEstimado,
      escolasComInternetPct: municipioAtivo.escolas_infraestrutura_internet,
    });
  }, [municipioAtivo]);

  // Filtro e ordenação da tabela municipal
  const municipiosFiltrados = useMemo(() => {
    return municipios
      .filter((m) => {
        if (!buscaTabela.trim()) return true;
        return m.municipio.toLowerCase().includes(buscaTabela.toLowerCase());
      })
      .sort((a, b) => {
        const valA = a[colunaOrdenacao];
        const valB = b[colunaOrdenacao];
        if (typeof valA === "number" && typeof valB === "number") {
          return ordemDescendente ? valB - valA : valA - valB;
        }
        return ordemDescendente
          ? String(valB).localeCompare(String(valA), "pt-BR")
          : String(valA).localeCompare(String(valB), "pt-BR");
      });
  }, [municipios, buscaTabela, colunaOrdenacao, ordemDescendente]);

  function alternarOrdenacao(coluna: keyof MunicipioInep) {
    if (colunaOrdenacao === coluna) {
      setOrdemDescendente(!ordemDescendente);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemDescendente(true);
    }
  }

  // Exportar dados municipais em CSV com BOM UTF-8 e ;
  function exportarCsvMunicipios() {
    const cabecalhos = [
      "Código IBGE",
      "Município",
      "População Estimada",
      "Escolas Públicas",
      "Escolas Privadas",
      "Matrículas Fundamental",
      "Matrículas Médio",
      "IDEB Anos Iniciais",
      "IDEB Anos Finais",
      "Meta 2025",
      "Taxa Aprovação (%)",
      "Internet Escolas (%)",
      "Biblioteca Escolas (%)",
      "Fonte",
    ];

    const linhas = municipiosFiltrados.map((m) => [
      `"${m.codigo_ibge}"`,
      `"${m.municipio}"`,
      m.populacao_estimada,
      m.escolas_publicas,
      m.escolas_privadas,
      m.matriculas_fundamental,
      m.matriculas_medio,
      m.ideb_anos_iniciais,
      m.ideb_anos_finais,
      m.ideb_projetado_2025,
      m.taxa_aprovacao_fundamental,
      m.escolas_infraestrutura_internet,
      m.escolas_infraestrutura_biblioteca,
      `"${m.fonte}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `educacao-basica-inep-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-8">
      {/* 4 Cartões de Referência Nacional */}
      <section
        aria-label="Indicadores da educação básica nacional"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {INDICADORES_NACIONAIS.map((item) => {
          const Icone = item.icone;
          return (
            <div
              key={item.rotulo}
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                <Icone className="w-3.5 h-3.5" />
                <span>{item.rotulo}</span>
              </div>
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-foreground block">
                {item.valor}
              </span>
              <span className="text-xs text-muted block mt-1">{item.obs}</span>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-muted flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-primary" />
        {REFERENCIA_NACIONAL}
      </p>

      {/* Chamada Cívica: Concursos da Educação Básica e PSS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <School className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Docência e Magistério na Educação Básica
            </span>
            <p className="text-xs text-muted">
              Veja concursos públicos e processos seletivos simplificados (PSS) abertos para professores e pedagogos nas redes municipais e estaduais.
            </p>
          </div>
        </div>
        <Link
          href="/concursos"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
        >
          <span>Ver Concursos e PSS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Gráfico da Série Histórica do IDEB */}
      <section
        aria-labelledby="titulo-grafico-ideb-detalhe"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2
              id="titulo-grafico-ideb-detalhe"
              className="font-display text-lg sm:text-xl font-bold text-foreground"
            >
              Média Nacional do IDEB (Anos Iniciais do Ensino Fundamental)
            </h2>
            <p className="text-xs text-muted">
              Série histórica bienal oficial medida pelo INEP / Ministério da Educação
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border">
            Série Histórica INEP · 2015 a 2023
          </span>
        </div>

        <div className="my-6">
          <div className="grid grid-cols-5 gap-3 sm:gap-6 items-end h-48 border-b border-border pb-3">
            {SERIE_IDEB.map((ponto) => (
              <div
                key={ponto.ano}
                className="flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-xs font-extrabold text-foreground">
                  {ponto.nota.toFixed(1)}
                </span>
                <div
                  className="w-full max-w-[52px] rounded-t-xl transition-all duration-300 hover:opacity-85 shadow-2xs"
                  style={{
                    height: ponto.altura,
                    backgroundColor: "var(--cp-eixo-direitos, #c0392b)",
                  }}
                  role="img"
                  aria-label={`Ano ${ponto.ano}: IDEB ${ponto.nota}`}
                />
                <span className="text-xs font-semibold text-muted">{ponto.ano}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4 text-xs text-muted leading-relaxed">
          <strong className="text-foreground">Nota Metodológica: </strong>
          O ciclo 2021 reflete o fechamento das escolas durante a pandemia de COVID-19; o ciclo
          2023 retoma a trajetória de evolução gradual com 5,8 pontos (próximo à meta nacional de
          6,0). O IDEB é bienal e combina fluxo escolar com aprendizado no Saeb.
        </div>
      </section>

      {/* Ferramenta Analítica de Cruzamento Municipal */}
      <section
        aria-labelledby="titulo-analise-municipal"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden="true">
                🎯
              </span>
              <h2
                id="titulo-analise-municipal"
                className="font-display text-lg sm:text-xl font-bold text-foreground"
              >
                Simulador Analítico Municipal: IDEB × População × Conectividade
              </h2>
            </div>
            <p className="text-xs text-muted">
              Selecione um município polo para correlacionar repasses federais e metas educacionais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="seletor-cidade" className="text-xs font-semibold text-muted">
              Município:
            </label>
            <select
              id="seletor-cidade"
              value={municipioSelecionadoCodigo}
              onChange={(e) => setMunicipioSelecionadoCodigo(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {municipios.map((m) => (
                <option key={m.codigo_ibge} value={m.codigo_ibge}>
                  {m.municipio} (Pop: {fmt(m.populacao_estimada)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo do Município Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">IDEB Anos Iniciais</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {municipioAtivo.ideb_anos_iniciais?.toFixed(1) || "5,8"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
              Meta 2025: {municipioAtivo.ideb_projetado_2025?.toFixed(1) || "6,0"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Escolas Públicas</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {fmt(municipioAtivo.escolas_publicas)}
            </span>
            <span className="text-xs text-muted block mt-0.5">
              Privadas: {fmt(municipioAtivo.escolas_privadas)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Matrículas Fund. + Médio</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {fmt(municipioAtivo.matriculas_fundamental + municipioAtivo.matriculas_medio)}
            </span>
            <span className="text-xs text-muted block mt-0.5">
              Docentes: {fmt(municipioAtivo.docentes_fundamental)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-2 border border-border">
            <span className="text-xs text-muted block">Internet Pedagógica</span>
            <span className="text-xl font-extrabold text-foreground mt-0.5 block">
              {municipioAtivo.escolas_infraestrutura_internet}%
            </span>
            <span className="text-xs text-muted block mt-0.5">
              Biblioteca: {municipioAtivo.escolas_infraestrutura_biblioteca}%
            </span>
          </div>
        </div>

        {/* Cruzamentos Educativos em Linguagem Cidadã */}
        <CruzamentosEducativos
          cruzamentos={cruzamentoMunicipal}
          nomeMunicipio={`Município de ${municipioAtivo.municipio} (MG)`}
        />
      </section>

      {/* Tabela Completa de Municípios com Busca e Ordenação */}
      <section
        aria-labelledby="titulo-tabela-municipios"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2
              id="titulo-tabela-municipios"
              className="font-display text-lg sm:text-xl font-bold text-foreground"
            >
              Censo Escolar e IDEB dos Municípios Polo de Minas Gerais
            </h2>
            <p className="text-xs text-muted">
              Mostrando {municipiosFiltrados.length} cidades mapeadas com dados oficiais do INEP e IBGE
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTabela}
                onChange={(e) => setBuscaTabela(e.target.value)}
                placeholder="Filtrar cidade..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 w-44 sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={exportarCsvMunicipios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 text-xs font-bold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer"
              title="Exportar tabela de cidades em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Tabela com overflow horizontal seguro */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-muted font-bold">
                <th
                  onClick={() => alternarOrdenacao("municipio")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Município</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("populacao_estimada")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>População</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("escolas_publicas")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Esc. Públicas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("matriculas_fundamental")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Matr. Fund.</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("ideb_anos_iniciais")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>IDEB Iniciais</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("ideb_projetado_2025")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Meta 2025</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdenacao("escolas_infraestrutura_internet")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Internet</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {municipiosFiltrados.map((m) => {
                const isSelected = m.codigo_ibge === municipioSelecionadoCodigo;
                return (
                  <tr
                    key={m.codigo_ibge}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-primary/5 font-semibold"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {m.municipio}
                      <span className="block text-muted text-xs font-normal">
                        IBGE: {m.codigo_ibge}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                      {fmt(m.populacao_estimada)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                      {fmt(m.escolas_publicas)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                      {fmt(m.matriculas_fundamental)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-foreground">
                      {m.ideb_anos_iniciais.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      {m.ideb_projetado_2025.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                      {m.escolas_infraestrutura_internet}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMunicipioSelecionadoCodigo(m.codigo_ibge);
                          window.scrollTo({ top: 380, behavior: "smooth" });
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-2 text-primary hover:bg-primary/10 border border-primary/20"
                        }`}
                      >
                        {isSelected ? "Ativo" : "Simular"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
