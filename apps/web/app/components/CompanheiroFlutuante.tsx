"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: uma galinha SOLTA que anda pelo
 * chão da tela, sobre o conteúdo, e VOA em arco até o botão que a pessoa
 * precisa clicar quando o Seu Nonô encontra uma página. Roda sozinha — sem
 * código, sem app e sem pareamento (decisão do dono, 02/10/2026).
 *
 * MECÂNICA (adaptada do Clicky original) ────────────────────────────────────
 * O Clicky de desktop (farzaa/clicky, porta Bitshank-2338/clicky-windows,
 * espelhado aqui) tem três peças que reproduzimos:
 *
 *   1. **Bicho solto, ao lado do conteúdo** — não é um botão; é um overlay
 *      `pointer-events: none` (o sprite continua arrastável). Ele não bloqueia
 *      o clique no que está atrás.
 *   2. **Voo em arco bezier** ("teacher pace") até o alvo, em vez de pulo seco.
 *   3. **Anel pulsante** sobre o elemento enquanto ele fica parado ali
 *      ("dwell"), e depois volta a passear.
 *
 * QUEM DIZ ONDE CLICAR: a resposta do Seu Nonô marca o botão "Abrir página"
 * com `data-companheiro-alvo="abrir-pagina"` (o mesmo atributo que a
 * `PonteCompanheiro` manda para o app local). A galinha observa o DOM, acha o
 * primeiro alvo visível e voa até ele. O Seu Nonô responde; a galinha guia.
 *
 * A galinha vive no layout RAIZ (`app/layout.tsx`): permanece de uma página
 * para outra.
 *
 * ARTE: folha do Petdex (8 colunas × 9 linhas de 192×208, um estado por
 * linha). Padrão o qiaowei (shamador, `qiaowei`); o leitor pode marcar
 * VÁRIOS pets ao mesmo tempo, dos 23 disponíveis — ver `companheiroPets.ts`
 * e `public/companheiro/petdex/PROVENIENCIA.md`.
 *
 * SELETOR DE BICHINHO (pedido do dono, 02/10/2026; vários na tela desde a
 * mesma data) ──────────────────────────────────────────────────────────────
 * Três portas, todas apontando para o MESMO alternar (`alternarPet`):
 *
 *   1. **Clique direito** no bicho abre o menu na posição do mouse;
 *   2. **Botão pequeno** ao lado do FAB do Seu Nonô dispara
 *      `cp:companheiro-menu-pet` com a posição dele;
 *   3. **Cartão de checkboxes no chat** do Seu Nonô (nível "pets")
 *      dispara `cp:companheiro-trocar-pet` com o slug.
 * Cada gatilho ALTERNA o pet no grupo: põe se não está, tira se está —
 * nunca marca o último (a tela nunca fica sem bicho). A lista escolhida
 * fica no `localStorage` (`cp_pet`, slugs separados por vírgula) e
 * sobrevive a recarregar; quem só tinha um slug antigo continua igual.
 *
 * VÁRIOS NA TELA (pedido do dono, 02/10/2026) ──────────────────────────────
 * Os pets escolhidos andam em GRUPO: uma caixa só, filas lado a lado,
 * mesmo passeio, mesmo voo até o alvo do Seu Nonô. Cada sprite anima no
 * seu próprio ritmo (quadros por linha variam por pet) a partir do mesmo
 * estado do grupo. O clique em qualquer um abre o Seu Nonô; o arrasto
 * move o grupo inteiro.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - Um único `requestAnimationFrame` escreve `transform` da caixa e
 *   `background-position` de CADA sprite direto no DOM, SEM re-render por
 *   quadro. Passeio e voo são a mesma interpolação de posição.
 * - O alvo é relido a cada quadro (`getBoundingClientRect`), então o voo
 *   acompanha rolagem e mudança de layout sozinho.
 * - `prefers-reduced-motion`: fica parado no canto e não voa (acessibilidade).
 * - Clique no bicho abre o Seu Nonô; arrastar move; clique direito troca.
 * - bbox e quadros POR PET vêm medidos do pixel pelo script
 *   `scripts/processar-pets-petdex.mts` — arte de terceiro varia, e a
 *   janela de desenho de um pet corta o outro se for chute.
 *
 * ESTADOS DO ATLAS LIGADOS EM 02/10/2026 (pedido do dono)
 * --------------------------------------------------------
 * - `waiting` (linha 6): as PAUSAS do passeio — ela para e olha em volta;
 *   antes, a pausa reutilizava o `idle`.
 * - `review` (linha 8): o segundo momento da parada no alvo — acena
 *   (`waving`) por 1,4 s e depois "revisa" o alvo com o anel pulsante.
 * - DESCIDA AO SOLTAR: arrastou pra cima e soltou? Ela não congela mais
 *   flutuando: desce VOANDO em arco que mergulha, batendo asas (quadro
 *   `jumping`, a única linha aérea do atlas), em 400–800 ms conforme a
 *   altura, e pousa. Sem movimento reduzido, o pouso é instantâneo.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import {
  PETS_COMPANHEIRO,
  CHAVE_PET,
  LINHAS_ATLAS,
  PET_PADRAO,
  type PetCompanheiro,
} from "./companheiroPets";

// ── Geometria do atlas (padrão Petdex; medidas por PET em companheiroPets.ts)
const CELL_W = 192;
const CELL_H = 208;
const SHEET_COLS = 8;
const SHEET_ROWS = 9;
/** Altura do bicho na tela, em px — igual para todo pet. */
const ALTURA_TELA = 42;
const PERIODO = 130; // ms por quadro
/** Espaço entre vizinhos da fila do grupo, em px. */
const ESPACO_GRUPO = 4;

/** O pet padrão (qiaowei) — quem nunca escolheu começa com ele. */
const PET_INICIAL: PetCompanheiro =
  PETS_COMPANHEIRO.find((p) => p.slug === PET_PADRAO) ?? PETS_COMPANHEIRO[0];

/** Largura na tela do grupo inteiro (fileira de pets + espaços). */
function larguraGrupo(lista: PetCompanheiro[]): number {
  if (lista.length === 0) return larguraDe(PET_INICIAL);
  const soma = lista.reduce((acc, p) => acc + larguraDe(p) + 8, 0);
  return soma + ESPACO_GRUPO * (lista.length - 1);
}

type NomeEstado = (typeof LINHAS_ATLAS)[number];

/** Escala do pet: bicho de 42 px de altura, seja qual for a arte. */
function escalaDe(pet: PetCompanheiro): number {
  return ALTURA_TELA / pet.bbox.h;
}

/** Largura na tela da janela de desenho do pet. */
function larguraDe(pet: PetCompanheiro): number {
  return Math.round(pet.bbox.w * escalaDe(pet));
}

/** Altura na tela da janela de desenho do pet (≈ 42, arredondada). */
function alturaDe(pet: PetCompanheiro): number {
  return Math.round(pet.bbox.h * escalaDe(pet));
}

/** Quadros da linha do estado neste pet (medidos, podem ser 6 ou 7). */
function quadrosDe(pet: PetCompanheiro, nome: NomeEstado): number {
  return Math.max(1, pet.quadros[LINHAS_ATLAS.indexOf(nome)]);
}

/** `background-position` do quadro dentro da folha, na escala do pet. */
function posicao(pet: PetCompanheiro, nome: NomeEstado, frame: number): string {
  const e = escalaDe(pet);
  const x = -(pet.bbox.x + frame * CELL_W) * e;
  const y = -(pet.bbox.y + LINHAS_ATLAS.indexOf(nome) * CELL_H) * e;
  return `${x}px ${y}px`;
}

// ── Física do passeio/voo ─────────────────────────────────────────────────
const VELOCIDADE = 34; // px por segundo andando
const MARGEM = 12;
const DUR_VOO_MIN = 420; // ms
const DUR_VOO_MAX = 900; // ms
const ESPERA_NO_ALVO_MS = 2800;

interface Ponto {
  x: number;
  y: number;
}

/** Ponto de uma curva de Bézier quadrática (arco do voo, "teacher pace"). */
function bezier(p0: Ponto, c: Ponto, p1: Ponto, t: number): Ponto {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

/** Suaviza a velocidade do voo (parte devagar, chega devagar). */
function suavizar(t: number): number {
  return t * t * (3 - 2 * t);
}

interface Voo {
  // "pousar" = descida ao soltar no ar (arrasto pra cima); ida/volta são
  // os voos do alvo do Seu Nonô.
  fase: "ida" | "volta" | "pousar";
  p0: Ponto;
  ctrl: Ponto;
  inicio: number;
  dur: number;
  destino: Ponto;
}

export function CompanheiroFlutuante() {
  const pathname = usePathname();
  const caixaRef = useRef<HTMLDivElement>(null);
  /** Sprite vivo de cada pet do grupo — o laço escreve o quadro de cada um. */
  const spritesRef = useRef(new Map<string, HTMLSpanElement>());
  const anelRef = useRef<HTMLSpanElement>(null);

  const posRef = useRef<Ponto>({ x: 24, y: 0 }); // y = o quanto subiu do chão
  const direcaoRef = useRef(1);
  const pausaAteRef = useRef(0);
  const arrastandoRef = useRef(false);
  const alvoElRef = useRef<HTMLElement | null>(null);
  const vooRef = useRef<Voo | null>(null);
  const chegouEmRef = useRef<number | null>(null);
  const estadoRef = useRef<{ nome: NomeEstado; inicio: number }>({ nome: "idle", inicio: 0 });

  // ── Bichos escolhidos (podem ser VÁRIOS na tela) ──────────────────────────
  // Estado React = re-render da arte; ref = o laço lê na hora, sem esperar
  // re-render. Padrão (e primeiro render, inclusive o do servidor): qiaowei.
  const [pets, setPets] = useState<PetCompanheiro[]>([PET_INICIAL]);
  const petsRef = useRef<PetCompanheiro[]>([PET_INICIAL]);

  /** Grava a lista no storage e sincroniza o cartão do Seu Nonô. */
  const persistir = useCallback((lista: PetCompanheiro[]) => {
    try {
      window.localStorage.setItem(
        CHAVE_PET,
        lista.map((p) => p.slug).join(","),
      );
    } catch {
      // Armazenamento bloqueado (aba anônima): a escolha vale só nesta sessão.
    }
    window.dispatchEvent(
      new CustomEvent("cp:companheiro-pets", {
        detail: { slugs: lista.map((p) => p.slug) },
      }),
    );
  }, []);

  /** Aplica a nova lista: ref + estado React + lembrança. */
  const aplicarLista = useCallback(
    (lista: PetCompanheiro[]) => {
      petsRef.current = lista;
      setPets(lista);
      persistir(lista);
    },
    [persistir],
  );

  /**
   * Alterna um pet no grupo: põe se não está, tira se está. O último não
   * sai — a tela nunca fica sem bicho.
   */
  const alternarPet = useCallback(
    (alvo: PetCompanheiro) => {
      const atual = petsRef.current;
      const tem = atual.some((p) => p.slug === alvo.slug);
      if (tem && atual.length === 1) return;
      aplicarLista(
        tem ? atual.filter((p) => p.slug !== alvo.slug) : [...atual, alvo],
      );
    },
    [aplicarLista],
  );

  // Pets lembrados pelo leitor. `localStorage` só existe depois da
  // hidratação — no servidor e no primeiro render vale o qiaowei
  // (mesmo motivo da nuvem de boas-vindas do Seu Nonô). Valor antigo de
  // um slug só continua funcionando: `split(",")` aceita um ou muitos.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_PET);
      if (!salvo) return;
      const vistos = new Set<string>();
      const lista: PetCompanheiro[] = [];
      for (const bruto of salvo.split(",")) {
        const slug = bruto.trim();
        if (!slug || vistos.has(slug)) continue;
        vistos.add(slug);
        const achado = PETS_COMPANHEIRO.find((p) => p.slug === slug);
        if (achado) lista.push(achado);
      }
      if (lista.length === 0) return;
      const atual = petsRef.current;
      const igual =
        atual.length === lista.length &&
        atual.every((p, i) => p.slug === lista[i].slug);
      if (igual) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de localStorage: no SSR o objeto nao existe
      aplicarLista(lista);
    } catch {
      // Sem storage: fica com o qiaowei.
    }
  }, [aplicarLista]);

  // Cartão de checkboxes no chat do Seu Nonô: mesma alternância, outro gatilho.
  useEffect(() => {
    const aoTrocar = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug;
      const achado = PETS_COMPANHEIRO.find((p) => p.slug === slug);
      if (achado) alternarPet(achado);
    };
    window.addEventListener("cp:companheiro-trocar-pet", aoTrocar);
    return () => window.removeEventListener("cp:companheiro-trocar-pet", aoTrocar);
  }, [alternarPet]);

  // ── Menu de troca (clique direito no bicho ou botão perto do FAB) ─────────
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // O botão pequeno ao lado do FAB do Seu Nonô pede o menu na posição dele.
  useEffect(() => {
    const abrir = (e: Event) => {
      const d = (e as CustomEvent<{ x?: number; y?: number }>).detail ?? {};
      setMenu({ x: d.x ?? 40, y: d.y ?? 40 });
    };
    window.addEventListener("cp:companheiro-menu-pet", abrir);
    return () => window.removeEventListener("cp:companheiro-menu-pet", abrir);
  }, []);

  // Esc fecha o menu — contrato de diálogo do resto do portal.
  useEffect(() => {
    if (!menu) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [menu]);

  // Posição inicial antes da pintura (evita "pulo" no primeiro quadro).
  useLayoutEffect(() => {
    if (caixaRef.current) {
      caixaRef.current.style.transform = `translate3d(${posRef.current.x}px, 0, 0)`;
    }
  }, []);

  /** Escreve posição, quadro e anel direto no DOM. */
  const aplicar = useCallback((agora: number, estado: NomeEstado) => {
    if (caixaRef.current) {
      caixaRef.current.style.transform = `translate3d(${Math.round(posRef.current.x)}px, ${Math.round(-posRef.current.y)}px, 0)`;
    }
    // Cada sprite no seu ritmo (quadros por linha variam por pet) a partir
    // do mesmo estado do grupo — escrita direta no DOM, sem re-render.
    const base = Math.floor((agora - estadoRef.current.inicio) / PERIODO);
    for (const petAtual of petsRef.current) {
      const span = spritesRef.current.get(petAtual.slug);
      if (!span) continue;
      span.style.backgroundPosition = posicao(
        petAtual,
        estado,
        base % quadrosDe(petAtual, estado),
      );
    }
    // Anel pulsante sobre o alvo durante o "dwell". `display` (não `opacity`):
    // a animação `animate-ping` mexe na opacidade e venceria o estilo inline.
    const anel = anelRef.current;
    if (anel) {
      if (chegouEmRef.current !== null && alvoElRef.current) {
        const r = alvoElRef.current.getBoundingClientRect();
        anel.style.left = `${r.left - 6}px`;
        anel.style.top = `${r.top - 6}px`;
        anel.style.width = `${r.width + 12}px`;
        anel.style.height = `${r.height + 12}px`;
        anel.style.display = "block";
      } else {
        anel.style.display = "none";
      }
    }
  }, []);

  // ── Centro do alvo onde o bicho para (logo acima dele, sem cobrir) ────────
  const pontoDoAlvo = useCallback((): Ponto | null => {
    const el = alvoElRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    const larg = larguraGrupo(petsRef.current);
    const x = Math.min(
      window.innerWidth - larg - MARGEM,
      Math.max(MARGEM, r.left + r.width / 2 - larg / 2),
    );
    const y = Math.max(0, window.innerHeight - r.top - 2);
    return { x, y };
  }, []);

  // ── O laço: passeio, voo de ida, dwell e voo de volta ───────────────────
  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let anterior = performance.now();

    const passo = (agora: number) => {
      const dt = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      let estado: NomeEstado = "idle";
      const voo = vooRef.current;
      const larg = larguraGrupo(petsRef.current);

      if (voo) {
        const t = Math.min(1, (agora - voo.inicio) / voo.dur);
        const destino = voo.fase === "ida" ? pontoDoAlvo() ?? voo.destino : voo.destino;
        posRef.current = bezier(voo.p0, voo.ctrl, destino, suavizar(t));
        // Ida e pouso são voos no AR (jumping = batendo asas); a volta ao
        // chão é corrida.
        estado = voo.fase === "volta" ? "running" : "jumping";
        if (t >= 1) {
          vooRef.current = null;
          if (voo.fase === "ida") chegouEmRef.current = agora; // dwell no alvo
          if (voo.fase === "pousar") pausaAteRef.current = agora + 600; // pousou: respira antes de andar
        }
      } else if (chegouEmRef.current !== null) {
        // Parada no alvo: acena (`waving`) por 1,4 s e depois "revisa" o
        // alvo (`review`) enquanto o anel pulsa. Depois, voo de volta.
        estado = agora - chegouEmRef.current <= 1400 ? "waving" : "review";
        if (agora - chegouEmRef.current > ESPERA_NO_ALVO_MS) {
          chegouEmRef.current = null;
          const p0 = { ...posRef.current };
          const destino: Ponto = { x: Math.max(MARGEM, Math.min(window.innerWidth - larg - MARGEM, p0.x)), y: 0 };
          vooRef.current = {
            fase: "volta",
            p0,
            ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 80 },
            inicio: agora,
            dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + Math.abs(p0.x - destino.x)),
            destino,
          };
        }
      } else if (!arrastandoRef.current && !semMovimento) {
        // Passeio: anda, pausa de vez em quando, vira nas bordas.
        if (agora >= pausaAteRef.current) {
          posRef.current.x += direcaoRef.current * VELOCIDADE * dt;
          const maxX = window.innerWidth - larg - MARGEM;
          if (posRef.current.x <= MARGEM) {
            posRef.current.x = MARGEM;
            direcaoRef.current = 1;
          } else if (posRef.current.x >= maxX) {
            posRef.current.x = maxX;
            direcaoRef.current = -1;
          }
          estado = direcaoRef.current > 0 ? "running-right" : "running-left";
          if (Math.random() < 0.004) pausaAteRef.current = agora + 900 + Math.random() * 1800;
        } else {
          // Pausa do passeio: `waiting` (olha em volta) — ligado em
          // 02/10/2026; antes a pausa reutilizava o `idle`.
          estado = "waiting";
        }
      }

      if (estadoRef.current.nome !== estado) estadoRef.current = { nome: estado, inicio: agora };
      aplicar(agora, estado);
      raf = requestAnimationFrame(passo);
    };

    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [aplicar, pontoDoAlvo]);

  // ── Voa em arco até um alvo ─────────────────────────────────────────────
  const voarPara = useCallback(
    (el: HTMLElement) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // fora da tela
      alvoElRef.current = el;
      const p0 = { ...posRef.current };
      const destino: Ponto =
        pontoDoAlvo() ?? { x: r.left, y: Math.max(0, window.innerHeight - r.top - 2) };
      vooRef.current = {
        fase: "ida",
        p0,
        ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 90 },
        inicio: performance.now(),
        dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + (Math.abs(p0.x - destino.x) + Math.abs(p0.y - destino.y)) * 0.4),
        destino,
      };
      chegouEmRef.current = null;
    },
    [pontoDoAlvo],
  );

  // Nova resposta do Seu Nonô muda o DOM: procura um alvo e voa até ele.
  useEffect(() => {
    const procurar = () => {
      if (vooRef.current || chegouEmRef.current !== null || alvoElRef.current) return;
      const alvo = document.querySelector<HTMLElement>('[data-companheiro-alvo="abrir-pagina"]');
      if (alvo) voarPara(alvo);
    };
    const obs = new MutationObserver(procurar);
    obs.observe(document.body, { childList: true, subtree: true });
    procurar();
    const t = window.setTimeout(procurar, 600);
    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, [pathname, voarPara]);

  // Gatilho manual (outro componente pode pedir o voo).
  useEffect(() => {
    const aoPedir = (e: Event) => {
      const sel = (e as CustomEvent<{ seletor?: string }>).detail?.seletor;
      const el = sel
        ? document.querySelector<HTMLElement>(sel)
        : document.querySelector<HTMLElement>('[data-companheiro-alvo="abrir-pagina"]');
      if (el) voarPara(el);
    };
    window.addEventListener("cp:companheiro-voar", aoPedir);
    return () => window.removeEventListener("cp:companheiro-voar", aoPedir);
  }, [voarPara]);

  const aoClicar = useCallback(() => {
    if (arrastandoRef.current) return;
    window.dispatchEvent(new CustomEvent("abrir-seu-nono"));
  }, []);

  // Arrasto: tira do passeio; soltar retoma a partir dali.
  const pega = useRef<{ px: number; py: number; x0: number; y0: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    pega.current = { px: e.clientX, py: e.clientY, x0: posRef.current.x, y0: posRef.current.y };
    arrastandoRef.current = true;
    alvoElRef.current = null;
    vooRef.current = null;
    chegouEmRef.current = null;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const g = pega.current;
    if (!g) return;
    const larg = larguraGrupo(petsRef.current);
    posRef.current.x = Math.max(MARGEM, Math.min(window.innerWidth - larg - MARGEM, g.x0 + e.clientX - g.px));
    posRef.current.y = Math.max(0, g.y0 - (e.clientY - g.py));
  };
  const onPointerUp = () => {
    pega.current = null;
    arrastandoRef.current = false;
    pausaAteRef.current = performance.now() + 600;
    // Soltou NO AR (arrastou pra cima e soltou)? Ele desce voando, batendo
    // asas, em arco que MERGULHA abaixo da linha reta — pedido do dono
    // (02/10/2026). Antes o bicho ficava flutuando preso na altura do soltar.
    const altura = posRef.current.y;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (altura > 12 && !reduzido) {
      const p0 = { ...posRef.current };
      const larg = larguraGrupo(petsRef.current);
      const destino: Ponto = {
        x: Math.max(MARGEM, Math.min(window.innerWidth - larg - MARGEM, p0.x)),
        y: 0,
      };
      vooRef.current = {
        fase: "pousar",
        p0,
        // Controle ABAIXO da linha reta (meia altura − 40 px): o arco
        // cai, em vez de subir como os voos de ida/volta do alvo.
        ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(0, p0.y / 2 - 40) },
        inicio: performance.now(),
        dur: Math.min(800, Math.max(400, 400 + altura * 4)),
        destino,
      };
      chegouEmRef.current = null;
      alvoElRef.current = null;
    } else if (reduzido && altura > 0) {
      posRef.current.y = 0; // sem movimento reduzido: pousa na hora
    }
  };

  // Clique direito no bicho: abre o menu de troca embaixo do mouse.
  const aoMenuDireito = (e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault(); // o menu do navegador não cabe no bicho
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Anel pulsante sobre o alvo (mecânica do Clicky). Click-through. */}
      <span
        ref={anelRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-40 animate-ping rounded-xl border-2 border-primary"
        style={{ display: "none" }}
      />

      {/* O grupo de bichinhos. O container é click-through; só os sprites
          pegam o ponteiro. Andam e voam juntos: uma caixa, uma posição. */}
      <div
        ref={caixaRef}
        className="pointer-events-none fixed bottom-2 left-0 z-40 flex items-end print:hidden"
        style={{ willChange: "transform", gap: ESPACO_GRUPO }}
      >
        {pets.map((p) => {
          const escala = escalaDe(p);
          const larg = larguraDe(p);
          const alt = alturaDe(p);
          return (
            <button
              key={p.slug}
              type="button"
              onClick={aoClicar}
              onContextMenu={aoMenuDireito}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label={`Abrir o Seu Nonô, o assistente do portal (${p.nome})`}
              title={`Pergunte ao Seu Nonô — ${p.nome}: arraste para mover, botão direito troca o bichinho`}
              className="pointer-events-auto block touch-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-grab active:cursor-grabbing"
              style={{ width: larg + 8, height: alt }}
            >
              <span
                ref={(el) => {
                  if (el) spritesRef.current.set(p.slug, el);
                  else spritesRef.current.delete(p.slug);
                }}
                aria-hidden="true"
                style={{
                  display: "block",
                  width: larg,
                  height: alt,
                  margin: "0 auto",
                  backgroundImage: `url('${p.caminho}')`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${SHEET_COLS * CELL_W * escala}px ${SHEET_ROWS * CELL_H * escala}px`,
                  backgroundPosition: posicao(p, "idle", 0),
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Menu de troca em checkboxes (vários na tela): fundo fecha no
          clique fora; o menu fica por cima. */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onPointerDown={() => setMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Escolher os bichinhos do companheiro"
            className="fixed z-[70] max-h-[60vh] w-60 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
            style={{
              left: Math.max(8, Math.min(menu.x, window.innerWidth - 256)),
              top: Math.max(8, Math.min(menu.y, window.innerHeight - 300)),
            }}
          >
            <p className="px-2 pb-1 text-[0.7rem] font-medium text-text-soft">
              Marque quem anda na tela (pode ser mais de um):
            </p>
            <ul className="space-y-0.5">
              {PETS_COMPANHEIRO.map((p) => {
                const marcado = pets.some((q) => q.slug === p.slug);
                return (
                  <li key={p.slug}>
                    {/* O último não sai: `alternarPet` recusa a remoção. */}
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={marcado}
                      onClick={() => alternarPet(p)}
                      className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 ${
                        marcado ? "font-semibold text-primary" : "text-text"
                      }`}
                    >
                      <span className="flex items-baseline gap-1.5">
                        <span
                          aria-hidden="true"
                          className="inline-block w-3 shrink-0 text-center"
                        >
                          {marcado ? "✓" : ""}
                        </span>
                        <span>{p.nome}</span>
                      </span>
                      <span className="truncate text-[0.65rem] font-normal text-text-soft">
                        {p.autor}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setMenu(null)}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-right text-xs font-medium text-text-soft hover:bg-surface-2"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </>
  );
}
