"use client";

import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import type { ConvenioFederal } from "@/lib/betim/convenios";
import { CONVENIO_URL_BASE } from "@/lib/betim/convenios";
import { formatCurrencyBRL, formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/emendas`, servida por índice estático fatiado.
 *
 * Substituiu um `convenios.map()` inline que renderizava tudo no servidor.
 * Ver o porquê em `dados/[arquivo]/route.ts`: com os 3.000 convênios de Belo
 * Horizonte, a entrada de cache da página chegou a 24,11 MB e passou a
 * estourar o upload de assets do Cloudflare.
 */
type LinhaConvenio = ConvenioFederal & Record<string, unknown>;

const COLUNAS: ColunaTabela<LinhaConvenio>[] = [
  {
    chave: "objeto",
    rotulo: "Objeto",
    formatar: (c) => (
      <div className="flex flex-col gap-1">
        <ObjetoExpansivel texto={c.objeto} />
        {c.numeroConvenio && (
          <span className="text-[.8em] text-text-soft">
            Nº{" "}
            {c.codigo ? (
              <a
                href={`${CONVENIO_URL_BASE}${c.codigo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {c.numeroConvenio} ↗
              </a>
            ) : (
              c.numeroConvenio
            )}
          </span>
        )}
      </div>
    ),
  },
  {
    chave: "orgaoSigla",
    rotulo: "Órgão",
    formatar: (c) => c.orgaoSigla ?? c.orgaoNome ?? "—",
  },
  {
    chave: "convenenteNome",
    rotulo: "Recebeu",
    formatar: (c) => <span className="font-medium text-text">{c.convenenteNome ?? "—"}</span>,
  },
  {
    chave: "valor",
    rotulo: "Valor",
    numerica: true,
    formatar: (c) => formatCurrencyBRL(c.valor),
  },
  {
    chave: "situacao",
    rotulo: "Situação",
    formatar: (c) => (
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
        {c.situacao ?? "—"}
      </span>
    ),
  },
  {
    chave: "dataInicioVigencia",
    rotulo: "Vigência",
    formatar: (c) =>
      `${formatDateBR(c.dataInicioVigencia)} – ${formatDateBR(c.dataFinalVigencia)}`,
  },
];

export default function ListaEmendas({ base }: { base: string }) {
  return (
    <TabelaEstatica<LinhaConvenio>
      base={base}
      colunas={COLUNAS}
      camposBusca={["objeto", "convenenteNome", "orgaoNome", "orgaoSigla"]}
      vazio="Nenhum convênio encontrado."
    />
  );
}
