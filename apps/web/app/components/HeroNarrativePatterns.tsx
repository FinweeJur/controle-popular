/**
 * SVGs decorativos do hero narrativo — Fase 1 do plano de identidade
 * visual (`docs/planos/PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md`).
 *
 * Tudo é SVG inline (nada de bitmap na primeira dobra — decisão de LCP
 * do plano) e toda cor vem de `currentColor` ou dos tokens do design
 * system (`--cp-primary`, `--cp-accent`, `--cp-tertiary`), para que os
 * três temas herdem a correção de contraste sem código novo por tema.
 *
 * Os três são decorativos por padrão (`aria-hidden="true"`); se um
 * dia algum virar conteúdo ilustrativo, basta passar `tituloAria`.
 */

interface PadraoHeroProps {
  className?: string;
  /** Se informado, o SVG vira `role="img"` com este rótulo em vez de decorativo. */
  tituloAria?: string;
}

function atributosAria(tituloAria?: string) {
  return tituloAria
    ? { role: "img" as const, "aria-label": tituloAria }
    : ({ "aria-hidden": true, focusable: "false" } as const);
}

/** Círculo fragmentado estilo azulejo de Athos Bulcão. */
export function BulcaoCircle({ className, tituloAria }: PadraoHeroProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...atributosAria(tituloAria)}
    >
      {/* Círculo base — azulejaria */}
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" />
      {/* Setores fragmentados */}
      <path
        d="M50 50 L85 50 A40 40 0 0 1 50 85 Z"
        fill="var(--cp-primary)"
        opacity="0.8"
      />
      <path
        d="M50 50 L50 15 A40 40 0 0 0 85 50 Z"
        fill="var(--cp-accent)"
        opacity="0.7"
      />
      <path
        d="M50 50 L15 50 A40 40 0 0 1 50 15 Z"
        fill="var(--cp-tertiary)"
        opacity="0.6"
      />
      {/* Ponto central — cor da superfície do tema */}
      <circle cx="50" cy="50" r="12" fill="var(--cp-surface)" />
    </svg>
  );
}

/** Onda em serra — relevo de rio/serra, desenhada com curvas Q. */
export function OndaSerra({ className, tituloAria }: PadraoHeroProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 80"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      {...atributosAria(tituloAria)}
    >
      <path
        d="M0 40 Q50 60 100 30 Q150 10 200 40 Q250 70 300 35 Q350 0 400 40"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.6"
      />
      <path
        d="M0 60 Q60 80 120 50 Q180 30 240 60 Q300 90 360 55"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
      />
    </svg>
  );
}

/** Tamanduá-bandeira em silhueta geométrica (fauna do cerrado). */
export function TamanduaGeometrico({ className, tituloAria }: PadraoHeroProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...atributosAria(tituloAria)}
    >
      {/* Corpo */}
      <ellipse cx="60" cy="58" rx="32" ry="20" fill="var(--cp-tertiary)" />
      {/* Cabeça */}
      <ellipse cx="42" cy="40" rx="16" ry="12" fill="var(--cp-surface)" />
      {/* Focinho */}
      <rect x="76" y="52" width="14" height="10" rx="5" fill="var(--cp-primary)" />
      {/* Cauda */}
      <path
        d="M28 68 Q16 76 10 84"
        stroke="var(--cp-tertiary)"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Orelha */}
      <ellipse cx="38" cy="36" rx="6" ry="4" fill="var(--cp-primary)" opacity="0.7" />
    </svg>
  );
}
