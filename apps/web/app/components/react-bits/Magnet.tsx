"use client";

/**
 * Magnet — o conteúdo "gruda" no cursor: começa a puxar quando o ponteiro se
 * aproxima (mesmo antes de entrar no elemento) e volta suave ao sair.
 *
 * Origem: React Bits "Magnet" (licença MIT), fonte recebida pelo dono em
 * 06/10/2026. Papel no portal: dar vida aos botões pequenos dentro dos
 * cartões dos 4 eixos (pedido do dono, mesma data).
 *
 * ═══ POR QUE NÃO É O ORIGINAL PONTO A PONTO ═══
 *
 * O original pendura um `mousemove` em `window` POR INSTÂNCIA e guarda a
 * posição em `useState` — ou seja, cada movimento do ponteiro re-renderiza
 * TODOS os magnets da página. Nos eixos são dezenas de botões; dezenas de
 * listeners e dezenas de re-renders por pixel travariam a rolagem.
 *
 * Aqui:
 * 1. UM listener global (`document.pointermove`) alimenta um registro de
 *    instâncias — custo fixo, não cresce com o número de botões;
 * 2. o deslocamento é escrito DIRETO no `transform` do elemento, sem
 *    `setState` (60 fps sem re-render, como já faz o `SpotlightCard`);
 * 3. só escreve quando muda de verdade (> 0,5 px) — evita mexer no estilo de
 *    40 elementos a cada quadro;
 * 4. o trabalho roda em `requestAnimationFrame`, então rajada de eventos de
 *    ponteiro não vira rajada de cálculo.
 *
 * Guardas: só ponteiro fino de mouse, e desligado em `prefers-reduced-motion`
 * e no tema de alto contraste (`useEfeitoPermitido`).
 */
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useEfeitoPermitido } from "./useEfeitoPermitido";

export interface MagnetProps {
  children: ReactNode;
  /**
   * Fração da distância do cursor ao centro que vira deslocamento (0–1).
   * Padrão 0,25: some "de leve", sem empurrar leitura. (O original chama
   * `magnetStrength`, um DIVISOR — aqui o valor é o inverso, mais intuitivo.)
   */
  forca?: number;
  /** Distância (px) além do elemento em que o ímã começa a puxar. Padrão 48. */
  afastamento?: number;
  /** Classes do invólucro externo (posicionamento no layout de quem usa). */
  className?: string;
  /** Classes do elemento interno, o que de fato se move. */
  classesInternas?: string;
  /** Transição quando o ímã está ativo. */
  transicaoAtiva?: string;
  /** Transição quando o ímã solta. */
  transicaoInativa?: string;
}

/** Uma instância registrada no listener global. */
interface Instancia {
  el: HTMLElement;
  forca: number;
  afastamento: number;
  ativo: boolean;
  ultX: number;
  ultY: number;
  transicaoAtiva: string;
  transicaoInativa: string;
}

/**
 * Registro compartilhado por TODOS os magnets da página. O listener global
 * nasce na primeira instância e morre na última — nenhuma página fica com
 * listener órfão.
 */
const instancias = new Set<Instancia>();
let ouvindo = false;
let ponteiro: { x: number; y: number } | null = null;
let quadro = 0;

/** Um quadro: avalia todas as instâncias e escreve só o que mudou. */
function passo() {
  quadro = 0;
  const p = ponteiro;
  if (!p) return;
  for (const i of instancias) {
    const r = i.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const perto =
      Math.abs(cx - p.x) < r.width / 2 + i.afastamento &&
      Math.abs(cy - p.y) < r.height / 2 + i.afastamento;
    if (perto) {
      const deslocX = (p.x - cx) * i.forca;
      const deslocY = (p.y - cy) * i.forca;
      if (!i.ativo) {
        i.ativo = true;
        i.el.style.transition = i.transicaoAtiva;
      }
      if (Math.abs(deslocX - i.ultX) > 0.5 || Math.abs(deslocY - i.ultY) > 0.5) {
        i.ultX = deslocX;
        i.ultY = deslocY;
        i.el.style.transform = `translate3d(${deslocX.toFixed(2)}px, ${deslocY.toFixed(2)}px, 0)`;
      }
    } else if (i.ativo) {
      i.ativo = false;
      i.ultX = 0;
      i.ultY = 0;
      i.el.style.transition = i.transicaoInativa;
      i.el.style.transform = "translate3d(0, 0, 0)";
    }
  }
}

function aoMover(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  ponteiro = { x: e.clientX, y: e.clientY };
  if (!quadro) quadro = requestAnimationFrame(passo);
}

function aoSair() {
  ponteiro = null;
  for (const i of instancias) {
    if (!i.ativo) continue;
    i.ativo = false;
    i.ultX = 0;
    i.ultY = 0;
    i.el.style.transition = i.transicaoInativa;
    i.el.style.transform = "translate3d(0, 0, 0)";
  }
}

/** Liga uma instância ao listener global; devolve o desligamento. */
function registrar(i: Instancia): () => void {
  instancias.add(i);
  if (!ouvindo) {
    document.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("pointerleave", aoSair);
    window.addEventListener("blur", aoSair);
    ouvindo = true;
  }
  return () => {
    instancias.delete(i);
    i.el.style.transform = "";
    i.el.style.transition = "";
    if (instancias.size === 0 && ouvindo) {
      document.removeEventListener("pointermove", aoMover);
      document.removeEventListener("pointerleave", aoSair);
      window.removeEventListener("blur", aoSair);
      if (quadro) cancelAnimationFrame(quadro);
      quadro = 0;
      ponteiro = null;
      ouvindo = false;
    }
  };
}

/** Opções do ímã — usadas pelo componente e por quem chama o hook direto. */
export interface OpcoesMagnet {
  /** Fração da distância do cursor ao centro que vira deslocamento. Padrão 0,25. */
  forca?: number;
  /** Distância (px) além do elemento em que o ímã começa a puxar. Padrão 48. */
  afastamento?: number;
  /** `false` desliga o ímã sem desmontar o elemento. Padrão `true`. */
  ativo?: boolean;
  transicaoAtiva?: string;
  transicaoInativa?: string;
}

/**
 * Liga o ímã a um elemento JÁ EXISTENTE, sem criar invólucro.
 *
 * Existe porque, nos eixos (componentes de servidor), o botão já tem as
 * classes do link — embrulhar mudaria o layout. Com o hook, um componente de
 * cliente pode montar o botão e ligar o ímã no próprio elemento.
 *
 * @param ref Referência do elemento que deve se mover.
 * @param opcoes Força, afastamento e transições.
 */
export function useMagnet(
  ref: RefObject<HTMLElement | null>,
  {
    forca = 0.25,
    afastamento = 48,
    ativo = true,
    transicaoAtiva = "transform 0.3s ease-out",
    transicaoInativa = "transform 0.5s ease-in-out",
  }: OpcoesMagnet = {},
): void {
  const permitido = useEfeitoPermitido(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !permitido || !ativo) return;
    return registrar({
      el,
      forca,
      afastamento,
      ativo: false,
      ultX: 0,
      ultY: 0,
      transicaoAtiva,
      transicaoInativa,
    });
  }, [ref, permitido, ativo, forca, afastamento, transicaoAtiva, transicaoInativa]);
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  forca = 0.25,
  afastamento = 48,
  className = "",
  classesInternas = "",
  transicaoAtiva = "transform 0.3s ease-out",
  transicaoInativa = "transform 0.5s ease-in-out",
}) => {
  const internoRef = useRef<HTMLDivElement | null>(null);
  useMagnet(internoRef, {
    forca,
    afastamento,
    transicaoAtiva,
    transicaoInativa,
  });

  return (
    <div className={className} style={{ position: "relative" }}>
      <div
        ref={internoRef}
        className={classesInternas}
        style={{ willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
