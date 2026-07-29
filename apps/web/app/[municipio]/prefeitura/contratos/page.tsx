import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import { fetchContratos, CONTRATOS_PAGE_SIZE, MOTIVO_ALERTA_INFO } from "@/lib/betim/contratos";
import { getTemasPrefeitura, TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Contratos da Prefeitura — ${nomePortal(c)}`,
  (c) => `Lista de contratos administrativos da Prefeitura de ${c.nome}, dados públicos via PNCP.`
);

interface ContratosPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{
    ano?: string;
    status?: string;
    q?: string;
    alerta?: string;
    motivo?: string;
    tema?: string;
    page?: string;
  }>;
}

export default async function ContratosPage({
  params: rota,
  searchParams,
}: ContratosPageProps) {
  const cidade = await cidadeDaRota(rota);
  const municipio = cidade.slug;
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  // Um motivo específico já filtra por alerta=true implicitamente (ver
  // lib/contratos.ts) — o checkbox "somente com alerta" fica redundante
  // quando um motivo está selecionado, mas não atrapalha (mesmo filtro).
  const alerta = params.alerta === "1" || Boolean(params.motivo);

  const [{ rows, total, sum, totalAlertas, configured, ok }, temasPrefeitura] = await Promise.all([
    fetchContratos(cidade.id_municipio, {
      ano: params.ano,
      status: params.status,
      q: params.q,
      alerta,
      motivo: params.motivo,
      tema: params.tema,
      page,
    }),
    // Sempre sem filtro -- é "onde a Prefeitura gasta no geral", não
    // deveria mudar conforme o usuário filtra a tabela abaixo.
    getTemasPrefeitura(cidade.id_municipio),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CONTRATOS_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      ano: params.ano,
      status: params.status,
      alerta: params.alerta,
      motivo: params.motivo,
      tema: params.tema,
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

  const exportQs = new URLSearchParams({ format: "csv" });
  if (params.ano) exportQs.set("ano", params.ano);
  if (params.status) exportQs.set("status", params.status);
  if (params.q) exportQs.set("q", params.q);
  if (alerta) exportQs.set("alerta", "1");
  if (params.motivo) exportQs.set("motivo", params.motivo);
  if (params.tema) exportQs.set("tema", params.tema);
  // Componente de servidor não usa hook: a cidade vem do `params` da rota.
  const exportHref = `/${municipio}/api/contratos?${exportQs.toString()}`;

  const hasActiveFilters = Boolean(
    params.ano || params.status || params.q || alerta || params.motivo || params.tema
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
        · <span className="text-text">Contratos</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
            Contratos públicos
          </h1>
          <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
            Dados do Portal Nacional de Contratações Públicas (PNCP). Cada
            valor e fornecedor com link direto à fonte oficial.
          </p>
        </div>
        {/* `<a>` cru (não `<Link>`): é download de rota de API, e
            `exportHref` já traz a cidade. Um `<Link>` prependeria o
            basePath DE NOVO, gerando `/betim/betim/api/...` (404). */}
        <a
          href={exportHref}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          ↓ Exportar CSV
        </a>
      </div>

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
            placeholder="Objeto ou fornecedor"
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
          <label htmlFor="status" className="mb-1 text-xs font-medium text-text-soft">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="motivo" className="mb-1 text-xs font-medium text-text-soft">
            Tipo de alerta
          </label>
          <select
            id="motivo"
            name="motivo"
            defaultValue={params.motivo ?? ""}
            className="w-64 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Qualquer alerta</option>
            {Object.entries(MOTIVO_ALERTA_INFO).map(([codigo, info]) => (
              <option key={codigo} value={codigo}>
                {info.categoria === "violacao_legal" ? "⚠ " : "· "}
                {info.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="tema" className="mb-1 text-xs font-medium text-text-soft">
            Área/tema
          </label>
          <select
            id="tema"
            name="tema"
            defaultValue={params.tema ?? ""}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos os temas</option>
            {TEMAS_ORDENADOS.map((slug) => (
              <option key={slug} value={slug}>
                {TEMA_LABELS[slug]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-text">
          <input
            type="checkbox"
            name="alerta"
            value="1"
            defaultChecked={params.alerta === "1"}
            className="h-4 w-4 rounded border-border accent-alert"
          />
          Somente com alerta
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Filtrar
        </button>
        {hasActiveFilters && (
          <Link href="/prefeitura/contratos" className="text-sm text-text-soft hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DataCard
          title="Contratos encontrados"
          source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
        </DataCard>
        <DataCard
          title="Valor total (global)"
          source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">{formatCurrencyBRL(sum)}</p>
        </DataCard>
        <DataCard title="Contratos com alerta">
          <p
            className={`font-tabular inline-block rounded-lg text-2xl font-bold text-alert ${
              totalAlertas > 0 ? "cp-pulse-alert" : ""
            }`}
          >
            {formatNumberBR(totalAlertas)}
          </p>
          <Link
            href={buildQuery({ alerta: alerta ? undefined : 1, page: 1 })}
            className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
          >
            {alerta ? "ver todos os contratos" : "ver somente contratos com alerta"}
          </Link>
        </DataCard>
      </div>

      <p className="mb-6 text-xs text-text-soft">
        Todo alerta abaixo mostra a base legal ou o motivo estatístico que o
        gerou — nenhum é acusação.{" "}
        <Link href="/metodologia" className="font-medium text-accent hover:underline">
          Ver a metodologia completa de cada regra →
        </Link>
      </p>

      {temasPrefeitura.ok && temasPrefeitura.temas.length > 0 && (
        <div className="mb-6">
          <DataCard
            title="Áreas de atuação da Prefeitura"
            source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
          >
            <p className="mb-3 text-sm">
              Em quantos contratos cada área aparece — pra onde vai o gasto
              público, por tema. Clique numa área pra filtrar a lista
              abaixo.
            </p>
            <AreasAtuacao
              temas={temasPrefeitura.temas}
              unidade="contratos"
              unidadeSingular="contrato"
              hrefFiltro="/prefeitura/contratos"
            />
          </DataCard>
        </div>
      )}

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && hasActiveFilters
            ? "Nenhum contrato encontrado para esses filtros."
            : "Nenhum contrato encontrado no momento."}
        </div>
      ) : (
        <>
          <TabelaScroll>
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[.82em] tracking-wide text-text-soft uppercase">
                  <th className="px-4.5 py-3.5">Alerta</th>
                  <th className="px-4.5 py-3.5">Fornecedor</th>
                  <th className="px-4.5 py-3.5">Objeto</th>
                  <th className="px-4.5 py-3.5">Valor global</th>
                  <th className="px-4.5 py-3.5">Status</th>
                  <th className="px-4.5 py-3.5">Vigência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="min-w-[320px] px-4.5 py-3.5 align-top">
                      {row.alerta ? (
                        <ul className="flex flex-col gap-2">
                          {(row.motivos_alerta ?? []).map((m) => {
                            const info = MOTIVO_ALERTA_INFO[m];
                            const ehViolacao = info?.categoria === "violacao_legal";
                            return (
                              <li key={m}>
                                <span
                                  className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-transform duration-150 hover:scale-105 ${
                                    ehViolacao
                                      ? "bg-alert/15 text-alert"
                                      : "bg-accent/15 text-accent"
                                  }`}
                                >
                                  {ehViolacao ? "⚠ " : "· "}
                                  {info?.label ?? m}
                                </span>
                                {info && (
                                  <p className="mt-1 max-w-[380px] text-sm leading-snug text-text-soft">
                                    {ehViolacao ? "Base legal: " : "Sinal de atenção — não é violação em si: "}
                                    {info.fundamentacao}
                                  </p>
                                )}
                                {m === "regra_5_fornecedor_sancionado_ceis" &&
                                  row.sancoesCeis &&
                                  row.sancoesCeis.length > 0 && (
                                    <ul className="mt-1.5 max-w-[380px] rounded-lg bg-surface-2 p-2.5 text-sm leading-snug">
                                      {row.sancoesCeis.map((s, i) => (
                                        <li key={i} className="mb-1.5 last:mb-0">
                                          <strong className="text-text">{s.tipo ?? "Sanção"}</strong>
                                          {s.orgao_sancionador && (
                                            <> — aplicada por {s.orgao_sancionador}</>
                                          )}
                                          {s.abrangencia && (
                                            <p className="text-text-soft">
                                              Abrangência: {s.abrangencia}
                                            </p>
                                          )}
                                          {s.data_fim && (
                                            <p className="text-text-soft">Vigente até {s.data_fim}</p>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-text-soft">—</span>
                      )}
                    </td>
                    <td className="px-4.5 py-3.5 font-medium text-text">
                      {row.fornecedor_nome ?? "—"}
                    </td>
                    <td className="max-w-md px-4.5 py-3.5 align-top text-text-soft">
                      <p className="truncate" title={row.objeto ?? undefined}>
                        {row.objeto ?? "—"}
                      </p>
                      {row.temas && row.temas.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {row.temas.map((t) => (
                            <li
                              key={t}
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-[.85em] font-medium text-primary"
                            >
                              {TEMA_LABELS[t] ?? t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="font-tabular px-4.5 py-3.5 font-semibold whitespace-nowrap text-text">
                      {row.valor_global != null
                        ? formatCurrencyBRL(Number(row.valor_global))
                        : "—"}
                    </td>
                    <td className="px-4.5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status === "ativo"
                            ? "bg-accent/15 text-accent"
                            : "bg-surface-2 text-text-soft"
                        }`}
                      >
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="font-tabular px-4.5 py-3.5 whitespace-nowrap text-text-soft">
                      {formatDateBR(row.vigencia_inicio)} –{" "}
                      {formatDateBR(row.vigencia_fim)}
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
