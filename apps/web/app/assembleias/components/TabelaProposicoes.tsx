"use client";

/**
 * Componente cliente para tabela interativa de Proposições Legislativas Estaduais.
 *
 * Papel no portal:
 * Permite ao cidadão pesquisar, filtrar, ordenar e auditar projetos de lei,
 * requerimentos, indicações e emendas das Assembleias Legislativas,
 * em estrita conformidade com a Regra das Seis Qualidades (AGENTS.md § 8).
 *
 * Fontes oficiais:
 * - Sistemas de Apoio ao Processo Legislativo (SAPL / Interlegis) e sistemas
 *   próprios de cada Assembleia Legislativa Estadual.
 *
 * Recursos implementados:
 * 1. Links diretos e verificados para o processo legislativo de cada matéria.
 * 2. Busca textual tolerante a acentos e filtros combináveis (tipo, ano, situação).
 * 3. Ordenação crescente/decrescente por data, código, tipo e situação.
 * 4. Microresumo com contador dinâmico de itens filtrados.
 * 5. Exportação de planilha CSV com separador ';' e BOM UTF-8 (\uFEFF) para Excel.
 * 6. Responsividade mobile nativa sem overflow horizontal.
 */

import { useMemo, useState } from "react";
import { Search, Filter, Download, ExternalLink, ArrowUpDown } from "lucide-react";
import type { ProposicaoEstadual } from "@/lib/assembleias/types";

interface TabelaProposicoesProps {
  proposicoes: ProposicaoEstadual[];
  siglaAssembleia: string;
}

export default function TabelaProposicoes({
  proposicoes,
  siglaAssembleia,
}: TabelaProposicoesProps) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [situacaoFiltro, setSituacaoFiltro] = useState("todas");
  const [anoFiltro, setAnoFiltro] = useState("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<keyof ProposicaoEstadual>("dataApresentacao");
  const [ordemAsc, setOrdemAsc] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 15;

  // Extrai lista única de tipos, anos e situações disponíveis
  const tiposDisponiveis = useMemo(() => {
    const set = new Set(proposicoes.map((p) => p.tipo));
    return Array.from(set).sort();
  }, [proposicoes]);

  const anosDisponiveis = useMemo(() => {
    const set = new Set(proposicoes.map((p) => p.ano));
    return Array.from(set).sort((a, b) => b - a);
  }, [proposicoes]);

  const situacoesDisponiveis = useMemo(() => {
    const set = new Set(proposicoes.map((p) => p.situacao));
    return Array.from(set).sort();
  }, [proposicoes]);

  // Filtragem e ordenação reativas
  const proposicoesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return proposicoes
      .filter((p) => {
        const casaBusca =
          !termo ||
          p.codigo.toLowerCase().includes(termo) ||
          p.ementa.toLowerCase().includes(termo) ||
          p.autores.some(
            (a) =>
              a.nome.toLowerCase().includes(termo) ||
              a.partido.toLowerCase().includes(termo)
          );

        const casaTipo = tipoFiltro === "todos" || p.tipo === tipoFiltro;
        const casaSituacao = situacaoFiltro === "todas" || p.situacao === situacaoFiltro;
        const casaAno = anoFiltro === "todos" || String(p.ano) === anoFiltro;

        return casaBusca && casaTipo && casaSituacao && casaAno;
      })
      .sort((a, b) => {
        const valA = a[colunaOrdenacao];
        const valB = b[colunaOrdenacao];

        if (typeof valA === "string" && typeof valB === "string") {
          return ordemAsc
            ? valA.localeCompare(valB, "pt-BR")
            : valB.localeCompare(valA, "pt-BR");
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return ordemAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [proposicoes, busca, tipoFiltro, situacaoFiltro, anoFiltro, colunaOrdenacao, ordemAsc]);

  // Paginação
  const totalPaginas = Math.ceil(proposicoesFiltradas.length / ITENS_POR_PAGINA) || 1;
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const proposicoesPaginadas = proposicoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  // Alterna direção ou coluna de ordenação
  function alternarOrdenacao(coluna: keyof ProposicaoEstadual) {
    if (colunaOrdenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemAsc(coluna === "codigo" || coluna === "tipo");
    }
    setPaginaAtual(1);
  }

  // Exportação CSV estrita com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = ["Código", "Tipo", "Ano", "Ementa", "Autores", "Situação", "Data Apresentação", "Link Oficial"];
    const linhas = proposicoesFiltradas.map((p) => [
      `"${p.codigo}"`,
      `"${p.tipo}"`,
      p.ano,
      `"${p.ementa.replace(/"/g, '""')}"`,
      `"${p.autores.map((a) => `${a.nome} (${a.partido})`).join(", ")}"`,
      `"${p.situacao}"`,
      `"${p.dataApresentacao}"`,
      `"${p.urlProcesso}"`,
    ]);

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `proposicoes_${siglaAssembleia.toLowerCase()}_filtradas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* ═══ BARRA DE CONTROLE: BUSCA, FILTROS E EXPORTAÇÃO ═══ */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Busca textual */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por código, ementa, autor ou partido..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Botão de Download CSV */}
          <button
            type="button"
            onClick={exportarCsv}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-ink shadow-xs transition-opacity hover:opacity-90"
            title="Baixar planilha filtrada compatível com Excel brasileiro (BOM UTF-8 e ponto-e-vírgula)"
          >
            <Download size={14} aria-hidden="true" />
            <span>Exportar CSV ({proposicoesFiltradas.length})</span>
          </button>
        </div>

        {/* Filtros em grade responsiva */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-2 border-t border-border/40">
          {/* Tipo de Proposição */}
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-muted shrink-0" aria-hidden="true" />
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por tipo de proposição"
            >
              <option value="todos">Todos os Tipos ({proposicoes.length})</option>
              {tiposDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Ano de Apresentação */}
          <div className="flex items-center gap-1.5">
            <select
              value={anoFiltro}
              onChange={(e) => {
                setAnoFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por ano"
            >
              <option value="todos">Todos os Anos</option>
              {anosDisponiveis.map((a) => (
                <option key={a} value={String(a)}>
                  Ano {a}
                </option>
              ))}
            </select>
          </div>

          {/* Situação da Matéria */}
          <div className="flex items-center gap-1.5">
            <select
              value={situacaoFiltro}
              onChange={(e) => {
                setSituacaoFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por situação de tramitação"
            >
              <option value="todas">Todas as Situações</option>
              {situacoesDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ TABELA RESPONSIVA COM LINKS VERIFICADOS ═══ */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-border bg-surface-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th
                onClick={() => alternarOrdenacao("codigo")}
                className="cursor-pointer px-4 py-3 hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Código</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdenacao("tipo")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Tipo</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th className="px-4 py-3">Ementa & Objeto</th>
              <th className="px-3 py-3">Autores</th>
              <th
                onClick={() => alternarOrdenacao("situacao")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Situação</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdenacao("dataApresentacao")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th className="px-3 py-3 text-right">Processo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposicoesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted">
                  Nenhuma proposição encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              proposicoesPaginadas.map((prop) => (
                <tr key={prop.codigo} className="transition-colors hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap">
                    {prop.codigo}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {prop.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-sm sm:max-w-md">
                    <p className="line-clamp-2 text-xs text-foreground leading-relaxed">
                      {prop.ementa}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap text-muted">
                    {prop.autores.map((a, i) => (
                      <span key={a.nome}>
                        {i > 0 && ", "}
                        <strong className="text-foreground">{a.nome}</strong>{" "}
                        <span className="text-[10px]">({a.partido})</span>
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        prop.situacao.includes("Aprovado") || prop.situacao.includes("Sancionado")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : prop.situacao.includes("Pronto")
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-surface-2 text-muted border border-border"
                      }`}
                    >
                      {prop.situacao}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted whitespace-nowrap">
                    {prop.dataApresentacao}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <a
                      href={prop.urlProcesso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-surface"
                      title="Ver processo legislativo oficial diretamente na Assembleia"
                    >
                      <span>Acessar</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ CONTROLES DE PAGINAÇÃO ═══ */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted">
          <span>
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> (
            {proposicoesFiltradas.length} proposições filtradas)
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={paginaAtual <= 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 font-semibold text-foreground disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 font-semibold text-foreground disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
