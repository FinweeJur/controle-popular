"use client";

import { useMemo, useState } from "react";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import { SERIE_JN_TJMG, JN_META, type AnoJusticaEmNumeros } from "@/lib/judiciario/justica-em-numeros";

/**
 * Os 17 anos da série, um a um: filtra por intervalo de ano, ordena por
 * qualquer coluna e exporta CSV do filtrado — as cinco coisas (`AGENTS.md`).
 *
 * ═══ POR QUE É COMPONENTE SEPARADO, E NÃO TUDO EM `page.tsx` ═══
 *
 * `page.tsx` exporta `metadata` via `metadataEditavel` — isso exige que o
 * módulo seja Componente de Servidor. Ordenar/filtrar exige `useState`, que
 * só roda em Componente de Cliente. Next.js não deixa as duas coisas
 * convivirem no mesmo arquivo (a diretiva `"use client"` é de módulo
 * inteiro, e um arquivo com ela não pode exportar `metadata`). Por isso a
 * tabela mora aqui, no mesmo molde de `TabelaAchados.tsx`
 * (`/judiciario/inspecoes`).
 *
 * ═══ A UNIDADE DE `tempoAteBaixa` NÃO ESTÁ CONFIRMADA ═══
 *
 * Repetido aqui porque a tabela é o lugar em que alguém pode copiar o
 * número sem ler o resto da página: o cabeçalho da coluna já carrega o
 * aviso, e a nota de rodapé também.
 */

const TODOS = "";

interface ColunaDef {
  chave: keyof AnoJusticaEmNumeros;
  rotulo: string;
  tipo: TipoCampo;
}

const COLUNAS: ColunaDef[] = [
  { chave: "ano", rotulo: "Ano", tipo: "numero" },
  { chave: "congestionamento", rotulo: "Congestionamento", tipo: "numero" },
  { chave: "pendentes", rotulo: "Pendentes", tipo: "numero" },
  { chave: "casosNovosPorMagistrado", rotulo: "Casos novos / magistrado", tipo: "numero" },
  { chave: "baixados", rotulo: "Baixados", tipo: "numero" },
  { chave: "tempoAteBaixa", rotulo: "Tempo até a baixa (unidade não confirmada)", tipo: "numero" },
];

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function fmt1(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtInt(v: number | null): string {
  if (v === null) return "—";
  return formatNumberBR(Math.round(v));
}

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

function paraCsv(linhas: AnoJusticaEmNumeros[]): string {
  const cab = [
    "ano",
    "congestionamento_fracao",
    "pendentes",
    "casos_novos_por_magistrado",
    "baixados",
    "tempo_ate_baixa_unidade_nao_confirmada",
    "fonte",
  ];
  const corpo = linhas.map((l) =>
    [
      l.ano,
      l.congestionamento,
      l.pendentes,
      l.casosNovosPorMagistrado,
      l.baixados,
      l.tempoAteBaixa,
      JN_META.fonte,
    ]
      .map(csvCampo)
      .join(","),
  );
  return [cab.join(","), ...corpo].join("\n");
}

export default function TabelaSerieJN() {
  const anos = useMemo(() => SERIE_JN_TJMG.map((a) => a.ano), []);
  const [anoDe, setAnoDe] = useState(TODOS);
  const [anoAte, setAnoAte] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: keyof AnoJusticaEmNumeros; direcao: Direcao } | null>({
    chave: "ano",
    direcao: "asc",
  });

  const filtradas = useMemo(() => {
    const de = anoDe ? Number(anoDe) : -Infinity;
    const ate = anoAte ? Number(anoAte) : Infinity;
    const base = SERIE_JN_TJMG.filter((l) => l.ano >= de && l.ano <= ate);
    if (!ordem) return base;
    const def = COLUNAS.find((c) => c.chave === ordem.chave);
    return ordenarPor(base, ordem.chave, ordem.direcao, def?.tipo ?? "numero");
  }, [anoDe, anoAte, ordem]);

  function alternarOrdem(chave: keyof AnoJusticaEmNumeros) {
    setOrdem((atual) =>
      atual?.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: "asc" },
    );
  }

  function limpar() {
    setAnoDe(TODOS);
    setAnoAte(TODOS);
  }

  const algumFiltro = !!(anoDe || anoAte);

  return (
    <section aria-labelledby="tabela-serie" className="mt-10">
      <h2 id="tabela-serie" className="font-display text-xl font-bold text-text">
        Os {SERIE_JN_TJMG.length} anos, um a um
      </h2>
      <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
        Cada linha é um ano do Justiça em Números. A coluna de tempo até a baixa só existe a
        partir de 2015 — de 2009 a 2014 ela aparece como <strong className="text-text">—</strong>,
        porque o CNJ não publicou essa variável para anos anteriores.
      </p>

      {/* ═══ FILTRO ═══ */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          De (ano)
          <select
            value={anoDe}
            onChange={(e) => setAnoDe(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>{anos[0]}</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[.82em] text-text-soft">
          Até (ano)
          <select
            value={anoAte}
            onChange={(e) => setAnoAte(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-[1em] text-text"
          >
            <option value={TODOS}>{anos[anos.length - 1]}</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
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
            Limpar filtro
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-[.9em] text-text-soft" aria-live="polite">
          <strong className="text-text">{filtradas.length}</strong> de {SERIE_JN_TJMG.length} anos
        </p>
        <button
          type="button"
          onClick={() =>
            baixarCsv(paraCsv(filtradas), `justica-em-numeros-tjmg-${filtradas.length}-anos.csv`)
          }
          className="rounded-lg border border-primary px-3 py-2 text-[.88em] font-semibold text-primary hover:bg-primary hover:text-surface"
        >
          Baixar CSV do filtrado ({filtradas.length})
        </button>
      </div>

      {/* ═══ TABELA ═══ */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[52em] border-collapse text-left text-[.9em]">
          <thead className="bg-surface-2">
            <tr>
              {COLUNAS.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={String(c.chave)}
                    scope="col"
                    aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
                    className="px-3 py-2 text-right font-semibold text-text"
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
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <tr key={l.ano} className="border-t border-border align-top">
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-text">
                  {l.ano}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                  {fmtPct(l.congestionamento)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                  {fmtInt(l.pendentes)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                  {fmtInt(l.casosNovosPorMagistrado)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                  {fmtInt(l.baixados)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                  {fmt1(l.tempoAteBaixa)}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={COLUNAS.length} className="px-3 py-8 text-center text-text-soft">
                  Nenhum ano nesse intervalo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[.85em] leading-relaxed text-text-soft">
        Congestionamento em percentual; tempo até a baixa com uma casa decimal e{" "}
        <strong className="text-text">unidade não confirmada pelo CNJ</strong> — só é inferência
        deste projeto que seja dias corridos. Dado do{" "}
        <strong className="text-text">Conselho Nacional de Justiça</strong>, não deste portal.{" "}
        <a
          href={JN_META.urlIndice}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          Página de índice do Justiça em Números ↗
        </a>
      </p>
    </section>
  );
}
