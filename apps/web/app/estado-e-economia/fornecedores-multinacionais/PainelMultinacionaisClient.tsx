"use client";

import React, { useState, useMemo } from "react";
import type { FornecedorMultinacional } from "@/lib/fornecedores/calculos-multinacionais";
import {
  formatarMoedaBrl,
  formatarMoedaUsd,
  gerarCsvFornecedoresMultinacionais,
} from "@/lib/fornecedores/calculos-multinacionais";

interface Props {
  empresas: FornecedorMultinacional[];
  dataAtualizacao: string;
}

type OrdenacaoCampo =
  | "valor_brl"
  | "valor_usd"
  | "lucro_anual"
  | "lucro_5_anos"
  | "participacao_pct"
  | "nome"
  | "desde_ano";

export default function PainelMultinacionaisClient({
  empresas,
  dataAtualizacao,
}: Props) {
  // Filtros
  const [busca, setBusca] = useState("");
  const [continenteFiltro, setContinenteFiltro] = useState("todos");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [contrapartidaFiltro, setContrapartidaFiltro] = useState("todos");
  const [empresaExpandida, setEmpresaExpandida] = useState<string | null>(null);

  // Ordenação
  const [ordenarPor, setOrdenarPor] = useState<OrdenacaoCampo>("valor_brl");
  const [ordemDesc, setOrdemDesc] = useState(true);

  // Feedback de cópia
  const [copiado, setCopiado] = useState(false);

  // Lista única de setores para o filtro
  const setoresDisponiveis = useMemo(() => {
    return Array.from(new Set(empresas.map((e) => e.setor))).sort();
  }, [empresas]);

  // Filtragem
  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      // Busca textual
      const termo = busca.toLowerCase();
      const bateBusca =
        !busca ||
        empresa.nome.toLowerCase().includes(termo) ||
        empresa.setor.toLowerCase().includes(termo) ||
        empresa.pais_origem.toLowerCase().includes(termo) ||
        empresa.orgaos_atendidos.some((o) => o.toLowerCase().includes(termo)) ||
        empresa.objeto_fornecimento.toLowerCase().includes(termo);

      // Filtro de continente
      const bateContinente =
        continenteFiltro === "todos" ||
        empresa.continente === continenteFiltro;

      // Filtro de setor
      const bateSetor =
        setorFiltro === "todos" || empresa.setor === setorFiltro;

      // Filtro de contrapartida
      const bateContrapartida =
        contrapartidaFiltro === "todos" ||
        (contrapartidaFiltro === "sim" &&
          empresa.contrapartidas_e_offsets.possui_contrapartida) ||
        (contrapartidaFiltro === "nao" &&
          !empresa.contrapartidas_e_offsets.possui_contrapartida);

      return (
        bateBusca && bateContinente && bateSetor && bateContrapartida
      );
    });
  }, [empresas, busca, continenteFiltro, setorFiltro, contrapartidaFiltro]);

  // Ordenação
  const empresasOrdenadas = useMemo(() => {
    return [...empresasFiltradas].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (ordenarPor) {
        case "valor_brl":
          valA = a.valores_contratos.total_acumulado_brl;
          valB = b.valores_contratos.total_acumulado_brl;
          break;
        case "valor_usd":
          valA = a.valores_contratos.total_acumulado_usd;
          valB = b.valores_contratos.total_acumulado_usd;
          break;
        case "lucro_anual":
          valA = a.dados_financeiros_globais_usd.lucro_liquido_anual;
          valB = b.dados_financeiros_globais_usd.lucro_liquido_anual;
          break;
        case "lucro_5_anos":
          valA = a.dados_financeiros_globais_usd.lucro_liquido_acumulado_5_anos;
          valB = b.dados_financeiros_globais_usd.lucro_liquido_acumulado_5_anos;
          break;
        case "participacao_pct":
          valA = a.dados_financeiros_globais_usd.participacao_erario_brasil_pct;
          valB = b.dados_financeiros_globais_usd.participacao_erario_brasil_pct;
          break;
        case "nome":
          valA = a.nome;
          valB = b.nome;
          break;
        case "desde_ano":
          valA = a.desde_ano;
          valB = b.desde_ano;
          break;
      }

      if (typeof valA === "string") {
        return ordemDesc
          ? (valB as string).localeCompare(valA)
          : (valA as string).localeCompare(valB as string);
      }
      return ordemDesc
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });
  }, [empresasFiltradas, ordenarPor, ordemDesc]);

  // Totais dos cartões (sobre o que está filtrado)
  const totalBrlFiltrado = useMemo(
    () =>
      empresasFiltradas.reduce(
        (acc, e) => acc + e.valores_contratos.total_acumulado_brl,
        0
      ),
    [empresasFiltradas]
  );

  const totalUsdFiltrado = useMemo(
    () =>
      empresasFiltradas.reduce(
        (acc, e) => acc + e.valores_contratos.total_acumulado_usd,
        0
      ),
    [empresasFiltradas]
  );

  const comOffsetCount = useMemo(
    () =>
      empresasFiltradas.filter(
        (e) => e.contrapartidas_e_offsets.possui_contrapartida
      ).length,
    [empresasFiltradas]
  );

  const comOffsetPct =
    empresasFiltradas.length > 0
      ? Math.round((comOffsetCount / empresasFiltradas.length) * 100)
      : 0;

  // Toggle ordenação
  function alternarOrdem(campo: OrdenacaoCampo) {
    if (ordenarPor === campo) {
      setOrdemDesc(!ordemDesc);
    } else {
      setOrdenarPor(campo);
      setOrdemDesc(true);
    }
  }

  // Exportar CSV
  function baixarCsv() {
    const csv = gerarCsvFornecedoresMultinacionais(empresasFiltradas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fornecedores-multinacionais-eua-europa-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Copiar resumo
  function copiarResumo() {
    const texto = [
      `📊 RADAR DE FORNECEDORES MULTINACIONAIS (EUA E EUROPA)`,
      `Empresas exibidas: ${empresasFiltradas.length} de ${empresas.length}`,
      `Total em Contratos: ${formatarMoedaBrl(totalBrlFiltrado)} (${formatarMoedaUsd(totalUsdFiltrado)})`,
      `Possuem Contrapartida / Offset: ${comOffsetPct}% (${comOffsetCount} empresas)`,
      `Fonte oficial: PNCP, Portal da Transparência, SEC (EUA) e IFRS (Europa).`,
      `Consulte a íntegra em: controlepopular.com.br/estado-e-economia/fornecedores-multinacionais`,
    ].join("\n");

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  // Dados para o Gráfico SVG de barras dos maiores contratos
  const topEmpresasGrafico = useMemo(() => {
    return [...empresasFiltradas]
      .sort(
        (a, b) =>
          b.valores_contratos.total_acumulado_brl -
          a.valores_contratos.total_acumulado_brl
      )
      .slice(0, 6);
  }, [empresasFiltradas]);

  const maxGraficoBrl =
    topEmpresasGrafico.length > 0
      ? topEmpresasGrafico[0].valores_contratos.total_acumulado_brl
      : 1;

  return (
    <div className="space-y-8">
      {/* ═══ 1. OS 4 CARTÕES DE TOPO ═══ */}
      <section
        aria-label="Indicadores consolidados dos contratos internacionais"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Total Contratado (R$)
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl font-tabular">
            {formatarMoedaBrl(totalBrlFiltrado)}
          </p>
          <span className="text-[11px] text-text-soft">
            {empresasFiltradas.length} grupos mapeados
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Total em Dólares (US$)
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl font-tabular">
            {formatarMoedaUsd(totalUsdFiltrado)}
          </p>
          <span className="text-[11px] text-text-soft">
            Câmbio médio de registro
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Com Contrapartida (Offset)
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl font-tabular">
            {comOffsetPct}%
          </p>
          <span className="text-[11px] text-text-soft">
            {comOffsetCount} com transferência ou fábrica
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Lock-in Tecnológico
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-amber-600 sm:text-2xl font-tabular">
            {
              empresasFiltradas.filter((e) =>
                e.contrapartidas_e_offsets.dependencia_tecnologica.includes(
                  "Crítica"
                )
              ).length
            }
          </p>
          <span className="text-[11px] text-text-soft">
            Dependência crítica de substituição
          </span>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO SVG INLINE DOS MAIORES CONTRATOS ═══ */}
      <section
        aria-label="Gráfico de distribuição dos maiores volumes contratuais"
        className="rounded-2xl border border-border bg-surface-1 p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-text">
              Maiores Volumes Contratuais no Brasil (R$)
            </h2>
            <p className="text-xs text-text-soft">
              Comparativo dos maiores contratos e atas em vigor com órgãos públicos
            </p>
          </div>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
            Fonte: PNCP & SIAFI
          </span>
        </div>

        {topEmpresasGrafico.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-soft">
            Nenhuma empresa corresponde aos filtros selecionados.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {topEmpresasGrafico.map((empresa) => {
              const pctBarra = Math.max(
                4,
                Math.round(
                  (empresa.valores_contratos.total_acumulado_brl /
                    maxGraficoBrl) *
                    100
                )
              );
              const temOffset =
                empresa.contrapartidas_e_offsets.possui_contrapartida;

              return (
                <div key={empresa.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">
                        {empresa.nome}
                      </span>
                      <span className="text-[11px] text-text-soft">
                        ({empresa.pais_origem})
                      </span>
                      {temOffset && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Offset ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-tabular">
                      <strong className="text-text">
                        {formatarMoedaBrl(
                          empresa.valores_contratos.total_acumulado_brl
                        )}
                      </strong>
                      <span className="text-text-soft">
                        ({formatarMoedaUsd(
                          empresa.valores_contratos.total_acumulado_usd
                        )})
                      </span>
                    </div>
                  </div>

                  {/* Barra SVG/CSS */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        temOffset ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${pctBarra}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ 3. FILTROS E CONTROLES (PADRÃO 5 COISAS) ═══ */}
      <section
        aria-label="Filtros e exportação de dados"
        className="rounded-2xl border border-border bg-surface-1 p-4 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Busca por texto */}
          <div>
            <label
              htmlFor="busca-input"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Buscar empresa, órgão ou objeto
            </label>
            <input
              id="busca-input"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex: Microsoft, Gripen, Vacina, TJ..."
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtro Continente */}
          <div>
            <label
              htmlFor="filtro-continente"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Origem Geográfica
            </label>
            <select
              id="filtro-continente"
              value={continenteFiltro}
              onChange={(e) => setContinenteFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Continentes</option>
              <option value="América do Norte">Estados Unidos (América do Norte)</option>
              <option value="Europa">Europa (Alemanha, França, Suécia)</option>
              <option value="Ásia">Ásia (China)</option>
            </select>
          </div>

          {/* Filtro Setor */}
          <div>
            <label
              htmlFor="filtro-setor"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Setor de Atuação
            </label>
            <select
              id="filtro-setor"
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Setores</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Contrapartida */}
          <div>
            <label
              htmlFor="filtro-contrapartida"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Contrapartida / Offset
            </label>
            <select
              id="filtro-contrapartida"
              value={contrapartidaFiltro}
              onChange={(e) => setContrapartidaFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todas as Situações</option>
              <option value="sim">Possui Contrapartida / Fábrica</option>
              <option value="nao">Sem Contrapartida (Fechado)</option>
            </select>
          </div>
        </div>

        {/* Barra de ações de exportação (CSV, Imprimir, Copiar) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-text-soft">
            Exibindo <strong>{empresasFiltradas.length}</strong> de{" "}
            <strong>{empresas.length}</strong> multinacionais catalogadas
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={baixarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Baixar planilha compatível com Excel (separador ponto-e-vírgula e BOM UTF-8)"
            >
              📥 Baixar Planilha CSV
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Imprimir relatório limpo ou salvar como PDF"
            >
              🖨️ PDF / Imprimir
            </button>

            <button
              onClick={copiarResumo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              title="Copiar resumo dos dados para a área de transferência"
            >
              {copiado ? "✓ Resumo Copiado!" : "📋 Copiar Resumo"}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 4. TABELA COMPLETA COM ORDENAÇÃO POR COLUNAS ═══ */}
      <section
        aria-label="Tabela detalhada de contratos e balanços internacionais"
        className="rounded-2xl border border-border bg-surface-1 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-border bg-surface-2 text-text-soft font-semibold">
              <tr>
                <th
                  onClick={() => alternarOrdem("nome")}
                  className="cursor-pointer px-4 py-3 hover:text-text"
                >
                  <div className="flex items-center gap-1">
                    Empresa / País
                    {ordenarPor === "nome" && (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th className="px-4 py-3">Setor</th>
                <th
                  onClick={() => alternarOrdem("valor_brl")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    Contratos (R$)
                    {ordenarPor === "valor_brl" && (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdem("valor_usd")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    Contratos (US$)
                    {ordenarPor === "valor_usd" && (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdem("lucro_anual")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                  title="Lucro Líquido Anual reportado na SEC (EUA) ou IFRS (Europa)"
                >
                  <div className="flex items-center justify-end gap-1">
                    Lucro Global Anual
                    {ordenarPor === "lucro_anual" && (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdem("lucro_5_anos")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                  title="Lucro Líquido acumulado nos últimos 5 anos"
                >
                  <div className="flex items-center justify-end gap-1">
                    Lucro 5 Anos
                    {ordenarPor === "lucro_5_anos" && (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th
                  onClick={() => alternarOrdem("participacao_pct")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                  title="Participação estimada dos contratos públicos brasileiros na receita global da companhia"
                >
                  <div className="flex items-center justify-end gap-1">
                    % Brasil
                    {ordenarPor === "participacao_pct" &&
                      (ordemDesc ? " ↓" : " ↑")}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Contrapartida</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {empresasOrdenadas.map((empresa) => {
                const isExpandida = empresaExpandida === empresa.id;
                const temOffset =
                  empresa.contrapartidas_e_offsets.possui_contrapartida;

                return (
                  <React.Fragment key={empresa.id}>
                    <tr
                      className={`transition-colors hover:bg-surface-2/60 ${
                        isExpandida ? "bg-surface-2/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text flex items-center gap-1">
                          {empresa.url_portal_compras ? (
                            <a
                              href={empresa.url_portal_compras}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                              title="Consultar contratos no Portal da Transparência"
                            >
                              <span>{empresa.nome}</span>
                              <span className="text-xs">↗</span>
                            </a>
                          ) : (
                            <span>{empresa.nome}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-soft">
                          {empresa.pais_origem} · Ticker:{" "}
                          <span className="font-mono">{empresa.ticker}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-soft">
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px]">
                          {empresa.setor}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-text font-tabular">
                        {formatarMoedaBrl(
                          empresa.valores_contratos.total_acumulado_brl
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-text-soft font-tabular">
                        {formatarMoedaUsd(
                          empresa.valores_contratos.total_acumulado_usd
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-text">
                        {formatarMoedaUsd(
                          empresa.dados_financeiros_globais_usd
                            .lucro_liquido_anual
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-text-soft">
                        {formatarMoedaUsd(
                          empresa.dados_financeiros_globais_usd
                            .lucro_liquido_acumulado_5_anos
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular font-semibold text-primary">
                        {empresa.dados_financeiros_globais_usd.participacao_erario_brasil_pct.toFixed(
                          2
                        )}
                        %
                      </td>
                      <td className="px-4 py-3 text-center">
                        {temOffset ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            setEmpresaExpandida(
                              isExpandida ? null : empresa.id
                            )
                          }
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-3 transition-colors"
                        >
                          {isExpandida ? "Fechar ▲" : "Detalhes ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Linha expandida com raio-x da contratação */}
                    {isExpandida && (
                      <tr className="bg-surface-2/30">
                        <td colSpan={9} className="p-4 sm:p-6 border-b border-border">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Bloco 1: Objeto e Órgãos */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                📦 Objeto & Órgãos Atendidos
                              </h4>
                              <div>
                                <strong className="text-text text-xs">
                                  O que fornece:
                                </strong>
                                <p className="mt-1 text-xs text-text leading-relaxed">
                                  {empresa.objeto_fornecimento}
                                </p>
                              </div>
                              <div>
                                <strong className="text-text text-xs">
                                  Volume e Escala:
                                </strong>
                                <p className="mt-1 text-xs text-text-soft">
                                  {empresa.volume_fornecido}
                                </p>
                              </div>
                              <div>
                                <strong className="text-text text-xs">
                                  Principais Órgãos:
                                </strong>
                                <ul className="mt-1 list-disc list-inside text-xs text-text-soft space-y-0.5">
                                  {empresa.orgaos_atendidos.map((o) => (
                                    <li key={o}>{o}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Bloco 2: Finanças Globais e Histórico */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                📈 Balanço Global (SEC / IFRS)
                              </h4>
                              <div className="rounded-lg bg-surface-1 p-3 border border-border space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Vigência do Contrato:
                                  </span>
                                  <strong className="text-text">
                                    {empresa.desde_ano} até {empresa.vigencia_ate}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Receita Global Anual:
                                  </span>
                                  <span className="font-tabular text-text">
                                    {formatarMoedaUsd(
                                      empresa.dados_financeiros_globais_usd
                                        .receita_anual_global
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Lucro 10 Anos (SEC):
                                  </span>
                                  <span className="font-tabular text-text">
                                    {formatarMoedaUsd(
                                      empresa.dados_financeiros_globais_usd
                                        .lucro_liquido_acumulado_10_anos
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Média Anual Brasil:
                                  </span>
                                  <strong className="font-tabular text-primary">
                                    {formatarMoedaBrl(
                                      empresa.valores_contratos.media_anual_brl
                                    )}
                                  </strong>
                                </div>
                              </div>

                              <div>
                                <strong className="text-text text-xs">
                                  Condições Contratuais:
                                </strong>
                                <p className="mt-1 text-xs text-text-soft">
                                  <span className="font-semibold text-text">Modalidade:</span>{" "}
                                  {empresa.condicoes_contratuais.modalidade_predominante}
                                </p>
                                <p className="mt-0.5 text-xs text-text-soft">
                                  <span className="font-semibold text-text">Garantia / SLA:</span>{" "}
                                  {empresa.condicoes_contratuais.sla_exigido} (Garantia:{" "}
                                  {empresa.condicoes_contratuais.garantia_execucao})
                                </p>
                              </div>
                            </div>

                            {/* Bloco 3: Contrapartidas e Lock-in */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                🛡️ Contrapartidas & Dependência
                              </h4>
                              <div
                                className={`rounded-lg p-3 border text-xs ${
                                  temOffset
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                                    : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                                }`}
                              >
                                <strong>
                                  {temOffset
                                    ? "Compensação Exigida e Cumprida:"
                                    : "Ausência de Contrapartida Tecnológica:"}
                                </strong>
                                <p className="mt-1 leading-relaxed">
                                  {empresa.contrapartidas_e_offsets.descricao}
                                </p>
                              </div>

                              <div>
                                <strong className="text-text text-xs">
                                  Grau de Dependência (*Lock-in*):
                                </strong>
                                <p className="mt-1 text-xs text-text-soft leading-relaxed">
                                  {empresa.contrapartidas_e_offsets.dependencia_tecnologica}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Links Verificados das Fontes Oficiais */}
                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                            <span className="text-xs font-semibold text-text-soft">
                              🔗 Fontes Oficiais Verificadas:
                            </span>
                            {empresa.url_sec_filing && (
                              <a
                                href={empresa.url_sec_filing}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-surface-2 transition-colors"
                                title="Consultar balanço financeiro auditado oficial"
                              >
                                <span>Auditar Balanço Oficial (SEC / Bolsa)</span>
                                <span>↗</span>
                              </a>
                            )}
                            {empresa.url_portal_compras && (
                              <a
                                href={empresa.url_portal_compras}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-surface-2 transition-colors"
                                title="Consultar contratos e pagamentos no Portal da Transparência / PNCP"
                              >
                                <span>Ver Contratos no Portal da Transparência</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
