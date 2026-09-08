import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { carregarRadarParaopeba } from "@/lib/paraopeba/radar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/paraopeba/noticias", {
  title: "Radar de Notícias — Paraopeba | Controle Popular",
  description:
    "Varredura automática e diária de notícias e atos de autoridade sobre a bacia do Paraopeba e a reparação do rompimento da barragem em Brumadinho.",
});

export default function NoticiasParaopebaPage() {
  const radar = carregarRadarParaopeba();
  const total = radar.itens.length;
  const atos = radar.itens.filter((i) => i.ato_de_autoridade).length;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Notícias recentes</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Radar de Notícias Recentes
      </h1>

      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Acompanhamento contínuo de matérias, decisões judiciais e comunicações públicas sobre a bacia
        do Rio Paraopeba. Varredura automática sem curadoria ou resumo por modelo.
      </p>

      {total === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <p className="text-[.95em] text-text-soft">
            A varredura automática ainda não rodou nesta instalação — o que não diz nada sobre o caso,
            apenas sobre esta cópia do portal.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <span className="block text-xs text-text-soft">Total Coletado</span>
              <span className="mt-1 block font-tabular text-xl font-bold text-text">
                {formatNumberBR(total)} notícias
              </span>
              <span className="mt-1 block text-xs text-text-soft">
                {radar.janela_dias ? `últimos ${radar.janela_dias} dias` : "coleta recente"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <span className="block text-xs text-text-soft">Atos de Autoridade</span>
              <span className="mt-1 block font-tabular text-xl font-bold text-accent">
                {formatNumberBR(atos)} identificados
              </span>
              <span className="mt-1 block text-xs text-text-soft">decisões, sentenças ou acordos</span>
            </div>
          </div>

          <div className="space-y-3">
            {radar.itens.map((item, idx) => (
              <article
                key={`item-${idx}`}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-text-soft">{item.veiculo}</span>
                  {item.data && (
                    <time className="text-xs text-text-soft">{formatDateBR(item.data)}</time>
                  )}
                </div>

                <h2 className="mt-1.5 font-display text-base font-semibold text-text">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {item.titulo} ↗
                  </a>
                </h2>

                {item.ato_de_autoridade && (
                  <span className="mt-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    Ato de autoridade
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
