"use client";

/**
 * @file LabSeuNono.tsx
 * @description Painel lateral do Seu Nonô e integrador do Laboratório de Dados com o motor aberto tipo NotebookLM.
 *
 * Papel no portal:
 * 1. Controla visualização de gráficos e catálogo de camadas temáticas do Laboratório.
 * 2. Conecta o acervo ativo ao assistente Seu Nonô em arquitetura aberta tipo NotebookLM com citações [n].
 * 3. Incorpora widgets de Generative UI: Onboarding Cívico, Rastreabilidade Transnacional e Depuração RAG.
 * 4. Permite exportar o Dossiê Cívico em Markdown aberto para estudo offline e LLMs locais.
 *
 * Regras e decisões:
 * - 100% aberto e auditável: padrão de citação auditável com links para fontes primárias.
 * - Frases de até 13 palavras nos textos de interface (AGENTS.md §12).
 * - Acessibilidade: atalhos de alto contraste, escala de fonte e foco por teclado.
 */

import { useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  BarChart3,
  PieChart,
  Grid3X3,
  TrendingUp,
  Layers,
  Activity,
  Type,
  Contrast,
  Volume2,
  Eye,
  BookOpen,
  Download,
  Terminal,
  Compass,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { TipoGrafico } from "./tipos";
import {
  gerarDossieNotebookLmAberto,
  sugerirPerguntasCaderno,
  type CamadaLabResumo,
} from "@/lib/laboratorio/caderno-notebooklm";
import WidgetOnboardingCivico from "@/app/components/generative-ui/WidgetOnboardingCivico";
import WidgetRastreabilidadeTransnacional from "@/app/components/generative-ui/WidgetRastreabilidadeTransnacional";
import WidgetDebugSeuNono from "@/app/components/generative-ui/WidgetDebugSeuNono";

const SUGESTOES = [
  "Mostre a evolução das licenças ambientais",
  "Compare a educação de MG com a média nacional",
  "Quais empresas têm maior ESG?",
  "Qual estado tem mais barragens?",
  "Mostre os gastos do Congresso",
];

const PERIODOS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const CATEGORIAS = [
  "Ambiental",
  "Educação",
  "Economia",
  "Saúde",
  "Segurança",
  "Infraestrutura",
];

const FONTES = ["IBGE", "INEP", "IBAMA", "SIGBM", "CEAP", "TSE", "DERSA"];

const GRAFICOS: { id: TipoGrafico; label: string; icon: typeof BarChart3 }[] = [
  { id: "barras", label: "Barras", icon: BarChart3 },
  { id: "donut", label: "Donut", icon: PieChart },
  { id: "heatmap", label: "Heatmap", icon: Grid3X3 },
  { id: "linha", label: "Linha", icon: TrendingUp },
  { id: "stacked", label: "Empilhado", icon: Layers },
  { id: "gauge", label: "Gauge", icon: Activity },
  { id: "crescimento", label: "Crescimento", icon: TrendingUp },
];

const LINKS = [
  { href: "/ambiental/licenciamento", label: "Licenciamento" },
  { href: "/ambiental/barragens", label: "Barragens" },
  { href: "/cidades", label: "Cidades" },
  { href: "/congresso", label: "Congresso" },
  { href: "/judiciario", label: "Judiciário" },
  { href: "/dados", label: "Dados" },
];

const FS_LEVELS = ["sm", "md", "lg", "xl"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-soft">
        {title}
      </h3>
      {children}
    </section>
  );
}

interface LabSeuNonoProps {
  grafico: TipoGrafico;
  onGraficoChange: (g: TipoGrafico) => void;
  /** Camadas do catálogo PowerBI (id, nome, categoria). */
  camadas?: { id: string; nome: string; categoria: string }[];
  /** Ids atualmente ligados no dock. */
  ligadas?: Set<string>;
  onToggleCamada?: (id: string) => void;
}

export default function LabSeuNono({
  grafico,
  onGraficoChange,
  camadas = [],
  ligadas,
  onToggleCamada,
}: LabSeuNonoProps) {
  const [open, setOpen] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"controles" | "notebooklm" | "generative">("controles");
  const [subAbaGenerative, setSubAbaGenerative] = useState<"onboarding" | "rastreabilidade" | "debug">("onboarding");

  const [periodo, setPeriodo] = useState("2026");
  const [uf, setUf] = useState("MG");
  const [categoria, setCategoria] = useState("Ambiental");
  const [fonte, setFonte] = useState("IBGE");
  const [fsIdx, setFsIdx] = useState(1);
  const [altoContraste, setAltoContraste] = useState(false);
  const [animOn, setAnimOn] = useState(true);
  const [filtroCat, setFiltroCat] = useState<string>("__todas__");

  const camadasVisiveis = camadas.filter(
    (c) => filtroCat === "__todas__" || c.categoria === filtroCat,
  );
  const categorias = [...new Set(camadas.map((c) => c.categoria))].sort();

  const toggleLocal = useCallback((id: string) => {
    onToggleCamada?.(id);
  }, [onToggleCamada]);

  const aplicarFs = useCallback((delta: number) => {
    setFsIdx((prev) => {
      const next = Math.max(0, Math.min(FS_LEVELS.length - 1, prev + delta));
      document.documentElement.setAttribute("data-fs", FS_LEVELS[next]);
      try { localStorage.setItem("cp_fs", FS_LEVELS[next]); } catch {}
      return next;
    });
  }, []);

  const toggleContraste = useCallback(() => {
    setAltoContraste((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "high-contrast" : "pequi");
      return next;
    });
  }, []);

  const toggleAnim = useCallback(() => {
    setAnimOn((prev) => {
      document.documentElement.style.setProperty(
        "--cp-anim",
        prev ? "none" : ""
      );
      return !prev;
    });
  }, []);

  // Camadas ativas formatadas para o caderno do NotebookLM
  const camadasAtivasResumo: CamadaLabResumo[] = useMemo(() => {
    return camadas
      .filter((c) => !ligadas || ligadas.has(c.id))
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        categoria: c.categoria,
        fonteOficial: "Órgão Oficial Primário",
        urlOficial: `https://controlepopular.com.br/laboratorio?j1=${c.id}`,
        descricao: `Camada cívica de monitoramento público: ${c.nome}.`,
      }));
  }, [camadas, ligadas]);

  const perguntasSugeridas = useMemo(() => {
    return sugerirPerguntasCaderno(camadasAtivasResumo);
  }, [camadasAtivasResumo]);

  // Função de download do Dossiê Markdown
  const baixarDossie = useCallback(() => {
    const conteudo = gerarDossieNotebookLmAberto(camadasAtivasResumo);
    const blob = new Blob([conteudo], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossie-laboratorio-${new Date().toISOString().substring(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [camadasAtivasResumo]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar painel Seu Nonô" : "Abrir painel Seu Nonô"}
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 cursor-pointer rounded-l-lg border border-r-0 border-border bg-surface-2 px-1.5 py-3 text-text-soft transition-colors hover:bg-surface hover:text-text shadow-md"
      >
        {open ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <aside
        aria-label="Painel do Seu Nonô — assistente laboratório"
        className={`fixed right-0 top-0 z-40 flex h-full ${
          abaAtiva === "generative" ? "w-[360px] sm:w-[480px]" : "w-[320px] sm:w-[380px]"
        } flex-col border-l border-border bg-surface-2 shadow-2xl transition-all duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cabeçalho */}
        <header className="flex flex-col border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-text">Seu Nonô</h2>
            <span className="ml-auto text-[10px] text-text-soft">Laboratório Cívico</span>
          </div>

          {/* Seletor de abas principais */}
          <div className="mt-3 flex rounded-lg bg-surface-2 p-1 text-xs">
            <button
              type="button"
              onClick={() => setAbaAtiva("controles")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                abaAtiva === "controles"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-soft hover:text-text"
              }`}
            >
              📊 Controles
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("notebooklm")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                abaAtiva === "notebooklm"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-soft hover:text-text"
              }`}
            >
              📓 NotebookLM
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("generative")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                abaAtiva === "generative"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-soft hover:text-text"
              }`}
            >
              ✨ Recursos
            </button>
          </div>
        </header>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto">
          {/* ABA 1: CONTROLES DO LABORATÓRIO */}
          {abaAtiva === "controles" && (
            <>
              <Section title="Sugestões de Mensagens">
                <ul className="flex flex-col gap-1.5">
                  {SUGESTOES.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        className="w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-left text-xs text-text transition-colors hover:border-primary hover:bg-primary/10"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Filtros Rápidos">
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-soft">Período</span>
                    <select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text"
                    >
                      {PERIODOS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-soft">Estado (UF)</span>
                    <select
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text"
                    >
                      {UFS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-soft">Categoria</span>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text"
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-text-soft">Fonte de dados</span>
                    <select
                      value={fonte}
                      onChange={(e) => setFonte(e.target.value)}
                      className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text"
                    >
                      {FONTES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </Section>

              <Section title="Tipo de Gráfico">
                <div className="grid grid-cols-2 gap-1.5">
                  {GRAFICOS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onGraficoChange(id)}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        grafico === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-text-soft hover:bg-surface-2"
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title={`Camadas de Dados (${ligadas?.size ?? camadas.length}/${camadas.length})`}>
                <label className="mb-2 block">
                  <span className="sr-only">Filtrar camadas por categoria</span>
                  <select
                    value={filtroCat}
                    onChange={(e) => setFiltroCat(e.target.value)}
                    className="w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text"
                  >
                    <option value="__todas__">Todas as categorias</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                  {camadasVisiveis.map((c) => {
                    const ativa = ligadas?.has(c.id) ?? false;
                    return (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-text transition-colors hover:bg-surface">
                          <input
                            type="checkbox"
                            checked={ativa}
                            onChange={() => toggleLocal(c.id)}
                            className="accent-primary"
                          />
                          <span className="flex-1 truncate">{c.nome}</span>
                          <span className="text-[9px] uppercase text-text-soft">{c.categoria}</span>
                        </label>
                      </li>
                    );
                  })}
                  {camadasVisiveis.length === 0 && (
                    <li className="px-2 py-1 text-xs text-text-soft">Nenhuma camada nesta categoria.</li>
                  )}
                </ul>
              </Section>

              <Section title="Links Relacionados">
                <ul className="flex flex-col gap-1">
                  {LINKS.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 text-xs text-text-soft transition-colors hover:text-primary"
                      >
                        <ExternalLink size={12} aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}

          {/* ABA 2: NOTEBOOKLM DO SEU NONÔ */}
          {abaAtiva === "notebooklm" && (
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <BookOpen size={14} />
                  Caderno Cívico Aberto
                </div>
                <p className="text-xs text-text">
                  Investigue as {camadasAtivasResumo.length} camadas ativas com respostas citadas [n].
                </p>
                <button
                  type="button"
                  onClick={baixarDossie}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Download size={13} />
                  Baixar Dossiê .MD Aberto
                </button>
              </div>

              <Section title="Perguntas Sugeridas pelo Acervo">
                <ul className="flex flex-col gap-2">
                  {perguntasSugeridas.map((p, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-border bg-surface p-2.5 text-xs space-y-1"
                    >
                      <div className="font-semibold text-text">🤖 {p.pergunta}</div>
                      <div className="text-[10px] text-text-soft">{p.contexto}</div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Fontes Ativas no Caderno">
                <div className="space-y-1.5 text-xs">
                  {camadasAtivasResumo.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-md border border-border bg-surface px-2.5 py-1.5"
                    >
                      <span className="truncate font-medium text-text">{c.nome}</span>
                      <span className="text-[10px] uppercase text-text-soft">{c.categoria}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ABA 3: GENERATIVE UI & RECURSOS CÍVICOS */}
          {abaAtiva === "generative" && (
            <div className="p-4 space-y-4">
              {/* Sub-seletor de widgets interativos */}
              <div className="flex gap-1.5 border-b border-border pb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSubAbaGenerative("onboarding")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                    subAbaGenerative === "onboarding"
                      ? "bg-primary text-white"
                      : "bg-surface text-text-soft hover:text-text"
                  }`}
                >
                  Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => setSubAbaGenerative("rastreabilidade")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                    subAbaGenerative === "rastreabilidade"
                      ? "bg-primary text-white"
                      : "bg-surface text-text-soft hover:text-text"
                  }`}
                >
                  Rastreabilidade
                </button>
                <button
                  type="button"
                  onClick={() => setSubAbaGenerative("debug")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                    subAbaGenerative === "debug"
                      ? "bg-primary text-white"
                      : "bg-surface text-text-soft hover:text-text"
                  }`}
                >
                  Telemetria
                </button>
              </div>

              {/* Renderização do widget selecionado */}
              {subAbaGenerative === "onboarding" && (
                <WidgetOnboardingCivico
                  onSelecionarCamada={(id) => onToggleCamada?.(id)}
                  onAbrirSeuNono={() => setAbaAtiva("notebooklm")}
                />
              )}

              {subAbaGenerative === "rastreabilidade" && (
                <WidgetRastreabilidadeTransnacional />
              )}

              {subAbaGenerative === "debug" && (
                <WidgetDebugSeuNono />
              )}
            </div>
          )}
        </div>

        {/* Rodapé de acessibilidade */}
        <footer className="border-t border-border px-4 py-2.5 bg-surface">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span className="text-[10px]">Acessibilidade:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => aplicarFs(-1)}
                className="rounded px-1.5 py-0.5 font-bold hover:bg-surface-2"
                title="Diminuir texto"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => aplicarFs(1)}
                className="rounded px-1.5 py-0.5 font-bold hover:bg-surface-2"
                title="Aumentar texto"
              >
                A+
              </button>
              <button
                type="button"
                onClick={toggleContraste}
                className="rounded px-1.5 py-0.5 hover:bg-surface-2"
                title="Alto contraste"
              >
                <Contrast size={12} />
              </button>
            </div>
          </div>
        </footer>
      </aside>
    </>
  );
}
