import { Suspense } from "react";
import { fetchColetaLixo } from "@/lib/betim/servicos";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaColeta from "./ListaColeta";

export const generateMetadata = metadataDaCidade(
  (c) => `Coleta de Lixo — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Dias e horários de coleta de lixo comum e seletiva por bairro em ${c.nome}-${c.uf}.`
);

export default async function ColetaLixoPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  // Componente de servidor não usa hook: a cidade vem do `params` da rota.
  const cidade = await cidadeDaRota(params);
  // SEM o filtro de bairro: ele agora é do cliente (ver `ListaColeta`).
  // Passar `?bairro=` para o SQL exigiria ler `searchParams` aqui, e é
  // exatamente isso que `output: 'export'` proíbe.
  const { rows, configured } = await fetchColetaLixo(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Coleta de Lixo
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Consulte os dias de coleta comum e seletiva do seu bairro e baixe um
        lembrete recorrente pro seu calendário.
      </p>

      {/* O fallback é a caixa vazia com a agenda COMPLETA, não um esqueleto: é
          o que o servidor tem para mostrar antes de o navegador ler a query, e
          é também exatamente o conteúdo certo para quem chega sem filtro. */}
      <Suspense
        fallback={
          <ListaColeta
            rows={rows}
            configured={configured}
            municipio={cidade.slug}
            cidadeNome={cidade.nome}
          />
        }
      >
        <ListaColeta
          rows={rows}
          configured={configured}
          municipio={cidade.slug}
          cidadeNome={cidade.nome}
        />
      </Suspense>
    </main>
  );
}
