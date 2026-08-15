/**
 * rotulos.js — tradução das propriedades do GeoJSON para linguagem comum.
 *
 * Vive separado do inspector porque duas telas mostram a mesma ficha — o
 * inspetor do globo e a vista de perto (/app/detalhe) — e porque não deve
 * depender do Three.js: é texto, não geometria.
 *
 * Antes, as duas telas despejavam a chave crua do arquivo: `area_ha`,
 * `veg_nativa_pct`, `proveniencia: limite_municipal − cadastro − exclusoes`.
 * Isso é legível para quem escreveu o pipeline e para mais ninguém.
 */
import { pontoNaSuperficie } from './pontosuperficie.js';

/** Nome de cada propriedade, em português. */
export const ROTULOS = {
  // ⟲ 13/08: OS AVISOS APARECIAM COMO CHAVE CRUA NA FICHA — o dono viu
  // `aviso_nao_somar_entre_municipios` na tela, em snake_case. Eles foram
  // gravados DENTRO de cada feição de propósito, para que a ressalva viaje
  // com o dado e não fique só na legenda: o geojson é exportável, e quem
  // baixa o arquivo leva o aviso junto. Só faltava traduzir a chave, que é
  // exatamente o trabalho deste arquivo.
  aviso_nao_e_repasse_prefeitura: 'Atenção',
  aviso_nao_somar_entre_municipios: 'Não somar',
  cobertura_da_camada: 'Cobertura desta camada',
  cfem_arrecadada_2024: 'CFEM arrecadada (2024)',
  cfem_ano_referencia: 'Ano de referência',
  cfem_substancias_2024: 'Substâncias',
  cfem_serie_desde: 'Série começa em',
  cfem_serie_ate: 'Série vai até',
  cfem_maior_pagador_2024: 'Maior pagador',
  cfem_maior_pagador_valor_2024: 'Valor do maior pagador',
  cfem_atraso_medido_meses: 'Atraso da fonte (meses)',

  area_ha: 'Tamanho',
  municipio: 'Município',
  uf: 'Estado',
  codigo_ibge: 'Código do município (IBGE)',
  geocodigo: 'Código do município (IBGE)',
  veg_nativa_pct: 'Mata nativa',
  silvicultura_pct: 'Eucalipto ou pinus',
  titularidade: 'De quem é esta terra',
  // Imóveis da União (SPU). `rip` é o Registro Imobiliário Patrimonial — o
  // identificador oficial, e o que permite conferir o caso na fonte.
  rip: 'Código do imóvel na União (RIP)',
  tipo: 'Tipo',
  conceituacao: 'Situação do terreno',
  regime: 'Como está sendo usado',
  // Um imóvel pode ter várias utilizações, com regimes diferentes. Quando tem,
  // `regime` lista todas e este campo diz quantas — sem ele a pessoa lê
  // "Cessão · Sem destinação" sem entender de onde saíram dois valores.
  utilizacoes: 'Utilizações cadastradas neste imóvel',
  proprietario_oficial: 'Quem é o proprietário',
  bairro: 'Bairro',
  uso_antropico_pct: 'Terra em uso',
  // "Supressão" e "regeneração" são as palavras do dado; na tela vira o que
  // aconteceu, sem sugerir culpa nem autorização. Ver NOTA_USO.
  supressao_ha: 'Mata que virou área de uso',
  regeneracao_ha: 'Área de uso que virou mata',
  proveniencia: 'Como esta área foi calculada',
  largura_media_m: 'Largura média',
  compacidade: 'Formato',
  classe: 'Classificação',
  score: 'Nota',
  aviso: 'Atenção',
  id: 'Identificador',
  camada: 'Camada',
  lat: 'Latitude',
  lon: 'Longitude',
  // Normas geolocalizadas (camada `normas-geolocalizadas`).
  numero: 'Número',
  ano: 'Ano',
  data_publicacao: 'Publicada em',
  ementa: 'Ementa',
  endereco_extraido: 'Lugar citado na norma',
  confianca: 'Confiança da localização',
  link_fonte: 'Norma original',
  // Terras indígenas (FUNAI, `terras-indigenas`). `fase_ti` é o campo que
  // mais importa nesta ficha — ver a nota grande em VALORES sobre por que
  // TODAS as fases entram no mapa, não só "Regularizada".
  etnia_nome: 'Povo',
  municipio_nome: 'Município(s)',
  fase_ti: 'Fase da demarcação',
  modalidade_ti: 'Modalidade',
  reestudo_ti: 'Reestudo em andamento',
  faixa_fronteira: 'Faixa de fronteira',
  terrai_codigo: 'Código FUNAI',
  data_atualizacao: 'Atualizado em',
  // Territórios quilombolas (INCRA/Acervo Fundiário, `territorios-quilombolas`
  // e `territorios-quilombolas-vales` — ver ingerir_incra_quilombolas.py).
  // `fase_quilombola` é DEDUZIDA (o INCRA não publica campo de fase pronto,
  // ao contrário da FUNAI): ver a nota grande em VALORES sobre por que ela é
  // etiqueta, nunca filtro escondido — mesma lógica de `fase_ti`.
  fase_quilombola: 'Situação da titulação',
  processo_incra: 'Processo no INCRA',
  esfera: 'Instância responsável',
  num_familias: 'Famílias no território',
  data_publicacao_rtid: 'RTID publicado em',
  data_publicacao_rtid_retificacao: 'RTID retificado em',
  data_titulacao: 'Titulado em',
  superintendencia_regional_incra: 'Superintendência Regional do INCRA',
  fonte_incra: 'Nome vem do INCRA',
  // ZAS e mancha de inundação de barragens (FEAM, `zas-barragens` e
  // `mancha-inundacao-barragens`).
  estrutura: 'Barragem',
  empreended: 'Empreendedor',
  status_pae: 'Situação do PAE',
  status_erh: 'Situação do estudo de ruptura (ERHB)',
  id_sigibar: 'Código SIGBM',
  // SIGMINE/ANM (`sigmine-operacao`, `sigmine-interesse`).
  processo: 'Processo na ANM',
  fase: 'Fase do processo',
  subs: 'Substância',
  uso: 'Uso declarado',
};

/** Os dois anos comparados pelo pipeline (mapbiomas.ANOS_MUDANCA). */
export const ANOS_COBERTURA = [2020, 2024];

/**
 * Frases prontas para valores que são fórmula ou código, não texto.
 *
 * A titularidade merece frase inteira, e não uma palavra. O valor cru
 * (`sem_registro_conhecido`) é o caso de 99,7% das áreas, e traço ou campo
 * vazio a pessoa lê como falha do app — quando é o contrário: o silêncio das
 * bases públicas é o achado do projeto. Ver docs/METODO.md §4 e §6.2.
 *
 * E o que a ficha NÃO diz: nome de proprietário particular, nunca. O CAR é
 * autodeclarado e o app mostra ausência de declaração, não pessoas (Risco #1).
 */
const VALORES = {
  'limite_municipal − cadastro − exclusoes':
    'Território do município, menos os imóveis declarados no CAR, menos área urbana, água, unidades de conservação, terras indígenas, quilombolas e assentamentos.',
  sem_registro_conhecido:
    'Nenhuma base pública consultada diz de quem é esta terra. Isso não quer dizer que não tenha dono — quer dizer que não há registro aberto que responda.',
  publica_certificada:
    'O INCRA registrou terra pública aqui. É o único caso em que uma base oficial afirma que a terra é do poder público — e são pouquíssimos.',
  assentamento:
    'Encosta em assentamento da reforma agrária: terra pública que já tem destino.',
  territorio_tradicional:
    'Encosta em território quilombola, titulado ou em titulação.',
  // As fases da demarcação de terra indígena (FUNAI, campo `fase_ti`).
  //
  // Por que TODAS aparecem, e por que a frase de cada uma evita soar como
  // "essa vale menos": o direito territorial indígena é ORIGINÁRIO (CF art.
  // 231) — a demarcação DECLARA um direito que já existe, não o cria. A
  // Convenção 169 da OIT (Decreto 10.088/2019, força de lei no Brasil)
  // condiciona o dever de consulta à AFETAÇÃO do povo, não ao estágio
  // cartorial do processo. Uma TI "Em Estudo" atingida por uma barragem gera
  // o mesmo dever de consulta que uma "Regularizada" — ver
  // docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 1.
  'Em Estudo': 'Grupo de trabalho constituído pela FUNAI, estudo antropológico em curso. Fase inicial — e uma das mais vulneráveis: é onde um empreendimento tenta correr na frente da demarcação.',
  'Delimitada': 'Estudo antropológico aprovado e publicado pela FUNAI; ainda não foi ao Ministro da Justiça.',
  'Declarada': 'Portaria do Ministro da Justiça reconhece os limites da terra — já vale posse plena, mesmo sem o passo seguinte.',
  'Homologada': 'Decreto do Presidente da República homologou a demarcação; falta só o registro em cartório.',
  'Regularizada': 'Demarcação concluída e registrada em cartório e na Secretaria de Patrimônio da União — o fim da linha do processo.',
  'Encaminhada RI': 'Reserva Indígena em tramitação: terra comprada ou doada para o grupo, não é terra de ocupação tradicional.',
  // As fases (DEDUZIDAS, não um campo oficial do INCRA — ver
  // ingerir_incra_quilombolas.py) da titulação de território quilombola,
  // campo `fase_quilombola`. Mesma razão de não esconder fase nenhuma: a
  // Convenção 169 da OIT condiciona o dever de consulta à AFETAÇÃO da
  // comunidade, não ao estágio cartorial do processo de titulação.
  'Sem RTID publicado': 'O INCRA ainda não publicou o Relatório Técnico de Identificação e Delimitação (RTID) deste território — fase inicial do processo, e ainda assim território quilombola de pleno direito.',
  'RTID publicado — em titulação': 'O RTID já foi publicado no Diário Oficial; o processo segue para Portaria de Reconhecimento, decreto de desapropriação e titulação — ainda não concluído.',
  'Titulado': 'Processo de titulação concluído: a terra já está registrada em nome da comunidade ou de sua associação.',
  // A situação do PAE (Plano de Ação de Emergência) de cada barragem, campo
  // `status_pae` das camadas da FEAM. "Em análise" importa dizer em voz alta:
  // é o próprio órgão avisando que ainda não bateu o martelo sobre aquela
  // mancha — ver docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 3.
  'EM ANALISE': 'A FEAM ainda está analisando o Plano de Ação de Emergência desta barragem — a mancha mostrada é a do Estudo de Ruptura Hipotética já aprovado, mas o PAE em si não foi fechado.',
  'APROVADO': 'A FEAM já aprovou o Plano de Ação de Emergência desta barragem.',
  'APROVADA': 'O Estudo de Ruptura Hipotética de Barragem (ERHB) desta estrutura já foi aprovado pela FEAM.',
};

/**
 * Chaves que não ajudam ninguém na tela. A marca FICTÍCIO já aparece no painel
 * de camadas e no aviso ao pé da ficha.
 */
export const OCULTAS = new Set([
  // 'estrutura' (nome da barragem, FEAM) entrou aqui em 13/08/2026 junto com
  // `tituloDaArea` (ui/inspector.js) passar a usá-la como TÍTULO da ficha —
  // mesmo motivo de 'nome'/'name': o que já apareceu no título não precisa
  // de uma linha própria repetindo.
  'nome', 'name', 'estrutura', 'fixture',
  // `fonte_incra` é um sinalizador interno de `ingerir_incra_quilombolas.py`
  // (true/false), não informação para quem lê a ficha. Quando é false, o
  // `aviso` da própria feição já explica em texto por que não há nome —
  // mostrar "fonte_incra: false" cru ao lado seria redundante e ilegível.
  'fonte_incra',
  // As coordenadas saem da tabela e viram um bloco próprio, com botão de
  // copiar: `ponto_lat: -18,758917` numa linha de tabela é número para ler, e
  // ninguém lê coordenada — copia. Ver blocoDeCoordenadas().
  'ponto_lat', 'ponto_lon', 'utm_e', 'utm_n',
  // `link_no_app` é auto-referência: o dado grava o caminho da própria área
  // NESTE app. Pior, grava o caminho do backend FastAPI original
  // (`/app/globe#area=...`), que não existe neste portal — a rota publicada é
  // `/funcaosocialterra/mapa`. Mostrar isso na ficha entrega à pessoa um
  // caminho morto com cara de referência oficial. Quem já está com a ficha
  // aberta chegou lá por esse link; ele não informa nada.
  'link_no_app',
]);

/**
 * Escapa texto que vai para dentro de HTML.
 *
 * Existe porque `linhasDaFicha()` monta `<tr>` por interpolação e os valores
 * vêm de `properties` de GeoJSON — e nem todo GeoJSON deste app é dado
 * numérico de pipeline próprio: `normas-geolocalizadas` carrega `ementa` e
 * `link_fonte`, que são texto raspado de portais de legislação municipal.
 * Texto de terceiro interpolado cru em innerHTML é injeção de HTML; um `&`
 * numa ementa já basta para quebrar a renderização.
 *
 * Os módulos irmãos (`ui/listapanel.js`, `ui/proveniencia.js`) já faziam isto;
 * este arquivo era o único que interpolava sem escapar.
 */
export function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * URL de fonte externa, ou `null` se não for segura para virar `href`.
 *
 * Só `http:` e `https:` passam. Sem esta checagem, um `link_fonte` raspado
 * valendo `javascript:...` viraria código executável no clique — e a origem
 * do campo é justamente uma página de terceiro, fora do controle do projeto.
 */
function urlSegura(valor) {
  try {
    const u = new URL(String(valor), 'https://controlepopular.com.br');
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Campo de futebol oficial (105 × 68 m) = 0,714 ha — a régua que todo mundo tem. */
const HA_POR_CAMPO = 0.714;

/** 1 km² = 100 ha. Abaixo disso o número em km² fica menor que 1 e piora a leitura. */
const HA_POR_KM2 = 100;

// Faixas da descrição de área. Existem porque **nenhuma régua funciona em toda a
// escala**, e este mapa vai de embargo de 0,3 ha a território quilombola de
// 15.500 ha (Baú, Araçuaí — INCRA, 13/08/2026):
//
//   · abaixo de 1 ha, hectare é unidade ruim e campo de futebol é pior — um
//     terreno de 420 m² viraria "0,06 campo". Metro quadrado todo mundo lê;
//   · abaixo de 1 km² (100 ha), km² sai como "0,42" e informa menos que o
//     hectare que já está do lado;
//   · acima de ~1.400 campos, o campo de futebol deixa de ser imagem mental e
//     vira número grande: 15.500 ha são 21.709 campos, o que não ajuda ninguém.
//     Aí o km² assume sozinho.
const HA_MIN_KM2 = HA_POR_KM2;   // 100 ha = 1 km²
const HA_MAX_CAMPOS = 1000;      // ~1.400 campos

function formatarNumero(n, casas = 1) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/**
 * O número, ou `null` quando não há número — e `null` e `0` são coisas
 * diferentes.
 *
 * `Number.isFinite(Number(x))` não basta: `Number(null)` é **0**, e `Number('')`
 * também. Uma área ausente sairia como "0 m²", que é uma **medida** — e o
 * pipeline inteiro deste projeto trata ausência e zero como coisas distintas
 * (ver `_somar` e `_media_ponderada` em `vazio_cadastral_bacia.py`, que devolvem
 * None em vez de 0). A tela não pode desfazer essa distinção na última etapa.
 */
function numeroOuNada(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * O tamanho de uma área, na régua que serve para aquele tamanho.
 *
 *      0,42 ha  →  "4.200 m²"
 *     42,0 ha   →  "42,0 hectares — uns 59 campos de futebol"
 *    500,0 ha   →  "500,0 hectares — 5,0 km², uns 700 campos de futebol"
 *  15.409 ha    →  "15.409,0 hectares — 154,1 km²"
 *
 * A escolha por faixa está nas constantes acima. Hectare aparece SEMPRE que a
 * área passa de 1 ha: é a unidade do dado e a que consta de documento fundiário
 * — as outras duas são leitura, não substituição.
 */
export function descreverArea(ha) {
  const n = numeroOuNada(ha);
  if (n === null) return '';
  if (n < 1) return `${formatarNumero(n * 10_000, 0)} m²`;

  const reguas = [];
  if (n >= HA_MIN_KM2) reguas.push(`${formatarNumero(n / HA_POR_KM2)} km²`);
  if (n < HA_MAX_CAMPOS) {
    const campos = arredondar(n / HA_POR_CAMPO).toLocaleString('pt-BR');
    reguas.push(`uns ${campos} campos de futebol`);
  }
  return `${formatarNumero(n)} hectares${reguas.length ? ` — ${reguas.join(', ')}` : ''}`;
}

/**
 * A mesma coisa, curta, para a linha da lista — onde cabe pouco e a pessoa está
 * varrendo dezenas de itens, não lendo um.
 *
 *    "42 ha · uns 59 campos"      "500 ha · 5 km²"      "15.409 ha · 154 km²"
 */
export function descreverAreaCurta(ha) {
  const n = numeroOuNada(ha);
  if (n === null) return '';
  if (n < 1) return `${formatarNumero(n * 10_000, 0)} m²`;

  const inteiro = Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (n >= HA_MIN_KM2) {
    return `${inteiro} ha · ${Number(n / HA_POR_KM2).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km²`;
  }
  return `${inteiro} ha · uns ${arredondar(n / HA_POR_CAMPO).toLocaleString('pt-BR')} campos`;
}

/** Arredonda para 2 algarismos significativos: "uns 2.000 campos", não "2.045". */
function arredondar(n) {
  if (n < 10) return Math.round(n);
  const ordem = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / ordem) * ordem;
}

/**
 * Traduz a compacidade (4πA/P², de Polsby-Popper) para o que a pessoa vê na
 * tela. Sem isto, uma área de 1.070 ha que na verdade é uma teia de corredores
 * de 180 m de largura se anuncia do mesmo jeito que uma mancha de terra de 3 km
 * de lado — e a diferença entre as duas é tudo, na hora de conferir.
 */
function descreverFormato(c) {
  if (c < 0.05) return 'corredor fino e comprido, não uma mancha';
  if (c < 0.15) return 'rede de corredores ramificados';
  if (c < 0.30) return 'mancha irregular, com braços';
  return 'mancha compacta';
}

/** Valor de uma propriedade, já formatado para leitura. */
export function formatarValor(chave, valor) {
  if (chave === 'area_ha' && Number.isFinite(Number(valor))) {
    return descreverArea(valor);
  }
  if (chave === 'largura_media_m' && Number.isFinite(Number(valor))) {
    const m = Number(valor);
    const quadras = Math.max(1, Math.round(m / 100));
    return `${formatarNumero(m, 0)} m — a largura de umas ${quadras} quadras de rua`;
  }
  if (chave === 'compacidade' && Number.isFinite(Number(valor))) {
    const c = Number(valor);
    return `${descreverFormato(c)} (${formatarNumero(c, 2)} numa escala em que o círculo é 1)`;
  }
  if (chave === 'uso_antropico_pct' && Number.isFinite(Number(valor))) {
    const pct = Number(valor);
    const [ini, fim] = ANOS_COBERTURA;
    if (pct === 0) return `nada — nem em ${ini}, nem em ${fim}`;
    // Os dois anos entram na frase de propósito: sem eles, "44% em uso" parece
    // uma foto de hoje, e é uma medida de permanência — terra que já estava em
    // uso e continua. É essa permanência que sustenta a leitura.
    return `${formatarNumero(pct)}% da área — em uso tanto em ${ini} quanto em ${fim}`;
  }
  if ((chave === 'supressao_ha' || chave === 'regeneracao_ha') && Number.isFinite(Number(valor))) {
    const ha = Number(valor);
    const [ini, fim] = ANOS_COBERTURA;
    if (ha === 0) return `nada, entre ${ini} e ${fim}`;
    // Mesma régua da área: estes números vão de fração de hectare a centenas, e
    // "26.902,4 hectares" de supressão sem km² ao lado é tão ilegível quanto a
    // área que o gerou.
    return `${descreverArea(ha)}, entre ${ini} e ${fim}`;
  }
  if (chave.endsWith('_pct') && Number.isFinite(Number(valor))) {
    const pct = Number(valor);
    if (pct === 0) return 'nenhuma';
    return `${formatarNumero(pct)}% da área`;
  }
  // Normas geolocalizadas: link para a fonte, confiança em português, data
  // no formato brasileiro. `link_fonte` sai como <a> -- as outras camadas
  // não têm campo de URL, então este é o primeiro caso desse tipo aqui.
  if (chave === 'link_fonte' && valor) {
    // A URL vem RASPADA de portal municipal: valida o esquema antes de virar
    // `href` e escapa antes de entrar no atributo. Sem as duas coisas, um
    // `javascript:` executa no clique e uma aspa fecha o atributo e injeta
    // HTML. Quando a URL não passa, mostra o texto cru em vez de link morto —
    // sumir com o campo esconderia da pessoa que a fonte veio torta.
    const href = urlSegura(valor);
    return href
      ? `<a href="${escapar(href)}" target="_blank" rel="noopener">Ver norma original ↗</a>`
      : escapar(valor);
  }
  if (chave === 'confianca') {
    if (valor === 'alta') return 'Alta — rua, avenida ou praça citada por nome';
    if (valor === 'media') return 'Média — só bairro ou distrito (ponto aproximado)';
    return String(valor);
  }
  if (chave === 'data_publicacao' && valor) {
    const [ano, mes, dia] = String(valor).split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  }
  const texto = String(valor);
  return VALORES[texto] ?? texto;
}

/**
 * Chaves cujo `formatarValor()` devolve HTML DE PROPÓSITO, e que por isso não
 * podem ser escapadas de novo na montagem da linha.
 *
 * Lista branca explícita, e não "escapa só o que parece texto": é o que
 * garante que um campo novo da fonte entre escapado por padrão. Quem quiser
 * emitir HTML aqui precisa vir escrever a chave nesta lista e assumir que a
 * própria `formatarValor` escapou o que interpolou — é o que o ramo de
 * `link_fonte` faz.
 */
const CHAVES_COM_HTML = new Set(['link_fonte']);

/** Monta as linhas <tr> da ficha de uma área, já traduzidas. */
export function linhasDaFicha(props) {
  return Object.entries(props ?? {})
    .filter(([k]) => !OCULTAS.has(k))
    .map(([k, v]) => {
      const valor = formatarValor(k, v);
      return `<tr><td>${escapar(ROTULOS[k] ?? k)}</td><td>${
        CHAVES_COM_HTML.has(k) ? valor : escapar(valor)}</td></tr>`;
    })
    .join('');
}

/**
 * A nota que acompanha "terra em uso" — e o motivo de ela existir.
 *
 * Uso recente responde a DUAS perguntas, e as respostas apontam para lados
 * opostos. Reduzir isso a uma frase só — "área em uso, provável ocupação" —
 * apaga metade do que o dado diz, e é a metade que a pesquisa precisa:
 *
 *  • para a pergunta "isto é terra do Estado?", estar em uso pesa CONTRA a
 *    terra ser devoluta e A FAVOR de haver ocupação que ninguém declarou;
 *  • para a pergunta "esta terra cumpre sua função social?", as duas pontas
 *    contam e em sentidos contrários — terra parada fere o inciso I do art. 186
 *    (aproveitamento), e mata derrubada fere o inciso II (meio ambiente). Um
 *    não desculpa o outro.
 *
 * A tela não conclui nenhuma das duas: conclusão de função social é jurídica,
 * exige laudo por imóvel e nomearia propriedade particular, que é o Risco #1 do
 * projeto. O que a ficha faz é entregar o fato com as duas leituras à vista.
 */
export const NOTA_USO = {
  titulo: 'Terra em uso se lê nos dois sentidos',
  leituras: [
    'Se a terra está em uso, alguém está lá. Isso pesa <strong>contra</strong> ela ser terra pública sem dono, e <strong>a favor</strong> de existir ocupação que ninguém declarou no cadastro.',
    'Para saber se a terra cumpre o que a Constituição cobra dela, as duas pontas valem: terra parada é um problema, mata derrubada é outro — e um não desculpa o outro. Nenhum dos dois se conclui aqui.',
  ],
  ressalvas:
    'O satélite enxerga quadrados de 30 metros: não vê cerca nem carreador. Boa parte do que aparece como mata que virou uso cai numa classe que o próprio MapBiomas chama de "mosaico", que mistura pasto e lavoura. E mata que sumiu <strong>não</strong> quer dizer mata derrubada sem autorização — isso nenhum dado desta tela responde.',
};

// ---------------------------------------------------------------------------
// Coordenadas — para levar a área a um cartório ou a um pedido de informação
// ---------------------------------------------------------------------------

/**
 * Grau decimal → grau, minuto e segundo, no formato que documento brasileiro usa.
 * -18.758917, 'lat' → 18°45'32,1"S
 */
export function paraGMS(valor, eixo) {
  const hemisferio = eixo === 'lat' ? (valor < 0 ? 'S' : 'N') : (valor < 0 ? 'W' : 'E');
  const abs = Math.abs(valor);
  const grau = Math.floor(abs);
  const minutoDecimal = (abs - grau) * 60;
  const minuto = Math.floor(minutoDecimal);
  const segundo = ((minutoDecimal - minuto) * 60).toFixed(1).replace('.', ',');
  return `${grau}°${String(minuto).padStart(2, '0')}'${segundo.padStart(4, '0')}"${hemisferio}`;
}

/**
 * Coordenadas de uma área, ou null se não há como obter nenhuma.
 *
 * 1.823 áreas em oito camadas (assentamentos, territórios quilombolas, terra
 * pública certificada, embargos ambientais — e as irmãs `-vales` de cada
 * uma) chegam sem `ponto_lat`/`ponto_lon`: o pipeline que gera essas
 * camadas calcula o polígono, não um ponto de referência. Antes, isso fazia
 * esta função devolver `null` para as 1.823 — e a ficha perdia os dois botões
 * de copiar, calada, sem dizer por quê. Agora, faltando o dado da fonte e
 * havendo `geometry`, o ponto é calculado no cliente a partir do próprio
 * contorno (ver ./pontosuperficie.js) — com uma garantia que um centroide
 * não teria: cai SEMPRE dentro da área, mesmo nas que são corredores finos
 * e sinuosos, onde um centroide ingênuo cairia fora.
 *
 * @param {object} props properties da feição
 * @param {object} [geometry] geometry da feição — só é OLHADA quando `props`
 *   não traz ponto; quando traz, o cálculo nem roda.
 */
export function coordenadasDaArea(props, geometry) {
  let lat = Number(props?.ponto_lat);
  let lon = Number(props?.ponto_lon);
  let calculado = false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    const calc = geometry ? pontoNaSuperficie(geometry) : null;
    if (!calc) return null;
    ({ lat, lon } = calc);
    calculado = true;
  }
  const e = Number(props?.utm_e);
  const n = Number(props?.utm_n);
  return {
    // Números crus (ponto decimal, sem rótulo), ao lado das strings formatadas
    // abaixo — quem precisa do VALOR (a coluna de latitude/longitude do CSV e
    // do GeoJSON, em ui/exportar.js) não deveria reconstruir `lat`/`lon` a
    // partir de `paraColar` na marra. Mesmo par que alimenta `decimal` e
    // `paraColar` logo abaixo — não é um segundo cálculo.
    lat,
    lon,
    decimal: `${lat.toFixed(6).replace('.', ',')}, ${lon.toFixed(6).replace('.', ',')}`,
    // Ponto e vírgula não: em documento brasileiro a vírgula já é decimal.
    gms: `${paraGMS(lat, 'lat')} ${paraGMS(lon, 'lon')}`,
    // UTM só quando o ponto É o da fonte: um `utm_e`/`utm_n` publicado descreve
    // O PONTO PUBLICADO, não o que foi calculado aqui — misturar os dois seria
    // um par de coordenadas que não se referem à mesma coisa. (Na prática as
    // camadas sem ponto também não têm UTM, mas a checagem fica por garantia.)
    utm: !calculado && Number.isFinite(e) && Number.isFinite(n)
      ? `${formatarNumero(e, 0)} m E, ${formatarNumero(n, 0)} m N`
      : null,
    // O que vai para a área de transferência: o par cru, sem rótulo e com
    // ponto decimal. É o que Google Maps, QGIS e caixa de busca aceitam colados
    // — vírgula decimal quebra os três.
    paraColar: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
    // Quem lê tem direito de saber que este ponto não veio da fonte junto com
    // o resto do dado — veio do contorno, calculado agora nesta tela. Ver uso
    // em blocoDeCoordenadas() e textoParaPedido().
    calculado,
  };
}

/**
 * Texto completo para instruir um pedido de informação ou uma consulta de
 * balcão. Vai inteiro para a área de transferência, já com as ressalvas.
 *
 * As ressalvas viajam junto de propósito. Um par de coordenadas colado num
 * ofício, sozinho, vira uma afirmação sobre a terra que este projeto não faz —
 * e quem recebe o ofício não tem como saber que o contorno é calculado, não
 * levantado, nem que ausência de cadastro não é ausência de dono.
 *
 * Quando `props` não traz ponto (ver coordenadasDaArea), `geometry` permite
 * calculá-lo a partir do contorno — e o texto PRECISA dizer que fez isso: é
 * a mesma frase que seria falsa se um ponto calculado saísse daqui rotulado
 * como se tivesse vindo da fonte junto com o resto do dado.
 */
export function textoParaPedido(props, rotuloCamada, ehPonto = false, geometry) {
  // ⟲ `coordenadasDaArea` aceita `props` nulo (só olha `geometry` quando falta
  // ponto na fonte) e pode devolver não-nulo mesmo assim — mas as 20+ linhas
  // abaixo leem `props.foo` cru, sem `?.`. Antes desta linha, `props` nulo +
  // `geometry` presente derrubava esta função com TypeError em
  // `props.proveniencia`. Hoje nenhum chamador manda `props` nulo (todos já
  // normalizam com `?? {}` antes de chamar), mas essa garantia é dos
  // chamadores, não desta função — e é esta função que devia se defender.
  props = props ?? {};
  const c = coordenadasDaArea(props, geometry);
  if (!c) return '';
  const [ini, fim] = ANOS_COBERTURA;
  // O cabeçalho sai da CAMADA, não fixo. Estava escrito "Área sem cadastro no
  // CAR" para tudo — e num imóvel da União isso é simplesmente falso, num texto
  // feito para ser colado num ofício.
  const titulo = props.proveniencia
    ? 'Área sem cadastro no CAR'
    : (rotuloCamada || 'Área no mapa');
  const linhas = [
    `${titulo}${props.municipio ? ` — ${props.municipio}/MG` : ''}` +
      `${props.codigo_ibge ? ` (IBGE ${props.codigo_ibge})` : ''}`,
    '',
    // O rótulo do bloco muda quando o ponto é calculado: dizer "ponto de
    // referência dentro da área" sem mais nada deixaria a pessoa achar que
    // este é o mesmo tipo de dado que o resto da ficha — publicado pela
    // fonte. Não é.
    c.calculado
      ? 'Ponto calculado NESTA TELA a partir do contorno da área (a fonte não publica coordenada):'
      : (ehPonto ? 'Coordenada do imóvel (a fonte publica o ponto, não o perímetro):'
                 : 'Ponto de referência dentro da área:'),
    `  ${c.paraColar}   (grau decimal, SIRGAS 2000 / EPSG:4326)`,
    `  ${c.gms}`,
  ];
  // O UTM fecha o bloco de coordenadas, com o mesmo recuo das linhas de cima.
  // O RIP vem depois, em bloco próprio: é identificador, não coordenada, e
  // enfiado no meio quebrava o recuo do bloco.
  if (c.utm) linhas.push(`  ${c.utm}   (SIRGAS 2000 / UTM 23S, EPSG:31983)`);
  if (props.rip) linhas.push('', `Código do imóvel na União (RIP): ${props.rip}`);
  if (props.area_ha != null) {
    // A equivalência vai junto no ofício, e não só na tela: quem lê o documento
    // do outro lado costuma ter menos familiaridade com hectare que quem abriu
    // o mapa, não mais.
    linhas.push('', `Área calculada: ${descreverArea(props.area_ha)}`);
  }
  if (props.titularidade) {
    linhas.push(`Registro público de titularidade: ${VALORES[props.titularidade] ?? props.titularidade}`);
  }
  if (props.uso_antropico_pct != null) {
    linhas.push(`Em uso antrópico em ${ini} e em ${fim}: ${formatarNumero(Number(props.uso_antropico_pct))}% da área`);
  }
  // As ressalvas seguem o que a área É. As do vazio cadastral falam de ausência
  // de declaração e de contorno calculado; nenhuma das duas cabe num imóvel que
  // a União cadastrou e cuja localização ela mesma publica.
  if (props.proveniencia) {
    linhas.push(
      '', 'Como este recorte foi obtido:',
      `  ${VALORES['limite_municipal − cadastro − exclusoes']}`,
      `  Camada: ${rotuloCamada ?? '—'}. Fonte do cadastro: CAR/SICAR.`,
      '',
      'Ressalvas, que fazem parte do dado:',
      '  - Ausência de cadastro NÃO é ausência de dono, e não é terra devoluta:',
      '    é ausência de declaração no CAR, que é autodeclaratório.',
      '  - O ponto localiza a área; não é marco de divisa. O contorno é calculado',
      '    por subtração de camadas públicas, não levantado em campo.',
    );
  } else {
    linhas.push(
      '', `Camada: ${rotuloCamada ?? '—'}.`,
      '',
      'Ressalvas, que fazem parte do dado:',
      ...(ehPonto ? [
        '  - A fonte publica a LOCALIZAÇÃO do imóvel, não o perímetro. A',
        '    coordenada acima marca onde ele fica; não delimita a área, e o',
        '    tamanho informado vem do cadastro, não de medição no mapa.',
      ] : []),
      '  - O dado é do cadastro da fonte e pode estar desatualizado ou impreciso.',
    );
  }
  // Ressalva do ponto calculado, e não da camada: some independente de qual
  // dos dois ramos rodou acima, porque a origem do PONTO é uma pergunta
  // diferente da origem do CONTORNO.
  if (c.calculado) {
    linhas.push(
      '  - O ponto de coordenada acima NÃO veio da fonte: foi calculado nesta',
      '    tela a partir do contorno publicado, porque a fonte não traz um',
      '    ponto de referência para esta área. Continua dentro da área.',
    );
  }
  linhas.push('  - Quem confirma a situação da terra é o INCRA, a SPU ou a Justiça.');
  return linhas.join('\n');
}

/**
 * Bloco de coordenadas com os botões de copiar.
 * Classe `ficha-coord` — definida em ../css/hud.css e em /static/detalhe.html.
 * Quem liga os botões é `ligarCopiar()`, chamado depois de inserir o HTML.
 *
 * @param {object} props
 * @param {boolean} [ehPonto]
 * @param {object} [geometry] geometry da feição — alimenta o cálculo do
 *   ponto quando `props` não traz `ponto_lat`/`ponto_lon` (ver
 *   coordenadasDaArea). Sem isto, 1.823 áreas em oito camadas apareciam com
 *   a ficha inteira MENOS este bloco — sem "Copiar coordenada", sem "Copiar
 *   para ofício ou LAI", e sem explicação nenhuma na tela do porquê.
 * @param {boolean} [permiteOficio] `false` esconde só o botão "Copiar para
 *   ofício ou LAI" — "Copiar coordenada" fica. Existe para camada SEM
 *   `listavel` (ex.: `municipios-mg`, divisa do IBGE): o texto do ofício diz
 *   "quem confirma a situação da terra é o INCRA, a SPU ou a Justiça" —
 *   afirmação que não faz sentido nenhum sobre um limite municipal. Saber
 *   ONDE fica continua legítimo; o texto pronto para pedir informação, não.
 */
export function blocoDeCoordenadas(props, ehPonto = false, geometry, permiteOficio = true) {
  const c = coordenadasDaArea(props, geometry);
  if (!c) return '';
  // Três leituras possíveis, e a diferença entre elas importa para quem vai
  // usar a coordenada num ofício:
  //   1. camada de PONTO: a fonte publica onde o imóvel fica, não o contorno;
  //   2. polígono com ponto DA FONTE: o ponto veio junto com o resto do dado;
  //   3. polígono SEM ponto: calculado agora, aqui, a partir do contorno —
  //      é a distinção que este bloco existe para não apagar (ver
  //      coordenadasDaArea). O selo "ponto calculado" no título cumpre o
  //      mesmo papel do selo FICTÍCIO da camada de demonstração: quem só
  //      bate o olho já vê que aquela linha é diferente das outras.
  const nota = ehPonto
    ? `Esta camada publica a <strong>localização</strong> do imóvel, não o contorno dele.
       A coordenada marca onde ele fica; não delimita a área.`
    : c.calculado
    ? `Esta camada não publica um ponto para esta área — só o contorno. O ponto abaixo foi
       <strong>calculado agora, nesta tela</strong>, a partir do polígono: cai garantidamente
       <strong>dentro</strong> da área, inclusive nas que são corredores finos e sinuosos, onde o
       centro geométrico simples cairia fora dela. Não é dado da fonte — é derivado.`
    : `O ponto fica <strong>dentro</strong> da área e serve para localizá-la — não é marco
       de divisa. O contorno é calculado a partir de camadas públicas, não levantado em campo.`;
  return `<div class="ficha-coord">
    <strong>${ehPonto ? 'Onde fica este imóvel' : 'Onde fica esta área'}</strong>${
      c.calculado ? ' <span class="ficha-coord-calc" title="Este ponto não está na fonte: foi calculado aqui a partir do contorno.">ponto calculado</span>' : ''}
    <dl>
      <dt>Grau decimal</dt><dd>${c.decimal}</dd>
      <dt>Grau, minuto, segundo</dt><dd>${c.gms}</dd>
      ${c.utm ? `<dt>UTM 23S (SIRGAS 2000)</dt><dd>${c.utm}</dd>` : ''}
    </dl>
    <div class="ficha-coord-botoes">
      <button type="button" data-copiar="ponto">Copiar coordenada</button>
      ${permiteOficio ? '<button type="button" data-copiar="pedido">Copiar para ofício ou LAI</button>' : ''}
    </div>
    <p class="ficha-coord-nota">${nota}</p>
  </div>`;
}

/**
 * Liga os botões de copiar dentro de `raiz`.
 *
 * `navigator.clipboard` só existe em contexto seguro (https ou localhost). Se o
 * app for servido por http numa rede local — que é como se testa em outra
 * máquina — ele simplesmente não está lá, e um botão que não faz nada e não
 * avisa é pior que botão nenhum. Daí o caminho alternativo com `execCommand`.
 *
 * `geometry` segue o mesmo motivo de blocoDeCoordenadas(): sem ela, esta
 * função também devolvia cedo — sem ponto da fonte, achava que não havia
 * nada para copiar, e os dois botões ficavam no HTML sem fazer nada.
 */
export function ligarCopiar(raiz, props, rotuloCamada, ehPonto = false, geometry) {
  const c = coordenadasDaArea(props, geometry);
  if (!c) return;
  for (const botao of raiz.querySelectorAll('[data-copiar]')) {
    botao.addEventListener('click', async () => {
      const texto = botao.dataset.copiar === 'pedido'
        ? textoParaPedido(props, rotuloCamada, ehPonto, geometry)
        : c.paraColar;
      const original = botao.textContent;
      const ok = await copiar(texto);
      // O "✓" vem do CSS (`.copiado::before`), não do texto: assim a marca e o
      // anel de confirmação entram juntos, num só estado. Escrever o ✓ aqui
      // TAMBÉM duplicaria o símbolo.
      botao.textContent = ok ? 'copiado' : '✗ não deu — o texto está aqui embaixo';
      botao.classList.toggle('copiado', ok);
      // Falhar e mandar "selecione à mão" não ajuda quem tem 25 linhas de
      // ofício para selecionar num painel que rola. Se a área de transferência
      // recusar, o texto aparece já selecionado: sobra um Ctrl+C.
      if (!ok) mostrarParaSelecionar(raiz, texto);
      setTimeout(() => {
        botao.textContent = original;
        botao.classList.remove('copiado');
      }, 2600);
    });
  }
}

/** Plano C: põe o texto na tela, selecionado, para o Ctrl+C da pessoa. */
function mostrarParaSelecionar(raiz, texto) {
  const bloco = raiz.querySelector('.ficha-coord');
  if (!bloco) return;
  bloco.querySelector('.ficha-coord-manual')?.remove();
  const campo = document.createElement('textarea');
  campo.className = 'ficha-coord-manual';
  campo.readOnly = true;
  campo.rows = Math.min(12, texto.split('\n').length);
  campo.value = texto;
  bloco.appendChild(campo);
  campo.focus();
  campo.select();
}

async function copiar(texto) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* sem permissão ou fora de contexto seguro: cai no plano B */ }
  try {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand('copy');
    campo.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Campos cuja presença justifica mostrar a nota de uso. */
const CAMPOS_DE_USO = ['uso_antropico_pct', 'supressao_ha', 'regeneracao_ha'];

/**
 * HTML da nota de uso, ou string vazia se a área não tiver esses dados.
 * Classe `ficha-nota` — definida em ../css/hud.css e em /static/detalhe.html.
 */
export function notaDeUso(props) {
  if (!CAMPOS_DE_USO.some((k) => props?.[k] != null)) return '';
  return `<div class="ficha-nota">
    <strong>${NOTA_USO.titulo}</strong>
    ${NOTA_USO.leituras.map((t) => `<p>${t}</p>`).join('')}
    <p class="ficha-nota-ressalva">${NOTA_USO.ressalvas}</p>
  </div>`;
}
