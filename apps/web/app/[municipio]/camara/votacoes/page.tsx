import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import { fetchVotacoes, VOTACOES_PAGE_SIZE, type LadoVoto } from "@/lib/betim/votacoesCamara";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import type { Cidade } from "@/lib/db/queries/municipios";

/** Ver `fonteDaCamara` em `camara/page.tsx`: o crédito era "Câmara de Betim" fixo. */
function fonteDaCamara(cidade: Cidade) {
  const host =
    typeof cidade.fontes?.camara_host === "string" ? cidade.fontes.camara_host : undefined;
  return { label: `Câmara de ${cidade.nome}`, url: host };
}

const ESTILO_LADO: Record<LadoVoto, string> = {
  sim: "bg-accent/15 text-accent",
  nao: "bg-alert/15 text-alert",
  abstencao: "bg-surface-2 text-text-soft",
  ausente: "bg-surface-2 text-text-soft italic",
  presidencia: "bg-primary/10 text-primary",
  outro: "bg-surface-2 text-text",
};

export const generateMetadata = metadataDaCidade(
  (c) => `Votações da Câmara — ${nomePortal(c)}`,
  (c) => `Como cada vereador de ${c.nome}-${c.uf} votou, votação por votação.`
);

interface VotacoesPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ ano?: string; q?: string; page?: string }>;
}

export default async function VotacoesPage({
  params: rota,
  searchParams,
}: VotacoesPageProps) {
  const cidade = await cidadeDaRota(rota);
  const fonteCamara = fonteDaCamara(cidade);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { rows, total, configured, ok } = await fetchVotacoes(cidade.id_municipio, {
    ano: params.ano,
    q: params.q,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / VOTACOES_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      ano: params.ano,
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

  const hasActiveFilters = Boolean(params.q || params.ano);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">Votações</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Votações nominais
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quem votou o quê, matéria por matéria — o placar oficial mostra
        quantos votaram Sim ou Não; aqui está o nome de cada vereador por
        trás desse número. Nem toda câmara publica o voto individual; onde
        não publica, esta lista fica vazia.
      </p>

      <form
        method="GET"
        className="mt-6 mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Buscar na matéria
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
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Filtrar
        </button>
        {hasActiveFilters && (
          <Link href="/camara/votacoes" className="text-sm text-text-soft hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <DataCard title="Votações encontradas" source={fonteCamara} className="mb-6 max-w-xs">
        <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
      </DataCard>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && hasActiveFilters
            ? "Nenhuma votação encontrada para esses filtros."
            : "Nenhuma votação nominal encontrada no momento."}
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {rows.map((v) => (
              <li key={v.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display font-semibold text-text">
                    {v.materia ?? "Matéria não identificada"}
                  </p>
                  {v.resultado && (
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                      {v.resultado}
                    </span>
                  )}
                </div>
                {v.ementa && <p className="mt-1.5 text-sm text-text-soft">{v.ementa}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-soft">
                  {v.data && <span>{formatDateBR(v.data)}</span>}
                  {v.tipoVotacao && <span>{v.tipoVotacao}</span>}
                  {v.presentes != null && <span>{v.presentes} presentes</span>}
                  {(v.placarSim != null || v.placarNao != null) && (
                    <span>
                      Sim {v.placarSim ?? 0} · Não {v.placarNao ?? 0}
                      {v.placarAbstencao ? ` · Abstenção ${v.placarAbstencao}` : ""}
                      {v.placarBranco ? ` · Branco ${v.placarBranco}` : ""}
                    </span>
                  )}
                  {v.linkFonte && (
                    <a
                      href={v.linkFonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Ver fonte oficial ↗
                    </a>
                  )}
                </div>

                {v.votos.length > 0 && (
                  <details className="mt-3 rounded-xl border border-border/60 bg-surface-2 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-accent select-none">
                      Ver como cada vereador votou ({v.votos.length})
                    </summary>
                    <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {v.votos.map((voto, i) => (
                        <li
                          key={voto.vereadorId ?? `${voto.nome}-${i}`}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          {voto.slug ? (
                            <Link
                              href={`/vereadores/${voto.slug}`}
                              className="truncate text-text hover:text-primary hover:underline"
                            >
                              {voto.nome}
                              {voto.partido && (
                                <span className="text-text-soft"> ({voto.partido})</span>
                              )}
                            </Link>
                          ) : (
                            <span className="truncate text-text-soft">
                              {voto.nome}
                              {voto.partido && <span> ({voto.partido})</span>}
                            </span>
                          )}
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_LADO[voto.lado]}`}
                          >
                            {voto.voto}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
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
