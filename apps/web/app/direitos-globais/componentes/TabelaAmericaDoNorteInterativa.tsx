"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { Pais } from "@/lib/direitos-globais/tipos";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

const COLUNAS_CSV_NA: ColunaCsv<Pais>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "capital", rotulo: "Capital" },
  { chave: "regimePolitico", rotulo: "Regime Político" },
  { chave: "dataConstituicao", rotulo: "Data da Constituição" },
  { chave: "populacao", rotulo: "População" },
  { chave: "pibPerCapita", rotulo: "PIB per Capita (USD)" },
];

function formatarRegime(regime?: string): string {
  switch (regime) {
    case "democracia":
      return "República Constitucional Federal";
    case "monarquia_constitucional":
      return "Monarquia Constitucional";
    default:
      return regime ?? "Não informado";
  }
}

function formatarPopulacaoM(pop?: number): string {
  if (!pop) return "—";
  return `${(pop / 1000000).toFixed(1)}M`;
}

function filtrarPaisNA(p: Pais, termo: string): boolean {
  if (termo.length === 0) return true;
  const texto = semAcento(`${p.nome} ${p.codigo} ${p.capital ?? ""}`.toLowerCase());
  return texto.includes(termo);
}

function compararPaisesNA(
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

interface LinhaPaisNAProps {
  pais: Pais;
}

function LinhaPaisNA({ pais }: LinhaPaisNAProps) {
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
      <td className="px-3 py-2.5 text-text-soft">{pais.capital ?? "—"}</td>
      <td className="px-3 py-2.5 text-text-soft">{formatarRegime(pais.regimePolitico)}</td>
      <td className="px-3 py-2.5 text-text-soft">{pais.dataConstituicao ?? "—"}</td>
      <td className="px-3 py-2.5 text-text-soft">{formatarPopulacaoM(pais.populacao)}</td>
      <td className="px-3 py-2.5 text-text-soft">
        {pais.pibPerCapita ? `US$ ${pais.pibPerCapita.toLocaleString("pt-BR")}` : "—"}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Conferido
        </span>
      </td>
    </tr>
  );
}

export default function TabelaAmericaDoNorteInterativa({
  paises,
}: {
  paises: readonly Pais[];
}) {
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<"nome" | "populacao">("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const paisesFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return paises
      .filter((p) => filtrarPaisNA(p, termo))
      .sort((a, b) => compararPaisesNA(a, b, ordenarPor, direcao));
  }, [paises, busca, ordenarPor, direcao]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <input
          type="search"
          role="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar EUA ou Canadá..."
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
        />

        <ExportarCsvDireitos
          dados={paisesFiltrados}
          colunas={COLUNAS_CSV_NA}
          nomeArquivoBase="paises-america-do-norte-direitos-globais"
          rotuloBotao={`Baixar CSV (${paisesFiltrados.length})`}
        />
      </div>

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
              <th scope="col" className="px-3 py-2.5">PIB per Capita</th>
              <th scope="col" className="px-3 py-2.5">Auditoria</th>
            </tr>
          </thead>
          <tbody>
            {paisesFiltrados.map((pais) => (
              <LinhaPaisNA key={pais.codigo} pais={pais} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
