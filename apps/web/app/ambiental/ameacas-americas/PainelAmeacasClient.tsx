"use client";

/**
 * @file apps/web/app/ambiental/ameacas-americas/PainelAmeacasClient.tsx
 * @description Componente cliente do Painel de Ameaças Ambientais nas Américas.
 *
 * Papel no portal:
 * Provê interface rica e acessível para exploração das 90 ameaças catalogadas
 * (Espécies, Rios, Serras e Comunidades Tradicionais) segundo o Padrão das
 * Seis Qualidades do Controle Popular (AGENTS.md §8).
 *
 * Regras e decisões de negócio:
 * 1. Linkável e verificado: Links diretos canônicos oficiais (ICMBio, IUCN, ANA, FUNAI, etc.) com botão 'Fonte Oficial'.
 * 2. Buscável e filtrável: Pesquisa em tempo real com normalização sem acento e filtros multifacetados combinados.
 * 3. Classificável: Ordenação em todas as colunas relevantes (Nome, Categoria, País, Grau de Risco, Ano).
 * 4. Resumo e gráficos: Gráfico SVG nativo e acessível com distribuição por risco e categoria.
 * 5. Assistente cívico (Seu Nonô): Respostas objetivas em orações diretas de até 13 palavras e disparo de evento RAG.
 * 6. Exportável: Download de CSV com BOM UTF-8 (\uFEFF) e separador ';' + impressão nativa via @media print.
 */

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Printer,
  ExternalLink,
  ShieldAlert,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  Info,
  CheckCircle2,
  TreePine,
  Waves,
  Mountain,
  Users,
} from "lucide-react";
import type {
  RegistroAmeacaAmericas,
  CategoriaAmeaca,
  GrauRisco,
} from "@/lib/ambiente/dados-ameacas-americas";
import {
  CATEGORIA_LABEL,
  CATEGORIA_ICONE,
  gerarCsvAmeacas,
} from "@/lib/ambiente/dados-ameacas-americas";
import { semAcento } from "@/lib/busca/normalizar";

interface Props {
  registrosIniciais: RegistroAmeacaAmericas[];
}

type ColunaOrdenacao = "nome" | "categoria" | "pais" | "grauRisco" | "anoReferencia";

const PERGUNTAS_CIVICAS_SEU_NONO = [
  {
    id: "p1",
    titulo: "Bacias fluviais mais críticas",
    pergunta: "Quais são os rios mais ameaçados nas Américas?",
    resposta: "Rio Doce e Paraopeba sofreram com lama tóxica de barragens de mineração.",
  },
  {
    id: "p2",
    titulo: "Espécies sob risco imediato",
    pergunta: "Quais espécies correm risco crítico de extinção imediata?",
    resposta: "Muriqui-do-norte, soldadinho-do-araripe e vaquita mexicana têm populações minúsculas.",
  },
  {
    id: "p3",
    titulo: "Papel das terras indígenas",
    pergunta: "Por que demarcar e proteger terras tradicionais?",
    resposta: "Terras indígenas têm os menores índices de desmatamento em todo o continente.",
  },
  {
    id: "p4",
    titulo: "Ameaças à Serra do Curral",
    pergunta: "Qual é o perigo da mineração na Serra do Curral?",
    resposta: "A extração de ferro ameaça a água e a canga de Belo Horizonte.",
  },
];

export default function PainelAmeacasClient({ registrosIniciais }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaAmeaca | "todas">("todas");
  const [riscoAtivo, setRiscoAtivo] = useState<GrauRisco | "todos">("todos");
  const [paisAtivo, setPaisAtivo] = useState<string>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("nome");
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<"asc" | "desc">("asc");
  const [itemExpandidoId, setItemExpandidoId] = useState<string | null>(null);
  const [perguntaCivicaAberta, setPerguntaCivicaAberta] = useState<string | null>(null);

  // Lista de países únicos presentes no acervo
  const paisesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    for (const r of registrosIniciais) {
      conjunto.add(r.pais);
    }
    return Array.from(conjunto).sort();
  }, [registrosIniciais]);

  // Filtragem multifacetada em tempo real com normalização de acentos
  const registrosFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim());

    return registrosIniciais.filter((item) => {
      if (categoriaAtiva !== "todas" && item.categoria !== categoriaAtiva) {
        return false;
      }

      if (riscoAtivo !== "todos" && item.grauRisco !== riscoAtivo) {
        return false;
      }

      if (paisAtivo !== "todos" && item.pais !== paisAtivo && !item.pais.includes(paisAtivo)) {
        return false;
      }

      if (termo) {
        const corpus = semAcento(
          `${item.nome} ${item.subtitulo} ${item.pais} ${item.regiao} ${item.bioma} ${item.vetoresPressao} ${item.orgaoResponsavel} ${item.statusConservacao} ${item.descricaoImpacto}`
        );
        if (!corpus.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [registrosIniciais, busca, categoriaAtiva, riscoAtivo, paisAtivo]);

  // Ordenação estável por coluna
  const registrosOrdenados = useMemo(() => {
    const lista = [...registrosFiltrados];

    lista.sort((a, b) => {
      const valorA: string | number = a[colunaOrdenacao];
      const valorB: string | number = b[colunaOrdenacao];

      if (typeof valorA === "string" && typeof valorB === "string") {
        const comp = semAcento(valorA).localeCompare(semAcento(valorB));
        return direcaoOrdenacao === "asc" ? comp : -comp;
      }

      if (typeof valorA === "number" && typeof valorB === "number") {
        return direcaoOrdenacao === "asc" ? valorA - valorB : valorB - valorA;
      }

      return 0;
    });

    return lista;
  }, [registrosFiltrados, colunaOrdenacao, direcaoOrdenacao]);

  // Alterna direção de ordenação da coluna
  const alternarOrdenacao = (coluna: ColunaOrdenacao) => {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setColunaOrdenacao(coluna);
      setDirecaoOrdenacao("asc");
    }
  };

  // Disparo de download de CSV com BOM UTF-8
  const handleBaixarCsv = useCallback(() => {
    const conteudo = gerarCsvAmeacas(registrosOrdenados);
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `ameacas-socioambientais-americas-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [registrosOrdenados]);

  // Disparo de impressão nativa
  const handleImprimir = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Disparo de pergunta para o assistente Seu Nonô
  const handlePerguntarSeuNono = (prompt: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("abrir-seu-nono", {
          detail: { pergunta: prompt },
        })
      );
    }
  };

  // Limpar todos os filtros
  const handleLimparFiltros = () => {
    setBusca("");
    setCategoriaAtiva("todas");
    setRiscoAtivo("todos");
    setPaisAtivo("todos");
  };

  // Agregados reativos dos itens filtrados para o gráfico SVG
  const contagemRiscoFiltrada = useMemo(() => {
    const cont: Record<GrauRisco, number> = { Crítico: 0, Alto: 0, Moderado: 0 };
    for (const r of registrosOrdenados) {
      if (r.grauRisco in cont) cont[r.grauRisco]++;
    }
    return cont;
  }, [registrosOrdenados]);

  const contagemCategoriaFiltrada = useMemo(() => {
    const cont: Record<CategoriaAmeaca, number> = {
      especie: 0,
      rio: 0,
      serra: 0,
      comunidade: 0,
    };
    for (const r of registrosOrdenados) {
      if (r.categoria in cont) cont[r.categoria]++;
    }
    return cont;
  }, [registrosOrdenados]);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: ASSISTENTE CÍVICO SEU NONÔ (REGRA DAS SEIS QUALIDADES §5) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Assistente Cívico Seu Nonô"
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm print:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Sparkles size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Seu Nonô Explica as Ameaças das Américas
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  IA Cívica · RAG
                </span>
              </div>
              <p className="text-xs text-muted">
                Respostas acolhedoras e diretas em frases curtas baseadas em evidências oficiais.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              handlePerguntarSeuNono(
                "Quais são os maiores vetores de pressão sobre os rios e serras de Minas Gerais e das Américas?"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>Conversar com Seu Nonô</span>
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Pílulas de perguntas frequentes do Seu Nonô */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PERGUNTAS_CIVICAS_SEU_NONO.map((p) => {
            const aberta = perguntaCivicaAberta === p.id;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border/80 bg-surface p-3 transition-colors hover:border-primary/40"
              >
                <button
                  type="button"
                  onClick={() => setPerguntaCivicaAberta(aberta ? null : p.id)}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <span className="text-xs font-semibold text-foreground">{p.titulo}</span>
                  <span className="text-muted">{aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                </button>
                {aberta && (
                  <div className="mt-2 border-t border-border pt-2 text-xs text-text-soft">
                    <p className="font-medium text-foreground">{p.resposta}</p>
                    <button
                      type="button"
                      onClick={() => handlePerguntarSeuNono(p.pergunta)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <span>Aprofundar no chat</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: GRÁFICO SVG NATIVO E ACESSÍVEL (QUALIDADE 4 E 6)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Gráfico de distribuição de riscos e categorias"
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
              Raio-X do Acervo Filtrado
            </h3>
            <p className="text-xs text-text-soft">
              Mostrando {registrosOrdenados.length} de {registrosIniciais.length} ameaças catalogadas
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-600" />
              <span>Crítico ({contagemRiscoFiltrada.Crítico})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Alto ({contagemRiscoFiltrada.Alto})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-sky-500" />
              <span>Moderado ({contagemRiscoFiltrada.Moderado})</span>
            </span>
          </div>
        </div>

        {/* Gráfico de barras SVG nativo sem bibliotecas pesadas */}
        <div className="relative pt-2">
          <svg
            className="w-full h-12 rounded-lg bg-surface-2 overflow-hidden"
            viewBox="0 0 1000 48"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Gráfico de proporção de risco: ${contagemRiscoFiltrada.Crítico} críticos, ${contagemRiscoFiltrada.Alto} altos, ${contagemRiscoFiltrada.Moderado} moderados.`}
          >
            {registrosOrdenados.length > 0 ? (
              <>
                {/* Segmento Crítico */}
                <rect
                  x="0"
                  y="0"
                  width={`${(contagemRiscoFiltrada.Crítico / registrosOrdenados.length) * 1000}`}
                  height="48"
                  fill="#e11d48"
                  opacity="0.9"
                />
                {/* Segmento Alto */}
                <rect
                  x={`${(contagemRiscoFiltrada.Crítico / registrosOrdenados.length) * 1000}`}
                  y="0"
                  width={`${(contagemRiscoFiltrada.Alto / registrosOrdenados.length) * 1000}`}
                  height="48"
                  fill="#d97706"
                  opacity="0.9"
                />
                {/* Segmento Moderado */}
                <rect
                  x={`${
                    ((contagemRiscoFiltrada.Crítico + contagemRiscoFiltrada.Alto) /
                      registrosOrdenados.length) *
                    1000
                  }`}
                  y="0"
                  width={`${(contagemRiscoFiltrada.Moderado / registrosOrdenados.length) * 1000}`}
                  height="48"
                  fill="#0284c7"
                  opacity="0.9"
                />
              </>
            ) : (
              <rect x="0" y="0" width="1000" height="48" fill="#e2e8f0" />
            )}
          </svg>
        </div>

        {/* Distribuição por Categoria em Barras Rápidas */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base">🐾</span>
            <div>
              <span className="font-semibold text-foreground">
                {contagemCategoriaFiltrada.especie} Espécies
              </span>
              <span className="block text-[11px] text-muted">Fauna ameaçada</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base">🌊</span>
            <div>
              <span className="font-semibold text-foreground">
                {contagemCategoriaFiltrada.rio} Rios
              </span>
              <span className="block text-[11px] text-muted">Bacias em estresse</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base">⛰️</span>
            <div>
              <span className="font-semibold text-foreground">
                {contagemCategoriaFiltrada.serra} Serras
              </span>
              <span className="block text-[11px] text-muted">Cordilheiras e cumes</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base">🏹</span>
            <div>
              <span className="font-semibold text-foreground">
                {contagemCategoriaFiltrada.comunidade} Comunidades
              </span>
              <span className="block text-[11px] text-muted">Povos tradicionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 3: BARRA DE FERRAMENTAS, FILTROS E EXPORTAÇÃO (QUALIDADES 2 E 6) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Filtros e exportação de dados"
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4 print:hidden"
      >
        {/* Linha 1: Campo de Busca e Botões de Exportação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, espécie, rio, serra, território, mineração, agrotóxicos..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Buscar ameaças ambientais"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBaixarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors"
              title="Baixar planilha compatível com Excel (BOM UTF-8 e ponto-e-vírgula)"
            >
              <Download size={15} />
              <span>Baixar CSV</span>
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors"
              title="Imprimir relatório otimizado"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Pílulas de Categoria */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
            Categoria:
          </span>
          <button
            type="button"
            onClick={() => setCategoriaAtiva("todas")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaAtiva === "todas"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-text-soft hover:bg-surface-3"
            }`}
          >
            Todas ({registrosIniciais.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoriaAtiva("especie")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaAtiva === "especie"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-text-soft hover:bg-surface-3"
            }`}
          >
            <span>🐾 Espécies</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoriaAtiva("rio")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaAtiva === "rio"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-text-soft hover:bg-surface-3"
            }`}
          >
            <span>🌊 Rios</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoriaAtiva("serra")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaAtiva === "serra"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-text-soft hover:bg-surface-3"
            }`}
          >
            <span>⛰️ Serras</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoriaAtiva("comunidade")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaAtiva === "comunidade"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-text-soft hover:bg-surface-3"
            }`}
          >
            <span>🏹 Comunidades</span>
          </button>
        </div>

        {/* Linha 3: Filtros por Risco e por País */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-risco" className="text-xs font-semibold text-muted">
              Risco:
            </label>
            <select
              id="filtro-risco"
              value={riscoAtivo}
              onChange={(e) => setRiscoAtivo(e.target.value as GrauRisco | "todos")}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Riscos</option>
              <option value="Crítico">🔴 Crítico</option>
              <option value="Alto">🟠 Alto</option>
              <option value="Moderado">🔵 Moderado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filtro-pais" className="text-xs font-semibold text-muted">
              País:
            </label>
            <select
              id="filtro-pais"
              value={paisAtivo}
              onChange={(e) => setPaisAtivo(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os Países ({paisesDisponiveis.length})</option>
              {paisesDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {(busca || categoriaAtiva !== "todas" || riscoAtivo !== "todos" || paisAtivo !== "todos") && (
            <button
              type="button"
              onClick={handleLimparFiltros}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 4: TABELA E CARDS ORDENÁVEIS (QUALIDADES 1 E 3)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section aria-label="Lista de Ameaças Ambientais nas Américas" className="w-full max-w-full min-w-0 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted px-1">
          <span>
            Exibindo <strong>{registrosOrdenados.length}</strong> ameaças encontradas
          </span>
          <span>Clique em um registro para ver o resumo completo e a evidência oficial</span>
        </div>

        {registrosOrdenados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-12 text-center">
            <ShieldAlert size={36} className="mx-auto text-muted mb-3" />
            <h4 className="text-base font-semibold text-foreground">Nenhuma ameaça encontrada</h4>
            <p className="mt-1 text-xs text-muted max-w-md mx-auto">
              Nenhum registro corresponde aos filtros selecionados. Tente ajustar os termos de busca ou remover os filtros de categoria e país.
            </p>
            <button
              type="button"
              onClick={handleLimparFiltros}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              <RotateCcw size={14} />
              <span>Redefinir filtros</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            {/* Tabela de 6 colunas: o próprio card é o invólucro de rolagem.
                `w-full max-w-full min-w-0` impede que a largura mínima da
                tabela estique o container pai (flex/grid) e crie scroll
                horizontal na página inteira — a rolagem fica contida aqui.
                Mesmo padrão de TabelaProposicoes.tsx e TabelaCidadesClient.tsx. */}
            <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b border-border bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("categoria")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <span>Categoria</span>
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("nome")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <span>Nome / Subtítulo</span>
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("pais")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <span>País / Região</span>
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao("grauRisco")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <span>Risco</span>
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <span>Status / Vetores</span>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      <span>Fonte Oficial</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {registrosOrdenados.map((item) => {
                    const expandido = itemExpandidoId === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`group transition-colors ${
                          expandido ? "bg-surface-2" : "hover:bg-surface-2/60"
                        }`}
                      >
                        {/* Coluna Categoria */}
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-xs font-semibold text-foreground">
                            <span>{CATEGORIA_ICONE[item.categoria]}</span>
                            <span>{CATEGORIA_LABEL[item.categoria].split(" ")[0]}</span>
                          </span>
                        </td>

                        {/* Coluna Nome e Subtítulo */}
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => setItemExpandidoId(expandido ? null : item.id)}
                            className="text-left group-hover:text-primary transition-colors"
                          >
                            <span className="font-bold text-foreground block text-sm">
                              {item.nome}
                            </span>
                            <span className="text-xs text-muted block italic">
                              {item.subtitulo}
                            </span>
                          </button>

                          {/* Seção expandida de detalhes e impacto */}
                          {expandido && (
                            <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs text-text-soft">
                              <div>
                                <strong className="text-foreground">Impacto Socioambiental:</strong>{" "}
                                {item.descricaoImpacto}
                              </div>
                              <div>
                                <strong className="text-foreground">Vetores de Pressão:</strong>{" "}
                                {item.vetoresPressao}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted pt-1">
                                <span>
                                  <strong>Extensão / População:</strong> {item.extensaoOuPopulacao}
                                </span>
                                <span>
                                  <strong>Bioma:</strong> {item.bioma}
                                </span>
                                <span>
                                  <strong>Órgão:</strong> {item.orgaoResponsavel}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Coluna País e Região */}
                        <td className="px-4 py-3 align-top whitespace-nowrap text-xs">
                          <span className="font-medium text-foreground block">{item.pais}</span>
                          <span className="text-muted block text-[11px] truncate max-w-[160px]">
                            {item.regiao}
                          </span>
                        </td>

                        {/* Coluna Grau de Risco */}
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              item.grauRisco === "Crítico"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                : item.grauRisco === "Alto"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                            }`}
                          >
                            <span>●</span>
                            <span>{item.grauRisco}</span>
                          </span>
                        </td>

                        {/* Coluna Status e Vetores resumidos */}
                        <td className="px-4 py-3 align-top text-xs max-w-xs">
                          <span className="text-foreground font-medium block truncate">
                            {item.statusConservacao}
                          </span>
                          <span className="text-muted text-[11px] block line-clamp-1">
                            {item.vetoresPressao}
                          </span>
                        </td>

                        {/* Coluna Ações e Link Oficial */}
                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setItemExpandidoId(expandido ? null : item.id)}
                              className="text-xs text-muted hover:text-foreground font-medium underline"
                              aria-expanded={expandido}
                            >
                              {expandido ? "Menos" : "Detalhes"}
                            </button>
                            <a
                              href={item.urlFonte}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-surface-3 transition-colors"
                              title={`Abrir fonte oficial: ${item.fonteOficial}`}
                            >
                              <span>Fonte</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 5: RESSALVAS METODOLÓGICAS E DECLARAÇÃO DE FONTES           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="rounded-2xl border border-border bg-surface-2 p-5 text-xs text-muted space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Info size={16} className="text-primary" />
          <span>Metodologia e Verificação Direta das Fontes</span>
        </div>
        <p className="leading-relaxed">
          Os dados publicados neste painel derivam estritamente de documentos públicos oficiais de órgãos ambientais
          e indigenistas nacionais e internacionais (ICMBio, MMA, ANA, IGAM, FUNAI, Palmares, US EPA, ECCC e IUCN).
          Nenhuma inferência sobre culpa criminal de terceiros é feita sem trânsito em julgado. As fontes oficiais
          são hiperlinkadas e verificadas no ato da publicação no padrão ABNT (Autor, Data).
        </p>
        <p className="text-[11px] opacity-80">
          Última medição e consolidação técnica realizada em 01/10/2026. Acervo compactado via{" "}
          <code>compactar.ts</code> em <code>apps/web/data/ambiente/ameacas-americas.compact.json</code>.
        </p>
      </footer>
    </div>
  );
}
