"use client";

import { useState } from "react";
import type { CasoJurisprudencia } from "@/lib/jurisprudencia";
import { NOMES_FRENTE, NOMES_TIPO, merito } from "./rotulos";

/**
 * @file Linha da tabela de jurisprudência, com sanfona.
 *
 * Duas decisões de layout (01/11/2026), pedidas pelo dono:
 *
 * 1. **Súmula e resumo ficam visíveis direto.** Súmula mostra a ementa
 *    inteira, sem clique. Caso com resumo mostra o resumo; a ementa completa
 *    abre na sanfona. Antes o texto era cortado em 4,5 rem e o botão ficava
 *    grudado no texto da coluna Temas.
 * 2. **Sanfona cresce, não rola.** O bloco aberto não tem mais `max-height`
 *    nem `overflow-y`: o leitor rola a página, não uma caixa. Barra de rolagem
 *    interna em tabela é armadilha — no celular ela nem aparece.
 *
 * O botão fica na coluna "Ementa", alinhado à direita e separado do texto;
 * a coluna Temas carrega só tema.
 */

const COLUNAS = 9;

function resumoDe(caso: CasoJurisprudencia): string {
  return (caso.resumo || "").trim();
}

function ementaDe(caso: CasoJurisprudencia): string {
  return (caso.ementa || "").trim();
}

function temasDe(caso: CasoJurisprudencia): string {
  const texto = caso.temas.slice(0, 2).join(", ") || caso.assunto.slice(0, 90) || "—";
  const resto = caso.temas.length > 2 ? ` +${caso.temas.length - 2}` : "";
  return `${texto}${resto}`;
}

function TextoAberto({ caso }: { caso: CasoJurisprudencia }) {
  const resumo = resumoDe(caso);
  const ementa = ementaDe(caso);
  const cortada = ementa.length >= 4000 ? " […]" : "";
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {resumo ? (
        <p>
          <span className="font-semibold">Resumo: </span>
          {resumo}
        </p>
      ) : null}
      {ementa ? (
        <p className="whitespace-pre-line">
          <span className="font-semibold">Ementa: </span>
          {ementa}
          {cortada}
        </p>
      ) : null}
      {caso.link?.startsWith("/api/inteiro-teor") ? (
        <a className="text-xs font-semibold text-primary underline" href={caso.link} target="_blank" rel="noopener noreferrer">
          ver inteiro teor
        </a>
      ) : null}
    </div>
  );
}

function CelulaProcesso({ caso }: { caso: CasoJurisprudencia }) {
  if (!caso.link || caso.link.startsWith("/api/")) return <>{caso.processo}</>;
  return (
    <a className="underline" href={caso.link} target="_blank" rel="noopener noreferrer">
      {caso.processo}
    </a>
  );
}

/** Súmula: ementa inteira, sem clique. Caso comum: resumo visível. */
function CelulaEmenta({ caso }: { caso: CasoJurisprudencia }) {
  const resumo = resumoDe(caso);
  const ementa = ementaDe(caso);
  if (caso.tipo === "sumula") {
    return <p className="whitespace-pre-line text-xs leading-snug text-text-soft">{ementa || "—"}</p>;
  }
  if (resumo) return <p className="text-sm leading-snug">{resumo}</p>;
  if (ementa) {
    return <p className="line-clamp-3 text-xs leading-snug text-text-soft">{ementa}</p>;
  }
  return <span className="text-xs text-text-soft">—</span>;
}

function Gatilho({ caso, aberto, onToggle }: { caso: CasoJurisprudencia; aberto: boolean; onToggle: () => void }) {
  const ementa = ementaDe(caso);
  const resumo = resumoDe(caso);
  if (!ementa || caso.tipo === "sumula") return null;
  if (ementa === resumo) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={aberto}
      className="mt-2 whitespace-nowrap rounded border border-[var(--cp-border)] px-2 py-0.5 text-xs font-semibold text-primary hover:bg-[var(--cp-surface-2)]"
    >
      {aberto ? "ver menos" : "ver ementa"}
    </button>
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
        <td className="px-2 py-2 text-xs text-text-soft">{temasDe(caso)}</td>
        <td className="min-w-[14rem] px-2 py-2">
          <CelulaEmenta caso={caso} />
          <Gatilho caso={caso} aberto={aberto} onToggle={() => setAberto((valor) => !valor)} />
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
