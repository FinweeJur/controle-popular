"use client";

/**
 * ShinyText — brilho que desliza sobre o texto.
 *
 * VENDORIADO de React Bits (https://reactbits.dev/text-animations/
 * shiny-text), biblioteca copy-paste de David Haz, licença MIT.
 * Copiado em 05/10/2026 para `app/components/react-bits/` — o portal
 * não usa pacote npm da lib; o código entra versionado e adaptado.
 *
 * Adaptações ao portal:
 * 1. CSS externo em `react-bits.css` (padrão do repo, sem styled-jsx);
 * 2. Cores por tokens do tema, nunca hex cravado;
 * 3. Desliga em `prefers-reduced-motion` e no tema alto contraste;
 * 4. Acessibilidade: é <span> puro — o texto segue no fluxo do h1 pai,
 *    leitor de tela lê normal, sem cópia aria-hidden.
 *
 * Por que existe: é o brilho do NOME da página na abertura viva
 * (`AberturaHero`), decisão do dono em 05/10/2026.
 */

import "./react-bits.css";

export interface ShinyTextProps {
  /** Texto exibido — segue legível mesmo com o brilho desligado. */
  texto: string;
  className?: string;
}

export default function ShinyText({ texto, className = "" }: ShinyTextProps) {
  return <span className={`cp-shiny ${className}`}>{texto}</span>;
}
