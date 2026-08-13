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
 *
 * ═══ CAMADAS COMPRIMIDAS (13/08/2026) ═══
 *
 * O teto de arquivo do Workers Static Assets é 25 MiB — igual no plano free
 * e no pago. Três camadas passavam disso cru (`sigmine-interesse` sozinha
 * pesava 32,4 MiB): o deploy falhava nesse arquivo. Saída escolhida pelo
 * dono do projeto: guardar `.geojson.gz` (gzip -9, ~4-5× menor) e
 * descomprimir NO NAVEGADOR com `DecompressionStream('gzip')` — API nativa,
 * sem biblioteca nova. Ver `scripts/comprimir-camadas-grandes.mjs` para como
 * o `.gz` é gerado e como refazê-lo.
 *
 * `fetchLayer` não ADIVINHA se uma camada está comprimida (não existe jeito
 * confiável de inferir isso por HTTP sem já ter feito o pedido — a extensão
 * do arquivo pedido É a decisão), e não faz DOIS fetches (pedir o `.geojson`
 * cru, tropeçar num 404, tentar de novo o `.gz`) — isso dobraria a latência
 * justamente na camada mais pesada do mapa, na pior hora possível para
 * dobrar. Quem sabe é `LAYER_REGISTRY` (`comprimida: true`), e quem repassa é
 * `LayerManager._carregar` — ver `js/layers/manager.js`.
 */

const API_BASE = '/terras/globo/dados/camadas';

/**
 * Busca uma camada (arquivo estático) e retorna a FeatureCollection.
 *
 * @param {string} id                 id da camada (ver LAYER_REGISTRY em config.js)
 * @param {object} [opts]
 * @param {string} [opts.uf]          mantido por compatibilidade de assinatura — não
 *                                    filtra nada, o arquivo estático já é o recorte final
 * @param {boolean} [opts.comprimida] true = buscar `<id>.geojson.gz` e passar por
 *                                    `DecompressionStream('gzip')` antes do `JSON.parse`.
 *                                    Vem de `LAYER_REGISTRY[id].comprimida` — ver o
 *                                    comentário do topo do arquivo.
 * @param {AbortSignal} [opts.signal] para cancelar fetchs pendentes
 * @returns {Promise<object>} GeoJSON FeatureCollection
 * @throws {Error} com mensagem amigável se HTTP erro, payload inválido, ou o
 *                  navegador não tiver `DecompressionStream` (camada comprimida)
 */
export async function fetchLayer(id, { uf, comprimida, signal } = {}) {
  void uf; // não usado na URL — ver nota da assinatura acima
  const url = comprimida
    ? `${API_BASE}/${encodeURIComponent(id)}.geojson.gz`
    : `${API_BASE}/${encodeURIComponent(id)}.geojson`;

  if (comprimida && typeof DecompressionStream === 'undefined') {
    // `DecompressionStream` existe em todo navegador moderno (Chrome/Edge 80+,
    // Firefox 113+, Safari 16.4+) — quem não tiver não deve travar o globo
    // inteiro por causa de UMA camada. A falha fica contida em `LayerManager`
    // (o `catch` de `_carregar`), que já mostra "indisponível" só na linha
    // desta camada, com este texto no tooltip — o resto do globo continua de
    // pé.
    throw new Error(`Camada "${id}" precisa de descompressão no navegador (DecompressionStream), que este navegador não tem`);
  }

  let resp;
  try {
    resp = await fetch(url, { signal, headers: { Accept: comprimida ? 'application/gzip' : 'application/geo+json, application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(`Falha de rede ao buscar camada "${id}": ${err.message}`);
  }

  if (!resp.ok) {
    throw new Error(`Camada "${id}" indisponível (HTTP ${resp.status})`);
  }

  let fc;
  try {
    if (comprimida) {
      // `resp.body` é o stream de bytes comprimidos, ainda chegando da rede;
      // `pipeThrough(DecompressionStream)` descomprime em cima do stream, sem
      // esperar o `.gz` inteiro chegar para só então começar a descomprimir.
      const descomprimido = resp.body.pipeThrough(new DecompressionStream('gzip'));
      const texto = await new Response(descomprimido).text();
      fc = JSON.parse(texto);
    } else {
      fc = await resp.json();
    }
  } catch (err) {
    throw new Error(`Resposta da camada "${id}" não pôde ser descomprimida/lida: ${err.message}`);
  }

  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error(`Resposta da camada "${id}" não é uma FeatureCollection válida`);
  }
  return fc;
}
