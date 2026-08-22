import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { getGastosCulturaPorAno, fetchContratosCultura } from "@/lib/betim/cultura";
import { MOTIVO_ALERTA_INFO } from "@/lib/betim/contratos";
import Moeda from "@/app/components/Moeda";
import { formatCurrencyBRL, formatCurrencyCompactaBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaContratosCultura from "./ListaContratosCultura";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Cultura — Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Quanto a Prefeitura de ${c.nome} gastou em Cultura, e os contratos de cultura, esporte e lazer firmados via PNCP.`
);

interface CulturaPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function CulturaPage({ params: rota }: CulturaPageProps) {
  const cidade = await cidadeDaRota(rota);

  // Duas fontes, dois significados de "cultura" — ver o cabeçalho de
  // `lib/betim/cultura.ts`. `gastos` é a despesa OFICIAL na função
  // orçamentária "Cultura" (SICONFI, não mistura com esporte/lazer);
  // `contratosResumo` é a soma/contagem dos contratos do PNCP tagueados
  // como "Cultura, Esporte e Lazer" (aqui SIM entra esporte e lazer — é o
  // balaio já usado no resto do site, sem calibração nova).
  const [gastos, contratosResumo] = await Promise.all([
    getGastosCulturaPorAno(cidade.id_municipio),
    fetchContratosCultura(cidade.id_municipio, { porPagina: 1 }),
  ]);

  const anoRecente = gastos.porAno[0];

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/prefeitura/cultura/dados`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Cultura</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Cultura
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quanto a Prefeitura de {cidade.nome} gastou oficialmente em Cultura, e
        os contratos de cultura, esporte e lazer firmados via PNCP —{" "}
        <strong className="font-medium text-text">dois números diferentes</strong>,
        cada um explicado abaixo com a fonte que o sustenta.
      </p>

      {!gastos.ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Despesas por função ainda não disponíveis para {cidade.nome}.
        </div>
      ) : (
        <div className="mt-6">
          <DataCard
            title={
              anoRecente
                ? `Despesa paga em Cultura em ${anoRecente.ano}`
                : "Despesa paga em Cultura"
            }
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            {anoRecente && (
              <p className="mb-4">
                <strong className="font-tabular text-2xl font-bold text-text">
                  <Moeda value={anoRecente.valor} />
                </strong>{" "}
                <span className="text-text-soft">
                  — {anoRecente.pct.toFixed(1)}% do total pago por função em{" "}
                  {anoRecente.ano}.
                </span>
              </p>
            )}
            {gastos.porAno.length > 1 && (
              <>
                <p className="mb-2 text-xs text-text-soft">Evolução ano a ano:</p>
                <BarrasValor
                  formatValor={formatCurrencyCompactaBR}
                  itens={gastos.porAno
                    .slice()
                    .reverse()
                    .map((g) => ({
                      label: String(g.ano),
                      valor: g.valor,
                      sublabel: `· ${g.pct.toFixed(1)}%`,
                      titulo: `${g.ano}: ${formatCurrencyBRL(g.valor)} (${g.pct.toFixed(1)}% das despesas por função)`,
                    }))}
                />
              </>
            )}
            <p className="mt-4 text-xs text-text-soft">
              É o que a Prefeitura de fato <strong>pagou</strong> na função
              orçamentária “Cultura” — não inclui esporte e lazer, que são
              função separada.{" "}
              <Link href="/prefeitura/despesas" className="font-medium text-accent hover:underline">
                Ver despesas por todas as funções →
              </Link>
            </p>
          </DataCard>
        </div>
      )}

      {contratosResumo.ok && contratosResumo.total > 0 && (
        <div className="mt-6">
          <DataCard
            title="Contratos de Cultura, Esporte e Lazer (PNCP)"
            source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
          >
            <p>
              <strong className="font-tabular text-2xl font-bold text-text">
                <Moeda value={contratosResumo.sum} />
              </strong>{" "}
              <span className="text-text-soft">
                somados em {contratosResumo.total}{" "}
                {contratosResumo.total === 1 ? "contrato" : "contratos"}
                {contratosResumo.totalAlertas > 0 && (
                  <>
                    {" "}
                    ({contratosResumo.totalAlertas} com{" "}
                    {contratosResumo.totalAlertas === 1 ? "alerta" : "alertas"})
                  </>
                )}
                .
              </span>
            </p>
            <p className="mt-3 text-xs text-text-soft">
              Contratos cujo órgão contratante ou objeto foi classificado
              como Cultura, Esporte OU Lazer — aqui os três entram juntos
              (mesmo critério usado no resto do site para classificar
              contratos por área). Clique a coluna “Valor global” na tabela
              abaixo para ordenar do maior para o menor.
            </p>
          </DataCard>
        </div>
      )}

      <div className="mt-6">
        <ListaContratosCultura
          base={baseDados}
          municipioSlug={cidade.slug}
          motivoAlertaInfo={MOTIVO_ALERTA_INFO}
        />
      </div>

      <PedidoLAI orgao="prefeitura" />
    </div>
  );
}
