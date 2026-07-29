import DataCard from "@/app/[municipio]/components/DataCard";
import { fetchPostosAnp } from "@/lib/betim/postos";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Postos de Combustível — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Postos de combustível de ${c.nome}-${c.uf} cadastrados na ANP, com bandeira, produtos e nota de conformidade (PMQC).`
);

export default async function PostosCombustivelPage({
  params,
  searchParams,
}: {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ bandeira?: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { bandeira } = await searchParams;
  const { rows, configured } = await fetchPostosAnp(cidade.id_municipio, bandeira);

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Postos de Combustível
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Cadastro de revendedores de combustíveis automotivos de Betim-MG,
        direto da ANP. A nota de 0 a 5 é derivada do histórico de
        inadimplência no Programa de Monitoramento da Qualidade dos
        Combustíveis (PMQC) — quando a ANP ainda não publicou nenhuma
        ocorrência pra um posto, ele aparece com nota 5.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.length > 0 ? (
          rows.map((posto) => (
            <DataCard
              key={posto.cnpj}
              title={posto.razao_social ?? "Posto"}
              source={{
                label: "ANP — Revendedores",
                url: "https://revendedoresapi.anp.gov.br/swagger/index.html",
              }}
            >
              <p>{posto.endereco ?? "—"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                  {posto.bandeira ?? "sem bandeira"}
                </span>
                <span className="font-tabular text-sm font-semibold text-primary">
                  Nota ANP: {posto.nota_anp ?? "—"}/5
                </span>
                {posto.interditado ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                    Interditado
                  </span>
                ) : null}
              </div>
              {posto.produtos && posto.produtos.length > 0 ? (
                <p className="mt-3 text-xs text-text-soft">
                  {posto.produtos.join(" · ")}
                </p>
              ) : null}
            </DataCard>
          ))
        ) : (
          <p className="col-span-full text-sm text-text-soft">
            {configured
              ? "Nenhum posto cadastrado ainda — em breve."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </main>
  );
}
