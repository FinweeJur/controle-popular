import FotoBrasilComS from "@/app/components/FotoBrasilComS";

/**
 * Foto de abertura do acervo Brasil com S, decorativa, com crédito.
 *
 * Layout pedido pelo dono (03/09): UMA foto por página, flutuando à
 * direita, com o texto ao lado esquerdo — não mais a faixa de 4-5 fotos
 * no fim de cada página (saía descontextualizada).
 *
 * As fotos NÃO carregam dado nenhum da página — o texto de apresentação
 * diz isso em voz alta para ninguém ler a foto como retrato da seção.
 * A legenda curta ("Créditos: Brasil com S") é obrigatória pelos termos
 * do acervo (ver `FotoBrasilComS.tsx`).
 *
 * `fotos` aceita a lista antiga por compatibilidade; só a primeira entra.
 */
export default function CenasDoBrasil({
  fotos,
  titulo = "Também acontece por aqui",
  className = "mt-12",
}: {
  fotos: string[];
  titulo?: string;
  className?: string;
}) {
  if (fotos.length === 0) return null;
  return (
    <section
      className={`${className} border-t border-border pt-8`}
      aria-label="Fotografia do acervo Brasil com S"
    >
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">{titulo}</h2>
          <p className="mt-1 max-w-2xl text-[.9em] text-text-soft">
            Fotografia do acervo{" "}
            <a
              href="https://www.brasilcoms.com.br/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent hover:underline"
            >
              Brasil com S ↗
            </a>{" "}
            (Lab 678), ilustração sem corte e com crédito — nenhum número
            desta página depende dela.
          </p>
        </div>
        <div className="w-full max-w-[280px] shrink-0 sm:ml-auto">
          <FotoBrasilComS
            id={fotos[0]}
            className="overflow-hidden rounded-lg border border-border bg-surface"
          />
        </div>
      </div>
    </section>
  );
}
