"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { Pais } from "@/lib/direitos-globais/tipos";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_AMERICA_LATINA: ColunaCsv<Pais>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "capital", rotulo: "Capital" },
  { chave: "populacao", rotulo: "População Estimada" },
  { chave: "idh", rotulo: "IDH" },
  { chave: "regimePolitico", rotulo: "Regime Político" },
  { chave: "dataConstituicao", rotulo: "Data da Constituição" },
];

function formatarRegime(regime?: string): string {
  switch (regime) {
    case "democracia":
      return "República Democrática";
    case "monarquia_constitucional":
      return "Monarquia Constitucional";
    case "autoritario":
      return "Autoritário";
    case "hibrido":
      return "Híbrido";
    default:
      return regime ?? "Não informado";
  }
}

function formatarPopulacaoM(pop?: number): string {
  if (!pop) return "Em levantamento";
  return `${(pop / 1000000).toFixed(1)}M`;
}

function filtrarPaisAmericaLatina(p: Pais, subRegiao: string, termo: string): boolean {
  if (subRegiao !== "Todas" && p.subRegiao !== subRegiao) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(`${p.nome} ${p.codigo} ${p.capital ?? ""}`.toLowerCase());
  return texto.includes(termo);
}

function compararPaisesAmericaLatina(
  a: Pais,
  b: Pais,
  ordenarPor: "nome" | "populacao" | "idh",
  direcao: "asc" | "desc"
): number {
  if (ordenarPor === "populacao") {
    const diff = (a.populacao ?? 0) - (b.populacao ?? 0);
    return direcao === "asc" ? diff : -diff;
  }
  if (ordenarPor === "idh") {
    const diff = (a.idh ?? 0) - (b.idh ?? 0);
    return direcao === "asc" ? diff : -diff;
  }
  const cmp = a.nome.localeCompare(b.nome, "pt-BR");
  return direcao === "asc" ? cmp : -cmp;
}

interface BarraFiltrosProps {
  busca: string;
  setBusca: (v: string) => void;
  subRegiaoFiltro: string;
  setSubRegiaoFiltro: (v: string) => void;
  subRegioes: string[];
  totalPaises: number;
  paisesFiltrados: Pais[];
}

function BarraFiltrosAmericaLatina({
  busca,
  setBusca,
  subRegiaoFiltro,
  setSubRegiaoFiltro,
  subRegioes,
  totalPaises,
  paisesFiltrados,
}: BarraFiltrosProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar país, código, capital..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
        />

        <select
          value={subRegiaoFiltro}
          onChange={(e) => setSubRegiaoFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por sub-região"
        >
          <option value="Todas">Todas as Sub-Regiões ({totalPaises})</option>
          {subRegioes.map((sr) => (
            <option key={sr} value={sr}>
              {sr}
            </option>
          ))}
        </select>
      </div>

      <ExportarCsvDireitos<Pais>
        dados={paisesFiltrados}
        colunas={COLUNAS_CSV_AMERICA_LATINA}
        nomeArquivoBase="direitos-globais-america-latina"
        rotuloBotao="Exportar CSV"
      />
    </div>
  );
}

interface GradeTabelaProps {
  paises: Pais[];
  onAlternarOrdenacao: (col: "nome" | "populacao" | "idh") => void;
}

function GradeTabelaAmericaLatina({ paises, onAlternarOrdenacao }: GradeTabelaProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-text-soft">
            <th scope="col" className="p-3 font-semibold">
              <button
                type="button"
                onClick={() => onAlternarOrdenacao("nome")}
                className="inline-flex items-center gap-1 hover:text-text"
              >
                País <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="p-3 font-semibold">ISO</th>
            <th scope="col" className="p-3 font-semibold">Sub-Região</th>
            <th scope="col" className="p-3 font-semibold">Capital</th>
            <th scope="col" className="p-3 font-semibold">
              <button
                type="button"
                onClick={() => onAlternarOrdenacao("populacao")}
                className="inline-flex items-center gap-1 hover:text-text"
              >
                População <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="p-3 font-semibold">
              <button
                type="button"
                onClick={() => onAlternarOrdenacao("idh")}
                className="inline-flex items-center gap-1 hover:text-text"
              >
                IDH <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="p-3 font-semibold">Regime Constitucional</th>
            <th scope="col" className="p-3 font-semibold">Ano Carta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paises.map((p) => (
            <tr key={p.codigo} className="transition-colors hover:bg-surface-2/60">
              <td className="p-3 font-semibold text-text">{p.nome}</td>
              <td className="p-3 font-mono text-text-soft">{p.codigo}</td>
              <td className="p-3 text-text-soft">{p.subRegiao}</td>
              <td className="p-3 text-text-soft">{p.capital}</td>
              <td className="p-3 text-text-soft">{formatarPopulacaoM(p.populacao)}</td>
              <td className="p-3 text-text-soft">{p.idh?.toFixed(3) ?? "—"}</td>
              <td className="p-3 text-text-soft">{formatarRegime(p.regimePolitico)}</td>
              <td className="p-3 font-mono text-text-soft">
                {p.dataConstituicao?.slice(0, 4) ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TabelaAmericaLatinaInterativa({
  paises,
}: {
  paises: readonly Pais[];
}) {
  const [busca, setBusca] = useState("");
  const [subRegiaoFiltro, setSubRegiaoFiltro] = useState("Todas");
  const [ordenarPor, setOrdenarPor] = useState<"nome" | "populacao" | "idh">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const subRegioes = useMemo(() => {
    return Array.from(new Set(paises.map((p) => p.subRegiao))).sort();
  }, [paises]);

  const paisesFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return paises
      .filter((p) => filtrarPaisAmericaLatina(p, subRegiaoFiltro, termo))
      .sort((a, b) => compararPaisesAmericaLatina(a, b, ordenarPor, direcao));
  }, [paises, subRegiaoFiltro, busca, ordenarPor, direcao]);

  function alternarOrdenacao(coluna: "nome" | "populacao" | "idh") {
    if (ordenarPor === coluna) {
      setDirecao((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(coluna);
      setDirecao("asc");
    }
  }

  return (
    <div className="mb-10 space-y-4">
      <BarraFiltrosAmericaLatina
        busca={busca}
        setBusca={setBusca}
        subRegiaoFiltro={subRegiaoFiltro}
        setSubRegiaoFiltro={setSubRegiaoFiltro}
        subRegioes={subRegioes}
        totalPaises={paises.length}
        paisesFiltrados={paisesFiltrados}
      />
      <GradeTabelaAmericaLatina
        paises={paisesFiltrados}
        onAlternarOrdenacao={alternarOrdenacao}
      />
    </div>
  );
}
