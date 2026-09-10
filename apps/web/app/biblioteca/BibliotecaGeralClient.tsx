"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  BookOpen,
  GraduationCap,
  Building2,
  Scale,
  FileText,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import type {
  DocumentoUnificado,
  MetricasBiblioteca,
} from "@/lib/biblioteca/unificada";
import { exportarCsvBiblioteca } from "@/lib/biblioteca/unificada";

interface Props {
  documentos: DocumentoUnificado[];
  metricas: MetricasBiblioteca;
}

function TagsDocumento({
  tags,
  limite,
  onClicar,
}: {
  tags: string[];
  limite: number;
  onClicar?: (tag: string) => void;
}) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, limite).map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={onClicar ? () => onClicar(tag) : undefined}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted hover:text-foreground transition"
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

export default function BibliotecaGeralClient({ documentos, metricas }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [temaAtivo, setTemaAtivo] = useState<string>("todos");
  const [estadoAtivo, setEstadoAtivo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<"ano" | "titulo" | "entidade" | "tipo">("ano");
  const [direcaoAsc, setDirecaoAsc] = useState(false); // Mais recentes primeiro por padrão
  const [modoExibicao, setModoExibicao] = useState<"compacto" | "detalhado">("compacto");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 25;

  // Categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    for (const d of documentos) {
      if (d.categoria) cats.add(d.categoria);
    }
    return Array.from(cats).sort();
  }, [documentos]);

  // Temas únicos
  const temas = useMemo(() => {
    const tms = new Set<string>();
    for (const d of documentos) {
      if (d.tema) tms.add(d.tema);
    }
    return Array.from(tms).sort();
  }, [documentos]);

  // Estados únicos
  const estados = useMemo(() => {
    const ests = new Set<string>();
    for (const d of documentos) {
      if (d.estado) ests.add(d.estado);
    }
    return Array.from(ests).sort();
  }, [documentos]);

  // Filtragem
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return documentos.filter((d) => {
      if (categoriaAtiva !== "todos" && d.categoria !== categoriaAtiva) return false;
      if (temaAtivo !== "todos" && d.tema !== temaAtivo) return false;
      if (estadoAtivo !== "todos" && d.estado !== estadoAtivo) return false;

      if (!termo) return true;

      return (
        d.titulo.toLowerCase().includes(termo) ||
        d.entidade.toLowerCase().includes(termo) ||
        d.autor.toLowerCase().includes(termo) ||
        d.microResumo.toLowerCase().includes(termo) ||
        d.palavrasChave.some((p) => p.toLowerCase().includes(termo))
      );
    });
  }, [documentos, busca, categoriaAtiva, temaAtivo, estadoAtivo]);

  // Ordenação
  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      let res = 0;
      if (ordem === "ano") res = a.ano - b.ano;
      else if (ordem === "titulo") res = a.titulo.localeCompare(b.titulo);
      else if (ordem === "entidade") res = a.entidade.localeCompare(b.entidade);
      else if (ordem === "tipo") res = a.tipoRotulo.localeCompare(b.tipoRotulo);

      return direcaoAsc ? res : -res;
    });
  }, [filtrados, ordem, direcaoAsc]);

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / itensPorPagina));
  const paginaCorrigida = Math.min(pagina, totalPaginas);
  const itensExibidos = useMemo(() => {
    const inicio = (paginaCorrigida - 1) * itensPorPagina;
    return ordenados.slice(inicio, inicio + itensPorPagina);
  }, [ordenados, paginaCorrigida]);

  // Download CSV conforme AGENTS.md (UTF-8 BOM e ;)
  function baixarCsv() {
    const csvContent = exportarCsvBiblioteca(ordenados);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `biblioteca-controle-popular-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Gráfico SVG Inline: distribuição temática dos documentos filtrados
  const dadosGrafico = useMemo(() => {
    const contagem: Record<string, number> = {};
    for (const d of filtrados) {
      contagem[d.tema] = (contagem[d.tema] || 0) + 1;
    }
    const ordenadosPorQtd = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const max = ordenadosPorQtd[0] ? ordenadosPorQtd[0][1] : 1;
    return { itens: ordenadosPorQtd.slice(0, 7), max };
  }, [filtrados]);

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE STATUS DO TOPO ═══ */}
      <section
        aria-label="Indicadores gerais do acervo"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-xs"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-muted">
            <BookOpen size={14} className="text-primary" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Acervo Completo
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {metricas.totalDocumentos.toLocaleString("pt-BR")}
          </div>
          <p className="text-[11px] text-muted">Documentos oficiais & laudos</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-muted">
            <GraduationCap size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pesquisa & Teses
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {metricas.totalAcademico}
          </div>
          <p className="text-[11px] text-muted">Artigos SciELO, teses & notas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-muted">
            <Building2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Entidades & Empresas
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {metricas.totalEmpresas + metricas.totalInstituicoesJustica}
          </div>
          <p className="text-[11px] text-muted">130 empresas + 91 órgãos de justiça</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-muted">
            <Layers size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Temas Críticos
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {metricas.totalTemas}
          </div>
          <p className="text-[11px] text-muted">Vale, Sigma, Consulta OIT, LAI</p>
        </div>
      </section>

      {/* ═══ 2. GRÁFICO SVG INLINE — DISTRIBUIÇÃO TEMÁTICA ═══ */}
      <section
        aria-label="Gráfico de distribuição temática"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">
              Distribuição por Tema dos Documentos Filtrados ({filtrados.length})
            </h2>
          </div>
          <span className="text-xs text-muted">SVG Inline sem dependências externas</span>
        </div>

        <div className="space-y-2 pt-2">
          {dadosGrafico.itens.map(([tema, qtd]) => {
            const perc = Math.round((qtd / filtrados.length) * 100) || 0;
            const larguraBarra = Math.max(4, Math.round((qtd / dadosGrafico.max) * 100));

            return (
              <div key={tema} className="space-y-1 text-xs">
                <div className="flex justify-between text-muted">
                  <span className="font-medium text-foreground">{tema}</span>
                  <span className="font-mono">
                    {qtd} ({perc}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${larguraBarra}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ 3. FILTROS, BUSCA, ORDENAÇÃO E EXPORTAÇÃO CSV ═══ */}
      <section
        aria-label="Controles de pesquisa e filtros"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
      >
        {/* Barra de Busca + Botão CSV + Alternador de Densidade */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por título, empresa, tese, autor, palavra-chave..."
              className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Alternador de Modo de Exibição */}
            <div className="flex rounded-xl border border-border bg-surface-2 p-0.5 text-xs">
              <button
                onClick={() => setModoExibicao("compacto")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                  modoExibicao === "compacto"
                    ? "bg-surface font-semibold text-primary shadow-2xs"
                    : "text-muted hover:text-foreground"
                }`}
                title="Visão comprimida para leitura rápida de muitos itens"
              >
                <TableIcon size={13} />
                <span className="hidden sm:inline">Comprimido</span>
              </button>
              <button
                onClick={() => setModoExibicao("detalhado")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                  modoExibicao === "detalhado"
                    ? "bg-surface font-semibold text-primary shadow-2xs"
                    : "text-muted hover:text-foreground"
                }`}
                title="Visão detalhada com microresumos completos"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Detalhado</span>
              </button>
            </div>

            {/* Botão Baixar CSV conforme AGENTS.md */}
            <button
              onClick={baixarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition shadow-2xs"
              title="Baixar planilha CSV dos documentos filtrados (compatível com Excel: BOM UTF-8 e ;)"
            >
              <Download size={13} />
              <span>Baixar Planilha ({filtrados.length})</span>
            </button>
          </div>
        </div>

        {/* Filtros em Linha (Categoria, Tema, Estado, Ordenação) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/70 text-xs">
          {/* Categoria */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Categoria:
            </label>
            <select
              value={categoriaAtiva}
              onChange={(e) => {
                setCategoriaAtiva(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border border-border bg-surface-2 py-1.5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todas as categorias ({documentos.length})</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tema */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Tema Crítico:
            </label>
            <select
              value={temaAtivo}
              onChange={(e) => {
                setTemaAtivo(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border border-border bg-surface-2 py-1.5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os temas</option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Estado / Âmbito */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Estado / Âmbito:
            </label>
            <select
              value={estadoAtivo}
              onChange={(e) => {
                setEstadoAtivo(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border border-border bg-surface-2 py-1.5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os estados / âmbito</option>
              {estados.map((est) => (
                <option key={est} value={est}>
                  {est === "BR" ? "Nacional (BR)" : est === "Global" ? "Internacional" : `Estado ${est}`}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Ordenar por:
            </label>
            <div className="flex items-center gap-1">
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-surface-2 py-1.5 px-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ano">Ano de publicação</option>
                <option value="titulo">Título do documento</option>
                <option value="entidade">Entidade / Instituição</option>
                <option value="tipo">Tipo de documento</option>
              </select>
              <button
                onClick={() => setDirecaoAsc(!direcaoAsc)}
                className="p-1.5 rounded-xl border border-border bg-surface-2 text-muted hover:text-foreground shrink-0"
                title={direcaoAsc ? "Ordem crescente" : "Ordem decrescente"}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. TABELA OU LISTAGEM DE DOCUMENTOS ═══ */}
      <section aria-label="Lista de documentos encontrados" className="space-y-4">
        {itensExibidos.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted text-xs space-y-2">
            <p className="font-semibold text-foreground text-sm">
              Nenhum documento encontrado com os filtros selecionados.
            </p>
            <p>Tente buscar por termos mais genéricos ou resetar os filtros.</p>
            <button
              onClick={() => {
                setBusca("");
                setCategoriaAtiva("todos");
                setTemaAtivo("todos");
                setEstadoAtivo("todos");
              }}
              className="mt-2 text-primary font-semibold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : modoExibicao === "compacto" ? (
          /* ── MODO COMPACTO (VISÃO COMPRIMIDA) ── */
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-2 text-[11px] font-semibold text-muted uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Ano</th>
                  <th className="py-2.5 px-3">Tipo / Categoria</th>
                  <th className="py-2.5 px-3">Título & Microresumo</th>
                  <th className="py-2.5 px-3">Entidade / Autor</th>
                  <th className="py-2.5 px-3">Tema & Tags</th>
                  <th className="py-2.5 px-3 text-right">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {itensExibidos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-2/50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {doc.ano}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                        {doc.tipoRotulo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-md">
                      <div className="font-bold text-foreground leading-snug">
                        {doc.titulo}
                      </div>
                      <p className="text-sm text-muted line-clamp-2 mt-0.5">
                        {doc.microResumo}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                      <span className="font-semibold text-foreground block">
                        {doc.entidade}
                      </span>
                      <span className="text-[10px]">{doc.estado}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          {doc.tema}
                        </span>
                        <TagsDocumento
                          tags={doc.palavrasChave}
                          limite={3}
                          onClicar={(t) => {
                            setBusca(t);
                            setPagina(1);
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-2">
                      {doc.urlPdf && (
                        <a
                          href={doc.urlPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-[11px]"
                          title="Baixar PDF / Espelho R2"
                        >
                          <span>PDF</span>
                          <Download size={11} />
                        </a>
                      )}
                      <a
                        href={doc.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted hover:text-foreground hover:underline text-[11px]"
                        title="Acessar página oficial da fonte"
                      >
                        <span>Fonte</span>
                        <ExternalLink size={10} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── MODO DETALHADO (CARDS COM MICRORESUMOS COMPLETOS) ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {itensExibidos.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold">
                      {doc.tipoRotulo}
                    </span>
                    <div className="flex items-center gap-1.5 text-muted font-mono font-bold">
                      <span>{doc.estado}</span>
                      <span>·</span>
                      <span>{doc.ano}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-foreground text-sm leading-snug">
                    {doc.titulo}
                  </h3>

                  <div className="text-[11px] text-muted">
                    <span className="font-semibold text-foreground">
                      {doc.entidade}
                    </span>
                    {doc.autor && doc.autor !== doc.entidade && (
                      <span> — {doc.autor}</span>
                    )}
                  </div>

                  <p className="text-muted text-xs leading-relaxed">
                    {doc.microResumo}
                  </p>

                  {/* Tags */}
                  <TagsDocumento
                    tags={doc.palavrasChave}
                    limite={5}
                    onClicar={(t) => {
                      setBusca(t);
                      setPagina(1);
                    }}
                  />
                </div>

                <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                    {doc.tema}
                  </span>

                  <div className="flex items-center gap-3">
                    {doc.urlPdf && (
                      <a
                        href={doc.urlPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <span>Espelho PDF</span>
                        <Download size={12} />
                      </a>
                    )}
                    <a
                      href={doc.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-muted hover:text-foreground hover:underline"
                    >
                      <span>Fonte Oficial</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ═══ 5. PAGINAÇÃO ═══ */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
            <span className="text-muted">
              Mostrando {itensExibidos.length} de {ordenados.length} documentos (Página{" "}
              {paginaCorrigida} de {totalPaginas})
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaCorrigida === 1}
                className="p-1.5 rounded-xl border border-border bg-surface disabled:opacity-40 hover:bg-surface-2 transition text-muted"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaCorrigida === totalPaginas}
                className="p-1.5 rounded-xl border border-border bg-surface disabled:opacity-40 hover:bg-surface-2 transition text-muted"
                title="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
