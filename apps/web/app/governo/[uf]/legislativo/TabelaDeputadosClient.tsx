"use client";

import React, { useState, useMemo } from "react";
import type {
  AssembleiaEstadual,
  DeputadoEstadual,
} from "@/lib/legislativo/ranking-estadual";
import {
  calcularAgregadosAssembleia,
  gerarCsvDeputadosEstaduais,
} from "@/lib/legislativo/ranking-estadual";
import { formatarMoedaBrl } from "@/lib/fornecedores/calculos-multinacionais";

interface Props {
  assembleia: AssembleiaEstadual;
}

type OrdenarCampo =
  | "ranking"
  | "pontuacao"
  | "presenca"
  | "coerencia"
  | "projetos"
  | "requerimentos"
  | "gasto_cota"
  | "assessores"
  | "nome";

export default function TabelaDeputadosClient({ assembleia }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroPartido, setFiltroPartido] = useState("todos");
  const [filtroBloco, setFiltroBloco] = useState("todos");
  const [deputadoExpandido, setDeputadoExpandido] = useState<string | null>(null);

  const [ordenarPor, setOrdenarPor] = useState<OrdenarCampo>("ranking");
  const [ordemDesc, setOrdemDesc] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Lista única de partidos
  const partidosDisponiveis = useMemo(() => {
    return Array.from(new Set(assembleia.deputados.map((d) => d.partido))).sort();
  }, [assembleia.deputados]);

  // Lista única de blocos
  const blocosDisponiveis = useMemo(() => {
    return Array.from(new Set(assembleia.deputados.map((d) => d.bloco))).sort();
  }, [assembleia.deputados]);

  // Filtragem
  const deputadosFiltrados = useMemo(() => {
    return assembleia.deputados.filter((d) => {
      const termo = busca.toLowerCase();
      const bateBusca =
        !busca ||
        d.nome.toLowerCase().includes(termo) ||
        d.partido.toLowerCase().includes(termo) ||
        d.municipio_origem.toLowerCase().includes(termo) ||
        d.cargo_mesa.toLowerCase().includes(termo);

      const batePartido =
        filtroPartido === "todos" || d.partido === filtroPartido;

      const bateBloco =
        filtroBloco === "todos" || d.bloco === filtroBloco;

      return bateBusca && batePartido && bateBloco;
    });
  }, [assembleia.deputados, busca, filtroPartido, filtroBloco]);

  // Ordenação
  const deputadosOrdenados = useMemo(() => {
    return [...deputadosFiltrados].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (ordenarPor) {
        case "ranking":
          valA = a.atividade.posicao_ranking;
          valB = b.atividade.posicao_ranking;
          break;
        case "pontuacao":
          valA = a.atividade.pontuacao_garantista;
          valB = b.atividade.pontuacao_garantista;
          break;
        case "presenca":
          valA = a.atividade.presenca_plenario_pct;
          valB = b.atividade.presenca_plenario_pct;
          break;
        case "coerencia":
          valA = a.atividade.coerencia_pct;
          valB = b.atividade.coerencia_pct;
          break;
        case "projetos":
          valA = a.atividade.projetos_apresentados;
          valB = b.atividade.projetos_apresentados;
          break;
        case "requerimentos":
          valA = a.atividade.requerimentos_fiscalizacao;
          valB = b.atividade.requerimentos_fiscalizacao;
          break;
        case "gasto_cota":
          valA = a.remuneracao.gasto_cota_acumulado_ano;
          valB = b.remuneracao.gasto_cota_acumulado_ano;
          break;
        case "assessores":
          valA = a.gabinete.total_assessores_comissionados;
          valB = b.gabinete.total_assessores_comissionados;
          break;
        case "nome":
          valA = a.nome;
          valB = b.nome;
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
  }, [deputadosFiltrados, ordenarPor, ordemDesc]);

  // Agregados para os 4 cartões de topo
  const agregados = useMemo(() => {
    return calcularAgregadosAssembleia(deputadosFiltrados);
  }, [deputadosFiltrados]);

  // Alternar ordenação
  function alternarOrdem(campo: OrdenarCampo) {
    if (ordenarPor === campo) {
      setOrdemDesc(!ordemDesc);
    } else {
      setOrdenarPor(campo);
      // Posição no ranking ordena por padrão crescente (1º lugar primeiro)
      setOrdemDesc(campo === "ranking" ? false : true);
    }
  }

  // Exportar CSV
  function baixarCsv() {
    const csv = gerarCsvDeputadosEstaduais(
      deputadosFiltrados,
      assembleia.sigla
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deputados-${assembleia.sigla.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Copiar resumo
  function copiarResumo() {
    const texto = [
      `🏛️ ATUAÇÃO PARLAMENTAR - ${assembleia.sigla} (${assembleia.nome_uf})`,
      `Deputados filtrados: ${deputadosFiltrados.length} de ${assembleia.total_cadeiras}`,
      `Média de Presença em Plenário: ${agregados.mediaPresencaPct}%`,
      `Gasto Total com Cota no Período: ${formatarMoedaBrl(agregados.totalGastoCotaBrl)}`,
      `Projetos de Lei Apresentados: ${agregados.totalProjetosApresentados}`,
      `Requerimentos de Fiscalização: ${agregados.totalRequerimentosFiscalizacao}`,
      `Metodologia garantista e dados abertos em: controlepopular.com.br/governo/${assembleia.uf}/legislativo`,
    ].join("\n");

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  // Maiores pontuações para o gráfico
  const topRanking = useMemo(() => {
    return [...deputadosFiltrados]
      .sort(
        (a, b) =>
          b.atividade.pontuacao_garantista - a.atividade.pontuacao_garantista
      )
      .slice(0, 5);
  }, [deputadosFiltrados]);

  return (
    <div className="space-y-8">
      {/* ═══ 1. OS 4 CARTÕES DE TOPO ═══ */}
      <section
        aria-label="Indicadores gerais da Assembleia Legislativa"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Deputados Mapeados
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl font-tabular">
            {deputadosFiltrados.length}
          </p>
          <span className="text-[11px] text-text-soft">
            de {assembleia.total_cadeiras} cadeiras na {assembleia.sigla}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Média de Presença
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl font-tabular">
            {agregados.mediaPresencaPct}%
          </p>
          <span className="text-[11px] text-text-soft">
            Presença nominal em plenário
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Total Cota / Verba
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl font-tabular">
            {formatarMoedaBrl(agregados.totalGastoCotaBrl)}
          </p>
          <span className="text-[11px] text-text-soft">
            Gastos reembolsados no ano
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Fiscalizações Ativas
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl font-tabular">
            {agregados.totalRequerimentosFiscalizacao}
          </p>
          <span className="text-[11px] text-text-soft">
            Requerimentos a secretarias
          </span>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO SVG INLINE DE ATUAÇÃO E GASTOS ═══ */}
      <section
        aria-label="Gráfico de pontuação garantista de direitos"
        className="rounded-2xl border border-border bg-surface-1 p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-text">
              Líderes em Atuação Garantista de Direitos
            </h2>
            <p className="text-xs text-text-soft">
              Pontuação equilibrada: produção positiva descontada proporcionalmente por faltas não justificadas
            </p>
          </div>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
            Régua Cívica Garantista
          </span>
        </div>

        {topRanking.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-soft">
            Nenhum parlamentar encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {topRanking.map((deputado) => {
              const pontuacao = deputado.atividade.pontuacao_garantista;
              return (
                <div key={deputado.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">
                        {deputado.atividade.posicao_ranking}º {deputado.nome}
                      </span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-text-soft font-mono">
                        {deputado.partido}
                      </span>
                      <span className="text-[11px] text-text-soft hidden sm:inline">
                        ({deputado.municipio_origem})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-tabular">
                      <strong className="text-primary">{pontuacao.toFixed(1)} pts</strong>
                      <span className="text-text-soft">
                        {deputado.atividade.presenca_plenario_pct}% presença
                      </span>
                    </div>
                  </div>

                  {/* Barra SVG/CSS */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, pontuacao))}%` }}
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
        aria-label="Filtros da bancada parlamentar"
        className="rounded-2xl border border-border bg-surface-1 p-4 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Busca textual */}
          <div>
            <label
              htmlFor="busca-deputado"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Buscar por nome, cidade ou comissão
            </label>
            <input
              id="busca-deputado"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex: Beatriz, Montes Claros, Educação..."
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtro Partido */}
          <div>
            <label
              htmlFor="filtro-partido"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Partido Político
            </label>
            <select
              id="filtro-partido"
              value={filtroPartido}
              onChange={(e) => setFiltroPartido(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Partidos</option>
              {partidosDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Bloco */}
          <div>
            <label
              htmlFor="filtro-bloco"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Bloco Parlamentar / Aliança
            </label>
            <select
              id="filtro-bloco"
              value={filtroBloco}
              onChange={(e) => setFiltroBloco(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Blocos</option>
              {blocosDisponiveis.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-text-soft">
            Exibindo <strong>{deputadosFiltrados.length}</strong> parlamentares
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={baixarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Baixar planilha CSV com BOM UTF-8 compatível com Excel"
            >
              📥 Baixar Planilha CSV
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Imprimir ou gerar PDF"
            >
              🖨️ PDF / Imprimir
            </button>

            <button
              onClick={copiarResumo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              {copiado ? "✓ Copiado!" : "📋 Copiar Resumo"}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 4. TABELA COMPLETA COM ORDENAÇÃO POR COLUNAS ═══ */}
      <section
        aria-label="Tabela detalhada de deputados estaduais"
        className="rounded-2xl border border-border bg-surface-1 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-border bg-surface-2 text-text-soft font-semibold">
              <tr>
                <th
                  onClick={() => alternarOrdem("ranking")}
                  className="cursor-pointer px-4 py-3 hover:text-text text-center w-16"
                >
                  Posição {ordenarPor === "ranking" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("nome")}
                  className="cursor-pointer px-4 py-3 hover:text-text"
                >
                  Deputado(a) / Partido {ordenarPor === "nome" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("pontuacao")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Pontuação {ordenarPor === "pontuacao" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("presenca")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Presença {ordenarPor === "presenca" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("projetos")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Projetos {ordenarPor === "projetos" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("requerimentos")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Fiscalizações {ordenarPor === "requerimentos" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("gasto_cota")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Cota / Verba {ordenarPor === "gasto_cota" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th className="px-4 py-3 text-center">Gabinete</th>
                <th className="px-4 py-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deputadosOrdenados.map((d) => {
                const isExpandido = deputadoExpandido === d.id;

                return (
                  <React.Fragment key={d.id}>
                    <tr
                      className={`transition-colors hover:bg-surface-2/60 ${
                        isExpandido ? "bg-surface-2/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center font-bold text-text font-tabular">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs">
                          {d.atividade.posicao_ranking}º
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {d.url_perfil_oficial ? (
                            <a
                              href={d.url_perfil_oficial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                              title={`Abrir perfil oficial de ${d.nome} na ${assembleia.sigla}`}
                            >
                              <span>{d.nome}</span>
                              <span className="text-xs">↗</span>
                            </a>
                          ) : (
                            <span className="font-semibold text-text">{d.nome}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-soft">
                          <span className="font-mono font-bold text-primary">
                            {d.partido}
                          </span>{" "}
                          · {d.municipio_origem} · {d.cargo_mesa}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary font-tabular">
                        {d.atividade.pontuacao_garantista.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-text">
                        <span
                          className={
                            d.atividade.presenca_plenario_pct >= 90
                              ? "text-emerald-600 font-semibold"
                              : "text-amber-600 font-semibold"
                          }
                        >
                          {d.atividade.presenca_plenario_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-text">
                        {d.atividade.projetos_apresentados}{" "}
                        <span className="text-[10px] text-text-soft">
                          ({d.atividade.projetos_aprovados} aprovados)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-text">
                        {d.atividade.requerimentos_fiscalizacao}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular font-semibold text-text">
                        {formatarMoedaBrl(d.remuneracao.gasto_cota_acumulado_ano)}
                      </td>
                      <td className="px-4 py-3 text-center text-text-soft font-tabular">
                        {d.gabinete.total_assessores_comissionados} assessores
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            setDeputadoExpandido(isExpandido ? null : d.id)
                          }
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-3 transition-colors"
                        >
                          {isExpandido ? "Fechar ▲" : "Ver Raio-X ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Expansão com raio-x da atuação e custos */}
                    {isExpandido && (
                      <tr className="bg-surface-2/30">
                        <td colSpan={9} className="p-4 sm:p-6 border-b border-border">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Bloco 1: Remuneração e Gabinete */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                💰 Remuneração & Custo de Gabinete
                              </h4>
                              <div className="rounded-lg bg-surface-1 p-3 border border-border space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Subsídio Bruto Mensal:
                                  </span>
                                  <strong className="text-text font-tabular">
                                    {formatarMoedaBrl(
                                      d.remuneracao.subsidio_bruto_mensal
                                    )}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Assessores Comissionados:
                                  </span>
                                  <span className="text-text">
                                    {d.gabinete.total_assessores_comissionados}{" "}
                                    cargos
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Folha Mensal de Gabinete:
                                  </span>
                                  <strong className="text-text font-tabular">
                                    {formatarMoedaBrl(
                                      d.gabinete.custo_folha_mensal
                                    )}
                                  </strong>
                                </div>
                                <div className="flex justify-between border-t border-border pt-1">
                                  <span className="text-text-soft">
                                    Cota Reembolsada no Ano:
                                  </span>
                                  <strong className="text-primary font-tabular">
                                    {formatarMoedaBrl(
                                      d.remuneracao.gasto_cota_acumulado_ano
                                    )}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* Bloco 2: Destino da Cota / Verba Indenizatória */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                🧾 Maiores Gastos de Cota do Gabinete
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                {d.maiores_despesas_cota.map((despesa, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded bg-surface-1 p-2 border border-border"
                                  >
                                    <span className="text-text-soft truncate max-w-[180px]">
                                      {despesa.categoria}
                                    </span>
                                    <strong className="text-text font-tabular ml-2">
                                      {formatarMoedaBrl(despesa.valor_brl)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Bloco 3: Atuação Legislativa e Coerência */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                ⚖️ Atuação Legislativa e Fiscalização
                              </h4>
                              <div className="rounded-lg bg-surface-1 p-3 border border-border space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Projetos Apresentados:
                                  </span>
                                  <strong className="text-text">
                                    {d.atividade.projetos_apresentados} (
                                    {d.atividade.projetos_aprovados} aprovados)
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Requerimentos Enviados:
                                  </span>
                                  <strong className="text-text">
                                    {d.atividade.requerimentos_fiscalizacao}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-soft">
                                    Taxa de Coerência Garantista:
                                  </span>
                                  <span className="font-semibold text-emerald-600">
                                    {d.atividade.coerencia_pct}%
                                  </span>
                                </div>
                                <div className="border-t border-border pt-1 text-[11px] text-text-soft">
                                  Aliança: <em>{d.bloco}</em>
                                </div>
                              </div>
                              {d.url_perfil_oficial && (
                                <div className="pt-2">
                                  <a
                                    href={d.url_perfil_oficial}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    <span>Ver Perfil Oficial na {assembleia.sigla}</span>
                                    <span>↗</span>
                                  </a>
                                </div>
                              )}
                            </div>
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
