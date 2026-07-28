import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import { getServidores, SERVIDORES_PAGE_SIZE } from "@/lib/betim/servidores";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota } from "@/lib/betim/cidade";

export const metadata = {
  title: "Servidores — Prefeitura de Betim — Controle Popular Betim",
  description:
    "Servidores da Prefeitura de Betim: nome, cargo, lotação e vínculo. Dado público, com busca.",
};

interface ServidoresPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function ServidoresPage({
  params: rota,
  searchParams,
}: ServidoresPageProps) {
  const cidade = await cidadeDaRota(rota);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { rows, total, ok, configured } = await getServidores(cidade.id_municipio, { q: params.q, page });
  const totalPages = Math.max(1, Math.ceil(total / SERVIDORES_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      page: params.page,
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Servidores</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Servidores da Prefeitura
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Nome, cargo, lotação e tipo de vínculo dos servidores da Prefeitura de
        Betim. Informação pública — a remuneração individual não é exibida.
      </p>

      <form method="GET" className="mt-6 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Buscar por nome, cargo ou lotação
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ex.: professor, secretaria de saúde…"
            className="w-72 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Buscar
        </button>
        {params.q && (
          <Link href="/prefeitura/servidores" className="text-sm text-text-soft hover:underline">
            Limpar
          </Link>
        )}
      </form>

      <div className="mb-6 max-w-xs">
        <DataCard
          title="Servidores encontrados"
          source={{ label: "Prefeitura de Betim", url: "https://www.betim.mg.gov.br" }}
        >
          <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
        </DataCard>
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && params.q
            ? "Nenhum servidor encontrado para essa busca."
            : "Nenhum servidor encontrado no momento."}
        </div>
      ) : (
        <>
          <TabelaScroll>
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[.82em] tracking-wide text-text-soft uppercase">
                  <th className="px-4.5 py-3.5">Nome</th>
                  <th className="px-4.5 py-3.5">Cargo</th>
                  <th className="px-4.5 py-3.5">Lotação</th>
                  <th className="px-4.5 py-3.5">Vínculo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {rows.map((s, i) => (
                  <tr key={i}>
                    <td className="px-4.5 py-3.5 font-medium text-text">{s.nome}</td>
                    <td className="px-4.5 py-3.5 text-text-soft">{s.cargo ?? "—"}</td>
                    <td className="px-4.5 py-3.5 text-text-soft">{s.lotacao ?? "—"}</td>
                    <td className="px-4.5 py-3.5 whitespace-nowrap text-text-soft">
                      {s.vinculo ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelaScroll>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-tabular text-text-soft">
              Página {page} de {formatNumberBR(totalPages)}
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
        </>
      )}
    </div>
  );
}
