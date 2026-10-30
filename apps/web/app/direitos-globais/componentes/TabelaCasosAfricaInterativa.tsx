"use client";

import { useMemo, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, FileText, ArrowUpDown } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { CasoAfricano } from "@/lib/direitos-globais/africa/casos-corte-africana";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_CASOS: ColunaCsv<CasoAfricano>[] = [
  { chave: "tribunal", rotulo: "Tribunal / Órgão" },
  { chave: "numero", rotulo: "Número do Caso" },
  { chave: "pais", rotulo: "País Demandado" },
  { chave: "partes", rotulo: "Partes" },
  { chave: "data", rotulo: "Data do Acórdão" },
  { chave: "cumprimento", rotulo: "Cumprimento" },
  { chave: "url", rotulo: "Link Oficial (PDF)" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "cumprido") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Cumprido
      </span>
    );
  }
  if (status === "parcial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
      <XCircle className="h-3 w-3" />
      Descumprido
    </span>
  );
}

function filtrarCasoAfricano(
  c: CasoAfricano,
  temaFiltro: string,
  statusFiltro: string,
  termo: string
): boolean {
  if (temaFiltro !== "Todos" && c.temaPrincipal !== temaFiltro) return false;
  if (statusFiltro !== "Todos" && c.cumprimento !== statusFiltro) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(
    `${c.tribunal} ${c.numero} ${c.pais} ${c.partes} ${c.resumoOficial} ${c.artigos.join(" ")}`.toLowerCase()
  );
  return texto.includes(termo);
}

interface BarraFiltrosCasosProps {
  busca: string;
  setBusca: (v: string) => void;
  temaFiltro: string;
  setTemaFiltro: (v: string) => void;
  temasDisponiveis: string[];
  statusFiltro: string;
  setStatusFiltro: (v: string) => void;
  ordemData: "asc" | "desc";
  setOrdemData: (fn: (prev: "asc" | "desc") => "asc" | "desc") => void;
  casosFiltrados: CasoAfricano[];
}

function BarraFiltrosCasos({
  busca,
  setBusca,
  temaFiltro,
  setTemaFiltro,
  temasDisponiveis,
  statusFiltro,
  setStatusFiltro,
  ordemData,
  setOrdemData,
  casosFiltrados,
}: BarraFiltrosCasosProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          role="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar caso, país, partes, artigos..."
          className="min-w-[220px] rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
        />

        <select
          value={temaFiltro}
          onChange={(e) => setTemaFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por tema prioritário"
        >
          <option value="Todos">Todos os Temas</option>
          {temasDisponiveis.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por status de cumprimento"
        >
          <option value="Todos">Todos os Status</option>
          <option value="cumprido">Cumprido</option>
          <option value="parcial">Parcial</option>
          <option value="descumprido">Descumprido</option>
        </select>

        <button
          type="button"
          onClick={() => setOrdemData((prev) => (prev === "asc" ? "desc" : "asc"))}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text hover:border-primary"
          aria-label={`Ordenar por data (${ordemData === "desc" ? "mais recente" : "mais antiga"})`}
        >
          Data ({ordemData === "desc" ? "Mais recente" : "Mais antiga"})
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>

      <ExportarCsvDireitos
        dados={casosFiltrados}
        colunas={COLUNAS_CSV_CASOS}
        nomeArquivoBase="casos-corte-africana-achpr"
        rotuloBotao={`Baixar CSV (${casosFiltrados.length})`}
      />
    </div>
  );
}

function CartaoCaso({ caso }: { caso: CasoAfricano }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-mono font-medium text-text-soft">
            {caso.tribunal} · {caso.numero}
          </span>
          <span className="ml-2 text-xs font-semibold text-primary">{caso.pais}</span>
          <h3 className="mt-1 text-base font-bold text-text">{caso.partes}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-soft">{caso.data}</span>
          <StatusBadge status={caso.cumprimento} />
        </div>
      </div>

      <p className="mt-3 text-sm text-text-700 leading-relaxed">{caso.resumoOficial}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          Tema: {caso.temaPrincipal}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="text-xs text-text-soft">
          <strong className="text-text">Reparações:</strong> {caso.reparacoes.join("; ")}
        </div>
        <a
          href={caso.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />
          Acórdão Oficial (PDF)
        </a>
      </div>
    </article>
  );
}

export default function TabelaCasosAfricaInterativa({ casos }: { casos: readonly CasoAfricano[] }) {
  const [busca, setBusca] = useState("");
  const [temaFiltro, setTemaFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [ordemData, setOrdemData] = useState<"asc" | "desc">("desc");

  const temasDisponiveis = useMemo(() => {
    const todos = new Set<string>();
    casos.forEach((c) => todos.add(c.temaPrincipal));
    return Array.from(todos).sort();
  }, [casos]);

  const casosFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return casos
      .filter((c) => filtrarCasoAfricano(c, temaFiltro, statusFiltro, termo))
      .sort((a, b) => {
        const cmp = a.data.localeCompare(b.data);
        return ordemData === "asc" ? cmp : -cmp;
      });
  }, [casos, busca, temaFiltro, statusFiltro, ordemData]);

  return (
    <div className="space-y-4">
      <BarraFiltrosCasos
        busca={busca}
        setBusca={setBusca}
        temaFiltro={temaFiltro}
        setTemaFiltro={setTemaFiltro}
        temasDisponiveis={temasDisponiveis}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        ordemData={ordemData}
        setOrdemData={setOrdemData}
        casosFiltrados={casosFiltrados}
      />

      <div className="space-y-4">
        {casosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-xs text-text-soft">
            Nenhum caso encontrado com os critérios selecionados.
          </div>
        ) : (
          casosFiltrados.map((caso) => (
            <CartaoCaso key={`${caso.tribunal}-${caso.numero}`} caso={caso} />
          ))
        )}
      </div>
    </div>
  );
}
