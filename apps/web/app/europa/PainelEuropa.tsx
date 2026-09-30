"use client";

/**
 * @file apps/web/app/europa/PainelEuropa.tsx
 * @description Painel interativo do Hub Europa e Conexões Transnacionais (/europa).
 *
 * Papel no portal:
 * Permite ao cidadão, pesquisador e comunidades atingidas auditar, pesquisar e exportar
 * litígios internacionais, regulações de devida diligência e concessões públicas de multinacionais
 * europeias no Brasil, sob o Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8):
 * 1. Links diretos e canônicos para tribunais (High Court Londres, Rechtbank Rotterdam, BAFA, etc.).
 * 2. Busca multifacetada sem acento (país, categoria, setor, empresa matriz, município afetado).
 * 3. Ordenação bidirecional (crescente/decrescente) em todas as colunas relevantes.
 * 4. Cartões de topo com agregados medidos datados de COBERTURA_EUROPA.
 * 5. Microresumos e frases curtas de até 13 palavras para o assistente Seu Nonô com Barra Trilingue.
 * 6. Exportação em planilha CSV com BOM UTF-8 (\uFEFF) e layout nativo de impressão.
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Printer,
  Scale,
  Building2,
  Globe2,
  ShieldAlert,
  FileText,
  Filter,
  RotateCcw,
  Sparkles,
  MapPin,
  Eye,
  X,
  Layers,
  CheckCircle2,
} from "lucide-react";
import type {
  RegistroTransnacionalEuropa,
  CoberturaEuropa,
} from "@/lib/internacional/dados-europa";
import { gerarCsvEuropa, calcularAgregadosEuropa } from "@/lib/internacional/dados-europa";
import { semAcento } from "@/lib/busca/normalizar";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao, TextoTrilingue } from "@/lib/internacional/idiomas-internacional";

export interface PainelEuropaProps {
  dadosIniciais: RegistroTransnacionalEuropa[];
  coberturaEstatica: CoberturaEuropa;
}

const RESUMO_TRILINGUE: TextoTrilingue = {
  pt: "Acervo de litígios e conexões transnacionais entre a Europa e o Brasil: processo histórico de Mariana contra a BHP em Londres (£36 bi), Braskem no Tribunal de Roterdã, devida diligência do BAFA alemão (LkSG), regulamento antidesmatamento da UE (EUDR) e grandes concessões corporativas.",
  en: "Transnational records and litigation between Europe and Brazil: Mariana BHP trial in London High Court (£36bn), Braskem in Rotterdam District Court, German supply chain due diligence (LkSG), EU deforestation regulation (EUDR), and public utility concessions.",
  es: "Archivo de litigios y conexiones transnacionales entre Europa y Brasil: juicio de Mariana contra BHP en Londres (£36 mil millones), Braskem en Róterdam, debida diligencia alemana (LkSG), regulación de deforestación de la UE (EUDR) y concesiones corporativas.",
};

const PERGUNTA_SEU_NONO: TextoTrilingue = {
  pt: "Como a Justiça da Inglaterra e da Holanda responsabilizou multinacionais por desastres no Brasil?",
  en: "How did British and Dutch courts hold multinationals accountable for disasters in Brazil?",
  es: "¿Cómo responsabilizaron los tribunais británicos y neerlandeses a multinacionales por desastres en Brasil?",
};

type CampoOrdenacao =
  | "empresaEstrangeira"
  | "paisOrigem"
  | "dataAto"
  | "valorCausaBrl"
  | "municipioNome"
  | "setorEconomico";

export default function PainelEuropa({
  dadosIniciais,
  coberturaEstatica,
}: PainelEuropaProps) {
  // Estados de controle e filtros
  const [busca, setBusca] = useState("");
  const [filtroPais, setFiltroPais] = useState("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODOS");
  const [filtroSetor, setFiltroSetor] = useState("TODOS");
  const [filtroMunicipio, setFiltroMunicipio] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  // Ordenação
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("dataAto");
  const [direcaoAsc, setDirecaoAsc] = useState(false); // Mais recente por padrão

  // Visualização e idioma
  const [modoExibicao, setModoExibicao] = useState<"tabela" | "cards">("cards");
  const [itemSelecionado, setItemSelecionado] = useState<RegistroTransnacionalEuropa | null>(null);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Opções únicas para selects de facetas
  const paisesDisponiveis = useMemo(() => {
    const set = new Set(dadosIniciais.map((d) => d.paisOrigem));
    return Array.from(set).sort();
  }, [dadosIniciais]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set(dadosIniciais.map((d) => d.categoria));
    return Array.from(set).sort();
  }, [dadosIniciais]);

  const setoresDisponiveis = useMemo(() => {
    const set = new Set(dadosIniciais.map((d) => d.setorEconomico));
    return Array.from(set).sort();
  }, [dadosIniciais]);

  const municipiosDisponiveis = useMemo(() => {
    const set = new Set(
      dadosIniciais
        .map((d) => d.municipioNome)
        .filter((m) => m && !m.startsWith("Nacional") && !m.startsWith("Internacional"))
    );
    return Array.from(set).sort();
  }, [dadosIniciais]);

  const statusDisponiveis = useMemo(() => {
    const set = new Set(dadosIniciais.map((d) => d.statusProcessual));
    return Array.from(set).sort();
  }, [dadosIniciais]);

  // Filtragem multifacetada e busca sem acento
  const dadosFiltrados = useMemo(() => {
    const termoBusca = semAcento(busca.trim().toLowerCase());

    return dadosIniciais.filter((item) => {
      // Filtros exatos de faceta
      if (filtroPais !== "TODOS" && item.paisOrigem !== filtroPais) return false;
      if (filtroCategoria !== "TODOS" && item.categoria !== filtroCategoria) return false;
      if (filtroSetor !== "TODOS" && item.setorEconomico !== filtroSetor) return false;
      if (filtroMunicipio !== "TODOS" && item.municipioNome !== filtroMunicipio) return false;
      if (filtroStatus !== "TODOS" && item.statusProcessual !== filtroStatus) return false;

      // Busca textual tolerante a acento
      if (termoBusca) {
        const textoCompleto = semAcento(
          [
            item.empresaEstrangeira,
            item.empresaBrasileira,
            item.paisOrigem,
            item.processoOuRegistroNumero,
            item.orgaoJulgadorOuRegulador,
            item.municipioNome,
            item.uf,
            item.setorEconomico,
            item.resumoFato,
            item.contextoCivico,
            item.marcoLegal,
            item.identificadorFiscalEstrangeiro,
            item.cnpjBrasileiro,
          ].join(" ").toLowerCase()
        );
        if (!textoCompleto.includes(termoBusca)) return false;
      }

      return true;
    });
  }, [
    dadosIniciais,
    busca,
    filtroPais,
    filtroCategoria,
    filtroSetor,
    filtroMunicipio,
    filtroStatus,
  ]);

  // Ordenação bidirecional
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      let resultado = 0;
      switch (campoOrdenacao) {
        case "empresaEstrangeira":
          resultado = a.empresaEstrangeira.localeCompare(b.empresaEstrangeira);
          break;
        case "paisOrigem":
          resultado = a.paisOrigem.localeCompare(b.paisOrigem);
          break;
        case "dataAto":
          resultado = a.dataAto.localeCompare(b.dataAto);
          break;
        case "valorCausaBrl":
          resultado = a.valorCausaBrl - b.valorCausaBrl;
          break;
        case "municipioNome":
          resultado = a.municipioNome.localeCompare(b.municipioNome);
          break;
        case "setorEconomico":
          resultado = a.setorEconomico.localeCompare(b.setorEconomico);
          break;
      }
      return direcaoAsc ? resultado : -resultado;
    });
  }, [dadosFiltrados, campoOrdenacao, direcaoAsc]);

  // Agregados dinâmicos calculados sobre a seleção ativa
  const agregadosDinamicos = useMemo(() => {
    return calcularAgregadosEuropa(dadosOrdenados);
  }, [dadosOrdenados]);

  // Função para alternar ordenação por coluna
  const alternarOrdenacao = useCallback(
    (campo: CampoOrdenacao) => {
      if (campoOrdenacao === campo) {
        setDirecaoAsc((ant) => !ant);
      } else {
        setCampoOrdenacao(campo);
        setDirecaoAsc(true);
      }
    },
    [campoOrdenacao]
  );

  // Download CSV com BOM UTF-8
  const baixarCsv = useCallback(() => {
    const csvContent = gerarCsvEuropa(dadosOrdenados);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `controle-popular_europa-transnacional_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dadosOrdenados]);

  // Imprimir layout nativo
  const dispararImpressao = useCallback(() => {
    window.print();
  }, []);

  // Limpar todos os filtros
  const limparFiltros = useCallback(() => {
    setBusca("");
    setFiltroPais("TODOS");
    setFiltroCategoria("TODOS");
    setFiltroSetor("TODOS");
    setFiltroMunicipio("TODOS");
    setFiltroStatus("TODOS");
  }, []);

  // Formatação monetária amigável
  const formatarValor = (valor: number, moeda: string) => {
    if (valor === 0) return "Não monetário / Regulatório";
    if (moeda === "GBP") {
      return `£ ${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bilhões`;
    }
    if (moeda === "EUR") {
      return `€ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} milhões`;
    }
    if (moeda === "USD") {
      return `US$ ${(valor / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bilhões`;
    }
    return `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} milhões`;
  };

  return (
    <div className="space-y-8">
      {/* BARRA DE IDIOMA TRILÍNGUE COM TTS E CONTEXTO SEU NONÔ */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={RESUMO_TRILINGUE}
          perguntaSeuNono={PERGUNTA_SEU_NONO}
          paisDestaque="Ambos"
        />
      </div>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (QUALIDADE 4) */}
      <section
        aria-label="Agregados medidos de topo"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-3"
      >
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Globe2 size={14} className="text-primary" />
            <span>Nações Europeias</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {agregadosDinamicos.totalPaises} de {coberturaEstatica.totalPaises}
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Reino Unido, Alemanha, França, Holanda e mais.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Scale size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Ações Transnacionais</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {agregadosDinamicos.totalLitigiosTransnacionais + agregadosDinamicos.totalPrecedentesJurisdicionais}
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            High Court Londres, Roterdã e Paris.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <ShieldAlert size={14} className="text-red-600 dark:text-red-400" />
            <span>Valor em Litígio</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            £ 36 bi
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            ~R$ 260 bilhões no caso BHP Mariana.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Grandes Concessões</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {agregadosDinamicos.totalOperacoesCorporativas}
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Enel, Santander, EDP, Neoenergia, Total.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Municípios do Brasil</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {agregadosDinamicos.municipiosBrasileirosConectados}
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            Com territórios ou impactos catalogados.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-soft">
            <FileText size={14} className="text-purple-600 dark:text-purple-400" />
            <span>Devida Diligência</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            {agregadosDinamicos.totalRegulacoesDueDiligence}
          </div>
          <div className="mt-1 text-[11px] text-text-soft">
            LkSG Alemanha, EUDR e CSDDD europeus.
          </div>
        </div>
      </section>

      {/* PAINEL DE CONTROLE: BUSCA, FACETAS E AÇÕES DE EXPORTAÇÃO (QUALIDADES 2 E 6) */}
      <section
        aria-label="Controles de busca, facetas e exportação"
        className="rounded-2xl border border-border bg-surface p-5 shadow-xs print:hidden space-y-4"
      >
        {/* BARRA SUPERIOR: CAMPO DE BUSCA E BOTÕES PRINCIPAIS */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-soft"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa, tribunal, processo, cidade brasileira ou termo cívico..."
              aria-label="Campo de busca textual no acervo europeu"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-soft focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft hover:text-text"
                aria-label="Limpar termo de busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternar modo de visualização */}
            <div className="flex rounded-xl border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setModoExibicao("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  modoExibicao === "cards"
                    ? "bg-primary text-white"
                    : "text-text-soft hover:text-text"
                }`}
                aria-label="Exibir em modo Dossiê / Cartões"
              >
                <Layers size={14} />
                <span>Dossiês</span>
              </button>
              <button
                type="button"
                onClick={() => setModoExibicao("tabela")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  modoExibicao === "tabela"
                    ? "bg-primary text-white"
                    : "text-text-soft hover:text-text"
                }`}
                aria-label="Exibir em modo Tabela comparativa"
              >
                <FileText size={14} />
                <span>Tabela</span>
              </button>
            </div>

            {/* Exportar CSV (Qualidade 6) */}
            <button
              type="button"
              onClick={baixarCsv}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-elevated hover:border-primary/50 transition-colors"
              title="Baixar planilha CSV com BOM UTF-8 e separador de ponto e vírgula"
            >
              <Download size={14} className="text-primary" />
              <span>Exportar CSV</span>
            </button>

            {/* Imprimir Nativo (Qualidade 6) */}
            <button
              type="button"
              onClick={dispararImpressao}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-elevated transition-colors"
              title="Imprimir visualização vetorial acessível"
            >
              <Printer size={14} className="text-text-soft" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS FACETADOS (QUALIDADE 2) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 pt-2 border-t border-border/60">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-soft">
              País Sede / Origem
            </label>
            <select
              value={filtroPais}
              onChange={(e) => setFiltroPais(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="TODOS">Todos os Países ({coberturaEstatica.totalPaises})</option>
              {paisesDisponiveis.map((pais) => (
                <option key={pais} value={pais}>
                  {pais}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-soft">
              Categoria Cívica
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="TODOS">Todas as Categorias</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-soft">
              Setor Econômico
            </label>
            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="TODOS">Todos os Setores</option>
              {setoresDisponiveis.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-soft">
              Município Impactado
            </label>
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="TODOS">Todos os Municípios</option>
              {municipiosDisponiveis.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-soft">
              Status Processual
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-hidden"
            >
              <option value="TODOS">Todos os Status</option>
              {statusDisponiveis.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FEEDBACK DE FILTROS ATIVOS E RESET */}
        {(busca ||
          filtroPais !== "TODOS" ||
          filtroCategoria !== "TODOS" ||
          filtroSetor !== "TODOS" ||
          filtroMunicipio !== "TODOS" ||
          filtroStatus !== "TODOS") && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
            <span className="text-text-soft">
              Exibindo{" "}
              <strong className="text-text font-semibold">
                {dadosOrdenados.length}
              </strong>{" "}
              de{" "}
              <strong className="text-text font-semibold">
                {dadosIniciais.length}
              </strong>{" "}
              registros filtrados.
            </span>
            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <RotateCcw size={13} />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        )}
      </section>

      {/* MENSAGEM QUANDO NÃO HÁ RESULTADOS */}
      {dadosOrdenados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Filter size={32} className="mx-auto text-text-soft mb-3" />
          <h3 className="text-base font-bold text-text">Nenhum registro encontrado</h3>
          <p className="mt-1 text-sm text-text-soft max-w-md mx-auto">
            Nenhum litígio ou empresa corresponde aos filtros atuais. Tente buscar por outros termos ou redefinir os seletores.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
          >
            <RotateCcw size={14} />
            <span>Restaurar filtros originais</span>
          </button>
        </div>
      )}

      {/* VISUALIZAÇÃO EM MODO DOSSIÊ / CARDS */}
      {modoExibicao === "cards" && dadosOrdenados.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dadosOrdenados.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-md hover:border-primary/40 relative"
            >
              <div>
                {/* TOPO DO CARD: BANDEIRA, PAÍS E CATEGORIA */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg" title={item.paisOrigem}>
                      {item.bandeiraPais}
                    </span>
                    <span className="text-xs font-bold text-text">
                      {item.paisOrigem}
                    </span>
                    <span className="text-[10px] text-text-soft font-mono">
                      ({item.codigoIsoPais})
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      item.categoria === "Litígio Transnacional"
                        ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                        : item.categoria === "Devida Diligência & Regulação"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
                        : item.categoria === "Hub Logístico & Comércio"
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400"
                        : item.categoria === "Precedente Jurisdicional"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {item.categoria}
                  </span>
                </div>

                {/* EMPRESA MATRIZ E SUBSIDIÁRIA BRASILEIRA */}
                <h3 className="text-base font-bold text-text leading-tight group-hover:text-primary">
                  {item.empresaEstrangeira}
                </h3>
                <div className="mt-1 text-xs text-text-soft flex items-center gap-1">
                  <span>Filial no Brasil:</span>
                  <span className="font-semibold text-text">{item.empresaBrasileira}</span>
                </div>

                {/* CONTEXTO CÍVICO SEU NONÔ (QUALIDADE 5: FRASES CURTAS) */}
                <div className="mt-3 rounded-xl bg-primary/5 border border-primary/15 p-2.5">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary mb-1">
                    <Sparkles size={12} />
                    <span>Resumo Seu Nonô</span>
                  </div>
                  <p className="text-xs text-text leading-relaxed">
                    {item.contextoCivico}
                  </p>
                </div>

                {/* RESUMO DETALHADO DO FATO */}
                <p className="mt-3 text-xs text-text-soft line-clamp-3">
                  {item.resumoFato}
                </p>

                {/* METADADOS JURÍDICOS E ECONÔMICOS */}
                <div className="mt-4 space-y-1.5 pt-3 border-t border-border/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Tribunal / Órgão:</span>
                    <span className="font-semibold text-text text-right max-w-[60%] truncate">
                      {item.orgaoJulgadorOuRegulador}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Processo / Ato:</span>
                    <span className="font-mono text-[11px] text-text">
                      {item.processoOuRegistroNumero}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Município Impactado:</span>
                    <span className="font-semibold text-text">
                      {item.municipioNome} ({item.uf})
                    </span>
                  </div>
                  {item.valorCausaBrl > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-soft">Impacto / Valor:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarValor(item.valorCausaMoedaOrigem, item.moedaOrigem)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Status:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text">
                      <CheckCircle2 size={12} className="text-primary" />
                      {item.statusProcessual}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO: DETALHES E LINK OFICIAL (QUALIDADE 1) */}
              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setItemSelecionado(item)}
                  className="flex items-center gap-1 text-xs font-semibold text-text-soft hover:text-primary transition-colors"
                >
                  <Eye size={13} />
                  <span>Ver dossiê</span>
                </button>

                <a
                  href={item.urlOficialCanonica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-2.5 py-1.5 text-xs font-semibold text-primary hover:border-primary transition-colors"
                  title={`Acessar fonte oficial no ${item.tipoFonte}`}
                >
                  <span>Fonte Oficial</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* VISUALIZAÇÃO EM MODO TABELA COMPARATIVA (QUALIDADE 3: ORDENÁVEL) */}
      {modoExibicao === "tabela" && dadosOrdenados.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated border-b border-border text-text-soft">
                <tr>
                  <th
                    scope="col"
                    className="p-3 font-semibold cursor-pointer hover:text-text"
                    onClick={() => alternarOrdenacao("paisOrigem")}
                  >
                    <div className="flex items-center gap-1">
                      <span>País</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="p-3 font-semibold cursor-pointer hover:text-text"
                    onClick={() => alternarOrdenacao("empresaEstrangeira")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Empresa Matriz / Ré</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Filial no Brasil
                  </th>
                  <th
                    scope="col"
                    className="p-3 font-semibold cursor-pointer hover:text-text"
                    onClick={() => alternarOrdenacao("municipioNome")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Município / UF</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Tribunal / Órgão
                  </th>
                  <th
                    scope="col"
                    className="p-3 font-semibold cursor-pointer hover:text-text"
                    onClick={() => alternarOrdenacao("dataAto")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Data</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="p-3 font-semibold cursor-pointer hover:text-text"
                    onClick={() => alternarOrdenacao("valorCausaBrl")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Valor / Causa</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th scope="col" className="p-3 font-semibold text-right">
                    Fonte Direta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dadosOrdenados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-elevated/50 transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.bandeiraPais}</span>
                        <span className="font-semibold text-text">
                          {item.codigoIsoPais}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-text">
                        {item.empresaEstrangeira}
                      </div>
                      <div className="text-[11px] text-text-soft font-mono">
                        {item.identificadorFiscalEstrangeiro}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-text font-medium">
                        {item.empresaBrasileira}
                      </div>
                      <div className="text-[10px] text-text-soft">
                        {item.setorEconomico}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-text">
                        {item.municipioNome}
                      </span>
                      <span className="text-text-soft"> ({item.uf})</span>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={item.orgaoJulgadorOuRegulador}>
                      <div className="text-text truncate">{item.orgaoJulgadorOuRegulador}</div>
                      <div className="text-[10px] font-mono text-text-soft">{item.processoOuRegistroNumero}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-text-soft">
                      {item.dataAto}
                    </td>
                    <td className="p-3 whitespace-nowrap font-semibold text-text">
                      {formatarValor(item.valorCausaMoedaOrigem, item.moedaOrigem)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <a
                        href={item.urlOficialCanonica}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        title={item.tipoFonte}
                      >
                        <span>Oficial</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ACESSÍVEL DE DOSSIÊ DETALHADO */}
      {itemSelecionado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setItemSelecionado(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-text-soft hover:bg-surface-elevated hover:text-text"
              aria-label="Fechar dossiê detalhado"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">{itemSelecionado.bandeiraPais}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-soft">
                  {itemSelecionado.paisOrigem} • {itemSelecionado.categoria}
                </span>
                <h3 id="modal-titulo" className="text-xl font-bold text-text">
                  {itemSelecionado.empresaEstrangeira}
                </h3>
              </div>
            </div>

            {/* BOX CÍVICO SEU NONÔ */}
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                <Sparkles size={14} />
                <span>Contexto Cívico Direto (Seu Nonô)</span>
              </div>
              <p className="text-sm font-medium text-text leading-relaxed">
                {itemSelecionado.contextoCivico}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <strong className="block text-text-soft mb-1">Resumo dos Fatos & Litígio:</strong>
                <p className="text-text leading-relaxed text-sm bg-background p-3 rounded-xl border border-border">
                  {itemSelecionado.resumoFato}
                </p>
              </div>

              <div>
                <strong className="block text-text-soft mb-1">Impactos Socioambientais e Territoriais:</strong>
                <p className="text-text leading-relaxed text-sm bg-background p-3 rounded-xl border border-border">
                  {itemSelecionado.impactoHumanoOuAmbiental}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-text-soft block text-[11px]">Órgão ou Tribunal</span>
                  <span className="font-semibold text-text">{itemSelecionado.orgaoJulgadorOuRegulador}</span>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-text-soft block text-[11px]">Número do Processo</span>
                  <span className="font-mono text-text">{itemSelecionado.processoOuRegistroNumero}</span>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-text-soft block text-[11px]">Marco Legal Invocado</span>
                  <span className="font-semibold text-text">{itemSelecionado.marcoLegal}</span>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-text-soft block text-[11px]">Status Processual</span>
                  <span className="font-semibold text-text">{itemSelecionado.statusProcessual}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-soft">
                Fonte: {itemSelecionado.tipoFonte}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setItemSelecionado(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-surface-elevated"
                >
                  Fechar
                </button>
                <a
                  href={itemSelecionado.urlOficialCanonica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                >
                  <span>Abrir Julgado / Registro Oficial</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
