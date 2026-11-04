"use client";

/**
 * @file ScrollStar.tsx
 * @description A estrela que percorre a linha do tempo conforme o SCROLL da
 * página — não em animação solta. Reimplementação própria do efeito
 * "scroll-star" do Lightswind (a página oficial duplica o conteúdo e o
 * registry responde 401: não há código público; nada foi copiado).
 *
 * ═══ COMO SE COMPORTA (revisão do dono, 03/11/2026) ═══
 *
 * A estrela fica CERTINHA no evento relacionado: o item da linha que está
 * sob a âncora de 55% da janela, centralizada verticalmente nele. Rolar a
 * página atravessa um item por vez — um passo por evento, com a transição
 * de 240 ms `ease-out` do CSS dando o "scroll controlado". Antes da seção,
 * presa no primeiro evento; depois dela, presa no último. A fórmula é pura
 * e mora em `lib/estrela-scroll.ts` (com teste).
 *
 * A trilha (`div.scroll-star`) cobre a altura do pai, que DEVE ser
 * `position: relative` — nas linhas existentes do portal, o integrador
 * envolve o `<ol>` num wrapper relativo e informa o eixo do trilho pela
 * prop `eixo`, em px, para a estrela centro no traço já desenhado.
 *
 * ═══ POR QUE ESCREVE NO DOM DIRETO ═══
 *
 * Os centros dos eventos são lidos UMA vez por montagem/resize/edição do
 * DOM (filtro, expansão) e ficam em cache com coordenadas de documento — o
 * quadro de scroll só faz conta (binária O(log n), lista de ~260 itens em
 * `/memoria` custa 8 leituras, não 260) e escreve `style.top` quando o
 * valor muda. Zero `setState` por quadro; re-render do React a cada frame
 * travaria as páginas longas.
 *
 * ═══ ACESSIBILIDADE E MOVIMENTO ═══
 *
 * A estrela é decoração: `aria-hidden="true"` e `pointer-events: none` —
 * teclado e leitor de tela não a encontram, e os itens (o `<ol>` do pai)
 * são lidos normalmente. O porteiro é o `useEfeitoPermitido` dos react-bits:
 * com `prefers-reduced-motion: reduce` ou tema alto-contraste o componente
 * não monta (e o CSS ainda esconde a trilha, por segurança). Sem JS, nada
 * aparece — a linha continua legível.
 */

import { useEffect, useRef } from "react";
import { useEfeitoPermitido } from "./react-bits/useEfeitoPermitido";
import { ANCORAGEM_DA_ESTRELA, eventoNoAlvo, topoDoPonto } from "@/lib/estrela-scroll";
import "./ScrollStar.css";

/**
 * Estrela de quatro pontas — o MESMO ícone do site do dono
 * `encontrolenirlivre.pages.dev` (pedido em 03/11/2026: "trocar pela mesma
 * estrela daquele site"). É o traço dele, extraído do bundle do próprio site:
 * um caminho único, côncavo, `fill="currentColor"` (herda o `--cp-primary` do
 * ponto). Não é SVG inventado aqui: vem da casa do dono.
 */
function EstrelaQuatroPontas() {
  return (
    <svg
      className="scroll-star__estrela"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 0c.8 7.2 4.8 11.2 12 12-7.2.8-11.2 4.8-12 12-.8-7.2-4.8-11.2-12-12C7.2 11.2 11.2 7.2 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface Props {
  /**
   * Posição do eixo do trilho (o traço vertical da linha), em px a partir da
   * borda interna esquerda do pai. 0 = a borda do próprio pai (padrão da
   * classe `.linha-do-tempo`). Valores medidos nas páginas do portal:
   * 1 px para trilhos `border-l-2`, 8 px no conector de `/paraopeba`,
   * 13 px no `<ol>` com `ml-3` da tramitação.
   */
  eixo?: number;
}

export default function ScrollStar({ eixo = 0 }: Props) {
  const permitido = useEfeitoPermitido();
  const trilhaRef = useRef<HTMLDivElement | null>(null);
  const pontoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!permitido) return;
    const trilha = trilhaRef.current;
    const ponto = pontoRef.current;
    if (!trilha || !ponto) return;
    return ligarEstrela(trilha, ponto);
  }, [permitido]);

  if (!permitido) return null;

  // O `left` nasce do eixo pedido pela página (0 = borda do pai). Sempre
  // inline: menos um ramo no componente e o mesmo valor do CSS quando eixo 0.
  return (
    <div
      ref={trilhaRef}
      className="scroll-star"
      style={{ left: `calc(-0.75rem + ${eixo}px)` }}
      aria-hidden="true"
    >
      <div ref={pontoRef} className="scroll-star__dot">
        <EstrelaQuatroPontas />
      </div>
    </div>
  );
}

/**
 * Liga o ciclo scroll→quadro da estrela e devolve a limpeza (remover
 * listeners, desligar o MutationObserver, cancelar o rAF pendente — nada
 * sobra depois de desmontar ou trocar de rota).
 */
function ligarEstrela(trilha: HTMLDivElement, ponto: HTMLDivElement): () => void {
  const wrapper = trilha.parentElement;
  if (!wrapper) return () => {};

  // Cache em coordenadas de DOCUMENTO: só muda quando o layout muda
  // (resize, filtro que troca os <li>, expansão da tramitação), nunca por
  // quadro de scroll.
  let topos: number[] = [];
  let fins: number[] = [];
  let topoTrilha = 0;
  let alturaTrilha = 0;
  let alturaPonto = 0;

  let rafId = 0;
  let ultimoTopo = -1;

  const lerEventos = () => {
    const sy = window.scrollY;
    const novosTopos: number[] = [];
    const novosFins: number[] = [];
    for (const li of Array.from(wrapper.querySelectorAll("li"))) {
      const r = li.getBoundingClientRect();
      novosTopos.push(r.top + sy);
      novosFins.push(r.bottom + sy);
    }
    topos = novosTopos;
    fins = novosFins;
    const rt = trilha.getBoundingClientRect();
    topoTrilha = rt.top + sy;
    alturaTrilha = rt.height;
    // alturaPonto lido do DOM: com o controle de fonte da casca, o ponto
    // (1,5rem) escala, e a centralização tem de escalar junto.
    alturaPonto = ponto.offsetHeight;
  };

  const escrever = (topPx: number) => {
    // Reescrever o mesmo valor reiniciaria a transição de 240 ms e a
    // estrela nunca terminaria o passo.
    if (topPx === ultimoTopo) return;
    ultimoTopo = topPx;
    ponto.style.top = `${topPx}px`;
  };

  const medir = () => {
    rafId = 0;
    if (topos.length === 0) {
      escrever(0); // filtro sem resultado: estrela presa no topo da trilha
      return;
    }
    const alvoDoc = window.scrollY + window.innerHeight * ANCORAGEM_DA_ESTRELA;
    const i = eventoNoAlvo(alvoDoc, topos, fins);
    escrever(topoDoPonto((topos[i] + fins[i]) / 2, topoTrilha, alturaTrilha, alturaPonto));
  };

  const agendar = () => {
    // Um rAF por quadro no máximo, aconteça quantos scroll eventos vierem.
    if (!rafId) rafId = requestAnimationFrame(medir);
  };

  const reconstruir = () => {
    lerEventos();
    agendar();
  };

  lerEventos();
  medir(); // posição imediata na montagem (deep-link, âncora, recarga), sem
  // esperar o primeiro quadro — com a janela em pintura pausada o rAF atrasa.
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", reconstruir, { passive: true });
  // Filtro (/memoria, /paraopeba) e expansão (/congresso) trocam os <li> sem
  // passar por resize — o observer avisa para reler o cache. Só childList:
  // mudar classe no hover não deve reler a lista inteira.
  const observador = new MutationObserver(reconstruir);
  observador.observe(wrapper, { childList: true, subtree: true });

  return () => {
    window.removeEventListener("scroll", agendar);
    window.removeEventListener("resize", reconstruir);
    observador.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
  };
}
