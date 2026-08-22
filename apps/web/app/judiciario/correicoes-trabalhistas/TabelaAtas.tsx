"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import { ATAS_TRT3, type AtaCorreicao } from "@/lib/judiciario/correicoes-trt3";

/**
 * As 18 atas de correição ordinária no TRT-3, uma a uma: filtra, ordena e
 * exporta CSV do filtrado — as cinco coisas (`AGENTS.md`).
 *
 * ═══ POR QUE HÁ UM CAMPO CALCULADO ═══
 *
 * `assinadaEm` vem no formato d/m/aaaa ("19/2/2024", às vezes sem zero à
 * esquerda) — não é ISO, e `ordenarPor` só reconhece data em ISO (ver o
 * cabeçalho de `lib/tabela/ordenar.ts`). Em vez de ordenar essa coluna como
 * texto (o que juntaria "5/5/1999" perto de "5/5/2010" e separaria de
 * "05/05/…"), esta tabela deriva um `assinadaEmISO` a partir do MESMO valor
 * do módulo — não é dado novo, é o mesmo dado em outro formato.
 */

const TODOS = "";

interface AtaOrdenavel extends AtaCorreicao {
  assinadaEmISO: string | null;
}

function paraISO(data: string): string | null {
  const m = data.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const DADO: AtaOrdenavel[] = ATAS_TRT3.map((a) => ({
  ...a,
  assinadaEmISO: paraISO(a.assinadaEm),
}));

interface ColunaDef {
  chave: keyof AtaOrdenavel;
  rotulo: string;
  tipo: TipoCampo;
  numerica?: boolean;
}

const COLUNAS: ColunaDef[] = [
  { chave: "ano", rotulo: "Ano", tipo: "numero", numerica: true },
  { chave: "corregedor", rotulo: "Corregedor-Geral", tipo: "texto" },
  { chave: "periodo", rotulo: "Período da correição", tipo: "texto" },
  { chave: "assinadaEmISO", rotulo: "Ata assinada em", tipo: "data" },
  { chave: "megabytes", rotulo: "Tamanho do PDF", tipo: "numero", numerica: true },
];

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const BOM = "﻿";
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCampo(v: string | number | null): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function paraCsv(linhas: AtaOrdenavel[]): string {
  const cab = ["ano", "periodo", "assinada_em", "corregedor", "megabytes", "url"];
  const corpo = linhas.map((l) =>
    [l.ano, l.periodo, l.assinadaEm, l.corregedor, l.megabytes, l.url].map(csvCampo).join(","),
  );
  return [cab.join(","), ...corpo].join("\n");
}

function opcoes(vals: string[]): string[] {
  return [...new Set(vals)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function TabelaAtas() {
  const [busca, setBusca] = useState("");
  const [corregedor, setCorregedor] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: keyof AtaOrdenavel; direcao: Direcao } | null>({
    chave: "ano",
    direcao: "desc",
  });

  const listaCorregedores = useMemo(() => opcoes(DADO.map((a) => a.corregedor)), []);

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const base = DADO.filter((a) => {
      if (corregedor && a.corregedor !== corregedor) return false;
      if (!termo) return true;
      return semAcento(`${a.corregedor} ${a.periodo} ${a.ano}`.toLowerCase()).includes(termo);
    });
    if (!ordem) return base;
    const def = COLUNAS.find((c) => c.chave === ordem.chave);
    return ordenarPor(base, ordem.chave, ordem.direcao, def?.tipo ?? "texto");
  }, [busca, corregedor, ordem]);

  function alternarOrdem(chave: keyof AtaOrdenavel) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: "asc" },
    );
  }

  function limpar() {
    setBusca("");
    setCorregedor(TODOS);
  }

  const algumFiltro = !!(busca || corregedor);

  return (
    <section aria-labelledby="tabela-atas" className="mt-10">
      <h2 id="tabela-atas" className="font-display text-xl font-bold text-text">
        As {DADO.length} atas, uma a uma
      </h2>
      <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
        Cada linha é uma correição ordinária registrada pela Corregedoria-Geral da Justiça do
        Trabalho no TRT da 3ª Região. O link de cada linha abre o PDF oficial no site do TST — este
        portal não hospeda cópia.
      </p>

      {/* ═══ FILTROS ═══ */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-[.82em] text-text-soft">
          Buscar por corregedor, ano ou período
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Dora Maria da Costa, 2013, 1999…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          />
        </label>

        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Corregedor-Geral
          <select
            value={corregedor}
            onChange={(e) => setCorregedor(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>Todos</option>
            {listaCorregedores.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        {algumFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-border px-3 py-2 text-[.88em] text-text-soft hover:text-text"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-[.9em] text-text-soft" aria-live="polite">
          <strong className="text-text">{formatNumberBR(filtradas.length)}</strong> de{" "}
          {formatNumberBR(DADO.length)} atas
        </p>
        <button
          type="button"
          onClick={() =>
            baixarCsv(paraCsv(filtradas), `correicoes-trt3-${filtradas.length}-atas.csv`)
          }
          className="rounded-lg border border-primary px-3 py-2 text-[.88em] font-semibold text-primary hover:bg-primary hover:text-surface"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {/* ═══ TABELA ═══ */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[48em] border-collapse text-left text-[.9em]">
          <thead className="bg-surface-2">
            <tr>
              {COLUNAS.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={String(c.chave)}
                    scope="col"
                    aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
                    className={`px-3 py-2 font-semibold text-text ${c.numerica ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdem(c.chave)}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      {c.rotulo}
                      <span aria-hidden="true" className="text-text-soft">
                        {ativa ? (ordem.direcao === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-2 font-semibold text-text">
                PDF
              </th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((a) => (
              <tr key={`${a.ano}-${a.corregedor}`} className="border-t border-border align-top">
                <td className="px-3 py-3 tabular-nums font-semibold text-text">{a.ano}</td>
                <td className="px-3 py-3 text-text">{a.corregedor}</td>
                <td className="px-3 py-3 text-text-soft">{a.periodo}</td>
                <td className="px-3 py-3 text-text-soft">{a.assinadaEm}</td>
                <td className="px-3 py-3 text-right tabular-nums text-text-soft">
                  {formatNumberBR(a.megabytes)} MB
                </td>
                <td className="px-3 py-3">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-accent"
                  >
                    Baixar ↗
                  </a>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length + 1} className="px-3 py-8 text-center text-text-soft">
                  Nenhuma ata com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[.85em] leading-relaxed text-text-soft">
        As atas são da <strong className="text-text">Corregedoria-Geral da Justiça do
        Trabalho</strong>, órgão do TST — não deste portal, e não do CNJ.
      </p>
    </section>
  );
}
