import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { temFonte } from "@/lib/db/queries/municipios";

export const generateMetadata = metadataDaCidade(
  (c) => `Defesa Civil de ${c.nome} — Alertas | ${nomePortal(c)}`,
  (c) => `Como receber alertas da Defesa Civil de ${c.nome}-${c.uf}: aplicativo oficial, canal de WhatsApp e telefone de emergência.`
);

// Nenhuma dessas fontes tem API pública — confirmado em pesquisa 2026-07-21
// (o app é uma PWA da plataforma Fábrica de Aplicativos, sem endpoint
// aberto). Por isso esta página só organiza os canais oficiais, sem tentar
// reproduzir os alertas aqui dentro.
//
// ESPECÍFICO DE BETIM — corrigido em 2026-08-09: até aqui esta lista
// aparecia em TODA cidade (BH, SP, Araçuaí, Itinga, Diamantina incluídas)
// linkando pro app e pro WhatsApp da Defesa Civil de Betim, mesmo quando o
// título da página dizia "Defesa Civil de Belo Horizonte". Gate por
// `temFonte(cidade, "defesa_civil")` até existir canal pesquisado por
// cidade.
const CANAIS_BETIM = [
  {
    nome: "Aplicativo oficial (PWA)",
    desc: "Alertas, áreas de risco no mapa, previsão do tempo e como ser voluntário.",
    href: "https://pwa.app.vc/defesa_civil_betim",
    cta: "Abrir aplicativo",
  },
  {
    nome: "Canal no WhatsApp",
    desc: "Avisos de chuva forte, risco de deslizamento e outras emergências direto no seu WhatsApp.",
    href: "https://www.betim.mg.gov.br/portal/noticias/0/3/14683/betim-lanca-canal-oficial-da-defesa-civil-no-whatsapp-para-ampliar-o-alcance-de-alertas-e-orientacoes-a-populacao/",
    cta: "Como entrar no canal",
  },
  {
    nome: "Como acionar a Defesa Civil",
    desc: "Página oficial da Prefeitura com telefones e orientações em caso de emergência.",
    href: "https://www.betim.mg.gov.br/portal/secretarias-paginas/154/como-acionar-a-defesa-civil/",
    cta: "Ver telefones",
  },
];

export default async function DefesaCivilPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const temCanais = temFonte(cidade, "defesa_civil");
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Defesa Civil de {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Em emergência, ligue <strong className="font-tabular text-text">199</strong> ou{" "}
        <strong className="font-tabular text-text">153</strong> (Guarda Municipal).
        {temCanais
          ? " Abaixo, os canais oficiais pra receber avisos antes que a emergência aconteça."
          : ` Ainda não temos os canais oficiais de ${cidade.nome} mapeados nesta tela.`}
      </p>

      {!temCanais && (
        <p className="mt-8 rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Pesquisa de canal oficial de Defesa Civil (aplicativo, WhatsApp, telefone) ainda não
          feita para {cidade.nome}. Assim que confirmada, entra aqui.
        </p>
      )}

      <section className="mt-8 flex flex-col gap-3">
        {temCanais && CANAIS_BETIM.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cp-card-hover flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
          >
            <div>
              <p className="font-display font-semibold text-text">{c.nome}</p>
              <p className="mt-1 text-sm text-text-soft">{c.desc}</p>
            </div>
            <span className="whitespace-nowrap rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
              {c.cta}
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
