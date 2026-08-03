import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import { fetchProposicoes, getSituacoesDisponiveis, PROPOSICOES_PAGE_SIZE } from "@/lib/betim/proposicoes";
import { TIPO_PROPOSICAO_LABELS } from "@/lib/betim/vereadores";
import { TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { rotuloLegislatura } from "@/lib/db/queries/municipios";

export const generateMetadata = metadataDaCidade(
  (c) => `Proposições da Câmara — ${nomePortal(c)}`,
  (c) => `Todos os projetos de lei, requerimentos, indicações e emendas apresentados na Câmara Municipal de ${c.nome}, com busca e filtro.`
);

interface ProposicoesPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{
    tipo?: string;
    situacao?: string;
    ano?: string;
    tema?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ProposicoesPage({
  params: rotaParams,
  searchParams,
}: ProposicoesPageProps) {
  const cidade = await cidadeDaRota(rotaParams);
  const sistemaCamara =
    typeof cidade.fontes?.camara_sistema === "string" ? cidade.fontes.camara_sistema : null;
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, configured, ok }, situacoes] = await Promise.all([
    fetchProposicoes(cidade.id_municipio, {
      tipo: params.tipo,
      situacao: params.situacao,
      ano: params.ano,
      tema: params.tema,
      q: params.q,
      page,
    }),
    getSituacoesDisponiveis(cidade.id_municipio),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PROPOSICOES_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      tipo: params.tipo,
      situacao: params.situacao,
      ano: params.ano,
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

  const hasActiveFilters = Boolean(
    params.q || params.tipo || params.situacao || params.ano || params.tema
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">Proposições</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Proposições da Câmara
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {/* "PROLEGIS" é o sistema legislativo de BETIM. Belo Horizonte usa o
            SIL e São Paulo, o SPLegis — citar o nome errado numa página que
            se propõe a dizer de onde o dado vem é pior que não citar. O nome
            vem de `municipios.fontes.camara_sistema`. */}
        Projetos de lei, requerimentos, indicações e emendas apresentados na{" "}
        {rotuloLegislatura(cidade)}, direto do sistema legislativo
        {sistemaCamara ? ` (${sistemaCamara})` : ""} da Câmara Municipal de{" "}
        {cidade.nome}.
      </p>

      <form
        method="GET"
        className="mt-6 mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Buscar na ementa
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ex.: pavimentação, saúde…"
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="tipo" className="mb-1 text-xs font-medium text-text-soft">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="w-52 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_PROPOSICAO_LABELS).map(([codigo, label]) => (
              <option key={codigo} value={codigo}>
                {label}
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
        <div className="flex flex-col">
          <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
            Ano
          </label>
          <input
            id="ano"
            name="ano"
            defaultValue={params.ano ?? ""}
            placeholder="2026"
            inputMode="numeric"
            className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
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
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Filtrar
        </button>
        {hasActiveFilters && (
          <Link href="/camara/proposicoes" className="text-sm text-text-soft hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <DataCard title="Proposições encontradas" className="mb-6 max-w-xs">
        <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
      </DataCard>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && hasActiveFilters
            ? "Nenhuma proposição encontrada para esses filtros."
            : "Nenhuma proposição encontrada no momento."}
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display font-semibold text-text">
                    {TIPO_PROPOSICAO_LABELS[row.tipo] ?? row.tipo} nº {row.numero}/{row.ano}
                  </p>
                  {row.situacao && (
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                      {row.situacao}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-text-soft">{row.ementa ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-soft">
                  {row.autores && row.autores.length > 0 && <span>{row.autores.join(", ")}</span>}
                  {row.data_apresentacao && <span>{formatDateBR(row.data_apresentacao)}</span>}
                  {row.link_fonte && (
                    <a
                      href={row.link_fonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Ver fonte oficial ↗
                    </a>
                  )}
                </div>
                {row.temas && row.temas.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1">
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
              </li>
            ))}
          </ul>

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

          <PedidoLAI orgao="camara" />
        </>
      )}
    </div>
  );
}
