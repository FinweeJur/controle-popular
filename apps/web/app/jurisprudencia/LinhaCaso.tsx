"use client";

import { useState } from "react";
import type { CasoJurisprudencia } from "@/lib/jurisprudencia";
import { NOMES_FRENTE, NOMES_TIPO, merito } from "./rotulos";

/**
 * @file Linha da tabela de jurisprudência, com sanfona.
 *
 * Por que cliente: a sanfona precisa de estado e ocupa uma linha inteira
 * (`colSpan`), o que não dá para fazer com `<details>` dentro da célula.
 * O componente recebe **um caso**, então o JSON grande continua no servidor.
 *
 * Ementa curta (súmula, texto até 320 caracteres) já aparece aberta, sem
 * clique. Texto longo abre na linha de baixo, com rolagem própria.
 */

const LIMITE_CURTO = 320;
const COLUNAS = 9;

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

function TextoAberto({ caso }: { caso: CasoJurisprudencia }) {
  const resumo = resumoDe(caso);
  const ementa = ementaDe(caso);
  // A ementa vem do gerador com teto de 12.000 caracteres; só marca corte
  // quando o texto bate no teto. Antes o marcador era 4.000, herança de um
  // teto menor, e aparecia "…" em texto que estava inteiro.
  const cortada = ementa.length >= 12000 ? " […]" : "";
  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm leading-relaxed">
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

function CelulaTexto({ caso }: { caso: CasoJurisprudencia }) {
  const texto = resumoDe(caso) || (caso.tipo === "sumula" ? ementaDe(caso) : "");
  if (!texto) return null;
  return (
    <p className="mt-1 max-h-[4.5rem] overflow-hidden text-xs leading-snug text-text-soft">
      {texto}
    </p>
  );
}

function Gatilho({ caso, aberto, onToggle }: { caso: CasoJurisprudencia; aberto: boolean; onToggle: () => void }) {
  if (!ementaDe(caso)) return null;
  const temMais = !ehCurto(caso) || ementaDe(caso) !== resumoDe(caso);
  if (!temMais) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={aberto}
      className="text-xs font-semibold text-primary underline"
    >
      {aberto ? "ver menos" : "ver mais"}
    </button>
  );
}

function InteiroTeor({ caso }: { caso: CasoJurisprudencia }) {
  if (!caso.link || !caso.link.startsWith("/api/inteiro-teor")) return null;
  return (
    <a
      className="text-xs font-semibold text-primary underline"
      href={caso.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      ver inteiro teor
    </a>
  );
}

export function LinhaCaso({ caso }: { caso: CasoJurisprudencia }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <tr className="border-t border-[var(--cp-border)] align-top">
        <td className="whitespace-nowrap px-2 py-2 font-tabular"><CelulaProcesso caso={caso} /></td>
        <td className="whitespace-nowrap px-2 py-2">{caso.tribunal}/{caso.estado}</td>
        <td className="whitespace-nowrap px-2 py-2">{NOMES_TIPO[caso.tipo] ?? caso.tipo}</td>
        <td className="whitespace-nowrap px-2 py-2">{caso.ano || "—"}</td>
        <td className="px-2 py-2">{caso.orgao || caso.comarca || "—"}</td>
        <td className="whitespace-nowrap px-2 py-2">{NOMES_FRENTE[caso.frente] ?? caso.frente}</td>
        <td className="px-2 py-2">{merito(caso)}</td>
        <td className="w-full px-2 py-2">
          <span>{temasDe(caso)}</span>
          <CelulaTexto caso={caso} />
        </td>
        <td className="whitespace-nowrap px-2 py-2 text-right">
          <div className="flex flex-col items-end gap-1">
            <Gatilho caso={caso} aberto={aberto} onToggle={() => setAberto((valor) => !valor)} />
            <InteiroTeor caso={caso} />
          </div>
        </td>
      </tr>
      {aberto ? (
        <tr className="border-t border-[var(--cp-border)] bg-[var(--cp-surface-2)]">
          <td colSpan={COLUNAS} className="px-4 py-3">
            <TextoAberto caso={caso} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
