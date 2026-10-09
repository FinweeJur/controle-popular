/**
 * @file passo.test.ts
 * @description Prova de equivalência da extração de 09/10/2026: a máquina
 * de estados `passoBicho` (lib/companheiro/passo.ts) precisa produzir
 * EXATAMENTE o mesmo resultado do `passo()` original de
 * `CompanheiroFlutuante.tsx` (medido: cc 36, 150 linhas). O portal atende
 * gente sob estresse — posição errada do bicho é dano baixo, mas comporta
 * quebrado em animação também é prova que ninguém conserta; por isso a
 * referência é o código ANTIGO colado aqui, não uma releitura.
 *
 * Método: prova DIFERENCIAL. Para cada caso (à mão e sorteado), clona o
 * bicho, roda a referência e a implementação nova com a MESMA entrada e o
 * MESMO stream de aleatórios, e compara estado + todos os campos do bicho
 * + o sinal de gravação de posição. As funções de física compartilhada
 * (`superficieSob`, `passoQueda`, `plataformaSalto`, `alvoDoSalto`) não
 * mudaram neste refator e são importadas iguais pelos dois lados.
 */
import { describe, expect, it } from "vitest";
import {
  alvoDoSalto,
  passoQueda,
  plataformaSalto,
  superficieSob,
  type Plataforma,
  type Ponto,
} from "./plataformas";
import {
  DUR_VOO_MAX,
  DUR_VOO_MIN,
  ESPERA_NO_ALVO_MS,
  MARGEM,
  NOMES_ESTADO,
  VELOCIDADE,
  acharBichoNoAlvo,
  alcanceSalto,
  bezier,
  criarBicho,
  listasIguais,
  parsearPetsSalvos,
  passoBicho,
  suavizar,
  xNascimento,
  type Bicho,
  type NomeEstado,
} from "./passo";
import { LINHAS_ATLAS } from "../../app/components/companheiroPets";

// ─────────────────────────────────────────────────────────────────────────────
// REFERÊNCIA: o passo() original de CompanheiroFlutuante.tsx (HEAD antes do
// refator de 09/10/2026), copiado linha a linha. Só duas adaptações, ambas
// inertes para a semântica: `window.innerWidth/innerHeight` viram
// parâmetros (`largJanela`/`alcance` já computado) e `Math.random` vira o
// injeitado `aleatorio` — a contagem de chamadas é preservada.
// ─────────────────────────────────────────────────────────────────────────────

/** Bézier quadrática da referência (cópia do original, sem importar o novo). */
function refBezier(p0: Ponto, c: Ponto, p1: Ponto, t: number): Ponto {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

/** Suavização da referência (cópia do original). */
function refSuavizar(t: number): number {
  return t * t * (3 - 2 * t);
}

interface RefCtx {
  agora: number;
  dt: number;
  plataformas: Plataforma[];
  larg: number;
  alcance: number;
  semMovimento: boolean;
  emFalha: boolean;
  largJanela: number;
  destinoIda: Ponto | null;
  aleatorio: () => number;
  /** Efeito colateral do original: chamado quando "pousar" termina. */
  aoGravarPos: () => void;
}

/** O `passo()` original, ramo a ramo, devolvendo estado + sinal de gravação. */
function referenciaPasso(
  b: Bicho,
  c: RefCtx,
): { estado: NomeEstado; gravarPosicao: boolean } {
  let estado: NomeEstado = "idle";
  let gravarPosicao = false;

  if (c.emFalha) {
    estado = "failed";
  } else if (b.voo) {
    const voo = b.voo;
    const t = Math.min(1, (c.agora - voo.inicio) / voo.dur);
    const destino =
      voo.fase === "ida" ? c.destinoIda ?? voo.destino : voo.destino;
    b.pos = refBezier(voo.p0, voo.ctrl, destino, refSuavizar(t));
    estado = voo.fase === "volta" ? "running" : "jumping";
    if (t >= 1) {
      b.voo = null;
      if (voo.fase === "ida") b.chegouEm = c.agora;
      if (voo.fase === "pousar") {
        b.pausaAte = c.agora + 600;
        gravarPosicao = true; // original: salvarPos(pet.slug, b.pos)
        c.aoGravarPos();
      }
      if (voo.fase === "salto") b.pausaAte = c.agora + 120;
      if (voo.fase === "volta") {
        b.alvoEl = null;
        b.queda = 0;
      }
    }
  } else if (b.chegouEm !== null) {
    estado = c.agora - b.chegouEm <= 1400 ? "waving" : "review";
    if (c.agora - b.chegouEm > ESPERA_NO_ALVO_MS) {
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
  } else if (b.arrastando || c.semMovimento) {
    estado = "idle";
  } else {
    const centro = b.pos.x + c.larg / 2;
    const sob = superficieSob(c.plataformas, centro, b.pos.y);

    if (b.pos.y > sob + 0.5) {
      const q = passoQueda(b.pos.y, b.queda, c.dt, sob);
      b.pos.y = q.y;
      b.queda = q.vel;
      estado = "jumping";
      if (q.pousou) {
        b.queda = 0;
        b.pausaAte = c.agora + 250;
        estado = "idle";
      }
    } else {
      b.queda = 0;
      b.pos.y = sob;
      if (c.agora >= b.pausaAte) {
        b.pos.x += b.dir * VELOCIDADE * c.dt;
        const maxX = c.largJanela - c.larg - MARGEM;
        if (b.pos.x <= MARGEM) {
          b.pos.x = MARGEM;
          b.dir = 1;
        } else if (b.pos.x >= maxX) {
          b.pos.x = maxX;
          b.dir = -1;
        }
        const ponta = b.dir > 0 ? b.pos.x + c.larg : b.pos.x;
        const degrau = plataformaSalto(c.plataformas, {
          yAgora: b.pos.y,
          xPonta: ponta,
          alcance: c.alcance,
        });
        if (degrau) {
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
          estado = "jumping";
        } else {
          estado = b.dir > 0 ? "running-right" : "running-left";
          if (c.aleatorio() < 0.004) {
            b.pausaAte = c.agora + 900 + c.aleatorio() * 1800;
          }
        }
      } else {
        estado = "waiting";
      }
    }
  }

  return { estado, gravarPosicao };
}

// ── Ferramentas da prova ────────────────────────────────────────────────────

/** Clona profundo do bicho (HTMLElement é clonado como marcador de identidade). */
function clonarBicho(b: Bicho): Bicho {
  return {
    pos: { ...b.pos },
    dir: b.dir,
    pausaAte: b.pausaAte,
    arrastando: b.arrastando,
    voo: b.voo ? { ...b.voo, p0: { ...b.voo.p0 }, ctrl: { ...b.voo.ctrl }, destino: { ...b.voo.destino } } : null,
    chegouEm: b.chegouEm,
    alvoEl: b.alvoEl,
    estado: { ...b.estado },
    queda: b.queda,
    semCliqueAte: b.semCliqueAte,
  };
}

/** Gerador LCG determinístico — o mesmo stream nos dois lados da prova. */
function lcg(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Roda os dois lados com entradas idênticas e reclama na primeira divergência.
 * `novoAleatorio` é uma FÁBRICA: cada lado recebe a sua própria cópia do
 * stream, senão o sorteio de um lado consumiria o número do outro. */
function conferirEquivalencia(
  bichoBase: Bicho,
  ctx: Omit<RefCtx, "aleatorio" | "aoGravarPos">,
  novoAleatorio: () => () => number,
): void {
  const bNovo = clonarBicho(bichoBase);
  const bRef = clonarBicho(bichoBase);
  const novo = passoBicho(bNovo, {
    ...ctx,
    aleatorio: novoAleatorio(),
  });
  let gravouRef = false;
  const ref = referenciaPasso(bRef, {
    ...ctx,
    aleatorio: novoAleatorio(),
    aoGravarPos: () => {
      gravouRef = true;
    },
  });
  expect(novo.estado).toBe(ref.estado);
  expect(novo.gravarPosicao).toBe(ref.gravarPosicao);
  expect(novo.gravarPosicao).toBe(gravouRef);
  expect(bNovo).toEqual(bRef);
}

/** Cria um bicho pronto para o caso (só campos diferentes do padrão). */
function bichoCom(campos: Partial<Bicho>): Bicho {
  const b = criarBicho(campos.pos?.x ?? 100);
  if (campos.pos) b.pos = { ...campos.pos };
  b.dir = campos.dir ?? b.dir;
  b.pausaAte = campos.pausaAte ?? b.pausaAte;
  b.arrastando = campos.arrastando ?? b.arrastando;
  b.voo = campos.voo ? { ...campos.voo } : b.voo;
  b.chegouEm = campos.chegouEm ?? b.chegouEm;
  b.alvoEl = campos.alvoEl ?? b.alvoEl;
  b.queda = campos.queda ?? b.queda;
  return b;
}

/** Contexto padrão dos casos à mão (tela 1200×800, sem plataforma). */
function ctxPadrao(sobre: Partial<RefCtx> = {}): Omit<RefCtx, "aleatorio" | "aoGravarPos"> {
  return {
    agora: 10_000,
    dt: 0.016,
    plataformas: [],
    larg: 50,
    alcance: 300,
    semMovimento: false,
    emFalha: false,
    largJanela: 1200,
    destinoIda: null,
    ...sobre,
  };
}

// ── Casos à mão: um por ramo da máquina ─────────────────────────────────────

describe("passoBicho — casos à mão (um por ramo)", () => {
  it("falha tem prioridade máxima e ignora voo/dwell/terra", () => {
    const b = bichoCom({
      voo: { fase: "ida", p0: { x: 0, y: 0 }, ctrl: { x: 0, y: 0 }, inicio: 0, dur: 100, destino: { x: 10, y: 0 } },
      chegouEm: 5,
    });
    conferirEquivalencia(b, ctxPadrao({ emFalha: true }), () => () => 0.5);
  });

  it("voo de ida no meio: interpola bezier e estado jumping", () => {
    const b = bichoCom({
      voo: { fase: "ida", p0: { x: 0, y: 0 }, ctrl: { x: 50, y: 80 }, inicio: 9_000, dur: 1_000, destino: { x: 200, y: 30 } },
      alvoEl: null,
    });
    conferirEquivalencia(b, ctxPadrao({ destinoIda: { x: 210, y: 35 } }), () => () => 0.5);
  });

  it("fim do voo de ida: vira dwell (chegouEm = agora)", () => {
    const b = bichoCom({
      voo: { fase: "ida", p0: { x: 0, y: 0 }, ctrl: { x: 50, y: 80 }, inicio: 9_000, dur: 1_000, destino: { x: 200, y: 30 } },
    });
    conferirEquivalencia(b, ctxPadrao({ agora: 10_000 }), () => () => 0.5);
  });

  it("fim do voo de pousar: pausa 600 ms e pede gravação", () => {
    const b = bichoCom({
      voo: { fase: "pousar", p0: { x: 80, y: 120 }, ctrl: { x: 80, y: 20 }, inicio: 9_000, dur: 1_000, destino: { x: 80, y: 0 } },
    });
    conferirEquivalencia(b, ctxPadrao({ agora: 10_000 }), () => () => 0.5);
  });

  it("fim do voo de salto: pausa 120 ms", () => {
    const b = bichoCom({
      voo: { fase: "salto", p0: { x: 80, y: 0 }, ctrl: { x: 100, y: 40 }, inicio: 9_000, dur: 500, destino: { x: 120, y: 40 } },
    });
    conferirEquivalencia(b, ctxPadrao({ agora: 10_000 }), () => () => 0.5);
  });

  it("fim do voo de volta: solta alvo e zera queda", () => {
    const b = bichoCom({
      voo: { fase: "volta", p0: { x: 200, y: 60 }, ctrl: { x: 100, y: 100 }, inicio: 9_000, dur: 800, destino: { x: 24, y: 0 } },
      queda: 900,
    });
    b.alvoEl = {} as HTMLElement; // marcador de identidade (DOM fora do teste)
    conferirEquivalencia(b, ctxPadrao({ agora: 10_000 }), () => () => 0.5);
  });

  it("dwell acena por 1,4 s e depois revisa", () => {
    const b1 = bichoCom({ chegouEm: 9_500, pos: { x: 100, y: 40 } });
    conferirEquivalencia(b1, ctxPadrao({ agora: 10_000 }), () => () => 0.5); // 500 ms → waving
    const b2 = bichoCom({ chegouEm: 8_000, pos: { x: 100, y: 40 } });
    conferirEquivalencia(b2, ctxPadrao({ agora: 10_000 }), () => () => 0.5); // 2 s → review
  });

  it("dwell estourado: cria voo de volta pousando na superfície", () => {
    const b = bichoCom({ chegouEm: 1_000, pos: { x: 400, y: 60 } });
    conferirEquivalencia(
      b,
      ctxPadrao({ agora: 1_000 + ESPERA_NO_ALVO_MS + 1, plataformas: [{ x0: 0, x1: 999, y: 20 }] }),
      () => () => 0.5,
    );
  });

  it("arrastando: parado (idle), mesmo com voo zerado", () => {
    const b = bichoCom({ arrastando: true, pos: { x: 300, y: 80 } });
    conferirEquivalencia(b, ctxPadrao(), () => () => 0.5);
  });

  it("movimento reduzido: parado (idle)", () => {
    const b = bichoCom({ pos: { x: 300, y: 0 } });
    conferirEquivalencia(b, ctxPadrao({ semMovimento: true }), () => () => 0.5);
  });

  it("queda livre no meio do ar: jumping com gravidade", () => {
    const b = bichoCom({ pos: { x: 100, y: 80 }, queda: 300 });
    conferirEquivalencia(b, ctxPadrao(), () => () => 0.5);
  });

  it("quem pousa da queda: idle e pausa 250 ms", () => {
    // y=5 com queda alta: um quadro de 50 ms cola no chão (0)
    const b = bichoCom({ pos: { x: 100, y: 5 }, queda: 2400 });
    conferirEquivalencia(b, ctxPadrao({ dt: 0.05 }), () => () => 0.5);
  });

  it("passeio no chão anda na direção atual", () => {
    const b = bichoCom({ pos: { x: 300, y: 0 }, dir: 1 });
    conferirEquivalencia(b, ctxPadrao(), () => () => 0.9); // acima de 0,004: sem pausa
  });

  it("parede esquerda vira para a direita", () => {
    const b = bichoCom({ pos: { x: MARGEM + 1, y: 0 }, dir: -1 });
    conferirEquivalencia(b, ctxPadrao(), () => () => 0.9);
  });

  it("parede direita vira para a esquerda", () => {
    const b = bichoCom({ pos: { x: 1200 - 50 - MARGEM - 1, y: 0 }, dir: 1 });
    conferirEquivalencia(b, ctxPadrao(), () => () => 0.9);
  });

  it("degrau à frente vira salto (jumping)", () => {
    const b = bichoCom({ pos: { x: 80, y: 0 }, dir: 1 });
    conferirEquivalencia(
      b,
      ctxPadrao({ plataformas: [{ x0: 100, x1: 400, y: 60 }] }),
      () => () => 0.9,
    );
  });

  it("pausa rara do passeio: sorteio < 0,004 agenda o waiting", () => {
    const b = bichoCom({ pos: { x: 300, y: 0 }, dir: 1 });
    // primeiro sorteio 0,001 (entra na pausa), segundo 0,5 → 900 + 900 ms
    const fila = [0.001, 0.5];
    conferirEquivalencia(b, ctxPadrao(), () => {
      let i = 0;
      return () => fila[i++] ?? 1;
    });
  });

  it("pausa do passeio vigente: waiting", () => {
    const b = bichoCom({ pos: { x: 300, y: 0 }, pausaAte: 20_000 });
    conferirEquivalencia(b, ctxPadrao({ agora: 10_000 }), () => () => 0.9);
  });
});

// ── Prova diferencial varrida (entradas sorteadas) ──────────────────────────

/**
 * Os dois lados da prova divergiram?
 *
 * Função própria — e não um `if` com três `||` — porque o CodeScene marca
 * essa linha como *Complex Conditional* (medido 09/10/2026). Comparar três
 * coisas em uma expressão só é o mesmo erro de forma que o `passo` original
 * tinha: aqui o teste é que paga a conta, e o teste também tem de ser legível.
 *
 * @returns `true` quando o estado animado, o sinal de gravação ou o corpo
 *   inteiro do bicho diferem.
 */
function houveDivergencia(
  novo: { estado: string; gravarPosicao: boolean },
  ref: { estado: string; gravarPosicao: boolean },
  bNovo: unknown,
  bRef: unknown,
): boolean {
  if (novo.estado !== ref.estado) return true;
  if (novo.gravarPosicao !== ref.gravarPosicao) return true;
  return JSON.stringify(bNovo) !== JSON.stringify(bRef);
}

describe("passoBicho — varredura diferencial", () => {
  it("2000 estados sorteados: nenhuma divergência", () => {
    const rand = lcg(20_261_009); // semente fixa: a prova reproduz
    const fases = ["ida", "volta", "pousar", "salto"] as const;
    let divergencias = 0;
    for (let i = 0; i < 2000; i++) {
      const plataformas: Plataforma[] = rand() < 0.5
        ? [{ x0: rand() * 400, x1: 400 + rand() * 600, y: rand() * 150 }]
        : [];
      const b = criarBicho(rand() * 1100);
      b.pos.y = rand() < 0.3 ? rand() * 200 : 0;
      b.dir = rand() < 0.5 ? 1 : -1;
      b.pausaAte = rand() < 0.4 ? rand() * 20_000 : 0;
      b.arrastando = rand() < 0.15;
      b.queda = rand() < 0.25 ? rand() * 2400 : 0;
      b.chegouEm = rand() < 0.2 ? rand() * 10_000 : null;
      if (rand() < 0.3) {
        b.voo = {
          fase: fases[Math.floor(rand() * 4)],
          p0: { x: rand() * 1000, y: rand() * 150 },
          ctrl: { x: rand() * 1000, y: rand() * 200 },
          inicio: rand() * 5_000,
          dur: 100 + rand() * 800,
          destino: { x: rand() * 1000, y: rand() * 100 },
        };
      }
      const ctx = ctxPadrao({
        agora: rand() * 15_000,
        dt: 0.001 + rand() * 0.05,
        plataformas,
        larg: 40 + rand() * 40,
        alcance: 200 + rand() * 220,
        semMovimento: rand() < 0.1,
        emFalha: rand() < 0.1,
        largJanela: 800 + rand() * 800,
        destinoIda: rand() < 0.4 ? { x: rand() * 1000, y: rand() * 150 } : null,
      });
      // O MESMO fila para os dois lados, mas cursor SEPARADO: senão o
      // sorteio de um lado consumiria o número do outro e a prova mentiria.
      const fila = [rand(), rand(), rand()];
      let cursorNovo = 0;
      let cursorRef = 0;
      const bNovo = clonarBicho(b);
      const bRef = clonarBicho(b);
      const novo = passoBicho(bNovo, {
        ...ctx,
        aleatorio: () => fila[cursorNovo++] ?? 1,
      });
      const ref = referenciaPasso(bRef, {
        ...ctx,
        aleatorio: () => fila[cursorRef++] ?? 1,
        aoGravarPos: () => {},
      });
      if (houveDivergencia(novo, ref, bNovo, bRef)) {
        divergencias += 1;
        if (divergencias === 1) {
          // Primeira divergência: mostra a entrada para depurar.
          console.error("divergência no caso", i, { ctx, b, novo, ref });
        }
      }
    }
    expect(divergencias).toBe(0);
  });
});

// ── Funções utilitárias ─────────────────────────────────────────────────────

describe("algebra do voo (bezier/suavizar)", () => {
  it("bezier em t=0 é p0; em t=1 é p1; no meio é a média com o controle", () => {
    const p0 = { x: 0, y: 0 };
    const ctrl = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };
    expect(bezier(p0, ctrl, p1, 0)).toEqual(p0);
    expect(bezier(p0, ctrl, p1, 1)).toEqual(p1);
    // t=0,5: 0,25·p0 + 0,5·ctrl + 0,25·p1 = (50, 50)
    expect(bezier(p0, ctrl, p1, 0.5)).toEqual({ x: 50, y: 50 });
  });

  it("suavizar(0)=0, suavizar(1)=1, suavizar(0,5)=0,5", () => {
    expect(suavizar(0)).toBe(0);
    expect(suavizar(1)).toBe(1);
    expect(suavizar(0.5)).toBeCloseTo(0.5, 10);
  });
});

describe("alcanceSalto", () => {
  it("piso 200, teto 420, proporcional no meio (conta à mão)", () => {
    expect(alcanceSalto(100)).toBe(200); // 45 < 200 → piso
    expect(alcanceSalto(800)).toBe(360); // 800 × 0,45
    expect(alcanceSalto(2000)).toBe(420); // 900 > 420 → teto
  });
});

describe("acharBichoNoAlvo", () => {
  it("devolve o primeiro em dwell com alvo; null quando ninguém está", () => {
    const semAlvo = criarBicho(10);
    const emDwell = criarBicho(20);
    emDwell.chegouEm = 100;
    emDwell.alvoEl = {} as HTMLElement;
    const mapa = new Map([
      ["a", semAlvo],
      ["b", emDwell],
    ]);
    const pets = [{ slug: "a" }, { slug: "b" }];
    expect(acharBichoNoAlvo(pets, (s) => mapa.get(s))).toBe(emDwell);
    mapa.delete("b");
    expect(acharBichoNoAlvo(pets, (s) => mapa.get(s))).toBeNull();
  });

  it("dwell SEM alvo não conta (anel não aparece)", () => {
    const b = criarBicho(10);
    b.chegouEm = 100; // alvoEl continua null
    expect(acharBichoNoAlvo([{ slug: "a" }], () => b)).toBeNull();
  });
});

describe("xNascimento", () => {
  it("posição lembrada vence; senão, primeiro em 24 e os demais na borda", () => {
    expect(xNascimento({ x: 555, y: 10 }, 0, 50, 1200)).toBe(555);
    expect(xNascimento(undefined, 0, 50, 1200)).toBe(24);
    // idx 1: max(12, 1200−12−50−64) = 1074
    expect(xNascimento(undefined, 1, 50, 1200)).toBe(1074);
    // idx 99: estoura a margem → piso MARGEM
    expect(xNascimento(undefined, 99, 50, 300)).toBe(MARGEM);
  });
});

describe("parsearPetsSalvos", () => {
  const catalogo = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

  it("string vazia e desconhecido não mudam nada (null)", () => {
    expect(parsearPetsSalvos("", catalogo)).toBeNull();
    expect(parsearPetsSalvos("zzz", catalogo)).toBeNull();
    expect(parsearPetsSalvos(" , , ", catalogo)).toBeNull();
  });

  it("sentinela '-' devolve lista vazia (sem bichinhos)", () => {
    expect(parsearPetsSalvos("-", catalogo)).toEqual([]);
  });

  it("um slug, muitos, ordem preservada, dedup e trim", () => {
    expect(parsearPetsSalvos("b", catalogo)).toEqual([{ slug: "b" }]);
    expect(parsearPetsSalvos("c,a", catalogo)).toEqual([{ slug: "c" }, { slug: "a" }]);
    expect(parsearPetsSalvos(" a , a ,b", catalogo)).toEqual([{ slug: "a" }, { slug: "b" }]);
    expect(parsearPetsSalvos("x,a,y,b", catalogo)).toEqual([{ slug: "a" }, { slug: "b" }]);
  });
});

describe("listasIguais", () => {
  it("compara sequência de slugs, não identidade", () => {
    const a = [{ slug: "x" }, { slug: "y" }];
    expect(listasIguais(a, [{ slug: "x" }, { slug: "y" }])).toBe(true);
    expect(listasIguais(a, [{ slug: "y" }, { slug: "x" }])).toBe(false);
    expect(listasIguais(a, [{ slug: "x" }])).toBe(false);
    expect(listasIguais([], [])).toBe(true);
  });
});

describe("NOMES_ESTADO × LINHAS_ATLAS", () => {
  it("a ordem é idêntica — o índice da linha do atlas depende dela", () => {
    expect([...NOMES_ESTADO]).toEqual([...LINHAS_ATLAS]);
  });
});
