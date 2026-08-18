import { paramsDasCidades } from "@/lib/betim/staticParams";
import { ANUNCIO_PRECOS } from "@/lib/betim/anuncios";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Anuncie — ${nomePortal(c)}`,
  (c) => `Anuncie seu negócio local no ${nomePortal(c)} — divulgação única a partir de R$ 200, sem mensalidade.`
);

// Número comercial confirmado pelo dono em 2026-08-17.
const WHATSAPP_COMERCIAL = "5531975709609";

export default async function AnunciePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const waUrl = `https://wa.me/${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(
    `Olá! Quero anunciar meu negócio no ${nomePortal(cidade)}.`
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Anuncie no {nomePortal(cidade)}
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Seu negócio local visto por quem mais se importa com {cidade.nome} — leitores
        engajados com a cidade, todos os dias.
      </p>
      <p className="mt-2 max-w-[60ch] text-sm font-medium text-primary">
        Pagamento único — sem mensalidade. Seu anúncio fica no ar enquanto
        o site existir.
      </p>

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-text">Básico</h2>
          <p className="mt-2 font-tabular text-3xl font-bold text-primary">
            R$ {ANUNCIO_PRECOS.basico}
          </p>
          <p className="text-xs text-text-soft">pagamento único</p>
          <ul className="mt-4 flex flex-col gap-1.5 text-sm text-text-soft">
            <li>Banner rotativo na lateral</li>
            <li>Aparece em várias páginas do portal</li>
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-primary bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-text">Premium</h2>
          <p className="mt-2 font-tabular text-3xl font-bold text-primary">
            R$ {ANUNCIO_PRECOS.premium}
          </p>
          <p className="text-xs text-text-soft">pagamento único</p>
          <ul className="mt-4 flex flex-col gap-1.5 text-sm text-text-soft">
            <li>Slot fixo no topo da Home</li>
            <li>Prioridade sobre anúncios básicos</li>
          </ul>
        </div>
      </section>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex cursor-pointer rounded-xl border border-primary bg-primary px-6 py-3.5 font-semibold text-primary-ink"
      >
        Falar no WhatsApp
      </a>
    </main>
  );
}
