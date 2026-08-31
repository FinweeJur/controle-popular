import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { getAtosDiarioMunicipio } from "@/lib/betim/diarioOficial";
import { ROTULOS_TIPO, type TipoAto } from "@/lib/diario/classificarAto";
import PainelDiario, { type AtoDiarioExibicao } from "./PainelDiario";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Diário Oficial de ${c.nome} — ${nomePortal(c)}`,
  (c) =>
    `Atos oficiais, extratos de contratos, editais de licitação, decretos e convênios publicados na imprensa oficial da Prefeitura de ${c.nome}.`
);

interface DiarioPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function DiarioMunicipalPage({ params: rota }: DiarioPageProps) {
  const cidade = await cidadeDaRota(rota);
  const atosRaw = await getAtosDiarioMunicipio(cidade.slug);

  const atos: AtoDiarioExibicao[] = atosRaw.map((a) => ({
    ...a,
    tipo: a.tipo as TipoAto,
  }));

  // Agregações de topo (Regra das 5 coisas)
  const totalAtos = atos.length;
  const totalEditais = atos.filter((a) => a.tipo === "edital").length;
  const totalContratos = atos.filter((a) => a.tipo === "contrato").length;
  const totalConvenios = atos.filter((a) => a.tipo === "convenio").length;
  const totalDecretos = atos.filter((a) => a.tipo === "decreto").length;

  // Distribuição por tipo para o gráfico
  const contagemPorTipo: Record<string, number> = {};
  for (const a of atos) {
    contagemPorTipo[a.tipo] = (contagemPorTipo[a.tipo] ?? 0) + 1;
  }

  const itensGrafico = Object.entries(contagemPorTipo)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, qtd]) => ({
      label: ROTULOS_TIPO[tipo as TipoAto] ?? tipo,
      valor: qtd,
      sublabel: `· ${qtd} ${qtd === 1 ? "matéria" : "matérias"}`,
      titulo: `${ROTULOS_TIPO[tipo as TipoAto] ?? tipo}: ${qtd} matérias publicadas`,
    }));

  const baseUrl = `https://controlepopular.com.br/${cidade.slug}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: cidade.nome, item: `${baseUrl}/` },
          { name: "Prefeitura", item: `${baseUrl}/prefeitura` },
          { name: "Diário Oficial", item: `${baseUrl}/prefeitura/diario` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <nav className="mb-4 text-[.82em] text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>{" "}
          ·{" "}
          <Link href="/prefeitura" className="hover:text-primary">
            Prefeitura
          </Link>{" "}
          · <span className="text-text">Diário Oficial</span>
        </nav>

        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Diário Oficial de {cidade.nome}
        </h1>
        <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
          Matérias, decretos, portarias, editais e extratos de contratos publicados no órgão de
          imprensa oficial de {cidade.nome}. Dados categorizados deterministicamente para facilitar a
          fiscalização e busca rápida.
        </p>

        {/* 1. Cartões Agregados de Topo */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Total de Matérias</span>
            <span className="mt-1 block font-tabular text-2xl font-bold text-text">
              {formatNumberBR(totalAtos)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">atos catalogados</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Editais e Licitações</span>
            <span className="mt-1 block font-tabular text-2xl font-bold text-primary">
              {formatNumberBR(totalEditais)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              <Link href="/prefeitura/licitacoes" className="hover:underline">
                ver licitações →
              </Link>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Extratos de Contratos</span>
            <span className="mt-1 block font-tabular text-2xl font-bold text-accent">
              {formatNumberBR(totalContratos)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">
              <Link href="/prefeitura/contratos" className="hover:underline">
                ver contratos →
              </Link>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <span className="block text-xs text-text-soft">Convênios e Fomento</span>
            <span className="mt-1 block font-tabular text-2xl font-bold text-text">
              {formatNumberBR(totalConvenios)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">parcerias MROSC</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 col-span-2 sm:col-span-1">
            <span className="block text-xs text-text-soft">Decretos</span>
            <span className="mt-1 block font-tabular text-2xl font-bold text-text">
              {formatNumberBR(totalDecretos)}
            </span>
            <span className="mt-1 block text-xs text-text-soft">atos normativos</span>
          </div>
        </div>

        {/* 2. Gráfico SVG de Distribuição */}
        {itensGrafico.length > 1 && (
          <div className="mt-6">
            <DataCard
              title="Distribuição das matérias por tipo de ato"
              source={{
                label: "Diário Oficial Municipal",
                url: typeof cidade.fontes?.diario_oficial === "string" ? cidade.fontes.diario_oficial : "https://controlepopular.com.br",
              }}
            >
              <BarrasValor
                formatValor={(v) => `${v} atos`}
                itens={itensGrafico}
              />
              <p className="mt-3 text-xs text-text-soft">
                Classificação determinística por cabeçalho do ato. Valores e CNPJs são extraídos do
                corpo da matéria com anonimização automática de CPFs (LGPD).
              </p>
            </DataCard>
          </div>
        )}

        {/* 3, 4, 5. Filtro, Busca, Tabela e Exportação CSV */}
        <PainelDiario
          atos={atos}
          municipioSlug={cidade.slug}
          nomeMunicipio={cidade.nome}
        />

        <div className="mt-12">
          <PedidoLAI orgao="prefeitura" />
        </div>
      </div>
    </>
  );
}
