"use client";

import React, { useState, useMemo, useId } from "react";
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Building2,
  ExternalLink,
  Shield,
  Zap,
  Droplets,
  Globe,
  FileSpreadsheet,
  Layers,
  Landmark,
  Mail,
  Phone,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import {
  CategoriaInstituicao,
  EsferaInstituicao,
  InstituicaoEcossistema,
  LISTA_CATEGORIAS,
  LISTA_ESFERAS,
  LISTA_REGIOES,
  RegiaoBrasil,
  exportarEcossistemaParaCsv,
} from "@/lib/ambiental/ecossistema-nacional";

interface PainelEcossistemaProps {
  instituicoesIniciais: InstituicaoEcossistema[];
}

type ColunaOrdenacao = "sigla" | "nomeCompleto" | "categoria" | "esfera" | "uf";
type DirecaoOrdenacao = "asc" | "desc";

export default function PainelEcossistema({
  instituicoesIniciais,
}: PainelEcossistemaProps) {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>("Todas");
  const [esferaFiltro, setEsferaFiltro] = useState<string>("Todas");
  const [colunaOrdem, setColunaOrdem] = useState<ColunaOrdenacao>("sigla");
  const [direcaoOrdem, setDirecaoOrdem] = useState<DirecaoOrdenacao>("asc");
  const [abaGrafico, setAbaGrafico] = useState<"categoria" | "regiao">("categoria");
  const idBusca = useId();

  // Filtragem dos registros
  const instituicoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return instituicoesIniciais.filter((inst) => {
      if (categoriaFiltro !== "Todas" && inst.categoria !== categoriaFiltro) {
        return false;
      }
      if (regiaoFiltro !== "Todas" && inst.regiao !== regiaoFiltro) {
        return false;
      }
      if (esferaFiltro !== "Todas" && inst.esfera !== esferaFiltro) {
        return false;
      }

      if (termo) {
        const emSigla = inst.sigla.toLowerCase().includes(termo);
        const emNome = inst.nomeCompleto.toLowerCase().includes(termo);
        const emPapel = inst.papelPrincipal.toLowerCase().includes(termo);
        const emUf = inst.uf.toLowerCase().includes(termo);
        const emSistemas = inst.sistemasInformatizados.some((s) =>
          s.toLowerCase().includes(termo)
        );

        if (!emSigla && !emNome && !emPapel && !emUf && !emSistemas) {
          return false;
        }
      }

      return true;
    });
  }, [instituicoesIniciais, busca, categoriaFiltro, regiaoFiltro, esferaFiltro]);

  // Ordenação dos registros filtrados
  const instituicoesOrdenadas = useMemo(() => {
    return [...instituicoesFiltradas].sort((a, b) => {
      let valA = a[colunaOrdem] || "";
      let valB = b[colunaOrdem] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return direcaoOrdem === "asc" ? -1 : 1;
      if (valA > valB) return direcaoOrdem === "asc" ? 1 : -1;
      return 0;
    });
  }, [instituicoesFiltradas, colunaOrdem, direcaoOrdem]);

  // Agregações dinâmicas para o Gráfico (Regra das 5 coisas - Item 1)
  const statsGrafico = useMemo(() => {
    const contagemCategoria: Record<string, number> = {};
    const contagemRegiao: Record<string, number> = {};

    for (const inst of instituicoesFiltradas) {
      contagemCategoria[inst.categoria] =
        (contagemCategoria[inst.categoria] || 0) + 1;
      contagemRegiao[inst.regiao] = (contagemRegiao[inst.regiao] || 0) + 1;
    }

    const categoriasArray = LISTA_CATEGORIAS.map((cat) => ({
      label: cat,
      total: contagemCategoria[cat] || 0,
      porcentagem:
        instituicoesFiltradas.length > 0
          ? ((contagemCategoria[cat] || 0) / instituicoesFiltradas.length) * 100
          : 0,
    }));

    const regioesArray = LISTA_REGIOES.map((reg) => ({
      label: reg,
      total: contagemRegiao[reg] || 0,
      porcentagem:
        instituicoesFiltradas.length > 0
          ? ((contagemRegiao[reg] || 0) / instituicoesFiltradas.length) * 100
          : 0,
    }));

    return { categoriasArray, regioesArray };
  }, [instituicoesFiltradas]);

  // Handler para download de CSV filtrado (Regra das 5 coisas - Item 3)
  const handleBaixarCsv = () => {
    const csvContent = exportarEcossistemaParaCsv(instituicoesOrdenadas);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dataIso = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute(
      "download",
      `ecossistema-ambiental-concessionarias-brasil-${dataIso}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const alternarOrdem = (coluna: ColunaOrdenacao) => {
    if (colunaOrdem === coluna) {
      setDirecaoOrdem(direcaoOrdem === "asc" ? "desc" : "asc");
    } else {
      setColunaOrdem(coluna);
      setDirecaoOrdem("asc");
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setCategoriaFiltro("Todas");
    setRegiaoFiltro("Todas");
    setEsferaFiltro("Todas");
    setColunaOrdem("sigla");
    setDirecaoOrdem("asc");
  };

  const obterIconeCategoria = (categoria: CategoriaInstituicao) => {
    switch (categoria) {
      case "Órgão Ambiental Estadual":
        return <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "Ministério Federal":
        return <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "Autarquia Federal":
        return <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case "Empresa Pública":
        return <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "Concessionária de Água e Saneamento":
        return <Droplets className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case "Concessionária de Luz e Energia":
        return <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Layers className="h-4 w-4 text-muted" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* ═══ 1. PAINEL DE CONTROLE: FILTROS + CSV (REGRA DAS 5 COISAS - ITENS 3 E 4) ═══ */}
      <div className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <label htmlFor={idBusca} className="sr-only">
              Buscar instituição por sigla, nome, sistema ou estado
            </label>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id={idBusca}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por sigla, nome, órgão, sistema (ex: SEIA, SINFAT, CAR) ou UF..."
              className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBaixarCsv}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
              title="Baixar planilha CSV com os dados filtrados na tela"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Baixar Planilha CSV ({instituicoesFiltradas.length})</span>
            </button>

            {(busca ||
              categoriaFiltro !== "Todas" ||
              regiaoFiltro !== "Todas" ||
              esferaFiltro !== "Todas") && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs font-medium text-muted hover:text-foreground transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha secundária de seletores de filtro */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Categoria Institucional
            </label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Todas">Todas as Categorias</option>
              {LISTA_CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Macrorregião / Abrangência
            </label>
            <select
              value={regiaoFiltro}
              onChange={(e) => setRegiaoFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Todas">Todas as Regiões</option>
              {LISTA_REGIOES.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Esfera de Atuação
            </label>
            <select
              value={esferaFiltro}
              onChange={(e) => setEsferaFiltro(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Todas">Todas as Esferas</option>
              {LISTA_ESFERAS.map((esf) => (
                <option key={esf} value={esf}>
                  {esf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ 2. GRÁFICO DINÂMICO INLINE (REGRA DAS 5 COISAS - ITEM 1) ═══ */}
      <section
        aria-label="Gráfico de distribuição das instituições"
        className="rounded-2xl border border-border bg-surface-1 p-5 shadow-sm"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Distribuição da Amostra Filtrada ({instituicoesFiltradas.length} instituições)
            </h2>
            <p className="text-xs text-muted">
              Visualização gráfica proporcional gerada dinamicamente via SVG/CSS inline sem bibliotecas externas
            </p>
          </div>

          <div className="flex gap-1.5 rounded-lg border border-border bg-surface-2 p-1 text-xs">
            <button
              onClick={() => setAbaGrafico("categoria")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                abaGrafico === "categoria"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Por Categoria
            </button>
            <button
              onClick={() => setAbaGrafico("regiao")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                abaGrafico === "regiao"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Por Região
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {abaGrafico === "categoria" ? (
            statsGrafico.categoriasArray.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted">
                    {item.total} instituição(ões) ({item.porcentagem.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(item.porcentagem, item.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            statsGrafico.regioesArray.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted">
                    {item.total} instituição(ões) ({item.porcentagem.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.max(item.porcentagem, item.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ═══ 3. CABEÇALHO DE RESULTADOS E ORDENAÇÃO (REGRA DAS 5 COISAS - ITEM 5) ═══ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Exibindo{" "}
          <strong className="text-foreground">{instituicoesOrdenadas.length}</strong>{" "}
          de <strong>{instituicoesIniciais.length}</strong> instituições mapeadas
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>Ordenar por:</span>
          <button
            onClick={() => alternarOrdem("sigla")}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              colunaOrdem === "sigla"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-1 text-muted hover:text-foreground"
            }`}
          >
            Sigla {colunaOrdem === "sigla" && (direcaoOrdem === "asc" ? "▲" : "▼")}
          </button>
          <button
            onClick={() => alternarOrdem("categoria")}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              colunaOrdem === "categoria"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-1 text-muted hover:text-foreground"
            }`}
          >
            Categoria {colunaOrdem === "categoria" && (direcaoOrdem === "asc" ? "▲" : "▼")}
          </button>
          <button
            onClick={() => alternarOrdem("uf")}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              colunaOrdem === "uf"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-1 text-muted hover:text-foreground"
            }`}
          >
            UF {colunaOrdem === "uf" && (direcaoOrdem === "asc" ? "▲" : "▼")}
          </button>
        </div>
      </div>

      {/* ═══ 4. LISTA DAS INSTITUIÇÕES (CARTÕES DETALHADOS COM LINKS VERIFICADOS) ═══ */}
      {instituicoesOrdenadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-1 p-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Nenhuma instituição encontrada para os filtros atuais.
          </p>
          <p className="mt-1 text-xs text-muted">
            Tente buscar com outro termo ou limpe os filtros de categoria e região.
          </p>
          <button
            onClick={limparFiltros}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar todos os registros</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {instituicoesOrdenadas.map((inst) => (
            <article
              key={inst.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-1 p-5 shadow-sm transition hover:border-primary/50"
            >
              <div>
                {/* Linha superior: Sigla, Categoria, UF e Esfera */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-border font-mono text-sm font-bold text-foreground">
                      {inst.sigla.slice(0, 4)}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">
                        {inst.sigla}
                      </h3>
                      <p className="text-xs text-muted">{inst.nomeCompleto}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {inst.uf} • {inst.regiao}
                  </span>
                </div>

                {/* Badges de Categoria e Esfera */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                    {obterIconeCategoria(inst.categoria)}
                    <span>{inst.categoria}</span>
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border/80 px-2 py-0.5 text-xs text-muted">
                    {inst.esfera}
                  </span>
                </div>

                {/* Papel Principal */}
                <p className="mt-3 text-xs leading-relaxed text-foreground/90">
                  {inst.papelPrincipal}
                </p>

                {/* Sistemas Informatizados */}
                <div className="mt-3">
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <Cpu className="h-3 w-3" />
                    <span>Sistemas e Plataformas:</span>
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {inst.sistemasInformatizados.map((sis) => (
                      <span
                        key={sis}
                        className="rounded-md border border-border bg-surface-2/70 px-2 py-0.5 font-mono text-[11px] text-foreground"
                      >
                        {sis}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contatos Oficiais */}
                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <a
                      href={`mailto:${inst.contatos.email}`}
                      className="hover:underline text-foreground truncate"
                    >
                      {inst.contatos.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <a
                      href={`tel:${inst.contatos.telefone.replace(/\D/g, "")}`}
                      className="hover:underline text-foreground"
                    >
                      {inst.contatos.telefone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted mt-0.5" />
                    <span className="text-[11px] leading-tight text-muted">
                      {inst.contatos.endereco}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de links oficiais verificados */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <a
                  href={inst.contatos.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-3 transition"
                >
                  <span>Portal Oficial</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <a
                  href={inst.contatos.ouvidoriaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ouvidoria / Transparência</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
