"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  FileText,
  Newspaper,
  ShieldCheck,
  Scale,
  ExternalLink,
  HardDrive,
  CheckCircle2,
  Clock,
  Coins,
  Users,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";

export interface DocumentoAtoInstituicao {
  id: string;
  titulo: string;
  tipo: string;
  ano: number;
  data: string;
  tema: string;
  microResumo: string;
  tags: string[];
  urlOficial: string;
  urlR2: string;
  status: string;
}

export interface InstituicaoProps {
  sigla: string;
  nome: string;
  tipo: string;
  esfera: string;
  uf?: string;
  regiao?: string;
  cor: string;
  orcamento: {
    ano: number;
    total: string;
    folhaPessoal?: string;
    custeioInvestimentos?: string;
  };
  estruturaPessoal?: {
    magistrados?: string;
    promotores?: string;
    defensores?: string;
    membros?: string;
    servidoresEfetivos?: string;
    comarcasInstaladas?: string;
    nucleosAtendimento?: string;
  };
  documentosEAtos: DocumentoAtoInstituicao[];
}

const TIPOS_ROTULOS: Record<string, string> = {
  noticia: "Notícia Oficial",
  relatorio_gestao: "Relatório de Gestão",
  inspecao_cnj_cnmp: "Inspeção Externa",
  acao_civil_publica: "Ação Civil Pública",
  tac: "TAC / Acordo",
  recomendacao: "Recomendação",
  resolucao: "Resolução / Portaria",
};

export default function TabelaInstituicaoClient({
  instituicao,
}: {
  instituicao: InstituicaoProps;
}) {
  const [busca, setBusca] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState<string>("todos");
  const [temaAtivo, setTemaAtivo] = useState<string>("todos");
  const [anoAtivo, setAnoAtivo] = useState<string>("todos");
  const [ordem, setOrdem] = useState<"data" | "titulo" | "tipo" | "tema">("data");
  const [direcaoAsc, setDirecaoAsc] = useState(false);

  const atos = instituicao.documentosEAtos || [];

  // Tipos unicos
  const tipos = useMemo(() => {
    const t = new Set<string>();
    for (const a of atos) {
      if (a.tipo) t.add(a.tipo);
    }
    return Array.from(t).sort();
  }, [atos]);

  // Temas unicos
  const temas = useMemo(() => {
    const tm = new Set<string>();
    for (const a of atos) {
      if (a.tema) tm.add(a.tema);
    }
    return Array.from(tm).sort();
  }, [atos]);

  // Anos unicos
  const anos = useMemo(() => {
    const an = new Set<number>();
    for (const a of atos) {
      if (a.ano) an.add(a.ano);
    }
    return Array.from(an).sort((a, b) => b - a);
  }, [atos]);

  // Filtragem
  const filtrados = useMemo(() => {
    return atos.filter((item) => {
      if (tipoAtivo !== "todos" && item.tipo !== tipoAtivo) return false;
      if (temaAtivo !== "todos" && item.tema !== temaAtivo) return false;
      if (anoAtivo !== "todos" && String(item.ano) !== anoAtivo) return false;

      if (busca.trim() !== "") {
        const termo = busca.toLowerCase().trim();
        const noTitulo = item.titulo.toLowerCase().includes(termo);
        const noResumo = item.microResumo.toLowerCase().includes(termo);
        const nasTags = item.tags.some((t) => t.toLowerCase().includes(termo));
        if (!noTitulo && !noResumo && !nasTags) return false;
      }
      return true;
    });
  }, [atos, tipoAtivo, temaAtivo, anoAtivo, busca]);

  // Ordenação
  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      let cmp = 0;
      if (ordem === "data") {
        cmp = a.data.localeCompare(b.data);
      } else if (ordem === "titulo") {
        cmp = a.titulo.localeCompare(b.titulo);
      } else if (ordem === "tipo") {
        cmp = a.tipo.localeCompare(b.tipo);
      } else if (ordem === "tema") {
        cmp = a.tema.localeCompare(b.tema);
      }
      return direcaoAsc ? cmp : -cmp;
    });
  }, [filtrados, ordem, direcaoAsc]);

  // Distribuicao por tema para grafico SVG inline
  const distribuicaoPorTema = useMemo(() => {
    const cont: Record<string, number> = {};
    for (const a of atos) {
      cont[a.tema] = (cont[a.tema] || 0) + 1;
    }
    return Object.entries(cont).sort((a, b) => b[1] - a[1]);
  }, [atos]);

  // Exportar CSV
  function exportarCsv() {
    const cabecalho = [
      "ID",
      "Órgão",
      "Título",
      "Tipo",
      "Ano",
      "Data",
      "Tema",
      "Micro-Resumo",
      "Tags",
      "Status",
      "URL Oficial",
      "Espelho R2",
    ];

    const linhas = ordenados.map((item) => [
      item.id,
      instituicao.sigla.toUpperCase(),
      `"${item.titulo.replace(/"/g, '""')}"`,
      `"${TIPOS_ROTULOS[item.tipo] || item.tipo}"`,
      item.ano,
      item.data,
      `"${item.tema}"`,
      `"${item.microResumo.replace(/"/g, '""')}"`,
      `"${item.tags.join(", ")}"`,
      item.status,
      item.urlOficial,
      item.urlR2,
    ]);

    const csvContent =
      "\uFEFF" +
      [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `controlepopular-${instituicao.sigla}-atos-noticias-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function alternarOrdem(campo: typeof ordem) {
    if (ordem === campo) {
      setDirecaoAsc(!direcaoAsc);
    } else {
      setOrdem(campo);
      setDirecaoAsc(campo === "titulo");
    }
  }

  const membros =
    instituicao.estruturaPessoal?.magistrados ||
    instituicao.estruturaPessoal?.promotores ||
    instituicao.estruturaPessoal?.defensores ||
    instituicao.estruturaPessoal?.membros ||
    "Quadro titular";

  const totalAtos = atos.length;
  const maxContagemTema = Math.max(...distribuicaoPorTema.map((d) => d[1]), 1);

  return (
    <section aria-labelledby="titulo-atos-documentos" className="mt-10 space-y-6">
      {/* 2. Top Status Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Coins size={14} className="text-primary" aria-hidden="true" />
            <span>Orçamento Anual</span>
          </div>
          <div className="mt-2 font-display text-lg sm:text-xl font-bold tracking-tight text-text">
            {instituicao.orcamento.total}
          </div>
          <p className="mt-0.5 text-[11px] text-text-soft">
            LOA {instituicao.orcamento.ano}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Users size={14} className="text-emerald-500" aria-hidden="true" />
            <span>Corpo Funcional</span>
          </div>
          <div className="mt-2 font-display text-sm sm:text-base font-bold tracking-tight text-text truncate">
            {membros}
          </div>
          <p className="mt-0.5 text-[11px] text-text-soft">
            {instituicao.estruturaPessoal?.servidoresEfetivos || "Servidores ativos"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <FileText size={14} className="text-sky-500" aria-hidden="true" />
            <span>Atos & Notícias</span>
          </div>
          <div className="mt-2 font-display text-lg sm:text-xl font-bold tracking-tight text-text">
            {totalAtos}
          </div>
          <p className="mt-0.5 text-[11px] text-text-soft">
            Documentos auditados
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <MapPin size={14} className="text-amber-500" aria-hidden="true" />
            <span>Alcance</span>
          </div>
          <div className="mt-2 font-display text-sm sm:text-base font-bold tracking-tight text-text truncate">
            {instituicao.estruturaPessoal?.comarcasInstaladas ||
              instituicao.estruturaPessoal?.nucleosAtendimento ||
              instituicao.esfera}
          </div>
          <p className="mt-0.5 text-[11px] text-text-soft">
            {instituicao.uf ? `Estado: ${instituicao.uf}` : "Âmbito Nacional"}
          </p>
        </div>
      </div>

      {/* 1. Gráfico SVG inline de Distribuição Temática */}
      {distribuicaoPorTema.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2
                id="titulo-atos-documentos"
                className="font-display text-base sm:text-lg font-bold text-text"
              >
                Distribuição Temática dos Atos e Notícias Monitorados
              </h2>
              <p className="text-xs text-text-soft">
                Classificação editorial independente de transparência pública
              </p>
            </div>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-xs font-bold text-text">
              {totalAtos} registros
            </span>
          </div>

          <div className="mt-4 space-y-3" role="region" aria-label="Gráfico de distribuição temática">
            {distribuicaoPorTema.map(([tema, contagem]) => {
              const pct = Math.round((contagem / totalAtos) * 100);
              const larguraPct = Math.round((contagem / maxContagemTema) * 100);
              return (
                <div key={tema} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text">{tema}</span>
                    <span className="font-mono text-text-soft">
                      {contagem} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${larguraPct}%`,
                        backgroundColor: instituicao.cor || "#0284c7",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Ações: Busca, Filtros e Exportação CSV */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 6. Busca textual em tempo real */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, resumo ou tag (ex: TAC, saúde, LRF)..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Buscar nos documentos e notícias da instituição"
          />
        </div>

        {/* 3. Botão Baixar Planilha CSV */}
        <button
          type="button"
          onClick={exportarCsv}
          className="cp-btn-anim inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-2xs hover:border-primary hover:text-primary transition-colors"
          title="Baixar planilha CSV com separador ponto-e-vírgula e codificação UTF-8 com BOM"
        >
          <FileSpreadsheet size={14} className="text-emerald-500" aria-hidden="true" />
          <span>Exportar Planilha ({ordenados.length})</span>
        </button>
      </div>

      {/* 4. Filtros Interativos */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-text-soft">
          <Filter size={13} aria-hidden="true" />
          Filtros:
        </span>

        {/* Filtro por Tipo */}
        <select
          value={tipoAtivo}
          onChange={(e) => setTipoAtivo(e.target.value)}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por tipo de ato"
        >
          <option value="todos">Todos os Tipos ({atos.length})</option>
          {tipos.map((tp) => (
            <option key={tp} value={tp}>
              {TIPOS_ROTULOS[tp] || tp}
            </option>
          ))}
        </select>

        {/* Filtro por Tema */}
        <select
          value={temaAtivo}
          onChange={(e) => setTemaAtivo(e.target.value)}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por tema"
        >
          <option value="todos">Todos os Temas ({temas.length})</option>
          {temas.map((tm) => (
            <option key={tm} value={tm}>
              {tm}
            </option>
          ))}
        </select>

        {/* Filtro por Ano */}
        {anos.length > 1 && (
          <select
            value={anoAtivo}
            onChange={(e) => setAnoAtivo(e.target.value)}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-text focus:border-primary focus:outline-none"
            aria-label="Filtrar por ano"
          >
            <option value="todos">Todos os Anos</option>
            {anos.map((an) => (
              <option key={an} value={String(an)}>
                {an}
              </option>
            ))}
          </select>
        )}

        {(tipoAtivo !== "todos" || temaAtivo !== "todos" || anoAtivo !== "todos" || busca) && (
          <button
            type="button"
            onClick={() => {
              setTipoAtivo("todos");
              setTemaAtivo("todos");
              setAnoAtivo("todos");
              setBusca("");
            }}
            className="text-[0.9em] text-primary hover:underline ml-1 cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* 5. Tabela de Registros com Ordenação por Coluna e Micro-Resumos */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-text-soft font-semibold">
              <th scope="col" className="px-4 py-3 w-28">
                <button
                  type="button"
                  onClick={() => alternarOrdem("data")}
                  className="flex items-center gap-1 hover:text-text cursor-pointer"
                >
                  <span>Data / Ano</span>
                  <ArrowUpDown size={11} aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => alternarOrdem("titulo")}
                  className="flex items-center gap-1 hover:text-text cursor-pointer"
                >
                  <span>Documento / Notícia Oficial</span>
                  <ArrowUpDown size={11} aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 w-36">
                <button
                  type="button"
                  onClick={() => alternarOrdem("tipo")}
                  className="flex items-center gap-1 hover:text-text cursor-pointer"
                >
                  <span>Tipo</span>
                  <ArrowUpDown size={11} aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 w-36">
                <button
                  type="button"
                  onClick={() => alternarOrdem("tema")}
                  className="flex items-center gap-1 hover:text-text cursor-pointer"
                >
                  <span>Tema</span>
                  <ArrowUpDown size={11} aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right w-28">
                Fontes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {ordenados.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-soft">
                  Nenhum ato ou notícia encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              ordenados.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-2/60 transition-colors"
                >
                  {/* Data */}
                  <td className="px-4 py-3 font-mono text-[0.9em] text-text-soft align-top">
                    {item.data}
                  </td>

                  {/* Título, Micro-Resumo e Tags */}
                  <td className="px-4 py-3 space-y-1.5 align-top">
                    <div className="font-semibold text-text leading-snug">
                      {item.titulo}
                    </div>

                    {/* Micro-resumo factual */}
                    <p className="text-sm text-text-soft leading-relaxed">
                      {item.microResumo}
                    </p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded bg-surface-2 px-1.5 py-0.5 text-[0.9em] font-medium text-text-soft"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block rounded border border-border px-2 py-0.5 text-[0.9em] font-semibold text-text">
                      {TIPOS_ROTULOS[item.tipo] || item.tipo}
                    </span>
                  </td>

                  {/* Tema */}
                  <td className="px-4 py-3 align-top">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[0.9em] font-semibold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${instituicao.cor || "#0284c7"} 15%, transparent)`,
                        color: instituicao.cor || "#0284c7",
                      }}
                    >
                      {item.tema}
                    </span>
                  </td>

                  {/* Links: Oficial e R2 */}
                  <td className="px-4 py-3 text-right align-top space-y-1 whitespace-nowrap">
                    {item.urlOficial && (
                      <a
                        href={item.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[0.9em] font-semibold text-primary transition-colors hover:bg-surface-2"
                        title="Acessar ato no portal oficial de origem"
                      >
                        <span>Acessar Ato</span>
                        <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    )}
                    {item.urlR2 && !item.urlR2.includes("arquivos.controlepopular.com.br") && (
                      <div>
                        <a
                          href={item.urlR2}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[0.9em] text-text-soft hover:text-text hover:underline"
                          title="Espelho perpétuo no Cloudflare R2"
                        >
                          <HardDrive size={10} aria-hidden="true" />
                          <span>R2</span>
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center text-[0.9em] text-text-soft px-1">
        <span>Exibindo {ordenados.length} de {atos.length} atos monitorados</span>
        <span>Atualizado em setembro de 2026 · Fontes oficiais e CNJ/CNMP</span>
      </div>
    </section>
  );
}
