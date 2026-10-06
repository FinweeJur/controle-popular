/**
 * @file posicionar-painel.ts
 * @description Posicionamento automático de painéis flutuantes do portal.
 *
 * Papel no portal: o índice do rádio (`PlayerRadio.tsx`), o menu do
 * companheiro (`CompanheiroFlutuante.tsx`) e a janelinha do Seu Nonô
 * (`SeuNono.tsx`) abrem encostados em um botão ou na posição do mouse. Em
 * tela pequena — e num portal que a pessoa usa sob estresse — o painel não
 * pode sair pela borda: o controle de volume do rádio, a lista de bichos e a
 * conversa do assistente precisam ficar inteiros.
 *
 * Regra de negócio (pedido do dono, 03/10/2026): a partir da caixa da âncora,
 * do tamanho do painel e do tamanho da viewport, o painel
 * 1. abre para cima quando cabe e vira para baixo quando não cabe (e vice-versa);
 * 2. cresce para a direita e vira para a esquerda quando falta espaço à direita;
 * 3. se ainda não couber, tem a altura reduzida (scroll interno) e a posição
 *    limitada à margem de segurança — nunca transborda.
 *
 * Correção de 06/10/2026 (pedido do dono — "volume cortando no topo"):
 * `margemTopo` segura a casca sticky (navbar `z-50`) no cálculo do topo.
 * O índice do rádio mora num grupo `z-[45]` — abaixo da navbar por regra
 * de camadas — então ele não sobe por cima: abre ABAIXO, sem perder linha.
 *
 * Duas partes:
 * - `posicionarPainel` é PURA (sem DOM) e testada em `posicionar-painel.test.ts`;
 * - `usePosicaoPainel` é o hook de cliente que mede os elementos e recalcula em
 *   `useLayoutEffect` + `resize`/`scroll`/`visualViewport`/`ResizeObserver`.
 *
 * Decisões técnicas:
 * - as coordenadas devolvidas são de VIEWPORT (base para `position: fixed`);
 *   quem está dentro de um ancestral com `transform` converte para o seu
 *   referencial subtraindo a caixa da âncora (o hook devolve a âncora usada);
 * - a altura desejada é medida pelo `scrollHeight` do painel — não pelo
 *   `offsetHeight`, que já vem cortado quando aplicamos o teto na rodada
 *   anterior (senão o painel nunca voltaria a crescer quando a tela aumenta);
 * - nenhum `any`: tudo tipado com `CaixaAncora`, `TamanhoPainel` e `TamanhoVisao`.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** Folga mínima (px) entre o painel e cada borda da viewport. */
export const MARGEM_PAINEL = 8;

/** Vão (px) entre a âncora e o painel. */
export const ESPACO_PAINEL = 8;

/**
 * Caixa de um elemento em coordenadas de viewport — os mesmos campos que
 * `getBoundingClientRect` devolve, em português (padrão de `usarArrastavel.ts`).
 */
export interface CaixaAncora {
  esq: number;
  topo: number;
  larg: number;
  alt: number;
}

/** Tamanho desejado do painel, em px. */
export interface TamanhoPainel {
  larg: number;
  alt: number;
}

/** Tamanho útil da viewport, em px (`visualViewport` quando existe). */
export interface TamanhoVisao {
  larg: number;
  alt: number;
}

/** Lado vertical por onde o painel abre, relativo à âncora. */
export type LadoVertical = "acima" | "abaixo";

/**
 * Lado horizontal para onde o painel cresce a partir da âncora:
 * - `"direita"`: borda esquerda alinhada à âncora (cresce para a direita);
 * - `"esquerda"`: borda direita alinhada à âncora (vira e cresce para a esquerda).
 */
export type LadoHorizontal = "esquerda" | "direita";

/** Resultado do cálculo de posição, em coordenadas de viewport. */
export interface PosicaoPainel {
  vertical: LadoVertical;
  horizontal: LadoHorizontal;
  /** `left` (px) para `position: fixed`. */
  x: number;
  /** `top` (px) para `position: fixed`. */
  y: number;
  /** Largura final (pode encolher para caber). */
  largura: number;
  /** Altura final (pode encolher para caber; use como `maxHeight`). */
  altura: number;
  /** Espaço vertical livre no lado escolhido, em px. */
  alturaDisponivel: number;
  /** `true` quando a altura foi reduzida (o conteúdo precisa rolar). */
  limitadoAltura: boolean;
  /** `true` quando a largura foi reduzida. */
  limitadoLargura: boolean;
}

/** Opções do cálculo puro. */
export interface OpcoesPosicionamento {
  margem?: number;
  /**
   * Folga extra no TOPO da viewport (px), além da `margem` — vence quando
   * for maior. Ex.: a navbar `sticky z-50` encobre o topo; um painel abaixo
   * dela no empilhamento (o índice do rádio vive dentro do grupo `z-[45]`)
   * não pode passar por cima: se abrir para cima sem esta folga, a PRIMEIRA
   * linha some atrás da barra (medido 06/10/2026 — pedido do dono, "volume
   * cortando no topo atrás da navbar"). Aceita função para a margem seguir a
   * altura real da casca a cada cálculo (faixa de desenvolvimento muda o
   * topo sem mudar o componente).
   */
  margemTopo?: number | (() => number);
  espaco?: number;
  /** Direção vertical preferida em caso de empate. Padrão: `"acima"`. */
  verticalPreferida?: LadoVertical;
  /** Direção horizontal preferida. Padrão: a que couber. */
  horizontalPreferida?: LadoHorizontal;
  /** Trava a direção vertical na preferida (o painel não vira). */
  forcarVertical?: boolean;
  /** Trava a direção horizontal na preferida (o painel não vira). */
  forcarHorizontal?: boolean;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), Math.max(minimo, maximo));
}

/**
 * Calcula onde colocar um painel para ele ficar inteiro na viewport.
 *
 * @param ancora  Caixa da âncora (botão, ponto do mouse) em coordenadas de viewport.
 * @param painel  Tamanho natural desejado do painel.
 * @param visao   Tamanho da viewport.
 * @param opcoes  Margem, vão e preferências de lado.
 * @returns Posição final (`x`/`y` de viewport), lados escolhidos e dimensões.
 */
export function posicionarPainel(
  ancora: CaixaAncora,
  painel: TamanhoPainel,
  visao: TamanhoVisao,
  opcoes: OpcoesPosicionamento = {},
): PosicaoPainel {
  const margem = Math.max(0, opcoes.margem ?? MARGEM_PAINEL);
  const espaco = Math.max(0, opcoes.espaco ?? ESPACO_PAINEL);
  // Folga do topo: a casca sticky (navbar) vence a margem comum quando for
  // maior — o painel abre ABAIXO dela, nunca por trás. Função é resolvida
  // aqui, dentro do cálculo, para a altura seguir a casca quadro a quadro.
  const brutoTopo =
    typeof opcoes.margemTopo === "function" ? opcoes.margemTopo() : opcoes.margemTopo;
  const margemTopo = Math.max(margem, Math.max(0, brutoTopo ?? 0));

  // Largura: nunca maior que a viewport útil (senão encolhe e a margem vale).
  const larguraMaxima = Math.max(1, visao.larg - 2 * margem);
  const largura = Math.min(Math.max(1, painel.larg), larguraMaxima);
  const limitadoLargura = largura < painel.larg;

  // Espaço vertical livre de cada lado da âncora, descontados margem e vão.
  const livreAcima = ancora.topo - margemTopo - espaco;
  const livreAbaixo = visao.alt - (ancora.topo + ancora.alt) - margem - espaco;

  let vertical: LadoVertical;
  if (opcoes.forcarVertical) {
    vertical = opcoes.verticalPreferida ?? "acima";
  } else if (painel.alt <= livreAcima) {
    vertical = "acima";
  } else if (painel.alt <= livreAbaixo) {
    vertical = "abaixo";
  } else {
    // Nenhum lado cabe inteiro: escolhe o maior e, no empate, a preferência.
    const preferida = opcoes.verticalPreferida ?? "acima";
    if (livreAcima === livreAbaixo) vertical = preferida;
    else vertical = livreAcima > livreAbaixo ? "acima" : "abaixo";
  }

  const espacoLado = vertical === "acima" ? livreAcima : livreAbaixo;
  const alturaDisponivel = Math.max(0, espacoLado);
  const altura = Math.min(painel.alt, alturaDisponivel);
  const limitadoAltura = altura < painel.alt;

  const yBruto =
    vertical === "acima"
      ? ancora.topo - espaco - altura
      : ancora.topo + ancora.alt + espaco;
  const y = limitar(yBruto, margemTopo, visao.alt - altura - margem);

  // Horizontal: cresce para a direita se couber; senão vira para a esquerda,
  // ancorando a borda direita do painel na borda direita da âncora.
  const livreDireita = visao.larg - ancora.esq - margem;
  let horizontal: LadoHorizontal;
  if (opcoes.forcarHorizontal) {
    horizontal = opcoes.horizontalPreferida ?? "direita";
  } else {
    horizontal = largura <= livreDireita ? "direita" : "esquerda";
  }
  const xBruto =
    horizontal === "direita"
      ? ancora.esq
      : ancora.esq + ancora.larg - largura;
  const x = limitar(xBruto, margem, visao.larg - largura - margem);

  return {
    vertical,
    horizontal,
    x,
    y,
    largura,
    altura,
    alturaDisponivel,
    limitadoAltura,
    limitadoLargura,
  };
}

/** Resultado completo do hook: a posição e a âncora que a originou. */
export interface ResultadoPainel {
  posicao: PosicaoPainel;
  ancora: CaixaAncora;
}

/** Opções do hook: o cálculo puro + tetos de tamanho do painel. */
export interface OpcoesHookPainel extends OpcoesPosicionamento {
  /** Teto de largura, em px (opcional). */
  larguraMaxima?: number;
  /** Teto de altura, em px (opcional). */
  alturaMaxima?: number;
}

/** Compara duas posições para o hook não re-renderizar à toa. */
function mesmaPosicao(a: PosicaoPainel, b: PosicaoPainel): boolean {
  return (
    a.vertical === b.vertical &&
    a.horizontal === b.horizontal &&
    a.x === b.x &&
    a.y === b.y &&
    a.largura === b.largura &&
    a.altura === b.altura &&
    a.alturaDisponivel === b.alturaDisponivel &&
    a.limitadoAltura === b.limitadoAltura &&
    a.limitadoLargura === b.limitadoLargura
  );
}

function mesmaCaixa(a: CaixaAncora, b: CaixaAncora): boolean {
  return a.esq === b.esq && a.topo === b.topo && a.larg === b.larg && a.alt === b.alt;
}

/** Configuração do hook. */
export interface ConfigHookPainel {
  /** O painel está aberto? Fechado, o hook zera a posição. */
  aberto: boolean;
  /** Elemento do painel (mede o tamanho natural). */
  painelRef: RefObject<HTMLElement | null>;
  /**
   * Mede a âncora em coordenadas de viewport. Recebe a função a cada render
   * (fecha sobre o estado mais novo) e pode devolver `null` quando não há
   * âncora. Ex.: mouse (caixa de tamanho zero) ou o retângulo de um botão.
   */
  medirAncora: () => CaixaAncora | null;
  opcoes?: OpcoesHookPainel;
}

/**
 * Mede âncora e painel e devolve a posição que mantém o painel inteiro na tela.
 *
 * Recalcula:
 * - a cada render enquanto aberto — assim o arrasto (que muda a âncora por
 *   `transform`) reposiciona o painel sem esperar evento;
 * - em `resize`, `scroll` (com captura, para rolagem de contêineres aninhados),
 *   `visualViewport` (`resize`/`scroll`, teclado do celular) e mutações de
 *   tamanho via `ResizeObserver`.
 */
export function usePosicaoPainel(config: ConfigHookPainel): ResultadoPainel | null {
  const { aberto, painelRef, medirAncora, opcoes } = config;
  const [resultado, setResultado] = useState<ResultadoPainel | null>(null);

  // Refs para os valores que mudam a cada render. São escritos no efeito de
  // layout abaixo (e não no corpo do render): a regra `react-hooks/refs` proíbe
  // mexer em `ref.current` durante o render — e o valor novo chega ANTES do
  // `recalcular` na mesma batida, então não há atraso de um quadro.
  const medirAncoraRef = useRef(medirAncora);
  const opcoesRef = useRef<OpcoesHookPainel>(opcoes ?? {});

  const recalcular = useCallback(() => {
    const painel = painelRef.current;
    const ancora = medirAncoraRef.current();
    if (!painel || !ancora) return;

    const o = opcoesRef.current;
    // Mede a ALTURA natural sem o teto inline que aplicamos na rodada anterior:
    // `scrollHeight` devolveria o valor já cortado e o painel nunca voltaria a
    // crescer quando a tela aumentasse. Limpar e restaurar na mesma batida de
    // layout não pisca (roda antes da pintura) e é o preço de ter o teto.
    //
    // PRESERVAR A ROLAGEM (conserto 05/10/2026): com o teto removido o painel
    // cresce até o conteúdo inteiro, o navegador zera o `scrollTop` e restaurar
    // o teto NÃO devolve a posição. Sem guardar e recolocar o `scrollTop`, toda
    // medição jogava o leitor de volta ao topo. Pior: `recalcular` roda no
    // evento de `scroll` do próprio painel — a roda do mouse rolava, o evento
    // pedia nova medição e a lista pulava para o começo. Efeito medido com
    // Playwright em 05/10/2026 nos três painéis (rádio, bichinhos e Seu Nonô).
    const scrollTopAnterior = painel.scrollTop;
    const maxAnterior = painel.style.maxHeight;
    painel.style.maxHeight = "none";
    const alturaNatural = painel.scrollHeight;
    painel.style.maxHeight = maxAnterior;
    if (painel.scrollTop !== scrollTopAnterior) painel.scrollTop = scrollTopAnterior;

    const larguraNatural = painel.offsetWidth;
    const largura = o.larguraMaxima
      ? Math.min(larguraNatural, o.larguraMaxima)
      : larguraNatural;
    const altura = o.alturaMaxima
      ? Math.min(alturaNatural, o.alturaMaxima)
      : alturaNatural;

    const vv = window.visualViewport;
    const visao: TamanhoVisao = {
      larg: vv?.width ?? window.innerWidth,
      alt: vv?.height ?? window.innerHeight,
    };

    const posicao = posicionarPainel(ancora, { larg: largura, alt: altura }, visao, o);
    setResultado((anterior) => {
      if (
        anterior &&
        mesmaPosicao(anterior.posicao, posicao) &&
        mesmaCaixa(anterior.ancora, ancora)
      ) {
        return anterior;
      }
      return { posicao, ancora };
    });
  }, [painelRef]);

  // Roda a cada render de propósito (sem lista de dependências): o arrasto
  // move a âncora por `transform` e a posição precisa acompanhar quadro a
  // quadro. `useLayoutEffect` posiciona antes da pintura — o painel não pisca
  // no lugar errado ao abrir.
  useLayoutEffect(() => {
    medirAncoraRef.current = medirAncora;
    opcoesRef.current = opcoes ?? {};
    if (aberto) recalcular();
  });

  useEffect(() => {
    if (!aberto) return;
    const aoMudar = () => recalcular();
    // Rolar DENTRO do painel não pode reposicioná-lo nem remedi-lo: o próprio
    // `recalcular` mexe no teto e zeraria a rolagem do leitor (ver o conserto
    // de 05/10/2026 em `recalcular`). Só interessa a rolagem de FORA — a
    // página ou um contêiner que desloca a âncora. O listener roda em captura,
    // então o `target` é o próprio elemento que rolou.
    const aoRolar = (e: Event) => {
      const alvo = e.target;
      if (alvo instanceof Node && painelRef.current?.contains(alvo)) return;
      recalcular();
    };
    window.addEventListener("resize", aoMudar);
    window.addEventListener("scroll", aoRolar, true);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", aoMudar);
    vv?.addEventListener("scroll", aoMudar);
    const observador =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(aoMudar) : null;
    if (observador && painelRef.current) observador.observe(painelRef.current);
    return () => {
      window.removeEventListener("resize", aoMudar);
      window.removeEventListener("scroll", aoRolar, true);
      vv?.removeEventListener("resize", aoMudar);
      vv?.removeEventListener("scroll", aoMudar);
      observador?.disconnect();
    };
  }, [aberto, recalcular, painelRef]);

  // Fechado, devolve `null` mesmo que a última medição siga na memória.
  return aberto ? resultado : null;
}

/**
 * Mede a casca no topo da tela: a borda de baixo do cabeçalho sticky/fixed
 * mais baixo (px de viewport). É o valor pronto para `margemTopo`.
 *
 * Por que só `header` sticky/fixed: cabeçalho de conteúdo é estático — o
 * painel passa POR CIMA dele sem prejuízo (empilhamento do grupo `z-[45]`).
 * Só a casca (`TopNav`, `sticky z-50`) fica acima do painel e precisa ser
 * descontada. Medido em 06/10/2026: sem isto, a primeira linha do índice
 * do rádio sumia atrás da navbar.
 *
 * @returns Y até a borda de baixo da casca; 0 quando não há casca.
 */
export function medirTopoUtil(): number {
  if (typeof document === "undefined") return 0;
  let topo = 0;
  for (const el of document.querySelectorAll<HTMLElement>("header")) {
    const css = getComputedStyle(el);
    if (css.position === "sticky" || css.position === "fixed") {
      topo = Math.max(topo, el.getBoundingClientRect().bottom);
    }
  }
  return Math.round(topo);
}
