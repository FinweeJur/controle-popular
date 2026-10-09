import type { ReactElement } from "react";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";

/**
 * Gráficos SVG da página de gastos de campanha — componentes de servidor,
 * sem biblioteca de gráfico e sem cliente: mesmo motivo dos gráficos de
 * `ambiental/licencas` (teto de payload; AGENTS.md § 5.1 cora lista vinda
 * como props de cliente, e gráfico pesado repete o pecado).
 *
 * Padrão seguido (regra do AGENTS.md § 8, qualidade de gráfico):
 * - `role="img"` + `aria-label` no `<svg>`;
 * - cada barra com `<title>` (tooltip nativo);
 * - parágrafo "Barras descritas" abaixo, com todos os valores em texto —
 *   a leitura não depende de enxergar a barra;
 * - cor nunca é o único canal: a legenda traz rótulo + cor, e o parágrafo
 *   repete o valor por rótulo.
 */

/** Rótulos legíveis das chaves de grupo do ETL, na ordem de exibição. */
const ORDEM_GRUPOS = ["materiais", "digital", "rua", "imprensa", "audiovisual", "outros"] as const;
const ROTULO_GRUPO: Record<string, string> = {
  materiais: "Materiais",
  digital: "Digital",
  rua: "Rua",
  imprensa: "Imprensa",
  audiovisual: "Audiovisual",
  outros: "Outros",
};

const COR_CONTRATADO = "var(--cp-primary)";
const COR_PAGO = "var(--cp-accent)";

/** Legenda em HTML acima do SVG (o SVG só carrega as barras). */
function Legenda() {
  return (
    <p className="mb-2 flex flex-wrap items-center gap-4 text-xs opacity-80">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_CONTRATADO }} aria-hidden="true" />
        contratado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_PAGO }} aria-hidden="true" />
        pago
      </span>
    </p>
  );
}

/**
 * Barras pareadas por grupo de despesa: o que foi CONTRATADO (prometido em
 * contrato) ao lado do que foi PAGO até a coleta — as duas medidas não se
 * somam (o "pago" é parcela do "contratado", AGENTS.md § 8: número vindo do
 * dado, com ressalva colada).
 */
export function GraficoGrupos({
  grupos,
}: {
  grupos: Record<string, { contratado: number; pago: number }>;
}): ReactElement {
  const entradas = ORDEM_GRUPOS.filter((g) => grupos[g]).map((g) => ({
    chave: g,
    rotulo: ROTULO_GRUPO[g] ?? g,
    ...grupos[g],
  }));
  const max = Math.max(1, ...entradas.flatMap((e) => [e.contratado, e.pago]));
  const larguraGrupo = 96;
  const largura = Math.max(320, entradas.length * larguraGrupo);
  const base = 96;
  const alturaBarra = (v: number) => Math.max(v > 0 ? 2 : 0, (v / max) * 80);

  return (
    <figure className="rounded-xl border border-[var(--cp-border)] p-4">
      <figcaption className="mb-2 text-sm font-semibold">
        O que foi contratado e o que já foi pago, por grupo
        <span className="ml-2 text-xs font-normal opacity-70">
          valores em reais na coleta de 09/10/2026 — parcela paga, não total final
        </span>
      </figcaption>
      <Legenda />
      <svg
        viewBox={`0 0 ${largura} 116`}
        role="img"
        aria-label="Gráfico de barras: despesa contratada e paga em cada grupo de publicidade de campanha"
        className="w-full"
      >
        {entradas.map((e, i) => {
          const x = i * larguraGrupo;
          const hC = alturaBarra(e.contratado);
          const hP = alturaBarra(e.pago);
          return (
            <g key={e.chave}>
              <rect x={x + 14} y={base - hC} width={32} height={hC} fill={COR_CONTRATADO} opacity={0.85}>
                <title>{`${e.rotulo} contratado: ${formatCurrencyCompactaBR(e.contratado)}`}</title>
              </rect>
              <rect x={x + 50} y={base - hP} width={32} height={hP} fill={COR_PAGO} opacity={0.9}>
                <title>{`${e.rotulo} pago: ${formatCurrencyCompactaBR(e.pago)}`}</title>
              </rect>
              <text x={x + 48} y={base + 14} textAnchor="middle" fontSize="10" opacity={0.75}>
                {e.rotulo}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs opacity-70">
        Barras descritas:{" "}
        {entradas
          .map((e) => `${e.rotulo}: contratado ${formatCurrencyCompactaBR(e.contratado)}, pago ${formatCurrencyCompactaBR(e.pago)}`)
          .join(" · ")}
      </p>
    </figure>
  );
}

/**
 * Série mensal do que as big techs receberam das campanhas, agregada por
 * mês de lançamento da despesa. As datas vêm COMO DECLARADAS na fonte — uma
 * linha de 2028-08 existe no arquivo do TSE e é exibida sem correção (a
 * fonte manda; inventar data seria pior).
 */
export function GraficoMensalBigTech({
  serie,
}: {
  serie: { mes: string; total: number }[];
}): ReactElement {
  const ordenada = [...serie].sort((a, b) => a.mes.localeCompare(b.mes));
  const max = Math.max(1, ...ordenada.map((m) => m.total));
  const larguraGrupo = 64;
  const largura = Math.max(320, ordenada.length * larguraGrupo);
  const base = 88;
  const alturaBarra = (v: number) => Math.max(v > 0 ? 2 : 0, (v / max) * 66);
  const rotuloMes = (mes: string) => {
    const m = /^(\d{4})-(\d{2})$/.exec(mes);
    return m ? `${m[2]}/${m[1].slice(2)}` : mes;
  };

  return (
    <figure className="rounded-xl border border-[var(--cp-border)] p-4">
      <figcaption className="mb-2 text-sm font-semibold">
        Pagamento mensal a big techs (Meta, Google e TikTok)
        <span className="ml-2 text-xs font-normal opacity-70">
          soma das empresas na coleta de 09/10/2026
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${largura} 112`}
        role="img"
        aria-label="Gráfico de barras mensal: quanto as campanhas pagaram a big techs a cada mês"
        className="w-full"
      >
        {ordenada.map((m, i) => {
          const x = i * larguraGrupo;
          const h = alturaBarra(m.total);
          return (
            <g key={m.mes}>
              <rect x={x + 14} y={base - h} width={36} height={h} fill={COR_PAGO} opacity={0.9}>
                <title>{`${rotuloMes(m.mes)}: ${formatCurrencyCompactaBR(m.total)}`}</title>
              </rect>
              <text x={x + 32} y={base - h - 4} textAnchor="middle" fontSize="8" opacity={0.8}>
                {formatCurrencyCompactaBR(m.total).replace("R$ ", "")}
              </text>
              <text x={x + 32} y={base + 13} textAnchor="middle" fontSize="9" opacity={0.75}>
                {rotuloMes(m.mes)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs opacity-70">
        Barras descritas:{" "}
        {ordenada.map((m) => `${rotuloMes(m.mes)} ${formatCurrencyCompactaBR(m.total)}`).join(" · ")}
      </p>
    </figure>
  );
}
