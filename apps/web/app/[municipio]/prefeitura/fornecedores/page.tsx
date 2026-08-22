import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor from "@/app/[municipio]/components/charts/BarrasValor";
import { fetchFornecedores, resumoDosFornecedores } from "@/lib/betim/fornecedores";
import Moeda from "@/app/components/Moeda";
import { formatCurrencyBRL, formatCurrencyCompactaBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaFornecedores from "./ListaFornecedores";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Maiores fornecedores da Prefeitura — ${nomePortal(c)}`,
  (c) => `Ranking de fornecedores da Prefeitura de ${c.nome} por valor total contratado, número de contratos e órgãos atendidos — dados públicos via PNCP.`
);

interface FornecedoresPageProps {
  params: Promise<{ municipio: string }>;
}

const ROTULO_NAO_IDENTIFICADO = "Fornecedor não identificado";

export default async function FornecedoresPage({ params: rota }: FornecedoresPageProps) {
  const cidade = await cidadeDaRota(rota);
  const { rows, ok } = await fetchFornecedores(cidade.id_municipio);
  const resumo = resumoDosFornecedores(rows);

  // Período efetivamente coberto, medido do dado — nunca digitado à mão.
  const anos = rows
    .flatMap((f) => [f.ano_primeiro, f.ano_ultimo])
    .filter((a): a is number => typeof a === "number");
  const periodo =
    anos.length > 0 ? `${Math.min(...anos)}–${Math.max(...anos)}` : null;

  // Top 10 para o gráfico. Exclui o balaio "não identificado" (que não é um
  // fornecedor, é uma lacuna — ela continua visível na tabela, e a nota do
  // gráfico diz que foi excluída).
  const topGrafico = rows
    .filter((r) => r.chave !== ROTULO_NAO_IDENTIFICADO)
    .sort((a, b) => b.valor_total - a.valor_total)
    .slice(0, 10);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/prefeitura/fornecedores/dados`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Fornecedores</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Maiores fornecedores
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Ranking das empresas que mais receberam contratos da Prefeitura de{" "}
        {cidade.nome}, somando todos os anos coletados{periodo ? ` (${periodo})` : ""}.
        Dados do Portal Nacional de Contratações Públicas (PNCP), agregados por
        CNPJ.
      </p>

      <p className="mb-6 max-w-3xl text-xs text-text-soft">
        O que você está vendo e o que NÃO está: os valores somam o campo
        “valor global” de cada contrato, sem correção pela inflação — anos
        diferentes entram na mesma soma. Quando a fonte não informa o CNPJ,
        o fornecedor é agrupado pelo nome publicado, o que pode dividir uma
        mesma empresa em duas linhas. Só entra aqui contrato já assinado no
        PNCP; despesas por empenho e licitações em andamento estão em outras
        telas. Nenhum dado de pessoa física é exibido nesta página.
      </p>

      {!ok ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Ranking de fornecedores ainda não disponível para {cidade.nome}. A
          ausência é declarada, não escondida: ou a coleta do PNCP desta
          cidade não rodou, ou o banco de dados não respondeu neste build.
          Veja os{" "}
          <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
            contratos administrativos
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-text-soft">Fornecedores</p>
              <p className="font-tabular mt-1 text-2xl font-bold text-text">
                {resumo.totalFornecedores.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-xs text-text-soft">
                empresas distintas com contrato assinado no período.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-text-soft">Valor total contratado</p>
              <p className="font-tabular mt-1 text-2xl font-bold text-text">
                <Moeda value={resumo.totalValor} />
              </p>
              <p className="mt-1 text-xs text-text-soft">
                soma dos valores globais, sem corrigir inflação entre anos.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-text-soft">Concentração</p>
              <p className="font-tabular mt-1 text-2xl font-bold text-text">
                {resumo.top1Pct != null ? `${resumo.top1Pct.toFixed(1)}%` : "—"}
                {resumo.top5Pct != null && (
                  <span className="ml-1 text-sm font-normal text-text-soft">
                    / {resumo.top5Pct.toFixed(1)}%
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-text-soft">
                fatia do valor total no maior fornecedor / nos cinco maiores.
                Concentração alta é sinal de atenção para investigar — não é
                irregularidade em si nem prova de nada.
              </p>
            </div>
          </div>

          {topGrafico.length > 0 && (
            <div className="mb-6">
              <DataCard
                title={`Top ${topGrafico.length} fornecedores por valor contratado`}
                source={{ label: "PNCP", url: "https://pncp.gov.br/" }}
              >
                <BarrasValor
                  formatValor={formatCurrencyCompactaBR}
                  itens={topGrafico.map((f) => ({
                    label: f.razao_social ?? ROTULO_NAO_IDENTIFICADO,
                    valor: f.valor_total,
                    sublabel: `· ${f.num_contratos} ${f.num_contratos === 1 ? "contrato" : "contratos"}`,
                    titulo: `${f.razao_social ?? ROTULO_NAO_IDENTIFICADO}: ${formatCurrencyBRL(f.valor_total)} em ${f.num_contratos} contrato(s), atendendo ${f.num_orgaos} órgão(s)`,
                  }))}
                />
                <p className="mt-3 text-xs text-text-soft">
                  Os mesmos números em texto e com filtros estão na tabela
                  abaixo — o gráfico não substitui a tabela, só resume os dez
                  primeiros. Ficaram de fora deste gráfico os contratos sem
                  fornecedor identificado ({rows.find((r) => r.chave === ROTULO_NAO_IDENTIFICADO)?.num_contratos ?? 0}{" "}
                  contratos), que continuam na tabela.
                </p>
              </DataCard>
            </div>
          )}

          <ListaFornecedores base={baseDados} municipioSlug={cidade.slug} />
        </>
      )}

      <PedidoLAI orgao="prefeitura" />
    </div>
  );
}
