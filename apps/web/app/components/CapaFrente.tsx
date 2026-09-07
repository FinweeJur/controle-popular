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
  /** Layout visual: padrão (alinhado na base) ou home (poemas no topo esquerdo, texto no canto inferior direito) */
  layout?: "padrao" | "home";
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
  layout = "padrao",
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

      {/* Texto sobreposto com contorno preto direto sobre a fotografia — sem sobreposição nem vidro fosco */}
      {layout === "home" ? (
        <div className="relative z-10 mx-auto flex min-h-[460px] max-w-4xl flex-col justify-between px-4 py-6 sm:px-8 md:min-h-[520px] md:py-8">
          {/* TOPO: Epígrafes literárias focadas no canto superior esquerdo */}
          {listaEpigrafes.length > 0 && (
            <div className="max-w-sm sm:max-w-md text-left space-y-2">
              {listaEpigrafes.map((ep, i) => (
                <p
                  key={i}
                  className="text-xs sm:text-[13px] italic leading-relaxed text-white font-medium"
                  style={{
                    textShadow:
                      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.95)",
                  }}
                >
                  &ldquo;{ep.texto}&rdquo;
                  {ep.atribuicao && (
                    <span className="block mt-0.5 not-italic text-white/95 text-[11px] sm:text-xs">
                      — {ep.atribuicao}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          {/* BASE: Título e resumo focados no canto inferior direito para liberar a imagem (lobo-guará e ipê) */}
          <div className="mt-auto flex flex-col items-start sm:items-end text-left sm:text-right ml-auto max-w-md sm:max-w-lg">
            <h1
              className="font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-md"
              style={{
                WebkitTextStroke: "1px #000",
                textShadow:
                  "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)",
              }}
            >
              {titulo}
            </h1>

            <p
              className="mt-2 text-xs sm:text-sm leading-relaxed text-white font-medium"
              style={{
                textShadow:
                  "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.95)",
              }}
            >
              {resumo}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-4xl flex-col justify-end px-4 py-8 sm:px-8 md:min-h-[480px] md:py-12">
          <div className="p-2 sm:p-4 md:max-w-3xl">
            {/* Epígrafes literárias — com contorno preto e sombra nítida */}
            {listaEpigrafes.length > 0 && (
              <div className="mb-3 space-y-1.5">
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
                      <span className="ml-1.5 not-italic text-white/90 text-[11px] sm:text-xs">
                        — {ep.atribuicao}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}

            {/* H1 Principal com contorno preto nítido */}
            <h1
              className="font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-md"
              style={{
                WebkitTextStroke: "1px #000",
                textShadow:
                  "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.95)",
              }}
            >
              {titulo}
            </h1>

            {/* Micro resumo da frente */}
            <p
              className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-white font-medium"
              style={{
                textShadow:
                  "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)",
              }}
            >
              {resumo}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
