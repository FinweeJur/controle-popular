import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { hostDaPrefeitura } from "@/lib/db/queries/municipios";
import ListaServidores from "./ListaServidores";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Servidores — Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Servidores da Prefeitura de ${c.nome}: nome, cargo, lotação e vínculo. Dado público, com busca.`
);

interface ServidoresPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function ServidoresPage({ params: rota }: ServidoresPageProps) {
  const cidade = await cidadeDaRota(rota);
  // O rótulo já era dinâmico e a URL não: o card dizia "Prefeitura de Belo
  // Horizonte" e levava a betim.mg.gov.br. Rótulo certo sobre link errado é
  // pior que os dois errados — dá credibilidade ao destino.
  const hostPrefeitura = hostDaPrefeitura(cidade);

  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/prefeitura/servidores/dados`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Servidores</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Servidores da Prefeitura
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {/* `{" "}` no fim da linha: o JSX descarta a quebra de linha quando
            a linha seguinte começa com uma expressão, e "de" colaria em
            "Betim". Foi o único caso, e quem apontou foi o diff do texto
            renderizado — a leitura do código não pega. */}
        Nome, cargo, lotação e tipo de vínculo dos servidores da Prefeitura de{" "}
        {cidade.nome}. Informação pública — a remuneração individual não é exibida.
      </p>
      <p className="mt-2 text-xs text-text-soft">
        Fonte:{" "}
        {hostPrefeitura ? (
          <a href={hostPrefeitura} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Prefeitura de {cidade.nome} ↗
          </a>
        ) : (
          `Prefeitura de ${cidade.nome}`
        )}
      </p>

      <div className="mt-6">
        <ListaServidores base={baseDados} />
      </div>
    </div>
  );
}
