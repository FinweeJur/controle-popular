/**
 * icones.js — ícones do painel de camadas, um por CONCEITO (config.js →
 * CAMADAS), não um por feição do mapa.
 *
 * Pedido do dono: reconhecimento visual imediato nas 22 linhas do painel,
 * "algo mais leve no design tipo Lucide" — não emoji. `lucide-react` já é
 * dependência do projeto nas páginas React (Next.js, com build), mas o globo
 * é ES module puro servido de `public/`, SEM build step (ver o cabeçalho de
 * config.js) — não há como `import` um pacote npm aqui. A saída: copiar só o
 * miolo SVG (`<path>`/`<circle>`/...) de cada ícone do Lucide — não a
 * biblioteca — e desenhar com `document.createElementNS`, do jeito que
 * `lucide-static` (mesmo pacote, licença ISC, sem React) publica cada
 * ícone: https://unpkg.com/lucide-static/icons/<nome>.svg. Confirmado o
 * ícone existe no pacote antes de entrar aqui — nenhum foi inventado de
 * memória.
 *
 * Nenhum ícone entra sobre feição do mapa (47.830 polígonos do SIGMINE
 * feriam isso na certa, no celular) — só nas 22 linhas do painel, que são um
 * custo fixo, sempre o mesmo, ligadas ou não. Ver `layerspanel.js`.
 */

const NS = 'http://www.w3.org/2000/svg';

/**
 * Miolo de cada ícone: array de [tag, atributos]. Igual ao que o Lucide
 * publica, sem duplicar comentário de licença por ícone — a licença (ISC) e
 * a fonte estão no comentário do topo deste arquivo, uma vez só, para as 22.
 */
const DEFINICOES = {
  'square-dashed': [
    ['path', { d: 'M5 3a2 2 0 0 0-2 2' }],
    ['path', { d: 'M19 3a2 2 0 0 1 2 2' }],
    ['path', { d: 'M21 19a2 2 0 0 1-2 2' }],
    ['path', { d: 'M5 21a2 2 0 0 1-2-2' }],
    ['path', { d: 'M9 3h1' }],
    ['path', { d: 'M9 21h1' }],
    ['path', { d: 'M14 3h1' }],
    ['path', { d: 'M14 21h1' }],
    ['path', { d: 'M3 9v1' }],
    ['path', { d: 'M21 9v1' }],
    ['path', { d: 'M3 14v1' }],
    ['path', { d: 'M21 14v1' }],
  ],
  'zoom-in': [
    ['circle', { cx: '11', cy: '11', r: '8' }],
    ['line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }],
    ['line', { x1: '11', x2: '11', y1: '8', y2: '14' }],
    ['line', { x1: '8', x2: '14', y1: '11', y2: '11' }],
  ],
  landmark: [
    ['path', { d: 'M10 18v-7' }],
    ['path', { d: 'M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z' }],
    ['path', { d: 'M14 18v-7' }],
    ['path', { d: 'M18 18v-7' }],
    ['path', { d: 'M3 22h18' }],
    ['path', { d: 'M6 18v-7' }],
  ],
  home: [
    ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }],
    ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
  ],
  flag: [
    ['path', { d: 'M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528' }],
  ],
  'building-2': [
    ['path', { d: 'M10 12h4' }],
    ['path', { d: 'M10 8h4' }],
    ['path', { d: 'M14 21v-3a2 2 0 0 0-4 0v3' }],
    ['path', { d: 'M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2' }],
    ['path', { d: 'M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16' }],
  ],
  'circle-help': [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  'triangle-alert': [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  waves: [
    ['path', { d: 'M2 12q2.5 2 5 0t5 0 5 0 5 0' }],
    ['path', { d: 'M2 19q2.5 2 5 0t5 0 5 0 5 0' }],
    ['path', { d: 'M2 5q2.5 2 5 0t5 0 5 0 5 0' }],
  ],
  feather: [
    ['path', { d: 'M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z' }],
    ['path', { d: 'M16 8 2 22' }],
    ['path', { d: 'M17.488 15H9' }],
  ],
  'shield-alert': [
    ['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }],
    ['path', { d: 'M12 8v4' }],
    ['path', { d: 'M12 16h.01' }],
  ],
  pickaxe: [
    ['path', { d: 'm14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999' }],
    ['path', { d: 'M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024' }],
    ['path', { d: 'M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069' }],
    ['path', { d: 'M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z' }],
  ],
  'file-text': [
    ['path', { d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z' }],
    ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5' }],
    ['path', { d: 'M10 9H8' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }],
  ],
  coins: [
    ['path', { d: 'M13.744 17.736a6 6 0 1 1-7.48-7.48' }],
    ['path', { d: 'M15 6h1v4' }],
    ['path', { d: 'm6.134 14.768.866-.5 2 3.464' }],
    ['circle', { cx: '16', cy: '8', r: '6' }],
  ],
  'hand-coins': [
    ['path', { d: 'M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17' }],
    ['path', { d: 'm7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9' }],
    ['path', { d: 'm2 16 6 6' }],
    ['circle', { cx: '16', cy: '9', r: '2.9' }],
    ['circle', { cx: '6', cy: '5', r: '3' }],
  ],
  building: [
    ['path', { d: 'M12 10h.01' }],
    ['path', { d: 'M12 14h.01' }],
    ['path', { d: 'M12 6h.01' }],
    ['path', { d: 'M16 10h.01' }],
    ['path', { d: 'M16 14h.01' }],
    ['path', { d: 'M16 6h.01' }],
    ['path', { d: 'M8 10h.01' }],
    ['path', { d: 'M8 14h.01' }],
    ['path', { d: 'M8 6h.01' }],
    ['path', { d: 'M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3' }],
    ['rect', { x: '4', y: '2', width: '16', height: '20', rx: '2' }],
  ],
  'scroll-text': [
    ['path', { d: 'M15 12h-5' }],
    ['path', { d: 'M15 8h-5' }],
    ['path', { d: 'M19 17V5a2 2 0 0 0-2-2H4' }],
    ['path', { d: 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3' }],
  ],
  ban: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M4.929 4.929 19.07 19.071' }],
  ],
  'list-checks': [
    ['path', { d: 'M13 5h8' }],
    ['path', { d: 'M13 12h8' }],
    ['path', { d: 'M13 19h8' }],
    ['path', { d: 'm3 17 2 2 4-4' }],
    ['path', { d: 'm3 7 2 2 4-4' }],
  ],
  newspaper: [
    ['path', { d: 'M15 18h-5' }],
    ['path', { d: 'M18 14h-8' }],
    ['path', { d: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2' }],
    ['rect', { width: '8', height: '4', x: '10', y: '6', rx: '1' }],
  ],
  map: [
    ['path', { d: 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z' }],
    ['path', { d: 'M15 5.764v15' }],
    ['path', { d: 'M9 3.236v15' }],
  ],
  // --- Os 6 ícones novos abaixo entraram em 13/08/2026 para as 8 camadas do
  // rompimento real da B1 (Brumadinho) — confirmados no pacote antes de
  // entrar aqui, mesma disciplina do resto deste arquivo, via
  // https://unpkg.com/lucide-static/icons/<nome>.svg.
  droplets: [
    ['path', { d: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z' }],
    ['path', { d: 'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97' }],
  ],
  radio: [
    ['path', { d: 'M16.247 7.761a6 6 0 0 1 0 8.478' }],
    ['path', { d: 'M19.075 4.933a10 10 0 0 1 0 14.134' }],
    ['path', { d: 'M4.925 19.067a10 10 0 0 1 0-14.134' }],
    ['path', { d: 'M7.753 16.239a6 6 0 0 1 0-8.478' }],
    ['circle', { cx: '12', cy: '12', r: '2' }],
  ],
  footprints: [
    ['path', { d: 'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z' }],
    ['path', { d: 'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z' }],
    ['path', { d: 'M16 17h4' }],
    ['path', { d: 'M4 13h4' }],
  ],
  shield: [
    ['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }],
  ],
  'hard-hat': [
    ['path', { d: 'M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5' }],
    ['path', { d: 'M14 6a6 6 0 0 1 6 6v3' }],
    ['path', { d: 'M4 15v-3a6 6 0 0 1 6-6' }],
    ['rect', { x: '2', y: '15', width: '20', height: '4', rx: '1' }],
  ],
  sprout: [
    ['path', { d: 'M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3' }],
    ['path', { d: 'M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4' }],
    ['path', { d: 'M5 21h14' }],
  ],
  satellite: [
    ['path', { d: 'm13.5 6.5-3.148-3.148a1.205 1.205 0 0 0-1.704 0L6.352 5.648a1.205 1.205 0 0 0 0 1.704L9.5 10.5' }],
    ['path', { d: 'M16.5 7.5 19 5' }],
    ['path', { d: 'm17.5 10.5 3.148 3.148a1.205 1.205 0 0 1 0 1.704l-2.296 2.296a1.205 1.205 0 0 1-1.704 0L13.5 14.5' }],
    ['path', { d: 'M9 21a6 6 0 0 0-6-6' }],
    ['path', { d: 'M9.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l4.296-4.296a1.205 1.205 0 0 0 0-1.704l-2.296-2.296a1.205 1.205 0 0 0-1.704 0z' }],
  ],
};

/**
 * id de CAMADA (config.js, o CONCEITO da linha do painel — não o id de
 * FONTE do LAYER_REGISTRY, embora vários coincidam de propósito) → nome do
 * ícone em DEFINICOES.
 *
 * ⚠️ `sigmine-operacao` (picareta) e `sigmine-interesse` (documento) são a
 * distinção que importa mais nesta lista, pedida explicitamente: a diferença
 * entre as duas camadas do SIGMINE não é de grau (mais ou menos mina), é de
 * NATUREZA — uma autoriza extrair, a outra é só requerimento no papel. Um
 * ícone de picareta em "Interesse minerário" diria, ao primeiro olhar, que
 * há mina onde há só protocolo — e essa camada é 87% das poligonais do
 * SIGMINE no mapa (47.830 de 54.920), o erro apareceria na maior parte dele.
 * Por isso as duas levam ícones de ESPÉCIE diferente (ferramenta × papel),
 * não o mesmo ícone em tons diferentes.
 */
const ICONE_POR_CAMADA = {
  'vazio-cadastral': 'square-dashed',
  // A irmã de Curvelo é o MESMO fenômeno visto mais de perto (limiar de 10 ha
  // contra 500 ha — ver o comentário grande em config.js) — não outro
  // assunto. `zoom-in` carrega essa relação: "a mesma coisa, mais perto".
  'vazio-cadastral-curvelo': 'zoom-in',
  'terra-publica-certificada': 'landmark',
  assentamentos: 'home',
  // Distinto do ícone de terra indígena de propósito — nunca o mesmo ícone
  // com cor diferente (pedido explícito): comunidade titulada, não etnia.
  'territorios-quilombolas': 'flag',
  'spu-imoveis-uniao': 'building-2',
  // Única camada da seção que é uma LACUNA (o INCRA não publica esta base) —
  // por isso leva o ícone de pergunta, não o de prédio/casa das vizinhas.
  'devolutas-arrecadadas': 'circle-help',
  'zas-barragens': 'triangle-alert',
  'mancha-inundacao-barragens': 'waves',
  // As 8 camadas do rompimento real da B1 (13/08/2026) — 'droplets' (rejeito
  // líquido) em vez de 'waves' de propósito: 'waves' já é a mancha
  // HIPOTÉTICA acima, e reusar o mesmo ícone confundiria visualmente o par
  // que o hint/aviso de cada camada trabalha pra distinguir por texto.
  'brumadinho-area-atingida': 'droplets',
  'brumadinho-monitoramento': 'radio',
  'brumadinho-remanejamento': 'footprints',
  'brumadinho-estruturas-contencao': 'shield',
  // As três "obras e intervenções" (área/ponto/linha) são o MESMO conceito
  // partido por geometria — mesmo ícone nas três de propósito, ao contrário
  // do par sigmine-operacao/interesse (que É de propósito diferente, ver
  // comentário deles acima).
  'brumadinho-obras-poligonais': 'hard-hat',
  'brumadinho-obras-pontuais': 'hard-hat',
  'brumadinho-obras-lineares': 'hard-hat',
  'brumadinho-restauracao': 'sprout',
  // Não é ícone de pessoa (pedido explícito) — evita a leitura de "isto
  // representa UMA pessoa/etnia genérica"; penas remetem a território
  // originário sem caricaturar um povo específico.
  'terras-indigenas': 'feather',
  'alerta-ti-mancha': 'shield-alert',
  'sigmine-operacao': 'pickaxe',
  'sigmine-interesse': 'file-text',
  'cfem-municipios': 'coins',
  'cruzamento-dinheiro-ambiental-4cidades': 'hand-coins',
  'lotes-vagos-bh': 'building',
  'normas-geolocalizadas': 'scroll-text',
  'embargos-ambientais': 'ban',
  'checagem-g0': 'list-checks',
  'pesquisa-noticias': 'newspaper',
  'municipios-mg': 'map',
  'satelites-orbita': 'satellite',
};

/**
 * Monta o `<svg>` do ícone de uma camada, ou `null` se não houver mapeamento
 * (camada nova sem ícone ainda — a linha cai para trás no marcador de
 * forma+cor de sempre, não quebra).
 *
 * Via `createElementNS`/`setAttribute`, não `innerHTML`: mesma garantia que
 * o resto de `layerspanel.js` já dá — nada aqui pode injetar marcação, ainda
 * que os dados sejam estáticos deste arquivo.
 *
 * `aria-hidden`: o ícone é decorativo. O nome da camada (`.layer-name`)
 * continua sendo o que identifica a linha para quem usa leitor de tela — o
 * ícone nunca substitui o texto, só acelera o reconhecimento visual de quem
 * já sabe o que cada forma significa.
 *
 * @param {string} camadaId
 * @returns {SVGSVGElement|null}
 */
export function criarIconeCamada(camadaId) {
  const nome = ICONE_POR_CAMADA[camadaId];
  const def = nome && DEFINICOES[nome];
  if (!def) return null;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  // currentColor: herda a cor da camada, ajustada por `.layer-icone` via CSS
  // (ver hud.css) — o mesmo `--cor-camada` que já pinta `.layer-marca`.
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('layer-icone-svg');

  for (const [tag, attrs] of def) {
    const el = document.createElementNS(NS, tag);
    for (const [nomeAttr, valor] of Object.entries(attrs)) el.setAttribute(nomeAttr, valor);
    svg.appendChild(el);
  }
  return svg;
}
