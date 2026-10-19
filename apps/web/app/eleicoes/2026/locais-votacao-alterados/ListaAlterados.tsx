"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import BotoesExportar from "@/app/components/BotoesExportar";
import type { ColunaCsv } from "@/lib/tabela/csv";

/**
 * Tabela de `/eleicoes/2026/locais-votacao-alterados` — mesmo mecanismo de
 * `congresso/votacoes/ListaVotacoes.tsx`: índice estático fatiado
 * (`TabelaEstatica`) + filtro por UF e por tipo de alteração com estado
 * no cliente que sincroniza com a URL via `history.replaceState`
 * (sem `useSearchParams`, que quebra o `output: "export"` — padrão
 * documentado em `TabelaEstatica.tsx`).
 *
 * Fonte: TSE — Dados abertos, coleta de 18/10/2026.
 */

export interface LinhaAlterada {
  u: string;
  m: string;
  z: number;
  s: number;
  e: number;
  l: string;
  d: string;
  lo: string;
  "do": string;
  t: string;
}

type Linha = LinhaAlterada & Record<string, unknown>;

const ROTULOS_TIPO: Record<string, string> = {
  predio: "outro prédio",
  endereco: "mesmo prédio, endereço novo",
  nome: "só mudou o nome do local",
};

const COLUNAS: ColunaTabela<Linha>[] = [
  { chave: "u", rotulo: "UF" },
  { chave: "m", rotulo: "Município" },
  {
    chave: "z",
    rotulo: "Zona/Seção",
    formatar: (linha) => `${linha.z} / ${linha.s}`,
    numerica: true,
  },
  { chave: "e", rotulo: "Eleitores", numerica: true },
  { chave: "l", rotulo: "Local atual", largura: "min-w-[180px]" },
  { chave: "d", rotulo: "Endereço atual", largura: "min-w-[180px]" },
  { chave: "lo", rotulo: "Local original", largura: "min-w-[180px]" },
  {
    chave: "t",
    rotulo: "Tipo",
    formatar: (linha) => ROTULOS_TIPO[linha.t] ?? linha.t,
  },
];

const COLUNAS_CSV: ColunaCsv<Linha>[] = [
  { chave: "u", rotulo: "UF" },
  { chave: "m", rotulo: "Municipio" },
  { chave: "z", rotulo: "Zona" },
  { chave: "s", rotulo: "Secao" },
  { chave: "e", rotulo: "Eleitores" },
  { chave: "l", rotulo: "Local atual" },
  { chave: "d", rotulo: "Endereco atual" },
  { chave: "lo", rotulo: "Local original" },
  { chave: "do", rotulo: "Endereco original" },
  { chave: "t", rotulo: "Tipo" },
];

export default function ListaAlterados({
  base,
  ufs,
}: {
  base: string;
  ufs: string[];
}) {
  const [uf, setUf] = useState("");
  const [tipo, setTipo] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setUf(sp.get("uf") ?? "");
    setTipo(sp.get("tipo") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (uf) sp.set("uf", uf);
    else sp.delete("uf");
    if (tipo) sp.set("tipo", tipo);
    else sp.delete("tipo");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [uf, tipo]);

  const filtrar = useCallback(
    (linha: Linha) => {
      if (uf && linha.u !== uf.toUpperCase()) return false;
      if (tipo && linha.t !== tipo) return false;
      return true;
    },
    [uf, tipo]
  );

  return (
    <TabelaEstatica<Linha>
      base={base}
      colunas={COLUNAS}
      camposBusca={["m", "l", "lo", "d"]}
      vazio="Nenhuma seção correspondente ao filtro."
      filtrar={filtrar}
      controles={({ filtradas }) => (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
            <label className="text-sm">
              <span className="mr-2 opacity-75">UF</span>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                aria-label="Filtrar por UF"
                className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
              >
                <option value="">todas</option>
                {ufs.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mr-2 opacity-75">Tipo de alteração</span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                aria-label="Filtrar por tipo de alteração"
                className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
              >
                <option value="">todos</option>
                {["predio", "endereco", "nome"].map((chave) => (
                  <option key={chave} value={chave}>
                    {ROTULOS_TIPO[chave]}
                  </option>
                ))}
              </select>
            </label>
            {(uf || tipo) && (
              <button
                type="button"
                onClick={() => {
                  setUf("");
                  setTipo("");
                }}
                className="text-sm underline"
              >
                limpar filtros
              </button>
            )}
          </div>
          <BotoesExportar
            dados={filtradas}
            colunas={COLUNAS_CSV}
            nomeArquivo="locais-votacao-alterados-2026"
          />
        </div>
      )}
    />
  );
}
