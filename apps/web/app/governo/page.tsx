import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { listarMandatos, calcularResumoGestao } from "@/lib/gestao/dados";

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

        {/* ═══ CARTÕES DE GOVERNOS MONITORADOS ═══ */}
        <section aria-labelledby="governos-monitorados" className="space-y-4">
          <h2 id="governos-monitorados" className="text-lg font-bold text-text">
            Executivos Monitorados
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mandatos.map((m) => {
              const resumo = calcularResumoGestao(m);
              const linkGoverno =
                m.esfera === "municipal"
                  ? `/${m.slug}/gestao`
                  : `/governo/${m.slug}`;

              return (
                <Link
                  key={m.ente}
                  href={linkGoverno}
                  className="group block rounded-2xl border border-border bg-surface-1 p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-text-soft">
                      {m.esfera === "federal" ? "Federal" : m.esfera === "estadual" ? "Estadual" : "Municipal"}
                    </span>
                    <span className="text-xs text-text-soft">
                      {m.periodo.inicio}–{m.periodo.fim}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-text group-hover:text-primary transition-colors">
                    {m.nome_ente}
                  </h3>
                  <p className="text-xs text-text-soft">
                    {m.cargo}: <strong>{m.gestor}</strong> {m.partido ? `(${m.partido})` : ""}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-text">{resumo.totalPropostas}</div>
                      <div className="text-[11px] text-text-soft">Propostas</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {resumo.porStatus.concluida}
                      </div>
                      <div className="text-[11px] text-text-soft">Entregues</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {resumo.porStatus.em_andamento + resumo.porStatus.anunciada}
                      </div>
                      <div className="text-[11px] text-text-soft">Em execução</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Ver prestação de contas completa</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

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
