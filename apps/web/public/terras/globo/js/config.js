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
//
// ⟲ 13/08/2026 — trocado de "municípios da bacia do Paraopeba" (Betim, BH,
// Contagem, Curvelo, Pompéu, S. J. de Bicas, Brumadinho) para "as cidades que
// têm PORTAL DETALHADO próprio no site", a pedido do dono, olhando o mapa no
// celular: ele quer os botões levando a lugar que já tem página pronta, não a
// todo município que apareceu num cálculo. Geocódigos conferidos contra
// `ref_municipios_mg` e `lib/db/cidades-do-build.ts` (não deduzidos):
//   Araçuaí 3103405, Itinga 3134004, Diamantina 3121605 (Jequitinhonha),
//   Betim 3106705, Belo Horizonte 3106200 (bacia do Paraopeba).
//
// São Paulo (3550308) FICOU DE FORA, embora tenha portal: o globo é só de
// Minas Gerais, e `municipioPorCodigo` (data/municipios.js) resolve o botão
// contra a camada `municipios-mg` — a malha do IBGE com os 853 municípios de
// MG, e SÓ eles. Conferido hoje: `3550308` não existe nas 853 features de
// `dados/camadas/municipios-mg.geojson`. Um botão "São Paulo" chamaria
// `focar()` (main.js), que chamaria `municipioPorCodigo('3550308')`, receberia
// `null`, daria `console.warn` e não moveria a câmera nem um grau — um botão
// que parece fazer algo e não faz nada é pior do que não ter o botão. Incluir
// SP de verdade exigiria uma malha municipal de SP nova (fora do escopo de um
// globo de MG) ou um preset com recorte próprio como `ABERTURA` tem — nenhum
// dos dois é "um item nesta lista".
//
// Curvelo, Pompéu, Contagem e Brumadinho SAÍRAM da barra — mas não do app:
// - `vazio-cadastral-curvelo` (a linha "Terra sem cadastro — detalhe de
//   Curvelo" no painel de camadas, ver o comentário grande logo abaixo em
//   LAYER_REGISTRY) continua existindo. O comentário explica por que ela é
//   INDEPENDENTE da camada da bacia (limiares de área diferentes, 12 áreas
//   sobrepostas) — motivo nenhum tem a ver com o botão de foco da barra, que é
//   só um atalho de câmera. Tirar o atalho não tira a camada nem os dados;
//   quem quiser ver Curvelo de perto chega lá pelo campo de busca, como
//   qualquer um dos outros 848 municípios de MG.
// - Conferido no código (grep por "curvelo", "pompeu", "brumadinho",
//   "contagem" em js/): as menções que sobram fora deste arquivo são
//   comentários históricos (o sistema de recorte por região Brasil/Sudeste/
//   Minas/Curvelo, substituído em 28/07 — main.js, boundaries.js,
//   controls.js), fixtures de TESTE que usam "Curvelo" como nome de
//   município de exemplo (rotulos.test.mjs, mesorregioes.test.mjs) e a antiga
//   camada de demonstração `candidatos-curvelo` (já removida em 12/08,
//   exportar.test.mjs testa que ela CONTINUA fora). Nenhum deep-link, nenhuma
//   camada e nenhum teste depende do id `curvelo`/`pompeu`/`brumadinho`/
//   `contagem` desta lista — `focarbar.js` é genérico, itera `FOCUS_PRESETS`
//   sem conhecer nomes de cidade.
// ---------------------------------------------------------------------------
export const FOCUS_PRESETS = [
  { id: 'aracuai',     label: 'Araçuaí',     geocodigo: '3103405' },
  { id: 'itinga',      label: 'Itinga',      geocodigo: '3134004' },
  { id: 'diamantina',  label: 'Diamantina',  geocodigo: '3121605' },
  { id: 'betim',       label: 'Betim',       geocodigo: '3106705' },
  { id: 'bh',          label: 'BH',          geocodigo: '3106200' },
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
// - regioes = de quais REGIÕES DE ESTUDO (ver REGIOES acima) esta FONTE traz
//             área. Lista, porque o pipeline grava os dois vales num arquivo
//             só. Omitido/`null` = a fonte não é de região nenhuma (a moldura
//             de municípios, os satélites, o cadastro de UM município, as
//             normas das cidades do estudo): o filtro de região não a esconde,
//             porque esconder exigiria afirmar uma região que ela não tem.
// - mesoIndistinta = a fonte mistura Jequitinhonha e Mucuri E o dado NÃO
//             permite dizer de qual mesorregião é cada área — não há
//             `codigo_ibge` nem `municipio` nas propriedades, só `area_ha`.
//             Com o filtro num dos dois vales, a fonte entra INTEIRA e o painel
//             AVISA que ela traz também o outro vale. Fingir o contrário —
//             esconder a camada, ou mostrá-la como se estivesse filtrada —
//             seria precisão que o dado não tem. Conferido área por área hoje:
//             ver o comentário de cada fonte.
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
// - comprimida = o arquivo servido é `dados/camadas/<id>.geojson.gz`, não
//             `<id>.geojson` — `data/api.js` (`fetchLayer`) busca o `.gz` e
//             descomprime com `DecompressionStream('gzip')` antes do
//             `JSON.parse`. Existe porque o teto de arquivo do Workers Static
//             Assets é 25 MiB (free E pago) e `sigmine-interesse.geojson` cru
//             pesava 32,4 MiB — o deploy falhava nesse arquivo. Só as camadas
//             acima de ~8 MiB levam a flag (lista e antes/depois medido em
//             scripts/comprimir-camadas-grandes.mjs); as menores ficam cru,
//             porque gzipar tudo complicaria o carregador sem ganho nenhum.
//             Nasce omitida/`false`. O `.geojson` cru destas três fontes
//             SAIU do repositório de propósito — manter as duas versões
//             dobraria o peso do repo sem servir a ninguém.
// Cores seguem o design system Orbit Veil (documents/designs/).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DOIS EIXOS: o painel agrupa por ASSUNTO, e a região é um filtro à parte
//
// ⟲ 13/08/2026 — substitui o agrupamento por região que vigorou de 12/08 a
// hoje. Aquele agrupamento tornou a lista legível, mas não resolveu o problema
// que o dono relatou, e ele voltou a relatá-lo: "a questão das camadas tá muito
// confuso. Não vamos ficar ligando apenas do Paraopeba ou dos Vales."
//
// O diagnóstico, contado no registro de hoje: as 19 fontes do LAYER_REGISTRY
// cobrem só 14 assuntos, porque CINCO conceitos apareciam duas ou três vezes,
// um por região — assentamentos, quilombolas, terra pública certificada,
// imóveis da União e terra sem cadastro. Agrupar por região deixou os irmãos em
// seções diferentes, o que explica que sejam lugares distintos mas PIORA o que
// a pessoa quer fazer: para ver todos os assentamentos de Minas era preciso
// descobrir que existem dois interruptores de nome quase igual, em seções
// diferentes, e ligar os dois. Ninguém que abre o mapa pela primeira vez faz
// isso.
//
// Agora: uma linha por CONCEITO (`CAMADAS`, mais abaixo), agrupada por ASSUNTO;
// a região vira um filtro independente, que não muda o que está ligado, só o
// recorte do que aparece. Ligar "Assentamentos da reforma agrária" liga o dado
// de todas as regiões que existem.
//
// A COR NÃO MUDA e continua identificando O QUE a camada é (ver
// css/tokens/colors.css) — agora com uma vantagem que o modelo antigo não
// tinha: como cada conceito é UMA linha, as cores repetidas entre irmãs
// deixaram de ser duas linhas da mesma cor e passaram a ser uma só.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Eixo 1 — ASSUNTO: o que a camada mostra. É a ordem da lista.
//
// 'sem-cadastro' primeiro porque é o achado central do projeto e porque a única
// camada de DADO ligada de saída é dele — as manchas roxas que o cartão de
// abertura (ui/intro.js) manda procurar. Medido num navegador real servindo
// `apps/web/public` estático, já com esta ordem:
// `#layers-panel [data-camada-id="vazio-cadastral"]`.offsetTop = 153px num
// painel de clientHeight 743px — visível sem rolar. Os 153px são o cabeçalho
// mais o filtro de região, que passou a morar acima da lista; a camada continua
// acima da dobra, com folga de quase 600px.
//
// 'referencia' por último: são a moldura (divisas) e os satélites, que já nascem
// ligados e ninguém precisa procurar.
//
// O painel inteiro encolheu de 3.084px para 958px de conteúdo — medido nos dois
// checkouts lado a lado, 19 linhas de 152px de altura média contra 14 de ~46px,
// e 2.804 caracteres de explicação sempre na tela contra zero (agora sob o "?").
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Destaques: as cinco camadas mais procuradas, fora da lista
//
// Cinco, como os cinco botões de cidade logo abaixo — a barra é o "o quê" e a
// de baixo é o "onde", e as duas juntas são a decisão que a pessoa toma ao
// abrir o mapa. Mais que cinco e ela vira um segundo painel; menos e não vale
// ocupar a faixa.
//
// ⚠️ "Barragens" NÃO virou um botão, e isso foi medido, não achado: neste globo
// não existe camada de barragem. Existem `zas-barragens` (a zona onde não dá
// tempo de esperar socorro) e `mancha-inundacao-barragens` (até onde o rejeito
// chegaria) — as duas SÃO as barragens, e um botão "Barragens" seria um
// terceiro controle para duas camadas que já teriam os seus. Então o slot que
// sobrou foi para "Minas em operação", que é o que dá sentido às outras duas:
// a barragem é de alguma mina.
//
// O que fica DE FORA de propósito: os chips de região e o "Ligar tudo", que já
// estão no topo do painel, a dois centímetros. Barra de atalho que repete o
// que está do lado não é atalho, é ruído.
// ---------------------------------------------------------------------------
export const DESTAQUES = [
  {
    id: 'sem-cadastro',
    label: 'Terra sem cadastro',
    hint: 'As áreas rurais que nenhum imóvel declarou no CAR, nas regiões de estudo.',
    cor: '#b49dff',
    camadas: ['vazio-cadastral'],
  },
  {
    id: 'zas',
    label: 'ZAS',
    hint: 'Zona de Autossalvamento: o trecho a jusante da barragem onde não há tempo hábil para intervenção da defesa civil depois do alerta.',
    cor: '#8ecae6',
    camadas: ['zas-barragens'],
  },
  {
    id: 'mancha',
    label: 'Mancha de inundação',
    hint: 'Até onde o rejeito chegaria se a barragem rompesse, pelos estudos que a FEAM publica — 156 das 259 barragens de Minas.',
    cor: '#f8b0c8',
    camadas: ['mancha-inundacao-barragens'],
  },
  {
    id: 'minas',
    label: 'Minas em operação',
    hint: 'Onde há extração de minério autorizada de verdade — 7.090 poligonais da ANM em Minas.',
    cor: '#70c678',
    camadas: ['sigmine-operacao'],
  },
  {
    id: 'imoveis-uniao',
    label: 'Imóveis da União',
    hint: 'Onde ficam os imóveis do governo federal, pelo cadastro da SPU. Ponto de localização, não contorno.',
    cor: '#45ca96',
    camadas: ['spu-imoveis-uniao'],
  },
];

export const ASSUNTOS = [
  { id: 'sem-cadastro',  titulo: 'Terra sem cadastro' },
  { id: 'terra-publica', titulo: 'Terra pública e destinação' },
  // Novo em 13/08/2026 (docs/FONTES-TERRITORIO-E-MINERACAO.md). Fica logo
  // depois de 'terra-publica' porque as duas falam de território — mas o que
  // esta seção reúne é distinto o bastante para não caber lá: terra indígena
  // não é terra do poder público (é terra da União com usufruto exclusivo do
  // povo, direito ORIGINÁRIO — CF art. 231, não uma categoria fundiária como
  // assentamento ou terra certificada), e mineração/barragem são risco, não
  // destinação.
  { id: 'territorio-mineracao', titulo: 'Território indígena, mineração e barragens' },
  // Novo em 13/08/2026 (docs/HANDOFF-CAMADA-DINHEIRO.md). Logo depois de
  // 'territorio-mineracao' porque a CFEM é royalty de mineração — a mesma
  // atividade que a seção acima trata como risco, aqui vira dinheiro público.
  // O cruzamento de licença ambiental × contrato/convênio não é só mineração
  // (setor inclui resíduos e infraestrutura também), mas nasceu junto e cabe
  // melhor perto da irmã do que sozinho antes de 'cidade'.
  // Novo em 15/08/2026. A seção acima chegou a 21 linhas, e 9 delas eram do
  // rompimento de 2019 — o assunto mais específico do painel enterrando os
  // mais gerais. Separar não é arrumação: as camadas de Brumadinho respondem
  // "o que aconteceu naquele lugar", e as de cima respondem "onde há risco e
  // pressão hoje". Só uma delas é história.
  //
  // Fica DEPOIS de território/mineração, e não antes, porque é o caso
  // particular daquilo: quem chega ao mapa procurando barragem encontra
  // primeiro a régua geral (ZAS, mancha, minas) e só então o episódio.
  { id: 'brumadinho', titulo: 'Rompimento de Brumadinho (2019)' },
  { id: 'dinheiro', titulo: 'Dinheiro público e mineração' },
  { id: 'cidade',        titulo: 'Cidade e imóveis urbanos' },
  { id: 'pistas',        titulo: 'Fiscalização e pistas' },
  { id: 'referencia',    titulo: 'Referência do mapa' },
];

// ---------------------------------------------------------------------------
// Eixo 2 — REGIÃO: onde. Filtro próprio, independente do que está ligado.
//
// ⚠️ NOMENCLATURA CORRIGIDA, e é fato, não gosto. O rótulo antigo era "Vales do
// Mucuri e Jequitinhonha", juntando DUAS mesorregiões distintas do IBGE numa
// entrada só. Conferido em `C:/DevCoder/terras-devolutas/pipeline/regioes.py`:
// `jequitinhonha` (mesorregião 3103) e `mucuri` (3104) são tabelas separadas,
// com 51 e 23 municípios — contados agora, e sem nenhum código em comum; a
// entrada `vales` de lá é só a união das duas (74). Como Minas tem outros vales
// (Vale do Aço, Vale do Rio Doce), "Vales" sem sobrenome é ambíguo, e o dono
// pediu que se diga sempre qual.
//
// Elas aparecem separadas aqui porque o DADO sustenta a separação na maior
// parte dos casos — ver `mesoIndistinta` nas fontes abaixo, que marca
// exatamente as três camadas em que não sustenta. Sem `data/mesorregioes.js`
// esta separação seria só um rótulo mais bonito sobre o mesmo balaio.
//
// 'todas' não está na lista: é o estado de partida do filtro (nenhuma região
// escolhida = todas), não uma região. Ver ui/layerspanel.js.
// ---------------------------------------------------------------------------
export const REGIOES = [
  { id: 'bacia',         titulo: 'Bacia do Paraopeba',    curto: 'Paraopeba' },
  { id: 'jequitinhonha', titulo: 'Vale do Jequitinhonha', curto: 'Jequitinhonha' },
  { id: 'mucuri',        titulo: 'Vale do Mucuri',        curto: 'Mucuri' },
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
    color: 0xb49dff,   /* --layer-vazio-bacia */ on: true, render: 'fill', listavel: true, regioes: ['bacia'],
  },
  {
    id: 'vazio-cadastral', label: 'Terra sem cadastro — só Curvelo',
    hint: 'O mesmo cálculo em um município só, mostrando também as manchas pequenas: 390 áreas, a partir de 10 hectares — uns 14 campos de futebol cada.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    // Sem sufixo `-bacia` no id (é o recorte piloto de Curvelo, não o cálculo
    // dos 14 municípios), mas a região É a bacia do Paraopeba — Curvelo é um
    // dos municípios dela. Exatamente o caso que um regex sobre o id erraria.
    color: 0xd0baff,   /* --layer-vazio-curvelo, irmã mais clara */ on: false, render: 'fill', listavel: true, regioes: ['bacia'],
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
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true, regioes: ['bacia'],
  },
  {
    id: 'assentamentos', label: 'Assentamentos da reforma agrária',
    hint: '21 áreas, 13.438 hectares (134 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true, regioes: ['bacia'],
  },
  // ⟲ 13/08 (fim do dia): TRÊS FONTES VIRARAM UMA, a pedido do dono, e ele
  // estava certo: "qual o sentido de dividir?". Havia
  // `territorios-quilombolas` (bacia), `-vales` e `-outras-regioes`, e a
  // única razão da separação era técnica — `regioes` é filtro POR FONTE, e
  // cada recorte queria o seu. Mas essa é exatamente a organização por
  // REGIÃO que este arquivo abandonou em 13/08 de manhã, quando o painel
  // passou a agrupar por ASSUNTO justamente porque "para ver todos os
  // assentamentos de Minas era preciso descobrir dois interruptores de nome
  // quase igual e ligar os dois". Território quilombola é UM conceito.
  //
  // SEM `regioes`, de propósito: fonte estadual não pertence a um recorte.
  // O município de cada território está na ficha, que é onde a informação
  // de lugar deve morar — não num filtro que esconde metade do conceito.
  {
    id: 'territorios-quilombolas', label: 'Territórios quilombolas',
    hint: '27 polígonos de 23 territórios, 141.446 hectares (1.414 km²) titulados ou em titulação pelo INCRA, em Minas inteira. Um território pode ter várias parcelas separadas: Marobá dos Teixeira, por exemplo, são 5. Os maiores são Gurutuba (Jaíba/Gamaleira/Monte Azul, 45.852 ha), Brejo dos Crioulos (17.409 ha) e Tabua (Manga, 16.638 ha).',
    aviso: 'Fase incluída de propósito, do RTID (Relatório Técnico de Identificação e Delimitação) publicado ao titulado: o direito não espera o título. Foi essa escolha que fez aparecer a sobreposição de lavra de granito sobre o Território do Baú, em Araçuaí — ele ainda não tem título definitivo e, filtrado por "titulado", não apareceria.',
    color: 0x94c05b,   /* --layer-quilombolas */ on: false, render: 'fill', listavel: true,
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
    color: 0xe2a138,   /* --caution: amostra em conferência É ressalva */ on: false, render: 'fill', listavel: true, regioes: ['bacia'],
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
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true, regioes: ['bacia'],
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
  // --- Jequitinhonha e Mucuri (06/08/2026) --------------------------------
  //
  // Segunda e terceira regiões de estudo, num arquivo só por fonte: o pipeline
  // grava a UNIÃO das duas mesorregiões com sufixo `-vales`
  // (pipeline/regioes.py, entrada `vales` = MUCURI + JEQUITINHONHA). Todas
  // nascem DESLIGADAS: quem abre o globo cai sobre o Paraopeba, e ligar 74
  // municípios a mais de saída faria a primeira tela virar mancha.
  //
  // ⚠️ "Vales" saiu dos rótulos (13/08). Duas mesorregiões distintas do IBGE
  // num nome só, num estado que tem Vale do Aço e Vale do Rio Doce, é ambíguo —
  // e o dono pediu que se diga sempre qual. Onde a fonte permite separar, quem
  // separa é o filtro de região; onde não permite, o rótulo diz "Jequitinhonha
  // e Mucuri" por extenso e a fonte se marca `mesoIndistinta`.
  //
  // As cores repetem as das camadas irmãs do Paraopeba de propósito: a cor
  // identifica O QUE a camada é, não onde fica. Desde 13/08 isso deixou de ser
  // um custo — como cada conceito é UMA linha no painel, as duas fontes de
  // mesma cor moram na mesma linha em vez de parecerem duplicata.
  {
    id: 'vazio-cadastral-vales', label: 'Terra sem cadastro — Jequitinhonha e Mucuri',
    hint: 'As 325 maiores áreas que nenhum imóvel declarou no CAR nos 74 municípios das duas mesorregiões, de 500 hectares (5 km²) para cima.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    // SEPARÁVEL por mesorregião: contadas hoje, as 325 áreas trazem
    // `codigo_ibge` em 325 delas (100%), e todos os 325 códigos caem nas
    // tabelas do IBGE — 279 no Jequitinhonha, 46 no Mucuri, nenhum fora. Por
    // isso NÃO leva `mesoIndistinta`: o filtro de região filtra área por área.
    color: 0xb49dff,   /* --layer-vazio-bacia: mesma coisa, outra região */ on: false, render: 'fill', listavel: true,
    regioes: ['jequitinhonha', 'mucuri'],
  },
  // A camada nova do eixo de função social. É a única do projeto em que o
  // indício NÃO é inferência sobre imagem: cada polígono é um auto de infração
  // que o Estado lavrou. Por isso o `aviso` carrega o que o embargo não é —
  // ler "área embargada" como "imóvel que descumpre a função social" seria o
  // salto que este projeto existe para não dar.
  {
    id: 'embargos-ambientais-vales', label: 'Áreas embargadas por infração ambiental',
    hint: '797 áreas embargadas pela fiscalização ambiental de Minas no Jequitinhonha e no Mucuri, somando 4.105 hectares (41 km²). Supressão de vegetação responde por 642 delas.',
    aviso: 'Embargo não é decisão final — cabe defesa e recurso. E recai sobre a área da infração, não sobre o imóvel inteiro. Ausência de embargo aqui não quer dizer regularidade: pode ser só ausência de fiscalização. Nome e documento do autuado não são exibidos.',
    // Ganhou cor PRÓPRIA em 12/08: usava 0xe2a138, o mesmo âmbar de
    // `checagem-g0`. As duas são 'fill' e listáveis, então ligadas ao mesmo
    // tempo pintavam 797 áreas embargadas e 63 de amostra na cor idêntica —
    // no globo e no dot da lista. O matiz novo saiu por medição (meio da maior
    // lacuna do círculo), não por gosto: ver --layer-embargos em
    // css/tokens/colors.css. Que o embargo é grave continua dito no `aviso`,
    // em palavras — não na cor.
    // SEPARÁVEL: `codigo_ibge` nas 797 áreas (100%) — 565 no Jequitinhonha,
    // 232 no Mucuri, nenhuma fora das tabelas do IBGE. Contado hoje.
    color: 0x10c1ef,   /* --layer-embargos */ on: false, render: 'fill', listavel: true,
    regioes: ['jequitinhonha', 'mucuri'],
  },
  // ⚠️ AS TRÊS FONTES A SEGUIR NÃO SE SEPARAM POR MESORREGIÃO, e o motivo é o
  // dado, não a preguiça: contadas hoje, as 65 + 54 + 12 = 131 áreas do INCRA
  // dos Vales trazem UMA única propriedade, `area_ha`. Sem `codigo_ibge` e sem
  // `municipio` não há como dizer se um assentamento é do Jequitinhonha ou do
  // Mucuri sem cruzamento espacial contra a malha municipal — que este app não
  // faz e que não vai fazer no cliente por uma legenda.
  //
  // Então elas se declaram `mesoIndistinta` e o painel DIZ isso na linha, em
  // palavras. A alternativa seria escondê-las quando o filtro está num vale só
  // (mentira por omissão: o dado da pessoa está ali) ou mostrá-las como se
  // estivessem filtradas (mentira por comissão). O conserto de verdade é o
  // pipeline gravar o município — anotado no relatório desta entrega.
  {
    id: 'terra-publica-certificada-vales', label: 'Terra pública com medição oficial — Jequitinhonha e Mucuri',
    hint: '65 áreas, 51.082 hectares (511 km²) que o INCRA certificou como públicas nas duas mesorregiões — quatro vezes o volume da bacia do Paraopeba.',
    aviso: 'Certificada como pública não quer dizer sem destino: 56% desta área já é assentamento. Na bacia do Paraopeba eram 99%, e é essa diferença que faz a região valer o exame.',
    color: 0x00cbb6,   /* --layer-terra-publica */ on: false, render: 'fill', listavel: true,
    regioes: ['jequitinhonha', 'mucuri'], mesoIndistinta: true,
  },
  {
    id: 'assentamentos-vales', label: 'Assentamentos da reforma agrária — Jequitinhonha e Mucuri',
    hint: '54 áreas, 48.412 hectares (484 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    color: 0xf19650,   /* --layer-assentamentos */ on: false, render: 'fill', listavel: true,
    regioes: ['jequitinhonha', 'mucuri'], mesoIndistinta: true,
  },
  // Terceira fonte de quilombolas, NOVA em 13/08/2026 (mais tarde) — os 13
  // territórios do INCRA que não entram nem na bacia nem nos Vales (ver
  // scripts/ingerir_incra_quilombolas.py, seção "OS 13 QUE SOBRAVAM AGORA
  // ENTRAM", para a decisão completa de por que é uma fonte nova em vez de
  // fundir as duas de cima). Mesma cor das duas irmãs — é o MESMO conceito
  // (território quilombola), só em municípios que não caem em nenhuma das
  // regiões de estudo já delimitadas. SEM `regioes`, de propósito: nenhum
  // dos 13 municípios bate `js/data/mesorregioes.js` nem foi conferido
  // contra o polígono da bacia do Paraopeba — declarar uma região que o
  // dado não sustenta seria o erro que este arquivo evita em toda outra
  // fonte "geral" (ver `normas-geolocalizadas`, mais abaixo, pelo mesmo
  // motivo: fonte sem região aparece em qualquer filtro, nunca escondida).
  {
    id: 'spu-imoveis-uniao-vales', label: 'Imóveis do governo federal — Jequitinhonha e Mucuri',
    // ⚠️ 24 **em todas as utilizações**, mais 1 de regime composto — conferido
    // em 15/08/2026. Um imóvel de Teófilo Otoni grava "Em Processo de
    // Destinação · Sem Destinação Definida" e por isso ficava fora da conta. O
    // número não estava errado: respondia a um critério mais estrito. Só que o
    // imóvel excluído é o mais documentado dos 25 — antigo acampamento do
    // DNER, com 22 casas, escola e canteiro da ponte do Rio Mucuri, destinação
    // reaberta em 30/01/2025. Então a frase passa a dizer os dois números em
    // vez de escolher um. Ver docs/SPU-SEM-DESTINACAO.md.
    hint: '154 imóveis da União nas duas mesorregiões, do cadastro da SPU. 24 estão registrados como "sem destinação definida" em todas as suas utilizações — 25, contando um cujo registro mistura "em processo de destinação" com "sem destinação".',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    // SEPARÁVEL, mas por NOME e não por código: esta fonte não traz
    // `codigo_ibge` em nenhum dos 154 imóveis — traz `municipio` nos 154. Os 22
    // nomes distintos casaram TODOS contra as tabelas do IBGE (98 no
    // Jequitinhonha, 56 no Mucuri, zero sem correspondência), conferido hoje.
    // `mesorregiaoDe()` cai no nome só quando não há código, exatamente por
    // este caso — ver data/mesorregioes.js.
    color: 0x45ca96,   /* --layer-spu */ on: false, render: 'point', pointSize: 0.006, listavel: true,
    regioes: ['jequitinhonha', 'mucuri'],
  },
  // --- Território indígena, mineração e segurança de barragens (13/08/2026)
  //
  // docs/FONTES-TERRITORIO-E-MINERACAO.md — pesquisa completa, com todos os
  // endpoints chamados e as contagens medidas no dia. Corrige uma premissa
  // errada do plano anterior ("raio de ZAS ou 8 km" em volta da TI): ZAS e
  // raio de 8 km são dois institutos jurídicos DIFERENTES (seção 4 do
  // documento) — a ZAS é da barragem, desce o vale, e a FEAM publica a
  // geometria real; o raio de 8 km é da terra indígena, é círculo de
  // verdade, e serve para outra pergunta (licenciamento ambiental exigir
  // oitiva da FUNAI). Esta entrega publica a ZAS real. O raio de 8 km fica
  // registrado como próximo passo (fonte pronta:
  // `IDE:ide_2004_mg_raio_rest_terras_indigenas_pol`), fora do escopo de
  // hoje.
  //
  // Nenhuma destas seis fontes tem `regioes`: nenhuma delas traz
  // `codigo_ibge` nem `municipio` normalizado contra a malha do IBGE (a FEAM
  // e a FUNAI trazem nome de município cru, não conferido; o SIGMINE não
  // traz município nenhum), e cruzar isso é trabalho para outra entrega — não
  // afirmar região que o dado não sustenta agora.
  {
    id: 'zas-barragens', label: 'Zona de Autossalvamento (ZAS)',
    hint: 'O trecho do vale, rio abaixo de cada barragem, onde a lei manda o EMPREENDEDOR avisar a população — não dá tempo de a Defesa Civil chegar primeiro. 156 barragens de MG têm essa mancha publicada pela FEAM. NÃO é um raio: é a geometria real do Estudo de Ruptura Hipotética de Barragem (ERHB), medida caso a caso. Um círculo de 8 km erraria até 127× a área e, pior, erraria a DIREÇÃO — incluiria morro acima onde não há risco e excluiria vale abaixo de 8 km, onde a onda de fato chega.',
    aviso: 'A FEAM publica ZAS para 156 das 259 barragens que cadastra em MG — as outras 103 não têm mancha aqui: ausência de mancha não é ausência de risco, é ausência de dado publicado. O status do PAE (Plano de Ação de Emergência) de cada barragem aparece na ficha: "em análise" quer dizer que o próprio órgão ainda não bateu o martelo sobre aquela mancha.',
    // comprimida: arquivo cru pesava 12,08 MiB — acima do limiar de ~8 MiB
    // que justifica o custo do carregador saber descomprimir. Ver
    // scripts/comprimir-camadas-grandes.mjs (12,08 MiB -> 3,28 MiB, 3,7×).
    color: 0x00c8d6, /* --layer-zas */ on: false, render: 'fill', listavel: true, comprimida: true,
  },
  {
    id: 'mancha-inundacao-barragens', label: 'Mancha de inundação (barragens)',
    hint: 'O alcance máximo da onda numa ruptura hipotética da barragem — maior que a ZAS, porque a ZAS é só o trecho onde não dá tempo de a autoridade agir; a mancha é o alcance inteiro. Mesma fonte (FEAM/ERHB), 156 barragens de MG.',
    aviso: 'Cenário de RUPTURA HIPOTÉTICA — é o que o estudo de engenharia considera o pior caso plausível, não uma previsão de que a barragem vá romper.',
    // comprimida: arquivo cru pesava 14,36 MiB. Ver
    // scripts/comprimir-camadas-grandes.mjs (14,36 MiB -> 3,93 MiB, 3,7×).
    color: 0xcc94ef, /* --layer-mancha-inundacao */ on: false, render: 'fill', listavel: true, comprimida: true,
  },
  // --- O rompimento real da Barragem I (B1), Brumadinho (13/08/2026) ------
  //
  // docs/PLANO-INTEGRACAO-BRUMADINHO.md, seção 1.2 — pesquisa completa. As
  // duas camadas acima (`zas-barragens`, `mancha-inundacao-barragens`) são a
  // simulação HIPOTÉTICA (PAE/ERHB) de 156 barragens de MG, incluindo a B1:
  // "o que a água alcançaria SE uma barragem parecida rompesse". Estas 8
  // camadas são o PAR FACTUAL, só da B1: o que aconteceu de verdade em
  // 25/01/2019, quando ela rompeu — 270 mortes. Mesmo GeoServer que já serve
  // as duas de cima (`geoserver.meioambiente.mg.gov.br/IDE`, prefixo
  // `ide_250102_mg_*`), mesma licença "acesso livre" — conferida no
  // GeoNetwork da Semad camada a camada só para `impactos_ambientais_pol` e
  // `remanejamento_pto`; as outras 6 desta série NÃO tiveram o metadado
  // individual aberto — presumida a mesma licença por serem do mesmo
  // publicador/série, presunção registrada aqui, não confirmação camada a
  // camada. Ingestão: scripts/ingerir_semad_brumadinho_b1.py.
  //
  // Nenhuma das 8 leva `comprimida`: a maior (`estruturas-contencao`) pesa
  // 881 KB crua, a família inteira soma ~1,37 MiB — bem abaixo do limiar de
  // ~8 MiB que justifica o custo do carregador saber descomprimir.
  //
  // Cores: nenhuma reaproveita as 20 já em uso (ver css/tokens/colors.css) —
  // cada uma é o meio da maior lacuna que restava no círculo de matiz
  // (mesmo método oklch L .754 / C .139 do resto do arquivo), calculado nesta
  // entrega. `css/tokens/colors.css` NÃO foi editado (fora do escopo desta
  // tarefa — só config.js/layerspanel.js/icones.js): os comentários abaixo
  // trazem o hex já convertido, para quem um dia formalizar o token lá achar
  // o valor pronto, sem recalcular.
  {
    id: 'brumadinho-area-atingida', label: 'Brumadinho — área REALMENTE atingida (2019)',
    hint: 'Os 2 polígonos que a Semad mapeou por satélite (Pleiades, escala 1:2.500) sobre o que o rejeito de fato cobriu quando a Barragem I rompeu, 25/01/2019 — 270 mortes. NÃO é a mesma coisa que "Mancha de inundação (barragens)", acima: aquela é um cenário hipotético de engenharia para 156 barragens; esta é o registro do que aconteceu de verdade, só na B1.',
    aviso: 'Não confundir com a camada "Mancha de inundação (barragens)": esta aqui é FATO CONSUMADO, medido por satélite depois do rompimento — não é simulação, não é previsão, é o que já aconteceu.',
    color: 0xf88f68, /* hex calculado, hue 40,45° — ver comentário do bloco acima */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'brumadinho-monitoramento', label: 'Brumadinho — pontos de monitoramento ambiental',
    hint: '291 pontos onde a Semad monitora água, ar, ruído e geotecnia depois do rompimento. Maioria (140) é monitoramento de rejeito. O campo "categoria" na ficha diz o quê: Rejeitos, Água Superficial e Sedimentos, Água Subterrânea, Água Superficial, Ruído, Hidrossedimentométrico, Ar, Efluente, Poço Cava Feijão, Radar Geotécnico.',
    color: 0xacb947, /* hex calculado, hue 115,4° */ on: false, render: 'point', pointSize: 0.005, listavel: true,
  },
  {
    id: 'brumadinho-remanejamento', label: 'Brumadinho — origem de famílias remanejadas',
    hint: '104 pontos de ORIGEM (não o destino) de famílias remanejadas depois do rompimento, agrupados por bairro/comunidade — "Parque da Cachoeira" (57), "Córrego do Feijão" (34) e mais 6 origens. O esquema desta camada tem só duas colunas de texto (classe + descrição): sem nome, sem CPF, sem endereço — conferido campo a campo antes de publicar.',
    aviso: 'Cada ponto marca a ORIGEM agregada por bairro, não a casa de ninguém: a Semad não publica endereço nem nome de família. Ainda assim, evite aumentar a precisão deste ponto ou cruzá-lo com CAR/cadastro de imóvel por CPF — use como o dado de política de reparação que ele é, não como localizador de pessoa.',
    color: 0xea8ac9, /* hex calculado, hue 340,85° */ on: false, render: 'point', pointSize: 0.006, listavel: true,
  },
  {
    id: 'brumadinho-estruturas-contencao', label: 'Brumadinho — estruturas de contenção',
    hint: '37 estruturas emergenciais construídas para conter o rejeito depois do rompimento: diques, estacas-prancha, barreiras estabilizantes de calha.',
    color: 0xf787a7, /* hex calculado, hue 2,55° */ on: false, render: 'fill', listavel: true,
  },
  // As três camadas abaixo são o MESMO conceito ("Obras e Intervenções" —
  // pontes, ETA, disposição de rejeito, dragagem, bombeamento emergencial,
  // instrumentação) partido em três pela GEOMETRIA que cada obra tem na
  // origem (polígono/ponto/linha) — não por região nem por assunto distinto.
  // Mantidas como TRÊS fontes de UM painel cada (não uma linha só fundindo as
  // três): `_construir` (layers/manager.js) desenha cada FONTE com o render
  // dela própria, então fundir numa única entrada de CAMADAS misturaria
  // fill+point+line sob um `render` resolvido só da primeira — o padrão que
  // este arquivo já usa para fundir fontes (vazio-cadastral, quilombolas...)
  // é sempre entre fontes do MESMO render; não há precedente de mistura, e
  // esta entrega não abre um novo sem necessidade.
  {
    id: 'brumadinho-obras-poligonais', label: 'Brumadinho — obras e intervenções (área)',
    hint: '22 obras emergenciais com área própria: pontes, ETA, disposição de rejeito, dragagem.',
    color: 0x00c5e3, /* hex calculado, hue 213,1° */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'brumadinho-obras-pontuais', label: 'Brumadinho — obras e intervenções (ponto)',
    hint: '13 obras emergenciais pontuais: tratamento de sedimento, bombeamento emergencial, instrumentação.',
    color: 0x00cac6, /* hex calculado, hue 192,3° */ on: false, render: 'point', pointSize: 0.006, listavel: true,
  },
  {
    id: 'brumadinho-obras-lineares', label: 'Brumadinho — obras e intervenções (linha)',
    hint: '1 obra linear: dragagem emergencial.',
    color: 0xeb9b43, /* hex calculado, hue 65,45° */ on: false, render: 'line', listavel: true,
  },
  {
    id: 'brumadinho-restauracao', label: 'Brumadinho — áreas de restauração',
    hint: '35 áreas de revegetação/restauração, por platô/setor, nas áreas afetadas pelo rompimento.',
    color: 0x24cba6, /* hex calculado, hue 172,55° */ on: false, render: 'fill', listavel: true,
  },
  {
    // Novo em 15/08/2026 — CNUC/MMA pelo GeoServer da INDE, ver
    // scripts/ingerir_cnuc_unidades_conservacao.py.
    //
    // A COR: hue 235,4° em OKLCH, o mais livre do painel — 12,0° do vizinho
    // mais próximo, acima do piso de 11,6° que a paleta exige, e longe de
    // `--fiction` (326,6°), reservada a dado inventado. NÃO é verde, que
    // seria o óbvio para parque: os três verdes (129°, 146°, 163°) já estão
    // ocupados e qualquer vão entre eles cai abaixo do piso. Separação de
    // paleta ganha da associação temática — duas camadas que o olho confunde
    // são piores que uma camada de cor inesperada.
    id: 'unidades-conservacao', label: 'Unidades de conservação',
    hint: 'As 387 unidades de conservação com área em Minas, pelo CNUC/MMA: 198 estaduais, 111 federais, 78 municipais. Inclui as 200 RPPNs (reservas particulares), os 81 parques e as 46 APAs — a categoria de cada uma está na ficha.',
    aviso: 'Uma UC que cruza divisa entra INTEIRA, não recortada em Minas: a APA Serra da Mantiqueira aparece com as partes paulista e fluminense, porque recortar adulteraria o limite oficial da unidade. O campo "uf" da ficha diz quais estados ela cruza. — A geometria foi simplificada para caber num globo em WebGL (~11 m de tolerância; unidade menor que ~120 ha não foi tocada). Serve para VER onde a unidade fica, nunca para medir: a área oficial está em "area_ha", que vem da fonte e não é recalculada. Quem precisar cruzar UC com mineração ou barragem tem de baixar a malha completa.',
    color: 0x54b6ec, /* oklch(0.74 0.12 235.4) */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'terras-indigenas', label: 'Terras indígenas',
    hint: 'As 16 terras indígenas de Minas Gerais, pelo WFS oficial da FUNAI — TODAS as fases de demarcação, não só as já regularizadas. A fase de cada uma aparece na ficha.',
    aviso: 'O direito territorial indígena é ORIGINÁRIO (CF art. 231): a demarcação DECLARA um direito que já existe, não o cria. Uma TI "Em Estudo" ou "Delimitada" tem o mesmo peso jurídico de consulta (Convenção 169 da OIT) que uma "Regularizada" — por isso o mapa nunca filtra por fase sozinho. — Esta camada NÃO representa territórios de povos e comunidades tradicionais não indígenas e não quilombolas (geraizeiros, vazanteiros, apanhadoras de flores, pescadores artesanais, povos de terreiro): não existe base geográfica oficial aberta para eles em MG — nem no IDE-Sisema, nem em base federal sem login. Ausência no mapa não é ausência do povo: é lacuna de dado, registrada aqui de propósito para ninguém confundir uma coisa com a outra.',
    color: 0xf188b9, /* --layer-terras-indigenas */ on: false, render: 'fill', listavel: true,
  },
  // O alerta é CALCULADO, não uma fonte nova — interseção geométrica de
  // verdade (`shapely.intersects`/`intersection` sobre a malha COMPLETA, não
  // simplificada, e não bbox) entre as 16 TIs e as 156 manchas de inundação,
  // ver scripts/calcular_alerta_ti_mancha.py.
  //
  // RESULTADO MEDIDO em 13/08/2026, RODADO de verdade (não presumido): ZERO
  // interseções reais nas 2.496 combinações possíveis. O documento de
  // pesquisa tinha achado 6 barragens cruzando a CAIXA (bbox) da TI Aldeia
  // Katurama e avisava, com todas as letras, que bbox não é interseção de
  // polígono. Rodada a conta de verdade: era isso mesmo — bbox falso
  // positivo. Conferido por medição direta (não só pelo `intersects()`): a
  // mancha mais próxima de Katurama (Barragem de Ibirité, Sarzedo) fica a uns
  // 2,3 km; as 6 que bateram a caixa ficam entre ~450 m e ~650 m de distância
  // da borda da TI — perto, mas do lado de fora.
  //
  // Isto NÃO torna a camada dispensável — o oposto: "nenhuma terra indígena
  // de MG está hoje dentro de uma mancha de inundação publicada" é a resposta
  // à pergunta que a camada existe para fazer, e é uma resposta que só existe
  // porque a conta rodou. Fica com `vazia: true` pela mesma regra de
  // `devolutas-arrecadadas`: arquivo estruturalmente vazio HOJE, resultado
  // real, não erro de carga — o painel avisa isso antes do clique.
  {
    id: 'alerta-ti-mancha', label: 'Terra indígena atingida por mancha de barragem',
    hint: 'Interseção de geometria de verdade (não caixa aproximada) entre as 16 terras indígenas de MG e as 156 manchas de inundação de barragem da FEAM. Hoje o resultado é zero: nenhuma terra indígena publicada está dentro de uma mancha publicada. A mais próxima (Aldeia Katurama, perto de Brumadinho) fica a uns 450 m de distância de seis manchas diferentes — perto, mas fora.',
    aviso: '"Zero hoje" não é "seguro para sempre": a FEAM só publica mancha para 156 das 259 barragens de MG (ver a camada "Mancha de inundação"), e a distância mais próxima medida é de poucas centenas de metros — dentro da margem de um novo estudo de ruptura, ou de uma barragem sem mancha publicada, mudar essa conta. Se algum dia uma interseção real aparecer, esta camada é o lugar onde ela vai surgir.',
    color: 0xfb8a82, /* var(--danger) — risco calculado, não fonte de dado nova */ on: false, render: 'fill', listavel: true, vazia: true,
  },
  // A gêmea quilombola da camada acima — e a que MUDOU DE RESPOSTA.
  //
  // ⚠️ O handoff de 13/08 descrevia esta camada como "resultado zero" e
  // pedia `vazia: true`. Ao ligar o arquivo hoje (15/08), ele tem **6
  // interseções em 3 territórios**. O que mudou entre uma data e outra foi a
  // ingestão dos territórios quilombolas do INCRA que faltavam — e o alerta,
  // recalculado sobre a base maior, deixou de ser zero. Publicar o texto do
  // handoff teria posto na tela, com cara de medição, exatamente o contrário
  // do que o dado diz: que nenhum território quilombola está sob mancha de
  // inundação. Os números aqui foram RECONTADOS no arquivo, não copiados.
  {
    id: 'alerta-quilombola-mancha', label: 'Território quilombola atingido por mancha de barragem',
    hint: 'Interseção de geometria de verdade entre os territórios quilombolas ingeridos e as manchas de inundação de barragem da FEAM. São 6 sobreposições em 3 territórios: AMAROS e MACHADINHO, sob barragens da Kinross em Paracatu, e SÃO SEBASTIÃO, sob três barragens da Salitre Fertilizantes em Serra do Salitre. A maior atinge 934,9 hectares do território.',
    aviso: 'As áreas NÃO se somam: as três barragens de Serra do Salitre cobrem a mesma parte do território, então somá-las contaria o mesmo chão três vezes. Todas as cinco barragens estão com o plano de emergência "EM ANÁLISE" na FEAM. E a cobertura ainda é parcial — a FEAM publica mancha para 156 das 259 barragens de Minas, então território sem alerta aqui pode estar sob uma barragem que não publicou mancha.',
    color: 0xfb8a82, /* var(--danger) — mesma regra de alerta-ti-mancha */ on: false, render: 'fill', listavel: true,
  },
  // SIGMINE/ANM. DUAS camadas, nunca uma — ver a nota grande em
  // scripts/ingerir_sigmine.py. Só ~12,9% das 54.920 poligonais de MG
  // autorizam extrair; publicar tudo como "empreendimento minerário" diria
  // que uns 30% do estado é mina, o que é falso.
  {
    id: 'sigmine-operacao', label: 'Minas em operação',
    hint: 'Processos da ANM cuja fase autoriza extrair minério de verdade: Concessão de Lavra, Licenciamento, Lavra Garimpeira ou Registro de Extração. 7.090 poligonais em MG — só aqui a palavra "mina" é precisa.',
    color: 0x70c678, /* --layer-sigmine-operacao */ on: true, render: 'fill', listavel: true,
  },
  {
    id: 'sigmine-interesse', label: 'Interesse minerário (processo na ANM)',
    hint: '47.830 poligonais em MG — requerimento de pesquisa, de lavra, de licenciamento, área em disponibilidade. É um PAPEL PROTOCOLADO na ANM, não uma mina: mostra onde há interesse ou pressão futura, não onde já se extrai. Muitos nunca viram nada.',
    aviso: 'Nenhum destes polígonos representa extração em curso — para isso, ver a camada "Minas em operação". A fase de cada processo aparece na ficha.',
    // comprimida: é a MAIOR camada do globo cru — 32,37 MiB, sozinha acima do
    // teto de 25 MiB do Workers Static Assets (free E pago). Sem isto o
    // deploy falha neste arquivo. Ver scripts/comprimir-camadas-grandes.mjs
    // (32,37 MiB -> 6,06 MiB, 5,3×).
    //
    // pesada: única camada do registro com esta flag, e é por medição, não
    // por medo do número grande. 47.830 polígonos são 6,7× os 7.090 de
    // "Minas em operação" — a segunda maior camada de preenchimento do globo,
    // que já fica ligada por padrão desde a abertura sem travar nada. E o
    // custo não é só rede: `geojsonToFilled` (layers/geojson3d.js) cria um
    // `THREE.Shape`/`ShapeGeometry` POR POLÍGONO, triangulado na THREAD
    // PRINCIPAL, um de cada vez — não existe worker nem geometria instanciada
    // aqui. "Ligar tudo" (ui/layerspanel.js) pula qualquer camada `pesada`
    // de propósito: ligar as outras ~21 linhas soma umas 1.900 áreas de
    // preenchimento, a mesma ordem de grandeza do que já liga sozinho hoje;
    // somar esta aqui multiplicaria isso por si só, na hora em que o dono
    // testou o pedido — no celular. Continua alcançável, uma a uma, pela
    // chave dela.
    color: 0x62b5ff, /* --layer-sigmine-interesse */ on: false, render: 'fill', listavel: true, comprimida: true, pesada: true,
  },
  // --- O cruzamento das duas coisas acima (15/08/2026) --------------------
  //
  // Estes dois arquivos existiam em `dados/camadas/` desde 13/08 e NÃO tinham
  // entrada aqui: o handoff que os gerou deixou o `config.js` intocado de
  // propósito, porque outro worktree editava este arquivo ao vivo. Resultado:
  // o cruzamento mais consequente do mapa — mina autorizada em cima de terra
  // indígena — ficou calculado e invisível por dois dias. É a mesma classe de
  // erro que o projeto já nomeou noutro lugar: dado gravado sem consumidor é
  // dado que não existe.
  //
  // A geometria de cada feição é a INTERSEÇÃO RECORTADA, não o território nem
  // a poligonal da ANM inteiros — quem clica vê o pedaço sobreposto, com
  // `area_intersecao_ha`. Ver docs/HANDOFF-ALERTAS-TERRITORIO.md §5.
  // ⚠️ Os números abaixo foram RECONTADOS no arquivo em 15/08, e são maiores
  // que os do handoff de 13/08 (que dizia 12 e 195). A base de territórios
  // cresceu no meio do caminho. Ao reexportar qualquer um dos dois arquivos,
  // recontar aqui também — texto de tela e arquivo servido têm que se cobrir.
  {
    id: 'alerta-territorio-sigmine-operacao', label: 'Terra indígena/quilombola atingida por mina em operação',
    hint: '21 sobreposições entre território e lavra EM OPERAÇÃO, atingindo 4 terras indígenas (entre elas Krenak de Sete Salões, Xacriabá e Caxixé) e 6 territórios quilombolas. Interseção de geometria de verdade, malha completa — não caixa aproximada. Somadas, 1.539 hectares.',
    aviso: 'Isto é FATO CONSUMADO: extração já autorizada sobreposta ao território. Nunca some esta camada com "sob interesse minerário" — são categorias jurídicas diferentes, e somá-las inventaria um número que não existe.',
    color: 0xfb8a82, /* var(--danger) — mesma regra semântica de alerta-ti-mancha */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'alerta-territorio-sigmine-interesse', label: 'Terra indígena/quilombola sob interesse minerário',
    hint: '271 sobreposições entre território e processo de INTERESSE minerário (requerimento de pesquisa ou de lavra, área em disponibilidade), atingindo 14 terras indígenas e 18 territórios quilombolas — 51.609 hectares no total.',
    aviso: 'Não é extração em curso: é papel protocolado na ANM, pressão futura. Muitos processos nunca viram nada. Para extração já autorizada, ver "atingida por mina em operação" — e nunca some as duas.',
    color: 0xe2a138, /* var(--caution) — o mesmo âmbar de checagem-g0: atenção, ainda não é fato consumado */ on: false, render: 'fill', listavel: true,
  },
  // --- A faixa de 8 km, que enxerga o que a sobreposição não vê (15/08) -----
  //
  // As duas camadas acima só acusam quando o polígono da ANM ENTRA no
  // território. A Portaria Interministerial 60/2015 não trabalha assim: ela
  // fixa uma faixa em volta da terra indígena dentro da qual o empreendimento
  // exige manifestação do órgão indigenista. Perto, ali, já é assunto.
  //
  // A diferença medida é enorme, e é o argumento inteiro destas camadas: a
  // interseção pura vê 292 sobreposições; a faixa vê 2.164 processos, dos
  // quais **1.899 nunca encostam no território** — e por isso eram invisíveis.
  // A Aldeia Katurama, que dá ZERO em todo alerta de sobreposição (inclusive
  // no de mancha de barragem, logo acima), tem 20 minas em operação e 114
  // processos de interesse dentro dos 8 km dela.
  //
  // ⚠️ A faixa vem PRONTA do IDE-Sisema (`ide_2004_mg_raio_rest_*`), não é
  // buffer desenhado por nós — e cruza SÓ o SIGMINE, nunca barragem: para
  // barragem o piso legal é trecho de vale a jusante, e círculo superestima a
  // zona real de 14× a 127× (docs/FONTES-TERRITORIO-E-MINERACAO.md).
  //
  // Cor: não há mais lacuna de matiz livre no círculo (a maior é 17,3°, e o
  // meio dela ficaria a 8,6° de cada vizinha, abaixo do piso de 11,6° do
  // colors.css). Então cada uma usa a IRMÃ MAIS CLARA da cor do seu alerta de
  // interseção — mesmo precedente de `--layer-vazio-bacia` → `-curvelo`
  // ("mesmo método, outro recorte"). Conferido em OKLCH, não em HSL: 26,0°
  // contra 25,1° do --danger, e 75,8° contra 75,1° do --caution.
  {
    id: 'alerta-raio-territorio-sigmine-operacao', label: 'Mina em operação na faixa de 8 km do território',
    hint: '328 pares processo×faixa, de 289 processos distintos, com lavra EM OPERAÇÃO dentro da faixa de restrição de 12 terras indígenas e 18 territórios quilombolas. 269 deles não encostam no território — a sobreposição não os vê. O mais próximo é uma lavra de ouro da Kinross a 73 metros dos quilombos Machadinho e São Domingos, em Paracatu. Clique num território para ver os empreendimentos da faixa dele; clique num par para ver o processo.',
    aviso: 'Estar na faixa não é estar dentro do território: é a distância em que a Portaria Interministerial 60/2015 exige manifestação do órgão indigenista. A faixa vem publicada pelo IDE-Sisema, não é círculo desenhado por nós, e vale para mineração — não para barragem, cuja zona de risco é trecho de vale a jusante, não raio.',
    color: 0xffa79e, /* irmã mais clara de --danger (oklch 0.845 0.139 25) */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'alerta-raio-territorio-sigmine-interesse', label: 'Interesse minerário na faixa de 8 km do território',
    hint: '2.285 pares, de 1.875 processos, dentro da faixa de restrição — atingindo TODAS as 15 terras indígenas de Minas e 24 territórios quilombolas. 1.630 não encostam no território. 243 já são requerimento de lavra, e 169 são de lítio, espalhados por 12 territórios. Há processo a 3 metros da borda. Clique num território para ver os processos da faixa dele; clique num par para ver o requerimento.',
    aviso: 'Papel protocolado na ANM, não extração em curso — e estar na faixa não é estar dentro do território. Nunca somar com a camada de operação: são categorias jurídicas diferentes.',
    color: 0xffbe59, /* irmã mais clara de --caution (oklch 0.845 0.139 75) */ on: false, render: 'fill', listavel: true,
  },
  // Documentos do processo judicial de Brumadinho, por município citado.
  // Entra nesta seção porque o processo É sobre o rompimento de uma barragem.
  {
    id: 'documentos-processo-municipios', label: 'Documentos do processo que citam o município',
    hint: '53 municípios de Minas citados nos documentos do processo judicial de Brumadinho — 1.149 menções ao todo, de 10 dos 16 processos. Brumadinho lidera com 192, seguida de São Joaquim de Bicas (81), Mário Campos (65), Pará de Minas (58) e Paraopeba (57). Clicar leva à lista publicada.',
    aviso: 'Isto mostra onde o acervo CITA, não onde o dano foi. Só 471 dos 7.107 documentos (6,6%) têm município identificado, então município ausente do mapa não é município não atingido — e "citar" não é "ser sobre". As contagens não se somam entre municípios: um documento que cita cinco cidades aparece nas cinco.',
    color: 0xf8b651, /* irmã mais clara de --caution, distinta do âmbar do interesse minerário */ on: false, render: 'fill', listavel: true,
  },
  // --- Dinheiro público e mineração (13/08/2026) --------------------------
  //
  // docs/HANDOFF-CAMADA-DINHEIRO.md — entregue por outro agente, noutro
  // worktree, que deixou este arquivo e o painel intocados de propósito para
  // não colidir com quem editava território/mineração ao mesmo tempo (ver o
  // bloco de comentário logo acima). Este é o "ligar" — as duas fontes abaixo
  // são exatamente as que o handoff descreve, com os textos dele.
  //
  // Nenhuma das duas tem `regioes`: nenhuma bate contra REGIOES (bacia do
  // Paraopeba / Jequitinhonha / Mucuri) — CFEM cruza Jequitinhonha com o
  // Quadrilátero Ferrífero, que nem está na lista, e o cruzamento de dinheiro
  // mistura Jequitinhonha (Araçuaí/Diamantina/Itinga) com a Metropolitana
  // (Betim). Forçar região aqui seria afirmar um recorte que a fonte não tem.
  {
    id: 'cfem-municipios',
    label: 'CFEM — royalty da mineração por município',
    hint: '10 municípios de MG (Vale do Jequitinhonha + Quadrilátero Ferrífero) e quanto arrecadaram de CFEM em 2024 — de R$ 679 mil em Conselheiro Lafaiete a R$ 346,8 milhões em Congonhas.',
    aviso: 'CFEM arrecadada não é o que a prefeitura recebe: a Lei 13.540/2017 reparte entre União, estado, município produtor e afetados, e o relatório de distribuição por município da ANM está vazio (reconfirmado ao vivo em 13/08/2026). NÃO SOME entre municípios: a mesma guia de uma mineradora pode aparecer inteira em duas cidades ao mesmo tempo (medido: SIGMA MINERAÇÃO, R$ 6,29 milhões, em Itinga E em Araçuaí) — somar dobra o número. Cobertura: 10 de 854 municípios de MG, não é o estado inteiro.',
    color: 0xd3a931, /* --layer-cfem */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'cruzamento-dinheiro-ambiental-4cidades',
    label: 'Quem tem licença ambiental e recebe dinheiro público',
    hint: '4 empresas que têm licença ambiental em algum lugar de Minas e já receberam R$ 33 milhões em contratos (PNCP) ou convênios federais pagos por Araçuaí, Betim, Diamantina ou Itinga — 11 licenças ambientais ao todo, porque uma mesma empresa (ex. CEMIG) pode ter várias.',
    aviso: 'Cobre só 4 dos 854 municípios de MG (Araçuaí, Betim, Diamantina, Itinga) — os únicos onde contratos/convênios (presos à tabela `municipios`, 6 linhas) já coexistem com o licenciamento ambiental estadual (854 municípios). Ausência de ponto aqui NÃO quer dizer que a empresa não recebe dinheiro público — quer dizer que os outros 850 municípios ainda não têm contrato/convênio coletado para cruzar. O ponto marca ONDE fica a licença ambiental, não a sede de quem pagou. O cruzamento é por RAIZ de CNPJ (8 dígitos): identifica a empresa, mas não distingue matriz de filial.',
    color: 0x9da4ff, /* --layer-dinheiro-cruzamento */ on: false, render: 'point', pointSize: 0.007, listavel: true,
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
  // Sem `regioes`: as normas geocodificadas atravessam as regiões — o arquivo
  // tem município da bacia (Betim, Belo Horizonte) e do Jequitinhonha (Araçuaí,
  // Diamantina) juntos, porque a extração varreu as cidades do estudo sem
  // separar por região. Forçar um grupo só mentiria sobre a outra metade.
  //
  // ⟲ E o filtro de região NÃO a recorta, embora o dado até permitisse (contado
  // hoje: 248 das 743 normas estão em município do Jequitinhonha, 0 no Mucuri,
  // 495 fora dos Vales). O recorte desta camada é "as 6 cidades do estudo", que
  // não é uma região — filtrá-la por mesorregião responderia uma pergunta que
  // ninguém fez e esconderia Betim e BH de quem escolheu "Bacia do Paraopeba",
  // já que a fonte não diz a que bacia cada município pertence. Fonte sem
  // região declarada aparece em qualquer filtro, e a linha diz por quê.
  // (Curiosidade que o cruzamento revelou e não é desta entrega: 'São Paulo'
  // aparece como município nesta camada — geocodificação que escapou do
  // estado.)
  {
    id: 'normas-geolocalizadas', label: 'Leis e decretos com lugar citado',
    hint: '743 normas (de 1.151 com lugar extraído da ementa, de 10.317 no total) que o Nominatim conseguiu geocodificar pelo NOME do lugar — não por endereço exato. 189 em confiança "alta" (rua/avenida/praça citada por nome), 554 em "média" (só bairro/distrito).',
    aviso: 'O ponto marca o LUGAR CITADO, não o endereço exato da norma nem de nenhum imóvel — normas de bairro/distrito (confiança "média") caem no centro aproximado da área. Extraído só da ementa, nunca de PDF ou texto completo: testado e não ajuda (ver docs/normas-mapa-viabilidade.md). A maioria das normas não aparece aqui — não tem endereço reconhecível na ementa, o que é o caso comum, não uma falha da busca.',
    color: 0x6366f1,   /* --layer-normas: violeta-azulado, sem par no restante do registro */ on: false, render: 'point', pointSize: 0.005, listavel: true,
  },
  // Norma que MEXE em área protegida — parente de `normas-geolocalizadas`
  // (as duas saem de `atos_oficiais`), mas responde outra pergunta: aquela
  // mostra onde a norma cita um lugar; esta mostra onde a norma cria, amplia
  // ou redefine unidade de conservação. Ver docs/HANDOFF-ALERTAS-TERRITORIO.md §3.
  //
  // ⚠️ ERRO CORRIGIDO em 15/08 — a cor que entrou primeiro aqui estava errada,
  // e o handoff estava certo o tempo todo.
  //
  // Eu tinha rejeitado o matiz ~115° que ele propunha, alegando que cairia a
  // 10,2° do verde de "Minas em operação". Aquela medição foi feita em **HSL**,
  // convertendo os hexadecimais um a um. Mas `css/tokens/colors.css` declara
  // toda a paleta em **OKLCH**, e é nesse espaço que o piso de 11,6° de
  // separação daquele arquivo é definido — HSL e OKLCH não concordam sobre o
  // que é "mesmo matiz", e a conversão levou a conclusão para o lado oposto.
  //
  // Medido de novo, com os valores que o próprio colors.css declara:
  //   115,4° fica a 13,4° de --layer-lotes-vagos e 13,4° de --layer-quilombolas
  //          (acima do piso), e a 30,7° do verde das minas — não 10,2°.
  //   O 0xeb8dec que eu tinha escolhido mede oklch(0,774 0,164 326,65): a
  //          **3,4° de --fiction**, a cor reservada a dado INVENTADO. Uma
  //          camada de norma medida ia sair quase da cor do "isto é fictício".
  //
  // Fica `oklch(0.754 0.139 115.4)` = #acb947, o meio da segunda maior lacuna
  // real, na mesma família L/C do resto da paleta. A lição não é sobre esta
  // camada: é que medir cor no espaço errado inverte a resposta com toda a
  // aparência de rigor.
  {
    id: 'atos-area-protegida-municipios', label: 'Normas que criam ou alteram área protegida',
    // Um ponto por MUNICÍPIO, não por norma: são 3 pontos para 8 normas
    // (Belo Horizonte 4, Diamantina 3, Araçuaí 1). O contador do painel mostra
    // 3, e sem esta frase a diferença para o "8" do texto pareceria erro.
    hint: '8 normas municipais que criam, ampliam ou redefinem o zoneamento de área de proteção ambiental, parque ou monumento natural — reunidas em 3 pontos, um por município: Belo Horizonte (4), Diamantina (3) e Araçuaí (1, a Lei 726/2025, que modifica o zoneamento da APA da Chapada do Lagoão).',
    aviso: 'Cobre só 3 dos 854 municípios de Minas Gerais. Betim e Itinga têm zero normas deste tipo, medido — não é lacuna de coleta. Nos outros 846, ausência aqui quer dizer que a legislação ainda não foi coletada, não que não exista norma. A classificação de cada norma (cria/altera área × só administrativo) foi feita lendo a ementa inteira à mão.',
    color: 0xacb947, /* oklch(0.754 0.139 115.4) — ver a nota acima */ on: false, render: 'point', pointSize: 0.005, listavel: true,
  },
  // Camada dinâmica custom (Fase G3): satélites dos sensores do projeto em
  // órbita SGP4 real (TLE CelesTrak). Não vem do endpoint /camadas — a
  // factory fica em layers/satelites.js e é registrada no main.js.
  // Imagem de satélite que acompanha o zoom (15/08/2026). É o CHÃO das outras
  // camadas: tudo é desenhado sobre ela.
  //
  // Nasce ligada, e isso é decisão de conteúdo: a queixa que originou a camada
  // é que, no zoom fundo, o contorno da área ficava sobre um borrão do Blue
  // Marble esticado — 7,4 km por pixel. Ou seja, o defeito aparecia justamente
  // para quem já tinha chegado onde queria. Ligada por padrão, ninguém precisa
  // descobrir uma chave para o mapa fazer sentido. Nada é baixado enquanto a
  // câmera está longe: ver layers/imagens.js.
  {
    id: 'imagens-satelite', label: 'Imagem de satélite',
    hint: 'Foto do terreno, que vai ficando mais nítida conforme você aproxima. Em cor natural, do World Imagery da Esri.',
    aviso: 'A imagem mostra como o lugar estava quando foi fotografado, não hoje. Serve para ver a FORMA da área — mata, lavoura, estrada, represa —, não para dizer de quem ela é.',
    color: 0x7c8b9e,   /* cinza de instrumento: é fundo, não achado */
    on: true, render: 'custom',
    // Não se mede em feições: o contador dela diz a ESCALA na tela, e quem
    // escreve esse rótulo é a própria camada (ver main.js).
    semContagem: true,
  },
  {
    id: 'satelites-orbita', label: 'Satélites em órbita',
    hint: 'Onde estão agora os satélites que fotografam essas áreas. Posição calculada em tempo real.',
    color: 0xe8eef6,   /* --text-1: satélite é marca de UI, não camada de dado */ on: true, render: 'custom',
  },
];

// ---------------------------------------------------------------------------
// CAMADAS — o que o painel mostra: uma linha por CONCEITO.
//
// Cada entrada aponta para uma ou mais FONTES do LAYER_REGISTRY acima. 19
// fontes viram 14 linhas; as 5 que encolhem são exatamente os conceitos que
// existiam duas ou três vezes, um por região.
//
// ## Por que duas listas, e não uma só reescrita
//
// O LAYER_REGISTRY continua sendo a lista de FONTES, com os ids intactos,
// porque o id de fonte é um endereço PÚBLICO em três lugares que não podem
// quebrar:
//
//   1. o deep-link `#area=<fonte>:<índice>` (main.js), que é como se manda um
//      achado para alguém;
//   2. o link da vista 2D, `detalhe.html?camada=<fonte>&fid=<índice>`
//      (ui/inspector.js);
//   3. o nome do arquivo servido, `dados/camadas/<fonte>.geojson`
//      (data/api.js), que o pipeline escreve.
//
// Mais: `ui/exportar.js`, `ui/inspector.js` e `ui/proveniencia.js` já resolvem
// tudo por id de fonte, e `exportar.test.mjs` afirma coisas sobre ids de fonte
// específicos. Reescrever o registry para conceitos obrigaria a mexer nos
// quatro e a inventar uma tabela de-para para os links já publicados.
//
// ⚠️ COMO OS DEEP-LINKS ANTIGOS FORAM PRESERVADOS: eles não foram mapeados,
// foram MANTIDOS. O endereço sempre apontou para uma fonte, o índice sempre foi
// a posição dentro daquele ARQUIVO, e as duas coisas continuam valendo — nem um
// id mudou, nem um arquivo foi refeito, nem um índice se deslocou.
// `#area=assentamentos-vales:12` abre hoje a mesma área que abria ontem. O
// conceito é uma camada de APRESENTAÇÃO por cima disso, e o filtro de região
// nunca renumera nada: ele decide o que é DESENHADO, e o GeoJSON completo
// continua em `layers.geojson` com os índices do arquivo (ver layers/manager.js).
//
// ## Por que não fundir os arquivos
//
// A opção óbvia era gerar um arquivo por conceito, com a região virando
// propriedade de cada área. Foi medida e recusada. Cronometrado num navegador
// real (servidor estático local, cache frio, rede + JSON.parse + construção da
// geometria Three.js):
//
//     vazio-cadastral-bacia      652 KB    35 áreas     84 ms
//     vazio-cadastral          1.511 KB   390 áreas    228 ms
//     vazio-cadastral-vales    4.636 KB   325 áreas    398 ms   ← a maior
//                                                      -------
//     as três fundidas num arquivo só    6,8 MB        710 ms
//
// Fundir faria a camada que hoje abre o mapa em 84 ms passar a custar 710 ms e
// 6,8 MB — e num celular em rede móvel, onde os 76 ms de "rede" acima
// (localhost) viram segundos. Mantendo as fontes separadas e carregando SÓ as
// que o filtro de região pede, o custo fica proporcional ao que se está
// olhando: quem fica na bacia nunca baixa os 4,6 MB do Jequitinhonha.
//
// ⚠️ Isso NÃO torna a camada unificada barata — ela é honestamente cara. Ligar
// "Terra sem cadastro" com o filtro em "todas as regiões" baixa as duas fontes
// dela, 5,3 MB. É o preço de ter uma chave só, e é o preço certo: era isso que
// a pessoa fazia à mão antes, ligando dois interruptores. O que o filtro de
// região dá é a saída para quem não quer pagar — e trocar de região depois não
// custa rede nenhuma, só o redesenho (ver `setFiltro` em layers/manager.js).
//
// Cada entrada: { id, assunto, label, hint, fontes[], aviso? }
// - id      = identificador da LINHA (atributo `data-camada-id` no painel).
//             Não é endereço público: quem endereça área é a fonte.
// - assunto = id de ASSUNTOS. Define em que seção a linha cai.
// - label/hint = o texto do painel. O `hint` agora fica SOB DEMANDA (o painel
//             mostra a linha compacta e revela a explicação num botão), então
//             pode ser mais completo que o de antes, quando era parede de
//             texto sempre visível.
// - fontes  = ids do LAYER_REGISTRY, na ordem de desenho.
// ---------------------------------------------------------------------------
export const CAMADAS = [
  {
    id: 'vazio-cadastral', assunto: 'sem-cadastro',
    label: 'Terra sem cadastro',
    // 35 + 325, contados nos arquivos hoje.
    hint: 'As 360 maiores áreas que nenhum imóvel declarou no CAR, o Cadastro Ambiental Rural, de 500 hectares (5 km²) para cima. Na bacia do Paraopeba quase todas são redes de corredores estreitos, não manchas. É o que o método chama de vazio cadastral.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    fontes: ['vazio-cadastral-bacia', 'vazio-cadastral-vales'],
  },
  // ⚠️ POR QUE CURVELO CONTINUA SENDO UMA LINHA À PARTE, e não é regressão ao
  // problema que esta entrega conserta.
  //
  // As outras irmãs eram o MESMO cálculo em regiões diferentes — juntar é só
  // ganho. Esta não é: é o mesmo cálculo em outro LIMIAR. A camada acima começa
  // em 500 ha; esta começa em 10 ha, num município só. Duas escalas de detalhe,
  // não duas regiões.
  //
  // E elas se SOBREPÕEM, o que decide a questão. Medido hoje: das 35 áreas da
  // bacia, 12 estão em Curvelo; das 390 de Curvelo, exatamente 12 têm 500 ha ou
  // mais, e 9 dessas 12 têm geometria idêntica (mesmo primeiro vértice) à da
  // camada da bacia. Fundir as duas numa chave só desenharia esse punhado de
  // áreas DUAS VEZES, sobrepostas — o preenchimento dobraria de opacidade
  // justamente nas maiores áreas do piloto, e a lista mostraria cada uma duas
  // vezes. A saída "some com as repetidas ao juntar" está fora de questão: é
  // truncamento silencioso, e o índice de cada área é endereço público.
  {
    id: 'vazio-cadastral-curvelo', assunto: 'sem-cadastro',
    label: 'Terra sem cadastro — as áreas pequenas de Curvelo',
    // ⚠️ 378, não 390, e a diferença é o conserto de uma DUPLICAÇÃO real
    // (15/08/2026, scripts/deduplicar_vazio_curvelo.py). Curvelo é um dos 14
    // municípios da camada acima, então as 12 áreas de 500 ha ou mais estavam
    // NOS DOIS arquivos — mesmo polígono, mesma cor, desenhado duas vezes com
    // as duas camadas ligadas, e o contador somava 425 onde existem 413 áreas
    // distintas. Agora esta camada é o COMPLEMENTO da de cima, não um
    // superconjunto dela: as duas se somam sem repetir nada.
    hint: 'O mesmo cálculo em um município só, descendo às manchas pequenas que o corte de 500 hectares não alcança: 378 áreas entre 10 e 500 hectares — a menor tem uns 14 campos de futebol. É o recorte piloto, onde o método foi afinado. As áreas grandes de Curvelo estão na camada acima, e não se repetem aqui.',
    aviso: 'Sem cadastro não quer dizer sem dono. Pode ser terra pública, pode ser imóvel particular que nunca se cadastrou. É um lugar para conferir, não uma conclusão.',
    fontes: ['vazio-cadastral'],
  },
  {
    id: 'terra-publica-certificada', assunto: 'terra-publica',
    label: 'Terra pública com medição oficial',
    // 19 + 65 áreas; 12.240 + 51.082 ha.
    hint: '84 áreas, 63.322 hectares (633 km²) que o INCRA certificou como públicas. É a única terra que uma base aberta afirma ser do poder público.',
    aviso: 'Certificada como pública não quer dizer sem destino: na bacia do Paraopeba 99% desta área já é assentamento, no Jequitinhonha e no Mucuri são 56% — e é essa diferença que faz a segunda região valer o exame.',
    fontes: ['terra-publica-certificada', 'terra-publica-certificada-vales'],
  },
  {
    id: 'assentamentos', assunto: 'terra-publica',
    label: 'Assentamentos da reforma agrária',
    // 21 + 54 áreas; 13.438 + 48.412 ha.
    hint: '75 áreas, 61.850 hectares (619 km²). Terra pública que já tem destino — por isso sai do cálculo de terra sem cadastro.',
    fontes: ['assentamentos', 'assentamentos-vales'],
  },
  {
    id: 'territorios-quilombolas', assunto: 'terra-publica',
    label: 'Territórios quilombolas',
    // 2 + 12 + 13 áreas; 22 + 35.908,1 + 105.515,6 ha (INCRA, 13/08/2026 —
    // ver scripts/ingerir_incra_quilombolas.py). A terceira fonte
    // (`-outras-regioes`) entrou mais tarde no mesmo dia: os 13 territórios
    // do INCRA em MG que não caem nem na bacia do Paraopeba nem no
    // Jequitinhonha/Mucuri — a linha do painel continua sendo UMA só,
    // "Territórios quilombolas": a unificação que importa (uma chave, não
    // duas ou três) já tinha acontecido na reorganização por ASSUNTO de mais
    // cedo em 13/08; o que mudou agora foi só a COBERTURA de dado por trás
    // dela, nunca o contrato de id/índice das duas fontes antigas.
    hint: '27 áreas, 141.446 hectares (1.414 km²) de território tradicional titulado ou em titulação pelo INCRA. A maior parte está fora da bacia do Paraopeba e do Jequitinhonha/Mucuri — em municípios do Norte e Noroeste de Minas (105.516 ha) — com 35.908 ha no Jequitinhonha/Mucuri e só 22 hectares na bacia do Paraopeba, uns 31 campos de futebol.',
    fontes: ['territorios-quilombolas'],
  },
  {
    id: 'spu-imoveis-uniao', assunto: 'terra-publica',
    label: 'Imóveis do governo federal',
    // 553 + 154 imóveis; 79 + 24 sem destinação.
    hint: '707 imóveis da União no cadastro da SPU — de escola e prédio público a fazenda e terreno vago. 103 deles estão registrados como "sem destinação definida" em todas as suas utilizações.',
    aviso: 'Cada ponto marca ONDE fica o imóvel, não o contorno dele: a SPU não publica o perímetro. O tamanho vem do cadastro, não do desenho. Endereço não é exibido. Um imóvel pode ter mais de uma utilização, com regimes diferentes: quando tem, todas aparecem no campo "regime".',
    fontes: ['spu-imoveis-uniao', 'spu-imoveis-uniao-vales'],
  },
  {
    id: 'devolutas-arrecadadas', assunto: 'terra-publica',
    label: 'Terras devolutas já reconhecidas',
    hint: 'Terra que o Estado já declarou devoluta. O INCRA não publica essa base — por isso a camada está vazia. A lacuna é o achado: não há como conferir de fora quanta terra devoluta já foi reconhecida em Minas.',
    fontes: ['devolutas-arrecadadas'],
  },
  // --- Território indígena, mineração e segurança de barragens -----------
  // Catorze linhas (seis do lote de 13/08 + as 8 do rompimento real da B1,
  // 13/08 mais tarde) — TODAS numa fonte só, sem irmã a fundir, incluindo as
  // três "obras e intervenções" (mesmo conceito, geometria diferente:
  // mantidas em linhas SEPARADAS de propósito, ver o comentário delas em
  // LAYER_REGISTRY sobre por que fundir misturaria render fill+point+line
  // sob um valor resolvido só da primeira fonte). Ver o bloco de comentário
  // grande em LAYER_REGISTRY, acima, para o porquê de cada camada e as
  // ressalvas jurídicas.
  {
    id: 'zas-barragens', assunto: 'territorio-mineracao',
    label: 'Zona de Autossalvamento (ZAS)',
    hint: 'O trecho do vale, rio abaixo de cada barragem, onde a lei manda o EMPREENDEDOR avisar a população — não dá tempo de a Defesa Civil chegar primeiro. 156 barragens de MG têm essa mancha publicada pela FEAM. NÃO é um raio: é a geometria real do Estudo de Ruptura Hipotética de Barragem (ERHB). Um círculo de 8 km erraria até 127× a área e, pior, erraria a direção.',
    aviso: 'A FEAM publica ZAS para 156 das 259 barragens que cadastra em MG — as outras 103 não têm mancha aqui: ausência de mancha não é ausência de risco, é ausência de dado publicado.',
    fontes: ['zas-barragens'],
  },
  {
    id: 'mancha-inundacao-barragens', assunto: 'territorio-mineracao',
    label: 'Mancha de inundação (barragens)',
    hint: 'O alcance máximo da onda numa ruptura hipotética da barragem — maior que a ZAS, que é só o trecho onde não dá tempo de a autoridade agir. Mesma fonte (FEAM/ERHB), 156 barragens de MG.',
    aviso: 'Cenário de RUPTURA HIPOTÉTICA — o pior caso plausível que o estudo de engenharia considera, não uma previsão de que a barragem vá romper.',
    fontes: ['mancha-inundacao-barragens'],
  },
  // O rompimento real da B1, Brumadinho — par factual das duas linhas acima.
  // Ver o comentário grande em LAYER_REGISTRY para a proveniência e para a
  // distinção que importa mais: `brumadinho-area-atingida` é FATO CONSUMADO
  // (satélite, depois do rompimento), nunca confundir com a simulação
  // hipotética das duas linhas de cima.
  {
    id: 'brumadinho-area-atingida', assunto: 'brumadinho',
    label: 'Brumadinho — área REALMENTE atingida (2019)',
    hint: 'Os 2 polígonos que a Semad mapeou por satélite (Pleiades, escala 1:2.500) sobre o que o rejeito de fato cobriu quando a Barragem I rompeu, 25/01/2019 — 270 mortes. NÃO é a mesma coisa que "Mancha de inundação (barragens)": aquela é um cenário hipotético de engenharia para 156 barragens; esta é o registro do que aconteceu de verdade, só na B1.',
    aviso: 'Não confundir com a camada "Mancha de inundação (barragens)": esta aqui é FATO CONSUMADO, medido por satélite depois do rompimento — não é simulação, não é previsão, é o que já aconteceu.',
    fontes: ['brumadinho-area-atingida'],
  },
  {
    id: 'brumadinho-monitoramento', assunto: 'brumadinho',
    label: 'Brumadinho — pontos de monitoramento ambiental',
    hint: '291 pontos onde a Semad monitora água, ar, ruído e geotecnia depois do rompimento. Maioria (140) é monitoramento de rejeito. O campo "categoria" na ficha diz o quê: Rejeitos, Água Superficial e Sedimentos, Água Subterrânea, Água Superficial, Ruído, Hidrossedimentométrico, Ar, Efluente, Poço Cava Feijão, Radar Geotécnico.',
    fontes: ['brumadinho-monitoramento'],
  },
  {
    id: 'brumadinho-remanejamento', assunto: 'brumadinho',
    label: 'Brumadinho — origem de famílias remanejadas',
    hint: '104 pontos de ORIGEM (não o destino) de famílias remanejadas depois do rompimento, agrupados por bairro/comunidade — "Parque da Cachoeira" (57), "Córrego do Feijão" (34) e mais 6 origens. O esquema desta camada tem só duas colunas de texto (classe + descrição): sem nome, sem CPF, sem endereço — conferido campo a campo antes de publicar.',
    aviso: 'Cada ponto marca a ORIGEM agregada por bairro, não a casa de ninguém: a Semad não publica endereço nem nome de família. Ainda assim, evite ler isto como localizador de pessoa — é dado de política de reparação, não cadastro de residência.',
    fontes: ['brumadinho-remanejamento'],
  },
  {
    id: 'brumadinho-estruturas-contencao', assunto: 'brumadinho',
    label: 'Brumadinho — estruturas de contenção',
    hint: '37 estruturas emergenciais construídas para conter o rejeito depois do rompimento: diques, estacas-prancha, barreiras estabilizantes de calha.',
    fontes: ['brumadinho-estruturas-contencao'],
  },
  {
    id: 'brumadinho-obras-poligonais', assunto: 'brumadinho',
    label: 'Brumadinho — obras e intervenções (área)',
    hint: '22 obras emergenciais com área própria: pontes, ETA, disposição de rejeito, dragagem. Mesmo conceito de "obras e intervenções" que as duas linhas seguintes — partido em três linhas porque cada uma tem geometria diferente na origem (área/ponto/linha), não porque sejam assuntos distintos.',
    fontes: ['brumadinho-obras-poligonais'],
  },
  {
    id: 'brumadinho-obras-pontuais', assunto: 'brumadinho',
    label: 'Brumadinho — obras e intervenções (ponto)',
    hint: '13 obras emergenciais pontuais: tratamento de sedimento, bombeamento emergencial, instrumentação.',
    fontes: ['brumadinho-obras-pontuais'],
  },
  {
    id: 'brumadinho-obras-lineares', assunto: 'brumadinho',
    label: 'Brumadinho — obras e intervenções (linha)',
    hint: '1 obra linear: dragagem emergencial.',
    fontes: ['brumadinho-obras-lineares'],
  },
  {
    id: 'brumadinho-restauracao', assunto: 'brumadinho',
    label: 'Brumadinho — áreas de restauração',
    hint: '35 áreas de revegetação/restauração, por platô/setor, nas áreas afetadas pelo rompimento.',
    fontes: ['brumadinho-restauracao'],
  },
  {
    // Fica em 'territorio-mineracao' e não numa seção própria: a pergunta que
    // ela responde no painel é a mesma das vizinhas — onde há área protegida
    // sob pressão de mineração e barragem. Uma seção "áreas protegidas" com
    // uma camada só seria mais um nível de menu para o leitor abrir.
    id: 'unidades-conservacao', assunto: 'territorio-mineracao',
    label: 'Unidades de conservação',
    hint: 'As 387 unidades de conservação com área em Minas, pelo CNUC/MMA: 198 estaduais, 111 federais, 78 municipais. Inclui as 200 RPPNs, os 81 parques e as 46 APAs — a categoria de cada uma está na ficha.',
    aviso: 'Uma UC que cruza divisa entra INTEIRA, não recortada em Minas: a APA Serra da Mantiqueira aparece com as partes paulista e fluminense, porque recortar adulteraria o limite oficial. — Geometria simplificada para caber num globo em WebGL: serve para VER onde a unidade fica, nunca para medir. A área oficial está no campo "area_ha" da ficha.',
    fontes: ['unidades-conservacao'],
  },
  {
    id: 'terras-indigenas', assunto: 'territorio-mineracao',
    label: 'Terras indígenas',
    hint: 'As 16 terras indígenas de Minas Gerais, pelo WFS oficial da FUNAI — TODAS as fases de demarcação, não só as já regularizadas. A fase de cada uma aparece na ficha.',
    aviso: 'O direito territorial indígena é ORIGINÁRIO (CF art. 231): a demarcação DECLARA um direito que já existe, não o cria. Uma TI "Em Estudo" ou "Delimitada" tem o mesmo peso de consulta (Convenção 169 da OIT) que uma "Regularizada". — Esta camada NÃO representa territórios de povos e comunidades tradicionais não indígenas e não quilombolas (geraizeiros, vazanteiros, apanhadoras de flores, pescadores artesanais, povos de terreiro): não existe base geográfica oficial aberta para eles em MG. Ausência no mapa é lacuna de dado, não ausência do povo.',
    fontes: ['terras-indigenas'],
  },
  {
    id: 'alerta-ti-mancha', assunto: 'territorio-mineracao',
    label: 'Terra indígena atingida por mancha de barragem',
    hint: 'Interseção de geometria de verdade (não caixa aproximada) entre as 16 terras indígenas de MG e as 156 manchas de inundação de barragem da FEAM. Hoje o resultado é zero: nenhuma terra indígena publicada está dentro de uma mancha publicada. A mais próxima (Aldeia Katurama, perto de Brumadinho) fica a uns 450 m de distância de seis manchas diferentes — perto, mas fora.',
    aviso: '"Zero hoje" não é "seguro para sempre": a FEAM só publica mancha para 156 das 259 barragens de MG, e a distância mais próxima medida é de poucas centenas de metros. Se algum dia uma interseção real aparecer, esta camada é o lugar onde ela vai surgir.',
    fontes: ['alerta-ti-mancha'],
  },
  {
    id: 'sigmine-operacao', assunto: 'territorio-mineracao',
    label: 'Minas em operação',
    hint: 'Processos da ANM cuja fase autoriza extrair minério de verdade: Concessão de Lavra, Licenciamento, Lavra Garimpeira ou Registro de Extração. 7.090 poligonais em MG — só aqui a palavra "mina" é precisa.',
    fontes: ['sigmine-operacao'],
  },
  {
    id: 'sigmine-interesse', assunto: 'territorio-mineracao',
    label: 'Interesse minerário (processo na ANM)',
    hint: '47.830 poligonais em MG — requerimento de pesquisa, de lavra, de licenciamento, área em disponibilidade. É um PAPEL PROTOCOLADO na ANM, não uma mina: mostra onde há interesse ou pressão futura, não onde já se extrai.',
    aviso: 'Nenhum destes polígonos representa extração em curso — para isso, ver a camada "Minas em operação". A fase de cada processo aparece na ficha.',
    fontes: ['sigmine-interesse'],
  },
  // --- Os cruzamentos, ligados em 15/08/2026 -------------------------------
  // Ordem deliberada: o que JÁ ACONTECE vem antes do que PODE acontecer, e o
  // zero medido vem por último. Quem abre a seção lê primeiro as 12 minas em
  // operação sobre território, não as 195 de papel protocolado.
  {
    id: 'alerta-territorio-sigmine-operacao', assunto: 'territorio-mineracao',
    label: 'Terra indígena/quilombola atingida por mina em operação',
    hint: '21 sobreposições — 4 terras indígenas e 6 territórios quilombolas com lavra JÁ EM OPERAÇÃO por cima, somando 1.539 hectares.',
    aviso: 'Fato consumado. Nunca somar com "sob interesse minerário": é outra categoria jurídica.',
    fontes: ['alerta-territorio-sigmine-operacao'],
  },
  {
    id: 'alerta-territorio-sigmine-interesse', assunto: 'territorio-mineracao',
    label: 'Terra indígena/quilombola sob interesse minerário',
    hint: '271 sobreposições — 14 terras indígenas e 18 territórios quilombolas com algum processo de interesse por cima, somando 51.609 hectares. Não é mina: é requerimento.',
    aviso: 'Papel protocolado na ANM, não extração em curso. Para extração de verdade, ver "atingida por mina em operação".',
    fontes: ['alerta-territorio-sigmine-interesse'],
  },
  {
    id: 'alerta-quilombola-mancha', assunto: 'territorio-mineracao',
    label: 'Território quilombola atingido por mancha de barragem',
    hint: '6 sobreposições em 3 territórios: AMAROS e MACHADINHO sob barragens da Kinross em Paracatu, e SÃO SEBASTIÃO sob três barragens da Salitre Fertilizantes em Serra do Salitre. A maior atinge 934,9 hectares.',
    aviso: 'As áreas não se somam — as três barragens de Serra do Salitre cobrem a mesma parte do território. Todas as cinco barragens estão com plano de emergência "em análise" na FEAM.',
    fontes: ['alerta-quilombola-mancha'],
  },
  // A faixa de 8 km. Vem DEPOIS das três de sobreposição de propósito: quem
  // lê a seção encontra primeiro o que já está dentro do território, e só
  // então o que está perto. Ver a nota grande no LAYER_REGISTRY.
  {
    id: 'alerta-raio-territorio-sigmine-operacao', assunto: 'territorio-mineracao',
    label: 'Mina em operação na faixa de 8 km do território',
    hint: '328 pares, de 289 processos com lavra em operação dentro da faixa de restrição de 12 terras indígenas e 18 territórios quilombolas — 269 deles sem encostar no território, invisíveis para o alerta de sobreposição. O mais próximo, ouro da Kinross a 73 m de Machadinho e São Domingos.',
    aviso: 'Estar na faixa não é estar dentro: é a distância em que a Portaria 60/2015 exige manifestação do órgão indigenista. Vale para mineração, não para barragem.',
    fontes: ['alerta-raio-territorio-sigmine-operacao'],
  },
  {
    id: 'alerta-raio-territorio-sigmine-interesse', assunto: 'territorio-mineracao',
    label: 'Interesse minerário na faixa de 8 km do território',
    hint: '2.285 pares, de 1.875 processos, atingindo TODAS as 15 terras indígenas de Minas e 24 territórios quilombolas. 1.630 não encostam no território. 243 já são requerimento de lavra; 169 são de lítio, em 12 territórios.',
    aviso: 'Papel protocolado na ANM, não extração. Nunca somar com a camada de operação.',
    fontes: ['alerta-raio-territorio-sigmine-interesse'],
  },
  {
    id: 'documentos-processo-municipios', assunto: 'brumadinho',
    label: 'Documentos do processo que citam o município',
    hint: '53 municípios citados nos documentos do processo judicial de Brumadinho, 1.149 menções. Brumadinho 192, São Joaquim de Bicas 81, Mário Campos 65.',
    aviso: 'Mostra onde o acervo CITA, não onde o dano foi: só 6,6% dos documentos têm município identificado, e as contagens não se somam entre municípios.',
    fontes: ['documentos-processo-municipios'],
  },
  // Fica em `territorio-mineracao`, e NÃO num assunto `legislacao-ambiental`
  // novo como o handoff sugeria. Duas razões: uma seção de um item só é ruído
  // no painel que este projeto está justamente tentando enxugar, e a camada
  // dialoga diretamente com as de cima — é onde a lei protege contra a pressão
  // que as outras mostram. A irmã dela (`normas-geolocalizadas`) também não
  // tem seção própria: está em `cidade`.
  // 👉 Quando a legislação FEDERAL entrar (docs/FONTES-CNJ-JUMA.md: 8,5 a 10,4
  // mil normas do MMA/CONAMA), aí sim há massa para um assunto próprio — e
  // esta entrada é a primeira que deve migrar para ele.
  {
    id: 'atos-area-protegida-municipios', assunto: 'territorio-mineracao',
    label: 'Normas que criam ou alteram área protegida',
    hint: '8 normas que criam, ampliam ou redefinem área de proteção ambiental, parque ou monumento natural, em 3 pontos — um por município: Belo Horizonte (4), Diamantina (3) e Araçuaí (1).',
    aviso: 'Cobre só municípios com legislação já coletada — 6 de 854. Betim e Itinga foram medidos e têm zero normas deste tipo; nos outros 848, ausência aqui quer dizer coleta que ainda não aconteceu.',
    fontes: ['atos-area-protegida-municipios'],
  },
  // --- Dinheiro público e mineração (13/08/2026, docs/HANDOFF-CAMADA-DINHEIRO.md)
  {
    id: 'cfem-municipios', assunto: 'dinheiro',
    label: 'CFEM — royalty da mineração por município',
    hint: '10 municípios de MG (Vale do Jequitinhonha + Quadrilátero Ferrífero) e quanto arrecadaram de CFEM em 2024 — de R$ 679 mil em Conselheiro Lafaiete a R$ 346,8 milhões em Congonhas.',
    aviso: 'CFEM arrecadada não é o que a prefeitura recebe: a Lei 13.540/2017 reparte entre União, estado, município produtor e afetados. NÃO SOME entre municípios: a mesma guia de uma mineradora pode aparecer inteira em duas cidades ao mesmo tempo (medido: SIGMA MINERAÇÃO, R$ 6,29 milhões, em Itinga E em Araçuaí). Cobertura: 10 de 854 municípios de MG.',
    fontes: ['cfem-municipios'],
  },
  {
    id: 'cruzamento-dinheiro-ambiental-4cidades', assunto: 'dinheiro',
    label: 'Quem tem licença ambiental e recebe dinheiro público',
    hint: '4 empresas que têm licença ambiental em algum lugar de Minas e já receberam R$ 33 milhões em contratos (PNCP) ou convênios federais pagos por Araçuaí, Betim, Diamantina ou Itinga — 11 licenças ambientais ao todo, porque uma mesma empresa (ex. CEMIG) pode ter várias.',
    aviso: 'Cobre só 4 dos 854 municípios de MG — os únicos onde contratos/convênios coletados já coexistem com o licenciamento ambiental estadual. Ausência de ponto aqui NÃO quer dizer que a empresa não recebe dinheiro público, quer dizer que os outros 850 municípios ainda não têm contrato/convênio coletado para cruzar. O cruzamento é por RAIZ de CNPJ (8 dígitos): identifica a empresa, mas não distingue matriz de filial.',
    fontes: ['cruzamento-dinheiro-ambiental-4cidades'],
  },
  {
    id: 'lotes-vagos-bh', assunto: 'cidade',
    label: 'Lotes vagos em Belo Horizonte',
    hint: '8.525 terrenos que a prefeitura registra como vagos no cadastro do IPTU, de 500 m² para cima. O número ao lado diz de quantos serviços urbanos a rua já dispõe — quanto mais alto, mais a cidade já investiu ali. Vazio urbano é assunto diferente do vazio cadastral rural, e tem instrumento jurídico próprio: CF art. 182, §4º e Estatuto da Cidade arts. 5º a 8º, competência do município.',
    aviso: 'Vago no cadastro não quer dizer irregular. O terreno pode estar em obra, em inventário ou à espera de licença. É lugar para conferir, e quem decide é a Prefeitura.',
    fontes: ['lotes-vagos-bh'],
  },
  {
    id: 'normas-geolocalizadas', assunto: 'cidade',
    label: 'Leis e decretos com lugar citado',
    hint: '743 normas (de 1.151 com lugar extraído da ementa, de 10.317 no total) que o Nominatim conseguiu geocodificar pelo NOME do lugar — não por endereço exato. 189 em confiança "alta" (rua/avenida/praça citada por nome), 554 em "média" (só bairro/distrito).',
    aviso: 'O ponto marca o LUGAR CITADO, não o endereço exato da norma nem de nenhum imóvel — normas de bairro/distrito (confiança "média") caem no centro aproximado da área. Extraído só da ementa, nunca de PDF ou texto completo: testado e não ajuda. A maioria das normas não aparece aqui — não tem endereço reconhecível na ementa, o que é o caso comum, não uma falha da busca.',
    fontes: ['normas-geolocalizadas'],
  },
  {
    id: 'embargos-ambientais', assunto: 'pistas',
    label: 'Áreas embargadas por infração ambiental',
    hint: '797 áreas embargadas pela fiscalização ambiental de Minas no Jequitinhonha e no Mucuri, somando 4.105 hectares (41 km²). Supressão de vegetação responde por 642 delas. É a única camada do projeto em que o indício não é inferência sobre imagem: cada polígono é um auto de infração que o Estado lavrou.',
    aviso: 'Embargo não é decisão final — cabe defesa e recurso. E recai sobre a área da infração, não sobre o imóvel inteiro. Ausência de embargo aqui não quer dizer regularidade: pode ser só ausência de fiscalização. Nome e documento do autuado não são exibidos.',
    fontes: ['embargos-ambientais-vales'],
  },
  {
    id: 'checagem-g0', assunto: 'pistas',
    label: 'Amostra em conferência',
    hint: '63 áreas sorteadas ou escolhidas para alguém conferir uma a uma na imagem de satélite. É como se mede quanto o método erra.',
    aviso: 'Nada aqui está conferido ainda — é a fila de conferência, não o resultado dela.',
    fontes: ['checagem-g0'],
  },
  {
    id: 'pesquisa-noticias', assunto: 'pistas',
    label: 'Lugares abandonados na imprensa',
    hint: 'Terreno vazio, prédio abandonado e lugar fechado que apareceram em notícia. É pista para conferir, não cadastro. Ainda não coletadas.',
    aviso: 'Cada ponto marca o que a reportagem descreveu, na data dela. Notícia não é documento de propriedade, e situação de imóvel muda.',
    fontes: ['pesquisa-noticias'],
  },
  {
    id: 'municipios-mg', assunto: 'referencia',
    label: 'Divisas dos municípios',
    hint: 'Os 853 municípios de Minas Gerais, pelo mapa oficial do IBGE. É moldura para se localizar, não um achado da pesquisa.',
    fontes: ['municipios-mg'],
  },
  {
    id: 'imagens-satelite', assunto: 'referencia',
    label: 'Imagem de satélite',
    hint: 'Foto do terreno, que fica mais nítida conforme você aproxima. Cor natural, do World Imagery da Esri.',
    aviso: 'Mostra como o lugar estava quando foi fotografado, não hoje.',
    fontes: ['imagens-satelite'],
  },
  {
    id: 'satelites-orbita', assunto: 'referencia',
    label: 'Satélites em órbita',
    hint: 'Onde estão agora os satélites que fotografam essas áreas. Posição calculada em tempo real, pelo SGP4 sobre os TLE do CelesTrak.',
    fontes: ['satelites-orbita'],
  },
];

// ---------------------------------------------------------------------------
// Índices derivados. Existem para que ninguém precise varrer listas com
// `find()` em caminho quente (o inspetor faz isso a cada clique no globo) e,
// principalmente, para que a relação fonte↔conceito tenha UM dono só.
// ---------------------------------------------------------------------------

/** id de fonte → entrada do LAYER_REGISTRY. */
export const FONTE_POR_ID = new Map(LAYER_REGISTRY.map((f) => [f.id, f]));

/** id de fonte → entrada de CAMADAS que a contém. */
export const CAMADA_POR_FONTE = new Map(
  CAMADAS.flatMap((c) => c.fontes.map((idFonte) => [idFonte, c])),
);

/**
 * Confere, na carga do módulo, que os dois lados batem: toda fonte citada por
 * uma camada existe, e toda fonte do registro está em alguma camada.
 *
 * É barato (49 comparações) e pega na hora o erro que de outro modo aparece
 * como "uma camada sumiu do painel" — que é exatamente o defeito que
 * `agruparPorRegiao` já tinha tido de aprender a não cometer em silêncio.
 * Aviso, e não exceção: uma fonte órfã não deve impedir o globo de abrir.
 */
for (const camada of CAMADAS) {
  for (const idFonte of camada.fontes) {
    if (!FONTE_POR_ID.has(idFonte)) {
      console.warn(`[config] camada "${camada.id}" cita a fonte "${idFonte}", que não existe no LAYER_REGISTRY.`);
    }
  }
}
for (const fonte of LAYER_REGISTRY) {
  if (!CAMADA_POR_FONTE.has(fonte.id)) {
    console.warn(`[config] fonte "${fonte.id}" não é citada por nenhuma entrada de CAMADAS — não vai aparecer no painel.`);
  }
}

/**
 * As fontes de uma camada que o filtro de região deixa passar.
 *
 * @param {object} camada  entrada de CAMADAS (ou já resolvida)
 * @param {string|null} regiao  id de REGIOES, ou null para "todas"
 * @returns {Array<object>} entradas do LAYER_REGISTRY, na ordem declarada
 */
export function fontesVisiveis(camada, regiao) {
  return camada.fontes
    .map((id) => FONTE_POR_ID.get(id))
    .filter((fonte) => fonte && fonteNaRegiao(fonte, regiao));
}

/**
 * Resolve uma camada contra o registro de fontes: junta o que o painel precisa
 * saber e que hoje só existe espalhado nas fontes.
 *
 * As regras de junção, e o porquê de cada uma:
 *
 *  · `color`/`render` vêm da PRIMEIRA fonte. Não é arbitrário — as fontes
 *    irmãs de um mesmo conceito têm a mesma cor de propósito desde 06/08 (a
 *    cor identifica O QUE a camada é, não onde fica) e o mesmo tipo de
 *    desenho. Se um dia divergirem, o aviso abaixo aparece: um conceito com
 *    duas cores é um conceito mal dividido, não um detalhe de exibição.
 *  · `on` = ALGUMA fonte nasce ligada. Hoje só `vazio-cadastral-bacia`,
 *    `municipios-mg` e os satélites nascem assim.
 *  · `vazia` = TODAS as fontes estão vazias. Se uma tem dado, a linha é
 *    utilizável e não deve nascer travada.
 *  · `listavel`/`fixture` = ALGUMA fonte. São portas de segurança
 *    (ui/exportar.js): na dúvida, a que protege mais.
 *  · `semRegiao` = NENHUMA fonte declara região. É o que faz a linha dizer
 *    "o filtro de região não muda o que ela mostra" em vez de sumir.
 *  · `pesada` = ALGUMA fonte. Mesma lógica de segurança de `listavel`/
 *    `fixture`: "ligar tudo" (ui/layerspanel.js) usa este campo para pular a
 *    linha, e a dúvida tem de pender para NÃO ligar — não para ligar demais
 *    numa camada que hoje só `sigmine-interesse` carrega.
 */
export function resolverCamada(camada) {
  const fontesResolvidas = camada.fontes.map((id) => FONTE_POR_ID.get(id)).filter(Boolean);
  const primeira = fontesResolvidas[0];

  const cores = new Set(fontesResolvidas.map((f) => f.color));
  if (cores.size > 1) {
    console.warn(`[config] camada "${camada.id}" reúne fontes de cores diferentes (${[...cores].map((c) => `#${c.toString(16)}`).join(', ')}) — o painel vai mostrar a da primeira, e a legenda vai mentir sobre as outras.`);
  }

  return {
    ...camada,
    fontesResolvidas,
    color: primeira?.color ?? 0x9aa6b2,
    render: primeira?.render ?? 'fill',
    on: fontesResolvidas.some((f) => f.on),
    vazia: fontesResolvidas.length > 0 && fontesResolvidas.every((f) => f.vazia),
    fixture: fontesResolvidas.some((f) => f.fixture),
    listavel: fontesResolvidas.some((f) => f.listavel),
    semRegiao: fontesResolvidas.every((f) => !f.regioes),
    pesada: fontesResolvidas.some((f) => f.pesada),
  };
}

/** As 22 linhas do painel, já resolvidas. É isto que o main.js entrega à UI. */
export const CAMADAS_RESOLVIDAS = CAMADAS.map(resolverCamada);

/**
 * A fonte tem alguma área na região escolhida?
 *
 * Fonte sem `regioes` (a moldura, os satélites, o cadastro de BH, as normas)
 * passa SEMPRE: ela não afirma região nenhuma, e escondê-la num filtro seria
 * afirmar por ela. Ver a nota de `normas-geolocalizadas` no registro.
 */
export function fonteNaRegiao(fonte, regiao) {
  if (!regiao) return true;
  if (!fonte.regioes) return true;
  return fonte.regioes.includes(regiao);
}
