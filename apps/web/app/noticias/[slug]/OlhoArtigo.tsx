/**
 * @file Olho do artigo — o destaque que quebra o texto.
 *
 * POR QUE EXISTE: texto longo de serviço perde o leitor no meio. O olho
 * repete a frase que importa, em fonte de display e com a barra lateral do
 * padrão de /jurisprudencia.
 *
 * DUAS FORMAS:
 * - citação (`citacao` diferente de false): aspas, fonte colada — o padrão
 *   para trecho de decisão ou de edital;
 * - frase de efeito (`citacao: false`): sem aspas, corpo maior e cor
 *   primária, para o número que o leitor precisa levar embora.
 *
 * A fonte fica sempre colada: destaque sem origem é o defeito que a regra
 * editorial mais teme.
 */
export default function OlhoArtigo({
  olho,
}: {
  olho?: { texto: string; fonte?: string; citacao?: boolean };
}) {
  if (!olho?.texto) return null;
  const ehCitacao = olho.citacao !== false;

  return (
    <figure className="my-10 border-l-4 border-primary pl-4 sm:pl-6">
      <blockquote
        className={
          ehCitacao
            ? "font-display text-xl sm:text-2xl font-medium leading-snug text-foreground"
            : "font-display text-3xl sm:text-4xl font-bold leading-[1.1] tracking-tight text-primary"
        }
      >
        {ehCitacao ? `“${olho.texto}”` : olho.texto}
      </blockquote>
      {olho.fonte && (
        <figcaption className="mt-2 text-xs text-muted">— {olho.fonte}</figcaption>
      )}
    </figure>
  );
}
