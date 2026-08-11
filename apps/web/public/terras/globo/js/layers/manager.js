/**
 * manager.js — LayerManager: ciclo de vida das camadas de dados do globo
 * (ver plano §4.5).
 *
 * Adicionar uma camada nova = 1 entrada no LAYER_REGISTRY (config.js),
 * zero código novo aqui. Nesta fase (G0+G1) o endpoint /api/v1/camadas
 * ainda não existe: o fetch falha de forma controlada, o estado é
 * registrado e um aviso vai para o console — a interface já é a final
 * e os dados reais entram na Fase G2 sem retrabalho.
 */

import { fetchLayer } from '../data/api.js';
import { geojsonToLines, geojsonToPoints, geojsonToFilled } from './geojson3d.js';
import * as THREE from 'three';

export class LayerManager {
  /**
   * @param {THREE.Scene} scene      cena onde os objetos 3D entram/saem
   * @param {Array}  [registry]      LAYER_REGISTRY (para cor/label por id)
   * @param {Object} [custom]        camadas custom: { id: () => Promise<{group, update?, featureCount}> }
   *                                 (ex.: satélites SGP4 — render 'custom' no registry)
   */
  constructor(scene, registry = [], custom = {}) {
    this.scene = scene;
    this.registry = new Map(registry.map((cfg) => [cfg.id, cfg]));
    this.custom = custom;
    /** @type {Map<string, {object: THREE.Object3D|null, featureCount: number, loading: boolean, error: string|null}>} */
    this.state = new Map();
    /** GeoJSON cru por camada (para o inspetor/click — Fase G3) */
    this.geojson = new Map();
    /** Funções update(agora) de camadas dinâmicas (ex.: satélites) */
    this.updaters = new Map();
    /** Cargas em andamento por camada: id -> Promise (ver `enable`) */
    this._emVoo = new Map();
  }

  /** @returns {boolean} true se a camada está ativa na cena */
  isEnabled(id) {
    return this.state.get(id)?.object != null;
  }

  /** @returns {number} total de feições atualmente carregadas (todas as camadas) */
  totalFeatures() {
    let n = 0;
    for (const s of this.state.values()) n += s.featureCount;
    return n;
  }

  /** Chama os updaters das camadas dinâmicas (chamado a cada frame pelo main.js). */
  tickUpdaters(agora) {
    for (const update of this.updaters.values()) update(agora);
  }

  /**
   * Liga uma camada: busca o GeoJSON no backend, converte para 3D e
   * adiciona à cena. Idempotente (não recarrega se já estiver ativa).
   *
   * Se já houver uma carga em andamento, devolve **a mesma promessa** em vez de
   * retornar na hora. Antes retornava vazio, e quem chamasse `await enable(id)`
   * seguia adiante achando que o dado estava lá — o GeoJSON só aparecia
   * segundos depois. Pega quem abre o app por um link direto para uma área
   * (`#area=`, main.js) e o duplo clique na chave do painel.
   *
   * @returns {Promise<void>} resolve quando a camada está de fato na cena
   */
  enable(id) {
    if (this.isEnabled(id)) return Promise.resolve();
    const emVoo = this._emVoo.get(id);
    if (emVoo) return emVoo;
    const promessa = this._carregar(id).finally(() => this._emVoo.delete(id));
    this._emVoo.set(id, promessa);
    return promessa;
  }

  /** Corpo da carga — sempre por `enable`, que cuida da concorrência. */
  async _carregar(id) {
    const current = this.state.get(id) ?? { object: null, featureCount: 0, loading: false, error: null };
    current.loading = true;
    current.error = null;
    this.state.set(id, current);

    try {
      const cfg = this.registry.get(id) ?? {};
      let object;
      let featureCount = 0;

      if (cfg.render === 'custom' && this.custom[id]) {
        // Camada dinâmica custom (ex.: satélites SGP4): a factory devolve o
        // grupo pronto e, opcionalmente, uma função update(agora) por frame.
        const built = await this.custom[id]();
        object = built.group;
        featureCount = built.featureCount ?? 0;
        if (typeof built.update === 'function') this.updaters.set(id, built.update);
      } else {
        const fc = await fetchLayer(id);
        // render 'fill' = área preenchida + contorno (áreas identificáveis em
        // zoom profundo — objetivo central do app); 'line' = só contorno;
        // 'point' = localização sem contorno, para fonte que só publica o ponto
        // (imóveis da União, cujo perímetro a SPU não divulga).
        if (cfg.render === 'fill') {
          object = new THREE.Group();
          object.add(geojsonToFilled(fc, { color: cfg.color ?? 0xfbbf24 }));
          object.add(geojsonToLines(fc, { color: cfg.color ?? 0xfbbf24, opacity: 1.0 }));
        } else if (cfg.render === 'point') {
          object = geojsonToPoints(fc, { color: cfg.color ?? 0x34d399, size: cfg.pointSize ?? 0.006 });
        } else {
          object = geojsonToLines(fc, { color: cfg.color ?? 0x38bdf8 });
        }
        featureCount = fc.features.length;
        this.geojson.set(id, fc);
      }

      object.name = `layer:${id}`;
      this.scene.add(object);
      current.object = object;
      current.featureCount = featureCount;
      console.info(`[LayerManager] camada "${id}" ativada (${featureCount} feições)`);
    } catch (err) {
      // Esperado em G0+G1 (endpoint só existe na G2): registra e segue.
      current.error = err.message;
      current.object = null;
      current.featureCount = 0;
      console.warn(`[LayerManager] camada "${id}" não ativada: ${err.message}`);
    } finally {
      current.loading = false;
    }
  }

  /** Desliga uma camada: remove da cena e libera geometria/material. */
  disable(id) {
    const current = this.state.get(id);
    if (!current?.object) return;
    this.scene.remove(current.object);
    disposeDeep(current.object);
    current.object = null;
    current.featureCount = 0;
    this.geojson.delete(id);
    this.updaters.delete(id);
    console.info(`[LayerManager] camada "${id}" desativada`);
  }

  /** Alterna o estado da camada. @returns {Promise<boolean>|boolean} novo estado */
  toggle(id) {
    return this.isEnabled(id) ? (this.disable(id), false) : this.enable(id).then(() => this.isEnabled(id));
  }
}

/** Libera recursos GPU de um objeto e seus descendentes (plano §6). */
function disposeDeep(root) {
  root.traverse((node) => {
    node.geometry?.dispose?.();
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const m of mats) m?.dispose?.();
  });
}

// Re-export para conveniência de quem precisar do conversor direto.
export { geojsonToLines, geojsonToPoints };
