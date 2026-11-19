"use client";

import { useMemo, useState } from "react";

import { formatNumberBR } from "@/lib/betim/format";
import {
  atosParaCsv,
  filtrarAtos,
  formatarDataBR,
  rotuloTipo,
  type AtoNaLista,
} from "@/lib/fontes-externas/paginas";

/**
 * Lista filtrável dos atos de diário municipal.
 *
 * Recebe as 22 linhas já achatadas pelo Server Component — a página importa o
 * JSON, este componente só filtra e desenha. Cidade e tipo são os dois filtros
 * que o leitor usa; a busca livre cobre o trecho, porque é ali que está a
 * evidência ("nomeia", "licitação", "decreto").
 *
 * O texto da tela fala em MENÇÃO ao termo, nunca em ato classificado: o
 * Querido Diário entrega o texto do diário, não a categoria do ato.
 */

const TODOS = "";

interface OpcaoTipo {
  valor: string;
  rotulo: string;
}

export default function PainelDiarios({
  linhas,
  cidades,
  tipos,
}: {
  linhas: AtoNaLista[];
  cidades: string[];
  tipos: OpcaoTipo[];
}) {
  const [cidade, setCidade] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(
    () => filtrarAtos(linhas, { cidade, tipo, busca }),
    [linhas, cidade, tipo, busca]
  );

  const temFiltro = Boolean(cidade || tipo || busca.trim());

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    const csv = atosParaCsv(filtrados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diarios-municipais-filtrados-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function limparFiltros() {
    setCidade(TODOS);
    setTipo(TODOS);
    setBusca("");
  }

  return (
    <div className="mt-4 w-full min-w-0">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Cidade</span>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todas as cidades ({cidades.length})</option>
              {cidades.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Termo contado</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todos os termos ({tipos.length})</option>
              {tipos.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Busca no trecho</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: nomeia, licitação, conselho…"
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p
            className="font-tabular text-xs text-text-soft"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatNumberBR(filtrados.length)} de {formatNumberBR(linhas.length)} linhas
            {temFiltro ? " com o filtro atual" : ""}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="min-h-9 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={exportarCsv}
              disabled={filtrados.length === 0}
              className="min-h-9 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              Baixar CSV dos filtrados
            </button>
          </div>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-soft">
          Nenhuma linha corresponde ao filtro. A lista cobre todas as {formatNumberBR(linhas.length)}{" "}
          linhas coletadas — este resultado é definitivo, não é carregamento parcial.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtrados.map((ato) => (
            <li
              key={`${ato.ibge}-${ato.data}-${ato.edicao}-${ato.tipo}`}
              className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-soft">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {rotuloTipo(ato.tipo)}
                </span>
                <time dateTime={ato.data}>{formatarDataBR(ato.data)}</time>
                <span aria-hidden="true">·</span>
                <span>
                  {ato.cidade}/{ato.uf}
                </span>
                <span aria-hidden="true">·</span>
                <span>edição {ato.edicao}</span>
                <span className="ml-auto font-tabular">
                  {formatNumberBR(ato.ocorrencias)} {ato.ocorrencias === 1 ? "menção" : "menções"}
                </span>
              </div>
              <p className="mt-2 break-words text-sm leading-relaxed text-text">“{ato.trecho}”</p>
              <a
                href={ato.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary hover:underline"
              >
                Abrir o diário oficial (PDF) ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
