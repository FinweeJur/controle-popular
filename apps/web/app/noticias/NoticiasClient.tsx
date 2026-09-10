"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import type { NoticiaPortal } from "@/lib/noticias/portal";

interface Props {
  noticias: NoticiaPortal[];
}

const CATEGORIAS = [
  "Todas",
  "Relatório Técnico",
  "Investigação Cívica",
  "Explicador",
  "Divulgação Científica",
] as const;

const FRENTES_NOMES: Record<string, string> = {
  todas: "Todas as frentes",
  terra: "Terra e Territórios",
  estado: "Estado e Economia",
  congresso: "Congresso Nacional",
  judiciario: "Poder Judiciário",
  ambiental: "Meio Ambiente & ONSA",
  paraopeba: "Paraopeba & Brumadinho",
  cidades: "Cidades Monitoradas",
};

const PERIODOS: { valor: string; rotulo: string; dias: number | null }[] = [
  { valor: "todas", rotulo: "Qualquer data", dias: null },
  { valor: "7d", rotulo: "Últimos 7 dias", dias: 7 },
  { valor: "30d", rotulo: "Últimos 30 dias", dias: 30 },
  { valor: "90d", rotulo: "Últimos 3 meses", dias: 90 },
  { valor: "1a", rotulo: "Último ano", dias: 365 },
];

const ORDENS = [
  { valor: "recentes", rotulo: "Mais recentes primeiro" },
  { valor: "antigas", rotulo: "Mais antigas primeiro" },
] as const;

/** Temas = palavras-chave do acervo, ordenadas por quantas matérias têm.
 * NÃO filtro por "tema popular" (2+ ocorrências): com o acervo pequeno, a
 * tarifa social de energia e água — achado do dono em 08/09 — teria 1 matéria
 * e ficaria invisível no filtro. Palavra com 1 matéria é lista de títulos,
 * sim; invisível é pior. */
function temasDisponiveis(noticias: NoticiaPortal[]): string[] {
  const contagem = new Map<string, number>();
  for (const n of noticias) {
    for (const k of n.palavrasChave) {
      const chave = k.trim();
      if (chave) contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  }
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([tema, qtd]) => `${tema} (${qtd})`);
}

/** O `<option>` mostra "tema (N)" para o leitor; o valor comparado é o tema puro. */
function temaDoValor(rotulo: string): string {
  return rotulo.replace(/ \(\d+\)$/, "");
}

/** Editada depois da publicação, com diferença maior que 1 dia. */
function editadaDepois(n: NoticiaPortal): boolean {
  return new Date(n.atualizadoEm).getTime() - new Date(n.publicadoEm).getTime() > 86400000;
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function NoticiasClient({ noticias }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");
  const [frenteAtiva, setFrenteAtiva] = useState<string>("todas");
  const [temaAtivo, setTemaAtivo] = useState<string>("todos");
  const [periodoAtivo, setPeriodoAtivo] = useState<string>("todas");
  const [ordem, setOrdem] = useState<string>("recentes");

  const temas = useMemo(() => temasDisponiveis(noticias), [noticias]);

  const noticiasFiltradas = useMemo(() => {
    const dias = PERIODOS.find((p) => p.valor === periodoAtivo)?.dias ?? null;
    const limite = dias ? Date.now() - dias * 24 * 60 * 60 * 1000 : null;

    const filtradas = noticias.filter((n) => {
      const matchCategoria =
        categoriaAtiva === "Todas" || n.categoria === categoriaAtiva;
      const matchFrente = frenteAtiva === "todas" || n.frente === frenteAtiva;
      const matchTema =
        temaAtivo === "todos" ||
        n.palavrasChave.some((k) => k.trim() === temaDoValor(temaAtivo));
      const matchPeriodo =
        limite === null || new Date(n.publicadoEm).getTime() >= limite;

      const q = busca.toLowerCase().trim();
      const matchBusca =
        !q ||
        n.titulo.toLowerCase().includes(q) ||
        n.subtitulo.toLowerCase().includes(q) ||
        n.resumo.toLowerCase().includes(q) ||
        n.palavrasChave.some((k) => k.toLowerCase().includes(q));

      return matchCategoria && matchFrente && matchTema && matchPeriodo && matchBusca;
    });

    return filtradas.sort((a, b) => {
      const da = new Date(a.publicadoEm).getTime();
      const db = new Date(b.publicadoEm).getTime();
      return ordem === "recentes" ? db - da : da - db;
    });
  }, [noticias, categoriaAtiva, frenteAtiva, temaAtivo, periodoAtivo, ordem, busca]);

  const filtroAtivo =
    busca ||
    categoriaAtiva !== "Todas" ||
    frenteAtiva !== "todas" ||
    temaAtivo !== "todos" ||
    periodoAtivo !== "todas";

  const destaque = noticias[0];
  const listaExibicao = filtroAtivo ? noticiasFiltradas : noticiasFiltradas.slice(1);

  return (
    <div className="space-y-10">
      {/* ═══ BARRA DE FILTROS & BUSCA ═══ */}
      <section aria-label="Filtros de pesquisa" className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              size={16}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar por tema, cidade, dados econômicos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-muted" />
            <select
              value={frenteAtiva}
              onChange={(e) => setFrenteAtiva(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por frente"
            >
              {Object.entries(FRENTES_NOMES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tema, período e ordenação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <label htmlFor="filtro-tema" className="text-xs text-muted whitespace-nowrap">
              Tema
            </label>
            <select
              id="filtro-tema"
              value={temaAtivo}
              onChange={(e) => setTemaAtivo(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="todos">Todos os temas</option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <select
              value={periodoAtivo}
              onChange={(e) => setPeriodoAtivo(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              aria-label="Filtrar por data"
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {ordem === "recentes" ? (
              <ArrowDownWideNarrow size={14} className="text-muted" />
            ) : (
              <ArrowUpNarrowWide size={14} className="text-muted" />
            )}
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              aria-label="Ordenar por data"
            >
              {ORDENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Abas de categorias */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaAtiva(cat)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                categoriaAtiva === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted self-center">
            {noticiasFiltradas.length} {noticiasFiltradas.length === 1 ? "publicação" : "publicações"}
          </span>
        </div>
      </section>

      {/* ═══ DESTAQUE PRINCIPAL (Quando sem filtro ativo) ═══ */}
      {!filtroAtivo && destaque && (
        <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:border-primary/50">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                {destaque.categoria}
              </span>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted border border-border/60">
                {destaque.subfrente}
              </span>
              <span className="ml-auto flex items-center gap-1 text-muted">
                <Clock size={12} />
                <span>{destaque.tempoLeituraMin} min de leitura</span>
              </span>
            </div>

            <h2 className="mt-3 font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              <Link href={`/noticias/${destaque.slug}`} className="hover:text-primary transition-colors">
                {destaque.titulo}
              </Link>
            </h2>

            <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed">
              {destaque.subtitulo}
            </p>

            {/* Métricas em destaque */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-y border-border/60 py-4">
              {destaque.metricas.map((m) => (
                <div key={m.rotulo}>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{m.rotulo}</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-foreground">{m.valor}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Calendar size={13} />
                <span>
                  Publicado em {dataCurta(destaque.publicadoEm)}
                  {editadaDepois(destaque) && (
                    <span> · editado em {dataCurta(destaque.atualizadoEm)}</span>
                  )}
                </span>
                <span>•</span>
                <span>{destaque.autor}</span>
              </div>

              <Link
                href={`/noticias/${destaque.slug}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <span>Ler relatório completo</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* ═══ GRADE DE REPORTAGENS E RELATÓRIOS ═══ */}
      <section aria-label="Lista de matérias e relatórios" className="space-y-4">
        {listaExibicao.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
            Nenhuma publicação encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {listaExibicao.map((n) => (
              <article
                key={n.slug}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-semibold text-foreground border border-border/60">
                      {n.categoria}
                    </span>
                    <span className="text-muted">
                      {n.subfrente}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-muted">
                      <Clock size={11} />
                      <span>{n.tempoLeituraMin} min</span>
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-base sm:text-lg font-bold text-foreground">
                    <Link href={`/noticias/${n.slug}`} className="hover:text-primary transition-colors">
                      {n.titulo}
                    </Link>
                  </h3>

                  <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
                    {n.resumo}
                  </p>

                  {/* Pequenos cards com dados */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {n.metricas.slice(0, 2).map((m) => (
                      <span
                        key={m.rotulo}
                        className="rounded-md border border-border/60 bg-surface-2 px-2 py-0.5 text-[10px] text-foreground font-medium"
                      >
                        <strong className="text-primary">{m.valor}</strong> — {m.rotulo}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
                  <span>
                    Publicado em {dataCurta(n.publicadoEm)}
                    {editadaDepois(n) && (
                      <span> · editado em {dataCurta(n.atualizadoEm)}</span>
                    )}
                  </span>
                  <Link
                    href={`/noticias/${n.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>Acessar</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
