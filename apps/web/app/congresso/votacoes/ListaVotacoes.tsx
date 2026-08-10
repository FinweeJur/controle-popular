"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/lib/congresso/link";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { Votacao, VotoIndividual, LadoVoto } from "@/lib/congresso/votacoes";

/**
 * Tabela de `/congresso/votacoes` — mesmo mecanismo de
 * `congresso/proposicoes/ListaProposicoes.tsx` (ver o porquê lá). Filtro
 * original era só `ano` + busca em `descricao`; os dois continuam.
 */

type LinhaVotacao = Votacao & Record<string, unknown>;

const COR_LADO: Record<LadoVoto, string> = {
  sim: "var(--cp-accent)",
  nao: "var(--cp-alert)",
  abstencao: "var(--cp-text-soft)",
  outro: "var(--cp-text-soft)",
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

function ColunaVotos({ votos }: { votos: VotoIndividual[] }) {
  if (votos.length === 0) return <span className="text-xs opacity-60">sem registro</span>;
  return (
    <details className="rounded-md border border-[var(--cp-border)] px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium select-none">
        Ver votos ({votos.length})
      </summary>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {votos.map((voto) => (
          <li key={voto.parlamentarId} className="flex items-center justify-between gap-2 text-sm">
            <Link
              href={`/parlamentares/${voto.parlamentarId}`}
              className="truncate underline-offset-2 hover:underline"
            >
              {voto.nome}
              {voto.partido ? (
                <span className="opacity-70">
                  {" "}
                  ({voto.partido}
                  {voto.uf ? `/${voto.uf}` : ""})
                </span>
              ) : null}
            </Link>
            <span
              className="shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium"
              style={{ borderColor: COR_LADO[voto.lado], color: COR_LADO[voto.lado] }}
            >
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
    chave: "descricao",
    rotulo: "Votação",
    formatar: (v) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{v.descricao ?? "Descrição não registrada"}</span>
        {v.aprovacao !== null && (
          <span
            className="w-fit rounded-md border px-2 py-0.5 text-xs font-medium"
            style={{
              borderColor: v.aprovacao ? "var(--cp-accent)" : "var(--cp-alert)",
              color: v.aprovacao ? "var(--cp-accent)" : "var(--cp-alert)",
            }}
          >
            {v.aprovacao ? "Aprovada" : "Rejeitada"}
          </span>
        )}
      </div>
    ),
  },
  { chave: "siglaOrgao", rotulo: "Órgão" },
  { chave: "data", rotulo: "Data", formatar: (v) => formatarData(v.data) },
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
    ano ? sp.set("ano", ano) : sp.delete("ano");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano]);

  const filtrar = useCallback(
    (v: LinhaVotacao) => {
      if (!ano) return true;
      // `getUTCFullYear`, não `getFullYear`: `data` é `date` (sem hora), e
      // `new Date("2026-01-01")` vira meia-noite UTC — em fuso a oeste disso
      // (ex.: Brasília, UTC-3), `getFullYear()` leria o dia anterior e o
      // ano ficaria errado bem na virada. O SQL original (`extract(year
      // from data)`) não tinha esse problema por não passar por fuso
      // nenhum; `getUTCFullYear` é o equivalente no cliente.
      const anoDaVotacao = v.data ? new Date(v.data).getUTCFullYear() : null;
      return anoDaVotacao === Number(ano);
    },
    [ano]
  );

  return (
    <TabelaEstatica<LinhaVotacao>
      base={base}
      colunas={COLUNAS}
      camposBusca={["descricao"]}
      vazio="Nenhuma votação sincronizada ainda."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
          <label className="text-sm">
            <span className="mr-2 opacity-75">Ano</span>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2026"
              className="w-24 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
            />
          </label>
          {ano && (
            <button type="button" onClick={() => setAno("")} className="text-sm underline">
              limpar
            </button>
          )}
        </div>
      )}
    />
  );
}
