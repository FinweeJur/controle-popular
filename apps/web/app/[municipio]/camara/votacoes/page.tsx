import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import PedidoLAI from "@/app/[municipio]/components/PedidoLAI";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import type { Cidade } from "@/lib/db/queries/municipios";
import ListaVotacoes from "./ListaVotacoes";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

/** Ver `fonteDaCamara` em `camara/page.tsx`: o crédito era "Câmara de Betim" fixo. */
function fonteDaCamara(cidade: Cidade) {
  const host =
    typeof cidade.fontes?.camara_host === "string" ? cidade.fontes.camara_host : undefined;
  return { label: `Câmara de ${cidade.nome}`, url: host };
}

export const generateMetadata = metadataDaCidade(
  (c) => `Votações da Câmara — ${nomePortal(c)}`,
  (c) => `Como cada vereador de ${c.nome}-${c.uf} votou, votação por votação.`
);

interface VotacoesPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function VotacoesPage({ params: rota }: VotacoesPageProps) {
  const cidade = await cidadeDaRota(rota);
  const fonteCamara = fonteDaCamara(cidade);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/camara/votacoes/dados`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">Votações</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Votações nominais
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quem votou o quê, matéria por matéria — o placar oficial mostra
        quantos votaram Sim ou Não; aqui está o nome de cada vereador por
        trás desse número. Nem toda câmara publica o voto individual; onde
        não publica, esta lista fica vazia.
      </p>
      {/* Crédito que o `DataCard` original carregava junto da contagem —
          a contagem agora é da própria `TabelaEstatica`. */}
      <p className="mt-2 text-xs text-text-soft">
        Fonte:{" "}
        {fonteCamara.url ? (
          <a href={fonteCamara.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {fonteCamara.label} ↗
          </a>
        ) : (
          fonteCamara.label
        )}
      </p>

      <div className="mt-6">
        <ListaVotacoes base={baseDados} />
      </div>

      <PedidoLAI orgao="camara" />
    </div>
  );
}
