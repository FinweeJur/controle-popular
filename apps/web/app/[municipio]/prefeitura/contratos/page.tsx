import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import DataCard from "@/app/[municipio]/components/DataCard";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import { MOTIVO_ALERTA_INFO } from "@/lib/betim/contratos";
import { getTemasPrefeitura, TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
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
  // Os cards "Contratos encontrados"/"Valor total"/"Contratos com alerta"
  // foram removidos, não só escondidos: TabelaEstatica não expõe pra
  // `controles` o conjunto DEPOIS da busca textual (só o bruto, antes da
  // caixa de busca) — uma soma ou contagem calculada aqui bateria com os
  // filtros estruturados mas ficaria errada assim que alguém usasse a
  // busca. Mostrar um número que mente às vezes é pior que não mostrar
  // (mesma decisão de `prefeitura/licitacoes`).
  const temasPrefeitura = await getTemasPrefeitura(cidade.id_municipio);

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
