/**
 * municipios.js — índice dos 853 municípios de Minas, carregado uma vez.
 *
 * Duas partes do app precisam da mesma malha: os botões de foco (que agora são
 * municípios, não regiões) e o campo de busca. Antes o campo baixava sozinho e
 * os botões usavam recortes prontos em `data/*.geojson` — dois caminhos para a
 * mesma pergunta, e só cinco lugares alcançáveis.
 *
 * Uma busca de rede por sessão; quem chamar durante o carregamento recebe a
 * mesma promessa.
 */

import { fetchLayer } from './api.js';

const CAMADA = 'municipios-mg';

/** Tira acento e caixa — quem digita nome de município não pensa em acento. */
export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

let carga = null;

/**
 * @returns {Promise<{porNome: Map<string, object>, porCodigo: Map<string, object>, nomes: string[]}>}
 */
export function carregarMunicipios() {
  if (!carga) {
    carga = fetchLayer(CAMADA).then((fc) => {
      const porNome = new Map();
      const porCodigo = new Map();
      const nomes = [];
      for (const f of fc.features ?? []) {
        const p = f.properties ?? {};
        if (p.nome) {
          const chave = normalizar(p.nome);
          if (!porNome.has(chave)) {
            porNome.set(chave, f);
            nomes.push(p.nome);
          }
        }
        if (p.geocodigo) porCodigo.set(String(p.geocodigo), f);
      }
      nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return { porNome, porCodigo, nomes };
    });
  }
  return carga;
}

/** Feature de um município pelo código do IBGE (ou null). */
export async function municipioPorCodigo(geocodigo) {
  const { porCodigo } = await carregarMunicipios();
  return porCodigo.get(String(geocodigo)) ?? null;
}
