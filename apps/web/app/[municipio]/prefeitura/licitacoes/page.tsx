import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import { getSituacoesLicitacoes, getModalidadesLicitacoes } from "@/lib/betim/licitacoes";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaLicitacoes from "./ListaLicitacoes";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Licitações — Prefeitura | ${nomePortal(c)}`,
  (c) => `Processos de licitação da Prefeitura de ${c.nome}, dados públicos via PNCP.`
);

interface LicitacoesPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function LicitacoesPage({ params: rota }: LicitacoesPageProps) {
  const cidade = await cidadeDaRota(rota);

  // Situações/modalidades continuam vindo do servidor (consultas pequenas,
  // populam os `<select>`) — só a lista de licitações em si virou índice
  // estático fatiado (ver `dados/[arquivo]/route.ts`).
  //
  // O card "Valor total estimado" (soma de `valor_estimado` sobre o
  // conjunto FILTRADO) foi removido, não só escondido: `TabelaEstatica` não
  // expõe o conjunto pós-busca-textual para `controles` (só o bruto, antes
  // da caixa de busca), então uma soma calculada aqui bateria com o filtro
  // ano/situação/modalidade mas ficaria errada assim que alguém usasse a
  // busca — pareceria a soma do que está na tela e não seria. Mostrar um
  // número que mente em alguns casos é pior que não mostrar.
  const [situacoes, modalidades] = await Promise.all([
    getSituacoesLicitacoes(cidade.id_municipio),
    getModalidadesLicitacoes(cidade.id_municipio),
  ]);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/prefeitura/licitacoes/dados`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Licitações</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Licitações
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Processos de compra pública da Prefeitura, do Portal Nacional de
        Contratações Públicas (PNCP) — a fase{" "}
        <strong className="font-medium text-text">anterior</strong> ao
        contrato assinado.{" "}
        <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
          Ver contratos já firmados →
        </Link>
      </p>
      <p className="mt-2 text-xs text-text-soft">
        Fonte:{" "}
        <a href="https://pncp.gov.br/" target="_blank" rel="noopener noreferrer" className="hover:underline">
          PNCP ↗
        </a>
      </p>

      <div className="mt-6">
        <ListaLicitacoes base={baseDados} situacoesDisponiveis={situacoes} modalidadesDisponiveis={modalidades} />
      </div>

      <PedidoLAI orgao="prefeitura" />
    </div>
  );
}
