import { getComerciosEssenciais } from "@/lib/betim/comercios";

export const metadata = {
  title: "Supermercados e Farmácias — Betim | Controle Popular Betim",
  description:
    "Supermercados e farmácias de Betim-MG, com Centro e Citrolândia em destaque — dado público (OpenStreetMap), publicidade gratuita.",
};

const TIPO_LABEL: Record<string, string> = {
  supermercado: "Supermercado",
  farmacia: "Farmácia",
};

export default async function SupermercadosFarmaciasPage() {
  const { configured, ok, rows } = await getComerciosEssenciais();
  const temDados = configured && ok && rows.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Supermercados e Farmácias
      </h1>
      <p className="mt-2 max-w-[65ch] text-text-soft">
        Informação pública, sem custo pra nenhum estabelecimento aparecer
        aqui — dado do OpenStreetMap (mapa colaborativo aberto), ordenado
        pra mostrar primeiro o que é mais perto do Centro e da Regional
        Citrolândia.
      </p>

      {!temDados ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured
            ? "Nenhum estabelecimento cadastrado ainda."
            : "Nenhum dado disponível no momento."}
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
            <p>
              <strong className="font-semibold text-text">
                É dono de um supermercado ou farmácia e não está na lista?
              </strong>{" "}
              O OpenStreetMap é um mapa colaborativo — qualquer pessoa pode
              adicionar ou corrigir um estabelecimento em{" "}
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                openstreetmap.org ↗
              </a>{" "}
              — a mudança aparece aqui na próxima sincronização, de graça,
              sem precisar cadastrar nada neste site.
            </p>
          </section>

          <ul className="mt-6 flex flex-col gap-3">
            {rows.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <div>
                  <span className="text-[.85em] font-semibold tracking-wide text-accent uppercase">
                    {TIPO_LABEL[c.tipo] ?? c.tipo}
                  </span>
                  <p className="font-display font-semibold text-text">{c.nome}</p>
                  <p className="mt-1 text-sm text-text-soft">
                    {c.endereco ?? "Endereço não informado"}
                    {c.bairro ? ` — ${c.bairro}` : ""}
                  </p>
                  {c.telefone && (
                    <p className="font-tabular mt-1 text-sm text-text-soft">{c.telefone}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs text-text-soft">
            {rows.length} estabelecimentos encontrados. Cobertura depende do
            que já foi mapeado no OpenStreetMap — pode não incluir todo
            supermercado/farmácia real de Betim ainda.
          </p>
        </>
      )}
    </main>
  );
}
