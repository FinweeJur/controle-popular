import { paramsDasCidades } from "@/lib/betim/staticParams";
import PainelAdmin from "./PainelAdmin";

/**
 * `output: 'export'` exige a função DECLARADA aqui — re-export não é
 * reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
 *
 * POR QUE ESTA PÁGINA PRECISOU SER PARTIDA EM DUAS
 *
 * O painel é `"use client"` inteiro, e um componente cliente NÃO PODE
 * exportar `generateStaticParams` — é export de servidor. Por isso a varredura
 * de 2026-08-09, que pôs a função em 53 páginas, deixou esta de fora com a
 * justificativa "`admin` é client component". A justificativa está errada: em
 * `output: 'export'` toda página sob `[municipio]` precisa ser enumerada para
 * virar arquivo, inclusive as que não têm nada de servidor. Sem isto o export
 * morre com
 *
 *     Page "/[municipio]/admin" is missing "generateStaticParams()"
 *     so it cannot be used with "output: export" config.
 *
 * Medido em 2026-08-09: com as páginas de município recebendo params de
 * verdade, `admin` foi a página que sobrou reprovando o export — e é a única
 * cuja causa NÃO é o banco vazio.
 *
 * O arranjo é o mínimo que resolve: esta casca é servidor e só declara a
 * função; o painel inteiro segue cliente, em `PainelAdmin.tsx`, sem uma linha
 * de lógica alterada.
 */
export async function generateStaticParams() {
  return paramsDasCidades();
}

export default function AdminPage() {
  return <PainelAdmin />;
}
