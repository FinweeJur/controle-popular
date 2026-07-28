import DataCard from "@/app/[municipio]/components/DataCard";
import { getEducacaoData, REDE_LABELS } from "@/lib/betim/educacao";
import { fetchIndicadores } from "@/lib/betim/indicadores";
import { formatNumberBR } from "@/lib/betim/format";

export const metadata = {
  title: "Educação — Betim em Dados | Controle Popular Betim",
  description: "Escolas, matrículas e IDEB de Betim-MG, direto do Censo Escolar (INEP).",
};

export default async function EducacaoPage() {
  const [data, indicadores] = await Promise.all([
    getEducacaoData(),
    fetchIndicadores(["ideb_anos_iniciais", "ideb_anos_finais"]),
  ]);

  const iniciais = indicadores["ideb_anos_iniciais"];
  const finais = indicadores["ideb_anos_finais"];

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Educação em Betim
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

          {data.escolas.length > 0 ? (
            <DataCard title="Todas as escolas" source={{ label: "INEP", url: "https://www.gov.br/inep" }}>
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y divide-border/60">
                  {data.escolas.map((e) => (
                    <li key={e.id_inep} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-text">
                        {e.nome}{" "}
                        <span className="text-xs text-text-soft">
                          ({REDE_LABELS[e.rede ?? ""] ?? "rede não informada"})
                        </span>
                      </span>
                      {e.matriculas ? (
                        <strong className="font-tabular shrink-0 text-text">
                          {formatNumberBR(e.matriculas)}
                        </strong>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </DataCard>
          ) : null}
        </div>
      )}
    </main>
  );
}
