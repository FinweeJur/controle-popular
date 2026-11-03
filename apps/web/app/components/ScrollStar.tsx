"use client";

/**
 * @file ScrollStar.tsx
 * @description A estrela que desce pela linha do tempo conforme o SCROLL da
 * página — não em animação solta. Reimplementação própria do efeito
 * "scroll-star" do Lightswind (a página oficial duplica o conteúdo e o
 * registry responde 401: não há código público; nada foi copiado).
 *
 * ═══ COMO SE COMPORTA ═══
 *
 * A trilha (`div.scroll-star`) cobre a altura do pai, que DEVE ser
 * `position: relative` — por contrato, o pai é a linha do tempo (a classe
 * `.linha-do-tempo` do `LinhaDoTempo.tsx` já garante isso; nas linhas
 * existentes do portal, o integrador envolve o `<ol>` num wrapper relativo e
 * informa o eixo do trilho pela prop `eixo`, em px, para a estrela centro no
 * traço já desenhado pela página).
 *
 * O ponto (`div.scroll-star__dot`) fica sempre na altura de 55% da janela
 * enquanto a seção atravessa a tela: no topo da linha quando a seção entra,
 * no fim quando a seção acaba, presa nas pontas fora disso. A fórmula é pura
 * e mora em `lib/estrela-scroll.ts` (com teste).
 *
 * ═══ POR QUE ESCREVE NO DOM DIRETO ═══
 *
 * Um quadro de rolagem = uma leitura de `getBoundingClientRect()` + uma
 * escrita em `style.top`, dentro de UM `requestAnimationFrame` agendado no
 * máximo uma vez por evento de scroll. Zero `setState` por quadro — re-render
 * do React a cada frame travaria as páginas longas (`/memoria` tem ~260 itens
 * na tela). O `transition: top 120ms linear` do CSS amacia o passo; sem
 * "pulo" ao inverter a rolagem.
 *
 * ═══ ACESSIBILIDADE E MOVIMENTO ═══
 *
 * A estrela é decoração: `aria-hidden="true"` e `pointer-events: none` —
 * teclado e leitor de tela não a encontram, e os itens (o `<ol>` do pai) são
 * lidos normalmente. O porteiro é o `useEfeitoPermitido` dos react-bits: com
 * `prefers-reduced-motion: reduce` ou tema alto-contraste o componente não
 * monta (e o CSS ainda esconde a trilha, por segurança). Sem JS, nada
 * aparece — a linha continua legível.
 */

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useEfeitoPermitido } from "./react-bits/useEfeitoPermitido";
import { progressoDaEstrela } from "@/lib/estrela-scroll";
import "./ScrollStar.css";

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

    // Um rAF por vez: o evento de scroll só agenda, quem mede é o quadro.
    let rafId = 0;
    let ultimoProgresso = -1;

    const medir = () => {
      rafId = 0;
      const rect = trilha.getBoundingClientRect();
      const progresso = progressoDaEstrela(rect.top, rect.height, window.innerHeight);
      // Reescrever o mesmo valor reiniciaria a transição de 120 ms a cada
      // quadro e o ponto "andaria" para sempre atrás do scroll.
      if (progresso === ultimoProgresso) return;
      ultimoProgresso = progresso;
      // Meio ponto (0,75rem) abaixo da posição em % para o CENTRO da estrela
      // casar com a âncora — em rem, não em 12px, porque o portal tem
      // controle de tamanho de fonte e a estrela escala junto.
      ponto.style.top = `calc(${progresso} * 100% - 0.75rem)`;
    };

    const agendar = () => {
      if (!rafId) rafId = requestAnimationFrame(medir);
    };

    agendar(); // posição imediata na montagem (deep-link, âncora, recarga)
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar, { passive: true });

    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      if (rafId) cancelAnimationFrame(rafId);
    };
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
        <Sparkles size={16} />
      </div>
    </div>
  );
}
