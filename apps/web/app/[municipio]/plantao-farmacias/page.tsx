import { fetchFarmaciasPlantao, wazeLink } from "@/lib/betim/servicos";
import { formatDateBR } from "@/lib/betim/format";
import { cidadeDaRota } from "@/lib/betim/cidade";

export const metadata = {
  title: "Farmácias de Plantão — Betim | Controle Popular Betim",
  description: "Farmácias de plantão da semana em Betim-MG, com telefone e rota no Waze.",
};

export default async function PlantaoFarmaciasPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { rows, configured } = await fetchFarmaciasPlantao(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Farmácias de Plantão
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Farmácias em plantão nesta semana em Betim-MG, com telefone e rota
        direto no Waze.
      </p>

      <section className="mt-8 flex flex-col gap-3">
        {rows.length > 0 ? (
          rows.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div>
                <p className="font-display font-semibold text-text">
                  {f.nome} {f.h24 ? <span className="ml-1 text-xs text-accent">24h</span> : null}
                </p>
                <p className="text-sm text-text-soft">{f.endereco ?? "—"}</p>
                {f.telefone ? (
                  <p className="font-tabular text-sm text-text-soft">{f.telefone}</p>
                ) : null}
                {!f.h24 && f.plantao_inicio && f.plantao_fim ? (
                  <p className="text-xs text-text-soft">
                    Plantão: {formatDateBR(f.plantao_inicio)} a {formatDateBR(f.plantao_fim)}
                  </p>
                ) : null}
              </div>
              <a
                href={wazeLink(f.nome, f.lat, f.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
              >
                Rota no Waze
              </a>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-soft">
            {configured
              ? "Nenhuma farmácia de plantão cadastrada ainda — depende da publicação oficial da escala pela Prefeitura/CRF-MG, ainda não integrada."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </main>
  );
}
