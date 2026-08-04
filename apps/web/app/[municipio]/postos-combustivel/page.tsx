import { Suspense } from "react";
import { fetchPostosAnp } from "@/lib/betim/postos";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaPostos from "./ListaPostos";

export const generateMetadata = metadataDaCidade(
  (c) => `Postos de Combustível — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Postos de combustível de ${c.nome}-${c.uf} cadastrados na ANP, com bandeira, produtos e nota de conformidade (PMQC).`
);

export default async function PostosCombustivelPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // SEM o filtro de bandeira: ele agora é do cliente (ver `ListaPostos`).
  // Passar `?bandeira=` para o SQL exigiria ler `searchParams` aqui, e é
  // exatamente isso que `output: 'export'` proíbe.
  const { rows, configured } = await fetchPostosAnp(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Postos de Combustível
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Cadastro de revendedores de combustíveis automotivos de {cidade.nome}-{cidade.uf},
        direto da ANP. A nota de 0 a 5 é derivada do histórico de
        inadimplência no Programa de Monitoramento da Qualidade dos
        Combustíveis (PMQC) — quando a ANP ainda não publicou nenhuma
        ocorrência pra um posto, ele aparece com nota 5.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* O fallback é a lista COMPLETA, não um esqueleto: é o que o
            servidor tem para mostrar antes de o navegador ler a query, e é
            também exatamente o conteúdo certo para quem chega sem filtro. */}
        <Suspense fallback={<ListaPostos postos={rows} configured={configured} />}>
          <ListaPostos postos={rows} configured={configured} />
        </Suspense>
      </section>
    </main>
  );
}
