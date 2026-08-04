import { Suspense } from "react";
import { fetchZapEstabelecimentos } from "@/lib/betim/zap";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaZap, { ListaZapCompleta } from "./ListaZap";
import ZapForm from "./ZapForm";

export const generateMetadata = metadataDaCidade(
  (c) => `Zap ${c.nome} — Cadastro de negócios no WhatsApp | ${nomePortal(c)}`,
  (c) => `Encontre e divulgue negócios locais de ${c.nome}-${c.uf} direto pelo WhatsApp — cadastro gratuito e independente.`
);

export default async function ZapBetimPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // SEM os filtros de categoria e busca: eles agora são do cliente (ver
  // `ListaZap`). Passar `?categoria=`/`?q=` para o SQL exigiria ler
  // `searchParams` aqui, e é exatamente isso que `output: 'export'` proíbe.
  // Trazer tudo é barato nesta tabela: ela é cadastro moderado, um por
  // negócio da cidade — nada de ETL despejando milhares de linhas.
  const { rows, configured } = await fetchZapEstabelecimentos(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Zap {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Lista gratuita de negócios locais — clique e fale direto no
        WhatsApp. Cadastro aberto, revisado antes de entrar no ar.
      </p>

      {/* O fallback é a lista COMPLETA, não um esqueleto: é o que o servidor
          tem para mostrar antes de o navegador ler a query, e é também
          exatamente o conteúdo certo para quem chega sem filtro. */}
      <Suspense fallback={<ListaZapCompleta estabelecimentos={rows} configured={configured} />}>
        <ListaZap estabelecimentos={rows} configured={configured} />
      </Suspense>

      <div className="mt-14">
        <ZapForm />
      </div>
    </main>
  );
}
