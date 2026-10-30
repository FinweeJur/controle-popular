"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle, Clock } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { PaisEuropeu } from "@/lib/direitos-globais/europa/paises";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_EUROPA: ColunaCsv<PaisEuropeu>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "capital", rotulo: "Capital" },
  { chave: "regimePolitico", rotulo: "Regime Político" },
  { chave: "dataConstituicao", rotulo: "Data da Constituição" },
  { chave: "leva", rotulo: "Leva Prioritária" },
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

function filtrarPaisEuropa(
  p: PaisEuropeu,
  filtroLeva: string,
  subRegiao: string,
  termo: string
): boolean {
  if (filtroLeva === "1" && p.leva !== 1) return false;
  if (filtroLeva === "coleta" && p.leva === 1) return false;
  if (subRegiao !== "Todas" && p.subRegiao !== subRegiao) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(`${p.nome} ${p.codigo} ${p.capital ?? ""}`.toLowerCase());
  return texto.includes(termo);
}

function compararPaisesEuropa(
  a: PaisEuropeu,
  b: PaisEuropeu,
  ordenarPor: "nome" | "subRegiao",
  direcao: "asc" | "desc"
): number {
  const campoA = ordenarPor === "nome" ? a.nome : a.subRegiao;
  const campoB = ordenarPor === "nome" ? b.nome : b.subRegiao;
  const cmp = campoA.localeCompare(campoB, "pt-BR");
  return direcao === "asc" ? cmp : -cmp;
}

interface BarraFiltrosEuropaProps {
  busca: string;
  setBusca: (v: string) => void;
  levaFiltro: string;
  setLevaFiltro: (v: string) => void;
  subRegiaoFiltro: string;
  setSubRegiaoFiltro: (v: string) => void;
  subRegioes: string[];
  paisesFiltrados: PaisEuropeu[];
}

function BarraFiltrosEuropa({
  busca,
  setBusca,
  levaFiltro,
  setLevaFiltro,
  subRegiaoFiltro,
  setSubRegiaoFiltro,
  subRegioes,
  paisesFiltrados,
}: BarraFiltrosEuropaProps) {
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
          <option value="Todas">Todos os Países (44)</option>
          <option value="1">Leva 1 (12 com dispositivos)</option>
          <option value="coleta">Em coleta de dispositivos (32)</option>
        </select>

        <select
          value={subRegiaoFiltro}
          onChange={(e) => setSubRegiaoFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por sub-região"
        >
          <option value="Todas">Todas as Sub-Regiões</option>
          {subRegioes.map((sr) => (
            <option key={sr} value={sr}>
              {sr}
            </option>
          ))}
        </select>
      </div>

      <ExportarCsvDireitos
        dados={paisesFiltrados}
        colunas={COLUNAS_CSV_EUROPA}
        nomeArquivoBase="paises-europa-direitos-globais"
        rotuloBotao={`Baixar CSV (${paisesFiltrados.length})`}
      />
    </div>
  );
}

interface LinhaPaisProps {
  pais: PaisEuropeu;
}

function LinhaPaisEuropa({ pais }: LinhaPaisProps) {
  return (
    <tr className="border-b border-border/50 hover:bg-surface-2/50">
      <td className="px-3 py-2.5 font-medium text-text">
        <div className="flex items-center gap-2">
          <span>{pais.nome}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-text-soft">
            {pais.codigo}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-text-soft">{pais.subRegiao}</td>
      <td className="px-3 py-2.5 text-text-soft">{pais.capital ?? "—"}</td>
      <td className="px-3 py-2.5 text-text-soft">{formatarRegime(pais.regimePolitico)}</td>
      <td className="px-3 py-2.5 text-text-soft">{pais.dataConstituicao ?? "—"}</td>
      <td className="px-3 py-2.5">
        {pais.leva === 1 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Leva 1 (Conferido)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Em Coleta
          </span>
        )}
      </td>
    </tr>
  );
}

export default function TabelaEuropaInterativa({
  paises,
}: {
  paises: readonly PaisEuropeu[];
}) {
  const [busca, setBusca] = useState("");
  const [levaFiltro, setLevaFiltro] = useState("Todas");
  const [subRegiaoFiltro, setSubRegiaoFiltro] = useState("Todas");
  const [ordenarPor, setOrdenarPor] = useState<"nome" | "subRegiao">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const subRegioes = useMemo(() => {
    return Array.from(new Set(paises.map((p) => p.subRegiao))).sort();
  }, [paises]);

  const paisesFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return paises
      .filter((p) => filtrarPaisEuropa(p, levaFiltro, subRegiaoFiltro, termo))
      .sort((a, b) => compararPaisesEuropa(a, b, ordenarPor, direcao));
  }, [paises, busca, levaFiltro, subRegiaoFiltro, ordenarPor, direcao]);

  function alternarOrdem(coluna: "nome" | "subRegiao") {
    if (ordenarPor === coluna) {
      setDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(coluna);
      setDirecao("asc");
    }
  }

  return (
    <div className="space-y-4">
      <BarraFiltrosEuropa
        busca={busca}
        setBusca={setBusca}
        levaFiltro={levaFiltro}
        setLevaFiltro={setLevaFiltro}
        subRegiaoFiltro={subRegiaoFiltro}
        setSubRegiaoFiltro={setSubRegiaoFiltro}
        subRegioes={subRegioes}
        paisesFiltrados={paisesFiltrados}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-2 text-text font-semibold">
            <tr>
              <th scope="col" className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => alternarOrdem("nome")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  País
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => alternarOrdem("subRegiao")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Sub-Região
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5">Capital</th>
              <th scope="col" className="px-3 py-2.5">Regime Político</th>
              <th scope="col" className="px-3 py-2.5">Constituição</th>
              <th scope="col" className="px-3 py-2.5">Dispositivos</th>
            </tr>
          </thead>
          <tbody>
            {paisesFiltrados.map((pais) => (
              <LinhaPaisEuropa key={pais.codigo} pais={pais} />
            ))}
            {paisesFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-soft">
                  Nenhum país encontrado para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
