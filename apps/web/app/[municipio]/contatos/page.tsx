import { fetchContatosUteis, CONTATO_CATEGORIA_LABELS } from "@/lib/betim/servicos";

export const metadata = {
  title: "Contatos Úteis — Betim | Controle Popular Betim",
  description: "Telefones úteis de Betim-MG: emergência, Prefeitura, Câmara Municipal e serviços.",
};

export default async function ContatosPage() {
  const { rows, configured } = await fetchContatosUteis();

  const grupos = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.categoria ?? "outros";
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(row);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Contatos Úteis
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Telefones de emergência e órgãos públicos de Betim-MG.
      </p>

      <section className="mt-8 flex flex-col gap-8">
        {grupos.size > 0 ? (
          [...grupos.entries()].map(([categoria, items]) => (
            <div key={categoria}>
              <h2 className="mb-3 font-display text-lg font-semibold text-text">
                {CONTATO_CATEGORIA_LABELS[categoria] ?? categoria}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((c) => (
                  <div
                    key={c.nome}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 shadow-sm"
                  >
                    <span className="text-sm font-medium text-text">{c.nome}</span>
                    {c.telefone ? (
                      <a
                        href={`tel:${c.telefone.replace(/\D/g, "")}`}
                        className="font-tabular text-sm font-semibold text-primary"
                      >
                        {c.telefone}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-soft">
            {configured
              ? "Nenhum contato cadastrado ainda."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </main>
  );
}
