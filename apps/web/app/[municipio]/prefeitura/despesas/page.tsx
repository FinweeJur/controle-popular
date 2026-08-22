import { paramsDasCidades } from "@/lib/betim/staticParams";
import { Suspense } from "react";
import Link from "@/lib/betim/link";
import { getDespesasPorFuncao } from "@/lib/betim/despesas";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import PainelDespesas, { PainelDespesasCompleto } from "./PainelDespesas";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
// Filtro é do cliente (`useSearchParams()` no componente de lista). Sem
// `force-static`, `output: export` trata a rota como dinâmica e aborta com
// "missing generateStaticParams()" — mensagem que não descreve a causa.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Despesas da Prefeitura de ${c.nome} por área — ${nomePortal(c)}`,
  (c) =>
    `Quanto a Prefeitura de ${c.nome} gastou em saúde, educação, urbanismo e outras funções. Valores e fatia do total.`
);

interface DespesasPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function DespesasPage({ params }: DespesasPageProps) {
  const cidade = await cidadeDaRota(params);
  // SEM o filtro de ano: ele agora é do cliente (ver `PainelDespesas`).
  // Passar `?ano=` para o `getDespesasPorFuncao` exigiria ler `searchParams`
  // aqui, e é exatamente isso que `output: 'export'` proíbe.
  const maisRecente = await getDespesasPorFuncao(cidade.id_municipio);
  // O ano era `where ano = ?` no SQL, então "trazer tudo" é buscar cada ano —
  // um ano não se deriva do outro. Cabe: a consulta soma no banco e devolve
  // no máximo as 29 funções COFOG por ano, e o ETL do SICONFI começa em 2015;
  // são algumas centenas de linhas, e o total não cresce com o tamanho da
  // cidade. O ano mais recente reaproveita a busca acima; os demais custam
  // uma consulta cada, mas só no build — sem `searchParams` a rota volta a
  // ser estática, então isso deixa de acontecer a cada troca de filtro.
  const porAno = await Promise.all(
    maisRecente.anosDisponiveis.map((ano) =>
      ano === maisRecente.ano ? maisRecente : getDespesasPorFuncao(cidade.id_municipio, ano)
    )
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Despesas</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Despesas por função
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quanto a Prefeitura de {cidade.nome} gastou em cada área — saúde, educação,
        urbanismo e assim por diante. Mostra pra onde o dinheiro foi.
      </p>

      {/* O fallback é o painel SEM filtro, não um esqueleto: é o que o
          servidor tem para mostrar antes de o navegador ler a query, e é
          também exatamente o conteúdo certo para quem chega sem `?ano=` —
          o ano mais recente, que já era o padrão. */}
      <Suspense fallback={<PainelDespesasCompleto porAno={porAno} />}>
        <PainelDespesas porAno={porAno} />
      </Suspense>
    </div>
  );
}
