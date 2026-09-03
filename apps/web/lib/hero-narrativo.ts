/**
 * Lógica pura do hero narrativo da home (Fase 1 do plano de identidade
 * visual — `docs/planos/PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md`).
 *
 * Nada de React, GSAP ou DOM aqui: é o cálculo que o
 * `HeroNarrative.tsx` consome para decidir camadas de parallax, módulos
 * decorativos por tema e o que pode animar. Isolado em `lib/` para ter
 * teste unitário, como manda o padrão do repo.
 */

/** As 4 camadas do parallax de mouse, da mais funda à mais próxima. */
export type NomeCamadaHero = "fundo" | "padrao" | "conteudo" | "fauna";

export interface CamadaHero {
  nome: NomeCamadaHero;
  /** Deslocamento horizontal em px por unidade de mouse (mouse ∈ [-1, 1]). */
  fatorX: number;
  /** Deslocamento vertical em px por unidade de mouse. */
  fatorY: number;
  /** false = a camada fica parada (mobile, reduced-motion). */
  ativo: boolean;
}

export interface EntradaPointer {
  pointerCoarse: boolean;
  reducedMotion: boolean;
}

/**
 * Fatores base do parallax: a razão entre camadas adjacentes é
 * exatamente ≥ 1,5x, critério objetivo do plano. Não exportado como
 * mutável — quem precisar de outro ritmo cria outro array.
 */
const FATORES_BASE: ReadonlyArray<{
  nome: NomeCamadaHero;
  fatorX: number;
  fatorY: number;
}> = [
  { nome: "fundo", fatorX: 8, fatorY: 6 },
  { nome: "padrao", fatorX: 16, fatorY: 12 },
  { nome: "conteudo", fatorX: 24, fatorY: 18 },
  { nome: "fauna", fatorX: 36, fatorY: 27 },
];

/**
 * Camadas de parallax por entrada do usuário. Em `pointer: coarse`
 * (celular) ou `prefers-reduced-motion: reduce` o parallax de mouse não
 * existe — todas as camadas voltam com fator 0 e `ativo: false`.
 */
export function calcularCamadasPointer(entrada: EntradaPointer): CamadaHero[] {
  const parallaxLigado = !entrada.pointerCoarse && !entrada.reducedMotion;
  return FATORES_BASE.map((f) => ({
    ...f,
    ativo: parallaxLigado,
    fatorX: parallaxLigado ? f.fatorX : 0,
    fatorY: parallaxLigado ? f.fatorY : 0,
  }));
}

/** Atalho: o parallax de mouse está ligado? */
export function camadasAtivas(entrada: EntradaPointer): boolean {
  return calcularCamadasPointer(entrada).some((c) => c.ativo);
}

export interface ComportamentoHero {
  /** Timeline GSAP com `scrub: true` presa ao scroll da própria seção. */
  timeline: boolean;
  /** Parallax de mouse (só desktop com mouse fino). */
  parallax: boolean;
  /** Revelação simples no scroll (celular conta a história assim). */
  fadeIn: boolean;
}

/**
 * O que o componente pode animar. `reduced-motion` é lei, não enfeite:
 * nada roda e tudo fica visível. No celular o parallax some, mas a
 * história continua contada pelo scroll (fade-in).
 */
export function deveAnimar(
  reducedMotion: boolean,
  pointerCoarse: boolean,
): ComportamentoHero {
  if (reducedMotion) {
    return { timeline: false, parallax: false, fadeIn: false };
  }
  return { timeline: true, parallax: !pointerCoarse, fadeIn: true };
}

/** Temas do design system do portal (next-themes, `data-theme`). */
export type TemaPortal = "light" | "dark" | "high-contrast";

export interface ModuloBulcao {
  /** Token CSS do portal que pinta o módulo — nunca hex decorativo. */
  cor: string;
  rotulo: string;
  /** false no alto contraste, onde não sobra módulo nenhum. */
  decorativo: boolean;
}

/**
 * Módulos decorativos (azulejaria Athos Bulcão) por tema. As cores saem
 * dos tokens medidos do design system, então os três temas herdam a
 * correção de contraste sem código novo por tema. No alto contraste a
 * lista é VAZIA: sem padrão decorativo, sem glow — só texto com os
 * tokens do tema (decisão do plano).
 */
export function modulosPorTema(tema: TemaPortal): ModuloBulcao[] {
  if (tema === "high-contrast") return [];
  return [
    { cor: "var(--cp-primary)", rotulo: "azul", decorativo: true },
    { cor: "var(--cp-accent)", rotulo: "verde", decorativo: true },
    { cor: "var(--cp-tertiary)", rotulo: "ocre", decorativo: true },
  ];
}
