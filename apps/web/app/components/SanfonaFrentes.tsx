"use client";

/**
 * Sanfona das seis frentes (etapa 4 do PLANO-TEMA-PEQUI, prévia v7.1).
 *
 * O visitante escolhe uma frente e lê o resumo dela sem sair da home.
 * Auto-rotação a cada 4,5s — quem só olha vê todas; quem quer, clica.
 * Pausa quando o mouse entra, quando um botão recebe foco de teclado,
 * e um clique reinicia o relógio. Reduced-motion: sem rotação, navegação
 * só manual (teclado e setas funcionam igual).
 *
 * O tempo do ciclo vive na barra de progresso do botão ativo (CSS
 * .snf-btn.ativo::after, em globals.css) — o JS só troca a aba, nunca
 * anima nada. Padrão WAI-ARIA de tabs com rotação automática.
 */

import { useEffect, useRef, useState } from "react";
import { ZONAS_PUBLICADAS, type Zona } from "@/lib/zonas";

const TEMPO_MS = 4500;

/** Selo da frente: glifo SVG inline (a fonte "Ícones do Brasil" ainda sem
 * licença resolvida — o fallback que a própria prévia prevê). Paraopeba usa
 * a gota: registro sóbrio, sem glifo de brincadeira num tema de luto. */
function Selo({ id }: { id: Zona["id"] }) {
  const comum = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "cidades": // predio com bandeira
      return (
        <svg {...comum}>
          <path d="M4 21V8l5-3 5 3v13" />
          <path d="M14 12h5v9" />
          <path d="M7 11h.01M7 15h.01M11 11h.01M11 15h.01" />
          <path d="M9 5V2h4" />
        </svg>
      );
    case "congresso": // mallet/balanco das duas casas
      return (
        <svg {...comum}>
          <path d="M12 3v18" />
          <path d="M5 7h14" />
          <path d="M5 7l-2 6a3 3 0 0 0 6 0Z" />
          <path d="M19 7l-2 6a3 3 0 0 0 6 0Z" transform="translate(-2 0)" />
        </svg>
      );
    case "judiciario": // balancao da justica
      return (
        <svg {...comum}>
          <circle cx="12" cy="5" r="1.6" />
          <path d="M12 6.5V20" />
          <path d="M6 9h12" />
          <path d="M6 9l-2.5 6a3 3 0 0 0 5 0Z" />
          <path d="M18 9l-2.5 6a3 3 0 0 0 5 0Z" />
          <path d="M8 21h8" />
        </svg>
      );
    case "ambiental": // folha
      return (
        <svg {...comum}>
          <path d="M4 20c0-8 6-14 16-15-1 10-7 16-15 16" />
          <path d="M6 18C10 14 13 11 17 8" />
        </svg>
      );
    case "terras": // terreno com marco
      return (
        <svg {...comum}>
          <path d="M3 18l6-9 5 5 7-8" />
          <path d="M3 18h18" />
          <circle cx="9" cy="9" r="1.2" />
        </svg>
      );
    case "paraopeba": // gota (mesma da previa)
      return (
        <svg {...comum} strokeWidth={1.6}>
          <path d="M12 3s6.5 7 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3Z" />
          <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
        </svg>
      );
  }
}

export default function SanfonaFrentes() {
  const frentes = ZONAS_PUBLICADAS;
  const [atual, setAtual] = useState(0);
  const [pausar, setPausar] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  // Rotacao automatica: o intervalo so existe enquanto ninguem estiver
  // olhando de perto (hover/foco) e nunca existe em reduced-motion —
  // a media query e lida em JS porque aqui ela DESLIGA o relogio, nao
  // so uma transcricao (o CSS nao tem como saber que aba esta ativa).
  useEffect(() => {
    if (pausar) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAtual((a) => (a + 1) % frentes.length), TEMPO_MS);
    return () => clearInterval(t);
  }, [pausar, atual, frentes.length]);

  // Setas ← → navegam quando o foco esta na sanfona (padrao de tabs).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setAtual((a) => (a + (e.key === "ArrowRight" ? 1 : -1) + frentes.length) % frentes.length);
    }
  }

  const ativa = frentes[atual];

  return (
    <section
      ref={rootRef}
      aria-label="As seis frentes do portal"
      className="snf-root mx-auto w-full max-w-[46rem] px-6 pb-12"
      onMouseEnter={() => setPausar(true)}
      onMouseLeave={() => setPausar(false)}
      onFocus={() => setPausar(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setPausar(false);
      }}
      onKeyDown={onKeyDown}
    >
      <p className="kicker-pequi" data-reveal>
        SEIS FRENTES, UM OLHO SÓ
      </p>
      <div role="tablist" aria-label="Frentes do portal" className="snf-botoes">
        {frentes.map((f, i) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            id={`snf-btn-${f.id}`}
            aria-selected={i === atual}
            aria-controls={`snf-painel-${f.id}`}
            tabIndex={i === atual ? 0 : -1}
            onClick={() => setAtual(i)}
            className={`snf-btn${i === atual ? " ativo" : ""}${f.id === "paraopeba" ? " sober" : ""}`}
          >
            <Selo id={f.id} />
            {f.nomeCurto}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`snf-painel-${ativa.id}`}
        aria-labelledby={`snf-btn-${ativa.id}`}
        className={`snf-panel${ativa.id === "paraopeba" ? " sober" : ""}`}
      >
        <h2 className="snf-titulo">{ativa.nomeCurto}</h2>
        <p className="snf-resumo">{ativa.resumo}</p>
        {/* <a> cru: estes caminhos convivem com o mesmo aviso do grid antigo
            (a rota pode cair fora do basePath; next/link prefixaria). */}
        <a className="snf-link" href={ativa.href}>
          Abrir a frente →
        </a>
      </div>
    </section>
  );
}
