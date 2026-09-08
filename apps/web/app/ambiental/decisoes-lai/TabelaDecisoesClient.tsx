"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { ordenarPor, type Direcao } from "@/lib/tabela/ordenar";
import { formatDateBR } from "@/lib/betim/format";

export interface DecisaoItem {
  id: string;
  numeroRecurso: string;
  ano: number;
  orgaoDemandado: string;
  tipoDecisao: string;
  dataDecisao: string;
  relator: string;
  resumoEmenta: string;
}

interface Props {
  decisoes: DecisaoItem[];
}

export default function TabelaDecisoesClient({ decisoes }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroAno, setFiltroAno] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [ordemChave, setOrdemChave] = useState<string>("dataDecisao");
  const [ordemDir, setOrdemDir] = useState<Direcao>("desc");

  const decisoesFiltradas = useMemo(() => {
    let res = decisoes;
    if (filtroAno !== "todos") {
      res = res.filter((d) => d.ano === Number(filtroAno));
    }
    if (filtroTipo !== "todos") {
      res = res.filter((d) => d.tipoDecisao === filtroTipo);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      res = res.filter(
        (d) =>
          d.numeroRecurso.toLowerCase().includes(q) ||
          d.orgaoDemandado.toLowerCase().includes(q) ||
          d.resumoEmenta.toLowerCase().includes(q) ||
          d.relator.toLowerCase().includes(q)
      );
    }
    return ordenarPor(res, ordemChave as keyof DecisaoItem, ordemDir, "texto");
  }, [decisoes, filtroAno, filtroTipo, busca, ordemChave, ordemDir]);

  const alternarOrdem = (chave: string) => {
    if (ordemChave === chave) {
      setOrdemDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdemChave(chave);
      setOrdemDir("asc");
    }
  };

  const exportarPlanilha = () => {
    const colunas: ColunaCsv<DecisaoItem>[] = [
      { chave: "numeroRecurso", rotulo: "Número do Recurso" },
      { chave: "ano", rotulo: "Ano" },
      { chave: "orgaoDemandado", rotulo: "Órgão Recorrido" },
      { chave: "tipoDecisao", rotulo: "Tipo de Decisão" },
      { chave: "dataDecisao", rotulo: "Data da Decisão", formatar: (v) => formatDateBR(v) },
      { chave: "relator", rotulo: "Instância Julgadora" },
      { chave: "resumoEmenta", rotulo: "Resumo da Ementa" },
    ];
    baixarCsv(colunas, decisoesFiltradas, "decisoes-lai-cge-mg");
  };

  const anosDisponiveis = [...new Set(decisoes.map((d) => d.ano))].sort((a, b) => b - a);
  const tiposDisponiveis = [...new Set(decisoes.map((d) => d.tipoDecisao))];

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Exportação */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <p className="text-sm font-medium text-text">
          Mostrando <strong>{decisoesFiltradas.length}</strong> decisões filtradas
        </p>

        {/* Botão de Exportação CSV com BOM UTF-8 */}
        <button
          type="button"
          onClick={exportarPlanilha}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent"
        >
          📥 Baixar Planilha (CSV Filtrado)
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="busca-decisoes" className="mb-1 block text-xs text-text-soft">
            Buscar por termo na ementa ou órgão
          </label>
          <input
            id="busca-decisoes"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex: barragem, SEMAD, outorga..."
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft"
          />
        </div>

        <div>
          <label htmlFor="filtro-ano" className="mb-1 block text-xs text-text-soft">
            Ano da Decisão
          </label>
          <select
            id="filtro-ano"
            value={filtroAno}
            onChange={(e) => setFiltroAno(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="todos">Todos os anos (2020–2026)</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-tipo-dec" className="mb-1 block text-xs text-text-soft">
            Tipo de Decisão
          </label>
          <select
            id="filtro-tipo-dec"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="todos">Todos os tipos de decisão</option>
            {tiposDisponiveis.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Decisões */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs text-text-soft">
            <tr>
              <th
                scope="col"
                onClick={() => alternarOrdem("numeroRecurso")}
                className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
              >
                Recurso {ordemChave === "numeroRecurso" && (ordemDir === "asc" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                onClick={() => alternarOrdem("orgaoDemandado")}
                className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
              >
                Órgão Recorrido {ordemChave === "orgaoDemandado" && (ordemDir === "asc" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                onClick={() => alternarOrdem("tipoDecisao")}
                className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
              >
                Decisão {ordemChave === "tipoDecisao" && (ordemDir === "asc" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                onClick={() => alternarOrdem("dataDecisao")}
                className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
              >
                Data {ordemChave === "dataDecisao" && (ordemDir === "asc" ? "▲" : "▼")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Ementa e Objeto
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {decisoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-soft">
                  Nenhuma decisão encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              decisoesFiltradas.map((dec) => (
                <tr key={dec.id} className="hover:bg-surface-2/40">
                  <td className="px-4 py-3 font-medium text-accent">{dec.numeroRecurso}</td>
                  <td className="px-4 py-3 text-text">
                    <span className="font-medium">{dec.orgaoDemandado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        dec.tipoDecisao.includes("Provimento")
                          ? "bg-primary/10 text-primary"
                          : dec.tipoDecisao === "Não Conhecimento"
                            ? "bg-warning/10 text-warning"
                            : "bg-surface-2 text-text-soft"
                      }`}
                    >
                      {dec.tipoDecisao}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-tabular text-text-soft">
                    {formatDateBR(dec.dataDecisao)}
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs text-text-soft">
                    <p className="line-clamp-3">{dec.resumoEmenta}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
