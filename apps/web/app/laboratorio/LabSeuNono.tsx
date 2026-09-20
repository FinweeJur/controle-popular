"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import type { TipoGrafico } from "./tipos";

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

const CAMADAS = [
  "Licenças ambientais",
  "Barragens SIGBM",
  "Educação (IBGE/INEP)",
  "Séries econômicas",
  "Congresso (CEAP)",
  "Judiciário",
  "Clima",
  "ESG",
];

const LINKS = [
  { href: "/ambiental/licenciamento", label: "Licenciamento" },
  { href: "/ambiental/barragens", label: "Barragens" },
  { href: "/cidades", label: "Cidades" },
  { href: "/congresso", label: "Congreso" },
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
}

export default function LabSeuNono({ grafico, onGraficoChange }: LabSeuNonoProps) {
  const [open, setOpen] = useState(true);
  const [periodo, setPeriodo] = useState("2026");
  const [uf, setUf] = useState("MG");
  const [categoria, setCategoria] = useState("Ambiental");
  const [fonte, setFonte] = useState("IBGE");
  const [camadas, setCamadas] = useState<Record<string, boolean>>({
    "Licenças ambientais": true,
    "Barragens SIGBM": false,
    "Educação (IBGE/INEP)": false,
    "Séries econômicas": false,
    "Congresso (CEAP)": false,
    "Judiciário": false,
    "Clima": false,
    "ESG": false,
  });
  const [fsIdx, setFsIdx] = useState(1);
  const [altoContraste, setAltoContraste] = useState(false);
  const [animOn, setAnimOn] = useState(true);
  const [narrar, setNarrar] = useState(false);

  const toggleCamada = useCallback((c: string) => {
    setCamadas((prev) => ({ ...prev, [c]: !prev[c] }));
  }, []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar painel Seu Nonô" : "Abrir painel Seu Nonô"}
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 cursor-pointer rounded-l-lg border border-r-0 border-border bg-surface-2 px-1.5 py-3 text-text-soft transition-colors hover:bg-surface hover:text-text"
      >
        {open ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <aside
        aria-label="Painel do Seu Nonô — assistente laboratório"
        className={`fixed right-0 top-0 z-40 flex h-full w-[320px] flex-col border-l border-border bg-surface-2 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Sparkles size={18} className="text-accent" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text">Seu Nonô</h2>
          <span className="ml-auto text-[10px] text-text-soft">Laboratório</span>
        </header>

        <div className="flex-1 overflow-y-auto">
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

          <Section title="Camadas de Dados">
            <ul className="flex flex-col gap-1">
              {CAMADAS.map((c) => (
                <li key={c}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-text transition-colors hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={camadas[c]}
                      onChange={() => toggleCamada(c)}
                      className="accent-primary"
                    />
                    {c}
                  </label>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Links Relacionados">
            <ul className="flex flex-col gap-1">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary transition-colors hover:underline"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Acessibilidade">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Type size={14} className="text-text-soft" aria-hidden="true" />
                <span className="text-[10px] font-medium text-text-soft">Tamanho da fonte</span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => aplicarFs(-1)}
                    disabled={fsIdx === 0}
                    className="cursor-pointer rounded border border-border bg-surface px-2 py-0.5 text-xs font-bold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Diminuir fonte"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarFs(1)}
                    disabled={fsIdx === FS_LEVELS.length - 1}
                    className="cursor-pointer rounded border border-border bg-surface px-2 py-0.5 text-xs font-bold text-text transition-colors hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Aumentar fonte"
                  >
                    A+
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <Contrast size={14} className="text-text-soft" aria-hidden="true" />
                <span className="text-[10px] font-medium text-text-soft">Contraste alto</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={altoContraste}
                  onClick={toggleContraste}
                  className={`ml-auto inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    altoContraste ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      altoContraste ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <Eye size={14} className="text-text-soft" aria-hidden="true" />
                <span className="text-[10px] font-medium text-text-soft">Animações</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={animOn}
                  onClick={toggleAnim}
                  className={`ml-auto inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    animOn ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      animOn ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <Volume2 size={14} className="text-text-soft" aria-hidden="true" />
                <span className="text-[10px] font-medium text-text-soft">Narrar conteúdo</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={narrar}
                  onClick={() => setNarrar((v) => !v)}
                  className={`ml-auto inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    narrar ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      narrar ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}
