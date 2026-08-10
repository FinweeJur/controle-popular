import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import { getSituacoesDisponiveis } from "@/lib/betim/proposicoes";
import { TIPO_PROPOSICAO_LABELS } from "@/lib/betim/vereadores";
import { TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import { notFound } from "next/navigation";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { rotuloLegislatura, temFonte } from "@/lib/db/queries/municipios";
import ListaProposicoes from "./ListaProposicoes";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Proposições da Câmara — ${nomePortal(c)}`,
  (c) => `Todos os projetos de lei, requerimentos, indicações e emendas apresentados na Câmara Municipal de ${c.nome}, com busca e filtro.`
);

interface ProposicoesPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function ProposicoesPage({ params: rotaParams }: ProposicoesPageProps) {
  const cidade = await cidadeDaRota(rotaParams);
  // Câmara que não publica produção legislativa não ganha uma tela de busca
  // permanentemente vazia. Medido: o SAPL de Araçuaí devolve 0 em
  // `materia/materialegislativa` e a Câmara de Itinga não tem o módulo. É a
  // mesma regra do menu em `servicos/page.tsx` — "um menu que aponta para 404
  // é pior que um menu curto" —, aplicada à rota inteira.
  if (!temFonte(cidade, "camara_proposicoes")) notFound();
  const sistemaCamara =
    typeof cidade.fontes?.camara_sistema === "string" ? cidade.fontes.camara_sistema : null;

  // Situações distintas continuam vindo do servidor (consulta pequena,
  // popula o `<select>`) — só a lista de proposições em si virou índice
  // estático fatiado (ver `dados/[arquivo]/route.ts`).
  const situacoes = await getSituacoesDisponiveis(cidade.id_municipio);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/camara/proposicoes/dados`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">Proposições</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Proposições da Câmara
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {/* "PROLEGIS" é o sistema legislativo de BETIM. Belo Horizonte usa o
            SIL e São Paulo, o SPLegis — citar o nome errado numa página que
            se propõe a dizer de onde o dado vem é pior que não citar. O nome
            vem de `municipios.fontes.camara_sistema`. */}
        Projetos de lei, requerimentos, indicações e emendas apresentados na{" "}
        {rotuloLegislatura(cidade)}, direto do sistema legislativo
        {sistemaCamara ? ` (${sistemaCamara})` : ""} da Câmara Municipal de{" "}
        {cidade.nome}.
      </p>

      <div className="mt-6">
        <ListaProposicoes
          base={baseDados}
          tipos={TIPO_PROPOSICAO_LABELS}
          temaLabels={TEMA_LABELS}
          temasOrdenados={TEMAS_ORDENADOS}
          situacoesDisponiveis={situacoes}
        />
      </div>

      <PedidoLAI orgao="camara" />
    </div>
  );
}
