import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { listarMandatos } from "@/lib/gestao/dados";
import PainelGovernoHubClient from "./PainelGovernoHubClient";

export const metadata: Metadata = {
  title: "Governos e Planos de Campanha — Prometeu? Cumpriu? | Controle Popular",
  description:
    "Cruzamento transparente entre planos de governo registrados no TSE e a execução real por secretarias estaduais e ministérios federais.",
};

export default function HubGovernoPage() {
  const mandatos = listarMandatos();

  return (
    <div className="min-h-screen bg-surface-0">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>⚖️</span> Prometeu? Cumpriu? — Plano v8
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Acompanhamento de Governos e Promessas
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
            O plano de governo registrado no TSE é o contrato formal do candidato com o eleitor.
            Nós cruzamos cada proposta literal com o que as Secretarias de Estado e Ministérios
            realmente empenharam, contrataram ou entregaram em dados abertos públicos.
          </p>
        </div>

        {/* ═══ PAINEL INTERATIVO COM GRÁFICOS, FILTROS, ORDENAÇÃO E CSV ═══ */}
        <PainelGovernoHubClient mandatos={mandatos} />

        {/* ═══ TRANSPARÊNCIA METODOLÓGICA ═══ */}
        <section className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft">
          <h3 className="text-sm font-bold text-text">Como funciona a metodologia?</h3>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Captura oficial:</strong> O texto de cada proposta é extraído literalmente do PDF depositado no DivulgaCandContas do Tribunal Superior Eleitoral.
            </li>
            <li>
              <strong>Cruzamento por secretaria:</strong> Cada meta é associada ao órgão responsável e monitorada via diários oficiais (DIO-MG, Querido Diário), contratos (PNCP) e convênios (TransfereGov).
            </li>
            <li>
              <strong>Sem sinal público:</strong> Propostas sem ato localizado não são adjetivadas como &quot;promessa quebrada&quot;; registramos a ausência de publicação oficial até a data da conferência.
            </li>
          </ul>
        </section>
      </main>

      <FooterGlobal />
    </div>
  );
}
