import { paramsDasCidades } from "@/lib/betim/staticParams";
import DataCard from "@/app/[municipio]/components/DataCard";
import TaxaDeErroTerras from "@/app/[municipio]/components/TaxaDeErroTerras";
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
  (c) => `Vazio cadastral e terras públicas em ${c.nome} — ${nomePortal(c)}`,
  (c) =>
    `Território de ${c.nome}-${c.uf} sem imóvel rural declarado no CAR. Metodologia aberta e denominador explícito.`
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
        {/* <a> puro, não o Link de zona: o mapa mora em /funcaosocialterra,
          * fora da zona [municipio], e o wrapper prefixaria com o slug da
          * cidade. O globo cobre 76 municípios de Minas por camada, mesmo
          * sem página própria aqui — vale o link mesmo sem levantamento. */}
        <a
          href="/funcaosocialterra/mapa"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Ver esta área no mapa (3D) →
        </a>
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
        {/* `<a>` cru, não o `Link` de zona: `/metodologia` aqui dentro é a
            página de alertas de CONTRATO
            (`[municipio]/metodologia/page.tsx`) — não fala de terras nem
            de taxa de erro. A explicação de como a taxa de erro de 30% e
            o teto de 33% funcionam está em `/sobre#metodologia`, e o
            bloco `TaxaDeErroTerras` logo abaixo já mostra o número ao
            vivo. */}
        <a href="/sobre#metodologia" className="text-accent hover:underline">
          Como este número é calculado
        </a>
        .
      </p>

      {/* <a> puro, não o Link de zona: ver a nota acima, no branch sem
        * levantamento. */}
      <a
        href="/funcaosocialterra/mapa"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        Ver esta área no mapa (3D) →
      </a>

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

      {/* A taxa de erro só aparece quando há número para qualificar. Sem
        * levantamento publicado não há estimativa, e uma margem de erro
        * sozinha na tela confundiria mais do que informaria. */}
      {linhas !== null && linhas.length > 0 ? <TaxaDeErroTerras /> : null}
    </main>
  );
}
