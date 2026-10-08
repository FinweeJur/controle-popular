/**
 * SecaoDoacoes — seção "Doações de campanha" da página de vereador.
 *
 * Extraída do `VereadorPage` em 08/10/2026 (hotspots CodeScene, saúde 7,31).
 */
import DataCard from "@/app/[municipio]/components/DataCard";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";

interface Doacoes {
  ok: boolean;
  total: number;
  soma: number;
  rows: { doador_nome: string | null; doador_tipo: string | null; valor: number | null }[];
}

export function SecaoDoacoes({ doacoes }: { doacoes: Doacoes }) {
  if (!doacoes.ok || doacoes.total === 0) return null;

  return (
    <div className="mt-8">
      <DataCard
        title="Doações de campanha (2024) — quem financiou"
        source={{ label: "TSE / Base dos Dados", url: "https://www.tse.jus.br/" }}
      >
        <p className="mb-3 text-text">
          {formatNumberBR(doacoes.total)}{" "}
          {doacoes.total === 1 ? "doação" : "doações"}, total{" "}
          <strong className="font-tabular"><Moeda value={doacoes.soma} /></strong>
        </p>
        <ul className="divide-y divide-border/60">
          {doacoes.rows.slice(0, 8).map((d, i) => (
            <LinhaDoador key={i} d={d} />
          ))}
        </ul>
        {doacoes.rows.length > 8 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">
              Ver todos os {formatNumberBR(doacoes.rows.length)} doadores
            </summary>
            <ul className="mt-2 divide-y divide-border/60">
              {doacoes.rows.slice(8).map((d, i) => (
                <LinhaDoador key={i} d={d} />
              ))}
            </ul>
          </details>
        )}
        <p className="mt-3 text-[.85em] text-text-soft">
          O nome de quem doou para campanha é público por lei (Lei
          9.504/97) — a divulgação do financiamento eleitoral é
          obrigatória. Valores prestados à Justiça Eleitoral em 2024.
        </p>
      </DataCard>
    </div>
  );
}

function LinhaDoador({ d }: { d: { doador_nome: string | null; doador_tipo: string | null; valor: number | null } }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-text-soft">
        {d.doador_nome ?? "—"}
        {d.doador_tipo && (
          <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            {d.doador_tipo === "PJ" ? "empresa" : "pessoa"}
          </span>
        )}
      </span>
      <span className="font-tabular shrink-0 text-text">
        {d.valor != null ? <Moeda value={d.valor} /> : "—"}
      </span>
    </li>
  );
}
