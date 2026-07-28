import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import { getConveniosFederais, CONVENIO_URL_BASE } from "@/lib/betim/convenios";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";

export const metadata = {
  title: "Emendas Parlamentares / Repasses Federais — Controle Popular Betim",
  description:
    "Convênios e repasses federais recebidos por Betim, com órgão de origem, valor e situação, via Portal da Transparência.",
};

export default async function EmendasPage() {
  const { configured, ok, convenios, valorTotal, valorLiberadoTotal, qtdComPrefeitura, porOrgao } =
    await getConveniosFederais();

  const temDados = configured && ok && convenios.length > 0;

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo="Emendas Parlamentares / Repasses Federais"
        descricao="Convênios e verbas federais de deputados, senadores e ministérios destinados a Betim, com valores e destino."
        motivo={
          configured
            ? "Nenhum convênio encontrado no momento."
            : "Depende da API do Portal da Transparência federal, ainda não configurada neste ambiente."
        }
      />
    );
  }

  const qtdEntidades = convenios.length - qtdComPrefeitura;
  const maiorOrgao = porOrgao[0] ?? null;
  const fatiaMaiorOrgao =
    maiorOrgao && valorTotal > 0 ? (maiorOrgao.valor / valorTotal) * 100 : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          Betim em Dados
        </Link>{" "}
        · <span className="text-text">Emendas Parlamentares / Repasses Federais</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Emendas Parlamentares / Repasses Federais
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Convênios e repasses do governo federal para Betim — dinheiro que sai
        de um ministério e chega à Prefeitura ou a uma entidade local para um
        propósito específico.
      </p>

      <div className="mt-8 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DataCard
          title="Convênios recebidos"
          source={{
            label: "Portal da Transparência",
            url: "https://portaldatransparencia.gov.br/convenios",
          }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            {formatNumberBR(convenios.length)}
          </p>
          <p className="mt-1 text-xs">
            {formatNumberBR(qtdComPrefeitura)} direto com a Prefeitura ·{" "}
            {formatNumberBR(qtdEntidades)} com entidades locais
          </p>
        </DataCard>
        <DataCard title="Valor total combinado">
          <p className="font-tabular text-2xl font-bold text-text">
            {formatCurrencyBRL(valorTotal)}
          </p>
          <p className="mt-1 text-xs">
            {formatCurrencyBRL(valorLiberadoTotal)} já liberado (
            {valorTotal > 0
              ? ((valorLiberadoTotal / valorTotal) * 100).toFixed(0)
              : "0"}
            %)
          </p>
        </DataCard>
        <DataCard title="Maior órgão de origem">
          {maiorOrgao && fatiaMaiorOrgao !== null ? (
            <>
              <p className="font-tabular text-2xl font-bold text-text">
                {fatiaMaiorOrgao.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs">do valor total veio de {maiorOrgao.nome}</p>
            </>
          ) : (
            <p className="text-xs">—</p>
          )}
        </DataCard>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que este dado é — e o que não é
        </h2>
        <p className="mt-2">
          Vem do <strong className="font-semibold text-text">Portal da Transparência</strong>{" "}
          do governo federal, na parte de convênios, filtrada por Betim. Cada
          linha é um acordo entre um órgão federal e quem recebeu o dinheiro —
          quase sempre a Prefeitura, às vezes uma entidade local como a APAE ou
          o Centro de Defesa dos Direitos Humanos de Betim.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-text">
            Não é a mesma coisa que "emenda de um deputado".
          </strong>{" "}
          A fonte não diz qual parlamentar indicou cada convênio — testamos, e
          pra Betim esse dado veio praticamente vazio. O que esta página mostra
          é o dinheiro que de fato chegou, tenha vindo de emenda ou não.
        </p>
        <p className="mt-2">
          "Valor combinado" é o total do acordo. "Liberado" é o que já foi
          repassado até agora. A diferença costuma ser parcela que ainda não
          saiu — não é dinheiro perdido.
        </p>
      </section>

      {porOrgao.length > 0 && (
        <div className="mb-6">
          <DataCard title="Por órgão de origem">
            <ul className="flex flex-col gap-2">
              {porOrgao.map((o) => {
                const fatia = valorTotal > 0 ? (o.valor / valorTotal) * 100 : 0;
                return (
                  <li
                    key={o.nome}
                    className="flex items-center gap-3"
                    title={`${o.nome}: ${formatCurrencyBRL(o.valor)} em ${o.qtd} ${o.qtd === 1 ? "convênio" : "convênios"} (${fatia.toFixed(1)}% do total)`}
                  >
                    <span className="w-48 min-w-0 shrink-0 truncate text-xs sm:w-56">
                      {o.nome} ({o.qtd})
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(fatia, 2)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-right font-tabular text-xs whitespace-nowrap">
                      {formatCurrencyBRL(o.valor)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </DataCard>
        </div>
      )}

      <TabelaScroll>
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left text-[.82em] tracking-wide text-text-soft uppercase">
              <th className="px-4.5 py-3.5">Objeto</th>
              <th className="px-4.5 py-3.5">Órgão</th>
              <th className="px-4.5 py-3.5">Recebeu</th>
              <th className="px-4.5 py-3.5">Valor</th>
              <th className="px-4.5 py-3.5">Situação</th>
              <th className="px-4.5 py-3.5">Vigência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {convenios.map((c) => (
              <tr key={c.id}>
                <td className="max-w-md px-4.5 py-3.5 align-top text-text-soft">
                  <p className="truncate" title={c.objeto ?? undefined}>
                    {c.objeto ?? "—"}
                  </p>
                  {c.numeroConvenio && (
                    <p className="mt-0.5 text-xs">
                      Nº{" "}
                      {c.codigo ? (
                        <a
                          href={`${CONVENIO_URL_BASE}${c.codigo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          {c.numeroConvenio} ↗
                        </a>
                      ) : (
                        c.numeroConvenio
                      )}
                    </p>
                  )}
                </td>
                <td className="px-4.5 py-3.5 align-top text-text-soft">
                  {c.orgaoSigla ?? c.orgaoNome ?? "—"}
                </td>
                <td className="px-4.5 py-3.5 align-top font-medium text-text">
                  {c.convenenteNome ?? "—"}
                </td>
                <td className="font-tabular px-4.5 py-3.5 align-top font-semibold whitespace-nowrap text-text">
                  {formatCurrencyBRL(c.valor)}
                </td>
                <td className="px-4.5 py-3.5 align-top">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                    {c.situacao ?? "—"}
                  </span>
                </td>
                <td className="font-tabular px-4.5 py-3.5 align-top whitespace-nowrap text-text-soft">
                  {formatDateBR(c.dataInicioVigencia)} – {formatDateBR(c.dataFinalVigencia)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabelaScroll>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <div>
          <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
          <p className="mt-1 text-sm text-text-soft">
            Todo convênio pode ser buscado pelo número no Portal da
            Transparência.
          </p>
        </div>
        <Link
          href="https://portaldatransparencia.gov.br/convenios"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          Portal da Transparência ↗
        </Link>
      </div>
    </div>
  );
}
