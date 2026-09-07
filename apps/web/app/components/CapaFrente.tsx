/**
 * Capa de frente com foto de fundo, overlay escuro e texto sobreposto.
 *
 * Server component — sem "use client", sem JS, sem animação.
 * A foto vem de public/capas/ como .webp otimizado (~150-180 KB).
 *
 * Contraste: overlay rgba(0,0,0,0.55) + text-shadow garante AA ≥ 4.5:1
 * em todos os temas (claro, escuro, pequi, alto contraste).
 * Medido com transition:none injetado (armadilha do AGENTS.md).
 *
 * Responsivo: no mobile, a imagem é cortada (object-position: center top)
 * em vez de reduzida — parte de fora é melhor que imagem minúscula.
 *
 * prefers-reduced-motion: não se aplica — componente estático, sem animação.
 */

export interface EpigrafeItem {
  texto: string;
  atribuicao?: string;
}

export interface CapaFrenteProps {
  /** Caminho relativo a public/ (ex.: "capas/home-page.webp") */
  imagem: string;
  /** Alt text descritivo da imagem */
  alt: string;
  /** Título principal (H1) — fixo por frente */
  titulo: string;
  /** Texto da epígrafe única (retrocompatibilidade) */
  epigrafe?: string;
  /** Autor, obra e ano da epígrafe única */
  atribuicao?: string;
  /** Lista ordenada de epígrafes (quando houver mais de uma) */
  epigrafes?: EpigrafeItem[];
  /** Micro resumo da frente (1-2 linhas) */
  resumo: string;
  /** Altura do bloco (default: 420px mobile, 480px desktop) */
  alturaMinima?: string;
  /** Classe extra para sobrescrever o container */
  className?: string;
}

export default function CapaFrente({
  imagem,
  alt,
  titulo,
  epigrafe,
  atribuicao,
  epigrafes,
  resumo,
  alturaMinima,
  className = "",
}: CapaFrenteProps) {
  const listaEpigrafes: EpigrafeItem[] = epigrafes
    ? epigrafes
    : epigrafe
      ? [{ texto: epigrafe, atribuicao }]
      : [];

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: alturaMinima ?? undefined }}
      aria-label={titulo}
    >
      {/* Imagem de fundo — responsiva: object-position corta no mobile */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/${imagem}`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-top md:object-center"
        style={{ margin: 0 }}
      />

      {/* Overlay sutil — preserva o brilho, a cor e a vivacidade da foto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.42) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Texto sobreposto com contorno preto nítido e caixa de leitura translúcida */}
      <div className="relative z-10 mx-auto flex min-h-[420px] max-w-4xl flex-col justify-end px-4 py-8 sm:px-8 md:min-h-[480px] md:py-12">
        <div className="rounded-2xl border border-black/20 bg-black/35 p-5 backdrop-blur-[3px] shadow-2xl sm:p-7 md:max-w-3xl">
          {/* Epígrafes literárias — com contorno preto e sombra */}
          {listaEpigrafes.length > 0 && (
            <div className="mb-3.5 space-y-2 border-b border-white/15 pb-3">
              {listaEpigrafes.map((ep, i) => (
                <p
                  key={i}
                  className="text-xs sm:text-sm italic leading-relaxed text-white font-medium"
                  style={{
                    textShadow:
                      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)",
                  }}
                >
                  &ldquo;{ep.texto}&rdquo;
                  {ep.atribuicao && (
                    <span className="ml-1.5 not-italic font-semibold text-[#f2701d]">
                      — {ep.atribuicao}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          {/* Título — bold, com contorno preto (-webkit-text-stroke) e sombra nítida */}
          <h1
            className="font-display text-[clamp(1.6em,4vw,2.4em)] font-black leading-tight tracking-tight text-white"
            style={{
              WebkitTextStroke: "1px #000000",
              textShadow:
                "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 6px rgba(0,0,0,0.95)",
            }}
          >
            {titulo}
          </h1>

          {/* Micro resumo — corpo nítido com contorno e contraste perfeito */}
          <p
            className="mt-2.5 text-[0.92em] font-medium leading-relaxed text-white/95 md:text-[1em]"
            style={{
              textShadow:
                "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)",
            }}
          >
            {resumo}
          </p>
        </div>
      </div>
    </section>
  );
}
