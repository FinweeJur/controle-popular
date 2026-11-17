/**
 * @file Olho do artigo (pull quote) — o destaque que quebra o texto.
 *
 * POR QUE EXISTE: texto longo de serviço perde o leitor no meio. O olho
 * repete a frase que explica o porquê da vaga, em fonte de display e com a
 * barra lateral do padrão de /jurisprudencia. A fonte fica colada, porque
 * citação sem origem é o defeito que a regra editorial mais teme.
 */
export default function OlhoArtigo({
  olho,
}: {
  olho?: { texto: string; fonte?: string };
}) {
  if (!olho?.texto) return null;

  return (
    <figure className="my-10 border-l-4 border-primary pl-4 sm:pl-6">
      <blockquote className="font-display text-xl sm:text-2xl font-medium leading-snug text-foreground">
        “{olho.texto}”
      </blockquote>
      {olho.fonte && (
        <figcaption className="mt-2 text-xs text-muted">— {olho.fonte}</figcaption>
      )}
    </figure>
  );
}
