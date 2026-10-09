/**
 * @file passo.ts
 * @description Máquina de estados do passeio/voo do companheiro flutuante —
 * a lógica PURA do laço de animação que antes vivia inteira dentro do
 * `passo()` de `CompanheiroFlutuante.tsx` (medido em 09/10/2026: cc 36,
 * 150 linhas, 7 aninhamentos — o pior hotspot do arquivo, saúde 7,03).
 *
 * Papel no portal: cada bichinho decide sozinho, quadro a quadro, o que
 * fazer — congelar no "failed", voar até o alvo do Seu Nonô, acenar e
 * revisar no dwell, cair da borda, andar ou pular degrau. Este módulo não
 * toca em DOM, `window`, `requestAnimationFrame` nem `localStorage`: as
 * entradas são números e objetos, a saída é o novo estado do bicho. O
 * componente consome o resultado e escreve `transform`/`backgroundPosition`
 * no DOM (mesma separação física × decisão de `plataformas.ts`).
 *
 * POR QUE EXISTE (refator de 09/10/2026, CodeScene):
 * - o `passo` original juntava 5 ramos de estado, 4 fases de voo, gravidade,
 *   paredes, salto e sorteio de pausa num só corpo — qualquer mexida em um
 *   ramo arriscava os outros (número/posição errado é dano, AGENTS §7);
 * - aqui cada ramo é função própria, com cc ≤ 5 e prova de equivalência
 *   diferencial em `passo.test.ts` (mesma entrada → mesma saída do código
 *   antigo, colado à mão como referência no teste);
 * - o aleatório do passeio é injetado (`aleatorio: () => number`): o teste
 *   cospe sequência determinística e o componente passa `Math.random`.
 *
 * Coordenadas (iguais a `plataformas.ts`): x em px de viewport; y é altura
 * ACIMA DO CHÃO (chão = 0); a largura `larg` é a caixa do botão do pet na
 * tela (sprite + 8 px de respiro).
 */

import {
  alvoDoSalto,
  passoQueda,
  plataformaSalto,
  superficieSob,
  type Plataforma,
  type Ponto,
} from "./plataformas";

// ── Física do passeio/voo (constantes do laço; valores medidos 02–03/10) ──
/** Velocidade do passeio, em px por segundo andando. */
export const VELOCIDADE = 34;
/** Folga das bordas da tela: o bicho nunca encosta na borda. */
export const MARGEM = 12;
/** Duração mínima do voo, em ms (curto demais parece teleporte). */
export const DUR_VOO_MIN = 420;
/** Duração máxima do voo, em ms (longo demais cansa quem espera). */
export const DUR_VOO_MAX = 900;
/** Espera no alvo do Seu Nonô antes do voo de volta, em ms. */
export const ESPERA_NO_ALVO_MS = 2800;
/** Ms do aceno (`waving`) antes de virar `review` no alvo. */
const DURACAO_ACENO_MS = 1400;

/**
 * Os nove estados do atlas do Petdex — a MESMA ordem de `LINHAS_ATLAS`
 * (`app/components/companheiroPets.ts`), porque `LINHAS_ATLAS.indexOf()`
 * é o índice da linha na folha de arte. O tipo mora aqui (e não é
 * importado de lá) para a lógica pura não depender de `app/`; o teste
 * `passo.test.ts` confere que as duas listas continuam casadas.
 */
export type NomeEstado =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

/** Lista em tempo de execução do mesmo union — usada só pelo teste. */
export const NOMES_ESTADO: readonly NomeEstado[] = [
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review",
];

/** Um voo em arco (bezier quadrática) até um destino. */
export interface Voo {
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
 * volta ao lugar de quando saiu. Tipos e `criarBicho` moram aqui porque a
 * máquina de estados é a dona do formato; o componente só lê/escreve.
 */
export interface Bicho {
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
export function criarBicho(x: number): Bicho {
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

/** Ponto de uma curva de Bézier quadrática (arco do voo, "teacher pace"). */
export function bezier(p0: Ponto, c: Ponto, p1: Ponto, t: number): Ponto {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

/** Suaviza a velocidade do voo (parte devagar, chega devagar). */
export function suavizar(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Alcance do salto em degrau: cresce com a altura da tela (dá para subir em
 * cartão alto num monitor grande; no celular o pulo é mais curto e honesto).
 * Teto 420 px, piso 200 px — medidos 03/10/2026.
 */
export function alcanceSalto(alturaJanela: number): number {
  return Math.min(420, Math.max(200, alturaJanela * 0.45));
}

// ── Máquina de estados: um ramo por função ─────────────────────────────────

/**
 * Quadro de um voo em andamento: interpola a posição na bezier, escolhe o
 * estado animado da fase e, se o voo terminou, aplica o efeito do fim
 * (dwell, pouso com gravação, pausa do salto ou soltura do alvo).
 *
 * @param b bicho com `voo` não nulo (o chamador garante);
 * @param agora instante do quadro, em ms (`performance.now`);
 * @param larg largura da caixa do bicho na tela;
 * @param destinoIda destino recalculado NESTE quadro quando a fase é
 *   "ida" (o alvo do Seu Nonô segue a rolagem); `null` usa o destino
 *   gravado no voo — mesmaprecedência do `??` original;
 * @returns estado animado e se a posição final deve ser gravada no
 *   `localStorage` (só a descida "pousar" grava — ver componente).
 */
export function passoVoo(b: Bicho, c: ContextoPasso): { estado: NomeEstado; gravarPosicao: boolean } {
  const voo = b.voo;
  if (!voo) return { estado: "idle", gravarPosicao: false };
  const t = Math.min(1, (c.agora - voo.inicio) / voo.dur);
  const destino = voo.fase === "ida" ? c.destinoIda ?? voo.destino : voo.destino;
  b.pos = bezier(voo.p0, voo.ctrl, destino, suavizar(t));
  const estado = ESTADO_VOO[voo.fase];
  const gravarPosicao = t >= 1 ? concluirVoo(b, voo, c.agora) : false;
  return { estado, gravarPosicao };
}

/** Estado animado de cada fase: ida/salto/pouso batem asas; volta é corrida. */
const ESTADO_VOO: Record<Voo["fase"], NomeEstado> = {
  ida: "jumping",
  volta: "running",
  pousar: "jumping",
  salto: "jumping",
};

/**
 * Fim do voo (t ≥ 1): solta o voo e aplica o efeito da fase. Os quatro
 * `if` originais eram encadeados e independentes — como a fase é um valor
 * só, a cadeia com retorno é equivalente e preserva a ordem.
 *
 * @returns `true` quando a fase "pousar" terminou: o chamador grava a
 *   posição final no storage (no original, `salvarPos` morava aqui dentro;
 *   saiu para o módulo continuar puro — DOM/storage são do componente).
 */
function concluirVoo(b: Bicho, voo: Voo, agora: number): boolean {
  b.voo = null;
  if (voo.fase === "ida") {
    b.chegouEm = agora; // dwell no alvo
    return false;
  }
  if (voo.fase === "pousar") {
    b.pausaAte = agora + 600; // respira
    return true;
  }
  if (voo.fase === "salto") {
    b.pausaAte = agora + 120;
    return false;
  }
  // Volta: ciclo do alvo fechado — solta o alvo para a PRÓXIMA resposta do
  // Seu Nonô poder guiar de novo (sem isso, o observador de mutações
  // ficaria bloqueado para sempre no antigo alvo).
  b.alvoEl = null;
  b.queda = 0;
  return false;
}

/**
 * Parada no alvo (dwell): acena (`waving`) por 1,4 s e depois "revisa" o
 * alvo (`review`) enquanto o anel pulsa. Ao estourar `ESPERA_NO_ALVO_MS`,
 * cria o voo de volta pousando na superfície sob o x de destino.
 * Devolve o estado DESTE quadro (waving/review) mesmo quando o voo de
 * volta nasce aqui — o voo assume o controle no quadro seguinte, igual ao
 * original.
 */
export function passoDwell(
  b: Bicho,
  c: { agora: number; plataformas: readonly Plataforma[]; larg: number; largJanela: number },
): NomeEstado {
  const chegouEm = b.chegouEm;
  if (chegouEm === null) return "idle"; // defesa: o chamador só chama com dwell ativo
  const estado: NomeEstado =
    c.agora - chegouEm <= DURACAO_ACENO_MS ? "waving" : "review";
  if (c.agora - chegouEm > ESPERA_NO_ALVO_MS) {
    b.chegouEm = null;
    const p0 = { ...b.pos };
    const largClamp = Math.max(MARGEM, c.largJanela - c.larg - MARGEM);
    const x = Math.max(MARGEM, Math.min(largClamp, p0.x));
    const destino: Ponto = {
      x,
      y: superficieSob(c.plataformas, x + c.larg / 2, p0.y),
    };
    b.voo = {
      fase: "volta",
      p0,
      ctrl: { x: (p0.x + destino.x) / 2, y: Math.max(p0.y, destino.y) + 80 },
      inicio: c.agora,
      dur: Math.min(DUR_VOO_MAX, DUR_VOO_MIN + Math.abs(p0.x - destino.x)),
      destino,
    };
  }
  return estado;
}

/**
 * O que um quadro NO CHÃO precisa — o subconjunto de `ContextoPasso` que
 * a gravidade e o passeio enxergam. Tipo nomeado (e não objeto inline)
 * porque os três helpers privados de passeio também o usam: assim a
 * assinatura deles é `c` e não uma lista de números soltos — o que
 * além de legível tira o módulo do aviso *Primitive Obsession* do
 * CodeScene (medido 09/10/2026: 40,4% dos argumentos eram primitivos,
 * teto 30%).
 */
type ContextoChao = Pick<
  ContextoPasso,
  "agora" | "dt" | "plataformas" | "larg" | "alcance" | "largJanela" | "aleatorio"
>;

/**
 * Um quadro de terra (sem voo, sem dwell): gravidade quando o pé está no
 * ar, ou o passeio no chão (anda, vira na borda, salta degrau, pausa).
 */
export function passoTerra(
  b: Bicho,
  c: ContextoChao,
): NomeEstado {
  const centro = b.pos.x + c.larg / 2;
  const sob = superficieSob(c.plataformas, centro, b.pos.y);
  if (b.pos.y > sob + 0.5) return passoQuedaLivre(b, c, sob);
  return passoPasseio(b, c, sob);
}

/**
 * Queda livre: saiu da borda de uma plataforma (ou do soltar sem arco).
 * Gravidade até a primeira superfície sob os pés; asas batendo (`jumping`)
 * na descida; ao pousar, cola e respira 250 ms em `idle`.
 */
function passoQuedaLivre(
  b: Bicho,
  c: { agora: number; dt: number },
  sob: number,
): NomeEstado {
  const q = passoQueda(b.pos.y, b.queda, c.dt, sob);
  b.pos.y = q.y;
  b.queda = q.vel;
  if (!q.pousou) return "jumping"; // asas batendo na descida
  b.queda = 0;
  b.pausaAte = c.agora + 250;
  return "idle";
}

/**
 * Passeio no chão: cola na superfície e anda; vira nas bordas da tela;
 * salta se achar degrau à frente no alcance; senão corre na direção atual
 * e ocasionalmente para para olhar em volta (`waiting`).
 */
function passoPasseio(
  b: Bicho,
  c: ContextoChao,
  sob: number,
): NomeEstado {
  b.queda = 0;
  b.pos.y = sob;
  if (c.agora < b.pausaAte) return "waiting"; // pausa do passeio: olha em volta
  b.pos.x += b.dir * VELOCIDADE * c.dt;
  virarNasBordas(b, c);
  const degrau = acharDegrau(b, c);
  if (degrau) return iniciarSalto(b, degrau, c);
  // Pausa rara do passeio: 0,4% dos quadros entram; a duração usa o
  // SEGUNDO sorteio — contagem de chamadas do aleatório preservada.
  if (c.aleatorio() < 0.004) {
    b.pausaAte = c.agora + 900 + c.aleatorio() * 1800;
  }
  return b.dir > 0 ? "running-right" : "running-left";
}

/** Vira o bicho ao encostar na margem esquerda ou direita da tela. */
function virarNasBordas(b: Bicho, c: ContextoChao): void {
  const maxX = c.largJanela - c.larg - MARGEM;
  if (b.pos.x <= MARGEM) {
    b.pos.x = MARGEM;
    b.dir = 1;
  } else if (b.pos.x >= maxX) {
    b.pos.x = maxX;
    b.dir = -1;
  }
}

/** Degrau mais alto alcançável à frente do pé, ou `null`. */
function acharDegrau(b: Bicho, c: ContextoChao): Plataforma | null {
  // A ponta é a borda dianteira NO SENTIDO DO PASSO: o bicho "enxerga"
  // à frente da caixa inteira quando anda para a direita.
  const ponta = b.dir > 0 ? b.pos.x + c.larg : b.pos.x;
  return plataformaSalto(c.plataformas, {
    yAgora: b.pos.y,
    xPonta: ponta,
    alcance: c.alcance,
  });
}

/**
 * Inicia o salto em arco curto até o degrau: `jumping` (asas batendo) e
 * pausa de 120 ms ao pousar (efeito aplicado por `concluirVoo`).
 */
function iniciarSalto(b: Bicho, degrau: Plataforma, c: ContextoChao): NomeEstado {
  const p0 = { ...b.pos };
  const destino = alvoDoSalto(degrau, b.dir, c.larg);
  b.voo = {
    fase: "salto",
    p0,
    ctrl: {
      x: (p0.x + destino.x) / 2,
      y: Math.max(p0.y, destino.y) + 46,
    },
    inicio: c.agora,
    dur: Math.min(700, 320 + Math.abs(destino.y - p0.y) * 1.1),
    destino,
  };
  return "jumping";
}

/** Contexto imutável de um quadro de `passoBicho` (tudo em números). */
export interface ContextoPasso {
  /** Instante do quadro, em ms (`performance.now`). */
  agora: number;
  /** Delta do quadro em segundos, com teto de 50 ms (pulo de aba gelada). */
  dt: number;
  /** Plataformas amostradas da página (chão). */
  plataformas: readonly Plataforma[];
  /** Largura da caixa do bicho na tela. */
  larg: number;
  /** Alcance do salto em degrau (`alcanceSalto`). */
  alcance: number;
  /** `prefers-reduced-motion: reduce` — bicho fica parado onde está. */
  semMovimento: boolean;
  /** Página 404: bicho congela no estado triste (prioridade máxima). */
  emFalha: boolean;
  /** Largura da janela em px (paredes do passeio). */
  largJanela: number;
  /** Destino "ida" recalculado neste quadro, ou `null`. */
  destinoIda: Ponto | null;
  /** Fonte de aleatoriedade injetada — o componente passa `Math.random`. */
  aleatorio: () => number;
}

/**
 * Um quadro da vida de UM bicho: a máquina de estados completa, na ORDEM
 * original do `passo` (falha > voo > dwell > parado > terra). `b` é
 * mutado no lugar (pos, voo, pausa, dir, queda) — o chamador é o laço do
 * componente, que já era dono do objeto.
 *
 * @returns o estado animado do quadro e se a posição final deve ser
 *   gravada no `localStorage` (fim do voo "pousar").
 */
export function passoBicho(
  b: Bicho,
  c: ContextoPasso,
): { estado: NomeEstado; gravarPosicao: boolean } {
  // PRIORIDADE MÁXIMA: enquanto o prazo de "failed" não vence, o bicho
  // congela no estado triste e ignora voo, queda e passeio. Quando vence,
  // o bloco normal retoma sozinho (o ref aponta para um instante passado).
  if (c.emFalha) return { estado: "failed", gravarPosicao: false };
  if (b.voo) {
    return passoVoo(b, c);
  }
  if (b.chegouEm !== null) {
    return {
      estado: passoDwell(b, {
        agora: c.agora,
        plataformas: c.plataformas,
        larg: c.larg,
        largJanela: c.largJanela,
      }),
      gravarPosicao: false,
    };
  }
  // Arrastando o dedo nele (ou movimento reduzido): parado.
  if (b.arrastando || c.semMovimento) {
    return { estado: "idle", gravarPosicao: false };
  }
  return { estado: passoTerra(b, c), gravarPosicao: false };
}

// ── Utilitários puros do componente ────────────────────────────────────────

/**
 * Primeiro bicho da lista que está em dwell sobre um alvo (o líder que o
 * anel pulsante acompanha). `&&`s da condição original viraram `if`s
 * separados: mesma semântica, e a linha deixa de ser "complex conditional"
 * do CodeScene (medido 09/10/2026).
 */
export function acharBichoNoAlvo<T extends { slug: string }>(
  pets: readonly T[],
  getBicho: (slug: string) => Bicho | undefined,
): Bicho | null {
  for (const pet of pets) {
    const b = getBicho(pet.slug);
    if (!b) continue;
    if (b.chegouEm === null) continue;
    if (b.alvoEl) return b;
  }
  return null;
}

/**
 * X de nascimento de um bicho novo: posição lembrada, o primeiro no canto
 * de sempre (x=24), os demais perto da borda direita (enfileirados a
 * 64 px). Extraído do `garantirBichos` — pura aritmética, testável.
 */
export function xNascimento(
  salva: Ponto | undefined,
  idx: number,
  larg: number,
  largJanela: number,
): number {
  if (salva) return salva.x;
  if (idx === 0) return 24;
  return Math.max(MARGEM, largJanela - MARGEM - larg - idx * 64);
}

/**
 * Lê a string salva no `localStorage` (`cp_pet`) e devolve a lista de pets
 * na ORDEM em que foram escritos. `null` = "não muda nada" (string vazia
 * ou só slugs desconhecidos); `[]` = sentinela "-" ("sem bichinhos").
 * Deduplica e ignora slug vazio/inválido — mesma regra do laço original.
 */
export function parsearPetsSalvos<T extends { slug: string }>(
  salvo: string,
  catalogo: readonly T[],
): T[] | null {
  if (!salvo) return null;
  if (salvo === "-") return [];
  const vistos = new Set<string>();
  const lista: T[] = [];
  for (const bruto of salvo.split(",")) {
    const slug = bruto.trim();
    if (!slug || vistos.has(slug)) continue;
    vistos.add(slug);
    const achado = catalogo.find((p) => p.slug === slug);
    if (achado) lista.push(achado);
  }
  if (lista.length === 0) return null;
  return lista;
}

/** Duas listas de pets são a mesma sequência de slugs? */
export function listasIguais<T extends { slug: string }>(
  a: readonly T[],
  b: readonly T[],
): boolean {
  return a.length === b.length && a.every((p, i) => p.slug === b[i].slug);
}
