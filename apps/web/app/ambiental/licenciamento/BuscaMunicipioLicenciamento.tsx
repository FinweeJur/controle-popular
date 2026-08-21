"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import type { MunicipioComLicenciamento } from "@/lib/db/queries/ambiental-licenciamento";

/**
 * Filtro em memória sobre a lista de municípios com licença — mesmo padrão
 * de `app/ambiental/copam/BuscaMunicipio.tsx` (algumas centenas de linhas
 * de id+nome+contagem cabem inteiras no cliente; gerar 1 página estática
 * por município é o que resolve a navegação, isto aqui só ajuda a achar
 * qual).
 *
 * Também é o "filtro" e a "ordenação por coluna" das cinco coisas
 * (`AGENTS.md`) desta página, e o CSV exporta exatamente o que está
 * FILTRADO na tela — o conjunto inteiro que bate com a busca, não só os
 * 24/40 primeiros que aparecem antes de rolar.
 */
type Ordem = "total" | "nome";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: MunicipioComLicenciamento[]): string {
  const BOM = "﻿";
  const cabecalho = ["id_ibge", "municipio", "licencas_deferidas"].join(";");
  const corpo = linhas.map((m) => [m.idIbge, m.nome, m.total].map(csvEscape).join(";"));
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

export default function BuscaMunicipioLicenciamento({
  municipios,
}: {
  municipios: MunicipioComLicenciamento[];
}) {
  const [termo, setTermo] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("total");

  const baseOrdenada = useMemo(() => {
    if (ordem === "nome") return [...municipios].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return municipios; // já vem "mais licenciado primeiro" da query do servidor
  }, [municipios, ordem]);

  const correspondentes = useMemo(() => {
    const alvo = normalizar(termo);
    if (!alvo) return baseOrdenada;
    return baseOrdenada.filter((m) => normalizar(m.nome).includes(alvo));
  }, [termo, baseOrdenada]);

  const LIMITE_SEM_BUSCA = 24;
  const LIMITE_COM_BUSCA = 40;
  const filtrados = termo
    ? correspondentes.slice(0, LIMITE_COM_BUSCA)
    : correspondentes.slice(0, LIMITE_SEM_BUSCA);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    const sufixo = termo ? `-busca-${normalizar(termo).replace(/\s+/g, "-")}` : "";
    baixarCsv(paraCsv(correspondentes), `licenciamento-municipios${sufixo}-${hoje}.csv`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="busca-municipio-licenciamento" className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">Buscar município</span>
          <input
            id="busca-municipio-licenciamento"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite o nome de uma cidade de Minas Gerais…"
            className="mt-1 w-full rounded-lg border border-[var(--cp-border)] bg-transparent px-4 py-2.5 text-[.95em] outline-none focus:border-[var(--cp-tertiary)]"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ordenar por</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="mt-1 rounded-md border border-[var(--cp-border)] bg-transparent px-3 py-2 text-[.92em]"
          >
            <option value="total">Mais licenças primeiro</option>
            <option value="nome">Nome do município (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.85em] opacity-70" role="status">
          {formatNumberBR(correspondentes.length)}{" "}
          {correspondentes.length === 1 ? "município corresponde" : "municípios correspondem"}
          {termo ? " à busca" : ""}
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={correspondentes.length === 0}
          className="rounded-md border border-[var(--cp-border)] px-3 py-1.5 text-[.85em] font-medium hover:border-[var(--cp-tertiary)] disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(correspondentes.length)})
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm opacity-70">
          Nenhum município com licença ambiental coletada bate com &quot;{termo}&quot;.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtrados.map((m) => (
            <li key={m.idIbge}>
              <Link
                href={`/licenciamento/municipio/${m.idIbge}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm hover:border-[var(--cp-tertiary)]"
              >
                <span>{m.nome}</span>
                <span className="shrink-0 font-tabular text-xs opacity-60">
                  {formatNumberBR(m.total)} {m.total === 1 ? "licença" : "licenças"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {filtrados.length < correspondentes.length ? (
        <p className="mt-3 text-xs opacity-60">
          Mostrando {formatNumberBR(filtrados.length)} de {formatNumberBR(correspondentes.length)}
          {termo ? " que batem com a busca" : ""}. O CSV acima baixa a lista inteira, não só os
          mostrados aqui.
        </p>
      ) : null}
    </div>
  );
}
