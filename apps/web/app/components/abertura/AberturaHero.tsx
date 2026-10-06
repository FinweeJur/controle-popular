"use client";

/**
 * AberturaHero — primeira dobra dos 4 eixos (Terra, Direitos, Estado,
 * Central): TELA CHEIA com apenas o NOME da página sobre o fundo vivo
 * (Vanta), e o CTA "role para explorar" levando ao conteúdo. Decisão do
 * dono em 05/10/2026 — navbar e letreiro ficam ACIMA (nada aqui os
 * cobre); o texto/foto de sempre vêm logo depois.
 *
 * A HOME SAIU em 06/10/2026 (dono): o título "CONTROLE POPULAR" voltou
 * para cima da capa da onça, em `app/page.tsx` — quem montar de novo
 * aqui ganha hero estático (mapa `home: null`), sem canvas.
 *
 * Regras duras que este componente executa:
 *
 * - H1 ÚNICO: o <h1> da página mora AQUI. Quem monta a abertura tira o
 *   h1 de baixo (eixos: EixoLayout rebaixa o título do header para h2).
 * - NADA DE TEXTO INVISÍVEL: o nome é HTML do servidor, visível sem JS.
 *   Sem `opacity: 0` pré-hidratação — se o JS falhar, a página inteira
 *   continua legível (mesma regra do HeroNarrative).
 * - MOVIMENTO É ESCOLHA: `prefers-reduced-motion`, `pointer: coarse`
 *   (celular) e tema alto contraste recebem a versão estática — fundo do
 *   tema + nome com contorno, sem canvas, sem brilho animado, sem magnet.
 * - FORA DA TELA, EFEITO MORTO: IntersectionObserver destrói o canvas
 *   quando a abertura sai da tela (o leitor está no conteúdo) e o recria
 *   se voltar. GPU não queima de graça.
 * - CONTRASTE: nome em `var(--cp-primary)` com contorno preto de 4 lados
 *   — o mesmo tratamento do h1 da CapaFrente, medido AA nos 4 temas.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ShinyText from "@/app/components/react-bits/ShinyText";
import Magnet from "@/app/components/react-bits/Magnet";
import { deveRenderCanvas, EFEITO_POR_PAGINA, type PaginaAbertura } from "@/lib/hero-vivo";
import { bibliotecaThree } from "./AberturaCanvas";
import { useTemaPortal } from "./useTemaPortal";

// O canvas é exclusivamente client (WebGL + window), carregado só quando
// o componente existe — e `ssr: false` impede o Next de tentar renderizá-lo
// no servidor, onde `import("three")` não tem sentido.
const AberturaCanvasDinamico = dynamic(() => import("./AberturaCanvas"), {
  ssr: false,
});
/** Contorno preto do texto sobre qualquer fundo — igual ao da CapaFrente. */
const CONTORNO_TEXTO =
  "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 12px rgba(0,0,0,0.95)";

export interface AberturaHeroProps {
  /** Página onde a abertura vive (efeito + token vêm do mapa da lib). */
  paginaId: PaginaAbertura;
  /** Nome exibido — SEMPRE da fonte oficial da página, nunca cravado aqui. */
  titulo: string;
}

export default function AberturaHero({ paginaId, titulo }: AberturaHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const conteudoRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointerCoarse, setPointerCoarse] = useState(false);
  const [visivel, setVisivel] = useState(false);
  // Tema reativo (MutationObserver no data-theme): sem isso, quem entrasse
  // no tema alto contraste e trocasse para outro — ou o contrário — ficava
  // com a decisão de montar/não montar o canvas tomada no primeiro render.
  const { altoContraste } = useTemaPortal();

  // ── Preferências do usuário (mesmo padrão do HeroNarrative):
  // lidas uma vez + listener, porque o usuário pode trocar a opção com a
  // página aberta e a interface precisa obedecer na hora.
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const ler = () => {
      setReducedMotion(mqMotion.matches);
      setPointerCoarse(mqCoarse.matches);
    };
    ler();
    mqMotion.addEventListener("change", ler);
    mqCoarse.addEventListener("change", ler);
    return () => {
      mqMotion.removeEventListener("change", ler);
      mqCoarse.removeEventListener("change", ler);
    };
  }, []);

  // ── Fora da tela = efeito desligado. `visivel` começa FALSE e o
  // observer liga: assim o canvas não tenta nascer escondido.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting && entrada.intersectionRatio > 0.1),
      { threshold: [0, 0.1, 0.5] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ── ScrollTrigger "pra baixo" (pedido do dono, 05/10/2026): ao rolar
  // para baixo a partir da abertura, o conteúdo (nome + CTA) sobe e some
  // em velocidade presa ao scroll (scrub: true, sem pin — quem quer dado
  // não fica preso no hero; regra do plano de identidade visual). O GSAP
  // entra por import dinâmico: só as páginas com abertura pagam o chunk.
  // Lenis no modo raiz rola a janela de verdade, então o ScrollTrigger
  // acompanha o scroll nativo sem precisar de ponte.
  useEffect(() => {
    if (reducedMotion) return;
    let cancelado = false;
    let revert: (() => void) | undefined;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.to(conteudoRef.current, {
          y: -90,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom 25%",
            scrub: true,
          },
        });
      }, sectionRef);
      revert = () => ctx.revert();
    })();
    return () => {
      cancelado = true;
      revert?.();
    };
  }, [reducedMotion]);

  // ── Pré-aquecimento da biblioteca three (~600 KB): começa a carregar
  // NA MONTAGEM, em paralelo com a hidratação e com os chunks do GSAP —
  // sem isso, o carregamento ficava em CASCATA (canvas → three → efeito)
  // e o fundo demorava segundos para nascer no dev (medido 05/10/2026).
  // A promessa é memoizada: o `ligar` do canvas recebe o mesmo objeto já
  // em andamento. Reduced-motion/coarse/alto contraste: não carrega nada.
  // `semEfeito` (mapa `home: null`, dono 06/10/2026): sem canvas não há
  // three a aquecer — se algum dia a home montar hero de novo, ela não
  // paga os 600 KB. Hoje a home nem monta este componente.
  const semEfeito = EFEITO_POR_PAGINA[paginaId] == null;
  useEffect(() => {
    if (
      !semEfeito &&
      deveRenderCanvas({
        reducedMotion,
        pointerCoarse,
        temaAltoContraste: altoContraste,
      })
    ) {
      bibliotecaThree();
    }
  }, [semEfeito, reducedMotion, pointerCoarse, altoContraste]);

  const podeCanvas =
    !semEfeito &&
    visivel &&
    deveRenderCanvas({
      reducedMotion,
      pointerCoarse,
      temaAltoContraste: altoContraste,
    });

  return (
    <section
      ref={sectionRef}
      aria-label={titulo}
      className="relative flex w-full items-center justify-center overflow-hidden"
      // Tela cheia MENOS a navbar (~4rem) que fica acima — decisão do
      // dono: "acima navbar e letreiro". `svh` evita o salto do footer
      // do navegador no celular; o min-h é a rede para navegadores velhos.
      // ⚠️ A cor de fundo é DA SEÇÃO (não só do canvas): enquanto os
      // chunks do three/vanta chegam (5-15s no dev frio; instantâneo em
      // produção), a abertura já tem a cor do tema — nunca fica crua.
      style={{
        minHeight: "max(560px, calc(100svh - 4rem))",
        backgroundColor: "var(--cp-bg)",
      }}
    >
      {/* Fundo vivo — só existe quando pode. O div do canvas pinta
          `--cp-bg` por conta própria, então a abertura nunca fica crua. */}
      {podeCanvas && (
        <AberturaCanvasDinamico paginaId={paginaId} ativo={visivel} />
      )}

      {/* Nome da página — o <h1> único, com brilho ShinyText. O contorno
          preto garante leitura sobre qualquer fundo de tema. O wrapper é
          o alvo do ScrollTrigger de descida (sobe e some ao rolar). */}
      <div ref={conteudoRef} className="relative z-10 px-4 text-center">
        <h1
          className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl lg:text-7xl"
          style={{
            color: "var(--cp-primary)",
            textShadow: CONTORNO_TEXTO,
          }}
        >
          <ShinyText texto={titulo} />
        </h1>

        {/* CTA de descida — âncora real para o conteúdo (§5.13: âncora
            pura pode ser <a> cru). O Magnet é o "gruda no cursor" do
            React Bits; desliga sozinho em toque/reduced-motion. */}
        <div className="mt-10 flex justify-center">
          <Magnet forca={0.25}>
            <a
              href="#conteudo-principal"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs backdrop-blur-sm hover:bg-surface"
            >
              Role para explorar
              <span aria-hidden="true">↓</span>
            </a>
          </Magnet>
        </div>
      </div>
    </section>
  );
}
