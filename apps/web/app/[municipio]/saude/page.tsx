import { paramsDasCidades } from "@/lib/betim/staticParams";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getSaudeData, getSaudeTendencias, CARATER_LABELS } from "@/lib/betim/saude";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { rankingCidsMunicipio } from "@/lib/db/queries/betim";
import RankingCidTabela from "@/app/[municipio]/components/RankingCidTabela";
import GraficoInternacoesSvg from "@/app/[municipio]/components/GraficoInternacoesSvg";
import { enriquecerRegistroCid } from "@/lib/saude/cid";
import type { CidRegistro } from "@/lib/saude/cid";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

const PREVENCAO_DENGUE_URL = "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue";

export const generateMetadata = metadataDaCidade(
  (c) => `Saúde — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Internações hospitalares, arboviroses e principais causas de óbito em ${c.nome}-${c.uf}.`
);

const DOENCA_LABELS: Record<string, string> = {
  dengue: "Dengue",
  chikungunya: "Chikungunya",
  zika: "Zika",
};

const NIVEL_ALERTA_LABELS: Record<number, string> = {
  1: "Verde — sem risco",
  2: "Amarelo — atenção",
  3: "Laranja — alerta",
  4: "Vermelho — alta transmissão",
};

export default async function SaudePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [data, tendencias, cids] = await Promise.all([
    getSaudeData(cidade.id_municipio),
    getSaudeTendencias(cidade.id_municipio),
    rankingCidsMunicipio(cidade.id_municipio),
  ]);
  const internacaoRecente = data.internacoesPorAno[0];

  // Ranking do ano mais recente com dado coletado (o coletor grava por
  // ano; a query já ordena por ano desc e internações desc).
  const anoMaisRecente = cids?.[0]?.ano ?? null;
  const cidsRanking: CidRegistro[] = (cids ?? [])
    .filter((c) => c.ano === anoMaisRecente)
    .slice(0, 12)
    .map((c) => {
      const diasMedio =
        c.dias_permanencia_total != null && (c.internacoes_total ?? 0) > 0
          ? c.dias_permanencia_total / c.internacoes_total!
          : 0;
      return enriquecerRegistroCid(
        c.cid_codigo,
        c.internacoes_total ?? 0,
        c.obitos_total ?? 0,
        diasMedio,
        c.valor_total ?? 0
      );
    });

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Saúde em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Internações hospitalares, arboviroses e vigilância
        epidemiológica de moradores de {cidade.nome}, direto de bases oficiais do SUS.
      </p>

      {!data.configured ? (
        <p className="mt-8 text-sm text-text-soft">Nenhum dado disponível no momento.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {/* Ranking dos CIDs por internação — sai da tabela
              `saude_internacoes_cid`, alimentada pelo coletor
              etl/betim/etl/bd/sih_cid.py. Sem dado coletado, lacuna. */}
          <section>
            {cidsRanking.length > 0 ? (
              <>
                <RankingCidTabela cids={cidsRanking} municipioNome={cidade.nome} />
                {anoMaisRecente ? (
                  <p className="mt-2 text-xs text-text-soft">
                    Ranking do ano {anoMaisRecente} — dados do SIH-SUS (DATASUS),
                    internações de moradores de {cidade.nome}.
                  </p>
                ) : null}
              </>
            ) : (
              <DataCard
                title="Ranking de diagnósticos por CID-10"
                source={{ label: "SIH/DATASUS", url: "https://datasus.saude.gov.br/" }}
              >
                <p className="text-sm text-text-soft">
                  O detalhamento das internações por CID-10 ainda não foi coletado
                  para {cidade.nome}. Ele entra em um próximo ciclo de coleta do
                  SIH-SUS — o portal não estima número que não coletou.
                </p>
              </DataCard>
            )}
          </section>

          {/* EVOLUÇÃO DAS INTERNAÇÕES — dado real de `saude_internacoes`
              (coletor etl/betim/etl/bd/sih_sim.py). Gráfico SVG com a
              tabela como alternativa em texto (regra do AGENTS.md). */}
          {data.internacoesPorAno.length > 1 ? (
            <section>
              <DataCard
                title="Evolução das internações de moradores"
                source={{ label: "SIH/DATASUS", url: "https://datasus.saude.gov.br/" }}
              >
                <GraficoInternacoesSvg
                  pontos={data.internacoesPorAno.map((i) => ({
                    ano: i.ano,
                    internacoes: i.qtdTotal,
                    obitos: i.obitosTotal,
                  }))}
                />
                <details className="mt-4 rounded-xl border border-border/60 bg-surface-2 p-3 text-xs text-text-soft">
                  <summary className="cursor-pointer font-medium text-text">
                    Ver os números em tabela
                  </summary>
                  <table className="mt-3 w-full text-left">
                    <thead>
                      <tr className="border-b border-border/60 text-text-soft">
                        <th className="pb-1.5 font-medium">Ano</th>
                        <th className="pb-1.5 text-right font-medium">Internações</th>
                        <th className="pb-1.5 text-right font-medium">Óbitos</th>
                        <th className="pb-1.5 text-right font-medium">Mortalidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-tabular">
                      {[...data.internacoesPorAno]
                        .sort((a, b) => a.ano - b.ano)
                        .map((i) => (
                          <tr key={i.ano}>
                            <td className="py-1.5 font-medium text-text">{i.ano}</td>
                            <td className="py-1.5 text-right">{formatNumberBR(i.qtdTotal)}</td>
                            <td className="py-1.5 text-right">{formatNumberBR(i.obitosTotal)}</td>
                            <td className="py-1.5 text-right">
                              {i.qtdTotal > 0
                                ? ((i.obitosTotal / i.qtdTotal) * 100).toFixed(1).replace(".", ",")
                                : "—"}
                              %
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </details>
              </DataCard>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2">
            <DataCard
              title="Rede de saúde cadastrada"
              source={{ label: "CNES/DATASUS", url: "https://cnes.datasus.gov.br/" }}
            >
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatNumberBR(data.totalEstabelecimentos)}
                  </p>
                  <p className="text-xs text-text-soft">estabelecimentos registrados</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-soft">
                O CNES público não divulga nome/endereço por estabelecimento —
                só o total registrado.
              </p>
            </DataCard>

            {internacaoRecente ? (
              <DataCard
                title={`Internações em ${internacaoRecente.ano}`}
                source={{ label: "SIH/DATASUS", url: "https://datasus.saude.gov.br/" }}
              >
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="font-tabular text-2xl font-bold text-text">
                      {formatNumberBR(internacaoRecente.qtdTotal)}
                    </p>
                    <p className="text-xs text-text-soft">internações de moradores</p>
                  </div>
                  <div>
                    <p className="font-tabular text-2xl font-bold text-text">
                      {formatNumberBR(internacaoRecente.obitosTotal)}
                    </p>
                    <p className="text-xs text-text-soft">óbitos durante internação</p>
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-border/60 text-xs">
                  {internacaoRecente.porCarater.map((c) => (
                    <li key={c.carater} className="flex justify-between py-1.5">
                      <span>{CARATER_LABELS[c.carater] ?? "Outro"}</span>
                      <strong className="font-tabular">{formatNumberBR(c.qtd)}</strong>
                    </li>
                  ))}
                </ul>
              </DataCard>
            ) : null}
          </section>

          {data.arboviroses.length > 0 ? (
            <DataCard
              title="Arboviroses (semana mais recente)"
              source={{ label: "InfoDengue", url: "https://info.dengue.mat.br/" }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {data.arboviroses.map((a) => (
                  <div
                    key={a.doenca}
                    className="rounded-xl border border-border/60 p-3 text-center"
                  >
                    <p className="text-sm font-medium text-text">
                      {DOENCA_LABELS[a.doenca] ?? a.doenca}
                    </p>
                    <p className="mt-1 font-tabular text-2xl font-bold text-text">
                      {formatNumberBR(a.casosAnoAtual)}
                    </p>
                    <p className="text-[.85em] text-text-soft">
                      {NIVEL_ALERTA_LABELS[a.nivelAlertaMax] ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border/60 bg-surface-2 p-3 text-xs text-text-soft">
                {tendencias.dengueJanelaCurta ? (
                  <p>
                    Só temos poucas semanas de histórico de dengue sincronizadas —
                    não dá pra afirmar se está subindo ou descendo no ano com
                    segurança ainda.
                  </p>
                ) : null}
                <p className="mt-1">
                  Sintomas e prevenção:{" "}
                  <a
                    href={PREVENCAO_DENGUE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    Ministério da Saúde ↗
                  </a>
                </p>
              </div>
            </DataCard>
          ) : null}

          {tendencias.configured &&
          (tendencias.causasEmAlta.length > 0 || tendencias.internacoesUrgenciaEmAlta) ? (
            <DataCard
              title="Tendências (não só o número do último ano)"
              source={{ label: "SIM + SIH / DATASUS", url: "https://datasus.saude.gov.br/" }}
            >
              <p className="mb-3 text-xs text-text-soft">
                Comparando a média dos 2 anos mais recentes com a dos 2 anos
                anteriores (2020 excluído do cálculo de causas infecciosas
                pra não confundir o pico da pandemia com uma tendência real).
              </p>
              <ul className="divide-y divide-border/60">
                {tendencias.causasEmAlta.map((c) => (
                  <li key={c.grupo_causa} className="flex items-center justify-between py-2">
                    <span className="text-text">{c.grupo_causa}</span>
                    <strong className="font-tabular text-primary">
                      +{Math.round(c.variacaoPercentual)}%
                    </strong>
                  </li>
                ))}
                {tendencias.internacoesUrgenciaEmAlta ? (
                  <li className="flex items-center justify-between py-2">
                    <span className="text-text">Internações de urgência</span>
                    <strong className="font-tabular text-primary">
                      +{Math.round(tendencias.variacaoInternacoesUrgencia)}%
                    </strong>
                  </li>
                ) : null}
              </ul>
            </DataCard>
          ) : null}

          {data.topCausasMortalidade.length > 0 ? (
            <DataCard
              title={`Principais causas de óbito${data.anoMortalidade ? ` (${data.anoMortalidade})` : ""}`}
              source={{ label: "SIM/DATASUS", url: "https://datasus.saude.gov.br/" }}
            >
              <ul className="divide-y divide-border/60">
                {data.topCausasMortalidade.map((c) => (
                  <li key={c.grupo_causa} className="flex items-center justify-between py-2">
                    <span className="text-text">{c.grupo_causa}</span>
                    <strong className="font-tabular text-text">
                      {formatNumberBR(c.obitos)}
                    </strong>
                  </li>
                ))}
              </ul>
            </DataCard>
          ) : null}
        </div>
      )}
    </main>
  );
}
