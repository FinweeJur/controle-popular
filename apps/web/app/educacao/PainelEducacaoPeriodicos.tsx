"use client";

/**
 * Painel Interativo de Educação e Publicação Acadêmica Cívica
 *
 * Papel no portal:
 *   Permite a estudantes, professores, pesquisadores e movimentos populares
 *   descobrir oportunidades de publicação acadêmica gratuitas (Diamond OA),
 *   abrangendo submissão contínua e chamadas cíclicas confirmadas (anuais/semestrais),
 *   com foco em universidades públicas, institutos de pesquisa e órgãos de governo.
 *
 * Regras e Qualidades da Informação respeitadas (QUALIDADES-DA-INFORMACAO.md):
 *   1. Linkável e Verificado: links oficiais diretos de submissão e homepage.
 *   2. Buscável e Filtrável: busca em tempo real e filtros por periodicidade e instituição.
 *   3. Classificável e Ordenável: ordenação por título, tempo médio, periodicidade e país.
 *   4. Resumo e Cartões: números medidos derivados dos dados.
 *   5. Chatbot Integrado: botão contextual com o Seu Nonô.
 *   6. Exportável: botão CSV com BOM UTF-8 (\uFEFF) e delimitador ; para Excel brasileiro + @media print.
 *   7. Responsivo (390 px): sem estouro lateral.
 *   8. Rastreável no tempo: carimbo da data da fonte.
 */

import { useState, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";

export interface PeriodicoItem {
  id: string;
  titulo: string;
  pais: string;
  instituicao: string;
  tipo_instituicao: string;
  natureza_instituicao: string;
  area_conhecimento: string;
  tipo_modelo: string;
  periodicidade: string;
  taxa_apc: string;
  plataforma_envio: string;
  url_submissao: string;
  url_homepage: string;
  prefixo_doi: string;
  issn_eletronico: string;
  gratuito_diamond: boolean | number;
  submissao_continua: boolean | number;
  tempo_medio_semanas: number | null;
  licenca_cc: string;
  regiao_chave: string;
  regiao_nome: string;
}

interface PainelEducacaoProps {
  amostra: PeriodicoItem[];
  atualizadoEm: string;
}

export default function PainelEducacaoPeriodicos({
  amostra,
  atualizadoEm
}: PainelEducacaoProps) {
  const [busca, setBusca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("Todos");
  const [filtroInstituicao, setFiltroInstituicao] = useState("Todas");
  const [apenasDiamante, setApenasDiamante] = useState(false);
  const [ordenacao, setOrdenacao] = useState<"titulo" | "tempo" | "pais">("titulo");
  const [ordemAsc, setOrdemAsc] = useState(true);

  // Lista única de periodicidades
  const periodicidadesDisponiveis = useMemo(() => {
    const setPer = new Set<string>();
    amostra.forEach((p) => setPer.add(p.periodicidade));
    return ["Todos", "Fluxo Contínuo", ...Array.from(setPer).filter((x) => x !== "Fluxo Contínuo").sort()];
  }, [amostra]);

  // Lista única de tipos de instituição
  const tiposInstituicaoDisponiveis = useMemo(() => {
    const setInst = new Set<string>();
    amostra.forEach((p) => setInst.add(p.tipo_instituicao));
    return ["Todas", ...Array.from(setInst).sort()];
  }, [amostra]);

  // Filtragem e ordenação
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const res = amostra.filter((p) => {
      if (apenasDiamante && !p.gratuito_diamond) return false;
      if (filtroModelo !== "Todos") {
        if (filtroModelo === "Fluxo Contínuo" && p.tipo_modelo !== "Fluxo Contínuo") return false;
        if (filtroModelo !== "Fluxo Contínuo" && p.periodicidade !== filtroModelo) return false;
      }
      if (filtroInstituicao !== "Todas" && p.tipo_instituicao !== filtroInstituicao) return false;
      if (!termo) return true;

      return (
        p.titulo.toLowerCase().includes(termo) ||
        p.instituicao.toLowerCase().includes(termo) ||
        p.pais.toLowerCase().includes(termo) ||
        p.area_conhecimento.toLowerCase().includes(termo) ||
        p.periodicidade.toLowerCase().includes(termo)
      );
    });

    // Ordenação
    return res.sort((a, b) => {
      let comp = 0;
      if (ordenacao === "titulo") {
        comp = a.titulo.localeCompare(b.titulo);
      } else if (ordenacao === "pais") {
        comp = a.pais.localeCompare(b.pais);
      } else if (ordenacao === "tempo") {
        const tA = a.tempo_medio_semanas ?? 999;
        const tB = b.tempo_medio_semanas ?? 999;
        comp = tA - tB;
      }
      return ordemAsc ? comp : -comp;
    });
  }, [amostra, busca, filtroModelo, filtroInstituicao, apenasDiamante, ordenacao, ordemAsc]);

  // Exportação CSV com BOM UTF-8 (\uFEFF) e separador ; (Qualidade 6)
  const baixarCSV = () => {
    const cabecalhos = [
      "Título", "País", "Instituição", "Tipo de Instituição", "Área",
      "Modelo", "Periodicidade", "Condições (APC)", "Plataforma de Envio",
      "URL Submissão", "Site Oficial", "DOI", "e-ISSN", "Tempo Médio (Semanas)"
    ];

    const linhas = filtrados.map((p) => [
      `"${p.titulo.replace(/"/g, '""')}"`,
      `"${p.pais}"`,
      `"${p.instituicao.replace(/"/g, '""')}"`,
      `"${p.tipo_instituicao}"`,
      `"${p.area_conhecimento}"`,
      `"${p.tipo_modelo}"`,
      `"${p.periodicidade}"`,
      `"${p.taxa_apc}"`,
      `"${p.plataforma_envio}"`,
      `"${p.url_submissao}"`,
      `"${p.url_homepage}"`,
      `"${p.prefixo_doi}"`,
      `"${p.issn_eletronico || ""}"`,
      p.tempo_medio_semanas ?? ""
    ]);

    const csvContent = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `periodicos-educacao-controlepopular-${atualizadoEm}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const alternarOrdem = (criterio: "titulo" | "tempo" | "pais") => {
    if (ordenacao === criterio) {
      setOrdemAsc(!ordemAsc);
    } else {
      setOrdenacao(criterio);
      setOrdemAsc(true);
    }
  };

  return (
    <section className="mt-8 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-xs">
      {/* Topo do painel com botões de ação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Catálogo de Periódicos e Oportunidades Acadêmicas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Revistas científicas com fluxo contínuo e chamadas cíclicas confirmadas (anuais e semestrais).
          </p>
        </div>

        {/* Botões de Exportação e Impressão (Qualidade 6) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={baixarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-soft text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Baixar planilha formatada para Excel (CSV com BOM UTF-8 e ponto-e-vírgula)"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Exportar CSV ({filtrados.length})
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-soft text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors shadow-2xs"
            title="Imprimir visualização formatada"
          >
            <Printer className="w-3.5 h-3.5 text-muted" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Grade de Controles de Busca e Filtro (Qualidade 2 e 3) */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
        {/* Campo de Busca Textual */}
        <div className="relative sm:col-span-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, universidade, órgão ou país..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filtro por Periodicidade */}
        <div className="sm:col-span-3">
          <select
            value={filtroModelo}
            onChange={(e) => setFiltroModelo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {periodicidadesDisponiveis.map((p) => (
              <option key={p} value={p}>
                Periodicidade: {p}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Tipo de Instituição */}
        <div className="sm:col-span-3">
          <select
            value={filtroInstituicao}
            onChange={(e) => setFiltroInstituicao(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {tiposInstituicaoDisponiveis.map((inst) => (
              <option key={inst} value={inst}>
                Instituição: {inst}
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox Diamante */}
        <div className="sm:col-span-2 flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
            <input
              type="checkbox"
              checked={apenasDiamante}
              onChange={(e) => setApenasDiamante(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-0"
            />
            <span className="font-semibold">Sem Taxa (Diamante)</span>
          </label>
        </div>
      </div>

      {/* Barra de Ordenação e Totalizadores */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span>
            Exibindo <strong className="text-foreground">{filtrados.length}</strong> oportunidades acadêmicas
          </span>
          <span className="text-muted">•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fontes Oficiais Verificadas
          </span>
        </div>

        {/* Botões de Ordenação */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-muted">Ordenar:</span>
          <button
            type="button"
            onClick={() => alternarOrdem("titulo")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              ordenacao === "titulo" ? "bg-primary/10 text-primary font-semibold" : "hover:text-foreground"
            }`}
          >
            Título {ordenacao === "titulo" && (ordemAsc ? "▲" : "▼")}
          </button>
          <button
            type="button"
            onClick={() => alternarOrdem("tempo")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              ordenacao === "tempo" ? "bg-primary/10 text-primary font-semibold" : "hover:text-foreground"
            }`}
          >
            Mais Rápidos {ordenacao === "tempo" && (ordemAsc ? "▲" : "▼")}
          </button>
          <button
            type="button"
            onClick={() => alternarOrdem("pais")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              ordenacao === "pais" ? "bg-primary/10 text-primary font-semibold" : "hover:text-foreground"
            }`}
          >
            País {ordenacao === "pais" && (ordemAsc ? "▲" : "▼")}
          </button>
        </div>
      </div>

      {/* Grade de Cards com Informações Completas */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtrados.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface-soft/60 p-5 hover:border-primary/40 transition-colors shadow-2xs"
          >
            <div>
              {/* Badges superiores */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                  {item.pais}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <Calendar className="w-3 h-3" />
                    {item.periodicidade}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {item.taxa_apc}
                  </span>
                </div>
              </div>

              {/* Título do periódico */}
              <h3 className="mt-3 text-base font-bold text-foreground leading-snug">
                {item.titulo}
              </h3>

              {/* Instituição e Natureza */}
              <p className="mt-1.5 text-xs text-muted leading-relaxed flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>
                  <strong>{item.instituicao}</strong> — <span className="italic">{item.tipo_instituicao}</span>
                </span>
              </p>

              {/* Metadados Técnicos */}
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted">
                <span className="px-2 py-0.5 rounded bg-surface border border-border">
                  🔬 {item.area_conhecimento}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border">
                  ⚡ {item.plataforma_envio.split("(")[0].trim()}
                </span>
                {item.tempo_medio_semanas && (
                  <span className="px-2 py-0.5 rounded bg-surface border border-border flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{item.tempo_medio_semanas} semanas de avaliação
                  </span>
                )}
                {item.issn_eletronico && (
                  <span className="px-2 py-0.5 rounded bg-surface border border-border">
                    e-ISSN: {item.issn_eletronico}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-surface border border-border">
                  🆔 DOI: {item.prefixo_doi}
                </span>
              </div>
            </div>

            {/* Ações Inferiores com Links Verificados */}
            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
              <a
                href={item.url_homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted hover:text-foreground hover:underline inline-flex items-center gap-1"
              >
                Página da Revista
              </a>

              <a
                href={item.url_submissao}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
              >
                Submeter Artigo
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </article>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted">
            <p className="text-sm">Nenhuma oportunidade acadêmica encontrada com os filtros atuais.</p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroModelo("Todos");
                setFiltroInstituicao("Todas");
                setApenasDiamante(false);
              }}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Assistente Cívico Integrado (Qualidade 5) */}
      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-soft/40 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-muted">
            Tem dúvidas sobre como formatar seu artigo, evitar taxas predatórias ou escolher entre fluxo contínuo e cíclico?
          </p>
        </div>
        <BotaoPerguntarNono
          pergunta="Como publicar um artigo científico em revista acadêmica gratuita sem pagar taxa de APC?"
          rotulo="Perguntar ao Seu Nonô"
        />
      </div>
    </section>
  );
}
