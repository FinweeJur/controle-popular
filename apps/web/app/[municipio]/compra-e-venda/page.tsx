import { Suspense } from "react";
import { fetchClassificados } from "@/lib/betim/classificados";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ClassificadoForm from "./ClassificadoForm";
import ListaClassificados, { ListaClassificadosCompleta } from "./ListaClassificados";

export const generateMetadata = metadataDaCidade(
  (c) => `Compra e Venda — Classificados de ${c.nome} | ${nomePortal(c)}`,
  (c) => `Classificados gratuitos de ${c.nome}-${c.uf}: imóveis, veículos, eletrônicos, agro e serviços — contato direto por WhatsApp.`
);

export default async function CompraEVendaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // SEM os filtros de categoria e busca: eles agora são do cliente (ver
  // `ListaClassificados`). Passar `?categoria=`/`?q=` para o SQL exigiria ler
  // `searchParams` aqui, e é exatamente isso que `output: 'export'` proíbe.
  const { rows, configured } = await fetchClassificados(cidade.id_municipio);

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Compra e Venda
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Classificados gratuitos entre moradores de {cidade.nome}. Anúncios ficam no
        ar por 60 dias após aprovação da moderação.
      </p>

      {/* O fallback é a lista COMPLETA, não um esqueleto: é o que o servidor
          tem para mostrar antes de o navegador ler a query, e é também
          exatamente o conteúdo certo para quem chega sem filtro. */}
      <Suspense
        fallback={
          <ListaClassificadosCompleta
            anuncios={rows}
            configured={configured}
            dominio={cidade.dominio}
          />
        }
      >
        <ListaClassificados anuncios={rows} configured={configured} dominio={cidade.dominio} />
      </Suspense>

      <div className="mt-14">
        <ClassificadoForm />
      </div>
    </main>
  );
}
