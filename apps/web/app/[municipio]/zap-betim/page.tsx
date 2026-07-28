import Link from "@/lib/betim/link";
import { fetchZapEstabelecimentos, ZAP_CATEGORIAS, ZAP_CATEGORIA_LABELS } from "@/lib/betim/zap";
import ZapCard from "./ZapCard";
import ZapForm from "./ZapForm";

export const metadata = {
  title: "Zap Betim — Cadastro de negócios no WhatsApp | Controle Popular Betim",
  description:
    "Encontre e divulgue negócios locais de Betim-MG direto pelo WhatsApp — cadastro gratuito e independente.",
};

export default async function ZapBetimPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria, q } = await searchParams;
  const { rows, configured } = await fetchZapEstabelecimentos({ categoria, q });

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Zap Betim
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Lista gratuita de negócios locais — clique e fale direto no
        WhatsApp. Cadastro aberto, revisado antes de entrar no ar.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/zap-betim"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
            !categoria ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
          }`}
        >
          Todos
        </Link>
        {ZAP_CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={`/zap-betim?categoria=${c}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              categoria === c ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
            }`}
          >
            {ZAP_CATEGORIA_LABELS[c]}
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length > 0 ? (
          rows.map((item) => <ZapCard key={item.id} item={item} />)
        ) : (
          <p className="col-span-full text-sm text-text-soft">
            {configured
              ? "Nenhum negócio aprovado ainda nesta categoria."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>

      <div className="mt-14">
        <ZapForm />
      </div>
    </main>
  );
}
