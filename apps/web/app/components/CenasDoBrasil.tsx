import FotoBrasilComS from "@/app/components/FotoBrasilComS";

/**
 * Faixa de fotos do acervo Brasil com S, decorativa, com crédito.
 *
 * As fotos NÃO carregam dado nenhum da página — o texto de apresentação
 * diz isso em voz alta para ninguém ler a faixa como retrato da seção.
 * Cada foto sai com a legenda de crédito do `FotoBrasilComS`.
 */
export default function CenasDoBrasil({
  fotos,
  className = "mt-12",
}: {
  fotos: string[];
  className?: string;
}) {
  if (fotos.length === 0) return null;
  return (
    <section className={`${className} border-t border-border pt-8`} aria-label="Fotografias do acervo Brasil com S">
      <h2 className="font-display text-lg font-semibold">Cenas do Brasil com S</h2>
      <p className="mt-1 max-w-2xl text-[.9em] text-text-soft">
        Fotografias do acervo{" "}
        <a
          href="https://www.brasilcoms.com.br/"
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-accent hover:underline"
        >
          Brasil com S ↗
        </a>{" "}
        (Lab 678), reproduzidas como ilustração, sem corte e com crédito — nenhum número
        desta página depende delas.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fotos.map((id) => (
          <FotoBrasilComS key={id} id={id} className="overflow-hidden rounded-lg border border-border bg-surface" />
        ))}
      </div>
    </section>
  );
}