/**
 * footerhud.js — rodapé do HUD: proveniência dos dados + contador de FPS.
 *
 * Preenche o <footer id="footer-hud"> com os créditos de dados (sempre
 * visíveis, princípio "tudo tem proveniência" do design system) e um contador
 * de FPS calculado por média móvel dos últimos 30 frames.
 *
 * Os créditos listam só quem de fato entrega dado desenhado na tela. A SPU
 * estava creditada e não fornece nada — o acesso público está fechado, a camada
 * "Imóveis do governo federal" chega vazia. Crédito de fonte que não forneceu
 * dado é o mesmo tipo de erro que polígono inventado com cara de oficial.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .data-credits   — texto de proveniência (mono, cor discreta)
 *   .footer-spacer  — empurra o contador para a direita
 *   .fps-counter    — contador de FPS em fonte mono
 *
 * API pública:
 *   const hud = createFooterHud(el);
 *   // no loop de render (renderer.setAnimationLoop):
 *   hud.tick();          // chamar 1× por frame
 *   hud.getFPS();        // FPS médio atual (arredondado)
 */

const FPS_WINDOW = 30; // tamanho da janela da média móvel (frames)

export function createFooterHud(el) {
  el.innerHTML = '';

  const credits = document.createElement('span');
  credits.className = 'data-credits';
  credits.textContent =
    'Divisas: IBGE · Cadastro rural: CAR/SICAR · Áreas protegidas: IDE-Sisema (MG) e INCRA · Vegetação: MapBiomas · Imagem da Terra: NASA Blue Marble';
  credits.title = 'De onde vem cada camada deste mapa.';

  const spacer = document.createElement('span');
  spacer.className = 'footer-spacer';

  const fps = document.createElement('span');
  fps.className = 'fps-counter';
  fps.textContent = '— fps';
  fps.title = 'Quadros por segundo — indicador de desempenho do desenho 3D.';

  el.append(credits, spacer, fps);

  // --- Estado da média móvel de FPS ---
  const frameTimes = [];   // timestamps (performance.now) dos últimos frames
  let lastTime = null;
  let currentFPS = 0;
  let lastPaint = 0;       // evita repintar o DOM a cada frame

  return {
    /**
     * Registra um frame renderizado. Deve ser chamado 1× por frame dentro do
     * loop de animação. Atualiza o texto do contador no máximo 4×/s para não
     * forçar reflow a cada frame.
     */
    tick() {
      const now = performance.now();
      if (lastTime !== null) {
        frameTimes.push(now);
        if (frameTimes.length > FPS_WINDOW + 1) frameTimes.shift();

        // FPS = (n-1 intervalos) / tempo decorrido na janela
        if (frameTimes.length >= 2) {
          const elapsed = frameTimes[frameTimes.length - 1] - frameTimes[0];
          currentFPS = elapsed > 0 ? ((frameTimes.length - 1) * 1000) / elapsed : 0;
        }

        if (now - lastPaint > 250) {
          fps.textContent = `${Math.round(currentFPS)} fps`;
          lastPaint = now;
        }
      }
      lastTime = now;
    },
    /** FPS médio da janela atual (arredondado). */
    getFPS() {
      return Math.round(currentFPS);
    },
  };
}
