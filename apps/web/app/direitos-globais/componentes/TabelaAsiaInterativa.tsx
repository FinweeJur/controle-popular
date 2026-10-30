"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { PaisAsiatico } from "@/lib/direitos-globais/asia/paises";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_ASIA: ColunaCsv<PaisAsiatico>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "capital", rotulo: "Capital" },
  { chave: "populacao", rotulo: "População Estimada" },
  { chave: "leva", rotulo: "Leva Prioritária" },
  { chave: "notaTranscontinental", rotulo: "Nota Transcontinental" },
];

function formatarPopulacaoM(pop?: number): string {
  if (!pop) return "Não informado";
  return `${(pop / 1000000).toFixed(0)}M`;
}

function filtrarPaisAsia(p: PaisAsiatico, leva: string, subRegiao: string, termo: string): boolean {
  if (leva !== "Todas" && String(p.leva) !== leva) return false;
  if (subRegiao !== "Todas" && p.subRegiao !== subRegiao) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(`${p.nome} ${p.codigo} ${p.capital ?? ""}`.toLowerCase());
  return texto.includes(termo);
}

function compararPaisesAsia(
  a: PaisAsiatico,
  b: PaisAsiatico,
  ordenarPor: "nome" | "populacao",
  direcao: "asc" | "desc"
): number {
  if (ordenarPor === "populacao") {
    const diff = (a.populacao ?? 0) - (b.populacao ?? 0);
    return direcao === "asc" ? diff : -diff;
  }
  const cmp = a.nome.localeCompare(b.nome, "pt-BR");
  return direcao === "asc" ? cmp : -cmp;
}

interface BarraFiltrosAsiaProps {
  busca: string;
  setBusca: (v: string) => void;
  levaFiltro: string;
  setLevaFiltro: (v: string) => void;
  subRegiaoFiltro: string;
  setSubRegiaoFiltro: (v: string) => void;
  subRegioes: string[];
  paisesFiltrados: PaisAsiatico[];
}

function BarraFiltrosAsia({
  busca,
  setBusca,
  levaFiltro,
  setLevaFiltro,
  subRegiaoFiltro,
  setSubRegiaoFiltro,
  subRegioes,
  paisesFiltrados,
}: BarraFiltrosAsiaProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          role="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar país, código, capital..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
        />

        <select
          value={levaFiltro}
          onChange={(e) => setLevaFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por leva"
        >
          <option value="Todas">Todas as Levas (1, 2 e 3)</option>
          <option value="1">Leva 1 (Prioritária - 6 países)</option>
          <option value="2">Leva 2 (6 países)</option>
          <option value="3">Leva 3 (11 países)</option>
        </select>

        <select
          value={subRegiaoFiltro}
          onChange={(e) => setSubRegiaoFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por sub-região"
        >
          <option value="Todas">Todas as Sub-Regiões</option>
          {subRegioes.map((sr) => (
            <option key={sr} value={sr}>{sr}</option>
          ))}
        </select>
      </div>

      <ExportarCsvDireitos
        dados={paisesFiltrados}
        colunas={COLUNAS_CSV_ASIA}
        nomeArquivoBase="paises-asia-direitos"
        rotuloBotao={`Baixar CSV (${paisesFiltrados.length})`}
      />
    </div>
  );
}

interface TabelaGradeAsiaProps {
  paises: PaisAsiatico[];
  ordenarPor: "nome" | "populacao";
  direcao: "asc" | "desc";
  onAlternarOrdem: (col: "nome" | "populacao") => void;
}

function TabelaGradeAsia({ paises, ordenarPor, direcao, onAlternarOrdem }: TabelaGradeAsiaProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-surface-2 text-text font-semibold">
          <tr>
            <th
              scope="col"
              className="px-3 py-2.5"
              aria-sort={ordenarPor === "nome" ? (direcao === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                onClick={() => onAlternarOrdem("nome")}
                className="inline-flex items-center gap-1 font-semibold hover:text-primary"
              >
                País <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="px-2 py-2.5">Sub-Região</th>
            <th scope="col" className="px-2 py-2.5">Capital</th>
            <th
              scope="col"
              className="px-2 py-2.5"
              aria-sort={ordenarPor === "populacao" ? (direcao === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                onClick={() => onAlternarOrdem("populacao")}
                className="inline-flex items-center gap-1 font-semibold hover:text-primary"
              >
                População <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="px-2 py-2.5">Leva</th>
            <th scope="col" className="px-2 py-2.5">Sistema ONU</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paises.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-xs text-text-soft">
                Nenhum país encontrado com os filtros selecionados.
              </td>
            </tr>
          ) : (
            paises.map((p) => (
              <tr key={p.codigo} className="hover:bg-surface-2/50">
                <td className="px-3 py-2 font-medium text-text">
                  {p.nome} <span className="font-mono text-text-soft">({p.codigo})</span>
                  {p.notaTranscontinental && (
                    <span className="ml-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                      Transcontinental
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-text-soft">{p.subRegiao}</td>
                <td className="px-2 py-2 text-text-soft">{p.capital ?? "—"}</td>
                <td className="px-2 py-2 text-text font-mono">{formatarPopulacaoM(p.populacao)}</td>
                <td className="px-2 py-2">
                  <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                    Leva {p.leva}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <Link
                    href="/direitos-globais/onu"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    UPR / Comitês
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function TabelaAsiaInterativa({ paises }: { paises: readonly PaisAsiatico[] }) {
  const [busca, setBusca] = useState("");
  const [levaFiltro, setLevaFiltro] = useState("Todas");
  const [subRegiaoFiltro, setSubRegiaoFiltro] = useState("Todas");
  const [ordenarPor, setOrdenarPor] = useState<"nome" | "populacao">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const subRegioes = useMemo(() => {
    return Array.from(new Set(paises.map((p) => p.subRegiao))).sort();
  }, [paises]);

  const paisesFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return paises
      .filter((p) => filtrarPaisAsia(p, levaFiltro, subRegiaoFiltro, termo))
      .sort((a, b) => compararPaisesAsia(a, b, ordenarPor, direcao));
  }, [paises, busca, levaFiltro, subRegiaoFiltro, ordenarPor, direcao]);

  function alternarOrdem(coluna: "nome" | "populacao") {
    if (ordenarPor === coluna) {
      setDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(coluna);
      setDirecao("asc");
    }
  }

  return (
    <div className="space-y-4">
      <BarraFiltrosAsia
        busca={busca}
        setBusca={setBusca}
        levaFiltro={levaFiltro}
        setLevaFiltro={setLevaFiltro}
        subRegiaoFiltro={subRegiaoFiltro}
        setSubRegiaoFiltro={setSubRegiaoFiltro}
        subRegioes={subRegioes}
        paisesFiltrados={paisesFiltrados}
      />
      <TabelaGradeAsia
        paises={paisesFiltrados}
        ordenarPor={ordenarPor}
        direcao={direcao}
        onAlternarOrdem={alternarOrdem}
      />
    </div>
  );
}
