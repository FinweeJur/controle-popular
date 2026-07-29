import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor, { type BarraItem } from "@/app/[municipio]/components/charts/BarrasValor";
import { getDespesasPorFuncao } from "@/lib/betim/despesas";
import { formatCurrencyBRL } from "@/lib/betim/format";
import { cidadeDaRota } from "@/lib/betim/cidade";

export const metadata = {
  title: "Despesas por função — Prefeitura de Betim — Controle Popular Betim",
  description:
    "Quanto a Prefeitura de Betim gastou em cada função de governo (Saúde, Educação, Urbanismo…), com o valor e a fatia do total.",
};

interface DespesasPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ ano?: string }>;
}

export default async function DespesasPage({
  params,
  searchParams,
}: DespesasPageProps) {
  const cidade = await cidadeDaRota(params);
  const { ano: anoParam } = await searchParams;
  const dados = await getDespesasPorFuncao(
    cidade.id_municipio,
    anoParam ? Number(anoParam) : undefined
  );

  const itens: BarraItem[] = dados.funcoes.map((f) => ({
    label: f.funcao,
    valor: f.valor,
    sublabel: `· ${f.pct.toFixed(1)}%`,
    titulo: `${f.funcao}: ${formatCurrencyBRL(f.valor)} (${f.pct.toFixed(1)}% das despesas por função em ${dados.ano})`,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Despesas</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Despesas por função
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quanto a Prefeitura de Betim gastou em cada área — saúde, educação,
        urbanismo e assim por diante. Mostra pra onde o dinheiro foi.
      </p>

      {!dados.ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Dados de despesas ainda não disponíveis.
        </div>
      ) : (
        <>
          {dados.anosDisponiveis.length > 1 && (
            <form method="GET" className="mt-6 flex items-end gap-3">
              <div className="flex flex-col">
                <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
                  Ano
                </label>
                <select
                  id="ano"
                  name="ano"
                  defaultValue={String(dados.ano)}
                  className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                >
                  {dados.anosDisponiveis.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
              >
                Ver
              </button>
            </form>
          )}

          <div className="mt-6">
            <DataCard
              title={`Despesas pagas por função em ${dados.ano}`}
              source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
            >
              <p className="mb-4 text-sm text-text-soft">
                Total por função:{" "}
                <strong className="font-tabular text-text">
                  {formatCurrencyBRL(dados.total)}
                </strong>{" "}
                — a barra de cada área é proporcional à maior.
              </p>
              <BarrasValor itens={itens} formatValor={formatCurrencyBRL} />
              <p className="mt-4 text-xs text-text-soft">
                Mostra o que a Prefeitura de fato <strong>pagou</strong> em
                cada área ao longo do ano. Não inclui alguns repasses internos
                entre órgãos, então o total pode ficar um pouco abaixo do gasto
                do ano inteiro.
              </p>
            </DataCard>
          </div>
        </>
      )}
    </div>
  );
}
