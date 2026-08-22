import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import DataCard from "@/app/[municipio]/components/DataCard";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { MOTIVO_ALERTA_INFO, resumoDeContratos, serieContratosPorAno } from "@/lib/betim/contratos";
import { getTemasPrefeitura, TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import Moeda from "@/app/components/Moeda";
import { formatCurrencyBRL, formatCurrencyCompactaBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaContratos from "./ListaContratos";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Contratos da Prefeitura — ${nomePortal(c)}`,
  (c) => `Lista de contratos administrativos da Prefeitura de ${c.nome}, dados públicos via PNCP.`
);

interface ContratosPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function ContratosPage({ params: rota }: ContratosPageProps) {
  const cidade = await cidadeDaRota(rota);

  // "Áreas de atuação" continua sem filtro nenhum — é "onde a Prefeitura
  // gasta no geral", não deveria mudar conforme o leitor filtra a tabela
  // abaixo (mesma regra de antes).
  //
  // Os cards e o gráfico de topo (Sprint 2, regra das cinco coisas) são os
  // totais da CIDADE INTEIRA medidos no servidor, sem filtro nenhum — não
  // tentam acompanhar a tabela interativa. É por isso que eles podem existir
  // sem mentir: os cards que foram removidos antes calculavam sobre o
  // conjunto filtrado da tabela e ficavam errados assim que alguém usava a
  // busca; estes aqui respondem "quanto é isso no total?", pergunta que não
  // depende de filtro.
  const [temasPrefeitura, resumo, serie] = await Promise.all([
    getTemasPrefeitura(cidade.id_municipio),
    resumoDeContratos(cidade.id_municipio),
    serieContratosPorAno(cidade.id_municipio),
  ]);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/prefeitura/contratos/dados`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Contratos</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Contratos públicos
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Dados do Portal Nacional de Contratações Públicas (PNCP). Cada
        valor e fornecedor com link direto à fonte oficial.{" "}
        <Link href="/prefeitura/licitacoes" className="font-medium text-accent hover:underline">
          Ver processos de licitação em andamento →
        </Link>
      </p>

      <p className="mb-6 text-xs text-text-soft">
        Todo alerta abaixo mostra a base legal ou o motivo estatístico que o
        gerou — nenhum é acusação.{" "}
        <Link href="/metodologia" className="font-medium text-accent hover:underline">
          Ver a metodologia completa de cada regra →
        </Link>
      </p>

      {resumo.ok && resumo.total > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-soft">Contratos</p>
            <p className="font-tabular mt-1 text-2xl font-bold text-text">
              {resumo.total.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-xs text-text-soft">assinados e publicados no PNCP, todos os anos.</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-soft">Valor somado</p>
            <p className="font-tabular mt-1 text-2xl font-bold text-text">
              <Moeda value={resumo.soma} />
            </p>
            <p className="mt-1 text-xs text-text-soft">soma dos valores globais, sem corrigir inflação entre anos.</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-text-soft">Com alerta</p>
            <p className="font-tabular mt-1 text-2xl font-bold text-text">
              {resumo.totalAlertas.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-xs text-text-soft">
              dispararam alguma regra de atenção. Alerta é indício para
              investigar — não é violação nem prova.
            </p>
          </div>
        </div>
      )}

      {serie.length > 1 && (
        <div className="mb-6">
          <DataCard title="Contratos por ano" source={{ label: "PNCP", url: "https://pncp.gov.br/" }}>
            <BarrasValor
              formatValor={formatCurrencyCompactaBR}
              itens={serie.map((s) => ({
                label: s.ano != null ? String(s.ano) : "Sem ano",
                valor: s.soma,
                sublabel: `· ${s.total.toLocaleString("pt-BR")} ${s.total === 1 ? "contrato" : "contratos"}${
                  s.comAlerta > 0 ? `, ${s.comAlerta.toLocaleString("pt-BR")} com alerta` : ""
                }`,
                titulo: `${s.ano != null ? s.ano : "Sem ano"}: ${formatCurrencyBRL(s.soma)} em ${s.total} contrato(s)`,
              }))}
            />
            <p className="mt-3 text-xs text-text-soft">
              Valor global contratado por ano de assinatura. Os mesmos números
              em texto estão na tabela abaixo (ordene pela coluna “Vigência”
              ou use o filtro de ano). Ano ausente na fonte aparece como
              “Sem ano”.
            </p>
          </DataCard>
        </div>
      )}

      {temasPrefeitura.ok && temasPrefeitura.temas.length > 0 && (
        <div className="mb-6">
          <DataCard
            title="Áreas de atuação da Prefeitura"
            source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
          >
            <p className="mb-3 text-sm">
              Em quantos contratos cada área aparece — pra onde vai o gasto
              público, por tema. Clique numa área pra filtrar a lista
              abaixo.
            </p>
            <AreasAtuacao
              temas={temasPrefeitura.temas}
              unidade="contratos"
              unidadeSingular="contrato"
              hrefFiltro="/prefeitura/contratos"
            />
          </DataCard>
        </div>
      )}

      <ListaContratos
        base={baseDados}
        municipioSlug={cidade.slug}
        motivoAlertaInfo={MOTIVO_ALERTA_INFO}
        temaLabels={TEMA_LABELS}
        temasOrdenados={TEMAS_ORDENADOS}
      />

      <PedidoLAI orgao="prefeitura" />
    </div>
  );
}
