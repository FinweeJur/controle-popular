import DataCard from "@/app/[municipio]/components/DataCard";
import { fetchIndicadores } from "@/lib/betim/indicadores";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Infraestrutura — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Cobertura de água e esgoto em ${c.nome}-${c.uf}, dados do SNIS.`
);

export default async function InfraestruturaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const indicadores = await fetchIndicadores(cidade.id_municipio, ["cobertura_agua", "cobertura_esgoto"]);
  const agua = indicadores["cobertura_agua"];
  const esgoto = indicadores["cobertura_esgoto"];

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Infraestrutura de {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Saneamento básico — cobertura de água e coleta de esgoto, dados do
        Sistema Nacional de Informações sobre Saneamento (SNIS).
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <DataCard title="Cobertura de água" source={{ label: "SNIS", url: "http://www.snis.gov.br/" }}>
          {agua ? (
            <>
              <p className="font-tabular text-2xl font-bold text-text">
                {agua.valor}
                {agua.unidade ? <span className="ml-1 text-sm font-normal">{agua.unidade}</span> : null}
              </p>
              {agua.ano_referencia ? (
                <p className="text-xs text-text-soft">{agua.ano_referencia}</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-text-soft">em breve</p>
          )}
        </DataCard>
        <DataCard title="Cobertura de esgoto" source={{ label: "SNIS", url: "http://www.snis.gov.br/" }}>
          {esgoto ? (
            <>
              <p className="font-tabular text-2xl font-bold text-text">
                {esgoto.valor}
                {esgoto.unidade ? <span className="ml-1 text-sm font-normal">{esgoto.unidade}</span> : null}
              </p>
              {esgoto.ano_referencia ? (
                <p className="text-xs text-text-soft">{esgoto.ano_referencia}</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-text-soft">em breve</p>
          )}
        </DataCard>
      </section>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
        <p className="font-medium text-text">Em breve</p>
        <p className="mt-2">
          Obras públicas, frota de veículos e outros indicadores de
          infraestrutura ainda não têm fonte de dados conectada.
        </p>
      </div>
    </main>
  );
}
