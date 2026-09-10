"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Globe2,
  Download,
  ExternalLink,
  Search,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  Leaf,
  DollarSign,
  Users,
  HardDrive,
} from "lucide-react";
import type { DocumentoEmpresa } from "@/lib/empresas/empresas-documentos";

interface Props {
  documentos: DocumentoEmpresa[];
}

export default function BibliotecaEmpresasClient({ documentos }: Props) {
  const [busca, setBusca] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState<string>("todos");
  const [setorAtivo, setSetorAtivo] = useState<string>("todos");
  const [paisAtivo, setPaisAtivo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<"empresa" | "titulo" | "tipo" | "ano" | "tamanho">("empresa");
  const [direcaoAsc, setDirecaoAsc] = useState(true);

  // Setores unicos para filtro
  const setores = useMemo(() => {
    const s = new Map<string, string>();
    for (const d of documentos) {
      if (d.setor && d.setorRotulo) {
        s.set(d.setor, d.setorRotulo);
      }
    }
    return Array.from(s.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [documentos]);

  // Paises unicos para filtro
  const paises = useMemo(() => {
    const p = new Set<string>();
    for (const d of documentos) {
      if (d.pais) p.add(d.pais);
    }
    return Array.from(p).sort();
  }, [documentos]);

  // Contagem por tipo para grafico SVG inline
  const distribuicaoPorTipo = useMemo(() => {
    const cont: Record<string, number> = {
      sustentabilidade: 0,
      financeiro: 0,
      clima: 0,
      direitos_humanos: 0,
    };
    for (const d of documentos) {
      if (cont[d.tipoDocumento] !== undefined) {
        cont[d.tipoDocumento] += 1;
      }
    }
    return cont;
  }, [documentos]);

  // Filtragem dos documentos
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return documentos.filter((d) => {
      if (tipoAtivo !== "todos" && d.tipoDocumento !== tipoAtivo) return false;
      if (setorAtivo !== "todos" && d.setor !== setorAtivo) return false;
      if (paisAtivo !== "todos" && d.pais !== paisAtivo) return false;

      if (q) {
        const bateEmpresa = d.empresaNome.toLowerCase().includes(q);
        const bateTitulo = d.titulo.toLowerCase().includes(q);
        const bateResumo = d.microResumo.toLowerCase().includes(q);
        const bateSetor = d.setorRotulo.toLowerCase().includes(q);
        const bateTags = d.tags.some((t) => t.toLowerCase().includes(q));
        if (!bateEmpresa && !bateTitulo && !bateResumo && !bateSetor && !bateTags) {
          return false;
        }
      }
      return true;
    });
  }, [documentos, tipoAtivo, setorAtivo, paisAtivo, busca]);

  // Ordenacao
  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      let vA: string | number = "";
      let vB: string | number = "";

      if (ordem === "empresa") {
        vA = a.empresaNome;
        vB = b.empresaNome;
      } else if (ordem === "titulo") {
        vA = a.titulo;
        vB = b.titulo;
      } else if (ordem === "tipo") {
        vA = a.tipoDocumentoRotulo;
        vB = b.tipoDocumentoRotulo;
      } else if (ordem === "ano") {
        vA = a.ano;
        vB = b.ano;
      } else if (ordem === "tamanho") {
        vA = a.tamanhoBytes;
        vB = b.tamanhoBytes;
      }

      if (typeof vA === "number" && typeof vB === "number") {
        return direcaoAsc ? vA - vB : vB - vA;
      }
      return direcaoAsc
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });
  }, [filtrados, ordem, direcaoAsc]);

  function alternarOrdem(campo: "empresa" | "titulo" | "tipo" | "ano" | "tamanho") {
    if (ordem === campo) {
      setDirecaoAsc(!direcaoAsc);
    } else {
      setOrdem(campo);
      setDirecaoAsc(true);
    }
  }

  // Exportacao CSV formatada (UTF-8 BOM + ';')
  function exportarCsv() {
    const cabecalhos = [
      "Empresa",
      "Pais",
      "Setor",
      "Tipo de Documento",
      "Titulo",
      "Ano",
      "Micro-Resumo",
      "URL Espelho R2",
      "URL Fonte Oficial",
      "Tamanho",
      "Tags",
    ];

    const linhas = ordenados.map((d) => [
      `"${d.empresaNome.replace(/"/g, '""')}"`,
      `"${d.pais}"`,
      `"${d.setorRotulo.replace(/"/g, '""')}"`,
      `"${d.tipoDocumentoRotulo.replace(/"/g, '""')}"`,
      `"${d.titulo.replace(/"/g, '""')}"`,
      d.ano,
      `"${d.microResumo.replace(/"/g, '""')}"`,
      `"${d.urlR2}"`,
      `"${d.urlOficial}"`,
      `"${d.tamanhoFormatado}"`,
      `"${d.tags.join(", ")}"`,
    ]);

    const conteudo =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `documentos-empresas-controle-popular-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getBadgeTipo(tipo: string) {
    switch (tipo) {
      case "sustentabilidade":
        return {
          bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          icone: Leaf,
        };
      case "financeiro":
        return {
          bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          icone: DollarSign,
        };
      case "clima":
        return {
          bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          icone: Globe2,
        };
      case "direitos_humanos":
        return {
          bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          icone: Users,
        };
      default:
        return {
          bg: "bg-surface-2 text-muted border-border",
          icone: FileText,
        };
    }
  }

  const tiposGrafico = [
    { id: "sustentabilidade", rotulo: "Sustentabilidade (GRI/SASB)", cor: "#10b981", qtd: distribuicaoPorTipo.sustentabilidade },
    { id: "financeiro", rotulo: "Demonstracoes Financeiras (DFP/10-K)", cor: "#3b82f6", qtd: distribuicaoPorTipo.financeiro },
    { id: "clima", rotulo: "Acao Climatica & Descarbonizacao", cor: "#f59e0b", qtd: distribuicaoPorTipo.clima },
    { id: "direitos_humanos", rotulo: "Direitos Humanos & Comunidades", cor: "#8b5cf6", qtd: distribuicaoPorTipo.direitos_humanos },
  ];

  const totalBase = documentos.length || 1;

  return (
    <div className="space-y-8">
      {/* ═══ 1. STATUS / CARTOES DE TOPO ═══ */}
      <section aria-labelledby="status-acervo" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <h2 id="status-acervo" className="sr-only">
          Status Geral do Acervo de Documentos
        </h2>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <FileText size={16} className="text-primary" />
            <span>Total no Acervo</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {documentos.length}
          </div>
          <p className="mt-1 text-xs text-muted">Documentos catalogados</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
            <span>Empresas Auditadas</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {new Set(documentos.map((d) => d.empresaSlug)).size}
          </div>
          <p className="mt-1 text-xs text-muted">Brasil e Estados Unidos</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Relatorios ESG / Clima</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {distribuicaoPorTipo.sustentabilidade + distribuicaoPorTipo.clima}
          </div>
          <p className="mt-1 text-xs text-muted">GRI, SASB e metas net zero</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <HardDrive size={16} className="text-purple-600 dark:text-purple-400" />
            <span>Espelho em Nuvem R2</span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            100%
          </div>
          <p className="mt-1 text-xs text-muted">Redundancia e preservacao</p>
        </div>
      </section>

      {/* ═══ 2. GRAFICO DE DISTRIBUICAO TEMATICA (SVG INLINE) ═══ */}
      <section
        aria-labelledby="grafico-distribuicao"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="grafico-distribuicao" className="font-display text-base sm:text-lg font-bold text-foreground">
            Distribuicao dos Documentos por Pilar Estrategico
          </h2>
          <span className="text-xs text-muted">
            Total mapeado: <strong>{documentos.length}</strong> relatorios oficiais
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-6 w-full overflow-hidden rounded-full bg-surface-2 border border-border flex">
            {tiposGrafico.map((tipo) => {
              const perc = (tipo.qtd / totalBase) * 100;
              return (
                <div
                  key={tipo.id}
                  style={{ width: `${perc}%`, backgroundColor: tipo.cor }}
                  className="h-full transition-all duration-300 relative group cursor-pointer"
                  title={`${tipo.rotulo}: ${tipo.qtd} documentos (${perc.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 text-xs">
            {tiposGrafico.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setTipoAtivo(tipoAtivo === tipo.id ? "todos" : tipo.id)}
                className={`flex items-center justify-between p-2 rounded-xl border text-left transition ${
                  tipoAtivo === tipo.id
                    ? "border-primary bg-primary/5 font-semibold"
                    : "border-border/60 bg-surface-2 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tipo.cor }}
                  />
                  <span className="truncate text-foreground">{tipo.rotulo}</span>
                </div>
                <span className="font-mono font-bold text-muted ml-2">{tipo.qtd}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. BARRA DE CONTROLE: FILTROS, BUSCA E EXPORTACAO CSV ═══ */}
      <section aria-labelledby="controles-filtro" className="space-y-3">
        <h2 id="controles-filtro" className="sr-only">
          Filtros de Busca e Exportacao
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Buscar por empresa, termo tecnico, ano ou tag..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            onClick={exportarCsv}
            disabled={ordenados.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-2 px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition disabled:opacity-50"
            title="Baixar planilha CSV com os itens atualmente filtrados na tela (separador ; com UTF-8 BOM)"
          >
            <Download size={14} className="text-primary" />
            <span>Baixar Planilha CSV ({ordenados.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted font-medium pr-1">
            <Filter size={14} />
            <span>Filtros:</span>
          </div>

          <select
            value={tipoAtivo}
            onChange={(e) => setTipoAtivo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="sustentabilidade">Sustentabilidade (ESG)</option>
            <option value="financeiro">Demonstracoes Financeiras</option>
            <option value="clima">Acao Climatica & Descarbonizacao</option>
            <option value="direitos_humanos">Direitos Humanos & Comunidades</option>
          </select>

          <select
            value={setorAtivo}
            onChange={(e) => setSetorAtivo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Setores ({setores.length})</option>
            {setores.map(([chave, rotulo]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </select>

          <select
            value={paisAtivo}
            onChange={(e) => setPaisAtivo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Paises</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {(tipoAtivo !== "todos" || setorAtivo !== "todos" || paisAtivo !== "todos" || busca) && (
            <button
              onClick={() => {
                setTipoAtivo("todos");
                setSetorAtivo("todos");
                setPaisAtivo("todos");
                setBusca("");
              }}
              className="rounded-lg border border-border/80 bg-surface-2 px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition"
            >
              Restaurar Padrao
            </button>
          )}

          <div className="ml-auto text-xs text-muted">
            Exibindo <strong>{ordenados.length}</strong> de <strong>{documentos.length}</strong> documentos
          </div>
        </div>
      </section>

      {/* ═══ 4 & 5. TABELA ORDENAVEL COM LINKS DUPLOS (R2 + OFICIAL) ═══ */}
      <section aria-labelledby="tabela-documentos" className="space-y-4">
        <h2 id="tabela-documentos" className="sr-only">
          Tabela Completa de Documentos e Relatorios Publicos
        </h2>

        {ordenados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center space-y-2">
            <FileText size={32} className="mx-auto text-muted" />
            <h3 className="font-semibold text-foreground">Nenhum documento encontrado</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Nenhum documento corresponde aos criterios selecionados. Tente limpar os filtros ou buscar por outro termo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-xs uppercase font-semibold text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => alternarOrdem("empresa")}
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition"
                    >
                      <span>Empresa & Pais</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => alternarOrdem("tipo")}
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition"
                    >
                      <span>Tipo de Relatorio</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => alternarOrdem("titulo")}
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition"
                    >
                      <span>Titulo & Micro-Resumo Civico</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <button
                      onClick={() => alternarOrdem("ano")}
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition"
                    >
                      <span>Ano</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <button
                      onClick={() => alternarOrdem("tamanho")}
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition"
                    >
                      <span>Tamanho</span>
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Acesso & Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ordenados.map((doc) => {
                  const badge = getBadgeTipo(doc.tipoDocumento);
                  const IconeTipo = badge.icone;

                  return (
                    <tr key={doc.id} className="hover:bg-surface-2/40 transition">
                      {/* Empresa */}
                      <td className="py-3 px-4 align-top">
                        <Link
                          href={`/empresas/${doc.empresaSlug}`}
                          className="font-bold text-foreground hover:text-primary transition block text-sm"
                        >
                          {doc.empresaNome}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                          <span>{doc.pais}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{doc.setorRotulo}</span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg}`}
                        >
                          <IconeTipo size={12} />
                          <span>{doc.tipoDocumentoRotulo}</span>
                        </span>
                      </td>

                      {/* Titulo & Micro-Resumo */}
                      <td className="py-3 px-4 align-top max-w-md">
                        <h4 className="font-semibold text-foreground text-xs leading-snug">
                          {doc.titulo}
                        </h4>
                        <p className="mt-1 text-sm text-muted leading-relaxed">
                          {doc.microResumo}
                        </p>
                        {/* Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setBusca(tag)}
                              className="rounded bg-surface-2 hover:bg-surface-3 px-1.5 py-0.5 text-xs font-mono text-muted hover:text-foreground transition"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Ano */}
                      <td className="py-3 px-4 align-top text-center font-mono font-bold text-foreground">
                        {doc.ano}
                      </td>

                      {/* Tamanho */}
                      <td className="py-3 px-4 align-top text-center font-mono text-xs text-muted">
                        {doc.tamanhoFormatado}
                      </td>

                      {/* Links */}
                      <td className="py-3 px-4 align-top text-right space-y-1.5">
                        <div>
                          <a
                            href={doc.urlOficial || doc.urlR2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-end gap-1 font-semibold text-xs text-primary hover:underline"
                            title="Acessar documento na fonte oficial da empresa, CVM ou SEC"
                          >
                            <span>Acessar Documento</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {doc.urlR2 && !doc.urlR2.includes("arquivos.controlepopular.com.br") && (
                          <div>
                            <a
                              href={doc.urlR2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-end gap-1 text-xs text-muted hover:text-foreground hover:underline"
                              title="Espelho preservado no Cloudflare R2"
                            >
                              <span>Espelho R2</span>
                              <Download size={10} />
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
