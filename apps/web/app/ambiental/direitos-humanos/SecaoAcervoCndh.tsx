import AcervoCndh from "./AcervoCndh";

/**
 * Seção "Acervo do CNDH" da página de direitos humanos.
 *
 * Fica em componente próprio para a página (que já é grande) crescer só uma
 * linha, e para o mesmo bloco poder ser reusado em outra subfrente.
 */
export default function SecaoAcervoCndh() {
  return (
    <section aria-labelledby="acervo-cndh" className="mt-12">
      <h2 id="acervo-cndh" className="font-display text-xl font-bold text-foreground">
        Acervo do CNDH no Brasil Participativo
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
        Recomendações, notas públicas, resoluções, relatórios e editais do
        Conselho Nacional dos Direitos Humanos, com link direto ao arquivo
        oficial. A coleta lê a página pública uma vez e não baixa documentos.
      </p>
      <div className="mt-4">
        <AcervoCndh />
      </div>
    </section>
  );
}
