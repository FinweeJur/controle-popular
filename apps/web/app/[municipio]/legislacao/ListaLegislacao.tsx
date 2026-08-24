"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// Lógica pura sem import de servidor — mesmo molde das outras telas da zona.
import {
  contagemPorStatus,
  filtrarPorStatus,
  linhasDaTabela,
  type LinhaLegislacao,
} from "@/lib/betim/legislacao/logica";
import type { StatusItem } from "@/lib/betim/legislacao/dados";

/**
 * Tabela de `/[municipio]/legislacao` — CINCO instrumentos fixos por
 * município, não uma coleção grande: `TabelaEstatica` (índice fatiado,
 * paginação) seria mecanismo de mais para uma lista que não cresce; aqui é
 * um componente cliente pequeno com o MESMO vocabulário visual das tabelas
 * do portal (bordas/rounded/text-tabular dos outros filtros).
 */

export interface ListaLegislacaoProps {
  slug: string;
}

const OPCOES_STATUS: { valor: StatusItem | ""; rotulo: string }[] = [
  { valor: "", rotulo: "Todos os status" },
  { valor: "encontrado", rotulo: "Encontrado" },
  { valor: "nao_encontrado", rotulo: "Não encontrado" },
  { valor: "nao_verificado", rotulo: "Não verificado" },
];

function BadgeStatus({ status }: { status: StatusItem }) {
  const estilo =
    status === "encontrado"
      ? "bg-accent/15 text-accent"
      : status === "nao_encontrado"
        ? "bg-alert/15 text-alert"
        : "bg-surface-2 text-text-soft";
  const icone = status === "encontrado" ? "✓" : status === "nao_encontrado" ? "×" : "·";
  const rotulo =
    status === "encontrado" ? "Encontrado" : status === "nao_encontrado" ? "Não encontrado" : "Não verificado";
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}>
      <span aria-hidden="true">{icone}</span> {rotulo}
    </span>
  );
}

export default function ListaLegislacao({ slug }: ListaLegislacaoProps) {
  const [status, setStatus] = useState<StatusItem | "">("");
  const primeiraRenderizacao = useRef(true);
  const todas = linhasDaTabela(slug);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status");
    if (s === "encontrado" || s === "nao_encontrado" || s === "nao_verificado") setStatus(s);
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (status) {
      sp.set("status", status);
    } else {
      sp.delete("status");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [status]);

  const linhasFiltradas = useCallback(() => filtrarPorStatus(todas, status), [todas, status])();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col">
          <label htmlFor="fl-status" className="mb-1 text-xs font-medium text-text-soft">
            Status
          </label>
          <select
            id="fl-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusItem | "")}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            {OPCOES_STATUS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>
        <p className="pb-2 font-tabular text-xs text-text-soft" aria-live="polite">
          {linhasFiltradas.length} de {todas.length} itens
        </p>
        {status && (
          <button type="button" onClick={() => setStatus("")} className="text-sm text-text-soft hover:underline">
            Limpar filtro
          </button>
        )}
      </div>

      {/* Contagem fora do filtro — responde "quanto é isso?" antes da lista. */}
      <p className="mb-4 text-sm text-text-soft">
        {contagemPorStatus(todas).encontrado} encontrados ·{" "}
        {contagemPorStatus(todas).nao_encontrado} não encontrados ·{" "}
        {contagemPorStatus(todas).nao_verificado} ainda não verificados
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th scope="col" className="border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide text-text-soft">
                Instrumento
              </th>
              <th scope="col" className="border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide text-text-soft">
                Status
              </th>
              <th scope="col" className="border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide text-text-soft">
                Documento / onde procurar
              </th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((l: LinhaLegislacao) => (
              <tr key={l.chave}>
                <td className="border-b border-border px-3 py-3 align-top">
                  <strong className="text-text">{l.rotulo}</strong>
                  {l.ano != null && <span className="font-tabular ml-1 text-text-soft">· {l.ano}</span>}
                </td>
                <td className="border-b border-border px-3 py-3 align-top">
                  <BadgeStatus status={l.status} />
                </td>
                <td className="border-b border-border px-3 py-3 align-top">
                  {l.href ? (
                    <div className="flex flex-col gap-1">
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-fit text-[.9em] font-medium text-primary underline underline-offset-2"
                      >
                        Abrir documento oficial ↗
                      </a>
                      {l.fonteLabel && <span className="max-w-[420px] text-sm leading-snug text-text-soft">{l.fonteLabel}</span>}
                      {l.nota && <span className="max-w-[420px] text-sm leading-snug text-text-soft">{l.nota}</span>}
                    </div>
                  ) : (
                    <span className="block max-w-[460px] text-sm leading-snug text-text-soft">
                      {l.nota ?? "Sem nota."}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
