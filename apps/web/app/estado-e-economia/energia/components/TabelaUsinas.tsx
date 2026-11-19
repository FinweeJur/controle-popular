"use client";

import { useMemo, useState } from "react";

import {
  csvDeUsinas,
  filtrarUsinas,
  formatarDataIso,
  formatarNumero,
  nomeArquivoUsinas,
  ordenarUsinasPorPotencia,
  rotuloTipo,
  type UsinaLinha,
} from "@/lib/energia/pagina";

/**
 * Tabela das 300 usinas outorgadas em Minas — busca, filtro, ordenação e CSV.
 *
 * O componente recebe só o recorte necessário (`UsinaLinha`, achatado no
 * servidor): o JSON do SIGA tem 160 KB e dezenas de campos que a tela não usa.
 *
 * Decisões:
 * - busca sem acento e por várias palavras (nome, CEG e municípios);
 * - filtros de tipo e fase a partir do dado real, não de lista fixa que
 *   envelhece;
 * - CSV do que está filtrado na tela, com BOM UTF-8 e `;` — abre no Excel
 *   brasileiro sem passar pelo assistente de importação;
 * - potência é OUTORGADA, não medida: o rodapé da seção diz isso, e a coluna
 *   não promete geração.
 */

interface Props {
  usinas: UsinaLinha[];
}

type Direcao = "asc" | "desc";

export default function TabelaUsinas({ usinas }: Props) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [fase, setFase] = useState("todas");
  const [direcao, setDirecao] = useState<Direcao>("desc");

  const tipos = useMemo(
    () => [...new Set(usinas.map((u) => u.tipo))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [usinas],
  );
  const fases = useMemo(
    () => [...new Set(usinas.map((u) => u.fase))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [usinas],
  );

  const filtro = useMemo(
    () => ({
      busca,
      tipo: tipo === "todos" ? undefined : tipo,
      fase: fase === "todas" ? undefined : fase,
    }),
    [busca, tipo, fase],
  );

  const resultado = useMemo(
    () => ordenarUsinasPorPotencia(filtrarUsinas(usinas, filtro), direcao),
    [usinas, filtro, direcao],
  );

  function baixarCsv() {
    const csv = csvDeUsinas(resultado);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivoUsinas({ tipo: filtro.tipo, fase: filtro.fase });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const filtroAtivo = busca.trim() !== "" || tipo !== "todos" || fase !== "todas";
  const potenciakwVisivel = resultado.reduce((soma, u) => soma + u.potenciaKw, 0);

  return (
    <div className="mt-4">
      {/* controles — não vão para a impressão */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="busca-usinas" className="block text-xs font-semibold text-text-soft">
            Buscar por usina, CEG ou município
          </label>
          <input
            id="busca-usinas"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="ex.: Itumbiara, Icém, UHE.PH.MG"
            className="mt-1 min-h-9 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>

        <div>
          <label htmlFor="tipo-usinas" className="block text-xs font-semibold text-text-soft">
            Tipo de geração
          </label>
          <select
            id="tipo-usinas"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-auto"
          >
            <option value="todos">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {rotuloTipo(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fase-usinas" className="block text-xs font-semibold text-text-soft">
            Fase no SIGA
          </label>
          <select
            id="fase-usinas"
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-auto"
          >
            <option value="todas">Todas as fases</option>
            {fases.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setDirecao((d) => (d === "desc" ? "asc" : "desc"))}
          aria-label={`Ordenar por potência, ${direcao === "desc" ? "do maior para o menor" : "do menor para o maior"}`}
          className="min-h-9 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Potência: {direcao === "desc" ? "maior primeiro ↓" : "menor primeiro ↑"}
        </button>

        <button
          type="button"
          onClick={baixarCsv}
          className="min-h-9 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Baixar CSV ({formatarNumero(resultado.length)})
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-9 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Imprimir
        </button>
      </div>

      <p className="mt-3 text-sm text-text-soft" aria-live="polite">
        {formatarNumero(resultado.length)} de {formatarNumero(usinas.length)} usinas
        {filtroAtivo ? " no filtro atual" : " no recorte publicado"} ·{" "}
        {formatarNumero(Math.round(potenciakwVisivel / 1000))} MW outorgados
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <p className="mb-1 px-1 text-xs text-text-soft sm:hidden">
          ← deslize para ver mais colunas →
        </p>
        <table className="w-full min-w-[840px] text-sm">
          <caption className="sr-only">
            As 300 maiores usinas de geração de Minas Gerais por potência outorgada, no SIGA/ANEEL.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Pos.
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Usina
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Tipo
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Fase
              </th>
              <th
                scope="col"
                aria-sort={direcao === "asc" ? "ascending" : "descending"}
                className="border-b border-border bg-surface px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                <button
                  type="button"
                  onClick={() => setDirecao((d) => (d === "desc" ? "asc" : "desc"))}
                  className="inline-flex min-h-9 items-center gap-1 font-semibold uppercase tracking-wide hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Potência (MW)
                  <span aria-hidden="true">{direcao === "asc" ? "▲" : "▼"}</span>
                </button>
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Municípios
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Outorga
              </th>
              <th
                scope="col"
                className="border-b border-border bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-soft"
              >
                Fim da outorga
              </th>
            </tr>
          </thead>
          <tbody>
            {resultado.map((u) => (
              <tr key={u.ceg} className="align-top">
                <td className="border-b border-border px-3 py-2 text-right font-tabular text-text-soft">
                  {u.posicao}
                </td>
                <td className="border-b border-border px-3 py-2 text-left">
                  <span className="font-semibold text-text">{u.nome}</span>
                  <span className="mt-0.5 block font-tabular text-xs text-text-soft">{u.ceg}</span>
                </td>
                <td className="border-b border-border px-3 py-2 text-left text-text-soft">
                  {u.tipo}
                </td>
                <td className="border-b border-border px-3 py-2 text-left text-text-soft">
                  {u.fase}
                </td>
                <td className="border-b border-border px-3 py-2 text-right font-tabular text-text">
                  {formatarNumero(Math.round(u.potenciaKw / 1000))}
                </td>
                <td className="border-b border-border px-3 py-2 text-left text-text-soft">
                  {u.municipios.join(", ")}
                </td>
                <td className="border-b border-border px-3 py-2 text-left text-text-soft">
                  {u.outorga ?? "—"}
                </td>
                <td className="border-b border-border px-3 py-2 text-left font-tabular text-text-soft">
                  {formatarDataIso(u.fimVigencia)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resultado.length === 0 && (
        <p className="mt-3 text-sm text-text-soft">
          Nenhuma usina corresponde a “{busca}”. A busca cobre as 300 usinas publicadas —
          resultado definitivo, não parcial.{" "}
          {filtroAtivo && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setTipo("todos");
                setFase("todas");
              }}
              className="underline hover:text-text"
            >
              Limpar filtros
            </button>
          )}
        </p>
      )}
    </div>
  );
}
