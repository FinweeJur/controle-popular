"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import type { PatrimonioTombadoRow, CategoriaPatrimonioTombado } from "@/lib/db/queries/patrimonio-tombado";
import {
  CATEGORIA_LABEL,
  contarPorCategoria,
  filtrarPatrimonio,
  municipiosDistintos,
} from "@/lib/ambiental/patrimonio-tombado";
import { ordenarPor, type Direcao } from "@/lib/tabela/ordenar";

/**
 * Busca de `/ambiental/patrimonio-cultural` — 153 bens tombados por Minas
 * Gerais (IEPHA-MG, migration `0072`). Mesmo padrão de filtro-no-cliente de
 * `BuscaLegislacaoUnificada.tsx` (corpus pequeno, sem `searchParams`).
 *
 * ═══ ORDENAÇÃO E CSV (2026-08-21, regra do dono: "cinco coisas") ═══
 *
 * `ordenarPor` é a mesma função pura testada em `lib/tabela/ordenar.test.ts`
 * — nenhuma comparação nova é reimplementada aqui. "Categoria" é a ordenação
 * por tipo pedida explicitamente pelo dono; as outras (município, denominação,
 * processo/ano) existem porque uma lista com uma coluna só ordenável seria a
 * mesma limitação que a regra veio corrigir.
 *
 * O CSV segue o mesmo contrato de `TabelaDecisoes.tsx`
 * (`/ambiental/decisoes-lai`): separador `;`, BOM UTF-8 na frente (senão o
 * Excel brasileiro abre tudo numa coluna só e quebra acento), e exporta
 * `ordenados` — o que está FILTRADO e na ORDEM em que a tela mostra, nunca
 * os 153 bens inteiros.
 */

const CATEGORIA_ORDEM: CategoriaPatrimonioTombado[] = ["BI", "CP", "CH", "BM"];

type OrdemChave = "" | "categoria" | "municipio" | "denominacao" | "processoAno";

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: PatrimonioTombadoRow[]): string {
  const BOM = "﻿";
  const cabecalho = [
    "processo_ano",
    "categoria",
    "denominacao",
    "denominacao_completa",
    "classe_subclasse",
    "municipio",
    "distrito",
    "ato_legal",
    "livro_de_tombo",
  ].join(";");
  const corpo = linhas.map((r) =>
    [
      r.processoAno,
      CATEGORIA_LABEL[r.categoria],
      r.denominacao,
      r.denominacaoCompleta,
      r.classeSubclasse ?? "",
      r.municipio,
      r.distrito ?? "",
      r.atoLegal ?? "",
      r.livroDeTombo ?? "",
    ]
      .map(csvEscape)
      .join(";"),
  );
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface Props {
  linhas: PatrimonioTombadoRow[];
}

export default function BuscaPatrimonioTombado({ linhas }: Props) {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<CategoriaPatrimonioTombado | "">("");
  const [municipio, setMunicipio] = useState("");
  const [ordemChave, setOrdemChave] = useState<OrdemChave>("");
  const [ordemDirecao, setOrdemDirecao] = useState<Direcao>("asc");

  const municipios = useMemo(() => municipiosDistintos(linhas), [linhas]);
  const termoNormalizado = semAcento(q.trim());

  const filtrados = useMemo(
    () => filtrarPatrimonio(linhas, { termoNormalizado, categoria, municipio }, semAcento),
    [linhas, termoNormalizado, categoria, municipio]
  );

  // Ordenação por coluna (regra do dono, 2026-08-21) — "" mantém a ordem que
  // já vem da fonte (município, decrescente — ver `listarPatrimonioTombado`).
  const ordenados = useMemo(() => {
    if (!ordemChave) return filtrados;
    return ordenarPor(filtrados, ordemChave, ordemDirecao, "texto");
  }, [filtrados, ordemChave, ordemDirecao]);

  const contagemCategoria = useMemo(() => contarPorCategoria(linhas), [linhas]);
  const temFiltro = Boolean(q || categoria || municipio);

  function limpar() {
    setQ("");
    setCategoria("");
    setMunicipio("");
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(ordenados), `patrimonio-cultural-tombado-mg-${hoje}.csv`);
  }

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="flex min-w-[220px] flex-1 flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Palavra-chave
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ex.: igreja, casarão, praça..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="municipio" className="mb-1 text-xs font-medium text-text-soft">
            Município
          </label>
          <select
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {temFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="cursor-pointer pb-1.5 text-sm text-text-soft hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-soft">Categoria:</span>
        {CATEGORIA_ORDEM.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoria((atual) => (atual === c ? "" : c))}
            aria-pressed={categoria === c}
            className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              categoria === c
                ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                : { borderColor: "var(--border)", color: "var(--color-text-soft, inherit)" }
            }
          >
            {CATEGORIA_LABEL[c]} ({formatNumberBR(contagemCategoria[c])})
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-text-soft" role="status">
          <strong className="font-tabular text-text">{formatNumberBR(filtrados.length)}</strong>{" "}
          {filtrados.length === 1 ? "bem encontrado" : "bens encontrados"}
          {temFiltro ? " com este filtro" : ""} — de {formatNumberBR(linhas.length)} tombados ao todo.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-text-soft">Ordenar por</span>
            <select
              value={ordemChave}
              onChange={(e) => setOrdemChave(e.target.value as OrdemChave)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Como veio da fonte</option>
              <option value="categoria">Categoria (tipo)</option>
              <option value="municipio">Município</option>
              <option value="denominacao">Denominação</option>
              <option value="processoAno">Processo/ano</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setOrdemDirecao((d) => (d === "asc" ? "desc" : "asc"))}
            disabled={!ordemChave}
            aria-label={ordemDirecao === "asc" ? "Ordem crescente — alternar para decrescente" : "Ordem decrescente — alternar para crescente"}
            title={ordemDirecao === "asc" ? "Ordem crescente" : "Ordem decrescente"}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-40"
          >
            {ordemDirecao === "asc" ? "A→Z" : "Z→A"}
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={filtrados.length === 0}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:border-primary disabled:opacity-50"
          >
            Baixar CSV do filtrado ({formatNumberBR(filtrados.length)})
          </button>
        </div>
      </div>

      {ordenados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhum bem para esse filtro.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {ordenados.map((r) => (
            <li key={`${r.processoAno}-${r.denominacao}`} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-text-soft">
                    {CATEGORIA_LABEL[r.categoria]}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                    {r.municipio}
                  </span>
                </div>
                <span className="font-tabular text-xs text-text-soft">{r.processoAno}</span>
              </div>

              <p className="mt-2 font-medium text-text">{r.denominacao}</p>
              {r.denominacaoCompleta !== r.denominacao && (
                <p className="mt-0.5 text-sm text-text-soft">{r.denominacaoCompleta}</p>
              )}
              {r.classeSubclasse && <p className="mt-1 text-sm text-text-soft">{r.classeSubclasse}</p>}
              {r.atoLegal && (
                <p className="mt-2 text-xs text-text-soft">
                  <span className="font-medium text-text">Ato de tombamento: </span>
                  {r.atoLegal}
                  {r.livroDeTombo ? ` — Livro do Tombo ${r.livroDeTombo}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
