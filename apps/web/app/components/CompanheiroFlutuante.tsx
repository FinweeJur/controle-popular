"use client";

/**
 * @file CompanheiroFlutuante.tsx
 * @description O companheiro Seu Nonô no site: bichinhos SOLTOs que andam
 * pelo conteúdo da tela — inclusive EM CIMA de imagem, texto, cartão e
 * botão (física de plataforma em `lib/companheiro/plataformas.ts`) — e VOA
 * em arco até o botão que a pessoa precisa clicar quando o Seu Nonô
 * encontra uma página. Roda sozinho — sem código, sem app e sem
 * pareamento (decisão do dono, 02/10/2026).
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
 * `PonteCompanheiro` manda para o app local). O PRIMEIRO pet da lista (o
 * "líder") observa o DOM, acha o alvo visível e voa até ele. Os outros
 * seguem passeando — um voo por vez, na tela inteira; foi decisão de
 * projeto para não virar confusão aérea (03/10/2026).
 *
 * O companheiro vive no layout RAIZ (`app/layout.tsx`): permanece de uma
 * página para outra.
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
 *   2. **Pata** na pilha do canto esquerdo (abaixo do rádio, acima do FAB)
 *      dispara `cp:companheiro-menu-pet` com a posição dela;
 *   3. **Cartão de checkboxes no chat** do Seu Nonô (nível "pets")
 *      dispara `cp:companheiro-trocar-pet` com o slug.
 * Cada gatilho ALTERNA o pet no grupo: põe se não está, tira se está —
 * nunca marca o último (a tela nunca fica sem bicho). A lista escolhida
 * fica no `localStorage` (`cp_pet`, slugs separados por vírgula) e
 * sobrevive a recarregar; quem só tinha um slug antigo continua igual.
 *
 * VÁRIOS NA TELA, CADA UM DONO DO SEU CORPO (pedido do dono, 03/10/2026)
 * ─────────────────────────────────────────────────────────────────────────
 * Cada pet é um BICHO próprio: posição, direção, pausa, voo, queda e
 * estado animado independentes, cada um no seu `div` fixo. O que mudou em
 * relação à "fila de bichos" de 02/10:
 *
 *   - **Arrasto por pet**: apertou um, move só ele; o clique que abre o
 *     Seu Nonô é suprimido quando o gesto foi arrasto (`semCliqueAte`);
 *   - **Física de plataforma**: a página é amostrada 1×/s (e em scroll,
 *     resize e mutações) em `Plataforma[]` — topo de imagem, texto,
 *     moldura de cartão e botão valem CHÃO. O bicho anda na superfície sob
 *     os pés, SALTA até o degrau mais alto alcançável à frente, CAI com
 *     gravidade quando a borda acaba e POUSA em arco ao ser solto no ar;
 *   - **Posição lembrada por pet**: sair da lista e voltar retoma o bicho
 *     onde ele estava (o mapa de bichos não perde entrada).
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - Um único `requestAnimationFrame` percorre TODOS os bichos e escreve
 *   `transform` da caixa de cada um e `background-position` do seu sprite
 *   direto no DOM, SEM re-render por quadro. Passeio, salto, queda e voo
 *   são a mesma interpolação de posição.
 * - O alvo do líder é relido a cada quadro (`getBoundingClientRect`),
 *   então o voo acompanha rolagem e mudança de layout sozinho.
 * - `prefers-reduced-motion`: cada bicho fica parado onde está e não voa
 *   (acessibilidade); o arrasto manual continua.
 * - Clique no bicho abre o Seu Nonô; arrastar move; clique direito troca.
 * - bbox e quadros POR PET vêm medidos do pixel pelo script
 *   `scripts/processar-pets-petdex.mts` — arte de terceiro varia, e a
 *   janela de desenho de um pet corta o outro se for chute.
 * - A física de superfície é função PURA testada em
 *   `lib/companheiro/plataformas.test.ts` (16 casos com conta à mão).
 *
 * ESTADOS DO ATLAS LIGADOS EM 02/10/2026 (pedido do dono)
 * --------------------------------------------------------
 * - `waiting` (linha 6): as PAUSAS do passeio — ela para e olha em volta;
 *   antes, a pausa reutilizava o `idle`.
 * - `review` (linha 8): o segundo momento da parada no alvo — acena
 *   (`waving`) por 1,4 s e depois "revisa" o alvo com o anel pulsante.
 * - DESCIDA AO SOLTAR: arrastou pra cima e soltou? Ele não congela mais
 *   flutuando: desce VOANDO em arco que mergulha, batendo asas (quadro
 *   `jumping`, a única linha aérea do atlas), em 400–800 ms conforme a
 *   altura, e pousa na superfície de baixo (chão ou teto de cartão).
 *   Sem movimento reduzido, o pouso é instantâneo.
 * - SALTO EM CIMA (03/10/2026): o encontro com uma plataforma à frente
 *   dentro do alcance vira arco curto (`jumping`); a queda livre da borda
 *   também usa `jumping` — o atlas não tem quadro de "caindo", asas
 *   batendo servem para os dois.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  PETS_COMPANHEIRO,
  CHAVE_PET,
  LINHAS_ATLAS,
  PET_PADRAO,
  type PetCompanheiro,
} from "./companheiroPets";
import { X } from "lucide-react";
import { PetIcone } from "./PetIcone";
import {
  BASE_BORDA,
  alvoDoSalto,
  amostrarPlataformas,
  passoQueda,
  plataformaSalto,
  superficieSob,
  type Plataforma,
  type Ponto,
} from "@/lib/companheiro/plataformas";
import { DURACAO_FALHA_MS, EVENTO_COMPANHEIRO_FAILED } from "@/lib/companheiro/eventos";
import { escolherFala } from "@/lib/companheiro/falas";
import { dicaParaRota, type DicaPagina } from "@/lib/companheiro/dicas-pagina";
import { usePosicaoPainel, type CaixaAncora } from "@/lib/posicionar-painel";

// ── Geometria do atlas (padrão Petdex; medidas por PET em companheiroPets.ts)
const CELL_W = 192;
const CELL_H = 208;
const SHEET_COLS = 8;
const SHEET_ROWS = 9;
/** Altura do bicho na tela, em px — igual para todo pet. */
const ALTURA_TELA = 42;

/** O pet padrão (qiaowei) — quem nunca escolheu começa com ele. */
const PET_INICIAL: PetCompanheiro =
  PETS_COMPANHEIRO.find((p) => p.slug === PET_PADRAO) ?? PETS_COMPANHEIRO[0];

type NomeEstado = (typeof LINHAS_ATLAS)[number];

/**
 * Ritmo dos quadros do atlas, em ms por quadro.
 *
 * O dono pediu (03/10/2026) para FREAR as animações: os quadros trocavam
 * rápido demais. As regras que ele ditou:
 *  - andar (`running-right`/`running-left`/`running`): só −20% de velocidade
 *    → período ×1,25 (130 → 163 ms);
 *  - `idle`: o alvo principal do nerf (animação fixa lateral que incomodava)
 *    → período ×2,4;
 *  - demais estados (aceno, pulo, espera, revisão): −50% → período ×2.
 *
 * Velocidade é 1/período: AUMENTAR o período FREIA o quadro. O valor base
 * 130 ms é o original; ninguém mais troca número por estado sem passar aqui.
 */
const PERIODO_BASE = 130;
const PERIODO_POR_ESTADO: Record<NomeEstado, number> = {
  "running-right": Math.round(PERIODO_BASE * 1.25),
  "running-left": Math.round(PERIODO_BASE * 1.25),
  running: Math.round(PERIODO_BASE * 1.25),
  idle: Math.round(PERIODO_BASE * 2.4),
  waving: Math.round(PERIODO_BASE * 2),
  jumping: Math.round(PERIODO_BASE * 2),
  failed: Math.round(PERIODO_BASE * 2),
  waiting: Math.round(PERIODO_BASE * 2),
  review: Math.round(PERIODO_BASE * 2),
};

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

/**
 * Largura do BOTÃO do pet na tela (sprite + 8 px de respiro do `style`).
 * É a caixa que encosta no chão — os pés da física ficam na metade dela.
 */
function larguraBotao(pet: PetCompanheiro): number {
  return larguraDe(pet) + 8;
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

/**
 * Balõezinhos de permanência no site (pedidos do dono, 04/10/2026).
 *
 * O companheiro fala com quem fica lendo: três balões, um por faixa de tempo.
 *
 *   1. **1 minuto** — convite para trocar ou tirar os bichinhos. É um botão de
 *      verdade: clicar abre o menu de troca. (Padrão que já existia.)
 *   2. **5 minutos** — o PÁSSARO PADRÃO (qiaowei, o Oriental Magpie-Robin, o
 *      "pássaro" do Petdex) cita Frida Kahlo. A arte mostrada é SEMPRE a do
 *      pássaro padrão, mesmo que o leitor tenha escolhido outro bicho — a fala
 *      é dele (decisão do dono).
 *   3. **50 minutos** — o companheiro ativo lembra de alongar.
 *
 * Regras comuns: cada um aparece UMA vez por sessão (marca em
 * `sessionStorage`, não em `localStorage`: recarregar a aba não repete, abrir
 * outra janela sim), some sozinho (WCAG: conteúdo temporizado) e NUNCA
 * sobrepõe outro balão nem cobre o chat do Seu Nonô: se houver um balão aberto
 * ou a conversa aberta, a vez é adiada.
 *
 * TEMPO NA TELA DIFERENTE POR BALÃO (pedido do dono, 04/10/2026): o balão de
 * troca é um BOTÃO — a pessoa precisa lê-lo, decidir e clicar para abrir o
 * menu de bichos. Com os 10 s dos avisos, ele sumia antes da decisão. Por isso
 * ele ganha `DICA_TROCA_VISIVEL_MS` (45 s), enquanto o pássaro (5 min) e o
 * lembrete de alongar (50 min) são só avisos, sem ação, e seguem no
 * `DICA_VISIVEL_MS` curto. O prazo maior segue a WCAG 2.2.1 (tempo ajustável):
 * conteúdo que exige interação recebe mais tempo para não punir quem lê devagar.
 *
 * O acesso a `process.env.NEXT_PUBLIC_*` precisa ser ESTÁTICO (ponto, não
 * índice): só assim o Next substitui o valor no bundle do cliente. Os tempos
 * aceitam override por variável de ambiente para o teste Playwright não esperar
 * 50 min reais — a produção não define nada e cai nos valores de sempre.
 */

/**
 * Cada balão tem gatilho, texto e aparência próprios. São cinco:
 *   - "troca"   (1 min): botão que abre o menu de bichinhos;
 *   - "fala"    (~2 min): fala aleatória do PET ATIVO (`pets[0]`);
 *   - "frida"   (5 min): o pássaro padrão cita Frida Kahlo;
 *   - "alongar" (50 min): o companheiro ativo lembra de alongar;
 *   - "pagina"  (ao mudar de rota): dica educativa da página, uma vez por
 *     sessão e por prefixo. Não é agendada por tempo — nasce do `usePathname`.
 */
type TipoDica = "troca" | "fala" | "frida" | "alongar" | "pagina";

/** Um balão agendado: tipo, chave de sessão e quando aparece. */
interface AgendaDica {
  tipo: TipoDica;
  chave: string;
  apareceMs: number;
}

const CHAVE_DICA_SESSAO = "cp_dica_companheiro_vista";
const CHAVE_DICA_FALA = "cp_dica_fala_vista";
const CHAVE_DICA_5MIN = "cp_dica_5min_vista";
const CHAVE_DICA_50MIN = "cp_dica_50min_vista";
/**
 * Prefixo da chave de sessão de cada dica de página. A chave final é
 * `cp_dica_pagina_vista:<prefixo>` — uma por rota educativa, para o aviso não
 * repetir na mesma sessão e ainda assim aparecer em outra rota depois.
 */
const CHAVE_DICA_PAGINA = "cp_dica_pagina_vista:";

const DICA_APARECE_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_COMPANHEIRO_MS);
  return Number.isFinite(n) && n > 0 ? n : 60_000;
})();
/**
 * Quando a fala aleatória do pet ativo aparece, em ms (default 2 min).
 *
 * Fica entre o convite de troca (1 min) e a citação da Frida (5 min): dá tempo
 * de a pessoa conhecer o bicho antes de ele puxar conversa. O override por env
 * existe só para o teste Playwright não esperar 2 min reais.
 */
const DICA_FALA_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_FALA_MS);
  return Number.isFinite(n) && n > 0 ? n : 2 * 60_000;
})();
/**
 * Atraso entre a troca de rota e a tentativa de mostrar a dica educativa, em
 * ms (default 1,5 s). Evita que o balão dispute o primeiro paint da página.
 * Override por env para o teste Playwright.
 */
const DICA_PAGINA_ATRASO_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_PAGINA_ATRASO_MS);
  return Number.isFinite(n) && n > 0 ? n : 1_500;
})();
const DICA_5MIN_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_5MIN_MS);
  return Number.isFinite(n) && n > 0 ? n : 5 * 60_000;
})();
const DICA_50MIN_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_50MIN_MS);
  return Number.isFinite(n) && n > 0 ? n : 50 * 60_000;
})();
const DICA_VISIVEL_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_VISIVEL_MS);
  return Number.isFinite(n) && n > 0 ? n : 15_000;
})();
/**
 * Quanto tempo a dica de TROCA fica na tela antes de sumir sozinha, em ms
 * (default 15 s — pedido do dono, 04/10/2026).
 *
 * O dono uniformizou TODOS os balões em 15 s: leitura rápida e sem virar
 * ruído permanente. Este é um controle (abre o menu), mas com o mesmo prazo
 * dos avisos. O override por env existe só para o teste Playwright.
 */
const DICA_TROCA_VISIVEL_MS = (() => {
  const n = Number(process.env.NEXT_PUBLIC_CP_DICA_TROCA_VISIVEL_MS);
  return Number.isFinite(n) && n > 0 ? n : 15_000;
})();

/**
 * Os balões TEMPORIZADOS, na ordem dos tempos (1 min, 2 min, 5 min, 50 min).
 * A dica de página NÃO entra aqui: o gatilho dela é a troca de rota
 * (`usePathname`), não um relógio — ver o efeito dedicado mais abaixo.
 */
const AGENDA_DICAS: AgendaDica[] = [
  { tipo: "troca", chave: CHAVE_DICA_SESSAO, apareceMs: DICA_APARECE_MS },
  { tipo: "fala", chave: CHAVE_DICA_FALA, apareceMs: DICA_FALA_MS },
  { tipo: "frida", chave: CHAVE_DICA_5MIN, apareceMs: DICA_5MIN_MS },
  { tipo: "alongar", chave: CHAVE_DICA_50MIN, apareceMs: DICA_50MIN_MS },
];

/** Fala exata do pássaro aos 5 minutos (citação de Frida Kahlo). */
const TEXTO_DICA_FRIDA =
  "Pés, para que os quero, se tenho asas para voar? - Frida Kahlo";

/** Texto exato do balão do companheiro aos 50 minutos. */
const TEXTO_DICA_ALONGAR = "É tão bom se movimentar! Vamos se alongar um minuto?";

/**
 * Chave do `localStorage` da posição de cada bicho (mapa `slug → {x,y}`).
 * Cada bicho solto guarda a própria posição — a pilha de botões (rádio, pet,
 * Seu Nonô) tem a chave dela, e aqui é uma por slug para os vários bichos.
 */
const CHAVE_POS_PET = "cp_companheiro_pos";

/** Um valor lido do storage é um ponto válido (`x`/`y` numéricos)? */
function ehPonto(v: unknown): v is Ponto {
  if (!v || typeof v !== "object") return false;
  const p = v as { x?: unknown; y?: unknown };
  return typeof p.x === "number" && typeof p.y === "number";
}

/** Lê o mapa de posições salvas dos bichos; `{}` se o storage falhar. */
function lerPosSalvas(): Record<string, Ponto> {
  try {
    const bruto = window.localStorage.getItem(CHAVE_POS_PET);
    if (!bruto) return {};
    const obj = JSON.parse(bruto) as Record<string, unknown>;
    const saida: Record<string, Ponto> = {};
    for (const [slug, v] of Object.entries(obj)) {
      if (ehPonto(v)) saida[slug] = { x: v.x, y: v.y };
    }
    return saida;
  } catch {
    return {};
  }
}

/** Grava a posição de UM bicho no mapa, preservando os outros. */
function salvarPos(slug: string, pos: Ponto): void {
  try {
    const todas = lerPosSalvas();
    todas[slug] = { x: Math.round(pos.x), y: Math.round(Math.max(0, pos.y)) };
    window.localStorage.setItem(CHAVE_POS_PET, JSON.stringify(todas));
  } catch {
    // Storage bloqueado (aba anônima): a posição vale só nesta sessão.
  }
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
  // "pousar" = descida ao soltar no ar (arrasto pra cima); "salto" = a
  // subida em degrau da física de plataforma; ida/volta são os voos do
  // alvo do Seu Nonô.
  fase: "ida" | "volta" | "pousar" | "salto";
  p0: Ponto;
  ctrl: Ponto;
  inicio: number;
  dur: number;
  destino: Ponto;
}

/**
 * Um bicho: todo o corpo animado de um pet. O mapa `slug → Bicho` é a
 * memória da tela — tirar um pet da lista NÃO apaga a entrada, então ele
 * volta ao lugar de quando saiu.
 */
interface Bicho {
  pos: Ponto; // x em px de viewport; y = altura acima do chão (bottom-2)
  dir: 1 | -1;
  pausaAte: number; // instante em que o passeio volta (pausa do waiting)
  arrastando: boolean;
  voo: Voo | null;
  chegouEm: number | null; // início do dwell no alvo (só do líder)
  alvoEl: HTMLElement | null; // alvo atual (só do líder)
  estado: { nome: NomeEstado; inicio: number };
  queda: number; // velocidade da queda livre px/s (0 = no chão/superfície)
  semCliqueAte: number; // suppressor de clique pós-arrasto
}

/** Cria um bicho parado no chão na posição dada. */
function criarBicho(x: number): Bicho {
  return {
    pos: { x, y: 0 },
    dir: 1,
    pausaAte: 0,
    arrastando: false,
    voo: null,
    chegouEm: null,
    alvoEl: null,
    estado: { nome: "idle", inicio: 0 },
    queda: 0,
    semCliqueAte: 0,
  };
}

export function CompanheiroFlutuante() {
  const pathname = usePathname();
  /** Caixa (`div` fixo) de cada pet — o laço escreve o `transform`. */
  const caixasRef = useRef(new Map<string, HTMLDivElement>());
  /** Sprite vivo de cada pet — o laço escreve o quadro. */
  const spritesRef = useRef(new Map<string, HTMLSpanElement>());
  const anelRef = useRef<HTMLSpanElement>(null);

  const bichosRef = useRef(new Map<string, Bicho>());
  const platsRef = useRef<Plataforma[]>([]);
  /**
   * Instante (performance.now) até quando os bichos ficam "failed". Zero =
   * comportamento normal. O laço lê este ref a cada quadro; o listener só
   * escreve, então não há re-render nem dependência no efeito do laço.
   */
  const falhaAteRef = useRef(0);

  // ── Bichos escolhidos (podem ser VÁRIOS na tela) ──────────────────────────
  // Estado React = re-render da arte; ref = o laço lê na hora, sem esperar
  // re-render. Padrão (e primeiro render, inclusive o do servidor): qiaowei.
  const [pets, setPets] = useState<PetCompanheiro[]>([PET_INICIAL]);
  const petsRef = useRef<PetCompanheiro[]>([PET_INICIAL]);

  /** Cria o bicho de quem ainda não tem (o primeiro nasce em x=24). */
  const garantirBichos = useCallback((lista: PetCompanheiro[]) => {
    const salvas = lerPosSalvas();
    lista.forEach((pet, idx) => {
      if (bichosRef.current.has(pet.slug)) return;
      const larg = larguraBotao(pet);
      // Posição lembrada (pedido do dono, 03/10/2026): o bicho volta onde o
      // leitor o soltou. Sem posição salva, o primeiro mantém o canto de
      // sempre e quem entra depois nasce perto da borda direita.
      const salva = salvas[pet.slug];
      const x =
        salva?.x ??
        (idx === 0 ? 24 : Math.max(MARGEM, window.innerWidth - MARGEM - larg - idx * 64));
      const bicho = criarBicho(x);
      if (salva) bicho.pos.y = Math.max(0, salva.y);
      bichosRef.current.set(pet.slug, bicho);
    });
  }, []);

  /** Grava a lista no storage e sincroniza o cartão do Seu Nonô. */
  const persistir = useCallback((lista: PetCompanheiro[]) => {
    try {
      // Lista vazia vira o sentinela "-" ("sem bichinhos"): string vazia some
      // no `if (!salvo)` do carregador, então "não ter nenhum" precisa de marca.
      window.localStorage.setItem(
        CHAVE_PET,
        lista.length ? lista.map((p) => p.slug).join(",") : "-",
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

  /** Aplica a nova lista: bichos prontos + ref + estado React + lembrança. */
  const aplicarLista = useCallback(
    (lista: PetCompanheiro[]) => {
      garantirBichos(lista);
      petsRef.current = lista;
      setPets(lista);
      persistir(lista);
    },
    [garantirBichos, persistir],
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

  /** Tira TODOS os bichinhos (o companheiro some da tela). */
  const limparPets = useCallback(() => {
    aplicarLista([]);
  }, [aplicarLista]);

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
      // "-" é o sentinela de "sem bichinhos" (dono, 03/10/2026): a lista fica
      // vazia de propósito e o companheiro some da tela.
      if (salvo !== "-") {
        for (const bruto of salvo.split(",")) {
          const slug = bruto.trim();
          if (!slug || vistos.has(slug)) continue;
          vistos.add(slug);
          const achado = PETS_COMPANHEIRO.find((p) => p.slug === slug);
          if (achado) lista.push(achado);
        }
        if (lista.length === 0) return;
      }
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

  // Primeiro render: garante o bicho do qiaowei ANTES do laço rodar.
  useLayoutEffect(() => {
    garantirBichos(petsRef.current);
  }, [garantirBichos]);

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

  // Cartão / índice pediu para tirar todos os bichinhos.
  useEffect(() => {
    const aoLimpar = () => limparPets();
    window.addEventListener("cp:companheiro-limpar-pets", aoLimpar);
    return () => window.removeEventListener("cp:companheiro-limpar-pets", aoLimpar);
  }, [limparPets]);

  // Página 404: o bicho entra em "failed" por alguns segundos (pedido do dono).
  // A página de erro é de servidor e avisa por evento global (`SinalizarErro404`).
  // Aqui só carimbamos o prazo; o laço de animação lê o ref e força o estado.
  useEffect(() => {
    const aoFalhar = () => {
      falhaAteRef.current = performance.now() + DURACAO_FALHA_MS;
    };
    window.addEventListener(EVENTO_COMPANHEIRO_FAILED, aoFalhar);
    return () => window.removeEventListener(EVENTO_COMPANHEIRO_FAILED, aoFalhar);
  }, []);

  // ── Menu de troca (clique direito no bicho ou pata da pilha) ──────────────
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // Posição do menu (pedido do dono, 03/10/2026): ele nasce no ponto do mouse
  // ou embaixo da pata e precisa caber na tela. O utilitário mede o menu e
  // vira para cima/esquerda quando falta espaço; a âncora é um ponto (caixa de
  // tamanho zero) no local onde o menu foi pedido.
  const menuRef = useRef<HTMLDivElement | null>(null);
  const medirAncoraMenu = useCallback(
    (): CaixaAncora | null =>
      menu ? { esq: menu.x, topo: menu.y, larg: 0, alt: 0 } : null,
    [menu],
  );
  const posMenu = usePosicaoPainel({
    aberto: menu !== null,
    painelRef: menuRef,
    medirAncora: medirAncoraMenu,
    opcoes: { verticalPreferida: "abaixo", horizontalPreferida: "direita" },
  });

  // A pata da pilha do canto pede o menu na posição dela.
  useEffect(() => {
    const abrir = (e: Event) => {
      const d = (e as CustomEvent<{ x?: number; y?: number }>).detail ?? {};
      setMenu({ x: d.x ?? 40, y: d.y ?? 40 });
    };
    window.addEventListener("cp:companheiro-menu-pet", abrir);
    return () => window.removeEventListener("cp:companheiro-menu-pet", abrir);
  }, []);

  // ── Balõezinhos de permanência (1, 5 e 50 min no site) ────────────────────
  // `dicaAtiva` diz QUAL balão está aberto (nunca mais de um); `dicaRef` dá a
  // posição dele para o menu abrir no lugar certo quando alguém clica;
  // `dicaBase` guarda o quanto ele sobe do rodapé (px) para ficar ACIMA da
  // pilha da esquerda sem cobrir o rádio nem o chat.
  const [dicaAtiva, setDicaAtiva] = useState<TipoDica | null>(null);
  const [dicaBase, setDicaBase] = useState<number | null>(null);
  /**
   * Texto sorteado do balão "fala" (o pet ativo fala). Guardado em estado —
   * não no ref — porque o JSX precisa do valor para renderizar. Só existe
   * enquanto `dicaAtiva === "fala"`.
   */
  const [dicaFala, setDicaFala] = useState<string | null>(null);
  /**
   * Dica educativa casada com a rota atual. Só existe enquanto
   * `dicaAtiva === "pagina"`.
   */
  const [dicaPagina, setDicaPagina] = useState<DicaPagina | null>(null);
  const dicaRef = useRef<HTMLButtonElement | null>(null);
  // Espelho da dica ativa em ref: o agendador lê aqui sem depender do estado
  // (o `setTimeout` fecharia sobre um valor velho de `dicaAtiva`).
  const dicaAtivaRef = useRef<TipoDica | null>(null);

  /**
   * Altura (px do rodapé) para o balão ficar acima de tudo que já mora no
   * canto esquerdo: o FAB/chat do Seu Nonô, a pata, a nuvem de boas-vindas e o
   * botão do rádio. Medir na hora evita cobrir um vizinho que só aparece em
   * certas situações (a nuvem, por exemplo, existe só na primeira visita).
   * Devolve `null` se nenhum vizinho for achado — aí o CSS de reserva manda.
   */
  const calcularBaseDica = useCallback((): number | null => {
    const topoDe = (seletor: string): number | null => {
      const el = document
        .querySelector<HTMLElement>(seletor)
        ?.closest<HTMLElement>("[data-arrastavel-caixa]");
      return el ? el.getBoundingClientRect().top : null;
    };
    const topos = [
      topoDe('[aria-label="Abrir assistente Seu Nonô"]'),
      topoDe('button[aria-controls="cp-radio-indice"]'),
    ].filter((t): t is number => t !== null);
    if (!topos.length) return null;
    return Math.max(8, window.innerHeight - Math.min(...topos) + 8);
  }, []);

  // Agenda CADA balão para o seu tempo, uma vez por sessão. Antes de aparecer:
  //  - se o painel do Seu Nonô estiver ABERTO (o FAB some do DOM quando abre,
  //    contrato do `SeuNono.tsx`), o balão cobriria a conversa;
  //  - se outro balão já estiver na tela.
  // Nos dois casos adia a vez e tenta de novo adiante, SEM gastar a marca da
  // sessão. A marca mora no `sessionStorage`; se o storage estiver bloqueado
  // (aba anônima), mostra mesmo assim — o pior caso é repetir, nunca omitir.
  useEffect(() => {
    const timers: number[] = [];
    const controle = { cancelado: false };

    const tentar = (d: AgendaDica) => {
      if (controle.cancelado) return;
      let visto = false;
      try {
        visto = window.sessionStorage.getItem(d.chave) === "1";
      } catch {
        // Sem storage: segue e mostra.
      }
      if (visto) return;
      // Sem bicho na tela não há fala: adia sem gastar a marca da sessão,
      // porque o leitor pode voltar a marcar um pet e merecer a fala depois.
      if (d.tipo === "fala" && petsRef.current.length === 0) {
        timers.push(window.setTimeout(() => tentar(d), 3000));
        return;
      }
      const chatAberto =
        document.querySelector('[aria-label="Abrir assistente Seu Nonô"]') === null;
      if (chatAberto || dicaAtivaRef.current !== null) {
        timers.push(window.setTimeout(() => tentar(d), 3000));
        return;
      }
      try {
        window.sessionStorage.setItem(d.chave, "1");
      } catch {
        // Sem storage: a dica ainda aparece nesta visita.
      }
      // Sorteia a fala do PET ATIVO no instante do gatilho — o mesmo `pets[0]`
      // que o JSX usa para mostrar a arte; assim bicho e fala nunca divergem.
      const fala =
        d.tipo === "fala"
          ? escolherFala(petsRef.current[0] ? petsRef.current[0].slug : "")
          : null;
      dicaAtivaRef.current = d.tipo;
      setDicaBase(calcularBaseDica());
      setDicaPagina(null);
      setDicaFala(fala);
      setDicaAtiva(d.tipo);
    };

    for (const d of AGENDA_DICAS) {
      timers.push(window.setTimeout(() => tentar(d), d.apareceMs));
    }
    return () => {
      controle.cancelado = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [calcularBaseDica]);

  /**
   * Fecha o balão aberto: libera a vez do próximo e limpa o texto. Usado pelo
   * prazo automático (WCAG: conteúdo temporizado) e pelo dismiss manual — o
   * balão de fala do pet aceita clique/toque e Enter/Espaço para sumir (pedido
   * do dono, 05/10/2026).
   */
  const fecharDica = useCallback(() => {
    dicaAtivaRef.current = null;
    setDicaAtiva(null);
    // Limpa o conteúdo dos balões de fala e de página junto com o tipo: sem
    // isso, o próximo balão reabriria com texto do anterior no primeiro
    // quadro (o estado do texto é separado do tipo).
    setDicaFala(null);
    setDicaPagina(null);
  }, []);

  // Some sozinho (WCAG: conteúdo temporizado) e libera a vez do próximo balão.
  // A dica de troca (o único botão) fica o prazo maior; os avisos, o curto.
  useEffect(() => {
    if (!dicaAtiva) return;
    const duracao = dicaAtiva === "troca" ? DICA_TROCA_VISIVEL_MS : DICA_VISIVEL_MS;
    const esconder = window.setTimeout(fecharDica, duracao);
    return () => window.clearTimeout(esconder);
  }, [dicaAtiva, fecharDica]);

  /**
   * Dica EDUCATIVA da página (balão "pagina"). Diferente dos outros quatro,
   * o gatilho é a ROTA, não o relógio: a cada troca de `pathname`, procuramos
   * uma dica cujo prefixo case. Só mostra se:
   *   - a rota ainda não teve a dica vista NESTA sessão (`sessionStorage` por
   *     prefixo, para não repetir nem em navegação de ida e volta);
   *   - nenhum outro balão está aberto e o chat do Seu Nonô está fechado (a
   *     mesma regra de "um por vez" do agendador temporal — por isso lê
   *     `dicaAtivaRef` e adia com `setTimeout` em vez de furar a fila).
   * O atraso inicial (curto) evita disputar o primeiro paint da página.
   *
   * Se o storage estiver bloqueado (aba anônima), mostra mesmo assim: o pior
   * caso é repetir, nunca omitir — mesma escolha do agendador temporal.
   */
  useEffect(() => {
    if (!pathname) return;
    const dica = dicaParaRota(pathname);
    if (!dica) return;
    const chave = `${CHAVE_DICA_PAGINA}${dica.prefixo}`;
    const controle = { cancelado: false, timer: 0 };

    const tentar = () => {
      if (controle.cancelado) return;
      let visto = false;
      try {
        visto = window.sessionStorage.getItem(chave) === "1";
      } catch {
        // Sem storage: segue e mostra.
      }
      if (visto) return;
      const chatAberto =
        document.querySelector('[aria-label="Abrir assistente Seu Nonô"]') === null;
      if (chatAberto || dicaAtivaRef.current !== null) {
        controle.timer = window.setTimeout(tentar, 3000);
        return;
      }
      try {
        window.sessionStorage.setItem(chave, "1");
      } catch {
        // Sem storage: a dica ainda aparece nesta visita.
      }
      dicaAtivaRef.current = "pagina";
      setDicaBase(calcularBaseDica());
      setDicaFala(null);
      setDicaPagina(dica);
      setDicaAtiva("pagina");
    };

    controle.timer = window.setTimeout(tentar, DICA_PAGINA_ATRASO_MS);
    return () => {
      controle.cancelado = true;
      window.clearTimeout(controle.timer);
    };
  }, [pathname, calcularBaseDica]);

  /**
   * Clique no balão de troca (1 min): fecha a dica e abre o menu de troca
   * ancorado na posição do balão.
   */
  const abrirMenuPeloBalao = useCallback(() => {
    dicaAtivaRef.current = null;
    setDicaAtiva(null);
    const r = dicaRef.current?.getBoundingClientRect();
    setMenu(r ? { x: r.left, y: r.top } : { x: 24, y: 40 });
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

  // ── Varredura de plataformas: o que da página vale como chão ──────────────
  // 1×/s forçado + em scroll/resize (rAF) + em mutações do DOM (com o mesmo
  // resfriamento) + na troca de rota. O resultado mora em `platsRef` e o
  // laço lê sem re-render.
  useEffect(() => {
    let ultimo = 0;
    let pendente = false;
    const varrer = (forcar = false) => {
      const agora = performance.now();
      if (!forcar && agora - ultimo < 800) return;
      ultimo = agora;
      platsRef.current = amostrarPlataformas();
    };
    varrer(true);
    const aoMexer = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => {
        pendente = false;
        varrer();
      });
    };
    window.addEventListener("scroll", aoMexer, { passive: true });
    window.addEventListener("resize", aoMexer);
    const obs = new MutationObserver(() => varrer());
    obs.observe(document.body, { childList: true, subtree: true });
    const t = window.setInterval(() => varrer(true), 2000);
    return () => {
      window.removeEventListener("scroll", aoMexer);
      window.removeEventListener("resize", aoMexer);
      obs.disconnect();
      window.clearInterval(t);
    };
  }, [pathname]);

  // ── Centro do alvo onde o líder para (logo acima dele, sem cobrir) ────────
  const pontoDoAlvo = useCallback((b: Bicho, larg: number): Ponto | null => {
    const el = b.alvoEl;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    const x = Math.min(
      window.innerWidth - larg - MARGEM,
      Math.max(MARGEM, r.left + r.width / 2 - larg / 2),
    );
    // pés do bicho = borda do container (BASE_BORDA) + altura; queremos os
    // pés 2 px acima do topo do alvo → y = H − r.top − BASE + 2.
    const y = Math.max(0, window.innerHeight - r.top - BASE_BORDA + 2);
    return { x, y };
  }, []);

  // ── O laço: percorre TODOS os bichos a cada quadro ────────────────────────
  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let anterior = performance.now();

    const passo = (agora: number) => {
      const dt = Math.min(0.05, (agora - anterior) / 1000);
      anterior = agora;
      const plataformas = platsRef.current;
      // Alcance do salto cresce com a tela: dá para subir em cartão alto
      // num monitor grande; no celular o pulo é mais curto (e honesto).
      const alcance = Math.min(420, Math.max(200, window.innerHeight * 0.45));

      for (const pet of petsRef.current) {
        const b = bichosRef.current.get(pet.slug);
        if (!b) continue;
        const larg = larguraBotao(pet);
        let estado: NomeEstado = "idle";

        // PRIORIDADE MÁXIMA: enquanto o prazo de "failed" não vence, o bicho
        // congela no estado triste e ignora voo, queda e passeio. Quando vence,
        // o bloco normal retoma sozinho (o ref aponta para um instante passado).
        if (agora < falhaAteRef.current) {
          estado = "failed";
        } else if (b.voo) {
          const voo = b.voo;
          const t = Math.min(1, (agora - voo.inicio) / voo.dur);
          const destino =
            voo.fase === "ida" ? pontoDoAlvo(b, larg) ?? voo.destino : voo.destino;
          b.pos = bezier(voo.p0, voo.ctrl, destino, suavizar(t));
          // Ida, salto e pouso são voos no AR (jumping = batendo asas);
          // a volta ao chão é corrida.
          estado = voo.fase === "volta" ? "running" : "jumping";
          if (t >= 1) {
            b.voo = null;
            if (voo.fase === "ida") b.chegouEm = agora; // dwell no alvo
            if (voo.fase === "pousar") {
              b.pausaAte = agora + 600; // respira
              // Fim da descida do arrasto: agora sim a posição é a final —
              // grava para o bicho voltar aqui no próximo acesso.
              salvarPos(pet.slug, b.pos);
            }
            if (voo.fase === "salto") b.pausaAte = agora + 120;
            if (voo.fase === "volta") {
              // Ciclo do alvo fechado: solta o alvo para a PRÓXIMA resposta
              // do Seu Nonô poder guiar de novo (sem isso, o observador de
              // mutações ficaria bloqueado para sempre no antigo alvo).
              b.alvoEl = null;
              b.queda = 0;
            }
          }
        } else if (b.chegouEm !== null) {
          // Parada no alvo: acena (`waving`) por 1,4 s e depois "revisa"
          // o alvo (`review`) enquanto o anel pulsa. Depois, voo de volta.
          estado = agora - b.chegouEm <= 1400 ? "waving" : "review";
          if (agora - b.chegouEm > ESPERA_NO_ALVO_MS) {
            b.chegouEm = null;
            const p0 = { ...b.pos };
            const largClamp = Math.max(MARGEM, window.innerWidth - larg - MARGEM);
            const x = Math.max(MARGEM, Math.min(largClamp, p0.x));
            // Volta pousa na superfície sob o x de destino (chão ou teto).
            const destino: Ponto = {
              x,
              y: superficieSob(plataformas, x + larg / 2, p0.y),
            };
            b.voo = {
              fase: "volta",
              p0,
              ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 80 },
              inicio: agora,
              dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + Math.abs(p0.x - destino.x)),
              destino,
            };
          }
        } else if (b.arrastando || semMovimento) {
          // Arrastando o dedo nele (ou movimento reduzido): parado.
          estado = "idle";
        } else {
          const centro = b.pos.x + larg / 2;
          const sob = superficieSob(plataformas, centro, b.pos.y);

          if (b.pos.y > sob + 0.5) {
            // No ar: saiu da borda de uma plataforma (ou do soltar sem arco).
            // Gravidade até a primeira superfície sob os pés.
            const q = passoQueda(b.pos.y, b.queda, dt, sob);
            b.pos.y = q.y;
            b.queda = q.vel;
            estado = "jumping"; // asas batendo na descida
            if (q.pousou) {
              b.queda = 0;
              b.pausaAte = agora + 250;
              estado = "idle";
            }
          } else {
            // No chão: cola na superfície e passeia (anda, pula, pausa).
            b.queda = 0;
            b.pos.y = sob;
            if (agora >= b.pausaAte) {
              b.pos.x += b.dir * VELOCIDADE * dt;
              const maxX = window.innerWidth - larg - MARGEM;
              if (b.pos.x <= MARGEM) {
                b.pos.x = MARGEM;
                b.dir = 1;
              } else if (b.pos.x >= maxX) {
                b.pos.x = maxX;
                b.dir = -1;
              }
              // Encontro com degrau à frente dentro do alcance: salto.
              const ponta = b.dir > 0 ? b.pos.x + larg : b.pos.x;
              const degrau = plataformaSalto(plataformas, {
                yAgora: b.pos.y,
                xPonta: ponta,
                alcance,
              });
              if (degrau) {
                const p0 = { ...b.pos };
                const destino = alvoDoSalto(degrau, b.dir, larg);
                b.voo = {
                  fase: "salto",
                  p0,
                  ctrl: {
                    x: (p0.x + destino.x) / 2,
                    y: Math.max(p0.y, destino.y) + 46,
                  },
                  inicio: agora,
                  dur: Math.min(700, 320 + Math.abs(destino.y - p0.y) * 1.1),
                  destino,
                };
                estado = "jumping";
              } else {
                estado = b.dir > 0 ? "running-right" : "running-left";
                if (Math.random() < 0.004) {
                  b.pausaAte = agora + 900 + Math.random() * 1800;
                }
              }
            } else {
              // Pausa do passeio: `waiting` (olha em volta).
              estado = "waiting";
            }
          }
        }

        if (b.estado.nome !== estado) b.estado = { nome: estado, inicio: agora };

        // Escrita direta no DOM: caixa (posição) e sprite (quadro).
        const caixa = caixasRef.current.get(pet.slug);
        if (caixa) {
          caixa.style.transform = `translate3d(${Math.round(b.pos.x)}px, ${Math.round(-b.pos.y)}px, 0)`;
        }
        const span = spritesRef.current.get(pet.slug);
        if (span) {
          const base = Math.floor((agora - b.estado.inicio) / PERIODO_POR_ESTADO[estado]);
          span.style.backgroundPosition = posicao(
            pet,
            estado,
            base % quadrosDe(pet, estado),
          );
        }
      }

      // Anel pulsante sobre o alvo durante o "dwell" (só existe um alvo:
      // só o líder voa). `display` (não `opacity`): a animação
      // `animate-ping` mexe na opacidade e venceria o estilo inline.
      const anel = anelRef.current;
      if (anel) {
        let ocupado: Bicho | null = null;
        for (const pet of petsRef.current) {
          const b = bichosRef.current.get(pet.slug);
          if (b && b.chegouEm !== null && b.alvoEl) {
            ocupado = b;
            break;
          }
        }
        if (ocupado && ocupado.alvoEl) {
          const r = ocupado.alvoEl.getBoundingClientRect();
          anel.style.left = `${r.left - 6}px`;
          anel.style.top = `${r.top - 6}px`;
          anel.style.width = `${r.width + 12}px`;
          anel.style.height = `${r.height + 12}px`;
          anel.style.display = "block";
        } else {
          anel.style.display = "none";
        }
      }

      raf = requestAnimationFrame(passo);
    };

    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [pontoDoAlvo]);

  // ── O líder voa em arco até um alvo ──────────────────────────────────────
  const voarPara = useCallback(
    (el: HTMLElement) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const lider = petsRef.current[0];
      if (!lider) return;
      const b = bichosRef.current.get(lider.slug);
      if (!b || b.arrastando) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // fora da tela
      const larg = larguraBotao(lider);
      b.alvoEl = el;
      const p0 = { ...b.pos };
      const destino: Ponto =
        pontoDoAlvo(b, larg) ??
        { x: r.left, y: Math.max(0, window.innerHeight - r.top - BASE_BORDA + 2) };
      b.voo = {
        fase: "ida",
        p0,
        ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 90 },
        inicio: performance.now(),
        dur: Math.min(
          DUR_VOO_MAX,
          DUR_VOO_MIN + (Math.abs(p0.x - destino.x) + Math.abs(p0.y - destino.y)) * 0.4,
        ),
        destino,
      };
      b.chegouEm = null;
    },
    [pontoDoAlvo],
  );

  /** O líder está no meio de um ciclo de alvo (voo, dwell ou alvo preso)? */
  const liderOcupado = useCallback((): boolean => {
    const lider = petsRef.current[0];
    if (!lider) return false;
    const b = bichosRef.current.get(lider.slug);
    return !!b && (b.voo !== null || b.chegouEm !== null || b.alvoEl !== null);
  }, []);

  // Nova resposta do Seu Nonô muda o DOM: procura um alvo e voa até ele.
  useEffect(() => {
    const procurar = () => {
      if (liderOcupado()) return;
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
  }, [pathname, voarPara, liderOcupado]);

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

  // ── Arrasto POR PET: apertou um, move só ele ──────────────────────────────
  const pegas = useRef(
    new Map<string, { px: number; py: number; x0: number; y0: number; moveu: boolean }>(),
  );

  const aoPegar = useCallback((e: ReactPointerEvent<HTMLElement>, pet: PetCompanheiro) => {
    const b = bichosRef.current.get(pet.slug);
    if (!b) return;
    pegas.current.set(pet.slug, {
      px: e.clientX,
      py: e.clientY,
      x0: b.pos.x,
      y0: b.pos.y,
      moveu: false,
    });
    b.arrastando = true;
    b.alvoEl = null;
    b.voo = null;
    b.chegouEm = null;
    b.queda = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const aoMover = useCallback((e: ReactPointerEvent<HTMLElement>, pet: PetCompanheiro) => {
    const g = pegas.current.get(pet.slug);
    const b = bichosRef.current.get(pet.slug);
    if (!g || !b) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) g.moveu = true;
    const larg = larguraBotao(pet);
    b.pos.x = Math.max(
      MARGEM,
      Math.min(window.innerWidth - larg - MARGEM, g.x0 + dx),
    );
    b.pos.y = Math.max(0, g.y0 - dy);
  }, []);

  const aoSoltar = useCallback((pet: PetCompanheiro) => {
    const g = pegas.current.get(pet.slug);
    pegas.current.delete(pet.slug);
    const b = bichosRef.current.get(pet.slug);
    if (!b) return;
    b.arrastando = false;
    b.pausaAte = performance.now() + 600;
    // Gesto foi mover: o clique que dispara logo em seguida NÃO abre o
    // Seu Nonô (senão arrastar sempre abriria o painel por acidente).
    if (g?.moveu) b.semCliqueAte = performance.now() + 350;

    const larg = larguraBotao(pet);
    const sob = superficieSob(platsRef.current, b.pos.x + larg / 2, b.pos.y);
    const altura = b.pos.y - sob;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (altura > 12 && !reduzido) {
      // Soltou NO AR? Desce voando em arco que MERGULHA abaixo da linha
      // reta — pedido do dono (02/10/2026) — e pousa na superfície de baixo.
      const p0 = { ...b.pos };
      const largClamp = Math.max(MARGEM, window.innerWidth - larg - MARGEM);
      const destino: Ponto = {
        x: Math.max(MARGEM, Math.min(largClamp, p0.x)),
        y: sob,
      };
      b.voo = {
        fase: "pousar",
        p0,
        // Controle ABAIXO da linha reta (meia altura − 40 px): o arco
        // cai, em vez de subir como os voos de ida/volta do alvo.
        ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(0, p0.y / 2 - 40) },
        inicio: performance.now(),
        dur: Math.min(800, Math.max(400, 400 + altura * 4)),
        destino,
      };
      b.chegouEm = null;
      b.alvoEl = null;
    } else if (altura > 0) {
      // Rentes do chão (ou movimento reduzido): cola na hora.
      b.pos.y = sob;
      b.queda = 0;
    }

    // Sem voo (já pousou): grava agora. Com voo de "pousar", a gravação
    // acontece quando o arco termina (no laço), já com a posição final.
    if (g?.moveu && !b.voo) salvarPos(pet.slug, b.pos);
  }, []);

  /** Clique no bicho: abre o Seu Nonô — salvo se o gesto foi arrasto. */
  const aoClicar = useCallback((pet: PetCompanheiro) => {
    const b = bichosRef.current.get(pet.slug);
    if (b && performance.now() < b.semCliqueAte) return;
    window.dispatchEvent(new CustomEvent("abrir-seu-nono"));
  }, []);

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

      {/* Um `div` fixo POR bicho: cada um tem posição, arrasto e queda
          próprios. O container é click-through; só o sprite pega o
          ponteiro. `data-nao-plataforma`: bichos não são chão uns dos
          outros. */}
      {pets.map((p) => {
        const escala = escalaDe(p);
        const larg = larguraDe(p);
        const alt = alturaDe(p);
        return (
          <div
            key={p.slug}
            ref={(el) => {
              if (el) {
                caixasRef.current.set(p.slug, el);
                const b = bichosRef.current.get(p.slug);
                el.style.transform = `translate3d(${Math.round(b ? b.pos.x : 24)}px, ${Math.round(-(b ? b.pos.y : 0))}px, 0)`;
              } else {
                caixasRef.current.delete(p.slug);
              }
            }}
            data-nao-plataforma
            className="pointer-events-none fixed bottom-2 left-0 z-40 print:hidden"
            style={{ willChange: "transform" }}
          >
            <button
              type="button"
              onClick={() => aoClicar(p)}
              onContextMenu={aoMenuDireito}
              onPointerDown={(e) => aoPegar(e, p)}
              onPointerMove={(e) => aoMover(e, p)}
              onPointerUp={() => aoSoltar(p)}
              onPointerCancel={() => aoSoltar(p)}
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
          </div>
        );
      })}

      {/* Balõezinhos de permanência (1, 5 e 50 min; dono, 04/10/2026): todos no
          mesmo lugar, ACIMA da pilha do canto esquerdo (FAB, pata e rádio) para
          não cobrir o rádio nem o botão do chat. Só UM aparece por vez — o
          agendador adia a vez se houver outro aberto. `data-nao-plataforma`: a
          UI flutuante não é chão dos bichos.

          - 1 min (`troca`): botão que abre o menu de troca/tirar bichinhos;
          - 5 min (`frida`): o PÁSSARO PADRÃO cita Frida Kahlo. A arte é sempre
            a do pássaro padrão, mesmo com outro bicho ativo (a fala é dele);
          - 50 min (`alongar`): o companheiro ativo lembra de alongar.

          Os dois últimos são avisos temporizados (`role="status"` +
          `aria-live="polite"`), sem ação no clique — somem sozinhos. */}
      {dicaAtiva === "troca" && (
        <button
          ref={dicaRef}
          type="button"
          onClick={abrirMenuPeloBalao}
          data-cp-dica-companheiro=""
          data-nao-plataforma
          aria-label="Se quiser tirar o pássaro ou adicionar outros companheiros, clique aqui"
          style={dicaBase !== null ? { bottom: dicaBase } : undefined}
          className="cp-painel-entra fixed bottom-[max(11rem,calc(env(safe-area-inset-bottom)_+_10rem))] left-4 z-[55] flex w-[min(calc(100vw-2rem),13rem)] items-start gap-1.5 rounded-xl border border-border/70 bg-surface/85 p-3 text-left shadow-md backdrop-blur-sm transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {pets[0] ? <PetIcone pet={pets[0]} altura={16} /> : null}
          <span className="text-xs font-medium leading-snug text-text">
            Se quiser tirar o pássaro ou adicionar outros companheiros, clique aqui
          </span>
        </button>
      )}

      {dicaAtiva === "frida" && (
        <div
          data-cp-dica-frida=""
          data-nao-plataforma
          role="status"
          aria-live="polite"
          style={dicaBase !== null ? { bottom: dicaBase } : undefined}
          className="cp-painel-entra fixed bottom-[max(11rem,calc(env(safe-area-inset-bottom)_+_10rem))] left-4 z-[55] flex w-[min(calc(100vw-2rem),14rem)] items-start gap-1.5 rounded-xl border border-border/70 bg-surface/85 p-3 text-left shadow-md backdrop-blur-sm"
        >
          <PetIcone pet={PET_INICIAL} altura={16} />
          <span className="text-xs font-medium leading-snug text-text">
            {TEXTO_DICA_FRIDA}
          </span>
        </div>
      )}

      {dicaAtiva === "alongar" && (
        <div
          data-cp-dica-alongar=""
          data-nao-plataforma
          role="status"
          aria-live="polite"
          style={dicaBase !== null ? { bottom: dicaBase } : undefined}
          className="cp-painel-entra fixed bottom-[max(11rem,calc(env(safe-area-inset-bottom)_+_10rem))] left-4 z-[55] flex w-[min(calc(100vw-2rem),14rem)] items-start gap-1.5 rounded-xl border border-border/70 bg-surface/85 p-3 text-left shadow-md backdrop-blur-sm"
        >
          {pets[0] ? <PetIcone pet={pets[0]} altura={16} /> : null}
          <span className="text-xs font-medium leading-snug text-text">
            {TEXTO_DICA_ALONGAR}
          </span>
        </div>
      )}

      {/* Fala aleatória do pet ATIVO (`pets[0]`), sorteada em `lib/companheiro/falas.ts`
          e mostrada uma vez por sessão. A arte é a do próprio pet que fala.
          O balão é INTERATIVO: um clique/toque (ou Enter/Espaço, porque é um
          `<button>`) fecha na hora, sem esperar o prazo automático. O
          `role="status"`/`aria-live` fica no wrapper para o leitor de tela
          anunciar a fala e depois o próprio botão anuncia a ação. */}
      {dicaAtiva === "fala" && dicaFala && (
        <div
          role="status"
          aria-live="polite"
          data-cp-dica-fala=""
          data-nao-plataforma
          style={dicaBase !== null ? { bottom: dicaBase } : undefined}
          className="cp-painel-entra fixed bottom-[max(11rem,calc(env(safe-area-inset-bottom)_+_10rem))] left-4 z-[55] w-[min(calc(100vw-2rem),14rem)]"
        >
          <button
            type="button"
            onClick={fecharDica}
            aria-label={`${dicaFala} — toque para fechar o recado`}
            title="Toque para fechar"
            className="flex w-full cursor-pointer items-start gap-1.5 rounded-xl border border-border/70 bg-surface/85 p-3 text-left shadow-md backdrop-blur-sm transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {pets[0] ? <PetIcone pet={pets[0]} altura={16} /> : null}
            <span className="text-xs font-medium leading-snug text-text">{dicaFala}</span>
            <X size={12} aria-hidden="true" className="mt-0.5 shrink-0 text-text-soft" />
          </button>
        </div>
      )}

      {/* Dica educativa da página (`lib/companheiro/dicas-pagina.ts`), uma vez
          por sessão e por prefixo de rota. Com `fonte`, o conteúdo é um
          `next/link` para a página oficial; sem fonte, é aviso simples. O
          `role="status"`/`aria-live` fica no container para todo balão ser
          anunciado pelo leitor de tela. */}
      {dicaAtiva === "pagina" && dicaPagina && (
        <div
          data-cp-dica-pagina=""
          data-nao-plataforma
          role="status"
          aria-live="polite"
          style={dicaBase !== null ? { bottom: dicaBase } : undefined}
          className="cp-painel-entra fixed bottom-[max(11rem,calc(env(safe-area-inset-bottom)_+_10rem))] left-4 z-[55] w-[min(calc(100vw-2rem),16rem)] rounded-xl border border-border/70 bg-surface/85 p-3 text-left shadow-md backdrop-blur-sm"
        >
          {dicaPagina.fonte ? (
            <Link
              href={dicaPagina.fonte.url}
              className="flex items-start gap-1.5 rounded-lg text-left hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {pets[0] ? <PetIcone pet={pets[0]} altura={16} /> : null}
              <span className="text-xs font-medium leading-snug text-text">
                {dicaPagina.texto}{" "}
                <span className="whitespace-nowrap text-primary underline">
                  {dicaPagina.fonte.label}
                </span>
              </span>
            </Link>
          ) : (
            <div className="flex items-start gap-1.5">
              {pets[0] ? <PetIcone pet={pets[0]} altura={16} /> : null}
              <span className="text-xs font-medium leading-snug text-text">
                {dicaPagina.texto}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Menu de troca em checkboxes (vários na tela): fundo fecha no
          clique fora; o menu fica por cima. `data-nao-plataforma`: a UI
          flutuante não é terreno dos bichos. */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            data-nao-plataforma
            onPointerDown={() => setMenu(null)}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            role="menu"
            aria-label="Escolher os bichinhos do companheiro"
            data-nao-plataforma
            // `overscroll-contain`: a roda do mouse rola a lista de bichinhos
            // e não vaza para a página quando chega ao fim (05/10/2026).
            className="fixed z-[70] max-h-[60vh] w-60 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-2 shadow-lg"
            style={{
              left: posMenu ? Math.round(posMenu.posicao.x) : menu.x,
              top: posMenu ? Math.round(posMenu.posicao.y) : menu.y,
              maxHeight: posMenu ? Math.round(posMenu.posicao.altura) : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2 px-2 pb-1">
              <p className="text-[0.7rem] font-medium text-text-soft">
                Marque quem anda na tela (pode ser mais de um):
              </p>
              <button
                type="button"
                onClick={() => setMenu(null)}
                aria-label="Fechar seletor de bichinhos"
                title="Fechar"
                className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-text-soft hover:bg-surface-2"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            {/* "Remover todos" vem PRIMEIRO, antes dos bichinhos (pedido do
                dono, 04/10/2026): é a ação de limpar a tela, não uma escolha
                de pet — por isso abre a lista e não mistura com ela. */}
            <button
              type="button"
              onClick={() => {
                limparPets();
                setMenu(null);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-text-soft hover:bg-surface-2"
            >
              Remover todos
            </button>
            <div className="my-1 border-t border-border" role="separator" />
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
                      <span className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="inline-block w-3 shrink-0 text-center"
                        >
                          {marcado ? "✓" : ""}
                        </span>
                        <PetIcone pet={p} altura={16} />
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
