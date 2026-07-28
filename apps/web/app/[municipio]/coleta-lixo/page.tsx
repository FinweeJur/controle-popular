import { fetchColetaLixo } from "@/lib/betim/servicos";

export const metadata = {
  title: "Coleta de Lixo — Betim | Controle Popular Betim",
  description: "Dias e horários de coleta de lixo comum e seletiva por bairro em Betim-MG.",
};

const TIPO_LABELS: Record<string, string> = {
  comum: "Comum",
  seletiva: "Seletiva",
};

export default async function ColetaLixoPage({
  params,
  searchParams,
}: {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ bairro?: string }>;
}) {
  // Componente de servidor não usa hook: a cidade vem do `params` da rota.
  const { municipio } = await params;
  const { bairro } = await searchParams;
  const { rows, configured } = await fetchColetaLixo(bairro);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Coleta de Lixo
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Consulte os dias de coleta comum e seletiva do seu bairro e baixe um
        lembrete recorrente pro seu calendário.
      </p>

      <form method="GET" className="mt-6 flex max-w-md gap-2">
        <input
          type="search"
          name="bairro"
          defaultValue={bairro ?? ""}
          placeholder="Buscar bairro…"
          aria-label="Buscar bairro"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-text"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink"
        >
          Buscar
        </button>
      </form>

      <section className="mt-8 flex flex-col gap-3">
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <div
              key={`${row.bairro}-${row.tipo}-${i}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div>
                <p className="font-display font-semibold text-text">{row.bairro}</p>
                <p className="text-sm text-text-soft">
                  {TIPO_LABELS[row.tipo ?? ""] ?? row.tipo ?? "—"} ·{" "}
                  {(row.dias_semana ?? []).join(", ") || "—"}
                  {row.horario ? ` · ${row.horario}` : ""}
                </p>
              </div>
              <a
                href={`/${municipio}/api/coleta/${encodeURIComponent(row.bairro)}`}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
              >
                Baixar lembrete (.ics)
              </a>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-soft">
            {configured
              ? "Nenhum bairro cadastrado ainda — a Prefeitura de Betim ainda não disponibilizou essa agenda de forma estruturada; assim que tivermos a fonte confirmada, ela entra aqui."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </main>
  );
}
