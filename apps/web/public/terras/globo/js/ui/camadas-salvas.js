/**
 * camadas-salvas.js — memória local das camadas ligadas no globo 3D.
 *
 * ## O que é, e por que existe
 *
 * O globo 3D do Terras Públicas tem dezenas de linhas de camada (config.js).
 * Quem monta um recorte de estudo — por exemplo "Terra sem cadastro" +
 * "Territórios quilombolas" + "Zona de Autossalvamento" — e fecha a página
 * perde a seleção: na volta, o globo abre no padrão de fábrica. Este módulo
 * guarda o CONJUNTO de camadas ligadas no aparelho (`localStorage`), sem
 * cadastro, e o devolve na próxima visita.
 *
 * A regra de produto é a Camada 4 do plano do ecossistema
 * (docs/planos/PLANO-ECOSSISTEMA-CIVICO.md): "estado na URL, gosto no
 * aparelho, nada de rastreio". Nada aqui sai do computador — não há conta,
 * não há servidor, não há cookie de terceiro.
 *
 * ## As três portas do estado, e a precedência entre elas
 *
 *  1. `?camadas=a,b,c` — link compartilhável; é a mais específica, então manda
 *     sobre as outras. Aceita só ids que existem: id inexistente é ignorado em
 *     voz alta, e camada estruturalmente vazia é recusada (acenderia uma chave
 *     que não desenha nada — mesma razão do `camadaDoEndereco`).
 *  2. `?camada=<id>` — link antigo, de uma camada só; continua valendo, sem
 *     regressão (o `camadaDoEndereco` de layerspanel.js cuida dele).
 *  3. `localStorage` — o último recorte da própria pessoa, restaurado quando
 *     não há nenhum pedido explícito no endereço.
 *
 * ⚠️ O que vem da URL NÃO sobrescreve o que está guardado. Abrir um link
 * emprestado e não mexer em nada devolve, na próxima visita, o recorte da
 * pessoa — o link é empréstimo, não escrita.
 *
 * ## Por que funções puras num módulo à parte
 *
 * O `main.js` roda o bootstrap inteiro no carregamento e não pode ser
 * importado num teste (precisa de WebGL, DOM e rede). Como em
 * `camadaDoEndereco` (layerspanel.js), o que é decisão de CONTEÚDO — quais
 * ids são válidos, como o link se monta, o que a memória aceita — mora onde dá
 * para testar no Node, sem navegador: `camadas-salvas.test.mjs`.
 */

/**
 * Chave da memória no `localStorage`. Prefixo de namespace do projeto
 * (`cp:`) e nome curto em português, como o resto das preferências locais
 * já usadas no portal (ex.: `theme`, `cp_cvd`).
 */
export const CHAVE_CAMADAS_SALVAS = 'cp:globo-camadas';

/**
 * Normaliza uma lista de ids vinda de qualquer lugar (string de URL separada
 * por vírgula, array do `JSON.parse`, array de entrada): tira espaços, joga
 * fora vazios e REPETIDOS, preservando a ordem da primeira aparição.
 *
 * Aceita `null`/`undefined` sem quebrar — devolve `[]`. É a função de entrada
 * de todas as outras, para que o formato torto nunca chegue ao resto.
 *
 * @param {string|string[]|null|undefined} valor
 * @returns {string[]} ids limpos, sem duplicata
 */
export function normalizarIds(valor) {
  const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(',');
  const vistos = new Set();
  const saida = [];
  for (const bruto of lista) {
    const id = String(bruto ?? '').trim();
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    saida.push(id);
  }
  return saida;
}

/**
 * Os ids válidos entre os recebidos: existe em `camadas` E não é `vazia`.
 *
 * Camada `vazia` (ex.: `devolutas-arrecadadas`, sem fonte publicada hoje) não
 * tem chave no painel — é desenhada como linha travada. Aceitá-la aqui ligaria
 * uma chave que a UI mantém desabilitada e faria o painel mentir sobre o
 * motivo de estar vazia; ver o comentário de `camadaDoEndereco`.
 *
 * @param {string|string[]} ids
 * @param {Array<{id: string, vazia?: boolean}>} camadas - CAMADAS_RESOLVIDAS
 * @returns {string[]}
 */
export function filtrarCamadasValidas(ids, camadas) {
  const validos = new Set(
    (camadas ?? []).filter((c) => c && c.id && !c.vazia).map((c) => c.id),
  );
  return normalizarIds(ids).filter((id) => validos.has(id));
}

/**
 * Lê `?camadas=a,b,c` e devolve a lista de ids válidos a ligar.
 *
 * Devolve `null` quando o parâmetro NÃO está no endereço — a ausência é
 * diferente de um `?camadas=` vazio. Com o parâmetro presente, a lista (mesmo
 * vazia) é a resposta: quem mandou o link mandou o conjunto, e ele não deve
 * cair de volta para as camadas salvas.
 *
 * Id inexistente é pulado com aviso no console — link morto não vira camada
 * acesa, e o silêncio aqui esconde o defeito (mesma lição de
 * `camadaDoEndereco`, em layerspanel.js).
 *
 * @param {string} search - `location.search`, com ou sem `?`
 * @param {Array<{id: string, vazia?: boolean}>} camadas - CAMADAS_RESOLVIDAS
 * @returns {string[]|null} ids a ligar, ou null quando não há `?camadas=`
 */
export function camadasDoEndereco(search, camadas) {
  const params = new URLSearchParams(search ?? '');
  if (!params.has('camadas')) return null;

  const pedidos = normalizarIds(params.get('camadas'));
  const validos = new Set(
    (camadas ?? []).filter((c) => c && c.id && !c.vazia).map((c) => c.id),
  );

  const saida = [];
  for (const id of pedidos) {
    if (validos.has(id)) {
      saida.push(id);
      continue;
    }
    console.warn(`[globe] o endereço pede a camada "${id}" em ?camadas=, que não existe ou está vazia — ignorada.`);
  }
  return saida;
}

/**
 * Lê o conjunto salvo no aparelho.
 *
 * Devolve `null` quando NÃO HÁ memória utilizável — nunca salvou, valor
 * ilegível, ou algo que não é lista. E devolve a lista quando há: inclusive
 * `[]`, que é uma memória VÁLIDA ("a pessoa desligou tudo de propósito") e não
 * pode ser confundida com "nunca salvou", senão "tudo desligado" nunca
 * restauraria. É a mesma distinção de `camadasDoEndereco` entre ausente e
 * vazio, e existe pela mesma razão.
 *
 * Filtra contra `camadas` porque um id salvo pode ter saído do app entre uma
 * visita e outra: id que não existe mais é descartado em silêncio (é dado
 * velho do próprio aparelho, não erro de link, e por isso não merece aviso).
 *
 * @param {{getItem: (k: string) => (string|null)}|null} storage
 * @param {Array<{id: string, vazia?: boolean}>} camadas
 * @returns {string[]|null} ids válidos, ou null quando não há memória
 */
export function lerCamadasSalvas(storage, camadas) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  let bruto;
  try {
    bruto = storage.getItem(CHAVE_CAMADAS_SALVAS);
  } catch {
    // `getItem` pode LANÇAR (navegador com cookies bloqueados, iframe com
    // sandbox). A preferência é um extra; sem ela o globo abre no padrão.
    return null;
  }
  if (bruto == null) return null;

  let lista;
  try {
    lista = JSON.parse(bruto);
  } catch {
    // Memória ilegível conta como sem memória: o padrão de fábrica é uma
    // resposta melhor que "desligue tudo" por causa de um JSON torto.
    return null;
  }
  if (!Array.isArray(lista)) return null;
  return filtrarCamadasValidas(lista, camadas);
}

/**
 * Grava o conjunto no aparelho. Devolve `true` se a escrita passou e `false`
 * se não — quota estourada, armazenamento indisponível —, mas quem chama pode
 * ignorar: guardar o recorte é conveniência, e falhar em silêncio não pode
 * derrubar o clique que ligou a camada.
 *
 * @param {{setItem: (k: string, v: string) => void}|null} storage
 * @param {string[]} ids
 * @returns {boolean}
 */
export function gravarCamadasSalvas(storage, ids) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(CHAVE_CAMADAS_SALVAS, JSON.stringify(normalizarIds(ids)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Monta a URL compartilhável com o conjunto de camadas.
 *
 * Regras de montagem, cada uma com um motivo:
 *
 *  · escreve `?camadas=a,b,c` com os ids na ORDEM recebida (a ordem é a de
 *    ligação, e um link estável diffa melhor);
 *  · lista vazia REMOVE o parâmetro, em vez de escrever `?camadas=` — um link
 *    sem camadas não deve desligar tudo na outra ponta, deve não afirmar nada;
 *  · remove o `?camada=` singular: o link é sobre o CONJUNTO, e deixar o
 *    singular criaria duas fontes de verdade na mesma URL;
 *  · limpa o `#area=`: o link das camadas é sobre as camadas, não sobre a
 *    área que por acaso estava aberta na tela de quem copiou;
 *  · preserva o resto da query (ex.: parâmetros de voo `vooLat`/`vooLon`).
 *
 * @param {string} url - URL absoluta (ex.: `location.href`)
 * @param {string[]} ids
 * @returns {string} a URL montada
 */
export function montarUrlComCamadas(url, ids) {
  const alvo = new URL(url);
  const validos = normalizarIds(ids);

  alvo.searchParams.delete('camadas');
  alvo.searchParams.delete('camada');

  // `searchParams.toString()` escapa o resto; o `camadas` entra CRU para a
  // vírgula não virar `%2C` (os ids são ascii-hífen e não precisam de escape).
  // `URLSearchParams.get` descodifica dos dois jeitos — a diferença é só a
  // legibilidade do link que a pessoa cola no chat.
  const resto = alvo.searchParams.toString();
  const camadas = validos.length ? `camadas=${validos.join(',')}` : '';
  const query = [resto, camadas].filter(Boolean).join('&');
  alvo.search = query ? `?${query}` : '';

  alvo.hash = '';
  return alvo.toString();
}
