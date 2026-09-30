"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ExternalLink } from "lucide-react";
import {
  type CidadeComparavel,
  compararCidades,
} from "@/lib/comparador/cidades";

/**
 * Tela do comparador de cidades (`/comparar`).
 *
 * ═══ O QUE É ═══
 *
 * Dois seletores e uma tabela: escolhe duas cidades do acervo e vê os
 * indicadores lado a lado, com a diferença em cada linha. A lista das 199
 * cidades chega por props (projeção enxuta, sem histórico de PIB); o cálculo
 * roda no navegador.
 *
 * ═══ CUIDADO EDITORIAL ═══
 *
 * A tela realça o maior valor, mas não diz que uma cidade é "melhor". Cidades
 * têm tamanhos e realidades diferentes — por isso o valor por habitante
 * aparece separado. O leitor tira a própria conclusão.
 */

interface Props {
  cidades: CidadeComparavel[];
  /** Data de geração do acervo (dd/mm/aaaa), ou null. */
  dataAcervo: string | null;
}

/** Descobre o id de uma cidade pelo código IBGE, caindo para o primeiro da lista. */
function idInicial(cidades: CidadeComparavel[], preferido: string, alternativa: number): string {
  return cidades.find((c) => c.id === preferido)?.id ?? cidades[alternativa]?.id ?? "";
}

export default function CompararClient({ cidades, dataAcervo }: Props) {
  const [idA, setIdA] = useState(() => idInicial(cidades, "3106200", 0)); // BH por padrão
  const [idB, setIdB] = useState(() => idInicial(cidades, "3106705", 1)); // Betim por padrão

  const cidadeA = useMemo(() => cidades.find((c) => c.id === idA), [cidades, idA]);
  const cidadeB = useMemo(() => cidades.find((c) => c.id === idB), [cidades, idB]);

  const linhas = useMemo(
    () => (cidadeA && cidadeB ? compararCidades(cidadeA, cidadeB) : []),
    [cidadeA, cidadeB],
  );

  function trocar() {
    setIdA(idB);
    setIdB(idA);
  }

  /** Rota da cidade (usa o slug quando existe; senão, a rota de territórios). */
  function rotaCidade(c: CidadeComparavel): string {
    return c.slug ? `/${c.slug}` : `/terra-e-territorios/cidades/${c.id}`;
  }

  return (
    <div className="space-y-6">
      {/* Seletores */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Cidade 1</span>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}/{c.uf}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={trocar}
          aria-label="Trocar as duas cidades de lado"
          title="Trocar de lado"
          className="mx-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-primary"
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
        </button>

        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Cidade 2</span>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}/{c.uf}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cidadeA && cidadeB && (
        <>
          <div className="flex flex-wrap gap-3">
            <Link
              href={rotaCidade(cidadeA)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              Ver {cidadeA.nome} <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <Link
              href={rotaCidade(cidadeB)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              Ver {cidadeB.nome} <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </div>

          <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Comparação de indicadores entre {cidadeA.nome} e {cidadeB.nome}
              </caption>
              <thead className="border-b border-border bg-surface-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Indicador</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {cidadeA.nome}/{cidadeA.uf}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {cidadeB.nome}/{cidadeB.uf}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.map((l) => (
                  <tr key={l.id} className="align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-foreground">
                      <span className="block">{l.rotulo}</span>
                      <span className="mt-0.5 block text-xs font-normal text-muted">{l.ajuda}</span>
                    </th>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${
                        l.maior === "A" ? "font-bold text-primary" : "text-foreground"
                      }`}
                    >
                      {l.textoA}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${
                        l.maior === "B" ? "font-bold text-primary" : "text-foreground"
                      }`}
                    >
                      {l.textoB}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                      {l.diferenca}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            O realce marca o maior valor, não a melhor cidade. Cidades têm
            tamanhos e realidades diferentes: por isso o valor por habitante
            aparece separado. Fonte: acervo de cidades do portal (IBGE e fontes
            oficiais){dataAcervo ? `, gerado em ${dataAcervo}` : ""}. Confira a
            fonte de cada número na página da cidade.
          </p>
        </>
      )}
    </div>
  );
}
