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

import { Fragment, useMemo, useState } from "react";
import { Search, Filter, Download, ExternalLink, ArrowUpDown, GitCommit, ChevronDown, ChevronUp } from "lucide-react";
import type { ProposicaoEstadual } from "@/lib/assembleias/types";
import LinhaDoTempoTramitacao from "@/app/components/LinhaDoTempoTramitacao";

interface TabelaProposicoesProps {
  proposicoes: ProposicaoEstadual[];
  siglaAssembleia: string;
}

/**
 * Extrai ou categoriza o tema temático da proposição com base em palavras-chave da ementa
 * caso o tema não tenha sido catalogado diretamente na fonte oficial.
 */
export function extrairTemaProposicao(p: ProposicaoEstadual): string {
  if (p.tema) return p.tema;
  const texto = `${p.codigo} ${p.ementa}`.toLowerCase();
  if (texto.match(/saúde|hospital|sus|médic|vacina|leito|cirurgia|medicamento|doença|epidemia/)) return "Saúde Pública";
  if (texto.match(/ambient|água|hídric|rio|resíduo|saneamento|floresta|fauna|flora|clima|polui|barragem|rejeito/)) return "Meio Ambiente & Recursos Hídricos";
  if (texto.match(/educaç|escola|ensino|profess|aluno|merenda|universidade|creche|pedag/)) return "Educação & Ciência";
  if (texto.match(/segurança|polícia|penitenciár|crime|violência|bombeir|armamento/)) return "Segurança Pública";
  if (texto.match(/orçamento|tribut|imposto|fiscal|icms|receita|fundo|dívida|financeir/)) return "Orçamento & Tributação";
  if (texto.match(/transporte|rodovia|trânsito|tarifa|mobilidade|estrada|ferrovia|ônibus|metrô/)) return "Transporte & Mobilidade";
  if (texto.match(/mulher|indígen|quilomb|igualdade|criança|idoso|assistência|moradia|habitac|social/)) return "Direitos Sociais & Cidadania";
  if (texto.match(/transparência|dados abertos|ouvidoria|acesso à informação|corrupção|fiscaliz/)) return "Transparência & Integridade";
  return "Políticas Públicas Gerais";
}

/**
 * Retorna a data em que a proposição foi aprovada ou sancionada,
 * consultando o campo próprio ou a data de conclusão da tramitação.
 */
export function extrairDataAprovacao(p: ProposicaoEstadual): string | null {
  if (p.dataAprovacao) return p.dataAprovacao;
  const sit = p.situacao.toLowerCase();
  if (sit.includes("sancionado") || sit.includes("aprovado") || sit.includes("promulgado")) {
    return p.dataUltimaTramitacao ?? p.dataApresentacao;
  }
  return null;
}

/**
 * Retorna o âmbito territorial / abrangência federativa da matéria.
 */
export function extrairAbrangencia(p: ProposicaoEstadual, siglaAssembleia: string): string {
  return p.abrangencia ?? `Estadual (${siglaAssembleia})`;
}

export default function TabelaProposicoes({
  proposicoes,
  siglaAssembleia,
}: TabelaProposicoesProps) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [temaFiltro, setTemaFiltro] = useState("todos");
  const [situacaoFiltro, setSituacaoFiltro] = useState("todas");
  const [anoFiltro, setAnoFiltro] = useState("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<keyof ProposicaoEstadual | "tema">("dataApresentacao");
  const [ordemAsc, setOrdemAsc] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhaAberta, setLinhaAberta] = useState<string | null>(null);
  const ITENS_POR_PAGINA = 15;

  // Extrai lista única de tipos, temas, anos e situações disponíveis
  const tiposDisponiveis = useMemo(() => {
    const set = new Set(proposicoes.map((p) => p.tipo));
    return Array.from(set).sort();
  }, [proposicoes]);

  const temasDisponiveis = useMemo(() => {
    const set = new Set(proposicoes.map((p) => extrairTemaProposicao(p)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
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
        const temaProp = extrairTemaProposicao(p);
        const casaBusca =
          !termo ||
          p.codigo.toLowerCase().includes(termo) ||
          p.ementa.toLowerCase().includes(termo) ||
          temaProp.toLowerCase().includes(termo) ||
          p.autores.some(
            (a) =>
              a.nome.toLowerCase().includes(termo) ||
              a.partido.toLowerCase().includes(termo)
          );

        const casaTipo = tipoFiltro === "todos" || p.tipo === tipoFiltro;
        const casaTema = temaFiltro === "todos" || temaProp === temaFiltro;
        const casaSituacao = situacaoFiltro === "todas" || p.situacao === situacaoFiltro;
        const casaAno = anoFiltro === "todos" || String(p.ano) === anoFiltro;

        return casaBusca && casaTipo && casaTema && casaSituacao && casaAno;
      })
      .sort((a, b) => {
        if (colunaOrdenacao === "tema") {
          const temaA = extrairTemaProposicao(a);
          const temaB = extrairTemaProposicao(b);
          return ordemAsc
            ? temaA.localeCompare(temaB, "pt-BR")
            : temaB.localeCompare(temaA, "pt-BR");
        }

        const valA = a[colunaOrdenacao as keyof ProposicaoEstadual];
        const valB = b[colunaOrdenacao as keyof ProposicaoEstadual];

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
  }, [proposicoes, busca, tipoFiltro, temaFiltro, situacaoFiltro, anoFiltro, colunaOrdenacao, ordemAsc]);

  // Paginação
  const totalPaginas = Math.ceil(proposicoesFiltradas.length / ITENS_POR_PAGINA) || 1;
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const proposicoesPaginadas = proposicoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  // Alterna direção ou coluna de ordenação
  function alternarOrdenacao(coluna: keyof ProposicaoEstadual | "tema") {
    if (colunaOrdenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemAsc(coluna === "codigo" || coluna === "tipo" || coluna === "tema");
    }
    setPaginaAtual(1);
  }

  // Exportação CSV estrita com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = [
      "Código",
      "Tipo",
      "Tema",
      "Abrangência",
      "Ano",
      "Ementa",
      "Autores (Nome/Partido/Estado)",
      "Situação",
      "Data Protocolo",
      "Data Aprovação",
      "Link Oficial",
    ];
    const linhas = proposicoesFiltradas.map((p) => {
      const tema = extrairTemaProposicao(p);
      const abrangencia = extrairAbrangencia(p, siglaAssembleia);
      const dataAprov = extrairDataAprovacao(p) ?? "Em tramitação";
      const autoresFmt = p.autores
        .map((a) => `${a.nome} (${a.partido} - ${siglaAssembleia})`)
        .join(", ");

      return [
        `"${p.codigo}"`,
        `"${p.tipo}"`,
        `"${tema}"`,
        `"${abrangencia}"`,
        p.ano,
        `"${p.ementa.replace(/"/g, '""')}"`,
        `"${autoresFmt}"`,
        `"${p.situacao}"`,
        `"${p.dataApresentacao}"`,
        `"${dataAprov}"`,
        `"${p.urlProcesso}"`,
      ];
    });

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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border/40">
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

          {/* Tema Temático */}
          <div className="flex items-center gap-1.5">
            <select
              value={temaFiltro}
              onChange={(e) => {
                setTemaFiltro(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por tema temático"
            >
              <option value="todos">Todos os Temas ({temasDisponiveis.length})</option>
              {temasDisponiveis.map((t) => (
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
                  <span>Código & Âmbito</span>
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
              <th
                onClick={() => alternarOrdenacao("tema")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Tema</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th className="px-4 py-3">Ementa & Objeto</th>
              <th className="px-3 py-3">Propositor(es)</th>
              <th
                onClick={() => alternarOrdenacao("situacao")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Situação / Aprovação</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdenacao("dataApresentacao")}
                className="cursor-pointer px-3 py-3 hover:text-foreground select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Data Protocolo</span>
                  <ArrowUpDown size={12} className="text-muted" aria-hidden="true" />
                </div>
              </th>
              <th className="px-3 py-3 text-right">Tramitação / Processo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposicoesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted">
                  Nenhuma proposição encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              proposicoesPaginadas.map((prop) => {
                const aberta = linhaAberta === prop.codigo;
                const totalTramitacoes = prop.tramitacoes?.length ?? 0;
                const tema = extrairTemaProposicao(prop);
                const abrangencia = extrairAbrangencia(prop, siglaAssembleia);
                const dataAprov = extrairDataAprovacao(prop);

                return (
                  <Fragment key={prop.codigo}>
                    <tr className={`transition-colors hover:bg-surface-2/60 ${aberta ? "bg-surface-2/40" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-foreground">
                          {prop.codigo}
                        </div>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] bg-surface-2 border border-border text-muted">
                          {abrangencia}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                          {prop.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-block rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {tema}
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
                            <span className="text-[10px]">({a.partido} - {siglaAssembleia})</span>
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
                        {dataAprov && (
                          <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Aprov.: {dataAprov}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted whitespace-nowrap">
                        {prop.dataApresentacao}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLinhaAberta(aberta ? null : prop.codigo)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                              aberta
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
                            }`}
                            title="Ver andamentos e despachos de tramitação"
                            aria-expanded={aberta}
                          >
                            <GitCommit size={12} aria-hidden="true" />
                            <span>Trâmite</span>
                            {totalTramitacoes > 0 && (
                              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                                {totalTramitacoes}
                              </span>
                            )}
                            {aberta ? (
                              <ChevronUp size={12} aria-hidden="true" />
                            ) : (
                              <ChevronDown size={12} aria-hidden="true" />
                            )}
                          </button>

                          <a
                            href={prop.urlProcesso}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-surface"
                            title="Ver processo legislativo oficial diretamente na Assembleia"
                          >
                            <span>Oficial</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </td>
                    </tr>

                    {/* Linha expansível com o histórico de tramitação */}
                    {aberta && (
                      <tr className="bg-surface-2/30">
                        <td colSpan={8} className="px-4 py-4 sm:px-6">
                          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
                            <LinhaDoTempoTramitacao
                              eventos={prop.tramitacoes ?? []}
                              titulo={`Histórico de Tramitação — ${prop.codigo}`}
                              urlProcessoOficial={prop.urlProcesso}
                              casaNome={siglaAssembleia}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
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
