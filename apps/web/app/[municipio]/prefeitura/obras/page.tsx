import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getObras } from "@/lib/betim/obras";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Obras públicas — Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Obras públicas da Prefeitura de ${c.nome}: objeto, situação, valor e percentual de execução.`
);

interface ObrasPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ situacao?: string }>;
}

export default async function ObrasPage({ params, searchParams }: ObrasPageProps) {
  const cidade = await cidadeDaRota(params);
  const { situacao } = await searchParams;
  const { obras, situacoesDisponiveis, total, valorTotal, comValor, ok } = await getObras(
    cidade.id_municipio,
    situacao
  );

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
      {/* O QUE A PAGINA COBRE SAI DO DADO, nao de um texto fixo. As 595
          obras de Belo Horizonte estao TODAS como "Concluido" — a SUDECAP so
          publica obra terminada —, enquanto Betim traz INICIADA, EM
          LICITACAO, PARALISADA. Uma pagina chamada "Obras publicas" que
          mostra so concluidas, sem dizer, sugere que a cidade nao tem obra em
          andamento. E tambem nao adianta prometer "valor" onde a fonte nao
          publica valor. */}
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Obras da Prefeitura de {cidade.nome} — objeto, situação
        {comValor > 0 && ", valor"} e quanto já foi executado.
        {situacoesDisponiveis.length === 1 && (
          <>
            {" "}
            <strong className="text-text">
              A fonte publica apenas obras com situação
              &quot;{situacoesDisponiveis[0]}&quot;
            </strong>
            , então esta lista não mostra o que está em andamento.
          </>
        )}
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
              source={{ label: `Prefeitura de ${cidade.nome}` }}
            >
              <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
            </DataCard>
            {/* R$ 0,00 e uma AFIRMACAO — diz que as obras nao custaram nada.
                A SUDECAP publica situacao e percentual executado das 595
                obras de BH mas NAO publica valor, e somar nulos dava
                exatamente essa mentira. Quando nenhuma obra tem valor, o card
                diz que a fonte nao informa; quando so parte tem, diz sobre
                quantas o total fala. */}
            <DataCard title="Valor total das obras">
              {comValor === 0 ? (
                <>
                  <p className="text-lg font-semibold text-text-soft">não informado</p>
                  <p className="mt-1 text-xs text-text-soft">
                    A fonte de {cidade.nome} publica a situação e o andamento das
                    obras, mas não o valor.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatCurrencyBRL(valorTotal)}
                  </p>
                  {comValor < total && (
                    <p className="mt-1 text-xs text-text-soft">
                      Soma de {formatNumberBR(comValor)} das {formatNumberBR(total)} obras
                      — as demais não têm valor publicado.
                    </p>
                  )}
                </>
              )}
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
            Fonte: portal de transparência da Prefeitura de {cidade.nome}.
            {comValor > 0 && " O valor é o valor total previsto da obra;"}{" "}
            &quot;% executado&quot; é o andamento informado pela própria
            Prefeitura.
          </p>
        </>
      )}
    </div>
  );
}
