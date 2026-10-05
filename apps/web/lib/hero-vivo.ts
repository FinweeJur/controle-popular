/**
 * Lógica pura da abertura viva ("hero vivo") das 5 páginas nobres do
 * portal: home + 4 eixos (Terra e Territórios, Direitos em Movimento,
 * Estado e Economia, Central ONSA).
 *
 * O que a abertura é: primeira dobra de tela cheia com o NOME da página
 * sobre um fundo animado (Vanta.js / three.js via WebGL), seguida do
 * conteúdo de sempre (epígrafe, resumo, foto). Decisão do dono em
 * 05/10/2026 — ver `docs/planos/PLANO-HERO-VIVO.md`.
 *
 * Nada de React, DOM ou Vanta aqui: é o dado e o cálculo que os
 * componentes consomem, isolado em `lib/` para ter teste unitário,
 * como manda o padrão do repo (`lib/hero-narrativo.ts` é o precedente).
 */

import type { EixoId } from "@/lib/eixos/types";

/**
 * Efeitos Vanta usados, um por página (decisão do dono: "um efeito por
 * eixo"). Todos são renderizados por three.js — TOPOLOGY/TRUNK exigiriam
 * p5.js (dependência extra), então a Central usa CELLS, também de malha
 * orgânica conectada, sem adicionar pacote.
 *
 * Papel de cada efeito (decorativo — NÃO representa dado georreferenciado,
 * regra editorial do AGENTS.md):
 * - `globe`  (home): rede global de fiscalização — conversa com o Globo 3D;
 * - `dots`   (terra): malha pontilhada tipo azulejaria Athos Bulcão;
 * - `birds`  (direitos): bando em voo — a arara é o símbolo do eixo;
 * - `net`    (estado): rede de conexões — o fluxo do dinheiro público;
 * - `cells`  (central): células conectadas — ferramentas e inteligência.
 */
export type EfeitoVanta = "globe" | "dots" | "birds" | "net" | "cells";

/** Páginas que têm abertura viva: a home da marca + os 4 eixos. */
export type PaginaAbertura = "home" | EixoId;

/**
 * Efeito de cada página. Fonte única — `AberturaHero` e `AberturaCanvas`
 * leem daqui, nunca de mapa próprio, para não divergirem.
 */
export const EFEITO_POR_PAGINA: Record<PaginaAbertura, EfeitoVanta> = {
  home: "globe",
  terra: "dots",
  direitos: "birds",
  estado: "net",
  central: "cells",
};

/**
 * Token CSS que resolve a COR DO EFEITO em cada página. Os eixos leem
 * `--eixo-ativo-cor` (definida por `EixoLayout` a partir do catálogo,
 * `lib/eixos/catalogo.ts`), então a cor acompanha o tema ativo sem código
 * por tema. A home não tem layout de eixo: lê `--cp-primary` direto.
 */
export const COR_TOKEN_POR_PAGINA: Record<PaginaAbertura, string> = {
  home: "--cp-primary",
  terra: "--eixo-ativo-cor",
  direitos: "--eixo-ativo-cor",
  estado: "--eixo-ativo-cor",
  central: "--eixo-ativo-cor",
};

/** Token CSS do FUNDO do canvas — o `--cp-bg` de cada tema. */
export const FUNDO_TOKEN = "--cp-bg";

export interface CondicoesAbertura {
  /** `prefers-reduced-motion: reduce` — reduzir movimento é lei (AGENTS). */
  reducedMotion: boolean;
  /** `pointer: coarse` (celular/tablet) — sem WebGL, economiza bateria. */
  pointerCoarse: boolean;
  /** Tema alto contraste — sem decoração, só texto com tokens (regra 19/09). */
  temaAltoContraste: boolean;
}

/**
 * O canvas Vanta só existe para quem pode e quer ver animação:
 * mouse/touch fino, sem redução de movimento, fora do alto contraste.
 * Todo o resto recebe o fundo estático do tema + o nome da página — que
 * é HTML do servidor, visível mesmo se o JS falhar.
 */
export function deveRenderCanvas(c: CondicoesAbertura): boolean {
  return !c.reducedMotion && !c.pointerCoarse && !c.temaAltoContraste;
}

/** Cores já normalizadas (hex) para alimentar as opções do Vanta. */
export interface CoresAbertura {
  /** Fundo do canvas (token `--cp-bg` do tema ativo). */
  fundo: string;
  /** Cor das partículas/linhas (token primário do tema/eixo). */
  cor: string;
}

/**
 * Opções de cor por efeito. Cada efeito do Vanta aceita nomes distintos:
 * `birds` só tem fundo (a cor do bando é de shader); `cells` usa `color`
 * e `color2`; `globe` brilha com `glowColor`. Montado aqui para ser
 * testável sem DOM — o componente só injeta o resultado.
 */
export function opcoesDeCores(
  efeito: EfeitoVanta,
  cores: CoresAbertura,
): Record<string, unknown> {
  const opcoes: Record<string, unknown> = {
    backgroundColor: cores.fundo,
  };
  if (efeito !== "birds") {
    opcoes.color = cores.cor;
  }
  if (efeito === "globe") {
    // O brilho do globo acompanha a cor primária — token `--cp-glow`
    // é rgba fraco e sumiria; usa a cor cheia para o halo ficar visível.
    opcoes.glowColor = cores.cor;
  }
  if (efeito === "cells") {
    opcoes.color2 = cores.cor;
  }
  return opcoes;
}
