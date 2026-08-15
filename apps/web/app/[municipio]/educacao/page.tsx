import { paramsDasCidades } from "@/lib/betim/staticParams";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getEducacaoResumo, REDE_LABELS } from "@/lib/betim/educacao";
import { fetchIndicadores } from "@/lib/betim/indicadores";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaEscolas from "./ListaEscolas";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Educação — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Escolas, matrículas e IDEB de ${c.nome}-${c.uf}, direto do Censo Escolar (INEP).`
);

export default async function EducacaoPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [data, indicadores] = await Promise.all([
    getEducacaoResumo(cidade.id_municipio),
    fetchIndicadores(cidade.id_municipio, ["ideb_anos_iniciais", "ideb_anos_finais"]),
  ]);

  const iniciais = indicadores["ideb_anos_iniciais"];
  const finais = indicadores["ideb_anos_finais"];

  // Mesmo cálculo de `prefeitura/servidores/page.tsx`: `PAGES_BASE_PATH` é o
  // prefixo do export estático, e o `fetch()` cru de `TabelaEstatica` não passa
  // por `next/link`, que é quem normalmente o acrescentaria.
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/educacao/dados`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Educação em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Escolas, matrículas e nota do IDEB, direto do Censo Escolar do
        INEP.
      </p>

      {!data.configured ? (
        <p className="mt-8 text-sm text-text-soft">Nenhum dado disponível no momento.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataCard title="Escolas cadastradas" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              <p className="font-tabular text-2xl font-bold text-text">
                {formatNumberBR(data.totalEscolas)}
              </p>
            </DataCard>
            <DataCard title="Matrículas informadas" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              <p className="font-tabular text-2xl font-bold text-text">
                {formatNumberBR(data.totalMatriculas)}
              </p>
              <p className="text-xs text-text-soft">nem toda escola informa esse campo</p>
            </DataCard>
            <DataCard title="IDEB — anos iniciais" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              {iniciais ? (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">{iniciais.valor}</p>
                  {iniciais.ano_referencia ? (
                    <p className="text-xs text-text-soft">{iniciais.ano_referencia}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-text-soft">em breve</p>
              )}
            </DataCard>
            <DataCard title="IDEB — anos finais" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              {finais ? (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">{finais.valor}</p>
                  {finais.ano_referencia ? (
                    <p className="text-xs text-text-soft">{finais.ano_referencia}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-text-soft">em breve</p>
              )}
            </DataCard>
          </section>

          {data.porRede.length > 0 ? (
            <DataCard title="Escolas por rede" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              <div className="flex flex-wrap gap-6">
                {data.porRede.map((r) => (
                  <div key={r.rede}>
                    <p className="font-tabular text-xl font-bold text-text">
                      {formatNumberBR(r.qtd)}
                    </p>
                    <p className="text-xs text-text-soft">{REDE_LABELS[r.rede] ?? "Outra"}</p>
                  </div>
                ))}
              </div>
            </DataCard>
          ) : null}

          {/* A lista deixou de ser renderizada aqui: ela vem do índice fatiado
              em `educacao/dados/**`, carregado pelo navegador sob demanda. A
              condição `data.escolas.length > 0` que existia neste ponto não tem
              substituto no servidor — e nem precisa: `TabelaEstatica` lê o
              `manifesto.json` e distingue sozinha "município sem escola" (mostra
              o texto de `vazio`) de "não consegui buscar" (mostra erro), que era
              justamente o que o `null` daqui não sabia diferenciar. */}
          {data.totalEscolas > 0 ? (
            <DataCard title="Todas as escolas" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              <ListaEscolas base={baseDados} />
            </DataCard>
          ) : null}
        </div>
      )}
    </main>
  );
}
