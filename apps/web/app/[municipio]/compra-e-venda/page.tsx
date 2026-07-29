import Link from "@/lib/betim/link";
import {
  CLASSIFICADO_CATEGORIAS,
  CLASSIFICADO_CATEGORIA_LABELS,
  fetchClassificados,
} from "@/lib/betim/classificados";
import { formatCurrencyBRL } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ClassificadoForm from "./ClassificadoForm";

export const generateMetadata = metadataDaCidade(
  (c) => `Compra e Venda — Classificados de ${c.nome} | ${nomePortal(c)}`,
  (c) => `Classificados gratuitos de ${c.nome}-${c.uf}: imóveis, veículos, eletrônicos, agro e serviços — contato direto por WhatsApp.`
);

export default async function CompraEVendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { categoria, q } = await searchParams;
  const { rows, configured } = await fetchClassificados(cidade.id_municipio, {
    categoria,
    q,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Compra e Venda
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Classificados gratuitos entre moradores de Betim. Anúncios ficam no
        ar por 60 dias após aprovação da moderação.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/compra-e-venda"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
            !categoria ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
          }`}
        >
          Todos
        </Link>
        {CLASSIFICADO_CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={`/compra-e-venda?categoria=${c}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              categoria === c ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
            }`}
          >
            {CLASSIFICADO_CATEGORIA_LABELS[c]}
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length > 0 ? (
          rows.map((item) => {
            const waUrl = `https://wa.me/${item.contato_whatsapp}?text=${encodeURIComponent(
              `Olá! Vi seu anúncio "${item.titulo}" no Compra e Venda (controlepopular.br/betim).`
            )}`;
            return (
              <a
                key={item.id}
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
              >
                <span className="font-display text-base font-semibold text-text">
                  {item.titulo}
                </span>
                {item.preco !== null ? (
                  <span className="font-tabular text-lg font-semibold text-primary">
                    {formatCurrencyBRL(item.preco)}
                  </span>
                ) : null}
                {item.descricao ? (
                  <span className="line-clamp-3 text-sm text-text-soft">{item.descricao}</span>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Falar no WhatsApp →
                </span>
              </a>
            );
          })
        ) : (
          <p className="col-span-full text-sm text-text-soft">
            {configured
              ? "Nenhum anúncio aprovado ainda nesta categoria."
              : "Nenhum anúncio disponível no momento."}
          </p>
        )}
      </section>

      <div className="mt-14">
        <ClassificadoForm />
      </div>
    </main>
  );
}
