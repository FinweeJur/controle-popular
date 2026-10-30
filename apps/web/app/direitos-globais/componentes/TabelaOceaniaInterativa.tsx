"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle, Clock } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { Pais } from "@/lib/direitos-globais/tipos";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_OCEANIA: ColunaCsv<Pais>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "capital", rotulo: "Capital" },
  { chave: "regimePolitico", rotulo: "Regime Político" },
  { chave: "dataConstituicao", rotulo: "Data da Constituição" },
  { chave: "populacao", rotulo: "População" },
];

function formatarRegime(regime?: string): string {
  switch (regime) {
    case "democracia":
      return "Democracia Parlamentar";
    case "monarquia_constitucional":
      return "Monarquia Constitucional";
    case "autoritario":
      return "Autoritário";
    default:
      return regime ?? "Não informado";
  }
}

function formatarPopulacao(pop?: number): string {
  if (!pop) return "—";
  if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
  return `${(pop / 1000).toFixed(0)} mil`;
}

const PAISES_DISPOSITIVOS_OCEANIA = new Set([
  "Austrália",
  "Nova Zelândia",
  "Fiji",
  "Papua-Nova Guiné",
  "Vanuatu",
  "Palau",
  "Tuvalu",
  "Kiribati",
]);

function filtrarPaisOceania(
  p: Pais,
  subRegiao: string,
  statusFiltro: string,
  termo: string
): boolean {
  const temDispositivo = PAISES_DISPOSITIVOS_OCEANIA.has(p.nome);
  if (statusFiltro === "conferido" && !temDispositivo) return false;
  if (statusFiltro === "coleta" && temDispositivo) return false;
  if (subRegiao !== "Todas" && p.subRegiao !== subRegiao) return false;
  if (termo.length === 0) return true;
  const texto = semAcento(`${p.nome} ${p.codigo} ${p.capital ?? ""}`.toLowerCase());
  return texto.includes(termo);
}

function compararPaisesOceania(
  a: Pais,
  b: Pais,
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

interface BarraFiltrosOceaniaProps {
  busca: string;
  setBusca: (v: string) => void;
  statusFiltro: string;
  setStatusFiltro: (v: string) => void;
  subRegiaoFiltro: string;
  setSubRegiaoFiltro: (v: string) => void;
  subRegioes: string[];
  paisesFiltrados: Pais[];
}

function BarraFiltrosOceania({
  busca,
  setBusca,
  statusFiltro,
  setStatusFiltro,
  subRegiaoFiltro,
  setSubRegiaoFiltro,
  subRegioes,
  paisesFiltrados,
}: BarraFiltrosOceaniaProps) {
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
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por status documental"
        >
          <option value="Todos">Todos os 14 Países</option>
          <option value="conferido">8 Países com dispositivos transcritos</option>
          <option value="coleta">6 Países em catalogação de lacuna</option>
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
        colunas={COLUNAS_CSV_OCEANIA}
        nomeArquivoBase="paises-oceania-direitos-globais"
        rotuloBotao={`Baixar CSV (${paisesFiltrados.length})`}
      />
    </div>
  );
}

interface LinhaPaisOceaniaProps {
  pais: Pais;
}

function LinhaPaisOceania({ pais }: LinhaPaisOceaniaProps) {
  const temDispositivo = PAISES_DISPOSITIVOS_OCEANIA.has(pais.nome);

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
      <td className="px-3 py-2.5 text-text-soft">{formatarPopulacao(pais.populacao)}</td>
      <td className="px-3 py-2.5">
        {temDispositivo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Conferido
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

export default function TabelaOceaniaInterativa({
  paises,
}: {
  paises: readonly Pais[];
}) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [subRegiaoFiltro, setSubRegiaoFiltro] = useState("Todas");
  const [ordenarPor, setOrdenarPor] = useState<"nome" | "populacao">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const subRegioes = useMemo(() => {
    return Array.from(new Set(paises.map((p) => p.subRegiao))).sort();
  }, [paises]);

  const paisesFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return paises
      .filter((p) => filtrarPaisOceania(p, subRegiaoFiltro, statusFiltro, termo))
      .sort((a, b) => compararPaisesOceania(a, b, ordenarPor, direcao));
  }, [paises, busca, subRegiaoFiltro, statusFiltro, ordenarPor, direcao]);

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
      <BarraFiltrosOceania
        busca={busca}
        setBusca={setBusca}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
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
              <th scope="col" className="px-3 py-2.5">Sub-Região</th>
              <th scope="col" className="px-3 py-2.5">Capital</th>
              <th scope="col" className="px-3 py-2.5">Regime Político</th>
              <th scope="col" className="px-3 py-2.5">Constituição</th>
              <th scope="col" className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => alternarOrdem("populacao")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  População
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="px-3 py-2.5">Dispositivos</th>
            </tr>
          </thead>
          <tbody>
            {paisesFiltrados.map((pais) => (
              <LinhaPaisOceania key={pais.codigo} pais={pais} />
            ))}
            {paisesFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-text-soft">
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
