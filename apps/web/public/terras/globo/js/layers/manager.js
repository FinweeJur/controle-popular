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
    /** @type {Map<string, {object: THREE.Object3D|null, featureCount: number, visibleCount: number, loading: boolean, error: string|null}>} */
    this.state = new Map();
    /**
     * GeoJSON cru por camada, SEMPRE COMPLETO — nunca uma cópia filtrada.
     *
     * O índice de uma feição aqui é o índice dela no arquivo, e esse número é
     * endereço público (`#area=<fonte>:<índice>` no main.js,
     * `detalhe.html?fid=` no inspetor). Guardar aqui o resultado de um filtro
     * renumeraria as feições toda vez que alguém trocasse o filtro de região, e
     * links compartilhados passariam a abrir a área errada — em silêncio, que é
     * o pior jeito. Quem filtra é `_incluir`, na construção da geometria.
     */
    this.geojson = new Map();
    /** Funções update(agora) de camadas dinâmicas (ex.: satélites) */
    this.updaters = new Map();
    /** Cargas em andamento por camada: id -> Promise (ver `enable`) */
    this._emVoo = new Map();
    /**
     * Filtro de exibição por feição: `(fonteId, feature, idx) => boolean`.
     * `null` = desenha tudo. Quem define é o painel, pelo filtro de região.
     */
    this._filtro = null;
  }

  /**
   * Troca o filtro de exibição e REDESENHA as camadas ligadas.
   *
   * Redesenha a partir do GeoJSON já em memória: nenhuma camada é buscada de
   * novo, porque o filtro não muda QUAIS arquivos foram baixados, só o que se
   * desenha deles.
   *
   * Medido no navegador com a maior camada do mapa ligada ("Terra sem
   * cadastro" = 651 KB da bacia + 4,6 MB dos Vales, 360 áreas), cronometrando o
   * trecho síncrono de cada troca de região: 639 ms na primeira troca e 61, 101,
   * 104 e 184 ms nas seguintes — a primeira paga a reconstrução das duas fontes
   * de uma vez, as outras só o que mudou. E o que importa: `performance
   * .getEntriesByType('resource')` ficou em 5 arquivos antes e 5 depois de
   * quatro trocas de região. Zero byte de rede, como prometido.
   *
   * @param {?function} filtro
   */
  setFiltro(filtro) {
    this._filtro = filtro ?? null;
    for (const [id, st] of this.state) {
      if (st.object && this.geojson.has(id)) this._redesenhar(id);
    }
  }

  /** O filtro deixa esta feição aparecer? Sem filtro, tudo aparece. */
  _incluir(id) {
    const filtro = this._filtro;
    if (!filtro) return undefined;   // undefined = sem filtro, caminho rápido
    return (feature, idx) => filtro(id, feature, idx);
  }

  /** Quantas feições desta camada estão de fato DESENHADAS agora. */
  visibleCount(id) {
    return this.state.get(id)?.visibleCount ?? 0;
  }

  /**
   * Esta área está desenhada no globo?
   *
   * O inspetor pergunta antes de abrir a ficha de um clique: `this.geojson`
   * tem o arquivo inteiro, então sem esta checagem um clique perto de uma área
   * escondida pelo filtro abriria a ficha dela — a pessoa clicaria no vazio e
   * receberia um achado que não está na tela.
   */
  estaVisivel(id, idx) {
    if (!this.isEnabled(id)) return false;
    if (!this._filtro) return true;
    const feature = this.geojson.get(id)?.features?.[idx];
    return feature ? Boolean(this._filtro(id, feature, idx)) : false;
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
    const current = this.state.get(id) ?? { object: null, featureCount: 0, visibleCount: 0, loading: false, error: null };
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
        current.visibleCount = featureCount;
      } else {
        const fc = await fetchLayer(id, { comprimida: cfg.comprimida });
        this.geojson.set(id, fc);
        featureCount = fc.features.length;
        object = this._construir(id, cfg, fc);
        current.visibleCount = this._contarVisiveis(id, fc);
      }

      object.name = `layer:${id}`;
      this.scene.add(object);
      current.object = object;
      current.featureCount = featureCount;
      const nota = current.visibleCount === featureCount
        ? `${featureCount} áreas`
        : `${current.visibleCount} de ${featureCount} áreas (filtro de região)`;
      console.info(`[LayerManager] camada "${id}" ativada (${nota})`);
    } catch (err) {
      // Esperado em G0+G1 (endpoint só existe na G2): registra e segue.
      current.error = err.message;
      current.object = null;
      current.featureCount = 0;
      current.visibleCount = 0;
      console.warn(`[LayerManager] camada "${id}" não ativada: ${err.message}`);
    } finally {
      current.loading = false;
    }
  }

  /**
   * Monta o objeto 3D de uma camada a partir do GeoJSON já em memória.
   *
   * render 'fill' = área preenchida + contorno (áreas identificáveis em zoom
   * profundo — objetivo central do app); 'line' = só contorno; 'point' =
   * localização sem contorno, para fonte que só publica o ponto (imóveis da
   * União, cujo perímetro a SPU não divulga).
   */
  _construir(id, cfg, fc) {
    const incluir = this._incluir(id);
    if (cfg.render === 'fill') {
      const grupo = new THREE.Group();
      grupo.add(geojsonToFilled(fc, { color: cfg.color ?? 0xfbbf24, incluir }));
      grupo.add(geojsonToLines(fc, { color: cfg.color ?? 0xfbbf24, opacity: 1.0, incluir }));
      return grupo;
    }
    if (cfg.render === 'point') {
      return geojsonToPoints(fc, { color: cfg.color ?? 0x34d399, size: cfg.pointSize ?? 0.006, incluir });
    }
    return geojsonToLines(fc, { color: cfg.color ?? 0x38bdf8, incluir });
  }

  /** Quantas feições o filtro atual deixa passar nesta camada. */
  _contarVisiveis(id, fc) {
    if (!this._filtro) return fc.features.length;
    let n = 0;
    for (let i = 0; i < fc.features.length; i++) if (this._filtro(id, fc.features[i], i)) n++;
    return n;
  }

  /**
   * Refaz a geometria de uma camada JÁ CARREGADA, sem tocar na rede.
   *
   * Troca o objeto na cena e libera o antigo. `this.geojson` não é mexido — é
   * dele que a geometria nova sai, e é ele que guarda os índices de arquivo.
   */
  _redesenhar(id) {
    const st = this.state.get(id);
    const fc = this.geojson.get(id);
    if (!st?.object || !fc) return;
    const cfg = this.registry.get(id) ?? {};

    const anterior = st.object;
    const novo = this._construir(id, cfg, fc);
    novo.name = `layer:${id}`;
    // Adiciona o novo ANTES de remover o velho: entre um `scene.remove` e o
    // `scene.add` seguinte existe pelo menos um frame em que a camada não está
    // na cena, e no meio de uma troca de filtro isso pisca na tela.
    this.scene.add(novo);
    this.scene.remove(anterior);
    disposeDeep(anterior);
    st.object = novo;
    st.visibleCount = this._contarVisiveis(id, fc);
  }

  /** Desliga uma camada: remove da cena e libera geometria/material. */
  disable(id) {
    const current = this.state.get(id);
    if (!current?.object) return;
    this.scene.remove(current.object);
    disposeDeep(current.object);
    current.object = null;
    current.featureCount = 0;
    current.visibleCount = 0;
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
