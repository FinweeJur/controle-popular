import Link from "@/lib/betim/link";
import DataCard from "@/app/betim/components/DataCard";
import { getObras } from "@/lib/betim/obras";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";

export const metadata = {
  title: "Obras públicas — Prefeitura de Betim — Controle Popular Betim",
  description:
    "Obras públicas da Prefeitura de Betim: objeto, situação, valor e percentual de execução.",
};

interface ObrasPageProps {
  searchParams: Promise<{ situacao?: string }>;
}

export default async function ObrasPage({ searchParams }: ObrasPageProps) {
  const { situacao } = await searchParams;
  const { obras, situacoesDisponiveis, total, valorTotal, ok } = await getObras(situacao);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Obras</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Obras públicas
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Obras da Prefeitura de Betim — objeto, situação, valor e quanto já foi
        executado.
      </p>

      {!ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Nenhuma obra encontrada no momento.
        </div>
      ) : (
        <>
          <div className="mt-6 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataCard
              title="Obras cadastradas"
              source={{ label: "Prefeitura de Betim", url: "https://www.betim.mg.gov.br" }}
            >
              <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
            </DataCard>
            <DataCard title="Valor total das obras">
              <p className="font-tabular text-2xl font-bold text-text">
                {formatCurrencyBRL(valorTotal)}
              </p>
            </DataCard>
          </div>

          <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="situacao" className="mb-1 text-xs font-medium text-text-soft">
                Situação
              </label>
              <select
                id="situacao"
                name="situacao"
                defaultValue={situacao ?? ""}
                className="w-64 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todas</option>
                {situacoesDisponiveis.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
            >
              Filtrar
            </button>
            {situacao && (
              <Link href="/prefeitura/obras" className="pb-1.5 text-sm text-text-soft hover:underline">
                Limpar
              </Link>
            )}
          </form>

          <ul className="flex flex-col gap-3">
            {obras.map((o, i) => (
              <li key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="max-w-2xl font-medium text-text">{o.nome}</p>
                  {o.situacao && (
                    <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                      {o.situacao}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  {o.valor != null && o.valor > 0 && (
                    <span className="font-tabular font-semibold text-text">
                      {formatCurrencyBRL(o.valor)}
                    </span>
                  )}
                  {o.percentualExecucao != null && (
                    <span className="text-text-soft">
                      {o.percentualExecucao.toFixed(0)}% executado
                    </span>
                  )}
                </div>
                {o.percentualExecucao != null && (
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
                    title={`${o.percentualExecucao.toFixed(0)}% executado`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{
                        width: `${Math.min(Math.max(o.percentualExecucao, 0), 100)}%`,
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-text-soft">
            Fonte: portal de transparência da Prefeitura de Betim. O valor é o
            valor total previsto da obra; &quot;% executado&quot; é o
            andamento informado pela própria Prefeitura.
          </p>
        </>
      )}
    </div>
  );
}
