import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getAgroData } from "@/lib/betim/agro";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota } from "@/lib/betim/cidade";

export const metadata = {
  title: "Agro — Betim em Dados | Controle Popular Betim",
  description: "Produção agropecuária de Betim-MG.",
};

export default async function AgroPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const data = await getAgroData(cidade.id_municipio);
  const temDados =
    data.configured && data.ok && (data.topLavouras.length > 0 || data.rebanhos.length > 0);

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo="Agro em Betim"
        descricao="Produção agropecuária do município."
        motivo={
          data.configured
            ? "Nenhum dado de produção agropecuária encontrado no momento."
            : "Depende do banco de dados, ainda não configurado neste ambiente."
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          Betim em Dados
        </Link>{" "}
        · <span className="text-text">Agro</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Produção agropecuária em Betim
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Betim é majoritariamente urbana e industrial, mas mantém produção
        agrícola e pecuária real — pequena em volume nacional, mas parte da
        economia local.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.anoLavouras && (
          <DataCard
            title={`Lavouras — ${data.anoLavouras}`}
            source={{ label: "IBGE (PAM) / Base dos Dados", url: "https://sidra.ibge.gov.br/pesquisa/pam" }}
          >
            <p className="font-tabular text-2xl font-bold text-text">
              {formatCurrencyBRL(data.valorTotalLavouras)}
            </p>
            <p className="mt-1 text-xs">valor total da produção agrícola declarada</p>
          </DataCard>
        )}
        {data.anoRebanho && (
          <DataCard
            title={`Rebanhos — ${data.anoRebanho}`}
            source={{ label: "IBGE (PPM) / Base dos Dados", url: "https://sidra.ibge.gov.br/pesquisa/ppm" }}
          >
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(data.rebanhos.reduce((acc, r) => acc + r.quantidade, 0))}
            </p>
            <p className="mt-1 text-xs">cabeças de todos os rebanhos somadas</p>
          </DataCard>
        )}
      </div>

      {data.topLavouras.length > 0 && (
        <div className="mt-8">
          <DataCard
            title={`Principais lavouras por valor — ${data.anoLavouras}`}
            source={{ label: "IBGE (PAM) / Base dos Dados" }}
          >
            <ul className="divide-y divide-border/60">
              {data.topLavouras.map((p) => (
                <li key={p.produto} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">
                    {p.produto}
                    {p.areaColhida ? (
                      <span className="text-text-soft"> ({formatNumberBR(p.areaColhida)} ha)</span>
                    ) : null}
                  </span>
                  <strong className="font-tabular text-text">
                    {formatCurrencyBRL(p.valorProducaoReais ?? 0)}
                  </strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      {data.producaoAnimal.length > 0 && (
        <div className="mt-8">
          <DataCard
            title={`Produção animal — ${data.anoProducaoAnimal}`}
            source={{ label: "IBGE (PPM) / Base dos Dados" }}
          >
            <ul className="divide-y divide-border/60">
              {data.producaoAnimal.map((p) => (
                <li key={p.produto} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">
                    {p.produto}
                    {p.quantidade != null && p.unidade ? (
                      <span className="text-text-soft">
                        {" "}
                        ({formatNumberBR(p.quantidade)} {p.unidade.toLowerCase()})
                      </span>
                    ) : null}
                  </span>
                  <strong className="font-tabular text-text">
                    {formatCurrencyBRL(p.valorProducaoReais ?? 0)}
                  </strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      {data.rebanhos.length > 0 && (
        <div className="mt-8">
          <DataCard
            title={`Rebanhos por tipo — ${data.anoRebanho}`}
            source={{ label: "IBGE (PPM) / Base dos Dados" }}
          >
            <ul className="divide-y divide-border/60">
              {data.rebanhos.map((r) => (
                <li key={r.tipo} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">{r.tipo}</span>
                  <strong className="font-tabular text-text">
                    {formatNumberBR(r.quantidade)} cabeças
                  </strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          Sobre este dado
        </h2>
        <p className="mt-2">
          Vem da Pesquisa Agrícola Municipal (PAM) e da Pesquisa da Pecuária
          Municipal (PPM), ambas do IBGE — a mesma fonte oficial usada em
          qualquer estatística agropecuária municipal do país.
        </p>
        {data.anoRebanho && data.anoLavouras && data.anoRebanho < data.anoLavouras && (
          <p className="mt-2">
            O efetivo de rebanhos está defasado em relação às lavouras:{" "}
            {data.anoLavouras - data.anoRebanho} ano(s) sem atualização mais
            recente disponível na própria fonte do IBGE — não é uma limitação
            deste site.
          </p>
        )}
        <p className="mt-2">
          Valores de produção são convertidos de milhares de reais (unidade
          original do IBGE) para reais cheios.
        </p>
      </section>
    </div>
  );
}
