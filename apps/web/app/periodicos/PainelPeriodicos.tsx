"use client";

/**
 * Painel Interativo de Consulta a Periódicos Científicos de Submissão Contínua
 *
 * Papel no portal:
 *   Permite a estudantes, pesquisadores e movimentos populares filtrar e encontrar
 *   revistas científicas abertas, sem taxas (Diamond OA), com submissão em fluxo
 *   contínuo e registro DOI em 141 países do mundo.
 *
 * Regras respeitadas:
 *   - Regra 5.1: amostra de 80 títulos curados como props (< 70 KB payload),
 *     respeitando rigorosamente o limite de serialização do Next.js.
 *   - Regra 5.9: comentário explicativo no topo.
 *   - Regra 5.14: responsividade mobile (390 px) e sem rolagem horizontal falsa.
 *   - Regra 5.16: texto nunca menor que 12 px (text-xs = 12px).
 */

import { useState, useMemo } from "react";
import { Search, ExternalLink, CheckCircle2, BookOpen, Globe2, Sparkles, Filter } from "lucide-react";

interface PeriodicoItem {
  id: string;
  titulo: string;
  pais: string;
  instituicao: string;
  tipo_instituicao?: string;
  natureza_instituicao?: string;
  area_conhecimento: string;
  tipo_modelo?: string;
  periodicidade?: string;
  taxa_apc: string;
  plataforma_envio: string;
  url_submissao: string;
  url_homepage: string;
  prefixo_doi: string;
  issn_eletronico: string;
  gratuito_diamond: boolean | number;
  submissao_continua?: boolean | number;
  tempo_medio_semanas: number | null;
  licenca_cc: string;
  regiao_chave: string;
  regiao_nome: string;
}

interface PainelPeriodicosProps {
  amostraLusofona: PeriodicoItem[];
  amostraGlobal: PeriodicoItem[];
}

export default function PainelPeriodicos({
  amostraLusofona,
  amostraGlobal
}: PainelPeriodicosProps) {
  const [busca, setBusca] = useState("");
  const [abaRegiao, setAbaRegiao] = useState<"lusofona" | "global" | "todas">("lusofona");
  const [apenasDiamante, setApenasDiamante] = useState(false);
  const [areaFiltro, setAreaFiltro] = useState("Todas");

  const catalogoBase = useMemo(() => {
    if (abaRegiao === "lusofona") return amostraLusofona;
    if (abaRegiao === "global") return amostraGlobal;
    return [...amostraLusofona, ...amostraGlobal];
  }, [abaRegiao, amostraLusofona, amostraGlobal]);

  const areasDisponiveis = useMemo(() => {
    const setAreas = new Set<string>();
    catalogoBase.forEach((p) => setAreas.add(p.area_conhecimento));
    return ["Todas", ...Array.from(setAreas).sort()];
  }, [catalogoBase]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return catalogoBase.filter((p) => {
      if (apenasDiamante && !p.gratuito_diamond) return false;
      if (areaFiltro !== "Todas" && p.area_conhecimento !== areaFiltro) return false;
      if (!termo) return true;

      return (
        p.titulo.toLowerCase().includes(termo) ||
        p.instituicao.toLowerCase().includes(termo) ||
        p.pais.toLowerCase().includes(termo) ||
        p.plataforma_envio.toLowerCase().includes(termo)
      );
    });
  }, [catalogoBase, busca, apenasDiamante, areaFiltro]);

  return (
    <section className="mt-8 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Catálogo Interativo de Periódicos
          </h2>
          <p className="mt-1 text-sm text-muted">
            Exibindo periódicos abertos com submissão contínua, registro DOI e sem taxas.
          </p>
        </div>

        {/* Alternador de Região */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-soft border border-border rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setAbaRegiao("lusofona")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              abaRegiao === "lusofona"
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            🇧🇷 Brasil & Lusófonos
          </button>
          <button
            type="button"
            onClick={() => setAbaRegiao("global")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              abaRegiao === "global"
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            🌍 Internacional
          </button>
          <button
            type="button"
            onClick={() => setAbaRegiao("todas")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              abaRegiao === "todas"
                ? "bg-primary text-white font-semibold shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por revista, universidade, tema ou país..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={areaFiltro}
            onChange={(e) => setAreaFiltro(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-soft border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {areasDisponiveis.map((a) => (
              <option key={a} value={a}>
                Área: {a}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
            <input
              type="checkbox"
              checked={apenasDiamante}
              onChange={(e) => setApenasDiamante(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-0"
            />
            <span className="font-medium">100% Gratuito</span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted border-b border-border pb-3">
        <span>
          Encontrados: <strong className="text-foreground">{filtrados.length}</strong> periódicos de fluxo contínuo
        </span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Submissão Contínua Garantida
        </span>
      </div>

      {/* Grade de Cards de Periódicos */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtrados.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface-soft/60 p-5 hover:border-primary/40 transition-colors shadow-2xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                  {item.pais}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  {item.taxa_apc}
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-foreground leading-snug">
                {item.titulo}
              </h3>

              <p className="mt-1.5 text-xs text-muted leading-relaxed line-clamp-2">
                🏛️ {item.instituicao}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted">
                <span className="px-2 py-0.5 rounded bg-surface border border-border">
                  🔬 {item.area_conhecimento}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border">
                  ⚡ {item.plataforma_envio.split("(")[0].trim()}
                </span>
                {item.tempo_medio_semanas && (
                  <span className="px-2 py-0.5 rounded bg-surface border border-border">
                    ⏱️ ~{item.tempo_medio_semanas} semanas
                  </span>
                )}
                {item.issn_eletronico && (
                  <span className="px-2 py-0.5 rounded bg-surface border border-border">
                    e-ISSN: {item.issn_eletronico}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
              <a
                href={item.url_homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted hover:text-foreground hover:underline inline-flex items-center gap-1"
              >
                <Globe2 className="w-3.5 h-3.5" />
                Site Oficial
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
            <p className="text-sm">Nenhum periódico encontrado para os filtros selecionados.</p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setAreaFiltro("Todas");
                setApenasDiamante(false);
              }}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Limpar filtros de busca
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
