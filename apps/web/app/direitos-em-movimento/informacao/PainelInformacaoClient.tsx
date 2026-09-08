"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Landmark,
  Shield,
  Droplets,
  Zap,
  Radio,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type {
  CanalInformacao,
  ResumoEstatisticasInformacao,
  CategoriaCanal,
} from "@/lib/direitos/informacao-tipos";

interface Props {
  canaisIniciais: CanalInformacao[];
  estatisticas: ResumoEstatisticasInformacao;
}

export default function PainelInformacaoClient({
  canaisIniciais,
  estatisticas,
}: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [ufFiltro, setUfFiltro] = useState<string>("todos");
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "tabela">("cards");
  const [ordenarPor, setOrdenarPor] = useState<"cidade" | "nome" | "categoria">("cidade");
  const [ordemDirecao, setOrdemDirecao] = useState<"asc" | "desc">("asc");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 24;

  // Lista de UFs disponíveis
  const listaUfs = useMemo(() => {
    const ufs = new Set<string>();
    for (const c of canaisIniciais) {
      if (c.uf) ufs.add(c.uf);
    }
    return Array.from(ufs).sort((a, b) => (a === "MG" ? -1 : b === "MG" ? 1 : a.localeCompare(b)));
  }, [canaisIniciais]);

  // Filtragem e Busca
  const canaisFiltrados = useMemo(() => {
    const t = busca.toLowerCase().trim();

    return canaisIniciais.filter((c) => {
      // Filtro de UF
      if (ufFiltro !== "todos" && c.uf !== ufFiltro) return false;

      // Filtro de Categoria / Setor
      if (categoriaFiltro !== "todos") {
        if (categoriaFiltro === "essenciais") {
          if (!c.servicoEssencial) return false;
        } else if (c.categoria !== categoriaFiltro) {
          return false;
        }
      }

      // Busca Textual
      if (t) {
        const matchNome = c.nome.toLowerCase().includes(t);
        const matchCidade = c.cidade.toLowerCase().includes(t);
        const matchSigla = c.sigla.toLowerCase().includes(t);
        const matchResp = c.responsavel.nome.toLowerCase().includes(t);
        const matchCargo = c.responsavel.cargo.toLowerCase().includes(t);
        const matchEmail = c.email.toLowerCase().includes(t);
        const matchTel = c.telefone.includes(t);
        const matchEnd = c.endereco.toLowerCase().includes(t);

        if (!matchNome && !matchCidade && !matchSigla && !matchResp && !matchCargo && !matchEmail && !matchTel && !matchEnd) {
          return false;
        }
      }

      return true;
    });
  }, [canaisIniciais, busca, categoriaFiltro, ufFiltro]);

  // Ordenação
  const canaisOrdenados = useMemo(() => {
    const ordenados = [...canaisFiltrados];
    ordenados.sort((a, b) => {
      let comp = 0;
      if (ordenarPor === "cidade") {
        comp = a.cidade.localeCompare(b.cidade) || a.nome.localeCompare(b.nome);
      } else if (ordenarPor === "nome") {
        comp = a.nome.localeCompare(b.nome);
      } else if (ordenarPor === "categoria") {
        comp = a.categoria.localeCompare(b.categoria) || a.cidade.localeCompare(b.cidade);
      }
      return ordemDirecao === "asc" ? comp : -comp;
    });
    return ordenados;
  }, [canaisFiltrados, ordenarPor, ordemDirecao]);

  // Paginação
  const totalPaginas = Math.ceil(canaisOrdenados.length / ITENS_POR_PAGINA) || 1;
  const canaisPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return canaisOrdenados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [canaisOrdenados, paginaAtual]);

  // Exportação CSV (Regra AGENTS.md: separador ';' e UTF-8 BOM '\uFEFF')
  const exportarCsv = () => {
    const cabecalho = [
      "ID",
      "Nome do Canal",
      "Sigla",
      "Esfera",
      "Categoria",
      "Servico Essencial",
      "Cidade",
      "UF",
      "Regiao",
      "Telefone",
      "E-mail",
      "Responsavel (Cargo)",
      "Responsavel (Nome)",
      "Endereco Completo",
      "Link do Portal (e-SIC/Ouvidoria)",
      "Tipo de Atendimento",
    ];

    const linhas = canaisFiltrados.map((c) => [
      `"${c.id}"`,
      `"${c.nome.replace(/"/g, '""')}"`,
      `"${c.sigla.replace(/"/g, '""')}"`,
      `"${c.esfera}"`,
      `"${c.categoria}"`,
      `"${c.servicoEssencial || "Geral"}"`,
      `"${c.cidade}"`,
      `"${c.uf}"`,
      `"${c.regiao}"`,
      `"${c.telefone}"`,
      `"${c.email}"`,
      `"${c.responsavel.cargo.replace(/"/g, '""')}"`,
      `"${c.responsavel.nome.replace(/"/g, '""')}"`,
      `"${c.endereco.replace(/"/g, '""')}"`,
      `"${c.linkPortal}"`,
      `"${c.tipoAtendimento.replace(/"/g, '""')}"`,
    ]);

    const csvConteudo = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `canais-acesso-informacao-controle-popular-${ufFiltro.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cores e Ícones por Categoria
  const obterBadgeCategoria = (categoria: CategoriaCanal, servico: string | null) => {
    if (categoria === "Prefeitura") {
      return {
        bg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        icone: <Landmark className="h-3.5 w-3.5" />,
      };
    }
    if (categoria === "Câmara Municipal") {
      return {
        bg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        icone: <Building2 className="h-3.5 w-3.5" />,
      };
    }
    if (categoria === "Órgão Federal" || categoria === "Órgão Estadual" || categoria === "Agência Reguladora") {
      return {
        bg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        icone: <Shield className="h-3.5 w-3.5" />,
      };
    }
    if (servico === "agua" || categoria === "Água e Saneamento") {
      return {
        bg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        icone: <Droplets className="h-3.5 w-3.5" />,
      };
    }
    if (servico === "luz" || categoria === "Luz e Energia") {
      return {
        bg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        icone: <Zap className="h-3.5 w-3.5" />,
      };
    }
    return {
      bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      icone: <Radio className="h-3.5 w-3.5" />,
    };
  };

  return (
    <div className="space-y-10">
      {/* 1. STATUS / CARTÕES DE TOPO (Regra dos 5 itens) */}
      <section id="resumo-geral" aria-labelledby="titulo-resumo" className="scroll-mt-20">
        <h2 id="titulo-resumo" className="sr-only">
          Indicadores Gerais de Canais de Informação
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {/* Card 1: Prefeituras & Câmaras */}
          <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm transition-all hover:border-primary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-soft">
              <Landmark className="h-4 w-4 text-blue-500" />
              <span>Esfera Municipal</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text sm:text-3xl">
                {estatisticas.porEsfera["Municipal"] || 398}
              </span>
              <span className="text-xs text-text-soft">canais</span>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              199 Prefeituras e 199 Câmaras Legislativas municipais
            </p>
          </div>

          {/* Card 2: Órgãos Federais & Estaduais */}
          <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm transition-all hover:border-primary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-soft">
              <Shield className="h-4 w-4 text-purple-500" />
              <span>Federais & Estaduais</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text sm:text-3xl">
                {(estatisticas.porEsfera["Federal"] || 0) + (estatisticas.porEsfera["Estadual"] || 0)}
              </span>
              <span className="text-xs text-text-soft">órgãos</span>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Fala.BR, IBAMA, INCRA, INSS, RFB, Ministérios e Ouvidorias
            </p>
          </div>

          {/* Card 3: Água e Saneamento */}
          <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm transition-all hover:border-primary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-soft">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span>Água & Saneamento</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text sm:text-3xl">
                {estatisticas.porServicoEssencial["agua"] || 13}
              </span>
              <span className="text-xs text-text-soft">concessionárias</span>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Copasa, Sabesp, Cedae, Sanepar, Embasa e Agência ANA
            </p>
          </div>

          {/* Card 4: Luz & Conectividade */}
          <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm transition-all hover:border-primary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-soft">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Energia & Telecom</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-text sm:text-3xl">
                {(estatisticas.porServicoEssencial["luz"] || 0) + (estatisticas.porServicoEssencial["telecom"] || 0)}
              </span>
              <span className="text-xs text-text-soft">operadoras</span>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Cemig, Enel, CPFL, Light, Anatel, Vivo, Claro, TIM e Oi
            </p>
          </div>
        </div>
      </section>

      {/* 2. GRÁFICO INLINE (Regra dos 5 itens: SVG/CSS inline sem dependências) */}
      <section id="grafico-distribuicao" aria-labelledby="titulo-grafico" className="scroll-mt-20">
        <div className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 id="titulo-grafico" className="font-display text-base font-bold text-text">
                Distribuição dos Canais por Setor de Atendimento
              </h3>
              <p className="text-xs text-text-soft">
                Proporção das 445 entidades públicas e concessionárias essenciais catalogadas
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs text-text-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>100% canais oficiais verificados</span>
            </div>
          </div>

          {/* Gráfico em barras SVG / CSS */}
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-blue-500" /> Prefeituras Municipais (Executivo)
                </span>
                <span className="font-mono text-text-soft">199 canais (44,7%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: "44.7%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-500" /> Câmaras Legislativas Municipais
                </span>
                <span className="font-mono text-text-soft">199 canais (44,7%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: "44.7%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-purple-500" /> Autarquias, Ministérios e Órgãos de Fiscalização
                </span>
                <span className="font-mono text-text-soft">21 órgãos (4,7%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: "4.7%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-500" /> Concessionárias de Água e Saneamento
                </span>
                <span className="font-mono text-text-soft">13 concessionárias (2,9%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: "2.9%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" /> Concessionárias de Luz e Energia Elétrica
                </span>
                <span className="font-mono text-text-soft">9 distribuidores (2,0%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: "2.0%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-500" /> Telecomunicações, Celular e Internet Fibra
                </span>
                <span className="font-mono text-text-soft">7 provedores (1,6%)</span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: "1.6%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FILTROS E BUSCA (Regra dos 5 itens) */}
      <section id="filtros-busca" aria-labelledby="titulo-filtros" className="scroll-mt-20">
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por cidade, órgão, concessionária, responsável ou e-mail..."
                className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-4 text-xs text-text placeholder:text-text-soft/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setPaginaAtual(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-soft hover:text-text"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Ações: Alternar Visualização e Download CSV */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("cards")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    modoVisualizacao === "cards"
                      ? "bg-surface-1 text-primary shadow-xs"
                      : "text-text-soft hover:text-text"
                  }`}
                  title="Modo Cartões"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cartões</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("tabela")}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    modoVisualizacao === "tabela"
                      ? "bg-surface-1 text-primary shadow-xs"
                      : "text-text-soft hover:text-text"
                  }`}
                  title="Modo Tabela"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tabela</span>
                </button>
              </div>

              {/* Botão de Download CSV */}
              <button
                type="button"
                onClick={exportarCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary/50 hover:bg-surface-3"
                title="Baixar planilha CSV com os dados filtrados"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Filtros por Categoria e UF */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs">
            <span className="font-semibold text-text-soft flex items-center gap-1">
              <Filter className="h-3 w-3" /> Categoria:
            </span>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("todos");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "todos"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              Todos ({canaisIniciais.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Prefeitura");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Prefeitura"
                  ? "bg-blue-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              🏛️ Prefeituras (199)
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Câmara Municipal");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Câmara Municipal"
                  ? "bg-amber-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              ⚖️ Câmaras (199)
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Órgão Federal");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Órgão Federal"
                  ? "bg-purple-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              🏢 Federais & Fala.BR
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Água e Saneamento");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Água e Saneamento"
                  ? "bg-cyan-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              💧 Água (Copasa, Sabesp...)
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Luz e Energia");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Luz e Energia"
                  ? "bg-yellow-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              ⚡ Luz (Cemig, Enel...)
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaFiltro("Telecomunicações e Internet");
                setPaginaAtual(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === "Telecomunicações e Internet"
                  ? "bg-emerald-600 text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
              }`}
            >
              📡 Telecom & Internet
            </button>
          </div>

          {/* Filtro por UF e Ordenação */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-text-soft">Estado / UF:</span>
              <button
                type="button"
                onClick={() => {
                  setUfFiltro("todos");
                  setPaginaAtual(1);
                }}
                className={`rounded px-2 py-0.5 font-medium ${
                  ufFiltro === "todos"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-text-soft hover:text-text"
                }`}
              >
                Todas UFs
              </button>

              <button
                type="button"
                onClick={() => {
                  setUfFiltro("MG");
                  setPaginaAtual(1);
                }}
                className={`rounded px-2 py-0.5 font-medium ${
                  ufFiltro === "MG"
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary font-bold hover:bg-primary/20"
                }`}
              >
                🔺 Minas Gerais
              </button>

              {/* Seletor dropdown para as outras UFs */}
              <select
                value={ufFiltro}
                onChange={(e) => {
                  setUfFiltro(e.target.value);
                  setPaginaAtual(1);
                }}
                className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-text focus:border-primary focus:outline-none"
              >
                <option value="todos">Outras UFs...</option>
                {listaUfs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenação por Coluna (Regra dos 5 itens) */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-soft flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Ordenar por:
              </span>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value as "cidade" | "nome" | "categoria")}
                className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-text focus:border-primary focus:outline-none"
              >
                <option value="cidade">Cidade / Sede</option>
                <option value="nome">Nome do Ente / Órgão</option>
                <option value="categoria">Categoria / Esfera</option>
              </select>

              <button
                type="button"
                onClick={() => setOrdemDirecao((d) => (d === "asc" ? "desc" : "asc"))}
                className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text hover:bg-surface-3"
                title={`Ordem ${ordemDirecao === "asc" ? "crescente" : "decrescente"}`}
              >
                {ordemDirecao === "asc" ? "A → Z" : "Z → A"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATÁLOGO DE CANAIS (Regra dos 5 itens) */}
      <section id="catalogo-canais" aria-labelledby="titulo-catalogo" className="scroll-mt-20">
        <div className="mb-4 flex items-center justify-between">
          <h3 id="titulo-catalogo" className="font-display text-base font-bold text-text">
            Canais Oficiais Encontrados ({canaisFiltrados.length})
          </h3>
          <span className="text-xs text-text-soft">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>

        {canaisFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Info className="mx-auto h-8 w-8 text-text-soft" />
            <h4 className="mt-2 font-display text-sm font-bold text-text">Nenhum canal encontrado</h4>
            <p className="mt-1 text-xs text-text-soft">
              Nenhum órgão ou concessionária correspondeu aos filtros selecionados. Tente limpar a busca ou mudar o estado.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoriaFiltro("todos");
                setUfFiltro("todos");
                setPaginaAtual(1);
              }}
              className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Resetar Filtros
            </button>
          </div>
        ) : modoVisualizacao === "cards" ? (
          /* MODO CARDS */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {canaisPaginados.map((c) => {
              const badge = obterBadgeCategoria(c.categoria, c.servicoEssencial);

              return (
                <article
                  key={c.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    {/* Header do Card: Badges e Cidade */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg}`}
                      >
                        {badge.icone}
                        <span>{c.categoria}</span>
                      </span>

                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-text-soft">
                        {c.uf}
                      </span>
                    </div>

                    {/* Nome do Ente / Órgão */}
                    <h4 className="mt-2.5 font-display text-sm font-bold leading-snug text-text">
                      {c.nome}
                    </h4>
                    <p className="text-[11px] font-medium text-text-soft">
                      {c.cidade} · {c.regiao}
                    </p>

                    {/* Responsável / Autoridade */}
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-2 p-2 text-xs">
                      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-soft" />
                      <div>
                        <span className="block text-[10px] font-medium text-text-soft">
                          {c.responsavel.cargo}
                        </span>
                        <span className="font-semibold text-text text-[11px]">
                          {c.responsavel.nome}
                        </span>
                      </div>
                    </div>

                    {/* Dados de Contato: Telefone, E-mail e Endereço */}
                    <div className="mt-3 space-y-1.5 text-xs text-text-soft">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <a
                          href={`tel:${c.telefone.replace(/[^\d]/g, "")}`}
                          className="font-mono text-[11px] text-text hover:underline"
                          title="Ligar para o canal"
                        >
                          {c.telefone}
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <a
                          href={`mailto:${c.email}`}
                          className="truncate text-[11px] text-text hover:underline"
                          title="Enviar e-mail para a ouvidoria"
                        >
                          {c.email}
                        </a>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-soft" />
                        <span className="text-[11px] leading-tight text-text-soft">
                          {c.endereco}
                        </span>
                      </div>
                    </div>

                    {/* Descrição resumida */}
                    <p className="mt-3 text-[11px] leading-relaxed text-text-soft border-t border-border/50 pt-2 line-clamp-3">
                      {c.descricao}
                    </p>
                  </div>

                  {/* Rodapé do Card: Acesso Direto ao Portal / e-SIC */}
                  <div className="mt-4 border-t border-border pt-3">
                    <a
                      href={c.linkPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <span>Acessar Portal / e-SIC</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* MODO TABELA */
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2 text-text-soft">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Ente / Cidade</th>
                  <th className="py-2.5 px-3 font-semibold">Categoria / UF</th>
                  <th className="py-2.5 px-3 font-semibold">Telefone</th>
                  <th className="py-2.5 px-3 font-semibold">E-mail Institucional</th>
                  <th className="py-2.5 px-3 font-semibold">Responsável / Autoridade</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Portal e-SIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {canaisPaginados.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-text">{c.nome}</div>
                      <div className="text-[10px] text-text-soft">{c.cidade} - {c.uf}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-text">
                      <a href={`tel:${c.telefone.replace(/[^\d]/g, "")}`} className="hover:underline">
                        {c.telefone}
                      </a>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-text">
                      <a href={`mailto:${c.email}`} className="hover:underline">
                        {c.email}
                      </a>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-text">
                      <div className="font-medium text-text">{c.responsavel.nome}</div>
                      <div className="text-[10px] text-text-soft">{c.responsavel.cargo}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={c.linkPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-[11px]"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <span className="text-xs text-text-soft">
              Página <strong className="text-text">{paginaAtual}</strong> de{" "}
              <strong className="text-text">{totalPaginas}</strong>
            </span>

            <button
              type="button"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* 5. GUIA PRÁTICO DA LEI DE ACESSO À INFORMAÇÃO (Padrão Wiki) */}
      <section id="guia-pratico-lai" aria-labelledby="titulo-guia" className="scroll-mt-20">
        <div className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 id="titulo-guia" className="font-display text-base font-bold text-text">
              Guia Rápido da Lei de Acesso à Informação (Lei nº 12.527/2011)
            </h3>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-text-soft">
            Todo cidadão tem o direito constitucional de solicitar dados públicos a qualquer órgão dos poderes
            Executivo, Legislativo e Judiciário, bem como a concessionárias de serviços públicos delegados.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Clock className="h-3.5 w-3.5" />
                <span>Prazos Oficiais</span>
              </div>
              <p className="mt-1 text-xs text-text-soft">
                O órgão deve responder de imediato se a informação estiver disponível. Se não estiver, tem até{" "}
                <strong className="text-text">20 dias</strong>, prorrogáveis por mais 10 mediante justificativa.
              </p>
            </div>

            <div className="rounded-lg bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Gratuidade e Motivação</span>
              </div>
              <p className="mt-1 text-xs text-text-soft">
                O pedido é <strong className="text-text">100% gratuito</strong>. É proibido exigir os motivos da
                solicitação de interesse público.
              </p>
            </div>

            <div className="rounded-lg bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Recursos por Negativa</span>
              </div>
              <p className="mt-1 text-xs text-text-soft">
                Se a informação for negada ou o órgão não responder no prazo, cabe recurso em{" "}
                <strong className="text-text">10 dias</strong> à autoridade superior e, em seguida, à Ouvidoria/CGU.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
