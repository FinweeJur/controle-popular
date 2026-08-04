"use client";

import { useState } from "react";
import Link from "@/lib/betim/link";
import {
  composicaoPontuacao,
  PROPOSICAO_TIERS,
  type RankingVereador,
} from "@/lib/betim/vereadores";
import { formatNumberBR } from "@/lib/betim/format";
import StackedPointsBar from "./StackedPointsBar";
import OrdinalLegend from "./OrdinalLegend";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

export interface RankingVereadoresProps {
  rows: RankingVereador[];
  /** Barra mais alta (usado em /camara e na página do vereador). A lista
   *  de rótulos diretos embaixo da barra aparece sempre, nos dois casos. */
  detalhado?: boolean;
}

/**
 * Ranking de atuação legislativa como gráfico de barras empilhadas.
 *
 * O problema que isso resolve: a lista de texto anterior mostrava só o
 * total, então "por que fulano tem 416 e sicrano 193?" ficava sem
 * resposta visual. Aqui cada barra é dividida pelos PONTOS que cada tipo
 * de proposição contribuiu — dá pra ver de relance que o 1º lugar está
 * na frente por causa dos Projetos de Lei (peso 15), não por volume de
 * indicações (peso 1).
 *
 * Vem sempre com a visão de tabela: é o caminho acessível pro mesmo dado
 * (leitor de tela, e o alívio exigido pelo degrau mais claro da rampa,
 * que fica abaixo de 3:1 no tema claro).
 */
export default function RankingVereadores({
  rows,
  detalhado = false,
}: RankingVereadoresProps) {
  const [vista, setVista] = useState<"grafico" | "tabela">("grafico");

  const max = rows.reduce((m, r) => Math.max(m, r.pontuacao), 0);
  if (max <= 0) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <OrdinalLegend />
        <div
          role="group"
          aria-label="Formato de visualização"
          className="inline-flex overflow-hidden rounded-lg border border-border text-xs"
        >
          {(["grafico", "tabela"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              aria-pressed={vista === v}
              className={`px-2.5 py-1 font-medium transition-colors ${
                vista === v
                  ? "bg-primary text-primary-ink"
                  : "bg-surface text-text-soft hover:text-text"
              }`}
            >
              {v === "grafico" ? "Gráfico" : "Tabela"}
            </button>
          ))}
        </div>
      </div>

      {vista === "tabela" ? (
        <TabelaRanking rows={rows} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <ul className="divide-y divide-border">
            {rows.map((v, i) => {
              const segmentos = composicaoPontuacao(v.linhas);
              return (
                <li key={v.id} className="px-4.5 py-3.5">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <Link
                      href={`/vereadores/${v.slug}`}
                      className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-text hover:text-primary"
                    >
                      <span className="font-tabular w-7 shrink-0 text-sm text-text-soft">
                        {i + 1}º
                      </span>
                      <span className="font-medium">{v.nome_urna ?? "—"}</span>
                      {v.partido ? (
                        <span className="text-xs text-text-soft">{v.partido}</span>
                      ) : null}
                    </Link>
                    <strong className="font-tabular shrink-0 text-text">
                      {formatNumberBR(v.pontuacao)}
                      <span className="ml-1 text-xs font-normal text-text-soft">pts</span>
                    </strong>
                  </div>

                  <div className="sm:pl-9.5">
                    <StackedPointsBar
                      segmentos={segmentos}
                      total={v.pontuacao}
                      max={max}
                      altura={detalhado ? "md" : "sm"}
                    />

                    {/* Sempre visível (não só no hover): é a explicação do
                        "porquê" que a barra sozinha não dá — quantos de
                        cada tipo, e quanto isso valeu em pontos. */}
                    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {segmentos.map((s) => (
                        <li
                          key={s.tier.slot}
                          className="flex items-center gap-1.5 text-xs text-text-soft"
                        >
                          <span
                            aria-hidden
                            className={`cp-ord-seg cp-ord-seg-${s.tier.slot} h-2 w-2 shrink-0 rounded-[2px]`}
                            style={{ background: COR_POR_SLOT[s.tier.slot] }}
                          />
                          <span className="font-tabular text-text">{formatNumberBR(s.qtd)}</span>
                          {s.tier.labelCurto}
                          <span className="font-tabular text-text-soft/80">
                            = {formatNumberBR(s.pontos)} {s.pontos === 1 ? "pt" : "pts"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Mesmo dado do gráfico, em tabela — a rota acessível e copiável. */
function TabelaRanking({ rows }: { rows: RankingVereador[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">
          Ranking de atuação legislativa por vereador, com a quantidade de
          proposições de cada tipo e os pontos que cada tipo contribuiu.
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-soft">
            <th scope="col" className="px-3 py-2.5 font-medium">
              #
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Vereador
            </th>
            {PROPOSICAO_TIERS.map((t) => (
              <th key={t.slot} scope="col" className="px-3 py-2.5 text-right font-medium">
                {t.label}
                <span className="block font-normal text-text-soft/80">×{t.peso}</span>
              </th>
            ))}
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((v, i) => {
            const porSlot = new Map(composicaoPontuacao(v.linhas).map((s) => [s.tier.slot, s]));
            return (
              <tr key={v.id}>
                <td className="font-tabular px-3 py-2.5 text-text-soft">{i + 1}º</td>
                <th scope="row" className="px-3 py-2.5 text-left font-medium">
                  <Link href={`/vereadores/${v.slug}`} className="text-text hover:text-primary">
                    {v.nome_urna ?? "—"}
                  </Link>
                  {v.partido ? (
                    <span className="ml-1.5 text-xs font-normal text-text-soft">{v.partido}</span>
                  ) : null}
                </th>
                {PROPOSICAO_TIERS.map((t) => {
                  const s = porSlot.get(t.slot);
                  return (
                    <td key={t.slot} className="font-tabular px-3 py-2.5 text-right">
                      {s ? (
                        <>
                          <span className="text-text">{formatNumberBR(s.qtd)}</span>
                          <span className="ml-1 text-xs text-text-soft">
                            ({formatNumberBR(s.pontos)})
                          </span>
                        </>
                      ) : (
                        <span className="text-text-soft/60">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="font-tabular px-3 py-2.5 text-right font-semibold text-text">
                  {formatNumberBR(v.pontuacao)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
