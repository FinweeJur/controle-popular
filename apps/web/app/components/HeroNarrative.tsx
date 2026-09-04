"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BulcaoCircle,
  OndaSerra,
  TamanduaGeometrico,
} from "@/app/components/HeroNarrativePatterns";
import {
  calcularCamadasPointer,
  deveAnimar,
  modulosPorTema,
  type TemaPortal,
} from "@/lib/hero-narrativo";

/**
 * Hero narrativo da home — Fase 1 do plano de identidade visual
 * (`docs/planos/PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md`).
 *
 * É *embrulho visual* do que já existe, não overlay: o conteúdo da home
 * (frentes, cidades, busca) continua logo abaixo, e o CTA é uma âncora
 * real para `#frentes`. Regras do plano que vivem aqui:
 *
 * - `prefers-reduced-motion: reduce` → NENHUMA animação; tudo visível.
 *   O estado estático é o padrão do CSS — nada de `opacity: 0` sem
 *   classe de pronto, então se o JS falhar o texto já está na tela.
 * - `pointer: coarse` → sem parallax de mouse; a história segue contada
 *   pelo scroll (timeline com `scrub: true`, SEM `pin`).
 * - Alto contraste → sem padrão decorativo e sem glow
 *   (`--cp-glow: transparent` no tema); sobra texto com os tokens.
 * - Primeira dobra sem bitmap: gradiente + SVG inline só (LCP).
 */

// Só roda no cliente (a home importa o componente com `ssr: false`).
gsap.registerPlugin(ScrollTrigger);

export default function HeroNarrative() {
  const containerRef = useRef<HTMLElement | null>(null);
  const { resolvedTheme } = useTheme();
  // pequi e fundo escuro: mesmo comportamento do dark (glow, decoracao).
  // As cores vem dos tokens [data-theme="pequi"], nao daqui.
  const tema: TemaPortal =
    resolvedTheme === "dark" || resolvedTheme === "pequi"
      ? "dark"
      : resolvedTheme === "high-contrast"
        ? "high-contrast"
        : "light";

  // A partir de `true` é seguro deixar o GSAP tocar nos elementos — os
  // estilos animados só entram depois desta flag (classe `hero-pronto`).
  const [pronto, setPronto] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointerCoarse, setPointerCoarse] = useState(false);

  // ── Preferências do usuário (media queries, lidas uma vez + listeners)
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

  const comportamento = deveAnimar(reducedMotion, pointerCoarse);
  const modulos = modulosPorTema(tema);
  const semDecoracao = tema === "high-contrast";

  // ── Parallax de mouse — 4 camadas com `requestAnimationFrame`.
  // Ligado só em `(hover: hover) and (pointer: fine)` e sem reduced-motion.
  // O loop roda enquanto o mouse está sobre a seção; ao sair, as camadas
  // voltam com easing (critério de retorno suave do plano).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !comportamento.parallax || !pronto) return;

    const elementos = Array.from(
      container.querySelectorAll<HTMLElement>("[data-camada-hero]"),
    );
    const fatores = calcularCamadasPointer({ pointerCoarse: false, reducedMotion: false });

    let normX = 0;
    let normY = 0;
    let raf: number | null = null;

    const animar = () => {
      elementos.forEach((el) => {
        const indice = Number(el.dataset.indiceCamada ?? 0);
        const fator = fatores[indice];
        if (!fator?.ativo) return;
        el.style.transform = `translate3d(${normX * fator.fatorX}px, ${normY * fator.fatorY}px, 0)`;
      });
      raf = requestAnimationFrame(animar);
    };

    const aoMover = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (raf === null) raf = requestAnimationFrame(animar);
    };

    const aoSair = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      elementos.forEach((el) => {
        el.style.transition = "transform 0.5s cubic-bezier(.25,.8,.25,1)";
        el.style.transform = "translate3d(0, 0, 0)";
        window.setTimeout(() => {
          el.style.transition = "";
        }, 500);
      });
    };

    container.addEventListener("mousemove", aoMover);
    container.addEventListener("mouseleave", aoSair);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      container.removeEventListener("mousemove", aoMover);
      container.removeEventListener("mouseleave", aoSair);
    };
  }, [comportamento.parallax, pronto, pointerCoarse]);

  // ── Timeline GSAP presa ao scroll da PRÓPRIA seção (`scrub: true`,
  // sem `pin` — ninguém pode ficar preso longe dos dados).
  // As tweens são `.to()` de saída: no topo da página (progress 0) tudo
  // está no estado normal e visível; rolar para fora da hero é o que
  // "conta a história", sem nunca esconder o título de quem acabou de
  // chegar. Sem JS, nenhuma dessas transformações existe.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setPronto(true);
    if (!comportamento.timeline) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        defaults: { ease: "power2.out" },
      });

      // Fundo e padrão afundam enquanto a fauna "voa para cima" —
      // o deslocamento relativo é o que dá a sensação de profundidade.
      tl.to(".hero-fundo", { y: 90, opacity: 0.5 }, 0);
      tl.to(".hero-padrao-camada", { y: 60, opacity: 0.35 }, 0);
      tl.to(".hero-fauna", { y: -60, x: 40, rotate: 6 }, 0);
      tl.to(".hero-conteudo", { y: -24 }, 0);
    }, container);

    // Sublinhado que cresce (do protótipo `App.js`), no tempo — não no
    // scroll — porque o título precisa estar completo na primeira dobra.
    // O CSS já entrega a largura final; o GSAP só reconstitui o gesto.
    if (!semDecoracao) {
      gsap.fromTo(
        container.querySelector(".hero-sublinhado"),
        { width: 0 },
        { width: "8rem", duration: 1.2, delay: 0.3, ease: "power2.out" },
      );
    }

    return () => {
      ctx.revert();
      gsap.killTweensOf(container.querySelectorAll(".hero-sublinhado"));
    };
  }, [comportamento.timeline, semDecoracao]);

  return (
    <section
      ref={containerRef}
      className={`hero-narrativo${pronto ? " hero-pronto" : ""}`}
      data-tema-hero={tema}
      aria-label="Apresentação do portal Controle Popular"
    >
      {/* Tokens locais do hero: o glow é o ÚNICO valor fora dos tokens
          medidos do design system, e é transparente no alto contraste. */}
      <style>{`
        .hero-narrativo {
          --hero-glow: var(--cp-glow, transparent);
        }
        [data-tema-hero="high-contrast"] .hero-narrativo {
          --hero-glow: transparent;
        }
      `}</style>

      {/* ── Camada 1: fundo — gradiente terroso + onda serra (sem bitmap) */}
      <div className="hero-fundo" data-camada-hero data-indice-camada={0} aria-hidden="true">
        <div className="hero-fundo-gradiente" />
        {!semDecoracao && <OndaSerra className="hero-onda" />}
      </div>

      {/* ── Camada 2: azulejaria Athos Bulcão (some no alto contraste) */}
      {!semDecoracao && modulos.length > 0 && (
        <div
          className="hero-padrao-camada"
          data-camada-hero
          data-indice-camada={1}
          aria-hidden="true"
        >
          {modulos.map((modulo, i) => (
            <span
              key={modulo.rotulo}
              className="hero-modulo"
              style={{ color: modulo.cor, opacity: 0.55 + i * 0.15 }}
            >
              <BulcaoCircle />
            </span>
          ))}
        </div>
      )}

      {/* ── Camada 3: conteúdo real — título, subtítulo e CTA âncora */}
      <div className="hero-conteudo" data-camada-hero data-indice-camada={2}>
        {/* Título REAL, visível por padrão: o split-text é só um <span>
            por palavra, sem opacity 0 — se o JS falhar, o texto está lá. */}
        <h1 className="hero-titulo">
          {/* ⟲ 03/09, dono escolheu o cherry-pick da copy v6 sobre o hero:
              a voz nova é o titulo-mor do portal (PLANO-COPY-VOZ.md). */}
          {"O dinheiro é seu. A gente mostra.".split(" ").map((palavra, i) => (
            <span key={`${palavra}-${i}`} className="hero-palavra">
              {palavra}
            </span>
          ))}
        </h1>
        <span className="hero-sublinhado" aria-hidden="true" />
        <p className="hero-subtitulo">
          Com raízes na História e na Geografia, o Controle Popular usa
          Inteligência Artificial para somar na busca por justiça
          socioambiental e fiscalização cidadã — gratuito e sem cadastro, de
          qualquer celular ou computador. É o portal virtual criado com IA do
          Observatório Nacional Socioambiental (ONSA).
        </p>
        {/* CTA é âncora REAL para a primeira seção de conteúdo da home. */}
        <a className="hero-cta" href="#frentes">
          Conhecer as frentes
        </a>
      </div>

      {/* ── Camada 4: fauna flutuante — ilustrativa, com rótulo */}
      <div className="hero-fauna" data-camada-hero data-indice-camada={3}>
        <TamanduaGeometrico
          className="hero-fauna-svg"
          tituloAria="Tamanduá-bandeira em silhueta geométrica"
        />
      </div>
    </section>
  );
}
