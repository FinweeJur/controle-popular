import DataCard from "@/app/[municipio]/components/DataCard";
import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { classificarChuva7d } from "@/lib/betim/format";

export const generateMetadata = metadataDaCidade(
  (c) => `Clima — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Previsão do tempo e histórico de chuva dos últimos 7 dias em ${c.nome}-${c.uf}.`
);

const WEATHER_LABELS: Record<number, string> = {
  0: "Céu limpo",
  1: "Poucas nuvens",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina",
  51: "Garoa fraca",
  53: "Garoa",
  55: "Garoa forte",
  61: "Chuva fraca",
  63: "Chuva",
  65: "Chuva forte",
  80: "Pancadas de chuva",
  81: "Pancadas de chuva",
  82: "Pancadas fortes",
  95: "Trovoadas",
};

interface ClimaCache {
  atual: { temperature: number; weathercode: number } | null;
  diario: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
  } | null;
  chuva_7d: number | null;
  atualizado_em: string | null;
}

async function getClima(idMunicipio: IdMunicipio): Promise<ClimaCache | null> {
  try {
    return ((await q.climaDaCidade(idMunicipio)) as ClimaCache) ?? null;
  } catch {
    return null;
  }
}

function formatDiaCurto(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default async function ClimaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const clima = await getClima(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Clima em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Temperatura atual, previsão dos próximos dias e chuva acumulada nos
        últimos 7 dias — fonte Open-Meteo.
      </p>

      {clima?.atual ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <DataCard title="Agora" source={{ label: "Open-Meteo", url: "https://open-meteo.com/" }}>
            <div className="font-tabular text-[3em] leading-none font-semibold text-text">
              {Math.round(clima.atual.temperature)}°
            </div>
            <p className="mt-1 text-text-soft">
              {WEATHER_LABELS[clima.atual.weathercode] ?? "—"}
            </p>
          </DataCard>

          <DataCard
            title="Chuva acumulada (últimos 7 dias)"
            source={{ label: "Open-Meteo Archive", url: "https://open-meteo.com/" }}
          >
            <div className="font-tabular text-[3em] leading-none font-semibold text-text">
              {clima.chuva_7d ?? 0}
              <span className="ml-1 text-base font-normal">mm</span>
            </div>
            <p className="mt-1 text-sm font-medium text-primary">
              {classificarChuva7d(clima.chuva_7d ?? 0)}
            </p>
          </DataCard>
        </section>
      ) : (
        <p className="mt-8 text-sm text-text-soft">
          Nenhum dado de clima disponível ainda — em breve.
        </p>
      )}

      {clima?.diario ? (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            Próximos dias
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(() => {
              const diario = clima.diario!;
              return diario.time.map((day, i) => (
                <div
                  key={day}
                  className="min-w-[110px] rounded-2xl border border-border bg-surface p-4 text-center shadow-sm"
                >
                  <p className="text-xs font-medium text-text-soft">{formatDiaCurto(day)}</p>
                  <p className="mt-1 text-[.85em] text-text-soft">
                    {WEATHER_LABELS[diario.weathercode[i]] ?? "—"}
                  </p>
                  <p className="mt-2 font-tabular text-sm font-semibold text-text">
                    {Math.round(diario.temperature_2m_max[i])}° /{" "}
                    {Math.round(diario.temperature_2m_min[i])}°
                  </p>
                  <p className="mt-1 font-tabular text-xs text-primary">
                    {diario.precipitation_sum[i]}mm
                  </p>
                </div>
              ));
            })()}
          </div>
        </section>
      ) : null}
    </main>
  );
}
