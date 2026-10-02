"use client";

/**
 * @file apps/web/app/america-latina/PainelAmericaLatina.tsx
 * @description Painel interativo do Observatório de Mineração na América Latina (/america-latina).
 *
 * Papel no portal:
 * Permite ao cidadão, pesquisador e comunidades atingidas pesquisar, auditar e exportar
 * informações de 51 megaminas, projetos de lítio, complexos metalúrgicos, portos e sedes
 * em 9 países latino-americanos, sob o Padrão das Seis Qualidades do Controle Popular (AGENTS.md §8):
 * 1. Links canônicos diretos para órgãos e fontes oficiais.
 * 2. Busca multifacetada tolerante a acentos e maiúsculas.
 * 3. Ordenação bidirecional por colunas nominais, país e mineral.
 * 4. Cartões de topo medidos datados de COBERTURA_AMERICA_LATINA.
 * 5. Assistente cívico Seu Nonô em orações diretas com frases curtas de até 13 palavras.
 * 6. Exportação em planilha CSV com BOM UTF-8 (\uFEFF) e layout nativo de impressão.
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Download,
  ExternalLink,
  Printer,
  Globe2,
  Building2,
  Layers,
  Filter,
  RotateCcw,
  Sparkles,
  MapPin,
  Eye,
  X,
  CheckCircle2,
  Anchor,
  Zap,
} from "lucide-react";
import type {
  InstalacaoMineradoraLatam,
  MineradoraLatam,
  CoberturaAmericaLatina,
  TipoInstalacaoLatam,
} from "@/lib/internacional/dados-america-latina";
import { semAcento } from "@/lib/busca/normalizar";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
// O link morto `/assistente?pergunta=` foi trocado por este botão, que
// dispara o Seu Nonô pelo evento global `abrir-seu-nono`.
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";
import type {
  IdiomaExibicao,
  TextoTrilingue,
} from "@/lib/internacional/idiomas-internacional";

export interface PainelAmericaLatinaProps {
  instalacoesIniciais: InstalacaoMineradoraLatam[];
  mineradorasIniciais: MineradoraLatam[];
  coberturaEstatica: CoberturaAmericaLatina;
}

const RESUMO_TRILINGUE: TextoTrilingue = {
  pt: "Observatório de 51 instalações estratégicas de mineração em 9 países da América Latina: megaminas de cobre e lítio no Atacama e Puna, bacias hidrográficas afetadas, portos exportadores e sedes corporativas globais.",
  en: "Civic observatory covering 51 strategic mining facilities across 9 Latin American countries: copper and lithium megamines in the Atacama and Puna, impacted river basins, export ports, and corporate headquarters.",
  es: "Observatorio cívico de 51 instalaciones mineras estratégicas en 9 países de América Latina: megaminas de cobre y litio en Atacama y Puna, cuencas hidrográficas impactadas, puertos exportadores y sedes corporativas.",
};

const PERGUNTA_SEU_NONO: TextoTrilingue = {
  pt: "Onde ficam as maiores minas de cobre e projetos de lítio da América Latina?",
  en: "Where are the largest copper mines and lithium projects located in Latin America?",
  es: "¿Dónde se ubican las mayores minas de cobre y proyectos de litio en América Latina?",
};

type CampoOrdenacao = "nome" | "empresa" | "pais" | "tipo" | "mineralPrincipal";

const BANDEIRAS_PAISES: Record<string, string> = {
  Brasil: "🇧🇷",
  Chile: "🇨🇱",
  Peru: "🇵🇪",
  Argentina: "🇦🇷",
  México: "🇲🇽",
  Colômbia: "🇨🇴",
  Bolívia: "🇧🇴",
  Equador: "🇪🇨",
  Panamá: "🇵🇦",
};

const ROTULOS_TIPO: Record<TipoInstalacaoLatam, string> = {
  mina_operacao: "Mina em Operação",
  projeto_litio: "Projeto de Lítio",
  porto_minerario: "Porto Minerário",
  sede_corporativa: "Sede Corporativa",
  complexo_beneficiamento: "Complexo de Beneficiamento",
};

export default function PainelAmericaLatina({
  instalacoesIniciais,
  mineradorasIniciais,
  coberturaEstatica,
}: PainelAmericaLatinaProps) {
  const [busca, setBusca] = useState("");
  const [filtroPais, setFiltroPais] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroMineral, setFiltroMineral] = useState("TODOS");

  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("pais");
  const [direcaoAsc, setDirecaoAsc] = useState(true);

  const [modoExibicao, setModoExibicao] = useState<"cards" | "tabela">("cards");
  const [instalacaoSelecionada, setInstalacaoSelecionada] =
    useState<InstalacaoMineradoraLatam | null>(null);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Opções únicas de minerais a partir do acervo
  const mineraisDisponiveis = useMemo(() => {
    const todos = new Set<string>();
    for (const item of instalacoesIniciais) {
      for (const mineral of item.mineralPrincipal.split("/")) {
        const limpo = mineral.trim();
        if (limpo) todos.add(limpo);
      }
    }
    return Array.from(todos).sort();
  }, [instalacoesIniciais]);

  // Filtragem multifacetada em tempo real
  const registrosFiltrados = useMemo(() => {
    let lista = instalacoesIniciais;

    if (filtroPais !== "TODOS") {
      lista = lista.filter((i) => i.pais === filtroPais);
    }

    if (filtroTipo !== "TODOS") {
      lista = lista.filter((i) => i.tipo === filtroTipo);
    }

    if (filtroMineral !== "TODOS") {
      const minBusca = semAcento(filtroMineral.toLowerCase());
      lista = lista.filter((i) =>
        semAcento(i.mineralPrincipal.toLowerCase()).includes(minBusca)
      );
    }

    if (busca.trim()) {
      const termo = semAcento(busca.trim().toLowerCase());
      lista = lista.filter((i) => {
        const nome = semAcento(i.nome.toLowerCase());
        const emp = semAcento(i.empresa.toLowerCase());
        const bacia = semAcento(i.baciaOuRegiao.toLowerCase());
        const desc = semAcento(i.descricao.toLowerCase());
        const mineral = semAcento(i.mineralPrincipal.toLowerCase());

        return (
          nome.includes(termo) ||
          emp.includes(termo) ||
          bacia.includes(termo) ||
          desc.includes(termo) ||
          mineral.includes(termo)
        );
      });
    }

    // Ordenação
    return [...lista].sort((a, b) => {
      const valA = (a[campoOrdenacao] || "").toString().toLowerCase();
      const valB = (b[campoOrdenacao] || "").toString().toLowerCase();
      return direcaoAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [
    instalacoesIniciais,
    filtroPais,
    filtroTipo,
    filtroMineral,
    busca,
    campoOrdenacao,
    direcaoAsc,
  ]);

  const alternarOrdenacao = useCallback((campo: CampoOrdenacao) => {
    setCampoOrdenacao((anterior) => {
      if (anterior === campo) {
        setDirecaoAsc((d) => !d);
        return campo;
      }
      setDirecaoAsc(true);
      return campo;
    });
  }, []);

  const limparFiltros = useCallback(() => {
    setBusca("");
    setFiltroPais("TODOS");
    setFiltroTipo("TODOS");
    setFiltroMineral("TODOS");
    setCampoOrdenacao("pais");
    setDirecaoAsc(true);
  }, []);

  // Exportação CSV com BOM UTF-8 (\uFEFF) e separador ';'
  const exportarCsv = useCallback(() => {
    const cabecalho = [
      "ID",
      "Nome da Instalação",
      "Empresa Operadora / Controladora",
      "País",
      "Tipo de Instalação",
      "Mineral Principal",
      "Status Operacional",
      "Latitude",
      "Longitude",
      "Bacia Hidrográfica / Região",
      "Fonte Oficial",
      "Descrição e Histórico",
    ];

    const linhas = registrosFiltrados.map((item) => [
      `"${item.id}"`,
      `"${item.nome.replace(/"/g, '""')}"`,
      `"${item.empresa.replace(/"/g, '""')}"`,
      `"${item.pais}"`,
      `"${ROTULOS_TIPO[item.tipo] || item.tipo}"`,
      `"${item.mineralPrincipal.replace(/"/g, '""')}"`,
      `"${item.status.replace(/"/g, '""')}"`,
      item.latitude.toString(),
      item.longitude.toString(),
      `"${item.baciaOuRegiao.replace(/"/g, '""')}"`,
      `"${item.fonteOficial.replace(/"/g, '""')}"`,
      `"${item.descricao.replace(/"/g, '""')}"`,
    ]);

    const csvConteudo =
      "\uFEFF" +
      [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mineracao-america-latina-controle-popular-${coberturaEstatica.dataMedicao}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [registrosFiltrados, coberturaEstatica.dataMedicao]);

  return (
    <div className="space-y-8">
      {/* BARRA TRILÍNGUE (PT / EN / ES) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={RESUMO_TRILINGUE}
          perguntaSeuNono={PERGUNTA_SEU_NONO}
        />
        <div className="text-xs text-text-soft">
          <span>Última medição: </span>
          <time
            dateTime={coberturaEstatica.dataMedicao}
            className="font-medium text-text"
          >
            30/09/2026
          </time>
        </div>
      </div>

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS (SEIS QUALIDADES §4) */}
      <section
        aria-label="Indicadores gerais"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <Globe2 className="h-4 w-4 text-primary" />
            <span>Países</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalPaises}
          </p>
          <span className="text-[11px] text-text-soft">América Latina</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <Layers className="h-4 w-4 text-amber-500" />
            <span>Instalações</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalInstalacoes}
          </p>
          <span className="text-[11px] text-text-soft">Georreferenciadas</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>Lítio</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalProjetosLitio}
          </p>
          <span className="text-[11px] text-text-soft">
            Projetos & salares
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <MapPin className="h-4 w-4 text-emerald-500" />
            <span>Cobre</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalMegaminasCobre}
          </p>
          <span className="text-[11px] text-text-soft">Megaminas ativas</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <Anchor className="h-4 w-4 text-cyan-500" />
            <span>Portos</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalPortosExportadores}
          </p>
          <span className="text-[11px] text-text-soft">Terminais oceânicos</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium text-text-soft">
            <Building2 className="h-4 w-4 text-purple-500" />
            <span>Empresas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text">
            {coberturaEstatica.totalMineradoras}
          </p>
          <span className="text-[11px] text-text-soft">Transnacionais</span>
        </div>
      </section>

      {/* CONTEXTO CÍVICO COM SEU NONÔ (SEIS QUALIDADES §5 - FRASES ATÉ 13 PALAVRAS) */}
      <section
        aria-label="Resumo cívico e assistente"
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text">
              Resumo Cívico · Seu Nonô (Assistente Popular)
            </h3>
            <div className="text-xs text-text-soft space-y-1 leading-relaxed">
              <p>A América Latina concentra os maiores depósitos de cobre e lítio do mundo.</p>
              <p>Megaminas andinas demandam imensos volumes de água em regiões desérticas vulneráveis.</p>
              <p>O Chile e o Peru respondem por quase 40% de todo o cobre global.</p>
              <p>O Triângulo do Lítio reúne Argentina, Bolívia e Chile com salares estratégicos.</p>
              <p>No Brasil, Carajás e o Quadrilátero Ferrífero lideram a produção de ferro.</p>
            </div>
            <div className="pt-2">
              {/* `/assistente?pergunta=` não aciona o assistente; o evento
                  global sim. Mantém a pergunta no idioma selecionado. */}
              <BotaoPerguntarNono
                pergunta={PERGUNTA_SEU_NONO[idioma]}
                rotulo="Perguntar ao Seu Nonô no Assistente Cívico"
                classeExtra="text-xs font-semibold"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS, BUSCA E EXPORTAÇÃO (SEIS QUALIDADES §2 E §6) */}
      <section
        aria-label="Filtros e exportação"
        className="rounded-xl border border-border/60 bg-surface p-4 sm:p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* CAMPO DE BUSCA TOLERANTE */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por mina, empresa, mineral, bacia ou país..."
              className="w-full rounded-lg border border-border/80 bg-surface-raised py-2 pl-9 pr-4 text-xs text-text placeholder:text-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* BOTÕES DE EXPORTAÇÃO E IMPRESSÃO */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text transition hover:bg-surface-hover hover:border-primary/50"
              title="Download em CSV com BOM UTF-8 compatível com Excel"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-text transition hover:bg-surface-hover"
              title="Imprimir relatório analítico"
            >
              <Printer className="h-3.5 w-3.5 text-text-soft" />
              <span>Imprimir</span>
            </button>

            {/* ALTERNADOR DE MODO CARDS / TABELA */}
            <div className="flex rounded-lg border border-border bg-surface-raised p-0.5">
              <button
                type="button"
                onClick={() => setModoExibicao("cards")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  modoExibicao === "cards"
                    ? "bg-primary text-primary-contrast"
                    : "text-text-soft hover:text-text"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setModoExibicao("tabela")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                  modoExibicao === "tabela"
                    ? "bg-primary text-primary-contrast"
                    : "text-text-soft hover:text-text"
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>

        {/* SELECTS DE FACETAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-border/40">
          <div>
            <label className="block text-[11px] font-medium text-text-soft mb-1">
              País
            </label>
            <select
              value={filtroPais}
              onChange={(e) => setFiltroPais(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="TODOS">Todos os países ({coberturaEstatica.totalPaises})</option>
              {coberturaEstatica.paises.map((p) => (
                <option key={p} value={p}>
                  {BANDEIRAS_PAISES[p] || "🌐"} {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-soft mb-1">
              Tipo de Instalação
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="TODOS">Todos os tipos</option>
              {Object.entries(ROTULOS_TIPO).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-soft mb-1">
              Mineral Principal
            </label>
            <select
              value={filtroMineral}
              onChange={(e) => setFiltroMineral(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value="TODOS">Todos os minerais</option>
              {mineraisDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-soft hover:text-text hover:bg-surface-hover transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-soft pt-1">
          <span>
            Mostrando <strong>{registrosFiltrados.length}</strong> de{" "}
            <strong>{coberturaEstatica.totalInstalacoes}</strong> instalações
          </span>
          {registrosFiltrados.length === 0 && (
            <span className="text-amber-500 font-medium">
              Nenhuma instalação encontrada com os filtros atuais.
            </span>
          )}
        </div>
      </section>

      {/* MODO CARDS */}
      {modoExibicao === "cards" && (
        <section
          aria-label="Grade de instalações"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {registrosFiltrados.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border/70 bg-surface p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised border border-border px-2.5 py-0.5 text-xs font-medium text-text">
                    <span>{BANDEIRAS_PAISES[item.pais] || "🌐"}</span>
                    <span>{item.pais}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-primary rounded bg-primary/10 px-2 py-0.5">
                    {ROTULOS_TIPO[item.tipo] || item.tipo}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-text leading-snug">
                    {item.nome}
                  </h3>
                  <p className="text-xs font-medium text-text-soft mt-0.5">
                    Operador: <strong className="text-text">{item.empresa}</strong>
                  </p>
                </div>

                <div className="rounded-lg bg-surface-raised/70 p-2.5 text-xs space-y-1.5 border border-border/40">
                  <div className="flex items-center justify-between text-text-soft">
                    <span>Substância:</span>
                    <span className="font-semibold text-text">
                      {item.mineralPrincipal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-soft">
                    <span>Status:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-soft">
                    <span>Bacia / Região:</span>
                    <span className="text-right text-[11px] text-text truncate max-w-[180px]">
                      {item.baciaOuRegiao}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-soft line-clamp-3 leading-relaxed">
                  {item.descricao}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInstalacaoSelecionada(item)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ficha completa</span>
                </button>

                <Link
                  href={`/terras/globo?camada=sedes-instalacoes-mineradoras-latam#area=sedes-instalacoes-mineradoras-latam:${item.id}`}
                  className="inline-flex items-center gap-1 rounded bg-surface-raised px-2.5 py-1 text-xs font-medium text-text border border-border hover:border-primary/50 transition"
                  title="Abrir diretamente no globo 3D"
                >
                  <Globe2 className="h-3 w-3 text-amber-500" />
                  <span>Ver no Globo 3D</span>
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* MODO TABELA (SEIS QUALIDADES §3) */}
      {modoExibicao === "tabela" && (
        <section
          aria-label="Tabela analítica"
          className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-text-soft font-semibold">
                <th
                  scope="col"
                  className="p-3 cursor-pointer hover:text-text"
                  onClick={() => alternarOrdenacao("pais")}
                >
                  <div className="flex items-center gap-1">
                    <span>País</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="p-3 cursor-pointer hover:text-text"
                  onClick={() => alternarOrdenacao("nome")}
                >
                  <div className="flex items-center gap-1">
                    <span>Instalação / Mina</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="p-3 cursor-pointer hover:text-text"
                  onClick={() => alternarOrdenacao("empresa")}
                >
                  <div className="flex items-center gap-1">
                    <span>Empresa</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="p-3 cursor-pointer hover:text-text"
                  onClick={() => alternarOrdenacao("tipo")}
                >
                  <div className="flex items-center gap-1">
                    <span>Tipo</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="p-3 cursor-pointer hover:text-text"
                  onClick={() => alternarOrdenacao("mineralPrincipal")}
                >
                  <div className="flex items-center gap-1">
                    <span>Mineral</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th scope="col" className="p-3">Bacia / Região</th>
                <th scope="col" className="p-3">Fonte Oficial</th>
                <th scope="col" className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {registrosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-hover/60 transition"
                >
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-medium flex items-center gap-1.5 text-text">
                      <span>{BANDEIRAS_PAISES[item.pais] || "🌐"}</span>
                      <span>{item.pais}</span>
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-text">
                    <button
                      type="button"
                      onClick={() => setInstalacaoSelecionada(item)}
                      className="hover:underline text-left"
                    >
                      {item.nome}
                    </button>
                  </td>
                  <td className="p-3 text-text-soft whitespace-nowrap">
                    {item.empresa}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="rounded bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-text border border-border">
                      {ROTULOS_TIPO[item.tipo] || item.tipo}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-text">
                    {item.mineralPrincipal}
                  </td>
                  <td className="p-3 text-text-soft max-w-[200px] truncate">
                    {item.baciaOuRegiao}
                  </td>
                  <td className="p-3 text-text-soft whitespace-nowrap text-[11px]">
                    {item.fonteOficial}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setInstalacaoSelecionada(item)}
                        className="rounded p-1 text-text-soft hover:text-text hover:bg-surface-raised"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/terras/globo?camada=sedes-instalacoes-mineradoras-latam#area=sedes-instalacoes-mineradoras-latam:${item.id}`}
                        className="rounded p-1 text-amber-500 hover:bg-amber-500/10"
                        title="Abrir no Globo 3D"
                      >
                        <Globe2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* MODAL DE DETALHES DA INSTALAÇÃO (FICHA COMPLETA) */}
      {instalacaoSelecionada && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setInstalacaoSelecionada(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">
                    {BANDEIRAS_PAISES[instalacaoSelecionada.pais] || "🌐"}
                  </span>
                  <span className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                    {instalacaoSelecionada.pais} ·{" "}
                    {ROTULOS_TIPO[instalacaoSelecionada.tipo] ||
                      instalacaoSelecionada.tipo}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text">
                  {instalacaoSelecionada.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInstalacaoSelecionada(null)}
                className="rounded-lg p-1.5 text-text-soft hover:bg-surface-raised hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Empresa / Consórcio:</span>
                <span className="font-bold text-text text-sm">
                  {instalacaoSelecionada.empresa}
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Substância Mineral:</span>
                <span className="font-bold text-text text-sm">
                  {instalacaoSelecionada.mineralPrincipal}
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Bacia / Região:</span>
                <span className="font-semibold text-text">
                  {instalacaoSelecionada.baciaOuRegiao}
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Status Operacional:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {instalacaoSelecionada.status}
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Coordenadas WGS84:</span>
                <span className="font-mono text-text">
                  {instalacaoSelecionada.latitude.toFixed(4)},{" "}
                  {instalacaoSelecionada.longitude.toFixed(4)}
                </span>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 border border-border/50">
                <span className="text-text-soft block mb-1">Fonte Oficial Auditada:</span>
                <span className="font-semibold text-text">
                  {instalacaoSelecionada.fonteOficial}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">
                Descrição Histórica e Territorial
              </h4>
              <p className="text-xs text-text-soft leading-relaxed bg-surface-raised/40 p-3 rounded-lg border border-border/40">
                {instalacaoSelecionada.descricao}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <span className="text-[11px] text-text-soft">
                ID no Contrato: <code className="font-mono">{instalacaoSelecionada.id}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInstalacaoSelecionada(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-raised"
                >
                  Fechar
                </button>
                <Link
                  href={`/terras/globo?camada=sedes-instalacoes-mineradoras-latam#area=sedes-instalacoes-mineradoras-latam:${instalacaoSelecionada.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-contrast shadow hover:opacity-90 transition"
                >
                  <Globe2 className="h-4 w-4" />
                  <span>Ver no Globo 3D</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
