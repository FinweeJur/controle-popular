/**
 * exportar.js — leva as áreas da lista para fora do app.
 *
 * Três formatos, porque são três destinos diferentes:
 *
 *   CSV       → planilha de diligência. Abre no Excel, filtra, ordena.
 *   GeoJSON   → QGIS, ou anexo de parecer técnico. Mantém a geometria.
 *   Texto     → ofício e pedido de acesso à informação. Já vem redigido.
 *
 * O conjunto exportado é **o que está na lista**: camadas ligadas e marcadas
 * `listavel`. É a mesma regra do painel — *a lista mostra o que o mapa mostra* —
 * e é o que impede a exportação de virar uma terceira versão da verdade.
 *
 * ## O que este arquivo se recusa a fazer
 *
 * **1. Não exporta camada fictícia.** Qualquer camada marcada `fixture: true` no
 * LAYER_REGISTRY é dado inventado. Hoje NENHUMA está publicada — a única que
 * existia (`candidatos-curvelo`) saiu do registro em 12/08 —, e esta guarda
 * fica de pé mesmo assim: ela é a rede para a próxima, e o teste que a cobre
 * monta a própria camada fictícia em vez de depender de haver uma no ar.
 * O projeto já apagou uma linha sintética do
 * banco porque ela aparecia como imóvel real com nota; um arquivo exportado tem
 * destino pior que uma tela — vai para planilha, para ofício, para cartório. As
 * feições de camada fictícia ficam de fora e o arquivo **diz quantas ficaram**:
 * omitir em silêncio seria a outra metade do mesmo erro.
 *
 * **2. Não solta coordenada sem ressalva.** Coordenada dentro de um documento
 * vira afirmação sobre a terra que este trabalho não faz. Por isso todo formato
 * carrega o bloco de ressalvas, e o CSV ainda repete um resumo em cada linha —
 * quem filtra a planilha perde o cabeçalho.
 *
 * **3. Não usa uma ressalva só para tudo.** A lista mistura vazio cadastral,
 * áreas embargadas e imóveis da União, e a ressalva de cada uma é diferente.
 * Este erro já foi cometido aqui: o botão "Copiar para ofício" rotulava **tudo**
 * como "Área sem cadastro no CAR", o que é falso num imóvel da União. Cada linha
 * traz a coluna `camada`, e o cabeçalho traz a ressalva **de cada camada
 * presente**.
 *
 * **4. Não exporta o que não está na lista branca.** `COLUNAS` é explícito. A
 * camada de embargos já descarta nome e CPF/CNPJ do autuado no pipeline, e a
 * garantia tem de valer também na saída do navegador — campo novo na fonte não
 * pode virar coluna nova aqui sem alguém decidir.
 */

import { ROTULOS, coordenadasDaArea, descreverArea, textoParaPedido } from './rotulos.js';

/** 1 km² = 100 ha. */
const HA_POR_KM2 = 100;
/** Campo oficial (105 × 68 m) = 0,714 ha. */
const HA_POR_CAMPO = 0.714;

/**
 * As colunas do CSV, em ordem, e o rótulo de cada uma.
 *
 * Lista branca, e não "tudo que vier em properties": é o que impede um campo
 * novo na fonte de virar coluna sem ninguém decidir. Os rótulos vêm de
 * `ROTULOS` quando existem, para a planilha falar a mesma língua da ficha.
 *
 * ⚠️ `ponto_lat`, `ponto_lon`, `utm_e` e `utm_n` estão em `OCULTAS` na ficha —
 * lá coordenada é para copiar, não para ler. **Aqui elas são o ponto**: sem
 * coordenada a planilha não leva ninguém a lugar nenhum. Por isso a exportação
 * tem lista própria em vez de reaproveitar `OCULTAS`.
 *
 * `ponto_lat`/`ponto_lon` levam o MESMO ponto que a ficha mostra — inclusive
 * quando ele foi CALCULADO aqui a partir do contorno, porque a fonte não
 * publica coordenada para aquela camada (**970 áreas em sete camadas**
 * listáveis; ver rotulos.js → coordenadasDaArea/pontosuperficie.js). Antes
 * desta correção, `linhaDe()` só olhava `properties` cru: nessas 970 áreas a
 * coluna saía vazia no CSV e no GeoJSON, enquanto o cabeçalho de ressalvas e a
 * ficha (que já calcula o ponto) afirmavam uma coordenada que o arquivo não
 * carregava — um botão entregava, dois omitiam calado.
 *
 * ⟲ O NÚMERO AQUI JÁ FOI 839, E ESTAVA ERRADO NAS DUAS PONTAS. Contava só
 * quatro camadas (embargos 797 + assentamentos 21 + terra pública 19 +
 * quilombolas 2) e esquecia as três irmãs `-vales`, que o próprio parêntese
 * nomeava: assentamentos-vales 54, terra-pública-vales 65,
 * quilombolas-vales 12. Recontado no dado em 12/08 varrendo
 * `dados/camadas/*.geojson`: 970 em sete camadas listáveis, e 1.823 em oito
 * se `municipios-mg` (853) entrar — ela é a única sem `listavel`, então a
 * exportação não a alcança, mas o cálculo do ponto sim. Fica registrado
 * porque o 839 chegou a se propagar para cinco comentários antes de alguém
 * conferir.
 *
 * `ponto_origem` diz qual dos dois casos é: "fonte" ou "calculado a partir do
 * contorno". Vira COLUNA própria, e não sufixo dentro de `ponto_lat`, porque
 * `ponto_lat`/`ponto_lon` precisam continuar sendo NÚMERO puro — é o que abre
 * direto num filtro de planilha ou num "add layer" de QGIS; um sufixo de
 * texto ali quebraria os dois. `utm_e`/`utm_n` continuam vazios quando o
 * ponto é calculado, pela mesma razão de coordenadasDaArea: um UTM da fonte
 * descreve o PONTO PUBLICADO, não o calculado, e misturar os dois seria um
 * par que não se refere à mesma coisa.
 */
export const COLUNAS = [
  ['camada', 'Camada'],
  ['municipio', 'Município'],
  ['codigo_ibge', 'Código do município (IBGE)'],
  ['area_ha', 'Área (ha)'],
  ['area_km2', 'Área (km²)'],
  ['area_campos_futebol', 'Área (campos de futebol)'],
  ['ponto_lat', 'Latitude (SIRGAS 2000)'],
  ['ponto_lon', 'Longitude (SIRGAS 2000)'],
  ['ponto_origem', 'Origem do ponto'],
  ['utm_e', 'UTM E (23S)'],
  ['utm_n', 'UTM N (23S)'],
  ['titularidade', null],
  ['veg_nativa_pct', null],
  ['silvicultura_pct', null],
  ['uso_antropico_pct', null],
  ['supressao_ha', null],
  ['regeneracao_ha', null],
  ['largura_media_m', null],
  ['compacidade', null],
  // Imóveis da União (SPU)
  ['rip', null],
  ['tipo', null],
  ['regime', null],
  ['bairro', null],
  // Áreas embargadas (Sisema). `auto_infracao` é o identificador OFICIAL do ato
  // e o que permite conferir na fonte — o mesmo papel do RIP. Nome e documento
  // do autuado não existem no dado que chega aqui, e não entram nesta lista.
  ['auto_infracao', 'Auto de infração'],
  ['data', 'Data da fiscalização'],
  ['atividade', 'Atividade autuada'],
  ['penalidade', 'Penalidade'],
  ['em_terra_publica', 'Sobrepõe terra pública certificada'],
  ['em_assentamento', 'Sobrepõe assentamento'],
  ['em_certificado_privado', 'Sobrepõe imóvel privado certificado'],
  ['em_vazio_cadastral', 'Cai em terra sem cadastro no CAR'],
  ['alertas', 'Ressalvas antes de agir'],
];

/**
 * Padrões que NUNCA podem aparecer numa coluna exportada.
 *
 * Cinto e suspensório sobre a lista branca: se alguém acrescentar uma coluna sem
 * pensar, a exportação para em vez de gravar dado pessoal num arquivo que vai
 * para fora. Ver Risco #1 em docs/RISCOS.md.
 */
const PROIBIDOS = /^(fiscalizad|doc_fiscal|cpf|cnpj|nome_?(?:proprietario|autuado|titular)|endereco|logradouro)/i;

/** Ressalva de cada camada. Sem entrada, cai na genérica. */
const RESSALVAS = {
  'vazio-cadastral': 'Ausência de cadastro no CAR NÃO é ausência de dono nem terra devoluta: o CAR é autodeclaratório. É lugar para conferir.',
  'spu-imoveis-uniao': 'A SPU publica ONDE fica o imóvel, não o contorno. A coordenada localiza; não delimita e não marca divisa.',
  'embargos-ambientais': 'Auto de infração admite defesa e recurso: embargo NÃO é decisão final. Recai sobre a área da infração, não sobre o imóvel inteiro. Ausência de embargo não é prova de regularidade — pode ser ausência de fiscalização.',
  'terra-publica-certificada': 'Certificada como pública não quer dizer sem destino: parte relevante já é assentamento.',
  assentamentos: 'Terra pública JÁ destinada à reforma agrária — não é devoluta.',
  'territorios-quilombolas': 'Território tradicional titulado ou em titulação pelo INCRA.',
  'checagem-g0': 'Amostra em conferência: nada aqui está julgado ainda. É a fila de checagem, não o resultado dela.',
  'lotes-vagos-bh': 'Vago no cadastro do IPTU não quer dizer irregular: pode estar em obra, inventário ou à espera de licença. Quem decide é a Prefeitura.',
};

// "lugar para conferir", e não "candidato a verificação": é o vocabulário
// fixado do app, e o lint reprova o segundo. A diferença não é de estilo — quem
// abre o arquivo pode não ser quem abriu o mapa.
const RESSALVA_GERAL =
  'Nada aqui afirma que a terra é devoluta, nem que um imóvel descumpre a função '
  + 'social. Cada área é um lugar para conferir. A confirmação é do INCRA, da SPU, '
  + 'do órgão ambiental ou da Justiça.';

/** Tira o sufixo de região do id: `vazio-cadastral-vales` → `vazio-cadastral`. */
function familiaDaCamada(layerId) {
  const id = String(layerId ?? '');
  if (RESSALVAS[id]) return id;
  const semRegiao = id.replace(/-(vales|bacia|paraopeba|jequitinhonha|mucuri)$/, '');
  return RESSALVAS[semRegiao] ? semRegiao : id;
}

export function ressalvaDaCamada(layerId) {
  return RESSALVAS[familiaDaCamada(layerId)] ?? RESSALVA_GERAL;
}

/** AAAA-MM-DD, para nome de arquivo e para o cabeçalho. */
function hoje(agora = new Date()) {
  return agora.toISOString().slice(0, 10);
}

/**
 * A camada pode virar arquivo baixado? Só se for `listavel`.
 *
 * ═══ POR QUE ISTO É UMA FUNÇÃO, E MORA AQUI ═══
 *
 * A regra já estava escrita no topo deste arquivo ("o conjunto exportado é o
 * que está na lista: camadas ligadas e marcadas `listavel` … é o que impede a
 * exportação de virar uma terceira versão da verdade"), e o painel de lista a
 * aplicava em `main.js`. Mas quando a ficha ganhou botão próprio de baixar,
 * ela nasceu SEM a porta: `#area=municipios-mg:100` — uma divisa do IBGE —
 * gerava um CSV intitulado "Áreas exportadas do mapa Terras Públicas" com a
 * ressalva genérica sobre terra devoluta. Quem escreveu o botão lembrou do
 * `fixture` e esqueceu do `listavel`.
 *
 * Uma regra que vive só em prosa no cabeçalho e em `Boolean(cfg?.listavel)`
 * solto dentro de um módulo que importa three.js não tem como ser testada — e
 * o que não é testado reabre calado. Aqui ela é uma função pura de uma linha,
 * ao lado da prosa que a explica e do teste que a trava.
 *
 * NÃO confundir com `fixture`, que é a outra porta e é independente: uma
 * camada pode ser `listavel` E `fixture` (dado inventado que aparece na
 * lista), e nesse caso `separarExportaveis()` abaixo é quem a barra. Esta aqui
 * responde "este TIPO de camada é achado?"; aquela responde "esta feição é
 * real?".
 *
 * @param {object} cfg entrada do LAYER_REGISTRY (config.js)
 * @returns {boolean}
 */
export function podeExportarCamada(cfg) {
  return Boolean(cfg?.listavel);
}

/**
 * Separa o que pode ser exportado do que é ficção.
 *
 * Devolve as duas coisas de propósito: quem chama precisa DIZER quantas ficaram
 * de fora, e uma função que só filtrasse deixaria isso invisível.
 */
export function separarExportaveis(entradas) {
  const exportaveis = [];
  const ficticias = [];
  for (const e of entradas ?? []) {
    (e?.cfg?.fixture ? ficticias : exportaveis).push(e);
  }
  return { exportaveis, ficticias };
}

/** As camadas presentes, uma vez cada, na ordem em que aparecem. */
function camadasPresentes(entradas) {
  const vistas = new Map();
  for (const e of entradas) {
    const id = e?.layerId ?? '';
    if (!vistas.has(id)) vistas.set(id, e?.cfg?.label ?? id);
  }
  return [...vistas].map(([id, label]) => ({ id, label, ressalva: ressalvaDaCamada(id) }));
}

/**
 * Uma linha de dado, já com as colunas derivadas de área e de coordenada.
 *
 * `ponto_lat`/`ponto_lon`/`ponto_origem` passam por `coordenadasDaArea()` — a
 * MESMA função que a ficha usa — em vez de ler `p.ponto_lat` cru: é o que
 * garante que a planilha e o GeoJSON levem o ponto CALCULADO nas 970 áreas
 * cuja fonte não publica coordenada, em vez de saírem vazios enquanto a tela
 * mostra o ponto certo (ver o comentário de `COLUNAS`, acima).
 */
export function linhaDe(entrada) {
  const p = entrada?.feature?.properties ?? {};
  const geometry = entrada?.feature?.geometry;
  const coord = coordenadasDaArea(p, geometry);
  const ha = Number(p.area_ha);
  const linha = { camada: entrada?.cfg?.label ?? entrada?.layerId ?? '' };

  for (const [chave] of COLUNAS) {
    if (chave === 'camada' || chave === 'alertas') continue;
    if (chave === 'area_km2') {
      linha[chave] = Number.isFinite(ha) ? +(ha / HA_POR_KM2).toFixed(3) : '';
      continue;
    }
    if (chave === 'area_campos_futebol') {
      linha[chave] = Number.isFinite(ha) ? Math.round(ha / HA_POR_CAMPO) : '';
      continue;
    }
    // SEIS casas decimais, e não o número cru: `coord.lat` sai do algoritmo
    // com toda a bagagem do ponto flutuante (-20.12881243877958, 14 casas),
    // e a ficha, ao lado, mostra o MESMO ponto com seis. Duas telas dizendo
    // números diferentes para a mesma área é o começo da desconfiança.
    //
    // Mas o motivo forte não é a coerência, é a honestidade da precisão. O
    // ponto calculado converge com tolerância de 1e-5 grau (PRECISAO_PADRAO
    // em pontosuperficie.js), coisa de ~1 m: da quinta ou sexta casa em
    // diante é ruído do método, não medição. Seis casas valem ~11 cm — já é
    // mais fino que a tolerância. Catorze casas afirmariam precisão de
    // fração de mícron num arquivo cujo próprio cabeçalho insiste que "a
    // coordenada localiza a área; não é marco de divisa".
    //
    // `+(...)` para voltar a NÚMERO depois do toFixed: a coluna precisa abrir
    // como número em planilha e em QGIS, e `toFixed` devolve string.
    if (chave === 'ponto_lat') { linha[chave] = coord ? +coord.lat.toFixed(6) : ''; continue; }
    if (chave === 'ponto_lon') { linha[chave] = coord ? +coord.lon.toFixed(6) : ''; continue; }
    if (chave === 'ponto_origem') {
      linha[chave] = coord ? (coord.calculado ? 'calculado a partir do contorno' : 'fonte') : '';
      continue;
    }
    linha[chave] = p[chave] ?? '';
  }
  linha.alertas = ressalvaDaCamada(entrada?.layerId);
  return linha;
}

/** Rótulo humano de uma coluna. */
function rotuloDe(chave, rotuloFixo) {
  return rotuloFixo ?? ROTULOS[chave] ?? chave;
}

/**
 * As linhas `#` que abrem o CSV e o bloco de texto.
 *
 * Segue o contrato de `pipeline/planilha.py`, que já resolveu isto com um aviso
 * na primeira linha: quem exportar para outro lugar leva o aviso junto.
 */
export function cabecalhoDeRessalvas(entradas, ficticias, agora = new Date()) {
  const linhas = [
    'Áreas exportadas do mapa Terras Públicas — pesquisa acadêmica.',
    `Gerado em ${hoje(agora)} · ${entradas.length} área(s).`,
    '',
    RESSALVA_GERAL,
    '',
    'Ressalvas por camada:',
  ];
  for (const c of camadasPresentes(entradas)) {
    linhas.push(`  - ${c.label}: ${c.ressalva}`);
  }
  if (ficticias.length) {
    // Contado e nomeado. Uma exportação que simplesmente omitisse deixaria a
    // pessoa achar que a tela e o arquivo mostram o mesmo conjunto.
    linhas.push(
      '',
      `${ficticias.length} área(s) NÃO foram exportadas por serem dado de `
      + 'demonstração, inventado para testar a tela. Elas aparecem no mapa com o '
      + 'selo FICTÍCIO e não descrevem lugar nenhum.',
    );
  }
  linhas.push(
    '',
    'A coordenada localiza a área; não é marco de divisa. O contorno é calculado',
    'por subtração de camadas públicas, não levantado em campo.',
    'Quando a fonte não publica ponto para a área, a coluna "Origem do ponto"',
    '(GeoJSON: ponto_origem) diz "calculado a partir do contorno" — o ponto',
    'ainda cai garantidamente dentro da área, só não veio junto com o resto do',
    'dado publicado.',
  );
  return linhas;
}

// ---------------------------------------------------------------------------
// Os três formatos
// ---------------------------------------------------------------------------

function celulaCsv(v) {
  const s = v === null || v === undefined ? '' : String(v);
  // Aspas quando houver `;`, aspas, quebra de linha — ou quando o texto começa
  // com `#`, que abriria uma linha de comentário no meio do dado.
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV para o Excel brasileiro: delimitador `;` e UTF-8 **com BOM**.
 *
 * Sem o `;`, o Excel pt-BR joga a linha inteira numa coluna só. Sem o BOM, abre
 * os acentos quebrados. É o mesmo par que `pipeline/planilha.py` usa.
 */
export function paraCsv(entradas, ficticias = [], agora = new Date()) {
  // `linhaDe()` roda UMA vez por entrada aqui — não de novo por linha mais
  // abaixo. Ela já chama `pontoNaSuperficie()` quando falta ponto da fonte, e
  // esse cálculo custa até ~28 ms num polígono grande (ver pontosuperficie.js);
  // rodar duas vezes por área numa exportação de milhares de linhas soma.
  const dados = entradas.map((e) => linhaDe(e));

  const usadas = COLUNAS.filter(([chave]) =>
    chave === 'camada' || chave === 'alertas'
    || chave.startsWith('area_')
    // `ponto_lat`/`ponto_lon`/`ponto_origem` entram sempre, como as colunas de
    // área: com o cálculo a partir do contorno como reserva, quase toda
    // entrada tem um dos dois pontos (da fonte, ou calculado) — ver o
    // comentário de `COLUNAS`. Checar "algum valor não vazio" aqui teria o
    // mesmo efeito na prática, mas deixaria a coluna sumir justo numa
    // exportação em que, por acaso, toda entrada fosse de uma camada sem
    // ponto e sem contorno — sumir com a coluna exatamente quando ela mais
    // precisaria explicar a ausência seria omissão silenciosa, a mesma classe
    // de defeito que este arquivo se recusa a cometer com a camada FICTÍCIA.
    || chave === 'ponto_lat' || chave === 'ponto_lon' || chave === 'ponto_origem'
    || dados.some((d) => d[chave] !== undefined && d[chave] !== null && d[chave] !== ''));

  const proibida = usadas.find(([chave]) => PROIBIDOS.test(chave));
  if (proibida) throw new Error(`coluna com dado pessoal na exportação: ${proibida[0]}`);

  const linhas = cabecalhoDeRessalvas(entradas, ficticias, agora).map((l) => `# ${l}`.trimEnd());
  linhas.push(usadas.map(([c, r]) => celulaCsv(rotuloDe(c, r))).join(';'));
  for (const dado of dados) {
    linhas.push(usadas.map(([c]) => celulaCsv(dado[c])).join(';'));
  }
  return `﻿${linhas.join('\r\n')}\r\n`;
}

/**
 * GeoJSON com as ressalvas em membros estrangeiros da FeatureCollection.
 *
 * A RFC 7946 §6.1 permite membros além dos previstos, e é o único lugar onde a
 * ressalva sobrevive à ida para o QGIS — atributo por feição se perderia numa
 * exportação de tabela.
 */
export function paraGeoJson(entradas, ficticias = [], agora = new Date()) {
  return JSON.stringify({
    type: 'FeatureCollection',
    fonte: 'Terras Públicas — mapa de terra sem cadastro em Minas Gerais',
    gerado_em: hoje(agora),
    escopo: 'pesquisa acadêmica; cada área é um lugar para conferir, não uma afirmação',
    ressalvas: cabecalhoDeRessalvas(entradas, ficticias, agora),
    camadas: camadasPresentes(entradas),
    features: entradas.map((e) => ({
      type: 'Feature',
      geometry: e?.feature?.geometry ?? null,
      properties: linhaDe(e),
    })),
  }, null, 2);
}

/**
 * Texto pronto para ofício ou pedido de acesso.
 *
 * Reaproveita `textoParaPedido()`, que é o mesmo bloco que o botão de copiar da
 * ficha já produz para uma área — inclusive as ressalvas certas por tipo de
 * camada. Aqui ele se repete, separado, com um cabeçalho comum na frente.
 */
export function paraTexto(entradas, ficticias = [], agora = new Date()) {
  const partes = [cabecalhoDeRessalvas(entradas, ficticias, agora).join('\n'), ''];
  entradas.forEach((e, i) => {
    const p = e?.feature?.properties ?? {};
    const ehPonto = e?.cfg?.render === 'point';
    partes.push(
      '─'.repeat(68),
      `Área ${i + 1} de ${entradas.length}${p.area_ha != null ? ` — ${descreverArea(p.area_ha)}` : ''}`,
      '',
      // `geometry` alimenta o cálculo de ponto quando `p` não traz
      // `ponto_lat`/`ponto_lon` (ver rotulos.js → coordenadasDaArea). Sem
      // isto, TODA área das sete camadas listáveis sem ponto da fonte (970)
      // saía do texto com esta linha de desculpa em vez de coordenada.
      //
      // `textoParaPedido` devolve string VAZIA quando não há ponto ALGUM,
      // nem da fonte nem calculável — não null. `??` deixaria passar o vazio
      // e a área sumiria do documento sem explicação.
      textoParaPedido(p, e?.cfg?.label, ehPonto, e?.feature?.geometry)
        || '(esta área não tem ponto de referência calculado)',
      '',
    );
  });
  return partes.join('\n');
}

export const FORMATOS = {
  csv: { rotulo: 'Planilha (CSV)', ext: 'csv', tipo: 'text/csv;charset=utf-8', montar: paraCsv },
  geojson: { rotulo: 'Mapa (GeoJSON)', ext: 'geojson', tipo: 'application/geo+json', montar: paraGeoJson },
  texto: { rotulo: 'Texto para ofício', ext: 'txt', tipo: 'text/plain;charset=utf-8', montar: paraTexto },
};

// Faixa Unicode das marcas de combinação de acento (0x0300–0x036F), montada
// por código de caractere — e não por escape `\u...` ou pelo caractere colado
// no fonte — para o próprio arquivo-fonte não carregar uma marca de
// combinação de verdade grudada num `[` de regex, ilegível em diff.
const RE_DIACRITICOS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

/** Só letras/dígitos ASCII e hífen — o que qualquer sistema de arquivo aceita
 * sem escapar nada. Acento e espaço viram hífen, não somem: "São José" tem
 * que continuar reconhecível como "sao-jose", não como "so-jos". */
function slug(s) {
  return String(s ?? '')
    .normalize('NFD').replace(RE_DIACRITICOS, '') // NFD separa a letra do acento; aqui ela cai
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Nome do arquivo: diz o que é, quantas áreas, de quando — e, quando dá para
 * apontar para UMA área específica, qual é (`identificador`).
 */
export function nomeDoArquivo(formato, n, agora = new Date(), identificador = '') {
  const sufixo = identificador ? `-${identificador}` : '';
  return `terras-${n}-areas${sufixo}-${hoje(agora)}.${FORMATOS[formato].ext}`;
}

/**
 * O pedaço do nome que diz QUAL área é uma exportação de UMA área só.
 *
 * Com várias áreas, "quantas" (`n`, em `nomeDoArquivo`) já é a identificação
 * que cabe num nome de arquivo — não dá para nomear 500 áreas. Com uma só —
 * o caso normal do botão "Baixar esta área" da ficha (inspector.js) — três
 * cliques em áreas diferentes no mesmo dia viravam o MESMO
 * `terras-1-areas-<data>.csv`, e o navegador empilhava "(1)", "(2)" sem dizer
 * qual arquivo era qual.
 *
 * Camada + índice sempre identifica a feição de forma única dentro do app —
 * é o par que `inspector.js` usa para reabrir a mesma ficha (`mostrarPorId`).
 * O município entra na frente quando existe porque é o que a pessoa
 * RECONHECE ao ver o nome do arquivo na pasta de downloads; camada + índice
 * sozinho ("assentamentos-12") não diz onde fica.
 */
function identificadorDeArea(exportaveis) {
  if (exportaveis.length !== 1) return '';
  const [e] = exportaveis;
  const municipio = e?.feature?.properties?.municipio;
  const camadaIdx = `${slug(e?.layerId) || 'area'}-${e?.idx ?? 0}`;
  return municipio ? `${slug(municipio)}-${camadaIdx}` : camadaIdx;
}

/**
 * Monta e baixa. Devolve o que foi gerado, para o teste e para a UI relatarem.
 *
 * `baixar` é injetável porque `URL.createObjectURL` não existe fora do
 * navegador: assim os serializadores se testam em `node --test`, sem DOM.
 */
export function exportar(formato, entradas, { baixar = baixarNoNavegador, agora = new Date() } = {}) {
  const { exportaveis, ficticias } = separarExportaveis(entradas);
  if (!exportaveis.length) {
    return { ok: false, motivo: 'nenhuma área para exportar', ficticias: ficticias.length };
  }
  const conteudo = FORMATOS[formato].montar(exportaveis, ficticias, agora);
  const nome = nomeDoArquivo(formato, exportaveis.length, agora, identificadorDeArea(exportaveis));
  baixar(conteudo, nome, FORMATOS[formato].tipo);
  return { ok: true, nome, areas: exportaveis.length, ficticias: ficticias.length, conteudo };
}

function baixarNoNavegador(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Sem o revoke, o Blob fica preso na memória da aba até recarregar — e estes
  // arquivos passam de 10 MB.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
