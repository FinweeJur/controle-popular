import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getRoyaltiesCfemData } from "@/lib/betim/royaltiesCfem";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Mineração — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Royalties da mineração (CFEM) arrecadados sobre a produção mineral de ${c.nome}-${c.uf}.`
);

const FONTE_ANM = {
  label: "ANM — Arrecadação CFEM por substância",
  url: "https://sistemas.anm.gov.br/arrecadacao/extra/Relatorios/arrecadacao_cfem_substancia.aspx",
};

export default async function MineracaoPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const data = await getRoyaltiesCfemData(cidade.id_municipio);

  if (!data.ok || data.anoMaisRecente === null) {
    return (
      <PaginaEmBreve
        titulo={`Mineração em ${cidade.nome}`}
        descricao="Royalties da mineração (CFEM) arrecadados sobre a produção mineral do município."
        motivo={
          data.configured
            ? "Nenhuma arrecadação de CFEM encontrada para este município — pode ser ausência real de atividade minerária, não falha de coleta."
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
          {cidade.nome} em Dados
        </Link>{" "}
        · <span className="text-text">Mineração</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Royalties da mineração em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        A CFEM (Compensação Financeira pela Exploração de Recursos Minerais) é
        o royalty pago pelas empresas de mineração à ANM sobre o que
        extraíram — o único número público que mede, mês a mês, quanto
        minério sai do município.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DataCard title={`CFEM arrecadada em ${data.anoMaisRecente}`} source={FONTE_ANM}>
          <p className="font-tabular text-2xl font-bold text-text">
            <Moeda value={data.totalAnoMaisRecente} />
          </p>
          <p className="mt-1 text-xs">somando todas as substâncias do ano</p>
        </DataCard>
        <DataCard
          title={`Série histórica (${data.serieAnual[0]?.ano}–${data.anoMaisRecente})`}
          source={FONTE_ANM}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            <Moeda value={data.totalHistorico} />
          </p>
          <p className="mt-1 text-xs">soma de todos os anos coletados, só neste município</p>
        </DataCard>
      </div>

      {data.substanciasAnoMaisRecente.length > 0 && (
        <div className="mt-8">
          <DataCard title={`Por substância em ${data.anoMaisRecente}`} source={FONTE_ANM}>
            <ul className="divide-y divide-border/60">
              {data.substanciasAnoMaisRecente.map((s) => (
                <li key={s.substancia} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">{s.substancia}</span>
                  <strong className="font-tabular text-text"><Moeda value={s.valor} /></strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      {data.empresasAnoMaisRecente.length > 0 && (
        <div className="mt-8">
          <DataCard title={`Maiores pagadores em ${data.anoMaisRecente}`} source={FONTE_ANM}>
            <ul className="divide-y divide-border/60">
              {data.empresasAnoMaisRecente.map((e) => (
                <li key={e.empresa} className="flex flex-col gap-0.5 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text">{e.empresa}</span>
                    <strong className="font-tabular text-text">
                      <Moeda value={e.valorCfem} />
                    </strong>
                  </div>
                  <span className="text-xs text-text-soft">
                    {e.qtdeTitulos != null && (
                      <>{formatNumberBR(e.qtdeTitulos)} título(s) minerário(s)</>
                    )}
                    {e.pctRecolhimento != null && <> · alíquota efetiva {e.pctRecolhimento}%</>}
                  </span>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      {data.serieAnual.length > 1 && (
        <div className="mt-8">
          <DataCard title="CFEM por ano" source={FONTE_ANM}>
            <ul className="divide-y divide-border/60">
              {[...data.serieAnual].reverse().map((s) => (
                <li key={s.ano} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">{s.ano}</span>
                  <strong className="font-tabular text-text"><Moeda value={s.valor} /></strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">Sobre este dado</h2>
        <p className="mt-2">
          Isto é a CFEM <strong className="font-medium text-text">arrecadada</strong> sobre a
          produção mineral do município — não é a parcela que a Prefeitura
          efetivamente recebe. A Lei 13.540/2017 distribui o valor entre
          União, estado, município produtor e municípios afetados, e a ANM
          ainda não publica esse detalhamento por município de forma
          consultável. Até isso mudar, esta página não afirma quanto a
          Prefeitura recebeu — só quanto foi arrecadado sobre o que saiu do
          território.
        </p>
        <p className="mt-2">
          Os valores por substância e por empresa nesta página são exclusivos
          deste município. Uma mesma guia da ANM pode aparecer integralmente
          em mais de uma cidade quando o título minerário atravessa divisa
          municipal — por isso nunca some estes números com os de outro
          município.
        </p>
      </section>
    </div>
  );
}
