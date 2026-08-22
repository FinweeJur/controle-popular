"use client";

import { useMemo, useState } from "react";
import { BARRAGENS_MPMG, type BarragemMpmg } from "@/lib/ambiental/barragens-mpmg";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * As 45 barragens em descaracterização do MPMG, filtráveis, com exportação
 * em CSV.
 *
 * Componente de CLIENTE por padrão (busca/filtro pedem estado), mas o
 * array é pequeno — 45 registros, ~17 KiB — então nada aqui existe por causa
 * do teto de payload do Worker; é só o mesmo padrão de interação do resto do
 * portal (`ConveniosClient.tsx`, `TabelaFeam.tsx`).
 */

const TODOS = "";
const SEM_MUNICIPIO = "__sem_municipio__";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Decodifica entidades numéricas HTML (ex.: `&#8211;` → "–") que sobraram
 *  do HTML renderizado da fonte — não é reescrever o texto, é mostrar o
 *  mesmo caractere que aparece na página original. */
function decodificarEntidades(texto: string): string {
  return texto.replace(/&#(\d+);/g, (_, codigo: string) => String.fromCharCode(Number(codigo)));
}

function formatarVolume(mil: number): string {
  if (mil >= 1000) {
    const milhoes = mil / 1000;
    return `${milhoes.toLocaleString("pt-BR", { maximumFractionDigits: milhoes < 10 ? 3 : 1 })} milhões de m³`;
  }
  return `${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil m³`;
}

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: BarragemMpmg[]): string {
  const BOM = "﻿";
  const cabecalho = [
    "id",
    "nome",
    "municipio",
    "municipio_bruto",
    "empreendedor",
    "volume_mil_m3",
    "volume_texto",
    "previsao_descaracterizacao",
    "andamento_percentual",
    "andamento_texto",
    "link",
  ].join(";");
  const corpo = linhas.map((b) =>
    [
      b.id,
      b.nome,
      b.municipio ?? "",
      b.municipioBruto ?? "",
      b.empreendedor,
      b.volumeMilM3 ?? "",
      b.volumeTexto ?? "",
      b.previsaoDescaracterizacao,
      b.andamentoPercentual ?? "",
      b.andamentoTexto ?? "",
      b.link,
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

type FiltroSituacao = "todos" | "concluida" | "andamento";

export default function PainelBarragens() {
  const [busca, setBusca] = useState("");
  const [empreendedor, setEmpreendedor] = useState(TODOS);
  const [municipio, setMunicipio] = useState(TODOS);
  const [situacao, setSituacao] = useState<FiltroSituacao>("todos");

  const empreendedores = useMemo(
    () => [...new Set(BARRAGENS_MPMG.map((b) => b.empreendedor))].sort(),
    [],
  );
  const municipios = useMemo(
    () =>
      [...new Set(BARRAGENS_MPMG.map((b) => b.municipio).filter((m): m is string => m !== null))].sort(),
    [],
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim() ? normalizar(busca.trim()) : "";
    return BARRAGENS_MPMG.filter((b) => {
      if (empreendedor !== TODOS && b.empreendedor !== empreendedor) return false;
      if (municipio === SEM_MUNICIPIO && b.municipio !== null) return false;
      if (municipio !== TODOS && municipio !== SEM_MUNICIPIO && b.municipio !== municipio) return false;
      const concluida = b.andamentoPercentual === 100;
      if (situacao === "concluida" && !concluida) return false;
      if (situacao === "andamento" && concluida) return false;
      if (!termo) return true;
      return (
        normalizar(b.nome).includes(termo) ||
        normalizar(b.empreendedor).includes(termo) ||
        (b.municipio ? normalizar(b.municipio).includes(termo) : false) ||
        (b.municipioBruto ? normalizar(b.municipioBruto).includes(termo) : false)
      );
    });
  }, [busca, empreendedor, municipio, situacao]);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(filtradas), `barragens-descaracterizacao-mpmg-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">
            Buscar por barragem, empreendedor ou município
          </span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            placeholder="ex.: Forquilha, Vale, Ouro Preto"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Empreendedor</span>
          <select
            value={empreendedor}
            onChange={(e) => setEmpreendedor(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {empreendedores.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Município</span>
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={SEM_MUNICIPIO}>Sem município reconhecido</option>
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Situação</span>
          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as FiltroSituacao)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value="todos">Todas</option>
            <option value="concluida">100% concluída</option>
            <option value="andamento">Ainda em andamento</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] text-text-soft" role="status">
          {formatNumberBR(filtradas.length)} {filtradas.length === 1 ? "barragem" : "barragens"} de{" "}
          {formatNumberBR(BARRAGENS_MPMG.length)}
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradas.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhuma barragem com esses filtros. Vazio aqui é resposta — não quer dizer que a busca
          falhou.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {filtradas.map((b) => {
            const concluida = b.andamentoPercentual === 100;
            return (
              <li key={b.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-[.9em]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-text">{b.nome}</p>
                  <span
                    className="rounded-md border border-border px-2 py-0.5 text-[.78em]"
                    style={concluida ? { color: "var(--color-ord-3)", borderColor: "var(--color-ord-3)" } : undefined}
                  >
                    {concluida ? "100% concluída" : decodificarEntidades(b.previsaoDescaracterizacao)}
                  </span>
                </div>
                <p className="mt-1 text-text-soft">
                  {b.municipio ?? (
                    <>
                      município não reconhecido
                      {b.municipioBruto ? ` (texto da fonte: "${b.municipioBruto}")` : ""}
                    </>
                  )}{" "}
                  · {b.empreendedor}
                </p>
                <p className="mt-1.5 text-text-soft">
                  {b.volumeMilM3 !== null ? (
                    <>
                      <strong className="font-medium text-text">{formatarVolume(b.volumeMilM3)}</strong>{" "}
                      <span className="text-[.85em]">({decodificarEntidades(b.volumeTexto ?? "")})</span>
                    </>
                  ) : (
                    "volume não publicado pela fonte"
                  )}
                </p>
                {!concluida && (
                  <p className="mt-1 text-text-soft">
                    Andamento:{" "}
                    {b.andamentoTexto ? decodificarEntidades(b.andamentoTexto) : "não publicado pela fonte"}
                  </p>
                )}
                <p className="mt-1.5">
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-accent"
                  >
                    ficha na fonte (MPMG) ↗
                  </a>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
