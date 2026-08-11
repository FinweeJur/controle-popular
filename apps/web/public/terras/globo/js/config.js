/**
 * config.js — configuração estática do globo 3D "sala de controle" do Terras Públicas.
 *
 * Centraliza os presets de foco de câmera (FOCUS_PRESETS) e o registro
 * declarativo de camadas (LAYER_REGISTRY). Adicionar um novo foco ou uma nova
 * camada = 1 entrada aqui, zero código novo no restante do app.
 *
 * Consumidores: js/main.js, js/ui/focusbar.js, js/ui/layerspanel.js,
 * js/layers/manager.js.
 */

// ---------------------------------------------------------------------------
// Identidade e data dos dados, num lugar só.
// A data aparece no HUD porque o globo tem cara de painel ao vivo e os dados
// NÃO são ao vivo: são uma foto do cadastro naquele dia.
// ---------------------------------------------------------------------------
export const APP_NOME = 'Terras Públicas';
export const APP_RESUMO = 'Mapa de pesquisa: terra rural sem cadastro em Minas Gerais';

// VALOR DE PARTIDA, não a verdade. Quem manda é `gerado_em_utc` do manifesto
// (`GET /api/v1/proveniencia`), que a barra de status busca e usa assim que
// chega — ver ui/statusbar.js. Esta constante só cobre o instante antes da
// resposta, e o caso de o manifesto não existir.
//
// Ela já foi a verdade, e desatualizou calada: em 29/07/2026 o HUD anunciava
// "dados de 28/07" sobre camadas reexportadas no dia seguinte. Data escrita à
// mão num lugar e dado gerado em outro divergem sempre — é questão de tempo.
export const DADOS_DE = '28/07/2026';

// ---------------------------------------------------------------------------
// Botões de foco: municípios, não regiões (mudado em 28/07/2026)
//
// Eram Brasil / Sudeste / Minas / Curvelo / Amazônia — escalas de continente
// para um trabalho que acontece em escala de município. Amazônia nem tinha
// dado. Agora cada botão é um município do recorte de estudo, resolvido pela
// malha do IBGE (`data/municipios.js`), o mesmo caminho do campo de busca:
// um jeito só de chegar a um lugar, e os 853 alcançáveis pela busca.
//
// Cada preset: { id, label, geocodigo }. A distância de câmera não se escreve
// aqui — `core/enquadrar.js` calcula a partir da geometria do município e da
// proporção da janela. Número fixo nunca enquadrou nada em duas telas.
// ---------------------------------------------------------------------------
export const FOCUS_PRESETS = [
  { id: 'betim',       label: 'Betim',       geocodigo: '3106705' },
  { id: 'bh',          label: 'BH',          geocodigo: '3106200' },
  { id: 'contagem',    label: 'Contagem',    geocodigo: '3118601' },
  { id: 'curvelo',     label: 'Curvelo',     geocodigo: '3120904' },
  { id: 'pompeu',      label: 'Pompéu',      geocodigo: '3152006' },
  { id: 'sjbicas',     label: 'S. J. de Bicas', geocodigo: '3162922' },
  { id: 'brumadinho',  label: 'Brumadinho',  geocodigo: '3109006' },
];

// Vista de abertura: o estado inteiro, para dar o contexto antes de descer.
// Usa o recorte oficial versionado em data/mg.geojson.
export const ABERTURA = { id: 'abertura', label: 'Minas Gerais', boundary: 'mg' };

// ---------------------------------------------------------------------------
// Registro de camadas (dados reais via /api/v1/camadas/{id} — Fase G2 ✓)
// Cada camada: { id, label, hint, color, on, render, fixture? }
// - id      = identificador estável, usado no endpoint e no LayerManager;
// - label   = nome que a pessoa lê no painel. Linguagem comum, não jargão:
//             quem abre o globo pela primeira vez não sabe o que é "vazio
//             cadastral" nem "feição". O termo técnico entra no hint, para
//             ensinar sem exigir;
// - hint    = uma linha explicando o que a camada mostra e de onde veio. Fica
//             sempre visível sob o nome — tooltip não existe no celular e
//             ninguém passa o mouse por cima de tudo para descobrir;
// - color   = cor hex (número) da camada no globo e do "dot" no painel;
// - on      = estado inicial (ligada/desligada);
// - render  = 'line' (só contorno) ou 'fill' (área preenchida + contorno —
//             para camadas cujo objetivo é IDENTIFICAR a área em zoom profundo).
// - listavel = as feições desta camada entram na visão em lista (ui/listapanel.js).
//             Vale para camadas cujas feições são "achados" com área própria;
//             divisa de município não é achado.
// - fixture = dado INVENTADO para demonstração. O painel marca a camada como
//             FICTÍCIO e ela nasce desligada. Nunca omitir a flag numa camada
//             de fixture: o globo é a vitrine do projeto, e polígono inventado
//             com cara de oficial é o erro que custou duas semanas de
//             diagnóstico errado na Fase 0.
// Cores seguem o design system Orbit Veil (documents/designs/).
// ---------------------------------------------------------------------------
export const LAYER_REGISTRY = [
  {
    id: 'municipios-mg', label: 'Divisas dos municípios',
    hint: 'Os 853 municípios de Minas Gerais, pelo mapa oficial do IBGE.',
    color: 0x6f7f93,   /* --layer-moldura (= --text-3) */ on: true, render: 'line',
  },
  // Duas escalas do mesmo cálculo: a da bacia é a visão geral (só polígonos
  // ≥ 500 ha, 14 municípios); a de Curvelo tem o detalhe fino do piloto.
  {
    id: 'vazio-cadastral-bacia', label: 'Terra sem cadastro — bacia do Paraopeba',
    hint: 'As 35 maiores áreas que nenhum imóvel declarou no CAR, de 500 hectares (5 km²) para cima. Quase todas são redes de corredores estreitos, não manchas. É o que o método chama de vazio cadastral.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    color: 0xb49dff,   /* --layer-vazio-bacia */ on: true, render: 'fill', listavel: true,
  },
  {
    id: 'vazio-cadastral', label: 'Terra sem cadastro — só Curvelo',
    hint: 'O mesmo cálculo em um município só, mostrando também as manchas pequenas: 390 áreas, a partir de 10 hectares — uns 14 campos de futebol cada.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    color: 0xd0baff,   /* --layer-vazio-curvelo, irmã mais clara */ on: false, render: 'fill', listavel: true,
  },
  // --- Terra pública que EXISTE em base aberta -----------------------------
  //
  // Não são "União / Estado / Município": essa separação não é possível hoje.
  // A SPU não tem acesso anônimo, o IDE-Sisema não tem camada de terras do
  // Estado (1.404 camadas conferidas em 29/07/2026) e terra municipal só está
  // em cada prefeitura. E o SIGEF/SNCI Público, que está em disco, descreve o
  // processo de certificação — não diz de que ente é a terra. Separar por ente
  // lendo o nome da área seria adivinhação com cara de fato.
  //
  // Então a divisão é por CATEGORIA, que é o que o dado sustenta.
  // Geradas por pipeline/camadas_publicas.py.
  {
    id: 'terra-publica-certificada', label: 'Terra pública com medição oficial',
    hint: '19 áreas, 12.240 hectares (122 km²), que o INCRA certificou como públicas na bacia — 0,5% do território. É a única terra que uma base aberta afirma ser do poder público.',
    aviso: 'Certificada como pública não quer dizer sem destino: 99% desta área já é assentamento.',
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'assentamentos', label: 'Assentamentos da reforma agrária',
    hint: '21 áreas, 13.438 hectares (134 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'territorios-quilombolas', label: 'Territórios quilombolas',
    hint: '2 áreas, 22 hectares na bacia — uns 31 campos de futebol. Território tradicional titulado ou em titulação, pelo INCRA.',
    color: 0x94c05b,   /* --layer-quilombolas */ on: false, render: 'fill', listavel: true,
  },
  // Vazio URBANO, que é assunto diferente do vazio cadastral rural — e tem
  // instrumento jurídico próprio: CF art. 182, §4º e Estatuto da Cidade arts.
  // 5º a 8º, competência do município. Vem do cadastro tributário da própria
  // PBH, que classifica o imóvel como "LOTE VAGO"; a contagem de infraestrutura
  // é o que distingue vazio qualquer de vazio onde a cidade já investiu.
  // Só Belo Horizonte: os outros 55 municípios não publicam cadastro aberto.
  {
    id: 'lotes-vagos-bh', label: 'Lotes vagos em Belo Horizonte',
    hint: 'Terrenos que a prefeitura registra como vagos no cadastro do IPTU, de 500 m² para cima. O número ao lado diz de quantos serviços urbanos a rua já dispõe — quanto mais alto, mais a cidade já investiu ali.',
    aviso: 'Vago no cadastro não quer dizer irregular. O terreno pode estar em obra, em inventário ou à espera de licença. É lugar para conferir, e quem decide é a Prefeitura.',
    color: 0xc1b237,   /* --layer-lotes-vagos */ on: false, render: 'point', pointSize: 0.005, listavel: true,
  },
  // A amostra que está sendo conferida à mão (pipeline/checagem_g0.py). Nasce
  // desligada: é instrumento de trabalho, não resultado — quem abre o mapa pela
  // primeira vez não deve topar com ela achando que é mais uma camada de dado.
  {
    id: 'checagem-g0', label: 'Amostra em conferência',
    hint: '63 áreas sorteadas ou escolhidas para alguém conferir uma a uma na imagem de satélite. É como se mede quanto o método erra.',
    aviso: 'Nada aqui está conferido ainda — é a fila de conferência, não o resultado dela.',
    color: 0xe2a138,   /* --caution: amostra em conferência É ressalva */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'devolutas-arrecadadas', label: 'Terras devolutas já reconhecidas',
    hint: 'Terra que o Estado já declarou devoluta. O INCRA não publica essa base — por isso a camada está vazia.',
    color: 0x84acff,   /* --layer-devolutas: saiu do matiz do acento */ on: false, render: 'fill',
  },
  {
    id: 'candidatos-curvelo', label: 'Exemplo de demonstração',
    hint: 'Três áreas inventadas, desenhadas à mão para testar a tela. Não são dado de lugar nenhum.',
    aviso: 'Esta área não existe. Foi inventada para demonstração — não use como informação.',
    color: 0xe08dd9,   /* --fiction: dado inventado (regra 4) */ on: false, render: 'fill', fixture: true, listavel: true,
  },
  // Ponto, não área: a SPU publica ONDE fica o imóvel, não o contorno dele.
  // O `aviso` carrega isso porque um ponto no mapa, ao lado de polígonos, é
  // lido como "área pequena" — e não é: é localização sem tamanho.
  {
    id: 'spu-imoveis-uniao', label: 'Imóveis do governo federal',
    hint: '553 imóveis da União na bacia, do cadastro da SPU — de escola e prédio público a fazenda e terreno vago. 79 deles estão registrados como "sem destinação definida" em todas as suas utilizações.',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true,
  },
  // ⚠️ Escopo corrigido em 30/07/2026. O hint dizia "conflito de terra", e o
  // alvo é outro: terreno abandonado, prédio abandonado, lugar fechado.
  // Conflito fundiário aparece de vez em quando e é achado de passagem, não o
  // que se procura — descrever a camada pelo caso raro fazia o leitor esperar a
  // coisa errada e, pior, enviesaria a própria coleta.
  //
  // Também virou 'point': notícia aponta um LUGAR, e o que se obtém dela é uma
  // coordenada geocodificada — nunca um contorno. Desenhar linha sugeriria um
  // perímetro que a fonte não tem.
  {
    id: 'pesquisa-noticias', label: 'Lugares abandonados na imprensa',
    hint: 'Terreno vazio, prédio abandonado e lugar fechado que apareceram em notícia. É pista para conferir, não cadastro. Ainda não coletadas.',
    aviso: 'Cada ponto marca o que a reportagem descreveu, na data dela. Notícia não é documento de propriedade, e situação de imóvel muda.',
    color: 0xfa8895,   /* --layer-noticias */ on: false, render: 'point', pointSize: 0.006, listavel: true,
  },
  // --- Vales do Mucuri e do Jequitinhonha (06/08/2026) --------------------
  //
  // Segunda região de estudo. Todas nascem DESLIGADAS: quem abre o globo cai
  // sobre o Paraopeba, e ligar 74 municípios a mais de saída faria a primeira
  // tela virar mancha. O sufixo `-vales` no id é o que mantém as duas regiões
  // em arquivos separados (pipeline/regioes.py).
  //
  // As cores repetem as das camadas irmãs do Paraopeba de propósito: a cor
  // identifica O QUE a camada é, não onde fica. Trocar o matiz por região faria
  // "terra pública" ter duas cores e quebraria a leitura do painel.
  {
    id: 'vazio-cadastral-vales', label: 'Terra sem cadastro — Vales do Mucuri e Jequitinhonha',
    hint: 'As 325 maiores áreas que nenhum imóvel declarou no CAR nos 74 municípios das duas mesorregiões, de 500 hectares (5 km²) para cima.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    color: 0xb49dff,   /* --layer-vazio-bacia: mesma coisa, outra região */ on: false, render: 'fill', listavel: true,
  },
  // A camada nova do eixo de função social. É a única do projeto em que o
  // indício NÃO é inferência sobre imagem: cada polígono é um auto de infração
  // que o Estado lavrou. Por isso o `aviso` carrega o que o embargo não é —
  // ler "área embargada" como "imóvel que descumpre a função social" seria o
  // salto que este projeto existe para não dar.
  {
    id: 'embargos-ambientais-vales', label: 'Áreas embargadas por infração ambiental',
    hint: '797 áreas embargadas pela fiscalização ambiental de Minas nos Vales, somando 4.105 hectares (41 km²). Supressão de vegetação responde por 642 delas.',
    aviso: 'Embargo não é decisão final — cabe defesa e recurso. E recai sobre a área da infração, não sobre o imóvel inteiro. Ausência de embargo aqui não quer dizer regularidade: pode ser só ausência de fiscalização. Nome e documento do autuado não são exibidos.',
    color: 0xe2a138,   /* --caution: indício é ressalva, não veredito */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'terra-publica-certificada-vales', label: 'Terra pública com medição oficial — Vales',
    hint: '65 áreas, 51.082 hectares (511 km²) que o INCRA certificou como públicas nas duas mesorregiões — quatro vezes o volume da bacia do Paraopeba.',
    aviso: 'Certificada como pública não quer dizer sem destino: 56% desta área já é assentamento. Na bacia do Paraopeba eram 99%, e é essa diferença que faz a região valer o exame.',
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'assentamentos-vales', label: 'Assentamentos da reforma agrária — Vales',
    hint: '54 áreas, 48.412 hectares (484 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'territorios-quilombolas-vales', label: 'Territórios quilombolas — Vales',
    hint: '12 áreas, 35.698 hectares (357 km²) titulados ou em titulação pelo INCRA. Na bacia do Paraopeba eram 22 hectares, uns 31 campos de futebol: aqui o território tradicional é uma das maiores presenças do mapa, não um detalhe.',
    color: 0x94c05b,   /* --layer-quilombolas */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'spu-imoveis-uniao-vales', label: 'Imóveis do governo federal — Vales',
    hint: '154 imóveis da União nas duas mesorregiões, do cadastro da SPU. 24 deles estão registrados como "sem destinação definida" em todas as suas utilizações.',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true,
  },
  // Camada dinâmica custom (Fase G3): satélites dos sensores do projeto em
  // órbita SGP4 real (TLE CelesTrak). Não vem do endpoint /camadas — a
  // factory fica em layers/satelites.js e é registrada no main.js.
  {
    id: 'satelites-orbita', label: 'Satélites em órbita',
    hint: 'Onde estão agora os satélites que fotografam essas áreas. Posição calculada em tempo real.',
    color: 0xe8eef6,   /* --text-1: satélite é marca de UI, não camada de dado */ on: true, render: 'custom',
  },
];
