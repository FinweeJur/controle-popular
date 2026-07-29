import AssistenteChat from "@/app/[municipio]/assistente/AssistenteChat";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

export const generateMetadata = metadataDaCidade(
  (c) => `Pergunte ao portal — ${nomePortal(c)}`,
  (c) => `Assistente do ${nomePortal(c)}: pergunte em linguagem natural sobre contratos, gastos, vereadores e dados de ${c.nome}.`
);

export default async function AssistentePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Pergunte ao portal
      </h1>
      <p className="mt-2 mb-6 max-w-2xl text-[1.02em] text-text-soft">
        Escreva uma pergunta sobre {cidade.nome} — contratos, gastos, atuação da
        Câmara — e o assistente responde com base nos dados oficiais já
        reunidos aqui.
      </p>
      <AssistenteChat />
    </div>
  );
}
