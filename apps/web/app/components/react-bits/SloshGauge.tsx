"use client";

/**
 * Medidor de nível com líquido agitado (Slosh Gauge) — volume da rádio.
 *
 * Origem: React Bits, componente "Slosh Gauge"
 * (https://reactbits.dev/c/micro/slosh-gauge), licença MIT + Commons Clause,
 * copiado em 06/10/2026.
 *
 * Por que existe: o dono pediu (06/10/2026) que a barra de volume da rádio
 * ficasse À DIREITA do painel com "essa animação" — a bolha de líquido que
 * ondula ao mudar de nível, como um tanque de verdade. O `<input range>`
 * anterior era uma linha fina no cabeçalho e, com o painel abrindo para
 * cima, ela sumia atrás da navbar (TopNav `z-50` > grupo do rádio `z-[45]`).
 * O medidor vertical na coluna da direita tira o volume do topo do painel —
 * a linha de cima volta a ser só o cabeçalho.
 *
 * Adaptações ao portal:
 * 1. props renomeadas para português (padrão dos vendoriados: `valor`,
 *    `aoMudar`, `interativo`, `corLiquido`...);
 * 2. classes CSS prefixadas com `cp-slosh-` (arquivo `SloshGauge.css`) —
 *    nada no portal carrega nome genérico de biblioteca;
 * 3. cores vêm dos tokens do tema (`var(--cp-primary)`, `var(--cp-surface-2)`)
 *    — a troca de tema repinta o medidor sem código por tema;
 * 4. `prefers-reduced-motion` é respeitado pelo próprio componente (o
 *    upstream já desliga inclinação e salpicos; mantivemos) — no portal a
 *    régua é ainda mais dura: a página de alto contraste nem monta o
 *    medidor (ver `PlayerRadio.tsx`);
 * 5. acessibilidade preservada: `role="slider"`, teclado (setas/Home/End,
 *    Shift = passo grande), `aria-valuenow` — substitui o antigo
 *    `<input type="range">` sem perder nada.
 *
 * Física (por que ondula): um amortecedor-simples mira o nível alvo
 * (`L`) e a simulação (`x`) chega atrasada, com mola e atrito — a
 * inclinação da superfície é proporcional à velocidade (`tilt * v`), e o
 * rebote nas bordas (`splash`) devolve energia. É a mesma matemática de
 * um balde d'água puxado de um lado para o outro.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import "./SloshGauge.css";

/** Props públicas do medidor (nomes em português, padrão do portal). */
export interface MedidorLiquidoProps {
  /** Nível de 0 a 100 (controlado). Ausente, vira não controlado. */
  valor?: number;
  /** Nível inicial de 0 a 100 quando `valor` não é passado. */
  padrao?: number;
  /** Chamado a cada mudança de nível, com 0 a 100 arredondado. */
  aoMudar?: (valor: number) => void;
  /** true = arrastar/teclado mudam o nível; false = só mostra. */
  interativo?: boolean;
  /** Mostra o número dentro do líquido. Padrão true. */
  mostrarValor?: boolean;
  /** Desabilita interação e apaga o medidor. */
  desabilitado?: boolean;
  /** Cor do líquido (aceita token `var(--cp-*)`). */
  corLiquido?: string;
  /** Cor do vidro/vazio atrás do líquido. */
  corVidro?: string;
  largura?: number;
  altura?: number;
  raio?: number;
  /** Traços de escala na lateral direita (0 desliga). */
  marcas?: number;
  /** 0 a 1 — quanto o líquido resiste em seguir a mola. */
  viscosidade?: number;
  /** 0 a 1 — quão forte a superfície inclina com a velocidade. */
  inclinacao?: number;
  /** 0 a 1 — quanta energia volta nas bordas (salpico). */
  salpicos?: number;
  /** Sufixo do valor (padrão "%"). */
  unidade?: string;
  rotuloAria?: string;
  className?: string;
}

/** Estado interno da simulação do líquido. */
interface Simulacao {
  x: number; // posição atual (0..100)
  v: number; // velocidade
  L: number; // nível alvo
  raf: number; // id do requestAnimationFrame
  ultimo: number; // timestamp do último passo
}

/** Estado de um arraste em andamento (pointer capture). */
interface Pegada {
  id: number;
  retangulo: DOMRect;
  escala: number;
  faixa: boolean; // clique começou perto da marca?
  agarre: number | null; // deslocamento entre nível e clique
  inicio: number; // nível no início do arraste (para Escape)
  enviado: number; // último valor reposto ao pai
}

/** Leitura viva das props dentro dos callbacks estáveis. */
interface Vivo {
  viscosidade: number;
  inclinacao: number;
  salpicos: number;
  largura: number;
  altura: number;
  valor: number | undefined;
  aoMudar: ((valor: number) => void) | undefined;
  unidade: string;
}

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const H = 1 / 120; // passo fixo de integração (s)
const DT_MAX = 0.05; // teto do delta real (evita explosão com aba em segundo plano)
const GANHO_INCLINACAO = 0.07;
const INCLINACAO_MAX = 30; // graus
const REPOUSO_POS = 0.05;
const REPOUSO_VEL = 2;
const PASSO = 2; // tecla comum: 2%
const GRANDE = 10; // Shift + tecla: 10%
const FAIXA = 10; // px de tolerância para "pegar" a marca

/**
 * Decide texto claro/escuro sobre o líquido (regra dos 150 de luminância).
 * O portal passa `var(--cp-primary)`, que não é hex: aí devolvemos branco —
 * a primária do tema é escura o bastante em todos os 8 temas.
 */
const corSobre = (cor: string) => {
  const bruto = cor.replace("#", "");
  const completo = bruto.length === 3 ? [...bruto].map((c) => c + c).join("") : bruto;
  const n = parseInt(completo, 16);
  if (Number.isNaN(n)) return "#ffffff";
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 >= 150
    ? "#111111"
    : "#ffffff";
};

const MedidorLiquido: React.FC<MedidorLiquidoProps> = ({
  valor,
  padrao = 60,
  aoMudar,
  interativo = false,
  mostrarValor = true,
  desabilitado = false,
  corLiquido = "#f5f5f5",
  corVidro = "#27272a",
  largura = 88,
  altura = 180,
  raio = 20,
  marcas = 4,
  viscosidade = 0.15,
  inclinacao = 0.45,
  salpicos = 0.42,
  unidade = "%",
  rotuloAria = "Volume",
  className = "",
}) => {
  const raiz = useRef<HTMLDivElement>(null);
  const liquido = useRef<HTMLDivElement>(null);
  const marca = useRef<HTMLDivElement>(null);
  const textoA = useRef<HTMLSpanElement>(null);
  const textoB = useRef<HTMLSpanElement>(null);
  const inicio = limitar(valor ?? padrao, 0, 100);
  const sim = useRef<Simulacao>({ x: inicio, v: 0, L: inicio, raf: 0, ultimo: 0 });
  const pegada = useRef<Pegada | null>(null);
  const reduzido = useRef(false);
  const [segurado, setSegurado] = useState(false);
  // Leitura "viva" das props dentro dos callbacks (rAF/handlers) sem
  // recriá-los a cada render. O ref NASCE com os valores atuais e é
  // re-sincronizado logo abaixo, após o commit — a regra
  // `react-hooks/refs` proíbe escrever `ref.current` durante o render, e
  // callbacks rodam depois do commit, então nunca leem valor velho.
  const vivo = useRef<Vivo>({
    viscosidade,
    inclinacao,
    salpicos,
    largura,
    altura,
    valor,
    aoMudar,
    unidade,
  });
  useEffect(() => {
    vivo.current = {
      viscosidade,
      inclinacao,
      salpicos,
      largura,
      altura,
      valor,
      aoMudar,
      unidade,
    };
  });

  /** Desenha o quadro atual: recorte do líquido e posição da marca. */
  const pintar = () => {
    const { x, v, L } = sim.current;
    const { inclinacao: t, largura: W, altura: Hh } = vivo.current;
    const th = reduzido.current ? 0 : limitar(t * v * GANHO_INCLINACAO, -INCLINACAO_MAX, INCLINACAO_MAX);
    const inclinar = (Math.tan((th * Math.PI) / 180) * W) / 2;
    const topo = 100 - x;
    if (liquido.current) {
      liquido.current.style.clipPath = `polygon(0 calc(${topo}% + ${inclinar}px), 100% calc(${topo}% - ${inclinar}px), 100% 100%, 0 100%)`;
    }
    if (marca.current) marca.current.style.transform = `translateY(${((100 - L) * Hh) / 100}px)`;
  };

  /** Mantém o valor acessível (ARIA) e os dois textos em dia. */
  const anunciar = () => {
    const n = Math.round(sim.current.L);
    const s = `${n}${vivo.current.unidade}`;
    raiz.current?.setAttribute("aria-valuenow", String(n));
    if (textoA.current) textoA.current.textContent = s;
    if (textoB.current) textoB.current.textContent = s;
  };

  /**
   * Um passo da simulação: mola-amortecida mirando no alvo.
   * Integrador sub-passos (H) para não divergir com deltas grandes;
   * com `prefers-reduced-motion` o atrito vira 1 e o líquido SEMPRE
   * acompanha o alvo sem ondular.
   */
  const bater = (agora: number) => {
    const s = sim.current;
    const { viscosidade: vis, salpicos: dar } = vivo.current;
    const dt = s.ultimo ? Math.min((agora - s.ultimo) / 1000, DT_MAX) : H;
    s.ultimo = agora;
    if (vis <= 0) {
      s.x = s.L;
      s.v = 0;
    } else {
      const k = 1224 - 1044 * vis;
      const zeta = reduzido.current ? 1 : 0.26 - 0.17 * vis;
      const c = 2 * zeta * Math.sqrt(k);
      const repouso = reduzido.current ? 0 : dar;
      for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {
        s.v = s.v * Math.exp(-c * h) + k * (s.L - s.x) * h;
        s.x += s.v * h;
        if (s.x > 100) {
          s.x = 100;
          s.v = -s.v * repouso;
        } else if (s.x < 0) {
          s.x = 0;
          s.v = -s.v * repouso;
        }
      }
      if (!pegada.current && Math.abs(s.L - s.x) < REPOUSO_POS && Math.abs(s.v) < REPOUSO_VEL) {
        s.x = s.L;
        s.v = 0;
      }
    }
    pintar();
    const estacionado = !pegada.current && s.x === s.L && s.v === 0;
    if (estacionado) {
      s.raf = 0;
      s.ultimo = 0;
    } else {
      s.raf = requestAnimationFrame(bater);
    }
  };
  /** Acorda o laço de animação (adormece sozinho no repouso). */
  const acordar = () => {
    if (!sim.current.raf) sim.current.raf = requestAnimationFrame(bater);
  };
  /** Muda o nível alvo. `instantaneo` pula a ondulação (teclado). */
  const definirNivel = (L: number, instantaneo?: boolean) => {
    const s = sim.current;
    s.L = limitar(L, 0, 100);
    if (instantaneo) {
      s.x = s.L;
      s.v = 0;
    }
    anunciar();
    // Pinta já: o número e o nível não podem divergir nem por um quadro,
    // mesmo no caminho `instantaneo` (teclado) em que o laço se encerra.
    pintar();
    acordar();
  };

  // Valor controlado: o pai é a fonte da verdade (espelha no <audio>).
  useLayoutEffect(() => {
    if (valor === undefined) return;
    if (pegada.current && Math.round(sim.current.L) === valor) return;
    definirNivel(valor, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  // `prefers-reduced-motion` é lei (AGENTS): liga/desliga a ondulação ao vivo.
  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sincronizar = () => {
      reduzido.current = mq.matches;
    };
    sincronizar();
    mq.addEventListener("change", sincronizar);
    anunciar();
    pintar();
    // Reaquece o laço no mount. No StrictMode do dev o React monta,
    // desmonta e monta de novo: o cleanup abaixo zera o `raf`, e sem este
    // `acordar()` o líquido ficaria congelado no primeiro quadro — foi o
    // bug medido em 06/10/2026 (número mudava, o nível não).
    acordar();
    const s = sim.current;
    return () => {
      mq.removeEventListener("change", sincronizar);
      cancelAnimationFrame(s.raf);
      // Sem zerar, o id já cancelado continua "verdadeiro" e o próximo
      // `acordar()` acha que há um laço vivo — e nunca agenda outro.
      s.raf = 0;
    };
    // `acordar`/`pintar`/`anunciar` são recriados a cada render: pendurá-los
    // aqui desligaria e religaria o efeito a toda mudança de prop. O efeito
    // é de montagem — mesma razão do `[valor]` acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pintar();
  }, [largura, altura, inclinacao, mostrarValor, interativo, desabilitado]);

  /** Nível (0..100) correspondente a um Y da tela, respeitando escala. */
  const nivelEm = (clientY: number, g: Pegada) =>
    limitar(
      ((g.retangulo.bottom - clientY) / g.escala / (raiz.current?.offsetHeight || g.retangulo.height)) * 100,
      0,
      100,
    );
  /** Só notifica o pai quando o número inteiro mudou (menos renders). */
  const reportar = () => {
    const g = pegada.current;
    const n = Math.round(sim.current.L);
    if (g && n !== g.enviado) {
      g.enviado = n;
      vivo.current.aoMudar?.(n);
    }
  };

  const pressionar = (e: PointerEvent<HTMLDivElement>) => {
    if (!interativo || desabilitado || pegada.current || e.button !== 0) return;
    const el = raiz.current;
    if (!el) return;
    const retangulo = el.getBoundingClientRect();
    const escala = retangulo.height / (el.offsetHeight || retangulo.height) || 1;
    const yMarca = retangulo.top + ((100 - sim.current.L) / 100) * retangulo.height;
    const g: Pegada = {
      id: e.pointerId,
      retangulo,
      escala,
      faixa: Math.abs(e.clientY - yMarca) <= FAIXA * escala,
      agarre: null,
      inicio: sim.current.L,
      enviado: NaN,
    };
    pegada.current = g;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture é melhor esforço */
    }
    setSegurado(true);
    if (g.faixa) {
      acordar();
    } else {
      definirNivel(nivelEm(e.clientY, g));
      reportar();
    }
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const g = pegada.current;
    if (!g || g.id !== e.pointerId) return;
    const em = nivelEm(e.clientY, g);
    if (g.faixa && g.agarre === null) {
      // Pegou na marca: guarda o deslocamento para não "pular" o nível.
      g.agarre = sim.current.L - em;
      return;
    }
    definirNivel(em + (g.agarre ?? 0));
    reportar();
  };
  const soltar = (e: { pointerId: number }, motivo?: "cancelar" | "escape") => {
    const g = pegada.current;
    if (!g || g.id !== e.pointerId) return;
    pegada.current = null;
    try {
      raiz.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* idem */
    }
    setSegurado(false);
    if (motivo === "escape") {
      definirNivel(g.inicio);
      vivo.current.aoMudar?.(Math.round(g.inicio));
    } else if (vivo.current.valor !== undefined && Math.round(sim.current.L) !== vivo.current.valor) {
      definirNivel(vivo.current.valor);
    }
    acordar();
  };
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interativo || desabilitado) return;
    if (e.key === "Escape") {
      if (pegada.current) soltar({ pointerId: pegada.current.id }, "escape");
      return;
    }
    const L = sim.current.L;
    const d = e.shiftKey ? GRANDE : PASSO;
    const proximo: number | undefined = (
      {
        ArrowUp: L + d,
        ArrowRight: L + d,
        ArrowDown: L - d,
        ArrowLeft: L - d,
        PageUp: L + GRANDE,
        PageDown: L - GRANDE,
        Home: 0,
        End: 100,
      } as Record<string, number>
    )[e.key];
    if (proximo === undefined) return;
    e.preventDefault();
    definirNivel(proximo, true);
    vivo.current.aoMudar?.(Math.round(proximo));
  };

  const r = Math.min(raio, largura / 2, altura / 2);
  const rotulo = `${Math.round(inicio)}${unidade}`;

  return (
    <div
      ref={raiz}
      className={`cp-slosh ${className}`}
      role={interativo ? "slider" : "meter"}
      tabIndex={interativo && !desabilitado ? 0 : undefined}
      aria-label={rotuloAria}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(inicio)}
      aria-orientation={interativo ? "vertical" : undefined}
      aria-disabled={desabilitado || undefined}
      data-interactive={interativo ? "true" : "false"}
      data-held={segurado ? "true" : "false"}
      data-disabled={desabilitado ? "true" : "false"}
      style={
        {
          "--sg-w": `${largura}px`,
          "--sg-h": `${altura}px`,
          "--sg-r": `${r}px`,
          "--sg-glass": corVidro,
          "--sg-liquid": corLiquido,
          "--sg-on-liquid": corSobre(corLiquido),
          "--sg-ticks": marcas,
          "--sg-font": `${limitar(Math.round(largura * 0.16), 12, 20)}px`,
        } as CSSProperties
      }
      onPointerDown={pressionar}
      onPointerMove={mover}
      onPointerUp={(e) => soltar(e)}
      onPointerCancel={(e) => soltar(e, "cancelar")}
      onLostPointerCapture={(e) => soltar(e, "cancelar")}
      onKeyDown={tecla}
    >
      {mostrarValor ? (
        <span ref={textoA} className="cp-slosh__valor" aria-hidden="true">
          {rotulo}
        </span>
      ) : null}
      <div ref={liquido} className="cp-slosh__liquido" aria-hidden="true">
        {mostrarValor ? (
          <span ref={textoB} className="cp-slosh__valor">
            {rotulo}
          </span>
        ) : null}
      </div>
      {marcas > 0 ? <div className="cp-slosh__marcas" aria-hidden="true" /> : null}
      {interativo && !desabilitado ? (
        <div ref={marca} className="cp-slosh__marca" aria-hidden="true" />
      ) : null}
    </div>
  );
};

export default MedidorLiquido;
