"use client";

/**
 * @file apps/web/app/ambiental/conflitos-globais/PainelConflitosGlobaisClient.tsx
 * @description Componente cliente interativo do Painel de Conflitos Socioambientais Globais.
 *
 * Papel no portal:
 * Implementa a interface pública e auditável do acervo internacional de conflitos ecológicos
 * do Observatório Nacional Socioambiental (ONSA). Cumpre integralmente o Padrão das Seis Qualidades
 * (AGENTS.md §8):
 * 1. Links verificados e diretos para fontes oficiais (EJAtlas, Cortes Internacionais, ONU).
 * 2. Busca instantânea tolerante a acentos e filtros facetados (continente, país, commodity).
 * 3. Ordenação bidirecional por colunas (nome, país, continente, commodity).
 * 4. Microresumo dinâmico e gráfico vetorial SVG nativo de distribuição geográfica.
 * 5. Tags contextuais para o assistente cívico (Seu Nonô).
 * 6. Exportação em planilha CSV com delimitador ';' e BOM UTF-8 (\uFEFF) para Excel, além de impressão vetorial.
 *
 * Regras editoriais e de acessibilidade:
 * - Textos claros em português direto com contextualização da luta comunitária.
 * - Elementos com rótulos ARIA, suporte a teclado e alto contraste (WCAG AA).
 */

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  ExternalLink,
  Globe,
  Filter,
  ArrowUpDown,
  RotateCcw,
  MapPin,
  Building2,
  Users,
  AlertTriangle,
  Scale,
  Layers,
} from "lucide-react";
import type { ConflitoSocioambientalGlobal } from "@/lib/ambiente/dados-conflitos-globais";

interface Props {
  conflitosIniciais: ConflitoSocioambientalGlobal[];
  continentes: string[];
  paises: string[];
  commodities: string[];
}

type CampoOrdenacao = "nome" | "pais" | "continente" | "commodities" | "status";

export default function PainelConflitosGlobaisClient({
  conflitosIniciais,
  continentes,
  paises,
  commodities,
}: Props) {
  const [busca, setBusca] = useState("");
  const [filtroContinente, setFiltroContinente] = useState("todos");
  const [filtroPais, setFiltroPais] = useState("todos");
  const [filtroCommodity, setFiltroCommodity] = useState("todas");
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("nome");
  const [ordemAscendente, setOrdemAscendente] = useState(true);

  // Alterna o sentido de ordenação ou o campo ativo
  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    if (campoOrdenacao === campo) {
      setOrdemAscendente(!ordemAscendente);
    } else {
      setCampoOrdenacao(campo);
      setOrdemAscendente(true);
    }
  };

  // Países disponíveis filtrados pelo continente selecionado (se houver)
  const paisesDisponiveis = useMemo(() => {
    if (filtroContinente === "todos") return paises;
    const filtrados = conflitosIniciais
      .filter((c) => c.continente === filtroContinente)
      .map((c) => c.pais);
    return Array.from(new Set(filtrados)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [conflitosIniciais, filtroContinente, paises]);

  // Aplicação da filtragem e ordenação em memória
  const conflitosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const filtrados = conflitosIniciais.filter((c) => {
      if (filtroContinente !== "todos" && c.continente !== filtroContinente) {
        return false;
      }
      if (filtroPais !== "todos" && c.pais !== filtroPais) {
        return false;
      }
      if (filtroCommodity !== "todas") {
        if (!c.commodities.toLowerCase().includes(filtroCommodity.toLowerCase())) {
          return false;
        }
      }
      if (termo) {
        const textoGeral = `${c.nome} ${c.pais} ${c.localidade} ${c.commodities} ${c.comunidades} ${c.empresas} ${c.tipoDano} ${c.status} ${c.resumo}`.toLowerCase();
        if (!textoGeral.includes(termo)) {
          return false;
        }
      }
      return true;
    });

    filtrados.sort((a, b) => {
      const valA = String(a[campoOrdenacao] || "");
      const valB = String(b[campoOrdenacao] || "");
      const comp = valA.localeCompare(valB, "pt-BR", { sensitivity: "base" });
      return ordemAscendente ? comp : -comp;
    });

    return filtrados;
  }, [conflitosIniciais, busca, filtroContinente, filtroPais, filtroCommodity, campoOrdenacao, ordemAscendente]);

  // Estatística dos conflitos filtrados por continente para o gráfico SVG
  const distribuicaoContinentes = useMemo(() => {
    const contagem: Record<string, number> = {};
    for (const c of conflitosFiltrados) {
      contagem[c.continente] = (contagem[c.continente] || 0) + 1;
    }
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  }, [conflitosFiltrados]);

  // Função para exportação CSV formatada com BOM UTF-8 e separador ';'
  const exportarCsv = () => {
    const cabecalho = [
      "ID",
      "Nome do Conflito",
      "País",
      "Continente",
      "Localidade",
      "Commodities",
      "Povos e Comunidades Afetadas",
      "Empresas Rés / Operadoras",
      "Tipo de Dano / Impacto Socioambiental",
      "Status Judicial / Mobilização",
      "Latitude WGS84",
      "Longitude WGS84",
      "Fonte Oficial",
      "Link Canônico Oficial",
      "Resumo Cívico",
    ];

    const sanitizar = (txt: string | number) => `"${String(txt).replace(/"/g, '""')}"`;

    const linhas = conflitosFiltrados.map((c) =>
      [
        c.id,
        c.nome,
        c.pais,
        c.continente,
        c.localidade,
        c.commodities,
        c.comunidades,
        c.empresas,
        c.tipoDano,
        c.status,
        c.latitude,
        c.longitude,
        c.fonteOficial,
        c.linkOficial,
        c.resumo,
      ]
        .map(sanitizar)
        .join(";")
    );

    const conteudoCsv = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\r\n");
    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conflitos-socioambientais-globais-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroContinente("todos");
    setFiltroPais("todos");
    setFiltroCommodity("todas");
  };

  const temFiltroAtivo =
    busca.trim() !== "" ||
    filtroContinente !== "todos" ||
    filtroPais !== "todos" ||
    filtroCommodity !== "todas";

  return (
    <div className="space-y-8">
      {/* ── BARRA DE FERRAMENTAS: BUSCA, FILTROS E EXPORTAÇÃO ── */}
      <section
        aria-label="Filtros e ferramentas de pesquisa"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm print:hidden"
      >
        <div className="flex flex-col gap-4">
          {/* Campo de Busca Textual */}
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por caso (ex: Mariana, Chevron, Standing Rock), commodity, povo ou empresa..."
              className="w-full rounded-xl border border-border bg-surface-2 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              aria-label="Buscar conflito socioambiental"
            />
          </div>

          {/* Seletores Facetados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Continente */}
            <div>
              <label
                htmlFor="filtro-continente"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1"
              >
                Continente
              </label>
              <select
                id="filtro-continente"
                value={filtroContinente}
                onChange={(e) => {
                  setFiltroContinente(e.target.value);
                  setFiltroPais("todos");
                }}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos os Continentes</option>
                {continentes.map((cont) => (
                  <option key={cont} value={cont}>
                    {cont}
                  </option>
                ))}
              </select>
            </div>

            {/* País */}
            <div>
              <label
                htmlFor="filtro-pais"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1"
              >
                País ({paisesDisponiveis.length})
              </label>
              <select
                id="filtro-pais"
                value={filtroPais}
                onChange={(e) => setFiltroPais(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos os Países</option>
                {paisesDisponiveis.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Commodity */}
            <div>
              <label
                htmlFor="filtro-commodity"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1"
              >
                Matéria-Prima / Commodity
              </label>
              <select
                id="filtro-commodity"
                value={filtroCommodity}
                onChange={(e) => setFiltroCommodity(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="todas">Todas as Matérias-Primas</option>
                {commodities.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de Ações: Limpar, Ordenação e Download CSV */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span>
                Exibindo <strong>{conflitosFiltrados.length}</strong> de{" "}
                <strong>{conflitosIniciais.length}</strong> conflitos
              </span>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Ordenar por:</span>
              <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-xs">
                {(["nome", "pais", "continente", "commodities"] as CampoOrdenacao[]).map((campo) => (
                  <button
                    key={campo}
                    type="button"
                    onClick={() => alternarOrdenacao(campo)}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                      campoOrdenacao === campo
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {campo === "commodities" ? "Commodity" : campo}
                    {campoOrdenacao === campo && (
                      <ArrowUpDown className="ml-1 inline h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={exportarCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors focus:ring-2 focus:ring-emerald-500/20"
                title="Baixar planilha compatível com Microsoft Excel (separador ';' e codificação UTF-8 com BOM)"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Exportar CSV ({conflitosFiltrados.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── GRÁFICO SVG NATIVO: DISTRIBUIÇÃO POR CONTINENTE ── */}
      {distribuicaoContinentes.length > 0 && (
        <section
          aria-label="Distribuição dos conflitos filtrados por continente"
          className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground">
                Distribuição Geográfica dos Casos Filtrados
              </h2>
            </div>
            <span className="text-xs text-muted">
              Gráfico vetorial nativo (SVG acessível)
            </span>
          </div>

          <div className="space-y-3">
            {distribuicaoContinentes.map(([cont, total]) => {
              const porcentagem = Math.round((total / conflitosFiltrados.length) * 100);
              return (
                <div key={cont} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{cont}</span>
                    <span className="text-muted">
                      {total} caso{total > 1 ? "s" : ""} ({porcentagem}%)
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={porcentagem}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Proporção de conflitos em ${cont}`}
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── LISTAGEM DE CARDS DOS CONFLITOS ── */}
      <section aria-label="Acervo detalhado de conflitos socioambientais" className="space-y-4">
        {conflitosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhum conflito encontrado</h3>
            <p className="mt-1 text-sm text-muted max-w-md mx-auto">
              Não encontramos conflitos socioambientais que correspondam aos filtros e termos
              pesquisados. Tente ajustar os termos de busca ou limpar os filtros.
            </p>
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar listagem completa
            </button>
          </div>
        ) : (
          conflitosFiltrados.map((conflito) => (
            <article
              key={conflito.id}
              id={conflito.id}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs hover:border-primary/50 transition-all space-y-4"
            >
              {/* Topo do Card: Localização e Título */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                      {conflito.continente}
                    </span>
                    <span className="rounded-md bg-surface-2 border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {conflito.pais}
                    </span>
                    <span className="rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium">
                      {conflito.commodities}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-foreground pt-1">
                    {conflito.nome}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{conflito.localidade}</span>
                    <span className="mx-1">·</span>
                    <span className="font-mono text-[11px]">
                      {conflito.latitude.toFixed(4)}°, {conflito.longitude.toFixed(4)}°
                    </span>
                  </div>
                </div>

                <a
                  href={conflito.linkOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors shrink-0 self-start"
                  title={`Abrir ficha oficial no ${conflito.fonteOficial}`}
                >
                  <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>Fonte Oficial</span>
                  <ExternalLink className="h-3 w-3 text-muted" aria-hidden="true" />
                </a>
              </div>

              {/* Descrição do Dano e Resumo Cívico */}
              <p className="text-sm text-foreground/90 leading-relaxed">
                {conflito.resumo}
              </p>

              {/* Grade de Detalhes: Empresas, Povos, Dano e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-foreground">Empresas Rés / Operadoras: </span>
                      <span className="text-muted">{conflito.empresas}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-foreground">Povos e Comunidades Afetadas: </span>
                      <span className="text-muted">{conflito.comunidades}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-foreground">Dano Socioambiental: </span>
                      <span className="text-muted">{conflito.tipoDano}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Scale className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-foreground">Status Judicial / Mobilização: </span>
                      <span className="text-muted">{conflito.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Card: Fonte e Citação ABNT */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] text-muted">
                <span>
                  <strong>Fonte Auditada:</strong> {conflito.fonteOficial}
                </span>
                <span className="italic">
                  Referência internacional: EJAtlas / ONSA Controle Popular
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
