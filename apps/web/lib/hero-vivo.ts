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
 * Efeitos Vanta usados. Todos renderizados por three.js — TOPOLOGY/TRUNK
 * exigiriam p5.js (dependência extra), então ficam de fora.
 *
 * Decisão do dono (06/10/2026), 2ª rodada de ajustes:
 * - a home NÃO tem efeito (só o hero estático);
 * - `globe` saiu da home e foi para o Estado e Economia;
 * - `net` saiu do Estado e foi para a Central ONSA;
 * - `cells` foi abandonado (sobrava um efeito sem uso).
 *
 * Papel de cada efeito (decorativo — NÃO representa dado georreferenciado,
 * regra editorial do AGENTS.md):
 * - `dots`   (terra): malha pontilhada tipo azulejaria Athos Bulcão;
 * - `birds`  (direitos): bando em voo — a arara é o símbolo do eixo;
 * - `globe`  (estado): rede global de fiscalização — conversa com o Globo 3D;
 * - `net`    (central): rede de conexões — o fluxo do dinheiro público.
 */
export type EfeitoVanta = "globe" | "dots" | "birds" | "net";

/** Páginas com abertura viva: a home da marca + os 4 eixos. */
export type PaginaAbertura = "home" | EixoId;

/**
 * Efeito de cada página. Fonte única — `AberturaHero` e `AberturaCanvas`
 * leem daqui, nunca de mapa próprio, para não divergirem. `null` = a
 * página tem hero mas SEM canvas (dono, 06/10/2026: "home sem efeito").
 */
export const EFEITO_POR_PAGINA: Record<PaginaAbertura, EfeitoVanta | null> = {
  home: null,
  terra: "dots",
  direitos: "birds",
  estado: "globe",
  central: "net",
};

/**
 * Tokens CSS das CORES DO EFEITO. Pedido do dono (06/10/2026): "todos os
 * efeitos mudam de cor para primária E secundária do tema" — os dois
 * tokens existem em TODOS os 8 temas (`globals.css`), então a troca de
 * tema chega ao canvas sem código por tema. Substituem o antigo
 * `--eixo-ativo-cor`, que dependia do `EixoLayout` estar acima na árvore.
 */
export const TOKEN_COR_PRIMARIA = "--cp-primary";
export const TOKEN_COR_SECUNDARIA = "--cp-secondary";

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
  /** Cor primária do tema (token `--cp-primary`). */
  cor: string;
  /** Cor secundária do tema (token `--cp-secondary`). */
  corSecundaria: string;
}

/**
 * Opções de cor por efeito. Cada efeito do Vanta aceita chaves DISTINTAS
 * (medido na fonte `node_modules/vanta/src/vanta.*.js`, 06/10/2026):
 *
 * | efeito | slots            | uso                                      |
 * |--------|------------------|------------------------------------------|
 * | dots   | `color`/`color2` | pontos / linhas do segmento              |
 * | globe  | `color`/`color2` | esfera / linhas secundárias              |
 * | birds  | `color1`/`color2`| gradientes do bando (`varianceGradient`) |
 * | net    | SÓ `color`       | pontos e linhas juntos (um slot só)      |
 *
 * `glowColor` (antigo no globe) NÃO existe na fonte do vanta 0.5.24 — era
 * chave morta, removida. O `net` recebe só a primária porque não tem o
 * segundo slot: não dá para injetar a secundária sem inventar chave que o
 * efeito ignora.
 *
 * Montado aqui (puro) para ser testável sem DOM — o componente só injeta.
 */
export function opcoesDeCores(
  efeito: EfeitoVanta,
  cores: CoresAbertura,
): Record<string, unknown> {
  const opcoes: Record<string, unknown> = {
    backgroundColor: cores.fundo,
  };
  if (efeito === "birds") {
    // O bando interpola color1×color2 por vértice (colorMode
    // `varianceGradient`): sem as duas chaves o Vanta cai nos defaults
    // (vermelho × ciano) — medido 06/10/2026, pássaros rosa em qualquer
    // tema. Primária × secundária dá o gradiente do tema no enxame.
    opcoes.color1 = cores.cor;
    opcoes.color2 = cores.corSecundaria;
    return opcoes;
  }
  // dots, globe e net: `color` pinta o elemento principal (pontos/esfera).
  opcoes.color = cores.cor;
  // `color2` é o slot secundário (linhas do dots, linhas do globe). O net
  // tem UM slot só (medido na fonte): nele a secundária não existe.
  if (efeito !== "net") {
    opcoes.color2 = cores.corSecundaria;
  }
  return opcoes;
}
