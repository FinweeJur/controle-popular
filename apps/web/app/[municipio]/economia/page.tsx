import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { fetchIndicadores } from "@/lib/betim/indicadores";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Economia — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `PIB, salário médio e saldo de empregos de ${c.nome}-${c.uf}.`
);

export default async function EconomiaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const indicadores = await fetchIndicadores(cidade.id_municipio, [
    "pib",
    "pib_per_capita",
    "salario_medio",
    "saldo_empregos_caged",
  ]);

  const cards = [
    {
      key: "pib",
      titulo: "PIB do município",
      formatar: (v: number) => <Moeda value={v} />,
    },
    {
      key: "pib_per_capita",
      titulo: "PIB per capita",
      formatar: (v: number) => <Moeda value={v} />,
    },
    {
      key: "salario_medio",
      titulo: "Salário médio mensal",
      formatar: (v: number) => <Moeda value={v} />,
    },
    {
      key: "saldo_empregos_caged",
      titulo: "Saldo de empregos formais (CAGED)",
      formatar: (v: number) => formatNumberBR(v),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Economia de {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Produção econômica, renda e emprego formal — dados do IBGE e do
        CAGED (Ministério do Trabalho).
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const row = indicadores[c.key];
          return (
            <DataCard
              key={c.key}
              title={c.titulo}
              source={{ label: "Base dos Dados (IBGE/CAGED)", url: "https://basedosdados.org/" }}
            >
              {row ? (
                <>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {row.valor_numerico !== null
                      ? c.formatar(row.valor_numerico)
                      : (row.valor ?? "—")}
                  </p>
                  {row.ano_referencia ? (
                    <p className="text-xs text-text-soft">{row.ano_referencia}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-text-soft">em breve</p>
              )}
            </DataCard>
          );
        })}
      </section>

      <p className="mt-8 text-sm text-text-soft">
        Quer ver como a Prefeitura gasta o dinheiro público? Veja{" "}
        <Link href="/prefeitura" className="font-medium text-accent hover:underline">
          receitas e despesas
        </Link>
        . Município com atividade minerária? Veja também os{" "}
        <Link href="/mineracao" className="font-medium text-accent hover:underline">
          royalties da mineração (CFEM)
        </Link>
        .
      </p>
    </main>
  );
}
