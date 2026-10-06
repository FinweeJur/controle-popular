"use client";

/**
 * Cubes — grade de cubos 3D que inclinam para o ponteiro (bloco interativo).
 *
 * Origem: React Bits, componente "Cubes"
 * (https://reactbits.dev/backgrounds/cubes), licença MIT + Commons Clause,
 * copiado em 06/10/2026.
 *
 * Papel no portal: pedido do dono (06/10/2026) — "protótipo da home, add
 * animação ShapeBlur + Cubes". Grade de cubos que viram na direção do mouse
 * (inclinam dentro de um `raio`) e, no clique, propaga uma onda de cor
 * anel a anel. No protótipo da home ela ocupa um bloco próprio entre a capa
 * e o painel de dados.
 *
 * Adaptações (por quê entre parênteses):
 * 1. props em português (`grade`, `anguloMax`, `corFace`...) — padrão dos
 *    vendoriados do portal;
 * 2. classes prefixadas `cp-cubo*` — o original usava `.cube`/`:root`
 *    genérico, que colidiria com qualquer CSS futuro do portal;
 * 3. `prefers-reduced-motion` desliga na raiz: sem inclinação, sem onda,
 *    sem "vida própria" — a grade fica parada (regra: efeito decorativo
 *    não é informação);
 * 4. `gsap` já é dependência do repo (usado em `HeroNarrative.tsx`) — nada
 *    novo de peso entra no bundle.
 *
 * Limpeza: os listeners saem no unmount; a `gsap` anima elementos que morrem
 * com a página — não há estado global a zerar.
 */
import React, { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import "./Cubes.css";

/** Espaçamento entre células: um número para os dois eixos, ou por eixo. */
export type EspacamentoGrade = number | { linha: number; coluna: number };

/** Duração dos dois lados da inclinação, em segundos. */
export interface DuracaoCubos {
  entrar: number;
  sair: number;
}

/** Props públicas (nomes em português, padrão dos vendoriados). */
export interface CubesProps {
  /** Lados da grade (grade 10 = 100 cubos). Padrão 10. */
  grade?: number;
  /** Lado do cubo em px; ausente, a célula divide a largura. */
  tamanhoCubo?: number;
  /** Inclinação máxima em graus. Padrão 45. */
  anguloMax?: number;
  /** Raio (em células) em que o ponteiro inclina. Padrão 3. */
  raio?: number;
  /** Curva de animação do gsap. Padrão `"power3.out"`. */
  curva?: string;
  /** Duração de entrar/sair da inclinação. */
  duracao?: DuracaoCubos;
  /** Vão entre células (px, ou `{ linha, coluna }`). Padrão 5%. */
  espacamento?: EspacamentoGrade;
  /** Borda das faces (aceita valor CSS). Padrão `1px solid #fff`. */
  borda?: string;
  /** Cor das faces — no protótipo vem do token do tema. */
  corFace?: string;
  /** Sombra das faces: `true` (padrão do original) ou valor CSS. */
  sombra?: boolean | string;
  /** Vida própria: um "fantasma" inclina sozinho quando ninguém mexe. */
  animarSozinho?: boolean;
  /** Onda de cor no clique. Padrão true. */
  ondulacaoNoClique?: boolean;
  /** Cor da onda. Padrão branco. */
  corOndulacao?: string;
  /** Velocidade da onda (maior = mais rápido). Padrão 2. */
  velocidadeOndulacao?: number;
  /**
   * Largura do bloco (px ou `%`). Vence o `width: 50%` do CSS — no portal
   * a grade ocupa a coluna inteira do bloco que a hospeda (adaptação 06/10,
   * o original não tinha como sobrescrever sem briga de cascata).
   */
  largura?: number | string;
  /**
   * Ouve o `document` em vez do próprio elemento — modo FUNDO DE SITE
   * (06/10/2026). Necessário porque a camada de fundo é
   * `pointer-events: none`: sem isto a grade nunca receberia o ponteiro.
   * Neste modo os listeners de toque NÃO entram (um `preventDefault` no
   * documento travaria a rolagem da página).
   */
  ouvirDocumento?: boolean;
  /**
   * Quantas faces cada cubo desenha: 6 (padrão, cubo fechado) ou 3
   * (fundo de site — metade do DOM e da pintura; a grade é translúcida,
   * ninguém percebe a face que falta).
   */
  faces?: 3 | 6;
}

const Cubes: React.FC<CubesProps> = ({
  grade = 10,
  tamanhoCubo,
  anguloMax = 45,
  raio = 3,
  curva = "power3.out",
  duracao = { entrar: 0.3, sair: 0.6 },
  espacamento,
  borda = "1px solid #fff",
  corFace = "#120F17",
  sombra = false,
  animarSozinho = true,
  ondulacaoNoClique = true,
  corOndulacao = "#fff",
  velocidadeOndulacao = 2,
  largura,
  ouvirDocumento = false,
  faces = 6,
}) => {
  const cenaRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const ociosoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pessoaAtivaRef = useRef(false);
  const simPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const simAlvoRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const simRafRef = useRef<number | null>(null);
  // `prefers-reduced-motion` lido uma vez por mount (regra do portal).
  const semMovimentoRef = useRef(false);

  useEffect(() => {
    semMovimentoRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const colGap =
    typeof espacamento === "number"
      ? `${espacamento}px`
      : espacamento?.coluna !== undefined
        ? `${espacamento.coluna}px`
        : "5%";
  const rowGap =
    typeof espacamento === "number"
      ? `${espacamento}px`
      : espacamento?.linha !== undefined
        ? `${espacamento.linha}px`
        : "5%";

  const entrarSair = duracao.entrar;
  const sairSair = duracao.sair;

  /**
   * Inclina os cubos em direção ao ponto (linha/coluna centrais, em unidades
   * de célula): dentro do `raio` viram até `anguloMax`; fora, voltam ao repouso.
   * No motion reduzido é um no-op — a grade fica parada.
   */
  const tiltAt = useCallback(
    (linhaCentro: number, colCentro: number) => {
      if (semMovimentoRef.current || !cenaRef.current) return;
      cenaRef.current.querySelectorAll<HTMLDivElement>(".cp-cubo").forEach((cubo) => {
        const r = +(cubo.dataset.row ?? 0);
        const c = +(cubo.dataset.col ?? 0);
        const dist = Math.hypot(r - linhaCentro, c - colCentro);
        const angulo = dist <= raio ? (1 - dist / raio) * anguloMax : 0;
        // PULA o cubo que já está no alvo. Antes, TODO movimento de ponteiro
        // disparava um tween por cubo — inclusive para "voltar ao repouso" de
        // quem já estava parado — e era esse o custo que pesava no fundo do
        // site (medido 06/10/2026). O ângulo vai no `dataset` para comparar
        // sem guardar estado por cubo em React.
        const chave = angulo.toFixed(1);
        if (cubo.dataset.angulo === chave) return;
        cubo.dataset.angulo = chave;
        gsap.to(cubo, {
          duration: angulo === 0 ? sairSair : entrarSair,
          ease: angulo === 0 ? "power3.out" : curva,
          overwrite: true,
          rotateX: -angulo,
          rotateY: angulo,
        });
      });
    },
    [raio, anguloMax, entrarSair, sairSair, curva],
  );

  const aoMover = useCallback(
    (e: PointerEvent) => {
      if (semMovimentoRef.current || !cenaRef.current) return;
      pessoaAtivaRef.current = true;
      if (ociosoRef.current) clearTimeout(ociosoRef.current);

      const rect = cenaRef.current.getBoundingClientRect();
      const celW = rect.width / grade;
      const celH = rect.height / grade;
      const colCentro = (e.clientX - rect.left) / celW;
      const linhaCentro = (e.clientY - rect.top) / celH;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => tiltAt(linhaCentro, colCentro));

      ociosoRef.current = setTimeout(() => {
        pessoaAtivaRef.current = false;
      }, 3000);
    },
    [grade, tiltAt],
  );

  const voltarRepouso = useCallback(() => {
    if (semMovimentoRef.current || !cenaRef.current) return;
    cenaRef.current.querySelectorAll<HTMLDivElement>(".cp-cubo").forEach((cubo) => {
      // Marca o alvo atingido: sem isto, o próximo movimento de ponteiro
      // acharia que ainda havia de onde sair e repetiria o tween.
      cubo.dataset.angulo = "0.0";
      gsap.to(cubo, {
        duration: sairSair,
        rotateX: 0,
        rotateY: 0,
        ease: "power3.out",
      });
    });
  }, [sairSair]);

  const aoTocarMover = useCallback(
    (e: TouchEvent) => {
      if (semMovimentoRef.current || !cenaRef.current) return;
      e.preventDefault();
      pessoaAtivaRef.current = true;
      if (ociosoRef.current) clearTimeout(ociosoRef.current);

      const rect = cenaRef.current.getBoundingClientRect();
      const celW = rect.width / grade;
      const celH = rect.height / grade;

      const toque = e.touches[0];
      const colCentro = (toque.clientX - rect.left) / celW;
      const linhaCentro = (toque.clientY - rect.top) / celH;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => tiltAt(linhaCentro, colCentro));

      ociosoRef.current = setTimeout(() => {
        pessoaAtivaRef.current = false;
      }, 3000);
    },
    [grade, tiltAt],
  );

  const aoTocarIniciar = useCallback(() => {
    pessoaAtivaRef.current = true;
  }, []);

  const aoTocarTerminar = useCallback(() => {
    voltarRepouso();
  }, [voltarRepouso]);

  /**
   * Onda no clique: agrupa os cubos por distância ao ponto de impacto
   * (anel a anel) e pinta os anéis com atraso — a cor avança como onda na
   * água e volta para `corFace` depois de um tempo.
   */
  const aoClicar = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (semMovimentoRef.current || !ondulacaoNoClique || !cenaRef.current) return;
      const rect = cenaRef.current.getBoundingClientRect();
      const celW = rect.width / grade;
      const celH = rect.height / grade;

      const clienteX =
        (e as MouseEvent).clientX ||
        ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientX);
      const clienteY =
        (e as MouseEvent).clientY ||
        ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientY);

      const colAcerto = Math.floor((clienteX - rect.left) / celW);
      const linhaAcerto = Math.floor((clienteY - rect.top) / celH);

      const atrasoAnel = 0.15;
      const durAnim = 0.3;
      const segurar = 0.6;

      const espalhar = atrasoAnel / velocidadeOndulacao;
      const duracaoAnim = durAnim / velocidadeOndulacao;
      const tempoSegurar = segurar / velocidadeOndulacao;

      const aneis: Record<number, HTMLDivElement[]> = {};
      cenaRef.current.querySelectorAll<HTMLDivElement>(".cp-cubo").forEach((cubo) => {
        const r = +(cubo.dataset.row ?? 0);
        const c = +(cubo.dataset.col ?? 0);
        const dist = Math.hypot(r - linhaAcerto, c - colAcerto);
        const anel = Math.round(dist);
        if (!aneis[anel]) aneis[anel] = [];
        aneis[anel].push(cubo);
      });

      Object.keys(aneis)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((anel) => {
          const atraso = anel * espalhar;
          const faces = aneis[anel].flatMap((cubo) =>
            Array.from(cubo.querySelectorAll<HTMLElement>(".cp-cubo-face")),
          );

          gsap.to(faces, {
            backgroundColor: corOndulacao,
            duration: duracaoAnim,
            delay: atraso,
            ease: "power3.out",
          });
          gsap.to(faces, {
            backgroundColor: corFace,
            duration: duracaoAnim,
            delay: atraso + duracaoAnim + tempoSegurar,
            ease: "power3.out",
          });
        });
    },
    [ondulacaoNoClique, grade, corFace, corOndulacao, velocidadeOndulacao],
  );

  // "Vida própria": enquanto ninguém mexe, um ponto-fantasma passeia pela
  // grade e vai inclinando os cubos por caminho — a grade parece viva.
  useEffect(() => {
    if (semMovimentoRef.current || !animarSozinho || !cenaRef.current) return;
    simPosRef.current = { x: Math.random() * grade, y: Math.random() * grade };
    simAlvoRef.current = { x: Math.random() * grade, y: Math.random() * grade };
    const velocidade = 0.02;
    const loop = () => {
      if (!pessoaAtivaRef.current) {
        const pos = simPosRef.current;
        const alvo = simAlvoRef.current;
        pos.x += (alvo.x - pos.x) * velocidade;
        pos.y += (alvo.y - pos.y) * velocidade;
        tiltAt(pos.y, pos.x);
        if (Math.hypot(pos.x - alvo.x, pos.y - alvo.y) < 0.1) {
          simAlvoRef.current = { x: Math.random() * grade, y: Math.random() * grade };
        }
      }
      simRafRef.current = requestAnimationFrame(loop);
    };
    simRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (simRafRef.current != null) cancelAnimationFrame(simRafRef.current);
    };
  }, [animarSozinho, grade, tiltAt]);

  useEffect(() => {
    const el = cenaRef.current;
    if (!el) return;

    if (ouvirDocumento) {
      // Modo FUNDO: a camada é `pointer-events: none`, então o ponteiro é
      // lido no documento e mapeado pela caixa da cena. Toque fica de fora
      // de propósito (ver o comentário da prop).
      const aoMoverDoc = (e: Event) => aoMover(e as PointerEvent);
      const aoClicarDoc = (e: Event) => aoClicar(e as MouseEvent);
      document.addEventListener("pointermove", aoMoverDoc, { passive: true });
      document.addEventListener("click", aoClicarDoc);
      return () => {
        document.removeEventListener("pointermove", aoMoverDoc);
        document.removeEventListener("click", aoClicarDoc);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        if (ociosoRef.current) clearTimeout(ociosoRef.current);
      };
    }

    el.addEventListener("pointermove", aoMover);
    el.addEventListener("pointerleave", voltarRepouso);
    el.addEventListener("click", aoClicar);
    el.addEventListener("touchmove", aoTocarMover, { passive: false });
    el.addEventListener("touchstart", aoTocarIniciar, { passive: true });
    el.addEventListener("touchend", aoTocarTerminar, { passive: true });

    return () => {
      el.removeEventListener("pointermove", aoMover);
      el.removeEventListener("pointerleave", voltarRepouso);
      el.removeEventListener("click", aoClicar);
      el.removeEventListener("touchmove", aoTocarMover);
      el.removeEventListener("touchstart", aoTocarIniciar);
      el.removeEventListener("touchend", aoTocarTerminar);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (ociosoRef.current) clearTimeout(ociosoRef.current);
    };
  }, [
    ouvirDocumento,
    aoMover,
    voltarRepouso,
    aoClicar,
    aoTocarMover,
    aoTocarIniciar,
    aoTocarTerminar,
  ]);

  const celulas = Array.from({ length: grade });
  // Quais faces cada cubo monta. Três bastam no fundo de site (é translúcido e
  // a economia é metade do DOM, que pesa porque a grade vive em TODA página).
  const nomesFaces =
    faces === 3
      ? (["topo", "esquerda", "frente"] as const)
      : (["topo", "baixo", "esquerda", "direita", "frente", "tras"] as const);
  const estiloCena: React.CSSProperties = {
    gridTemplateColumns: tamanhoCubo
      ? `repeat(${grade}, ${tamanhoCubo}px)`
      : `repeat(${grade}, 1fr)`,
    gridTemplateRows: tamanhoCubo
      ? `repeat(${grade}, ${tamanhoCubo}px)`
      : `repeat(${grade}, 1fr)`,
    columnGap: colGap,
    rowGap,
  };
  const estiloEnvoltorio = {
    ...(largura !== undefined
      ? { width: typeof largura === "number" ? `${largura}px` : largura }
      : {}),
    "--cp-cubo-face-borda": borda,
    "--cp-cubo-face-fundo": corFace,
    "--cp-cubo-face-sombra":
      sombra === true ? "0 0 6px rgba(0,0,0,.5)" : sombra || "none",
    ...(tamanhoCubo
      ? { width: `${grade * tamanhoCubo}px`, height: `${grade * tamanhoCubo}px` }
      : {}),
  } as React.CSSProperties;

  return (
    <div className="cp-cubos" style={estiloEnvoltorio}>
      <div ref={cenaRef} className="cp-cubos--cena" style={estiloCena}>
        {celulas.map((_, r) =>
          celulas.map((__, c) => (
            <div key={`${r}-${c}`} className="cp-cubo" data-row={r} data-col={c}>
              {nomesFaces.map((face) => (
                <div key={face} className={`cp-cubo-face cp-cubo-face--${face}`} />
              ))}
            </div>
          )),
        )}
      </div>
    </div>
  );
};

export default Cubes;
