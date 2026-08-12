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
// - regiao  = a qual REGIÃO DE ESTUDO a camada pertence — ver REGIOES_CAMADAS
//             logo abaixo. Omitido (undefined) = a camada cai no grupo
//             'geral', para quem não pertence a região nenhuma.
// - vazia   = a fonte está estruturalmente vazia HOJE: o arquivo é uma
//             FeatureCollection sem nenhuma feição, não um erro de rede nem
//             carga que ainda não aconteceu (ver ui/layerspanel.js, que
//             desliga a chave e mostra a lacuna sem esperar clique). Nasce
//             `false`/omitido; passa a `true` só nas camadas cujo arquivo é
//             hoje um `{"type":"FeatureCollection","features":[]}` de 45
//             bytes (checar em dados/camadas/). Quem publicar dado de verdade
//             nessa fonte apaga a flag — mesma disciplina de manter os
//             números escritos à mão no `hint` (ex.: "35 áreas") batendo com
//             o pipeline: ninguém aqui é recalculado sozinho.
// Cores seguem o design system Orbit Veil (documents/designs/).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Regiões de estudo — como o painel de camadas (ui/layerspanel.js) agrupa o
// LAYER_REGISTRY. Existem porque duas leituras de fora do projeto (a mais
// recente, do próprio dono) confundiram os cinco pares de camadas irmãs
// (bacia do Paraopeba × Vales do Mucuri e Jequitinhonha) com duplicata: a
// única pista de que são DUAS REGIÕES, e não a mesma coisa duas vezes, era um
// sufixo "— Vales" no fim de um rótulo comprido. Agrupar por região põe a
// pista no lugar onde ela precisa estar — no título da seção, antes de
// qualquer nome de camada — sem mexer numa cor sequer: a cor continua
// identificando O QUE a camada é (ver css/tokens/colors.css), o grupo
// identifica ONDE.
//
// 'geral' primeiro: é onde caem a moldura do mapa (divisas) e os satélites —
// contexto que a pessoa vê antes de entrar em qualquer região — e também as
// camadas de dado que não pertencem a nenhuma das duas regiões nomeadas
// (lotes vagos de BH, devolutas, notícias, normas geolocalizadas). 'bacia'
// depois porque é a região em que o globo abre por padrão (ABERTURA acima);
// 'vales' por último, a região que se liga por escolha.
//
// ⟲ POR QUE CAMPO NOVO, E NÃO DERIVAR DO SUFIXO DO ID. O sufixo `-vales` é
// convenção do PIPELINE (pipeline/regioes.py escreve os arquivos assim), não
// um contrato da UI, e não é confiável para os dois fins: `vazio-cadastral`
// (o recorte só de Curvelo) É da bacia e não leva sufixo nenhum; e
// `normas-geolocalizadas` mistura município da bacia (Betim, BH) com
// município dos Vales (Araçuaí, Diamantina) num arquivo só, porque a extração
// varreu as duas regiões juntas — não há sufixo que descreva isso, porque a
// camada não pertence a uma região, pertence às duas ou a nenhuma. Um regex
// sobre o id ia precisar da mesma lista de exceções que este campo já é,
// só que escondida numa função em vez de visível aqui. Campo explícito é uma
// fonte de verdade só, não sobrevive a um id renomeado pelo pipeline sem
// avisar, e é a mesma camada de decisão que `listavel`/`fixture` já usam.
// ---------------------------------------------------------------------------
export const REGIOES_CAMADAS = [
  { id: 'geral', titulo: 'Geral' },
  { id: 'bacia', titulo: 'Bacia do Paraopeba' },
  { id: 'vales', titulo: 'Vales do Mucuri e Jequitinhonha' },
];

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
    color: 0xb49dff,   /* --layer-vazio-bacia */ on: true, render: 'fill', listavel: true, regiao: 'bacia',
  },
  {
    id: 'vazio-cadastral', label: 'Terra sem cadastro — só Curvelo',
    hint: 'O mesmo cálculo em um município só, mostrando também as manchas pequenas: 390 áreas, a partir de 10 hectares — uns 14 campos de futebol cada.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    // Sem sufixo `-bacia` no id (é o recorte piloto de Curvelo, não o cálculo
    // dos 14 municípios), mas a região É a bacia do Paraopeba — Curvelo é um
    // dos municípios dela. Exatamente o caso que um regex sobre o id erraria.
    color: 0xd0baff,   /* --layer-vazio-curvelo, irmã mais clara */ on: false, render: 'fill', listavel: true, regiao: 'bacia',
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
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true, regiao: 'bacia',
  },
  {
    id: 'assentamentos', label: 'Assentamentos da reforma agrária',
    hint: '21 áreas, 13.438 hectares (134 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true, regiao: 'bacia',
  },
  {
    id: 'territorios-quilombolas', label: 'Territórios quilombolas',
    hint: '2 áreas, 22 hectares na bacia — uns 31 campos de futebol. Território tradicional titulado ou em titulação, pelo INCRA.',
    color: 0x94c05b,   /* --layer-quilombolas */ on: false, render: 'fill', listavel: true, regiao: 'bacia',
  },
  // Vazio URBANO, que é assunto diferente do vazio cadastral rural — e tem
  // instrumento jurídico próprio: CF art. 182, §4º e Estatuto da Cidade arts.
  // 5º a 8º, competência do município. Vem do cadastro tributário da própria
  // PBH, que classifica o imóvel como "LOTE VAGO"; a contagem de infraestrutura
  // é o que distingue vazio qualquer de vazio onde a cidade já investiu.
  // Só Belo Horizonte: os outros 55 municípios não publicam cadastro aberto.
  {
    // Sem `regiao`: BH não é a bacia do Paraopeba nem os Vales — é o cadastro
    // tributário de UM município, cruzando as duas regiões de estudo por
    // fora. Cai no grupo 'geral' do painel.
    id: 'lotes-vagos-bh', label: 'Lotes vagos em Belo Horizonte',
    hint: 'Terrenos que a prefeitura registra como vagos no cadastro do IPTU, de 500 m² para cima. O número ao lado diz de quantos serviços urbanos a rua já dispõe — quanto mais alto, mais a cidade já investiu ali.',
    aviso: 'Vago no cadastro não quer dizer irregular. O terreno pode estar em obra, em inventário ou à espera de licença. É lugar para conferir, e quem decide é a Prefeitura.',
    color: 0xc1b237,   /* --layer-lotes-vagos */ on: false, render: 'point', pointSize: 0.005, listavel: true,
  },
  // A amostra que está sendo conferida à mão (pipeline/checagem_g0.py). Nasce
  // desligada: é instrumento de trabalho, não resultado — quem abre o mapa pela
  // primeira vez não deve topar com ela achando que é mais uma camada de dado.
  {
    // A amostra é dos municípios da bacia (Curvelo, Betim, Contagem, Sete
    // Lagoas, Pará de Minas, Congonhas... — conferido nos dados, não chutado):
    // é o piloto do Paraopeba, não uma amostra das duas regiões.
    id: 'checagem-g0', label: 'Amostra em conferência',
    hint: '63 áreas sorteadas ou escolhidas para alguém conferir uma a uma na imagem de satélite. É como se mede quanto o método erra.',
    aviso: 'Nada aqui está conferido ainda — é a fila de conferência, não o resultado dela.',
    color: 0xe2a138,   /* --caution: amostra em conferência É ressalva */ on: false, render: 'fill', listavel: true, regiao: 'bacia',
  },
  {
    id: 'devolutas-arrecadadas', label: 'Terras devolutas já reconhecidas',
    hint: 'Terra que o Estado já declarou devoluta. O INCRA não publica essa base — por isso a camada está vazia.',
    color: 0x84acff,   /* --layer-devolutas: saiu do matiz do acento */ on: false, render: 'fill',
    // dados/camadas/devolutas-arrecadadas.geojson é hoje 45 bytes: uma
    // FeatureCollection sem nenhuma feição, não uma camada que falhou ao
    // carregar. `vazia` deixa o painel mostrar isso ANTES do clique — a
    // lacuna é o achado (o INCRA não publica esta base), e essa é a razão
    // de a camada existir mesmo vazia. Ver ui/layerspanel.js.
    vazia: true,
  },
  // ⟲ SAIU A CAMADA `candidatos-curvelo` (12/08), a pedido do dono do projeto.
  // Eram três polígonos inventados à mão para testar a tela, e estavam
  // publicados no painel de um portal de transparência ao lado de camadas do
  // INCRA e da SPU. As defesas funcionavam (selo FICTÍCIO no painel, exclusão
  // da exportação em ui/exportar.js), mas nenhuma delas viaja num print de
  // tela: o polígono era desenhado no globo com a mesma aparência das camadas
  // reais. O jeito de um dado inventado nunca ser lido como oficial é ele não
  // estar publicado.
  //
  // A MAQUINARIA DE FIXTURE FICA: a flag `fixture`, `separarExportaveis()`, o
  // selo `.layer-fake`/`.lista-fake` e o token --fiction seguem de pé e
  // testados. O que saiu foi a camada, não a defesa contra ela — a próxima
  // que precisar de dado de demonstração acha o caminho pronto.
  // Ponto, não área: a SPU publica ONDE fica o imóvel, não o contorno dele.
  // O `aviso` carrega isso porque um ponto no mapa, ao lado de polígonos, é
  // lido como "área pequena" — e não é: é localização sem tamanho.
  {
    id: 'spu-imoveis-uniao', label: 'Imóveis do governo federal',
    hint: '553 imóveis da União na bacia, do cadastro da SPU — de escola e prédio público a fazenda e terreno vago. 79 deles estão registrados como "sem destinação definida" em todas as suas utilizações.',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true, regiao: 'bacia',
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
    // Mesmo caso de `devolutas-arrecadadas`: dados/camadas/pesquisa-noticias.geojson
    // é hoje 45 bytes, sem nenhuma feição — "ainda não coletadas" no hint
    // acima é literal, não retórica de carregamento.
    vazia: true,
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
    color: 0xb49dff,   /* --layer-vazio-bacia: mesma coisa, outra região */ on: false, render: 'fill', listavel: true, regiao: 'vales',
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
    // Ganhou cor PRÓPRIA em 12/08: usava 0xe2a138, o mesmo âmbar de
    // `checagem-g0`. As duas são 'fill' e listáveis, então ligadas ao mesmo
    // tempo pintavam 797 áreas embargadas e 63 de amostra na cor idêntica —
    // no globo e no dot da lista. O matiz novo saiu por medição (meio da maior
    // lacuna do círculo), não por gosto: ver --layer-embargos em
    // css/tokens/colors.css. Que o embargo é grave continua dito no `aviso`,
    // em palavras — não na cor.
    color: 0x10c1ef,   /* --layer-embargos */ on: false, render: 'fill', listavel: true, regiao: 'vales',
  },
  {
    id: 'terra-publica-certificada-vales', label: 'Terra pública com medição oficial — Vales',
    hint: '65 áreas, 51.082 hectares (511 km²) que o INCRA certificou como públicas nas duas mesorregiões — quatro vezes o volume da bacia do Paraopeba.',
    aviso: 'Certificada como pública não quer dizer sem destino: 56% desta área já é assentamento. Na bacia do Paraopeba eram 99%, e é essa diferença que faz a região valer o exame.',
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true, regiao: 'vales',
  },
  {
    id: 'assentamentos-vales', label: 'Assentamentos da reforma agrária — Vales',
    hint: '54 áreas, 48.412 hectares (484 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true, regiao: 'vales',
  },
  {
    id: 'territorios-quilombolas-vales', label: 'Territórios quilombolas — Vales',
    hint: '12 áreas, 35.698 hectares (357 km²) titulados ou em titulação pelo INCRA. Na bacia do Paraopeba eram 22 hectares, uns 31 campos de futebol: aqui o território tradicional é uma das maiores presenças do mapa, não um detalhe.',
    color: 0x94c05b,   /* --layer-quilombolas */ on: false, render: 'fill', listavel: true, regiao: 'vales',
  },
  {
    id: 'spu-imoveis-uniao-vales', label: 'Imóveis do governo federal — Vales',
    hint: '154 imóveis da União nas duas mesorregiões, do cadastro da SPU. 24 deles estão registrados como "sem destinação definida" em todas as suas utilizações.',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true, regiao: 'vales',
  },
  // --- Normas geolocalizadas (11/08/2026) ----------------------------------
  //
  // Pedido do dono do projeto: leis/decretos com endereço virarem camada no
  // globo. Medido antes de construir (docs/normas-mapa-viabilidade.md):
  // 11,2% das ~10.300 normas das 6 cidades citam um logradouro/bairro/
  // distrito reconhecível NA EMENTA — nunca no PDF/texto completo, que os
  // testes daquele documento mostram que não ajuda (só ruído ou scan sem
  // texto). Cobertura parcial por natureza, como toda camada deste globo
  // (SPU é 553 de um cadastro que não cobre todo imóvel do Brasil): "esta
  // norma não apareceu" não é "esta norma não tem endereço", é "não
  // conseguimos localizar com confiança" — regra do projeto é não
  // adivinhar. Extração e geocodificação (Nominatim) em
  // `etl/betim/etl/normas_geo/`, GeoJSON gerado por `gerar_geojson.py`.
  //
  // Sem `regiao`: as normas geocodificadas atravessam as duas — o arquivo tem
  // município da bacia (Betim, Belo Horizonte) e dos Vales (Araçuaí,
  // Diamantina) juntos, porque a extração varreu as cidades do estudo sem
  // separar por região. Forçar um grupo só mentiria sobre a outra metade.
  {
    id: 'normas-geolocalizadas', label: 'Leis e decretos com lugar citado',
    hint: '743 normas (de 1.151 com lugar extraído da ementa, de 10.317 no total) que o Nominatim conseguiu geocodificar pelo NOME do lugar — não por endereço exato. 189 em confiança "alta" (rua/avenida/praça citada por nome), 554 em "média" (só bairro/distrito).',
    aviso: 'O ponto marca o LUGAR CITADO, não o endereço exato da norma nem de nenhum imóvel — normas de bairro/distrito (confiança "média") caem no centro aproximado da área. Extraído só da ementa, nunca de PDF ou texto completo: testado e não ajuda (ver docs/normas-mapa-viabilidade.md). A maioria das normas não aparece aqui — não tem endereço reconhecível na ementa, o que é o caso comum, não uma falha da busca.',
    color: 0x6366f1,   /* --layer-normas: violeta-azulado, sem par no restante do registro */ on: false, render: 'point', pointSize: 0.005, listavel: true,
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
