/**
 * layers/boundaries.js — recorte territorial do foco ativo.
 *
 * Ao trocar de preset na focusbar, desenha sobre o globo o contorno oficial
 * (malha IBGE simplificada, servida de /terras/globo/data/{boundary}.geojson)
 * da região focada: Brasil, Sudeste, Minas Gerais ou Curvelo.
 * O contorno anterior é removido (com dispose de GPU) a cada troca.
 */

import { geojsonToLines } from './geojson3d.js';

// Cor do recorte: ciano de acento do design system, levemente mais vivo que as camadas
const BOUNDARY_COLOR = 0x7dd3fc; // sky-300 — destaca sobre o #38bdf8 das camadas

export class FocusBoundaries {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.current = null;      // LineSegments do recorte ativo
    this.currentId = null;    // boundary do recorte ativo
    this._cache = new Map();  // boundary -> FeatureCollection (evita refetch)
    this._reqSeq = 0;         // sequência p/ ignorar resposta de clique antigo
  }

  /**
   * Busca (e memoriza) o GeoJSON de um recorte, sem desenhar nada.
   * Existe separado de `show` porque o main.js precisa da geometria ANTES de
   * voar: é dela que sai a distância em que a região cabe na tela.
   * @param {string|null} boundary
   * @returns {Promise<object|null>} FeatureCollection, ou null se não houver
   */
  async carregar(boundary) {
    if (!boundary) return null;
    if (this._cache.has(boundary)) return this._cache.get(boundary);
    try {
      const url = `/terras/globo/data/${boundary}.geojson`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${url}`);
      const fc = await resp.json();
      this._cache.set(boundary, fc);
      return fc;
    } catch (err) {
      console.warn(`[globe] falha ao carregar recorte '${boundary}':`, err.message);
      return null;
    }
  }

  /**
   * Mostra o recorte territorial do preset (se ele tiver `boundary`).
   * @param {{ id: string, boundary: string|null }} preset
   */
  async show(preset) {
    const seq = ++this._reqSeq;
    this.clear();
    if (!preset?.boundary) return;

    try {
      const fc = await this.carregar(preset.boundary);
      if (!fc) return;
      // Usuário já clicou em outro foco enquanto baixava — descarta
      if (seq !== this._reqSeq) return;

      this.current = geojsonToLines(fc, { color: BOUNDARY_COLOR, opacity: 1.0 });
      this.currentId = preset.boundary;
      this.scene.add(this.current);
      console.info(`[globe] recorte territorial ativo: ${preset.boundary}`);
    } catch (err) {
      console.warn(`[globe] falha ao carregar recorte '${preset.boundary}':`, err.message);
    }
  }

  /**
   * Desenha o contorno de UMA feição avulsa — usado pela busca de município,
   * que não tem arquivo de recorte próprio (só os 5 presets têm).
   * @param {object} feature  Feature GeoJSON
   * @param {string} id       identificador do recorte ativo, para depuração
   */
  mostrarFeature(feature, id = 'feicao') {
    this._reqSeq++;  // invalida qualquer carga de preset em voo
    this.clear();
    if (!feature) return;
    this.current = geojsonToLines(
      { type: 'FeatureCollection', features: [feature] },
      { color: BOUNDARY_COLOR, opacity: 1.0 },
    );
    this.currentId = id;
    this.scene.add(this.current);
  }

  /** Remove e descarta o recorte ativo (se houver). */
  clear() {
    if (!this.current) return;
    this.scene.remove(this.current);
    this.current.geometry?.dispose();
    this.current.material?.dispose();
    this.current = null;
    this.currentId = null;
  }
}
