/**
 * @file plataformas.ts
 * @description Física de superfícies do companheiro flutuante — o bichinho
 * enxerga a página e usa o TOPO de imagem, texto, moldura de cartão e botão
 * como chão: sobe (salto), anda em cima e cai da borda (gravidade). Pedido
 * do dono (03/10/2026): "reconhecer onde tem imagem/texto/moldura de
 * cartões/botões pra poder pular em cima ou ficar em cima andando".
 *
 * Papel no portal: lógica pura da caminhada do companheiro em
 * `CompanheiroFlutuante.tsx`. Este módulo não toca no DOM nas funções de
 * decisão (as entradas são números) — assim a física tem teste, e o teste
 * não precisa de navegador (o AGENTS.md exige dupla verificação por cálculo
 * quando o número é regra).
 *
 * Coordenadas (combinação importante, mudou em 03/10/2026):
 * - x: pixels de viewport (o container dos bichos é `left-0`);
 * - y: altura ACIMA DO CHÃO dos bichos (o container é `bottom-2`, ou seja,
 *   8 px — daí `BASE_BORDA`); chão = 0, nunca negativo;
 * - plataforma: faixa horizontal [x0..x1] com o topo em `y` nessa escala.
 *
 * Decisões de projeto:
 * - **Maior superfície vence**: com o pé em dois degraus, o bicho fica no
 *   mais alto (é o que ele pisaria, de verdade).
 * - **Salto escolhe o degrau mais alto alcançável** à frente: subir o
 *   máximo a cada passo deixa a subida em degraus naturais (entra no cartão,
 *   depois salta para a imagem de dentro dele).
 * - **Pouso na borda de entrada**: `alvoDoSalto` posiciona o bicho a 2 px
 *   da borda por onde entrou — salto curto e visível. A garantia de
 *   estabilidade (pé de centro fica sobre a plataforma) vem do filtro de
 *   largura mínima (40 px) do amostrador: mesmo o bicho mais largo (≈50 px)
 *   tem o centro dentro da faixa depois do pouso, senão ele cairia na hora
 *   e entraria em loop de pulo.
 * - **Gravidade tem teto**: queda livre acelera até 2.400 px/s para uma
 *   tela grande não virar free-fall eterno; o pouso cola exatamente na
 *   superfície (sem oscilar em cima dela).
 */

/** Faixa horizontal de chão encontrável na página. */
export interface Plataforma {
  /** Borda esquerda, em px de viewport. */
  x0: number;
  /** Borda direita, em px de viewport. */
  x1: number;
  /** Altura do topo acima do chão dos bichos, em px (≥ 0). */
  y: number;
}

/** Ponto em px de viewport (x) e altura do chão (y). */
export interface Ponto {
  x: number;
  y: number;
}

/** Folga dos pés: superfície até `yPisada + folga` ainda é o chão de baixo. */
export const FOLGA_PES = 2;
/** Distância do chão do container dos bichos até a borda da tela (`bottom-2`). */
export const BASE_BORDA = 8;
/** Largura mínima de candidato a plataforma (o amostrador descarta menor). */
export const LARGURA_MINIMA = 40;

/**
 * Chão sob o pé: a maior superfície com `x` coberto que não passe da
 * `yPisada + FOLGA_PES` (nada "acima do pé" vale como chão — para subir
 * existe o salto). Sem candidato, o chão da tela (0).
 */
export function superficieSob(
  plataformas: readonly Plataforma[],
  xCentro: number,
  yPisada: number,
): number {
  let chao = 0;
  for (const p of plataformas) {
    if (xCentro < p.x0 || xCentro > p.x1) continue;
    if (p.y > yPisada + FOLGA_PES) continue;
    if (p.y > chao) chao = p.y;
  }
  return chao;
}

/**
 * Plataforma à frente, dentro do alcance do salto. `xPonta` é a ponta do
 * bicho no sentido do passo (borda dianteira). Devolve o degrau MAIS ALTO
 * alcançável (ver cabeçalho) ou `null` — aí o bicho continua andando.
 */
export function plataformaSalto(
  plataformas: readonly Plataforma[],
  dados: { yAgora: number; xPonta: number; alcance: number },
): Plataforma | null {
  const { yAgora, xPonta, alcance } = dados;
  let melhor: Plataforma | null = null;
  for (const p of plataformas) {
    if (xPonta < p.x0 || xPonta > p.x1) continue;
    if (p.y <= yAgora + FOLGA_PES) continue; // atrás ou no mesmo nível
    if (p.y > yAgora + alcance) continue; // longe demais
    if (!melhor || p.y > melhor.y) melhor = p;
  }
  return melhor;
}

/**
 * Ponto de pouso do salto: a 2 px da borda de entrada, na altura do topo.
 * `dir > 0` entrou pela esquerda (`x0`); `dir < 0` entrou pela direita
 * (`x1 − largura do bicho`).
 */
export function alvoDoSalto(p: Plataforma, dir: 1 | -1, larg: number): Ponto {
  return { x: dir > 0 ? p.x0 + 2 : p.x1 - larg - 2, y: p.y };
}

/**
 * Um quadro de gravidade. Acelera `vel` (px/s) e desce `y`; ao cruzar a
 * superfície `sob`, cola em `sob` com velocidade zero e `pousou: true`.
 * `dt` em segundos (o laço do componente já normaliza para no máximo 50 ms).
 */
export function passoQueda(
  y: number,
  vel: number,
  dt: number,
  sob: number,
): { y: number; vel: number; pousou: boolean } {
  const nova = Math.min(2400, vel + 5200 * dt);
  const novoY = y - nova * dt;
  if (novoY <= sob) return { y: sob, vel: 0, pousou: true };
  return { y: novoY, vel: nova, pousou: false };
}

/**
 * Varredura do DOM (única função com `document`): quais elementos da página
 * valem como plataforma. Candidatos: imagem (`img`, `figure`), texto
 * (títulos, parágrafos, listas, citações), moldura de cartão (qualquer
 * classe com "rounded") e botão/links. A UI fixa nossa fica de fora por
 * `position: fixed/sticky` e pela marca `data-nao-plataforma` (pets,
 * pilha do canto, painel do Seu Nonô, menus).
 *
 * Custa ~800 leituras de `getBoundingClientRect` no máximo: acima disso a
 * página é amostrada com passo uniforme (senão listas gigantes de tabela
 * estourariam o orçamento de quadro) e a coleta para em 160 faixas — o
 * orçamento é estimado para caber em poucos milissegundos 1× por segundo.
 */
export function amostrarPlataformas(): Plataforma[] {
  const seletores =
    'img,figure,button,a[href],summary,[role="button"],h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,[class*="rounded"]';
  let candidatos = Array.from(document.querySelectorAll<HTMLElement>(seletores));

  const MAX_CANDIDATOS = 800;
  if (candidatos.length > MAX_CANDIDATOS) {
    const passo = Math.ceil(candidatos.length / MAX_CANDIDATOS);
    candidatos = candidatos.filter((_, i) => i % passo === 0);
  }

  const larg = window.innerWidth;
  const alt = window.innerHeight;
  const saida: Plataforma[] = [];
  for (const el of candidatos) {
    if (saida.length >= 160) break;
    if (el.closest("[data-nao-plataforma]")) continue;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.position === "sticky") continue;
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (cs.pointerEvents === "none") continue; // decorativo, ninguém pisa
    const r = el.getBoundingClientRect();
    if (r.width < LARGURA_MINIMA || r.height < 16) continue;
    if (r.bottom < -80 || r.top > alt + 80) continue; // fora da janela
    if (r.right < 0 || r.left > larg) continue;
    const y = Math.max(0, alt - r.top - BASE_BORDA);
    saida.push({ x0: r.left, x1: r.right, y });
  }
  return saida;
}
