"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/lib/betim/link";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { VotacaoRow, VotoIndividual, LadoVoto } from "@/lib/betim/votacoesCamara";
import { formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/camara/votacoes` — mesmo mecanismo de
 * `camara/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`), com os
 * dois filtros originais (ano, busca na matéria).
 */

type LinhaVotacao = VotacaoRow & Record<string, unknown>;

const ESTILO_LADO: Record<LadoVoto, string> = {
  sim: "bg-accent/15 text-accent",
  nao: "bg-alert/15 text-alert",
  abstencao: "bg-surface-2 text-text-soft",
  ausente: "bg-surface-2 text-text-soft italic",
  presidencia: "bg-primary/10 text-primary",
  outro: "bg-surface-2 text-text",
};

function ColunaVotos({ votos }: { votos: VotoIndividual[] }) {
  if (votos.length === 0) return <span className="text-xs text-text-soft">sem registro</span>;
  return (
    <details className="rounded-xl border border-border/60 bg-surface-2 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-accent select-none">
        Ver como cada vereador votou ({votos.length})
      </summary>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {votos.map((voto, i) => (
          <li
            key={voto.vereadorId ?? `${voto.nome}-${i}`}
            className="flex items-center justify-between gap-2 text-sm"
          >
            {voto.slug ? (
              <Link href={`/vereadores/${voto.slug}`} className="truncate text-text hover:text-primary hover:underline">
                {voto.nome}
                {voto.partido && <span className="text-text-soft"> ({voto.partido})</span>}
              </Link>
            ) : (
              <span className="truncate text-text-soft">
                {voto.nome}
                {voto.partido && <span> ({voto.partido})</span>}
              </span>
            )}
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_LADO[voto.lado]}`}>
              {voto.voto}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const COLUNAS: ColunaTabela<LinhaVotacao>[] = [
  {
    chave: "materia",
    rotulo: "Matéria",
    formatar: (v) => (
      <div className="flex flex-col gap-1">
        <span className="font-display font-semibold text-text">
          {v.materia ?? "Matéria não identificada"}
        </span>
        {v.ementa && <span className="text-xs text-text-soft">{v.ementa}</span>}
        {v.linkFonte && (
          <a href={v.linkFonte} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent hover:underline">
            Ver fonte oficial ↗
          </a>
        )}
      </div>
    ),
  },
  {
    chave: "resultado",
    rotulo: "Resultado",
    formatar: (v) => (
      <div className="flex flex-col gap-0.5 text-xs text-text-soft">
        {v.resultado && <span className="w-fit rounded-full bg-surface-2 px-2.5 py-1 font-medium">{v.resultado}</span>}
        {v.tipoVotacao && <span>{v.tipoVotacao}</span>}
        {v.presentes != null && <span>{v.presentes} presentes</span>}
        {(v.placarSim != null || v.placarNao != null) && (
          <span>
            Sim {v.placarSim ?? 0} · Não {v.placarNao ?? 0}
            {v.placarAbstencao ? ` · Abstenção ${v.placarAbstencao}` : ""}
            {v.placarBranco ? ` · Branco ${v.placarBranco}` : ""}
          </span>
        )}
      </div>
    ),
  },
  { chave: "data", rotulo: "Data", formatar: (v) => formatDateBR(v.data) },
  { chave: "votos", rotulo: "Votos", formatar: (v) => <ColunaVotos votos={v.votos} /> },
];

export default function ListaVotacoes({ base }: { base: string }) {
  const [ano, setAno] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setAno(sp.get("ano") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (ano) {
      sp.set("ano", ano);
    } else {
      sp.delete("ano");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano]);

  const filtrar = useCallback(
    (v: LinhaVotacao) => {
      if (!ano) return true;
      // `getUTCFullYear`, não `getFullYear` — mesmo cuidado registrado em
      // `congresso/votacoes/ListaVotacoes.tsx`: `data` não tem hora, e
      // `new Date("2026-01-01")` vira meia-noite UTC.
      const anoDaVotacao = v.data ? new Date(v.data).getUTCFullYear() : null;
      return anoDaVotacao === Number(ano);
    },
    [ano]
  );

  return (
    <TabelaEstatica<LinhaVotacao>
      base={base}
      colunas={COLUNAS}
      camposBusca={["materia", "ementa"]}
      vazio="Nenhuma votação nominal encontrada no momento."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col">
            <label htmlFor="f-ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <input
              id="f-ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2026"
              className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            />
          </div>
          {ano && (
            <button type="button" onClick={() => setAno("")} className="text-sm text-text-soft hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      )}
    />
  );
}
