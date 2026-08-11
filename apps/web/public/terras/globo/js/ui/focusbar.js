/**
 * focusbar.js — barra de botões de foco pré-definidos de câmera (Fase G1).
 *
 * Renderiza um botão por preset de FOCUS_PRESETS dentro do
 * <nav id="focusbar">. O clique dispara onSelect(preset) — o main.js usa isso
 * para chamar flyTo(). A barra gerencia sozinha o estado visual do botão ativo.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .focus-btn        — botão de foco (HUD mono/caixa-alta)
 *   .focus-btn.active — preset atualmente selecionado (acento ciano #38bdf8)
 *
 * API pública:
 *   const bar = createFocusBar(el, FOCUS_PRESETS, (preset) => flyTo(...));
 *   bar.setActive('mg');  // marca um preset como ativo sem disparar onSelect
 *   bar.getActive();      // id do preset ativo (ou null)
 */

export function createFocusBar(el, presets, onSelect) {
  el.innerHTML = '';

  let activeId = null;
  const buttons = new Map(); // id do preset -> elemento <button>

  for (const preset of presets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'focus-btn';
    btn.textContent = preset.label;
    btn.dataset.focusId = preset.id;
    btn.title = `Ver ${preset.label} no mapa`;

    btn.addEventListener('click', () => {
      setActive(preset.id);
      if (typeof onSelect === 'function') onSelect(preset);
    });

    buttons.set(preset.id, btn);
    el.appendChild(btn);
  }

  /** Marca o preset como ativo e remove o estado dos demais. */
  function setActive(id) {
    activeId = id;
    for (const [btnId, btn] of buttons) {
      btn.classList.toggle('active', btnId === id);
    }
  }

  return {
    setActive,
    /** Retorna o id do preset ativo (ou null se nenhum). */
    getActive() {
      return activeId;
    },
  };
}
