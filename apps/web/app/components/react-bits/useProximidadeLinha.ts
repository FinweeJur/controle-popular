/**
 * @file useProximidadeLinha.ts
 * @description Efeito de proximidade em listas — derivado do componente
 * "Line Sidebar" do React Bits (https://reactbits.dev/backgrounds/line-sidebar,
 * licença MIT + Commons Clause), copiado em 06/10/2026.
 *
 * Papel no portal: pedido do dono (06/10/2026) para aplicar o "efeito
 * LineSidebar" na lista de rádios do `PlayerRadio.tsx` e na lista de
 * companheiros do `CompanheiroFlutuante.tsx`. O item mais próximo do ponteiro
 * ganha uma barra de acento à esquerda e desliza alguns pixels para a direita
 * — o olho segue o mouse sem precisar de clique.
 *
 * Adaptações deliberadas (por quê entre parênteses):
 * - virou HOOK em vez de componente: as duas listas já existem, com botões,
 *   logos e checkboxes próprios — reescrever como `<LineSidebar items[]>`
 *   destruiria a riqueza atual só para ganhar o brilho (linhas de string
 *   não servem para estação de rádio nem para pet);
 * - o motor é o mesmo: `--cp-prox` (0..1) por item, escrito quadro a quadro
 *   com suavização exponencial independente de taxa de quadros — cor e
 *   deslocamento leem a MESMA variável e andam juntos, sem `transition`
 *   de CSS para defasar;
 * - o contêiner chega por REF e é resolvido preguiçosamente dentro do
 *   quadro: as duas listas montam e desmontam (painel abre no hover, menu
 *   abre no clique) e um listener preso num elemento condicional morreria
 *   junto com ele;
 * - ouve `pointermove` no DOCUMENTO (não no contêiner): o alvo pode nascer
 *   depois do efeito, e sair do contêiner zera os alvos em vez de deixar
 *   o último item aceso;
 * - `prefers-reduced-motion` e ponteiro sem hover (toque) desligam o efeito
 *   na raiz: sem JS, `--cp-prox` fica 0 e nada aparece (regra de contraste
 *   do portal: efeito decorativo nunca é informação).
 *
 * Itens entram na lista com o atributo `data-cp-prox`; o CSS derivado
 * (`react-bits.css`) lê a variável.
 */
import { useEffect, useRef, type RefObject } from "react";

/** Opções do efeito (todas com padrão do original). */
export interface OpcoesProximidadeLista {
  /** Distância (px) em que o item começa a reagir. Padrão 100. */
  raio?: number;
  /** Suavização em ms (menor = mais travado). Padrão 100. */
  suavizacao?: number;
  /** Forma da queda de força com a distância. Padrão `"suave"`. */
  queda?: "linear" | "suave" | "forte";
}

/** Curvas de queda (mesmas do original): puro, sem DOM. */
const CURVAS = {
  linear: (p: number) => p,
  suave: (p: number) => p * p * (3 - 2 * p),
  forte: (p: number) => p * p * p,
} as const;

/**
 * Liga o efeito de proximidade nos itens `[data-cp-prox]` dentro da lista.
 *
 * @param lista Referência estável do contêiner (pode nascer depois; é lida
 *              a cada quadro, não no mount).
 * @param opcoes Raio, suavização e forma da queda.
 */
export function useProximidadeLinha(
  lista: RefObject<HTMLElement | null>,
  opcoes: OpcoesProximidadeLista = {},
): void {
  // As opções chegam como objeto novo a cada render; guardá-las num ref
  // evita desligar e religar o listener a cada tecla digitada no app.
  // Escrita no efeito (pós-commit) — a regra `react-hooks/refs` proíbe
  // mexer em `ref.current` durante o render.
  const opcoesRef = useRef(opcoes);
  useEffect(() => {
    opcoesRef.current = opcoes;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Sem hover não existe proximidade; sem motion reduzido, sem brilho.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cont: HTMLElement | null = null;
    let itens: HTMLElement[] = [];
    let alvos: number[] = [];
    let atuais: number[] = [];
    let ponteiro: { x: number; y: number } | null = null;
    let raf = 0;
    let ultimo = 0;

    /** Re-busca os itens quando a lista monta ou re-renderiza (troca de estação). */
    const medir = (): HTMLElement | null => {
      const novo = lista.current;
      if (novo !== cont) {
        cont = novo;
        itens = cont ? Array.from(cont.querySelectorAll<HTMLElement>("[data-cp-prox]")) : [];
        atuais = itens.map(() => 0);
        alvos = itens.map(() => 0);
        return cont;
      }
      if (!cont) return null;
      const agora = Array.from(cont.querySelectorAll<HTMLElement>("[data-cp-prox]"));
      const mudou =
        agora.length !== itens.length || agora.some((el, i) => el !== itens[i]);
      if (mudou) {
        atuais = agora.map((_, i) => atuais[i] ?? 0);
        alvos = agora.map((_, i) => alvos[i] ?? 0);
        itens = agora;
      }
      return cont;
    };

    /** Um quadro: calcula alvos com a última posição do ponteiro e suaviza. */
    const quadro = (agora: number) => {
      const dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;
      const o = opcoesRef.current;
      const tau = Math.max(o.suavizacao ?? 100, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);
      const curva = CURVAS[o.queda ?? "suave"];
      const raio = Math.max(1, o.raio ?? 100);

      const el = medir();
      if (el) {
        // Fora do contêiner (ou ponteiro fora da janela) → alvos zerados:
        // o último item aceso apaga em vez de ficar preso no último hover.
        const r = el.getBoundingClientRect();
        const dentro = !!ponteiro &&
          ponteiro.x >= r.left && ponteiro.x <= r.right &&
          ponteiro.y >= r.top && ponteiro.y <= r.bottom;
        for (let i = 0; i < itens.length; i += 1) {
          if (!dentro || !ponteiro) {
            alvos[i] = 0;
            continue;
          }
          const ri = itens[i].getBoundingClientRect();
          const centro = ri.top + ri.height / 2;
          const dist = Math.abs(ponteiro.y - centro);
          alvos[i] = curva(Math.max(0, 1 - dist / raio));
        }
      }

      let mexendo = false;
      for (let i = 0; i < itens.length; i += 1) {
        const alvo = alvos[i] ?? 0;
        const atual = atuais[i] ?? 0;
        const proximo = atual + (alvo - atual) * k;
        const parado = Math.abs(alvo - proximo) < 0.0015;
        const valor = parado ? alvo : proximo;
        atuais[i] = valor;
        itens[i].style.setProperty("--cp-prox", valor.toFixed(4));
        if (!parado) mexendo = true;
      }
      // Dorme no repouso; o próximo movimento acorda (zero custo ocioso).
      raf = mexendo ? requestAnimationFrame(quadro) : 0;
    };

    const acordar = () => {
      if (!raf) {
        ultimo = performance.now();
        raf = requestAnimationFrame(quadro);
      }
    };

    const aoMover = (e: PointerEvent) => {
      ponteiro = { x: e.clientX, y: e.clientY };
      acordar();
    };
    const aoSair = () => {
      ponteiro = null;
      acordar();
    };

    document.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("pointerleave", aoSair);
    window.addEventListener("blur", aoSair);

    return () => {
      document.removeEventListener("pointermove", aoMover);
      document.removeEventListener("pointerleave", aoSair);
      window.removeEventListener("blur", aoSair);
      if (raf) cancelAnimationFrame(raf);
      // Some com o rastro: sem isto, um item com 0.9 aceso sobreviveria
      // ao fechar e reabrir o painel no mesmo quadro.
      for (const el of itens) el.style.setProperty("--cp-prox", "0");
    };
  }, [lista]);
}
