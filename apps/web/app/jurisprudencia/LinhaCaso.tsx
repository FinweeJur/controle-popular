"use client";

import { useState } from "react";
import type { CasoJurisprudencia } from "@/lib/jurisprudencia";
import { NOMES_FRENTE, NOMES_TIPO, merito } from "./rotulos";

/**
 * @file Linha (desktop) e cartão (celular) da lista de jurisprudência.
 *
 * POR QUE DOIS DESENHOS
 *
 * A tabela tinha nove colunas e rolava de lado no celular — exatamente o que a
 * regra 5.14 proíbe. Cinco colunas cabem no desktop; no celular nenhuma tabela
 * de decisão judicial cabe. Então: `md:` para cima é tabela, abaixo é cartão
 * empilhado. O `TabelaCasos` renderiza os dois contêineres e cada um esconde o
 * outro por CSS — não há duplicação de dado, só de marcação.
 *
 * Órgão, comarca, classe e recorrente saíram da linha e entraram no bloco
 * aberto: são o detalhe, não o que se compara de relance.
 *
 * Por que cliente: a sanfona precisa de estado e ocupa a linha inteira
 * (`colSpan`), o que não dá para fazer com `<details>` dentro da célula. O
 * componente recebe **um caso**, então o JSON grande continua no servidor.
 */

const LIMITE_CURTO = 320;
const COLUNAS = 5;

function resumoDe(caso: CasoJurisprudencia): string {
  return (caso.resumo || "").trim();
}

function ementaDe(caso: CasoJurisprudencia): string {
  return (caso.ementa || "").trim();
}

function ehCurto(caso: CasoJurisprudencia): boolean {
  if (caso.tipo === "sumula") return true;
  return !resumoDe(caso) && ementaDe(caso).length <= LIMITE_CURTO;
}

function temasDe(caso: CasoJurisprudencia): string {
  const texto = caso.temas.slice(0, 2).join(", ") || caso.assunto.slice(0, 90) || "—";
  const resto = caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : "";
  return `${texto}${resto}`;
}

function temMaisTexto(caso: CasoJurisprudencia): boolean {
  if (!ementaDe(caso)) return false;
  return !ehCurto(caso) || ementaDe(caso) !== resumoDe(caso);
}

function Detalhe({ caso }: { caso: CasoJurisprudencia }) {
  const resumo = resumoDe(caso);
  const ementa = ementaDe(caso);
  // A ementa vem do gerador com teto de 12.000 caracteres; só marca corte
  // quando o texto bate no teto.
  const cortada = ementa.length >= 12000 ? " […]" : "";
  const ficha = [caso.orgao, caso.comarca, caso.classe, caso.recorrente]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm leading-relaxed">
      {ficha ? <p className="text-xs opacity-70">{ficha}</p> : null}
      {resumo ? (
        <p>
          <span className="font-semibold">Resumo: </span>
          {resumo}
        </p>
      ) : null}
      {ementa ? (
        <p>
          <span className="font-semibold">Ementa: </span>
          {ementa}
          {cortada}
        </p>
      ) : null}
    </div>
  );
}

function CelulaProcesso({ caso }: { caso: CasoJurisprudencia }) {
  // Link interno de inteiro teor não é o tribunal: mostra só o número.
  if (!caso.link || caso.link.startsWith("/api/")) return <>{caso.processo}</>;
  return (
    <a className="underline" href={caso.link} target="_blank" rel="noopener noreferrer">
      {caso.processo}
    </a>
  );
}

function ResumoCurto({ caso }: { caso: CasoJurisprudencia }) {
  const texto = resumoDe(caso) || (caso.tipo === "sumula" ? ementaDe(caso) : "");
  if (!texto) return null;
  return (
    <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-soft">{texto}</p>
  );
}

function Acoes({
  caso,
  aberto,
  onToggle,
  classe,
}: {
  caso: CasoJurisprudencia;
  aberto: boolean;
  onToggle: () => void;
  classe?: string;
}) {
  return (
    <div className={classe ?? "flex flex-col items-end gap-1"}>
      {temMaisTexto(caso) ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          className="text-xs font-semibold text-primary underline"
        >
          {aberto ? "ver menos" : "ver mais"}
        </button>
      ) : null}
      {caso.link?.startsWith("/api/inteiro-teor") ? (
        <a
          className="text-xs font-semibold text-primary underline"
          href={caso.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          ver inteiro teor
        </a>
      ) : null}
    </div>
  );
}

export function LinhaCaso({ caso }: { caso: CasoJurisprudencia }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <tr className="hidden border-t border-[var(--cp-border)] align-top md:table-row">
        <td className="w-[9.5rem] px-2 py-2 font-tabular">
          <CelulaProcesso caso={caso} />
        </td>
        <td className="w-[7rem] whitespace-nowrap px-2 py-2">
          {caso.tribunal}/{caso.estado} · {caso.ano || "—"}
        </td>
        <td className="w-[9rem] px-2 py-2">{merito(caso)}</td>
        <td className="px-2 py-2">
          <span>{temasDe(caso)}</span>
          <ResumoCurto caso={caso} />
        </td>
        <td className="w-[7.5rem] px-2 py-2 text-right">
          <Acoes caso={caso} aberto={aberto} onToggle={() => setAberto((valor) => !valor)} />
        </td>
      </tr>
      {aberto ? (
        <tr className="hidden border-t border-[var(--cp-border)] bg-[var(--cp-surface-2)] md:table-row">
          <td colSpan={COLUNAS} className="px-4 py-3">
            <Detalhe caso={caso} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Cartão do celular: mesma informação, empilhada, sem rolagem lateral. */
export function CartaoCaso({ caso }: { caso: CasoJurisprudencia }) {
  const [aberto, setAberto] = useState(false);
  return (
    <li className="space-y-1 rounded-lg border border-[var(--cp-border)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-tabular font-semibold">
          <CelulaProcesso caso={caso} />
        </p>
        <p className="shrink-0 text-xs opacity-70">{caso.ano || "—"}</p>
      </div>
      <p className="text-xs opacity-70">
        {caso.tribunal}/{caso.estado} · {NOMES_TIPO[caso.tipo] ?? caso.tipo} ·{" "}
        {NOMES_FRENTE[caso.frente] ?? caso.frente}
      </p>
      <p>{merito(caso)}</p>
      <p className="text-xs opacity-80">{temasDe(caso)}</p>
      <ResumoCurto caso={caso} />
      {aberto ? (
        <div className="rounded bg-[var(--cp-surface-2)] p-2">
          <Detalhe caso={caso} />
        </div>
      ) : null}
      <Acoes
        caso={caso}
        aberto={aberto}
        onToggle={() => setAberto((valor) => !valor)}
        classe="flex flex-wrap gap-3 pt-1"
      />
    </li>
  );
}
