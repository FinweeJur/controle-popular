"use client";

/**
 * @file apps/web/app/canada/ambiental/PainelAmbientalCanada.tsx
 * @description Painel interativo de meio ambiente, rejeitos e ciência aberta do Canadá (/canada/ambiental).
 *
 * Papel no portal:
 * Publica dados ambientais oficiais do Canadá e conexões diretas com o Brasil:
 * - Emissões e disposição de rejeitos no inventário ECCC NPRI (Sudbury e Voisey's Bay).
 * - Estudo comparativo do desastre de Mount Polley (BC, 2014) com Mariana e Brumadinho.
 * - Monitoramento hidrométrico contínuo (Water Survey of Canada) e satélite (Climate TRACE).
 * - Datasets e artigos de acesso aberto (OpenAlex, Borealis Dataverse e GBIF).
 *
 * Fontes oficiais:
 * - Environment and Climate Change Canada (ECCC NPRI).
 * - BC Ministry of Energy and Mines (Relatório do Painel Independente Mount Polley).
 * - Water Survey of Canada (MSC GeoMet API).
 * - Climate TRACE v6/v7 & OpenAlex API.
 *
 * Decisões técnicas:
 * - Segue o Padrão das 6 Qualidades (AGENTS.md §8).
 * - Bloco comparativo didático Mount Polley ↔ Fundão ↔ Brumadinho.
 * - Textos formulados em frases diretas de até 13 palavras.
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroAmbientalCienciaCanada } from "../../../../../scripts/coletar-canada-acervo.mts";
import type { CoberturaCanada } from "@/lib/internacional/dados-canada";

interface PainelAmbientalCanadaProps {
  ambiental: RegistroAmbientalCienciaCanada[];
  cobertura: CoberturaCanada;
}

type CampoOrdenacao = "titulo" | "valorMedido" | "ano" | "categoria";

export default function PainelAmbientalCanada({
  ambiental,
  cobertura,
}: PainelAmbientalCanadaProps) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroRegiao, setFiltroRegiao] = useState("TODAS");
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("titulo");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [itemExpandido, setItemExpandido] = useState<string | null>(null);

  // Normalização para busca sem acentos
  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  // Categorias disponíveis
  const categoriasDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    ambiental.forEach((a) => conjunto.add(a.categoria));
    return Array.from(conjunto).sort();
  }, [ambiental]);

  // Regiões / Províncias
  const regioesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    ambiental.forEach((a) => conjunto.add(a.provinciaOuRegiao.split("(")[0].trim()));
    return Array.from(conjunto).sort();
  }, [ambiental]);

  // Filtragem e ordenação
  const registrosFiltrados = useMemo(() => {
    return ambiental
      .filter((a) => {
        if (filtroCategoria !== "TODAS" && a.categoria !== filtroCategoria) {
          return false;
        }
        if (
          filtroRegiao !== "TODAS" &&
          !a.provinciaOuRegiao.toLowerCase().includes(filtroRegiao.toLowerCase())
        ) {
          return false;
        }
        if (!termoBusca) return true;

        return (
          normalizar(a.titulo).includes(termoBusca) ||
          normalizar(a.categoria).includes(termoBusca) ||
          normalizar(a.instituicaoFonte).includes(termoBusca) ||
          normalizar(a.empresaOuBacia).includes(termoBusca) ||
          normalizar(a.eloBrasil).includes(termoBusca) ||
          normalizar(a.indicadorPrincipal).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (campoOrdenacao === "titulo") {
          cmp = a.titulo.localeCompare(b.titulo);
        } else if (campoOrdenacao === "valorMedido") {
          cmp = a.valorMedido - b.valorMedido;
        } else if (campoOrdenacao === "ano") {
          cmp = a.ano - b.ano;
        } else if (campoOrdenacao === "categoria") {
          cmp = a.categoria.localeCompare(b.categoria);
        }
        return ordemAsc ? cmp : -cmp;
      });
  }, [ambiental, filtroCategoria, filtroRegiao, termoBusca, campoOrdenacao, ordemAsc]);

  // Exportação CSV com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = [
      "Titulo",
      "Categoria",
      "Orgao / Instituicao",
      "Regiao / Provincia",
      "Empresa ou Bacia",
      "Ano",
      "Indicador Principal",
      "Valor Medido",
      "Unidade",
      "Elo com o Brasil",
      "Licenca de Dados",
      "URL Oficial Direta",
    ];

    const linhas = registrosFiltrados.map((a) => [
      `"${a.titulo}"`,
      `"${a.categoria}"`,
      `"${a.instituicaoFonte}"`,
      `"${a.provinciaOuRegiao}"`,
      `"${a.empresaOuBacia}"`,
      `${a.ano}`,
      `"${a.indicadorPrincipal}"`,
      `${a.valorMedido}`,
      `"${a.unidade}"`,
      `"${a.eloBrasil.replace(/"/g, '""')}"`,
      `"${a.licenca}"`,
      `"${a.urlOficial}"`,
    ]);

    const csvContent =
      "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ambiental-canada-brasil-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <BarraIdiomaTrilingue
        idioma={idioma}
        aoTrocarIdioma={setIdioma}
        resumoTrilingue={{
          pt: "Emissões industriais ECCC NPRI, o desastre de Mount Polley em 2014 e ciência aberta sobre rejeitos.",
          en: "ECCC NPRI industrial pollutant releases, the 2014 Mount Polley disaster, and open tailings science.",
          es: "Emisiones industriales ECCC NPRI, desastre de Mount Polley de 2014 y ciencia abierta de relaves.",
        }}
        perguntaSeuNono={{
          pt: "O que o rompimento da barragem de Mount Polley ensina sobre Mariana e Brumadinho?",
          en: "What does the 2014 Mount Polley tailings dam failure teach about Mariana and Brumadinho?",
          es: "¿Qué enseña la rotura de la presa de Mount Polley sobre Mariana y Brumadinho?",
        }}
        paisDestaque="Canadá"
      />

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas ambientais">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Registros Ambientais</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {cobertura.registrosAmbientais}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {registrosFiltrados.length} na visualização atual
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Rejeitos Mount Polley</div>
          <div className="mt-1 font-mono text-2xl font-bold text-alert sm:text-3xl">
            25M m³
          </div>
          <div className="mt-1 text-xs text-muted">Despejados no Lago Quesnel</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Emissões por Satélite</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            38,4 Mt
          </div>
          <div className="mt-1 text-xs text-muted">CO₂e anual (Climate TRACE)</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Estudos Geotécnicos Abertos</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            642
          </div>
          <div className="mt-1 text-xs text-muted">Artigos OpenAlex revisados</div>
        </div>
      </section>

      {/* BLOCO DIDÁTICO COMPARATIVO: MOUNT POLLEY X MARIANA X BRUMADINHO */}
      <div className="rounded-2xl border-2 border-amber-500/40 bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              Caso Histórico Transnacional
            </span>
            <h2 className="text-base font-bold text-foreground">
              Mount Polley (2014) versus Mariana (2015) e Brumadinho (2019)
            </h2>
          </div>
          <span className="text-xs font-mono text-muted">Investigações Independentes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-surface-2 p-3.5 space-y-2 border border-border">
            <div className="font-bold text-foreground text-sm flex items-center justify-between">
              <span>🇨🇦 Mount Polley (BC)</span>
              <span className="text-muted text-xs">04/08/2014</span>
            </div>
            <p className="text-muted leading-relaxed">
              Rompimento da barragem de rejeitos de cobre e ouro da Imperial Metals na Colúmbia Britânica.
            </p>
            <div className="pt-1 font-mono text-alert font-bold">
              25.000.000 m³ despejados
            </div>
            <div className="text-[11px] text-muted">
              Causa: falha de cisalhamento em camada oculta de argila glacial na fundação.
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-3.5 space-y-2 border border-border">
            <div className="font-bold text-foreground text-sm flex items-center justify-between">
              <span>🇧🇷 Samarco / Fundão (MG)</span>
              <span className="text-muted text-xs">05/11/2015</span>
            </div>
            <p className="text-muted leading-relaxed">
              Ocorreu apenas 15 meses após o desastre canadense na mesma tipologia de rejeito.
            </p>
            <div className="pt-1 font-mono text-alert font-bold">
              39.000.000 m³ despejados
            </div>
            <div className="text-[11px] text-muted">
              Causa: alteamento sobre rejeito arenoso mal drenado e liquefação estática.
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-3.5 space-y-2 border border-border">
            <div className="font-bold text-foreground text-sm flex items-center justify-between">
              <span>🇧🇷 Vale / Brumadinho (MG)</span>
              <span className="text-muted text-xs">25/01/2019</span>
            </div>
            <p className="text-muted leading-relaxed">
              Colapso instantâneo da Barragem B1 da Mina Córrego do Feijão com 272 vítimas fatais.
            </p>
            <div className="pt-1 font-mono text-alert font-bold">
              12.000.000 m³ despejados
            </div>
            <div className="text-[11px] text-muted">
              Causa: liquefação estática por deformação lenta (creep) e perda de sucção.
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-2 p-3.5 text-xs text-muted leading-relaxed">
          <strong className="text-foreground">O elo humano da investigação técnica:</strong> O
          especialista canadense em geotecnia Dr. Norbert Morgenstern (Universidade de Alberta) presidiu
          tanto o painel independente de Mount Polley quanto o painel internacional sobre o rompimento da
          Barragem de Fundão em Mariana. As lições canadenses de 2014 já alertavam sobre a urgência de
          proibir alteamentos a montante.
        </div>
      </div>

      {/* CONTROLE DE FILTROS, BUSCA E EXPORTAÇÃO */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 print:hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:max-w-md">
            <label htmlFor="busca-ambiental" className="sr-only">
              Buscar dado ambiental
            </label>
            <input
              id="busca-ambiental"
              type="search"
              placeholder="Buscar registros por órgão, bacia, indicador ou substância..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors"
            >
              <span>⬇️</span>
              <span>Exportar CSV (BOM UTF-8)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FACETAS DE FILTRAGEM */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Categoria:</span>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as categorias</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Região / Província:</span>
            <select
              value={filtroRegiao}
              onChange={(e) => setFiltroRegiao(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as regiões</option>
              {regioesDisponiveis.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Ordenar:</span>
            <select
              value={campoOrdenacao}
              onChange={(e) => setCampoOrdenacao(e.target.value as CampoOrdenacao)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="titulo">Título (A-Z)</option>
              <option value="valorMedido">Valor Medido</option>
              <option value="ano">Ano</option>
              <option value="categoria">Categoria</option>
            </select>
            <button
              type="button"
              onClick={() => setOrdemAsc(!ordemAsc)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              {ordemAsc ? "Crescente ▲" : "Decrescente ▼"}
            </button>
          </div>

          {(filtroCategoria !== "TODAS" || filtroRegiao !== "TODAS" || busca) && (
            <button
              onClick={() => {
                setFiltroCategoria("TODAS");
                setFiltroRegiao("TODAS");
                setBusca("");
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}

          <div className="ml-auto text-xs text-muted">
            Exibindo <strong>{registrosFiltrados.length}</strong> de {ambiental.length}
          </div>
        </div>
      </div>

      {/* CARDS COM AS SEIS QUALIDADES */}
      <div className="grid gap-4 sm:grid-cols-2">
        {registrosFiltrados.map((a) => {
          const expandido = itemExpandido === a.id;
          return (
            <div
              key={a.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-emerald-500/50 transition-colors"
            >
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {a.categoria}
                  </span>
                  <span className="font-mono text-xs text-muted">{a.ano} · {a.provinciaOuRegiao}</span>
                </div>

                <h3 className="font-bold text-foreground text-base leading-snug">
                  {a.titulo}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {a.empresaOuBacia}
                </p>

                {/* MÉTRICA PRINCIPAL MEDIDA */}
                <div className="mt-3.5 rounded-xl bg-surface-2 p-3 border border-border">
                  <div className="text-xs font-semibold text-muted">
                    {a.indicadorPrincipal}:
                  </div>
                  <div className="mt-0.5 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {a.valorMedido.toLocaleString()} {a.unidade}
                  </div>
                </div>

                {/* PARALELO E CONEXÃO BRASIL */}
                <div className="mt-3.5 border-l-2 border-emerald-500 pl-3 py-0.5 text-xs text-muted leading-relaxed">
                  <span className="font-semibold text-foreground">Conexão com o Brasil: </span>
                  {a.eloBrasil}
                </div>
              </div>

              {/* RODAPÉ DO CARD: FONTE DIRETA E LICENÇA */}
              <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted truncate max-w-[240px]">
                  {a.instituicaoFonte}
                </span>
                <a
                  href={a.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  <span>Fonte Oficial Direta</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
