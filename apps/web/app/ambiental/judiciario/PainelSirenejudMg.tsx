"use client";

import { useEffect, useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import type { MunicipioSirenejud, SirenejudMg } from "@/lib/ambiental/sirenejud-dados";

/**
 * Tabela município a município dos processos ambientais (SIRENEJud/CNJ).
 *
 * Componente de CLIENTE pelo mesmo motivo de PainelTac: a lista (~850
 * municípios) vai como asset estático (`/data/sirenejud-mg.json`) e não como
 * props — coleção grande nunca entra no bundle do Worker.
 *
 * Contém as três coisas que a regra de página com lista grande exige aqui:
 * filtro (município e tribunal), ordenação por coluna e CSV do FILTRADO
 * (separador `;` + BOM UTF-8, senão o Excel brasileiro quebra o acento).
 */

let cacheDados: Promise<SirenejudMg> | null = null;

function buscarDados(): Promise<SirenejudMg> {
  if (!cacheDados) {
    cacheDados = fetch("/data/sirenejud-mg.json").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<SirenejudMg>;
    });
  }
  return cacheDados;
}

type Coluna = "municipio" | "total" | "pendentes" | "baixados" | "tempo";

const COLUNAS: { id: Coluna; rotulo: string }[] = [
  { id: "municipio", rotulo: "Município" },
  { id: "total", rotulo: "Processos" },
  { id: "pendentes", rotulo: "Pendentes" },
  { id: "baixados", rotulo: "Baixados" },
  { id: "tempo", rotulo: "Tempo médio (dias)" },
];

const POR_PAGINA = 40;

function paraCsv(linhas: MunicipioSirenejud[]): string {
  const cab = "municipio;cod_ibge;processos;pendentes;baixados;tempo_medio_dias";
  const corpo = linhas.map((m) =>
    [
      (m.municipio ?? "").replace(/;/g, ","),
      m.cod_ibge,
      m.total,
      m.pendentes,
      m.baixados,
      m.tempo_medio_dias ?? "",
    ].join(";"),
  );
  return [cab, ...corpo].join("\n");
}

export default function PainelSirenejudMg() {
  const [dados, setDados] = useState<SirenejudMg | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [coluna, setColuna] = useState<Coluna>("total");
  const [desc, setDesc] = useState(true);
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  useEffect(() => {
    let vivo = true;
    buscarDados()
      .then((d) => vivo && setDados(d))
      .catch(() => vivo && setErro(true));
    return () => {
      vivo = false;
    };
  }, []);

  const tribunais = useMemo(() => {
    if (!dados) return [];
    const conjunto = new Set<string>();
    for (const m of dados.municipios) {
      for (const t of Object.keys(m.por_tribunal)) conjunto.add(t);
    }
    return [...conjunto].sort();
  }, [dados]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const termo = busca.trim() ? semAcento(busca.trim()) : "";
    const lista = dados.municipios.filter((m) => {
      if (tribunal && !(m.por_tribunal[tribunal] > 0)) return false;
      if (!termo) return true;
      return m.municipio ? semAcento(m.municipio).includes(termo) : false;
    });
    const fator = desc ? -1 : 1;
    return lista.sort((a, b) => {
      switch (coluna) {
        case "municipio":
          return fator * (a.municipio ?? "").localeCompare(b.municipio ?? "", "pt-BR");
        case "tempo":
          return fator * ((a.tempo_medio_dias ?? -1) - (b.tempo_medio_dias ?? -1));
        default:
          return fator * (a[coluna] - b[coluna]);
      }
    });
  }, [dados, busca, tribunal, coluna, desc]);

  if (erro) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
        Não consegui carregar o agregado de municípios. Os totais acima, que vêm do
        build, continuam valendo.
      </p>
    );
  }
  if (!dados) {
    return <p className="py-6 text-center text-[.92em] text-text-soft">Carregando municípios…</p>;
  }

  const visiveis = filtrados.slice(0, mostrando);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["﻿" + paraCsv(filtrados)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sirenejud-mg-municipios-${hoje}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface-2 p-4">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">Buscar município</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            placeholder="ex.: Brumadinho, Belo Horizonte"
            aria-label="Buscar município"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Tribunal</span>
          <select
            value={tribunal}
            onChange={(e) => {
              setTribunal(e.target.value);
              setMostrando(POR_PAGINA);
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="">Todos</option>
            {tribunais.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtrados.length)}{" "}
          {filtrados.length === 1 ? "município" : "municípios"} de{" "}
          {formatNumberBR(dados.municipios.length)} com processos
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filtrados.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtrados.length)})
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum município com esses filtros. Vazio aqui é resposta da busca — não
          quer dizer que o município não tem processo ambiental.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left">
                {COLUNAS.map((c) => (
                  <th key={c.id} className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (coluna === c.id) setDesc(!desc);
                        else {
                          setColuna(c.id);
                          setDesc(c.id !== "municipio");
                        }
                      }}
                      className="font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2"
                      aria-sort={coluna === c.id ? (desc ? "descending" : "ascending") : undefined}
                    >
                      {c.rotulo}
                      {coluna === c.id ? (desc ? " ↓" : " ↑") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => (
                <tr key={m.cod_ibge} className="border-b border-border/50">
                  <td className="py-2 pr-3">
                    {m.municipio ?? `(IBGE ${m.cod_ibge})`}
                  </td>
                  <td className="py-2 pr-3 text-right">{formatNumberBR(m.total)}</td>
                  <td className="py-2 pr-3 text-right">{formatNumberBR(m.pendentes)}</td>
                  <td className="py-2 pr-3 text-right">{formatNumberBR(m.baixados)}</td>
                  <td className="py-2 text-right">
                    {m.tempo_medio_dias !== null ? formatNumberBR(m.tempo_medio_dias) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrando < filtrados.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border bg-surface px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtrados.length - mostrando))} de{" "}
          {formatNumberBR(filtrados.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
