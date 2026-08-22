import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import RepasseBrumadinho from "@/app/[municipio]/components/RepasseBrumadinho";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { getVisaoGeral } from "@/lib/betim/prefeitura";
import { getCaixaDisponivel } from "@/lib/betim/caixa";
import { getDiarioOficialInfo } from "@/lib/betim/diarioOficial";
import Moeda from "@/app/components/Moeda";
import { formatCurrencyBRL, formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Contratos, servidores, despesas e demais dados públicos da Prefeitura de ${c.nome}.`
);

// Tab list per plan §7. `href: null` renders as an inert "em breve" pill —
// kept in the type for whichever sub-page hasn't shipped yet.
const TABS: { label: string; href: string | null }[] = [
  { label: "Visão geral", href: "/prefeitura" },
  { label: "Contratos", href: "/prefeitura/contratos" },
  { label: "Licitações", href: "/prefeitura/licitacoes" },
  { label: "Cultura", href: "/prefeitura/cultura" },
  { label: "Servidores", href: "/prefeitura/servidores" },
  { label: "Despesas", href: "/prefeitura/despesas" },
  { label: "Diárias", href: "/prefeitura/diarias" },
  { label: "Obras", href: "/prefeitura/obras" },
  { label: "Legislação", href: "/camara/legislacao" },
];

export default async function PrefeituraHubPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [visaoGeral, caixa, diario] = await Promise.all([
    getVisaoGeral(cidade.id_municipio),
    getCaixaDisponivel(cidade.id_municipio),
    getDiarioOficialInfo(cidade),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="mb-2 font-display text-2xl font-bold tracking-tight">
        Prefeitura de {cidade.nome}
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-text-soft">
        Dados públicos sobre contratos, gastos e estrutura da administração
        municipal de {cidade.nome}, agregados de fontes oficiais.
      </p>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) =>
          tab.href ? (
            <Link
              key={tab.label}
              href={tab.href}
              className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/15"
            >
              {tab.label}
            </Link>
          ) : (
            <span
              key={tab.label}
              className="cursor-not-allowed rounded-full bg-surface-2 px-4 py-1.5 text-sm font-medium text-text-soft"
              title="Em breve"
            >
              {tab.label} <span className="text-xs">(em breve)</span>
            </span>
          )
        )}
      </nav>

      {caixa ? (
        <div className="mb-6">
          <DataCard
            title={`Caixa disponível em ${caixa.ano}`}
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            <p className="font-tabular text-2xl font-bold text-text">
              <Moeda value={caixa.valor} />
            </p>
            {caixa.anoAnterior && caixa.valorAnterior ? (
              <p className="mt-1 text-xs text-text-soft">
                {caixa.valor >= caixa.valorAnterior ? "+" : ""}
                <Moeda value={caixa.valor - caixa.valorAnterior} /> em relação a{" "}
                {caixa.anoAnterior}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-text-soft">
              Inclui dinheiro que já tem destino certo (saúde, educação
              etc.). Não é dinheiro livre pra gastar em qualquer coisa.
            </p>
          </DataCard>
        </div>
      ) : null}

      <RepasseBrumadinho idMunicipio={cidade.id_municipio} />

      {/* Só cidade com fonte `diario_oficial` ganha o card — link para o
          diário errado é pior que ausência (mesma doutrina da rede de
          proteção). Itinga não tem fonte e não renderiza. */}
      {typeof cidade.fontes?.diario_oficial === "string" ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
              Diário Oficial (Órgão Oficial)
            </h2>
            <p className="mt-1 max-w-xl text-sm text-text-soft">
              Leis, decretos e atos são publicados diariamente no Órgão Oficial
              de {cidade.nome}.{" "}
              {diario?.ultimaEdicao ? (
                <>
                  Última edição: <strong className="text-text">nº {diario.ultimaEdicao}</strong>
                  {diario.ultimaData ? <> de {formatDateBR(diario.ultimaData)}</> : null} ·{" "}
                  {formatNumberBR(diario.totalAno)} edições em {diario.ano}.
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={cidade.fontes.diario_oficial}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
            >
              Ver edições ↗
            </a>
          <Link
              href="/camara/legislacao"
              className="rounded-full bg-surface-2 px-4 py-1.5 text-sm font-medium text-text hover:bg-surface-2/70"
            >
              Leis e decretos
            </Link>
          </div>
        </div>
      ) : null}

      {!visaoGeral.ok ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="mb-2 font-medium text-text">Visão geral — em breve</p>
          <p>
            Indicadores como gastos por função e maiores fornecedores
            aparecem aqui assim que os dados oficiais forem conectados. Por
            enquanto, veja os{" "}
            <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
              contratos administrativos
            </Link>
            , já disponíveis via PNCP.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visaoGeral.custoPerCapitaAno > 0 && (
            <DataCard
              title={`Custo da Prefeitura por habitante em ${visaoGeral.ano}`}
              source={{ label: "SICONFI/Tesouro Nacional + IBGE", url: "https://siconfi.tesouro.gov.br/" }}
            >
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="font-tabular text-2xl font-bold text-text">
                  <Moeda value={visaoGeral.custoPerCapitaAno / 12} />
                  <span className="ml-1 text-sm font-normal text-text-soft">por mês</span>
                </p>
                <p className="font-tabular text-lg font-semibold text-text-soft">
                  <Moeda value={visaoGeral.custoPerCapitaAno} />
                  <span className="ml-1 text-sm font-normal">por ano</span>
                </p>
              </div>
              <p className="mt-2 text-xs text-text-soft">
                Despesa total paga em {visaoGeral.ano} (
                <Moeda value={visaoGeral.despesaTotal} />) dividida pela
                população de {visaoGeral.populacaoAno} (
                {formatNumberBR(visaoGeral.populacao)} habitantes). Mede o
                tamanho do orçamento por pessoa — não é um valor cobrado de
                cada morador.
              </p>
            </DataCard>
          )}

          <DataCard
            title={`Receita realizada em ${visaoGeral.ano}`}
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            <p className="font-tabular text-2xl font-bold text-text">
              <Moeda value={visaoGeral.receitaTotal} />
            </p>
          </DataCard>

          <DataCard
            title={`Maiores gastos por função em ${visaoGeral.ano} (despesas pagas)`}
            source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
          >
            <BarrasValor
              formatValor={formatCurrencyCompactaBR}
              itens={visaoGeral.gastosPorFuncao.map((item) => ({
                label: item.funcao,
                valor: item.valor,
                titulo: `${item.funcao}: ${formatCurrencyBRL(item.valor)} pagos em ${visaoGeral.ano}`,
              }))}
            />
            <p className="mt-3 text-xs text-text-soft">
              Ver o detalhe completo em{" "}
              <Link href="/prefeitura/despesas" className="font-medium text-accent hover:underline">
                Despesas por função →
              </Link>
            </p>
          </DataCard>

          <DataCard
            title="Maiores fornecedores (soma de todos os contratos)"
            source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
          >
            <BarrasValor
              formatValor={formatCurrencyCompactaBR}
              itens={visaoGeral.maioresFornecedores.map((item) => ({
                label: item.nome,
                valor: item.valor,
                titulo: `${item.nome}: ${formatCurrencyBRL(item.valor)} somando todos os contratos`,
              }))}
            />
          </DataCard>
        </div>
      )}
    </div>
  );
}
