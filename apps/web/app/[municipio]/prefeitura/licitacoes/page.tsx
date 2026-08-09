import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import {
  fetchLicitacoes,
  getSituacoesLicitacoes,
  getModalidadesLicitacoes,
  LICITACOES_PAGE_SIZE,
} from "@/lib/betim/licitacoes";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Licitações — Prefeitura | ${nomePortal(c)}`,
  (c) => `Processos de licitação da Prefeitura de ${c.nome}, dados públicos via PNCP.`
);

interface LicitacoesPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{
    ano?: string;
    situacao?: string;
    modalidade?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function LicitacoesPage({
  params: rota,
  searchParams,
}: LicitacoesPageProps) {
  const cidade = await cidadeDaRota(rota);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, somaEstimado, configured, ok }, situacoes, modalidades] =
    await Promise.all([
      fetchLicitacoes(cidade.id_municipio, {
        ano: params.ano,
        situacao: params.situacao,
        modalidade: params.modalidade,
        q: params.q,
        page,
      }),
      getSituacoesLicitacoes(cidade.id_municipio),
      getModalidadesLicitacoes(cidade.id_municipio),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / LICITACOES_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      ano: params.ano,
      situacao: params.situacao,
      modalidade: params.modalidade,
      page: params.page,
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== "") qs.set(key, String(value));
    });
    const str = qs.toString();
    return str ? `?${str}` : "";
  };

  const hasActiveFilters = Boolean(
    params.q || params.ano || params.situacao || params.modalidade
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Licitações</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Licitações
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Processos de compra pública da Prefeitura, do Portal Nacional de
        Contratações Públicas (PNCP) — a fase{" "}
        <strong className="font-medium text-text">anterior</strong> ao
        contrato assinado.{" "}
        <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
          Ver contratos já firmados →
        </Link>
      </p>

      <form
        method="GET"
        className="mt-6 mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Objeto ou órgão"
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
            Ano
          </label>
          <input
            id="ano"
            name="ano"
            defaultValue={params.ano ?? ""}
            placeholder="2025"
            inputMode="numeric"
            className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="modalidade" className="mb-1 text-xs font-medium text-text-soft">
            Modalidade
          </label>
          <select
            id="modalidade"
            name="modalidade"
            defaultValue={params.modalidade ?? ""}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            {modalidades.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="situacao" className="mb-1 text-xs font-medium text-text-soft">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={params.situacao ?? ""}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            {situacoes.map((s) => (
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
        {hasActiveFilters && (
          <Link href="/prefeitura/licitacoes" className="text-sm text-text-soft hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DataCard
          title="Licitações encontradas"
          source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
        </DataCard>
        <DataCard
          title="Valor total estimado"
          source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            {formatCurrencyBRL(somaEstimado)}
          </p>
          <p className="mt-1 text-xs">
            valor estimado pela Prefeitura antes da disputa — não é o valor final
          </p>
        </DataCard>
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && hasActiveFilters
            ? "Nenhuma licitação encontrada para esses filtros."
            : "Nenhuma licitação encontrada no momento."}
        </div>
      ) : (
        <>
          <TabelaScroll>
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[.82em] tracking-wide text-text-soft uppercase">
                  <th className="px-4.5 py-3.5">Modalidade</th>
                  <th className="px-4.5 py-3.5">Órgão</th>
                  <th className="px-4.5 py-3.5">Objeto</th>
                  <th className="px-4.5 py-3.5">Valor estimado</th>
                  <th className="px-4.5 py-3.5">Situação</th>
                  <th className="px-4.5 py-3.5">Publicação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4.5 py-3.5 whitespace-nowrap text-text-soft">
                      {row.modalidade_nome ?? "—"}
                    </td>
                    <td className="max-w-xs px-4.5 py-3.5 align-top">
                      <p className="truncate font-medium text-text" title={row.orgao_nome ?? undefined}>
                        {row.orgao_nome ?? "—"}
                      </p>
                      {row.unidade_nome && (
                        <p className="truncate text-xs text-text-soft" title={row.unidade_nome}>
                          {row.unidade_nome}
                        </p>
                      )}
                    </td>
                    <td className="max-w-md px-4.5 py-3.5 align-top text-text-soft">
                      <p className="truncate" title={row.objeto ?? undefined}>
                        {row.objeto ?? "—"}
                      </p>
                      {row.link_sistema_origem && (
                        <a
                          href={row.link_sistema_origem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
                        >
                          Ver no sistema de origem ↗
                        </a>
                      )}
                    </td>
                    <td className="font-tabular px-4.5 py-3.5 font-semibold whitespace-nowrap text-text">
                      {row.valor_estimado != null ? formatCurrencyBRL(row.valor_estimado) : "—"}
                      {row.valor_homologado != null && (
                        <p className="font-tabular text-xs font-normal text-text-soft">
                          homologado: {formatCurrencyBRL(row.valor_homologado)}
                        </p>
                      )}
                    </td>
                    <td className="px-4.5 py-3.5">
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                        {row.situacao ?? "—"}
                      </span>
                    </td>
                    <td className="font-tabular px-4.5 py-3.5 whitespace-nowrap text-text-soft">
                      {formatDateBR(row.data_publicacao_pncp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelaScroll>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-tabular text-text-soft">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                aria-disabled={page <= 1}
                className={`font-tabular rounded-lg border border-border px-3 py-1.5 ${
                  page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-2"
                }`}
                href={buildQuery({ page: page - 1 })}
              >
                ‹ Anterior
              </Link>
              <Link
                aria-disabled={page >= totalPages}
                className={`font-tabular rounded-lg border border-border px-3 py-1.5 ${
                  page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-surface-2"
                }`}
                href={buildQuery({ page: page + 1 })}
              >
                Próxima ›
              </Link>
            </div>
          </div>

          <PedidoLAI orgao="prefeitura" />
        </>
      )}
    </div>
  );
}
