"use client";

import React, { useState, useMemo } from "react";
import type { ItemNegociacaoInternacional } from "@/lib/negociacoes/acordos-internacionais";
import {
  calcularAgregadosNegociacoes,
  gerarCsvAcordosInternacionais,
} from "@/lib/negociacoes/acordos-internacionais";
import {
  formatarMoedaBrl,
  formatarMoedaUsd,
} from "@/lib/fornecedores/calculos-multinacionais";

interface Props {
  itens: ItemNegociacaoInternacional[];
  dataAtualizacao: string;
}

type OrdenarPor = "valor_brl" | "valor_usd" | "data" | "setor" | "titulo";

export default function PainelAcordosClient({ itens, dataAtualizacao }: Props) {
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [paisFiltro, setPaisFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [itemExpandido, setItemExpandido] = useState<string | null>(null);

  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("valor_brl");
  const [ordemDesc, setOrdemDesc] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // Setores disponíveis
  const setoresDisponiveis = useMemo(() => {
    return Array.from(new Set(itens.map((i) => i.setor_rotulo))).sort();
  }, [itens]);

  // Países disponíveis
  const paisesDisponiveis = useMemo(() => {
    return Array.from(new Set(itens.map((i) => i.pais_lider))).sort();
  }, [itens]);

  // Filtragem
  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      const termo = busca.toLowerCase();
      const bateBusca =
        !busca ||
        item.titulo.toLowerCase().includes(termo) ||
        item.setor_rotulo.toLowerCase().includes(termo) ||
        item.resumo_fato.toLowerCase().includes(termo) ||
        item.paises.some((p) => p.toLowerCase().includes(termo)) ||
        item.entidades_principais.some((e) => e.toLowerCase().includes(termo));

      const bateSetor =
        setorFiltro === "todos" || item.setor_rotulo === setorFiltro;

      const batePais =
        paisFiltro === "todos" || item.pais_lider === paisFiltro;

      const bateTipo =
        tipoFiltro === "todos" || item.tipo_instrumento.includes(tipoFiltro);

      const bateStatus =
        statusFiltro === "todos" || item.status.includes(statusFiltro);

      return bateBusca && bateSetor && batePais && bateTipo && bateStatus;
    });
  }, [itens, busca, setorFiltro, paisFiltro, tipoFiltro, statusFiltro]);

  // Ordenação
  const itensOrdenados = useMemo(() => {
    return [...itensFiltrados].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (ordenarPor) {
        case "valor_brl":
          valA = a.valor_estimado_brl;
          valB = b.valor_estimado_brl;
          break;
        case "valor_usd":
          valA = a.valor_estimado_usd;
          valB = b.valor_estimado_usd;
          break;
        case "data":
          valA = a.data_registro;
          valB = b.data_registro;
          break;
        case "setor":
          valA = a.setor_rotulo;
          valB = b.setor_rotulo;
          break;
        case "titulo":
          valA = a.titulo;
          valB = b.titulo;
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
  }, [itensFiltrados, ordenarPor, ordemDesc]);

  // Agregados para os 4 cartões de topo
  const agregados = useMemo(() => {
    return calcularAgregadosNegociacoes(itensFiltrados);
  }, [itensFiltrados]);

  // Alternar ordenação
  function alternarOrdem(campo: OrdenarPor) {
    if (ordenarPor === campo) {
      setOrdemDesc(!ordemDesc);
    } else {
      setOrdenarPor(campo);
      setOrdemDesc(true);
    }
  }

  // Exportar CSV
  function baixarCsv() {
    const csv = gerarCsvAcordosInternacionais(itensFiltrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acordos-licitacoes-internacionais-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Copiar resumo
  function copiarResumo() {
    const texto = [
      `🌐 ACORDOS & LICITAÇÕES INTERNACIONAIS (BRASIL, EUA & EUROPA)`,
      `Oportunidades mapeadas: ${itensFiltrados.length} projetos`,
      `Volume Estimado: ${formatarMoedaBrl(agregados.valorTotalBrl)} (${formatarMoedaUsd(agregados.valorTotalUsd)})`,
      `Editais e Leilões Abertos: ${agregados.totalEditaisAbertos}`,
      `Setores: Mineração, Energia, Infraestrutura, Saúde, Tecnologia, Educação e Construção.`,
      `Acompanhe a íntegra em: controlepopular.com.br/estado-e-economia/acordos-e-licitacoes-internacionais`,
    ].join("\n");

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  // Dados para o Gráfico SVG de barras dos maiores investimentos
  const topInvestimentos = useMemo(() => {
    return [...itensFiltrados]
      .sort((a, b) => b.valor_estimado_brl - a.valor_estimado_brl)
      .slice(0, 5);
  }, [itensFiltrados]);

  const maxInvestimento =
    topInvestimentos.length > 0 ? topInvestimentos[0].valor_estimado_brl : 1;

  return (
    <div className="space-y-8">
      {/* ═══ 1. OS 4 CARTÕES DE TOPO ═══ */}
      <section
        aria-label="Indicadores gerais de acordos e licitações internacionais"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Investimento Estimado (R$)
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl font-tabular">
            {formatarMoedaBrl(agregados.valorTotalBrl)}
          </p>
          <span className="text-[11px] text-text-soft">
            {itensFiltrados.length} projetos mapeados
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Volume em Dólares (US$)
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl font-tabular">
            {formatarMoedaUsd(agregados.valorTotalUsd)}
          </p>
          <span className="text-[11px] text-text-soft">
            Câmbio de referência oficial
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Editais / Leilões Abertos
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl font-tabular">
            {agregados.totalEditaisAbertos}
          </p>
          <span className="text-[11px] text-text-soft">
            Em disputa ativa na B3 e órgãos
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-text-soft">
            Países Envolvidos
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-text sm:text-2xl font-tabular">
            {agregados.totalPaisesEnvolvidos}
          </p>
          <span className="text-[11px] text-text-soft">
            EUA + 10 principais nações da Europa
          </span>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO SVG INLINE DOS MAIORES INVESTIMENTOS ═══ */}
      <section
        aria-label="Gráfico dos maiores projetos em negociação e leilão"
        className="rounded-2xl border border-border bg-surface-1 p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-text">
              Maiores Projetos, Leilões e Parcerias Internacionais (R$)
            </h2>
            <p className="text-xs text-text-soft">
              Distribuição por volume estimado nos 7 setores estratégicos
            </p>
          </div>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
            Fonte: BNDES, PPI, DOE & Global Gateway
          </span>
        </div>

        {topInvestimentos.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-soft">
            Nenhum projeto encontrado para os filtros selecionados.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {topInvestimentos.map((item) => {
              const pctBarra = Math.max(
                5,
                Math.round((item.valor_estimado_brl / maxInvestimento) * 100)
              );
              const isEdital =
                item.status.includes("Edital") || item.tipo_instrumento.includes("Leilão");

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text truncate max-w-sm sm:max-w-md">
                        {item.titulo}
                      </span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-text-soft">
                        {item.pais_lider}
                      </span>
                      {isEdital && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Edital Aberto ⚡
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-tabular">
                      <strong className="text-text">
                        {formatarMoedaBrl(item.valor_estimado_brl)}
                      </strong>
                      <span className="text-text-soft hidden sm:inline">
                        ({formatarMoedaUsd(item.valor_estimado_usd)})
                      </span>
                    </div>
                  </div>

                  {/* Barra SVG/CSS */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isEdital ? "bg-emerald-500" : "bg-primary"
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
        aria-label="Filtros e exportação de oportunidades e editais"
        className="rounded-2xl border border-border bg-surface-1 p-4 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Busca textual */}
          <div>
            <label
              htmlFor="busca-input"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Buscar por termo, mineral, órgão ou cidade
            </label>
            <input
              id="busca-input"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex: Lítio, Pecém, Hidrogênio, BNDES, Acciona..."
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtro Setor */}
          <div>
            <label
              htmlFor="filtro-setor"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Setor Estratégico
            </label>
            <select
              id="filtro-setor"
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os 7 Setores</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro País Líder */}
          <div>
            <label
              htmlFor="filtro-pais"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              País Parceiro
            </label>
            <select
              id="filtro-pais"
              value={paisFiltro}
              onChange={(e) => setPaisFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Países</option>
              {paisesDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Instrumento */}
          <div>
            <label
              htmlFor="filtro-status"
              className="block text-xs font-semibold text-text-soft mb-1"
            >
              Estágio da Oportunidade
            </label>
            <select
              id="filtro-status"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-0 px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Estágios</option>
              <option value="Edital">Edital Aberto / Disputa Ativa</option>
              <option value="Acordo">Acordo Firmado / Em Implantação</option>
              <option value="Negociação">Em Negociação Bilateral</option>
            </select>
          </div>
        </div>

        {/* Barra de ações de exportação */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-text-soft">
            Exibindo <strong>{itensFiltrados.length}</strong> de{" "}
            <strong>{itens.length}</strong> projetos e editais internacionais
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={baixarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Baixar planilha CSV compatível com Excel"
            >
              📥 Baixar Planilha CSV
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              title="Imprimir relatório limpo ou exportar para PDF"
            >
              🖨️ PDF / Imprimir
            </button>

            <button
              onClick={copiarResumo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              {copiado ? "✓ Resumo Copiado!" : "📋 Copiar Resumo"}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ 4. TABELA COMPLETA COM ORDENAÇÃO POR COLUNAS ═══ */}
      <section
        aria-label="Tabela detalhada de acordos, leilões e licitações internacionais"
        className="rounded-2xl border border-border bg-surface-1 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-border bg-surface-2 text-text-soft font-semibold">
              <tr>
                <th
                  onClick={() => alternarOrdem("titulo")}
                  className="cursor-pointer px-4 py-3 hover:text-text"
                >
                  Título / Projeto {ordenarPor === "titulo" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("setor")}
                  className="cursor-pointer px-4 py-3 hover:text-text"
                >
                  Setor {ordenarPor === "setor" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th className="px-4 py-3">Países Parceiros</th>
                <th className="px-4 py-3">Instrumento</th>
                <th
                  onClick={() => alternarOrdem("valor_brl")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Valor Estimado (R$) {ordenarPor === "valor_brl" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th
                  onClick={() => alternarOrdem("valor_usd")}
                  className="cursor-pointer px-4 py-3 text-right hover:text-text"
                >
                  Volume (US$) {ordenarPor === "valor_usd" && (ordemDesc ? " ↓" : " ↑")}
                </th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itensOrdenados.map((item) => {
                const isExpandido = itemExpandido === item.id;
                const isEdital =
                  item.status.includes("Edital") || item.tipo_instrumento.includes("Leilão");

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`transition-colors hover:bg-surface-2/60 ${
                        isExpandido ? "bg-surface-2/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-text">
                          <a
                            href={item.fonte_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            title={`Consultar fonte oficial: ${item.fonte_nome}`}
                          >
                            <span>{item.titulo}</span>
                            <span className="text-xs">↗</span>
                          </a>
                        </div>
                        <div className="text-[11px] text-text-soft truncate mt-0.5">
                          {item.entidades_principais.slice(0, 3).join(" · ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-soft">
                        <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px]">
                          {item.setor_rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text">
                        <span className="font-semibold text-primary">
                          {item.pais_lider}
                        </span>{" "}
                        <span className="text-[11px] text-text-soft">
                          ({item.paises.filter((p) => p !== item.pais_lider).join(", ")})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-soft text-[11px]">
                        {item.tipo_instrumento}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-text font-tabular">
                        {formatarMoedaBrl(item.valor_estimado_brl)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-soft font-tabular">
                        {formatarMoedaUsd(item.valor_estimado_usd)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEdital ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Disputa Aberta
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                            {item.status.split("/")[0]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            setItemExpandido(isExpandido ? null : item.id)
                          }
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-3 transition-colors"
                        >
                          {isExpandido ? "Fechar ▲" : "Pronunciamentos ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Expansão com raio-x da negociação e pronunciamentos */}
                    {isExpandido && (
                      <tr className="bg-surface-2/30">
                        <td colSpan={8} className="p-4 sm:p-6 border-b border-border">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Bloco 1: Fato e Entidades */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                📌 Contexto & Entidades Envolvidas
                              </h4>
                              <p className="text-xs text-text leading-relaxed">
                                {item.resumo_fato}
                              </p>
                              <div className="pt-2">
                                <strong className="text-text text-xs">
                                  Entidades e Ministérios:
                                </strong>
                                <ul className="mt-1 list-disc list-inside text-xs text-text-soft space-y-0.5">
                                  {item.entidades_principais.map((ent, idx) => (
                                    <li key={idx}>{ent}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Bloco 2: Pronunciamentos Oficiais */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                📢 Pronunciamentos Oficiais Verbatim
                              </h4>
                              <blockquote className="rounded-lg bg-surface-1 p-3 border-l-4 border-primary text-xs italic text-text leading-relaxed">
                                "{item.pronunciamentos_oficiais}"
                              </blockquote>
                              <div className="text-[11px] text-text-soft pt-1">
                                <span>Fonte Oficial Registrada: </span>
                                <a
                                  href={item.fonte_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80 font-medium"
                                >
                                  {item.fonte_nome} ↗
                                </a>
                              </div>
                            </div>

                            {/* Bloco 3: Contrapartidas e Impacto Social */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-text-soft">
                                🛡️ Contrapartidas & Salvaguardas Cívicas
                              </h4>
                              <div className="rounded-lg bg-surface-1 p-3 border border-border text-xs text-text leading-relaxed">
                                <strong>Condições e Contrapartidas Exigidas:</strong>
                                <p className="mt-1 text-text-soft">
                                  {item.contrapartidas_e_impacto_social}
                                </p>
                              </div>
                              <div className="text-[11px] text-text-soft">
                                Data do registro oficial: <strong>{item.data_registro}</strong>
                              </div>
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
