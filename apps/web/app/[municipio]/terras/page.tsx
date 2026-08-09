import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { temFonte } from "@/lib/db/queries/municipios";
import { vazioResumoPorMunicipio } from "@/lib/betim/terras";
import { formatNumberBR } from "@/lib/betim/format";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Terras — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) =>
    `Vazio cadastral em ${c.nome}-${c.uf}: quanto do território não tem imóvel rural declarado, com a metodologia aberta e o denominador explícito.`
);

export default async function TerrasPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  if (!temFonte(cidade, "terras")) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
        <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
          Terras
        </h1>
        <p className="mt-2 max-w-[60ch] text-text-soft">
          {cidade.nome} ainda não tem levantamento de vazio cadastral.
        </p>
      </main>
    );
  }

  const linhas = await vazioResumoPorMunicipio(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Terras — vazio cadastral
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Quanto do território de {cidade.nome} não tem imóvel rural declarado no
        Cadastro Ambiental Rural (CAR). <strong>Vazio cadastral não é terra
        devoluta</strong> — é candidato a verificação, não afirmação de
        titularidade.{" "}
        <Link href="/metodologia" className="text-accent hover:underline">
          Como este número é calculado
        </Link>
        .
      </p>

      {linhas === null || linhas.length === 0 ? (
        <p className="mt-8 rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          O levantamento para {cidade.nome} ainda não foi publicado nesta
          tela — o pipeline roda fora deste app e o resultado entra por
          carga própria, não por coleta automática.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {linhas.map((l) => (
            <DataCard
              key={l.metodo}
              title={
                l.metodo === "vazio_cadastral"
                  ? "Vazio cadastral (CAR)"
                  : "Candidato sobre terra pública certificada"
              }
              source={{
                label: "Proveniência (regra exata desta linha)",
              }}
            >
              <p className="text-sm text-text-soft">{l.resumoMetodo}</p>
              <p className="mt-3 font-tabular text-2xl font-bold text-text">
                {formatNumberBR(l.areaCandidataHa)} ha
                <span className="ml-2 text-sm font-normal text-text-soft">
                  de {formatNumberBR(l.areaUniversoHa)} ha ({l.percentual.toFixed(1)}%)
                </span>
              </p>
              <p className="mt-1 text-xs text-text-soft">
                {l.qtdPoligonos} polígono(s) · método vigente desde{" "}
                {l.metodoVersaoData} · {l.proveniencia}
              </p>
            </DataCard>
          ))}
        </div>
      )}
    </main>
  );
}
