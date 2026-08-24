"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import { REDE_LABELS, type EscolaRow } from "@/lib/betim/educacao";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/educacao`, servida por índice estático fatiado.
 *
 * Substituiu um `data.escolas.map()` inline dentro de um `<div class="max-h-96
 * overflow-y-auto">` — ou seja, a lista INTEIRA ia no HTML e o leitor rolava
 * dentro de uma caixa de 24rem. Ver o custo medido em `dados/[arquivo]/route.ts`:
 * 2.200,6 bytes de `.cache` por escola, e o teto de 25 MiB do Workers a ~1.900
 * escolas de distância em São Paulo.
 *
 * ═══ O QUE A TELA GANHOU, E POR QUE ISSO NÃO É ESCOPO A MAIS ═══
 *
 * A lista antiga não tinha busca nem filtro: eram ~10 mil escolas em ordem
 * alfabética dentro de uma caixa rolante, e achar uma escola pelo nome era
 * rolar até ela. Trocar isso por uma tabela paginada SEM busca seria regressão
 * — 200 páginas para folhear. `TabelaEstatica` já traz busca e paginação no
 * mesmo componente, então a busca não é enfeite: é o que mantém a tela
 * utilizável depois de a lista deixar de ser um bloco rolável único.
 *
 * O filtro por rede espelha o cartão "Escolas por rede" logo acima, que
 * continua vindo pronto do servidor (é O(1), ver `getEducacaoResumo`). O cartão
 * diz quantas são; o filtro mostra quais.
 */
type LinhaEscola = EscolaRow & Record<string, unknown>;

const COLUNAS: ColunaTabela<LinhaEscola>[] = [
  {
    chave: "nome",
    rotulo: "Escola",
    // `nome` é anulável na tabela (ver `EscolaRow`). A lista antiga imprimia o
    // nulo como item vazio; aqui ele fica explícito, porque a linha existe —
    // é uma escola do censo cujo nome a fonte não trouxe.
    formatar: (e) => (
      <span className="font-medium text-text">{e.nome ?? "(sem nome no cadastro do INEP)"}</span>
    ),
  },
  {
    chave: "rede",
    rotulo: "Rede",
    // Mesmo rótulo do cartão de cima e da lista antiga — `REDE_LABELS` continua
    // sendo a única tradução de `rede` no projeto, não uma cópia nova.
    formatar: (e) => REDE_LABELS[e.rede ?? ""] ?? "rede não informada",
  },
  {
    chave: "matriculas",
    rotulo: "Matrículas",
    numerica: true,
    // A lista antiga simplesmente omitia o número quando era nulo/zero. Aqui a
    // coluna existe sempre, então o vazio precisa de um símbolo próprio: "0"
    // afirmaria que a escola não tem aluno, e o campo só não foi informado.
    formatar: (e) => (e.matriculas ? formatNumberBR(e.matriculas) : "—"),
  },
];

export default function ListaEscolas({ base }: { base: string }) {
  const [rede, setRede] = useState("");
  const primeiraRenderizacao = useRef(true);

  // Estado inicial da URL depois da hidratação, e de volta com
  // `replaceState` — mesmo padrão de `ListaServidores.tsx`, e pelo mesmo
  // motivo (`useSearchParams()` reprova no `output: 'export'`).
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setRede(new URLSearchParams(window.location.search).get("rede") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (rede) {
      sp.set("rede", rede);
    } else {
      sp.delete("rede");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [rede]);

  // `useCallback` não é cosmético aqui: `TabelaEstatica` usa o predicado numa
  // dependência de `useMemo`, e sem isso a tabela refiltra ~10 mil escolas a
  // cada tecla digitada na busca.
  const filtrar = useCallback((e: LinhaEscola) => !rede || (e.rede ?? "") === rede, [rede]);

  return (
    <TabelaEstatica<LinhaEscola>
      base={base}
      colunas={COLUNAS}
      camposBusca={["nome"]}
      vazio="Nenhuma escola informada para este município."
      filtrar={filtrar}
      controles={({ linhas }) => {
        // As redes saem do dado já carregado, não de `REDE_LABELS` inteiro:
        // oferecer "Federal" num município sem escola federal é filtro que só
        // sabe devolver vazio.
        const redes = [...new Set(linhas.map((l) => l.rede ?? "").filter(Boolean))].sort(
          (a, b) => (REDE_LABELS[a] ?? a).localeCompare(REDE_LABELS[b] ?? b, "pt-BR")
        );
        if (redes.length < 2) return null;
        return (
          <div className="flex flex-col">
            <label htmlFor="f-rede" className="mb-1 text-xs font-medium text-text-soft">
              Rede
            </label>
            <select
              id="f-rede"
              value={rede}
              onChange={(e) => setRede(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todas as redes</option>
              {redes.map((r) => (
                <option key={r} value={r}>
                  {REDE_LABELS[r] ?? "Outra"}
                </option>
              ))}
            </select>
          </div>
        );
      }}
    />
  );
}
