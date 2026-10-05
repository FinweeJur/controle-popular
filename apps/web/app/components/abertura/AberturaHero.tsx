"use client";

/**
 * AberturaHero — primeira dobra das 5 páginas nobres (home + 4 eixos):
 * TELA CHEIA com apenas o NOME da página sobre o fundo vivo (Vanta), e o
 * CTA "role para explorar" levando ao conteúdo. Decisão do dono em
 * 05/10/2026 — navbar e letreiro ficam ACIMA (nada aqui os cobre); o
 * texto/foto de sempre vêm logo depois.
 *
 * Regras duras que este componente executa:
 *
 * - H1 ÚNICO: o <h1> da página mora AQUI. Quem monta a abertura tira o
 *   h1 de baixo (home: CapaFrente `mostrarTitulo={false}`; eixos:
 *   EixoLayout rebaixa o título do header para h2).
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
import { deveRenderCanvas, type PaginaAbertura } from "@/lib/hero-vivo";

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointerCoarse, setPointerCoarse] = useState(false);
  const [visivel, setVisivel] = useState(false);

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

  // Alto contraste via atributo do tema (a trava fina do --cp-glow fica
  // no AberturaCanvas, que já lê computed style).
  const temaAltoContraste =
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "high-contrast";

  const podeCanvas =
    visivel &&
    deveRenderCanvas({ reducedMotion, pointerCoarse, temaAltoContraste });

  return (
    <section
      ref={sectionRef}
      aria-label={titulo}
      className="relative flex w-full items-center justify-center overflow-hidden"
      // Tela cheia MENOS a navbar (~4rem) que fica acima — decisão do
      // dono: "acima navbar e letreiro". `svh` evita o salto do footer
      // do navegador no celular; o min-h é a rede para navegadores velhos.
      style={{ minHeight: "max(560px, calc(100svh - 4rem))" }}
    >
      {/* Fundo vivo — só existe quando pode. O div do canvas pinta
          `--cp-bg` por conta própria, então a abertura nunca fica crua. */}
      {podeCanvas && (
        <AberturaCanvasDinamico paginaId={paginaId} ativo={visivel} />
      )}

      {/* Nome da página — o <h1> único, com brilho ShinyText. O contorno
          preto garante leitura sobre qualquer fundo de tema. */}
      <div className="relative z-10 px-4 text-center">
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
