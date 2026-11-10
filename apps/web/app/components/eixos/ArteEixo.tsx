import { arteDoEixo } from "@/lib/navegacao/arte-eixos";

/**
 * @file ArteEixo.tsx
 * @description Faixa de aquarela do eixo, para páginas e subfrentes.
 *
 * Uso: `<ArteEixo slug="direitos" className="mt-6 aspect-[21/8]" />`.
 * A arte vem da fonte única (`lib/navegacao/arte-eixos.ts`); eixo sem arte
 * própria herda a cachoeira do Cerrado, nunca fica em branco.
 *
 * É decoração: o `alt` descreve a cena, o texto da página carrega a
 * informação. `prioridade` só nas primeiras dobras (o resto é `lazy`).
 */
export default function ArteEixo({
  slug,
  className = "",
  prioridade = false,
}: {
  slug: string;
  className?: string;
  prioridade?: boolean;
}) {
  const arte = arteDoEixo(slug);
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border shadow-xs ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={arte.src}
        alt={arte.alt}
        width={1024}
        height={600}
        loading={prioridade ? "eager" : "lazy"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
