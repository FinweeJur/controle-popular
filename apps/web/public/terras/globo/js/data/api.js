/**
 * api.js — cliente de dados do globo 3D (arquivo estático do portal).
 *
 * Publicado dentro do Controle Popular (`output: 'export'`, sem rota de API
 * em produção): cada camada é um `.geojson` estático em
 * `apps/web/public/terras/globo/dados/camadas/`, não mais um endpoint
 * dinâmico. Era `GET /api/v1/camadas/{layer_id}?uf=MG` no backend FastAPI
 * original — esse endpoint já era só um `FileResponse` do mesmo arquivo,
 * sem lógica nenhuma, e `uf` nunca filtrava nada no servidor. Vira `GET
 * /terras/globo/dados/camadas/{layer_id}.geojson`, sem querystring.
 */

const API_BASE = '/terras/globo/dados/camadas';

/**
 * Busca uma camada (arquivo estático) e retorna a FeatureCollection.
 *
 * @param {string} id                 id da camada (ver LAYER_REGISTRY em config.js)
 * @param {object} [opts]
 * @param {string} [opts.uf]          mantido por compatibilidade de assinatura — não
 *                                    filtra nada, o arquivo estático já é o recorte final
 * @param {AbortSignal} [opts.signal] para cancelar fetchs pendentes
 * @returns {Promise<object>} GeoJSON FeatureCollection
 * @throws {Error} com mensagem amigável se HTTP erro ou payload inválido
 */
export async function fetchLayer(id, { uf, signal } = {}) {
  void uf; // não usado na URL — ver nota da assinatura acima
  const url = `${API_BASE}/${encodeURIComponent(id)}.geojson`;

  let resp;
  try {
    resp = await fetch(url, { signal, headers: { Accept: 'application/geo+json, application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(`Falha de rede ao buscar camada "${id}": ${err.message}`);
  }

  if (!resp.ok) {
    throw new Error(`Camada "${id}" indisponível (HTTP ${resp.status})`);
  }

  const fc = await resp.json();
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error(`Resposta da camada "${id}" não é uma FeatureCollection válida`);
  }
  return fc;
}
