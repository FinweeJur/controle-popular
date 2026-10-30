"use client";

import { useMemo, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, ExternalLink, HelpCircle, ArrowUpDown } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { RecomendacaoONU } from "@/lib/direitos-globais/onu/recomendacoes-upr";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_ONU: ColunaCsv<RecomendacaoONU>[] = [
  { chave: "pais", rotulo: "País" },
  { chave: "orgao", rotulo: "Órgão / Mecanismo" },
  { chave: "documento", rotulo: "Documento Oficial" },
  { chave: "data", rotulo: "Data" },
  { chave: "tema", rotulo: "Tema Prioritário" },
  { chave: "status", rotulo: "Status" },
  { chave: "texto", rotulo: "Recomendação" },
  { chave: "evidencia", rotulo: "Evidência / Justificativa" },
  { chave: "url", rotulo: "Link Oficial" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "cumprido" || status === "ratificado") {
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
  if (status === "nao") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" />
        Não signatário
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-soft">
      <HelpCircle className="h-3 w-3" />
      {status === "aceita" ? "Aceita" : status === "notada" ? "Notada" : "Desconhecido"}
    </span>
  );
}

function filtrarRecomendacaoOnu(
  r: RecomendacaoONU,
  orgaoFiltro: string,
  paisFiltro: string,
  termo: string
): boolean {
  if (orgaoFiltro !== "Todos" && r.orgao !== orgaoFiltro) return false;
  if (paisFiltro !== "Todos" && r.pais !== paisFiltro) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(
    `${r.pais} ${r.orgao} ${r.documento} ${r.texto} ${r.tema} ${r.evidencia ?? ""}`.toLowerCase()
  );
  return texto.includes(termo);
}

interface BarraFiltrosOnuProps {
  busca: string;
  setBusca: (v: string) => void;
  orgaoFiltro: string;
  setOrgaoFiltro: (v: string) => void;
  orgaosDisponiveis: string[];
  paisFiltro: string;
  setPaisFiltro: (v: string) => void;
  paisesDisponiveis: string[];
  ordemData: "asc" | "desc";
  setOrdemData: (fn: (prev: "asc" | "desc") => "asc" | "desc") => void;
  recomendacoesFiltradas: RecomendacaoONU[];
}

function BarraFiltrosOnu({
  busca,
  setBusca,
  orgaoFiltro,
  setOrgaoFiltro,
  orgaosDisponiveis,
  paisFiltro,
  setPaisFiltro,
  paisesDisponiveis,
  ordemData,
  setOrdemData,
  recomendacoesFiltradas,
}: BarraFiltrosOnuProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          role="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar tema, país, órgão, texto..."
          className="min-w-[220px] rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
        />

        <select
          value={orgaoFiltro}
          onChange={(e) => setOrgaoFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por órgão ou tratado"
        >
          <option value="Todos">Todos os Órgãos / Comitês</option>
          {orgaosDisponiveis.map((org) => (
            <option key={org} value={org}>{org}</option>
          ))}
        </select>

        <select
          value={paisFiltro}
          onChange={(e) => setPaisFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por país"
        >
          <option value="Todos">Todos os Países</option>
          {paisesDisponiveis.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
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
        dados={recomendacoesFiltradas}
        colunas={COLUNAS_CSV_ONU}
        nomeArquivoBase="recomendacoes-upr-tratados-onu"
        rotuloBotao={`Baixar CSV (${recomendacoesFiltradas.length})`}
      />
    </div>
  );
}

function CartaoRecomendacao({ rec }: { rec: RecomendacaoONU }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{rec.pais}</span>
          <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-xs font-mono font-medium text-text-soft">
            {rec.orgao} {rec.cicloUpr ? `· ${rec.cicloUpr}` : ""}
          </span>
          <h3 className="mt-1 text-sm font-bold text-text">{rec.documento}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-soft">{rec.data}</span>
          <StatusBadge status={rec.status} />
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-text-700 leading-relaxed font-sans">{rec.texto}</p>

      {rec.evidencia && (
        <div className="mt-3 rounded border border-border bg-surface-2 p-3 text-xs text-text-700">
          <strong className="text-text">Evidência documental oficial:</strong> {rec.evidencia}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <span className="text-text-soft">Sessão: {rec.sessao ?? "Periódica"} · Tema: {rec.tema}</span>
        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Documento Oficial da ONU <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export default function TabelaOnuInterativa({ recomendacoes }: { recomendacoes: readonly RecomendacaoONU[] }) {
  const [busca, setBusca] = useState("");
  const [orgaoFiltro, setOrgaoFiltro] = useState("Todos");
  const [paisFiltro, setPaisFiltro] = useState("Todos");
  const [ordemData, setOrdemData] = useState<"asc" | "desc">("desc");

  const orgaosDisponiveis = useMemo(() => {
    return Array.from(new Set(recomendacoes.map((r) => r.orgao))).sort();
  }, [recomendacoes]);

  const paisesDisponiveis = useMemo(() => {
    return Array.from(new Set(recomendacoes.map((r) => r.pais))).sort();
  }, [recomendacoes]);

  const recomendacoesFiltradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return recomendacoes
      .filter((r) => filtrarRecomendacaoOnu(r, orgaoFiltro, paisFiltro, termo))
      .sort((a, b) => {
        const cmp = a.data.localeCompare(b.data);
        return ordemData === "asc" ? cmp : -cmp;
      });
  }, [recomendacoes, busca, orgaoFiltro, paisFiltro, ordemData]);

  return (
    <div className="space-y-4">
      <BarraFiltrosOnu
        busca={busca}
        setBusca={setBusca}
        orgaoFiltro={orgaoFiltro}
        setOrgaoFiltro={setOrgaoFiltro}
        orgaosDisponiveis={orgaosDisponiveis}
        paisFiltro={paisFiltro}
        setPaisFiltro={setPaisFiltro}
        paisesDisponiveis={paisesDisponiveis}
        ordemData={ordemData}
        setOrdemData={setOrdemData}
        recomendacoesFiltradas={recomendacoesFiltradas}
      />

      <div className="space-y-4">
        {recomendacoesFiltradas.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-xs text-text-soft">
            Nenhuma recomendação encontrada com os filtros selecionados.
          </div>
        ) : (
          recomendacoesFiltradas.map((rec, i) => (
            <CartaoRecomendacao key={`${rec.documento}-${i}`} rec={rec} />
          ))
        )}
      </div>
    </div>
  );
}
