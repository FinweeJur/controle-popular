import AssistenteChat from "@/app/[municipio]/assistente/AssistenteChat";

export const metadata = {
  title: "Pergunte ao portal — Controle Popular Betim",
  description:
    "Assistente do Controle Popular Betim: pergunte em linguagem natural sobre contratos, gastos, vereadores e dados de Betim.",
};

export default function AssistentePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Pergunte ao portal
      </h1>
      <p className="mt-2 mb-6 max-w-2xl text-[1.02em] text-text-soft">
        Escreva uma pergunta sobre Betim — contratos, gastos, atuação da
        Câmara — e o assistente responde com base nos dados oficiais já
        reunidos aqui.
      </p>
      <AssistenteChat />
    </div>
  );
}
