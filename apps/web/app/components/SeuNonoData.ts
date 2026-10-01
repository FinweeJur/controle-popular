/**
 * @file apps/web/app/components/SeuNonoData.ts
 * @description Base oficial de conhecimento, perguntas curadas e fichas do assistente cívico Seu Nonô.
 *
 * Papel no portal:
 * Alimenta a árvore de conhecimento do assistente cívico popular Seu Nonô (Alceu Dispor)
 * e o motor de respostas curadas determinísticas. Estruturado em 4 frentes temáticas
 * (Direitos em Movimento, Terra e Territórios, Estado e Economia, Central ONSA & Blog) e fichas de páginas.
 *
 * Fontes oficiais:
 * - Leis federais, Constituição Federal, Diários Oficiais e Portal da Transparência.
 * - CVM, SEC (EUA), SEDAR+/TSX (Canadá), ANM/SIGBM, FEAM/IBAMA e PNCP.
 * - Ouvidorias públicas, Tribunais de Contas, Ministérios Públicos e ouvidoria canadense CORE.
 *
 * Decisões técnicas e restrições:
 * - Regra do Dev: Respostas redigidas em orações diretas com frases curtas de até 13 palavras.
 * - Cada resposta aponta links diretos para telas de dados e portais governamentais oficiais.
 * - Conformidade estrita com a LGPD: varredura contínua de CPFs e proteção de dados pessoais.
 */

export interface SeuNonoLink {
  href: string;
  texto: string;
}

export interface SeuNonoPergunta {
  id: string;
  pergunta: string;
  resposta: string;
  link?: SeuNonoLink;
  /** Links extras para ações ou referências adicionais. */
  links?: SeuNonoLink[];
}

export interface SeuNonoCategoria {
  id: string;
  titulo: string;
  perguntas: SeuNonoPergunta[];
}

export interface SeuNonoFrente {
  id: string;
  titulo: string;
  descricao: string;
  categorias: SeuNonoCategoria[];
}

export const FRENTES: SeuNonoFrente[] = [
  {
    id: "direitos",
    titulo: "Eixo 1 — Direitos em Movimento",
    descricao: "Trabalho e renda, saúde pública (SUS), educação (IDEB), moradia e canais populares de denúncia.",
    categorias: [
      {
        id: "trabalho-e-renda",
        titulo: "Trabalho e Renda",
        perguntas: [
          {
            id: "emprego-caged",
            pergunta: "Como consultar contratações e demissões no CAGED?",
            resposta:
              "O painel de Trabalho e Renda monitora admissões e desligamentos do CAGED por município, demonstrando o saldo formal de vagas.",
            link: { href: "/direitos-em-movimento/trabalho-e-renda", texto: "Painel de Trabalho e Renda" },
          },
          {
            id: "renda-local",
            pergunta: "Qual o impacto dos contratos públicos na renda do trabalhador?",
            resposta:
              "Cruzamos contratos e compras públicas com postos de trabalho gerados, avaliando o efeito multiplicador da economia local.",
            link: { href: "/direitos-em-movimento/trabalho-e-renda", texto: "Ver análise de renda" },
          },
        ],
      },
      {
        id: "saude-publica",
        titulo: "Saúde Pública & SUS",
        perguntas: [
          {
            id: "leitos-sus",
            pergunta: "Como saber a quantidade de leitos do SUS na minha cidade?",
            resposta:
              "O portal monitora o Cadastro Nacional de Estabelecimentos de Saúde (CNES) e a razão de leitos por habitante em comparação com os parâmetros da OMS.",
            link: { href: "/direitos-em-movimento/saude-publica", texto: "Painel de Saúde Pública" },
          },
          {
            id: "hospitais-atendimento",
            pergunta: "Onde consultar a capacidade hospitalar e estabelecimentos CNES?",
            resposta:
              "Consulte postos de saúde, UPAs e hospitais municipais com dados oficiais do DataSUS.",
            link: { href: "/direitos-em-movimento/saude-publica", texto: "Ver hospitais e leitos" },
          },
        ],
      },
      {
        id: "educacao",
        titulo: "Educação & Escolas",
        perguntas: [
          {
            id: "ideb-escolas",
            pergunta: "O que é o IDEB e como ver a nota da minha cidade?",
            resposta:
              "O IDEB avalia o fluxo escolar e o aprendizado em português e matemática apurado pelo INEP para os anos iniciais e finais do ensino fundamental.",
            link: { href: "/direitos-em-movimento/educacao", texto: "Painel de Educação" },
          },
          {
            id: "infraestrutura-escolar",
            pergunta: "Como verificar a infraestrutura das escolas municipais?",
            resposta:
              "Dados do Censo Escolar revelam a presença de bibliotecas, quadras, laboratórios e saneamento nas escolas da rede pública.",
            link: { href: "/direitos-em-movimento/educacao", texto: "Infraestrutura Escolar" },
          },
        ],
      },
      {
        id: "moradia",
        titulo: "Moradia & Habitação",
        perguntas: [
          {
            id: "deficit-habitacional",
            pergunta: "Como é medido o déficit habitacional urbano?",
            resposta:
              "O cálculo envolve coabitação familiar, ônus excessivo com aluguel e habitações precárias mapeadas pelo IBGE e Fundação João Pinheiro.",
            link: { href: "/funcaosocialterra", texto: "Função Social da Terra & Moradia" },
          },
          {
            id: "prevencao-remocoes",
            pergunta: "O que fazer diante do risco de remoção forçada?",
            resposta:
              "Conheça as diretrizes da Comissão de Conflitos Fundiários e como acionar a Defensoria Pública especializada.",
            link: { href: "/direitos-em-movimento/ajuda", texto: "Orientação e Ajuda" },
          },
        ],
      },
      {
        id: "acesso-a-justica",
        titulo: "Acesso à Informação, Conselhos & Denúncias",
        perguntas: [
          {
            id: "pedir-lai",
            pergunta: "Como fazer um pedido de Lei de Acesso à Informação (LAI)?",
            resposta:
              "A Central de Canais LAI reúne 445 entidades: prefeituras, câmaras, órgãos federais e concessionárias de água, energia e telecomunicações com e-mail, telefone, e-SIC e modelo de pedido.",
            link: { href: "/direitos-em-movimento/informacao", texto: "Central de Canais LAI (445 entidades)" },
          },
          {
            id: "tarifa-social",
            pergunta: "Como pedir desconto de até 65% na conta de energia e água?",
            resposta:
              "Famílias inscritas no Cadastro Único (CadÚnico) têm direito à Tarifa Social de Energia (CEMIG, Enel, CPFL, Light, Equatorial) e desconto na água (COPASA, Sabesp, Cedae). Veja tutorial por estado.",
            link: { href: "/noticias/tarifa-social-energia-agua-como-acessar", texto: "Tutorial Tarifa Social" },
          },
          {
            id: "conselhos-direitos",
            pergunta: "Como encontrar o Conselho de Saúde, Meio Ambiente ou Tutelar da minha cidade?",
            resposta:
              "O portal mapeia 710 conselhos participativos (CMS, CES, CODEMA, CEDH, CMDM e Tutelares) das 27 UFs e 199 cidades estratégicas com datas de reunião, contatos e canais.",
            link: { href: "/direitos-em-movimento/conselhos", texto: "Conselhos de Direitos & Colegiados" },
          },
          {
            id: "onde-buscar-ajuda",
            pergunta: "Onde buscar orientação jurídica e defensoria pública gratuita?",
            resposta:
              "O guia de ajuda lista defensorias, ouvidorias públicas e entidades da sociedade civil que prestam assistência jurídica gratuita em todo o país.",
            link: { href: "/direitos-em-movimento/ajuda", texto: "Quem pode ajudar" },
          },
          {
            id: "fazer-denuncia",
            pergunta: "Como fazer uma denúncia popular com segurança?",
            resposta:
              "A página de denúncias reúne gerador passo a passo de representação (.docx local) e canais do Ministério Público, Tribunais de Contas e controladorias.",
            link: { href: "/direitos-em-movimento/denuncia", texto: "Canais de Denúncia" },
          },
        ],
      },
      {
        id: "legislacao-e-direitos",
        titulo: "Legislação, TACs & Direitos Humanos",
        perguntas: [
          {
            id: "legislacao-normas-ambientais",
            pergunta: "Qual legislação ambiental protege recursos naturais, APPs e florestas?",
            resposta:
              "O acervo reúne mais de 20 mil normas, leis estaduais e federais catalogadas com busca por palavra-chave, tema e órgão emissor.",
            link: { href: "/ambiental/legislacao", texto: "Legislação Ambiental (20 mil normas)" },
          },
          {
            id: "tacs-ibama-acordos",
            pergunta: "Como saber se uma empresa da minha região assinou TAC com o IBAMA?",
            resposta:
              "Consulte os Termos de Ajustamento de Conduta (TACs) firmados pelo IBAMA com pessoas físicas e jurídicas para recuperação de áreas degradadas e multas.",
            link: { href: "/ambiental/tac", texto: "Termos de Ajustamento de Conduta (TACs)" },
          },
          {
            id: "decisoes-lai-precedentes",
            pergunta: "O que fazer se a prefeitura negar pedido de LAI alegando sigilo?",
            resposta:
              "O banco de decisões da Lei de Acesso à Informação reúne recursos julgados e súmulas da CGU que obrigam órgãos públicos a divulgar dados públicos.",
            link: { href: "/ambiental/decisoes-lai", texto: "Decisões e Precedentes LAI" },
          },
          {
            id: "direitos-humanos-conflitos",
            pergunta: "Onde consultar relatórios de direitos humanos e conflitos no campo?",
            resposta:
              "O painel monitora relatórios de violência no campo, violações de direitos de comunidades atingidas e programas de proteção a defensores.",
            link: { href: "/ambiental/direitos-humanos", texto: "Relatórios de Direitos Humanos" },
          },
        ],
      },
    ],
  },
  {
    id: "terra",
    titulo: "Eixo 2 — Terra e Territórios",
    descricao: "199 cidades estratégicas, bacias do Rio Doce e Paraopeba, ONSA, mineração e terras tradicionais.",
    categorias: [
      {
        id: "cidades-estrategicas",
        titulo: "199 Cidades Estratégicas",
        perguntas: [
          {
            id: "rede-199-cidades",
            pergunta: "O que são as 199 Cidades Estratégicas?",
            resposta:
              "É a rede de fiscalização cidadã do portal que monitora as 27 capitais e 172 polos regionais do interior do Brasil com contratos, saúde e educação.",
            link: { href: "/cidades", texto: "Explorar as 199 Cidades" },
          },
          {
            id: "cidades-mg",
            pergunta: "Quais cidades de Minas têm páginas completas?",
            resposta:
              "Belo Horizonte, Betim, Araçuaí, Diamantina e Itinga contam com dados de orçamentos, contratos e Diários Oficiais.",
            link: { href: "/betim", texto: "Ver exemplo de Betim" },
            links: [
              { href: "/bh", texto: "Belo Horizonte" },
              { href: "/aracuai", texto: "Araçuaí" },
              { href: "/itinga", texto: "Itinga" },
              { href: "/diamantina", texto: "Diamantina" },
            ],
          },
          {
            id: "municipios-853-mg",
            pergunta: "Onde ver todos os 853 municípios de Minas Gerais?",
            resposta:
              "A página Municípios de MG lista os 853 municípios do IBGE. Destaca 10 polos com população do Censo 2022.",
            link: { href: "/cidades/mg", texto: "Municípios de Minas Gerais" },
            links: [
              { href: "/cidades", texto: "199 Cidades Estratégicas" },
              { href: "https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios", texto: "Fonte Oficial IBGE" },
            ],
          },
        ],
      },
      {
        id: "vales-jequitinhonha-mucuri",
        titulo: "Vales do Jequitinhonha e Mucuri",
        perguntas: [
          {
            id: "compras-pncp-jequitinhonha",
            pergunta: "Como consultar compras e contratos das cidades do Vale do Jequitinhonha no PNCP?",
            resposta:
              "Ô, meu amigo, é muito fácil acompanhar as contas dos nossos vales. O PNCP — sistema nacional de compras públicas — reúne contratos e licitações. Você digita a cidade e descobre os maiores fornecedores e obras. Dá para fiscalizar cada centavo gasto com merenda, remédios e asfalto. O cidadão bem informado protege o dinheiro do seu próprio povo.",
            link: { href: "https://pncp.gov.br/app/editais?uf=MG", texto: "Acessar compras de MG no PNCP" },
            links: [
              { href: "https://pncp.gov.br", texto: "Portal Nacional de Contratações Públicas (PNCP)" },
              { href: "/diamantina/indice", texto: "Painel de Diamantina no portal" },
            ],
          },
          {
            id: "polo-litio-jequitinhonha",
            pergunta: "Quais municípios fazem parte do polo do lítio no Jequitinhonha e como fiscalizar?",
            resposta:
              "Olha só, meu compadre, o Vale vive a corrida do lítio. Os destaques são Araçuaí, Itinga e Coronel Murta no Médio Jequitinhonha. Para fiscalizar, acompanhe a CFEM — compensação financeira paga pela mineração às prefeituras. Fique de olho também no uso das águas dos rios locais. A riqueza do subsolo deve virar saúde, escola e dignidade popular.",
            link: { href: "https://www.gov.br/anm/pt-br/assuntos/arrecadacao/distribuicao-da-cfem", texto: "Distribuição da CFEM na ANM" },
            links: [
              { href: "https://www.gov.br/anm/pt-br", texto: "Agência Nacional de Mineração (ANM)" },
              { href: "/ambiental/barragens", texto: "Painel de Barragens e Mineração" },
            ],
          },
          {
            id: "municipios-mucuri-maxakali",
            pergunta: "Como acompanhar os 27 municípios do Vale do Mucuri e as terras indígenas Maxakali?",
            resposta:
              "Uai, o Vale do Mucuri tem 27 municípios cheios de história. Teófilo Otoni é o polo regional e Nanuque desponta ao leste. Em Ladainha e Santa Helena de Minas vive o nobre Povo Maxakali. Você acompanha proteção social pelo SUAS — Sistema Único de Assistência Social. Monitore também os recursos hídricos e a transparência das compras municipais.",
            link: { href: "https://www.gov.br/funai/pt-br/atuacao/terras-indigenas", texto: "Terras Indígenas na FUNAI" },
            links: [
              { href: "https://pncp.gov.br/app/contratos?q=Te%C3%B3filo%20Otoni&uf=MG", texto: "Contratos do Mucuri no PNCP" },
              { href: "/teofilo-otoni", texto: "Página de Teófilo Otoni" },
            ],
          },
          {
            id: "regras-qualidade-informacao-vales",
            pergunta: "Quais são as regras de qualidade da informação das cidades dos vales?",
            resposta:
              "Pois é, meu amigo, transparência boa precisa de régua muito alta. Primeiro: fonte direta — link auditável que abre o documento oficial original. Segundo: dado buscável — achar processo ou fornecedor pelo nome na busca. Terceiro: lista filtrável — separar contratações por ano, valor ou modalidade. Quarto: microresumo cidadão — síntese em linguagem simples, sem termos difíceis. Quinto: chatbot com contexto — assistente que conhece o orçamento da cidade. Sexto: classificação com tags — etiquetas temáticas como saúde, educação e mineração.",
            link: { href: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm", texto: "Lei de Acesso à Informação (LAI)" },
            links: [
              { href: "https://pncp.gov.br", texto: "Portal Nacional de Contratações Públicas" },
              { href: "/busca", texto: "Buscador do Controle Popular" },
            ],
          },
        ],
      },
      {
        id: "paraopeba-brumadinho",
        titulo: "Bacia do Paraopeba & Brumadinho",
        perguntas: [
          {
            id: "acordo-paraopeba",
            pergunta: "Como está a execução do Acordo Judicial de Brumadinho?",
            resposta:
              "O Acordo Global de R$ 37,7 bilhões prevê R$ 5,48 bi para os 26 municípios atingidos do Paraopeba. Acompanhe a execução e as obras em andamento.",
            link: { href: "/paraopeba/execucao", texto: "Execução por Município" },
          },
          {
            id: "analise-integrada-paraopeba",
            pergunta: "O que é a análise integrada de auditoria, perícia e ATIs?",
            resposta:
              "Cruzamento entre os 16 eixos da auditoria independente AECOM, os laudos da UFMG e os estudos das comunidades atingidas.",
            link: { href: "/paraopeba/analise", texto: "Análise Integrada" },
          },
          {
            id: "biblioteca-ati",
            pergunta: "Onde ver relatórios das Assessorias Técnicas Independentes (ATIs)?",
            resposta:
              "A Biblioteca reúne mais de 640 documentos produzidos por AEDAS, Guaicuy, NACAB e ADAI.",
            link: { href: "/ambiental/crimes-socioambientais", texto: "Biblioteca Socioambiental" },
          },
        ],
      },
      {
        id: "rio-doce-mariana",
        titulo: "Bacia do Rio Doce & Mariana",
        perguntas: [
          {
            id: "repactuacao-mariana",
            pergunta: "O que prevê a repactuação de Mariana de R$ 171 bilhões?",
            resposta:
              "O novo acordo judicial de 2024 prevê R$ 100 bilhões em dinheiro novo para saúde pública, saneamento e indenizações no Rio Doce.",
            link: { href: "/ambiental/mariana", texto: "Painel do Rio Doce / Mariana" },
          },
          {
            id: "repasses-municipios-doce",
            pergunta: "Quanto cada município atingido do Rio Doce recebe?",
            resposta:
              "Consulte a tabela de repasses diretos aos municípios de Minas Gerais e do Espírito Santo afetados pelo desastre da Samarco/Vale.",
            link: { href: "/ambiental/mariana", texto: "Repasses Municipais Mariana" },
          },
        ],
      },
      {
        id: "meio-ambiente-onsa",
        titulo: "Meio Ambiente (ONSA)",
        perguntas: [
          {
            id: "licenciamento-ambiental",
            pergunta: "Onde consultar processos de licenciamento ambiental em MG?",
            resposta:
              "O painel do ONSA reúne mais de 19 mil empreendimentos com licenças prévias, de instalação e operação aprovadas pela SEMAD.",
            link: { href: "/ambiental/licenciamento", texto: "Licenciamento ONSA" },
          },
          {
            id: "descaracterizacao-barragens",
            pergunta: "Qual o status de descaracterização de barragens em MG?",
            resposta:
              "Monitoramento das 23 barragens a montante sob exigência da Lei 'Mar de Lama Nunca Mais' e dados do SIGBM.",
            link: { href: "/ambiental/barragens/descaracterizacao", texto: "Descaracterização de Barragens" },
          },
          {
            id: "copam-decisoes",
            pergunta: "O que é o COPAM e onde ver suas reuniões?",
            resposta:
              "O Conselho Estadual de Política Ambiental delibera sobre pedidos de licença em Minas Gerais. Veja atas e processos pautados.",
            link: { href: "/ambiental/copam", texto: "Pautas do COPAM" },
          },
          {
            id: "cavas-mineracao-satelite",
            pergunta: "Onde ver as cavas de mineração no globo 3D?",
            resposta:
              "A página das Cavas traz a série anual de mineração em MG. Cruzamos uma amostra com polígonos da ANM. O globo 3D mostra as camadas.",
            link: { href: "/mineracao/cavas", texto: "Cavas de Mineração" },
            links: [
              { href: "/funcaosocialterra/mapa", texto: "Abrir Globo 3D" },
              { href: "/ambiental/barragens", texto: "Painel de Barragens SIGBM" },
            ],
          },
        ],
      },
      {
        id: "terras-funcao-social",
        titulo: "Terras Tradicionais & Função Social",
        perguntas: [
          {
            id: "globo-3d-terras",
            pergunta: "Como funciona o Globo 3D de sobreposições territoriais?",
            resposta:
              "Visualização tridimensional que sobrepõe Unidades de Conservação, terras indígenas, quilombolas e requerimentos minerários.",
            link: { href: "/funcaosocialterra/mapa", texto: "Abrir Globo 3D" },
          },
          {
            id: "vazio-cadastral",
            pergunta: "O que é vazio cadastral e como fiscalizar o CAR?",
            resposta:
              "Áreas sem cadastro ambiental rural que podem indicar terras devolutas ou sobreposições indevidas sobre o patrimônio público.",
            link: { href: "/funcaosocialterra", texto: "Metodologia Fundiária" },
          },
          {
            id: "imoveis-uniao-spu",
            pergunta: "Como consultar os imóveis da União em Minas Gerais?",
            resposta:
              "A página reúne 553 imóveis da União em Minas. Mostra destinação, classe, proprietário e área. Fonte: SPU.",
            link: { href: "/ambiental/autorizacoes", texto: "Imóveis da União em MG" },
            links: [
              { href: "https://www.gov.br/gestao/pt-br/assuntos/patrimonio-da-uniao", texto: "SPU — Patrimônio da União" },
              { href: "/funcaosocialterra", texto: "Função Social da Terra" },
            ],
          },
        ],
      },
      {
        id: "bacias-serras-patrimonio",
        titulo: "Rios, Serras & Patrimônio Cultural",
        perguntas: [
          {
            id: "nossos-rios-qualidade",
            pergunta: "Como verificar a qualidade da água dos rios e bacias de MG?",
            resposta:
              "O painel monitora as 7 bacias hidrográficas (Velhas, Doce, Paraopeba, São Francisco, Jequitinhonha, Mucuri e Paranaíba) com dados do IGAM e outorgas de captação.",
            link: { href: "/ambiental/nossos-rios", texto: "Nossos Rios & Bacias Hidrográficas" },
          },
          {
            id: "nossas-serras-recarga",
            pergunta: "Por que as serras e áreas de recarga hídrica são protegidas?",
            resposta:
              "Acompanhe o monitoramento da Serra do Gandarela, Serra da Moeda e Serra do Curral frente a pressões minerárias e imobiliárias.",
            link: { href: "/ambiental/nossas-serras", texto: "Nossas Serras & Áreas de Recarga" },
          },
          {
            id: "patrimonio-cultural-tombamentos",
            pergunta: "Como consultar bens tombados pelo IEPHA e IPHAN em risco?",
            resposta:
              "Consulte mais de 1.800 bens tombados, sítios arqueológicos e patrimônio histórico de Minas Gerais com cruzamento de riscos industriais.",
            link: { href: "/ambiental/patrimonio-cultural", texto: "Patrimônio Cultural & Tombamentos" },
          },
          {
            id: "litigios-climaticos-acoes",
            pergunta: "O que são litígios climáticos e como cobrar proteção contra enchentes?",
            resposta:
              "Mapeamento de Ações Civis Públicas climáticas que cobram obras de contenção de cheias, drenagem urbana e adaptação às mudanças climáticas.",
            link: { href: "/ambiental/litigios-climaticos", texto: "Painel de Litígios Climáticos" },
          },
          {
            id: "estudos-rurais-agroecologia",
            pergunta: "Onde encontrar estudos sobre agricultura familiar e agroecologia?",
            resposta:
              "O acervo de Estudos Rurais reúne pesquisas, notas técnicas e dados sobre assentamentos, reforma agrária e produção de alimentos saudáveis.",
            link: { href: "/estudos-rurais", texto: "Acervo de Estudos Rurais" },
          },
          {
            id: "convenios-estudos-ambientais",
            pergunta: "Onde consultar convênios e estudos ambientais estaduais?",
            resposta:
              "Painel com mais de 3.000 convênios e relatórios técnicos da SEMAD, IEF, IGAM e FEAM com valores e prestação de contas.",
            link: { href: "/ambiental/convenios", texto: "Convênios & Estudos Ambientais" },
          },
        ],
      },
    ],
  },
  {
    id: "estado",
    titulo: "Eixo 3 — Estado e Economia",
    descricao: "Orçamento de MG, PNCP, grandes mineradoras (Vale), Judiciário (TJMG/MPMG) e Congresso Nacional.",
    categorias: [
      {
        id: "governo-e-instituicoes",
        titulo: "Governo: Prometeu? Cumpriu? & Lideranças",
        perguntas: [
          {
            id: "governo-prometeu-cumpriu",
            pergunta: "Como checar se o governador cumpriu as promessas de campanha?",
            resposta:
              "O painel monitora metas e propostas de campanha dos 27 governadores e prefeitos de capitais nas áreas de saúde, educação, segurança e meio ambiente.",
            link: { href: "/governo", texto: "Governo: Prometeu? Cumpriu?" },
          },
          {
            id: "instituicoes-organogramas-liderancas",
            pergunta: "Quem comanda cada ministério, secretaria estadual ou agência reguladora?",
            resposta:
              "Consulte organogramas, atos de nomeação, histórico e remunerações da cúpula de agências como ANM, ANA, ANTT e secretarias estaduais.",
            link: { href: "/instituicoes", texto: "Organogramas & Lideranças Públicas" },
          },
        ],
      },
      {
        id: "orcamento-e-compras",
        titulo: "Orçamento, Editais & Compras Públicas",
        perguntas: [
          {
            id: "radar-editais-mg",
            pergunta: "Como funciona o Radar de Editais e Chamamentos do Diário Oficial de MG?",
            resposta:
              "O Radar varre diariamente o Diário Oficial de MG e reúne mais de 50 certames de interesse social (medicamentos, merenda, obras e cultura) com filtros por órgão, situação e exportação em CSV.",
            link: { href: "/editais", texto: "Acessar Radar de Editais" },
          },
          {
            id: "orcamento-mg",
            pergunta: "Onde consultar a arrecadação de ICMS e o orçamento de Minas Gerais?",
            resposta:
              "O painel de finanças públicas monitora as receitas tributárias do Estado (R$ 81,5 bi de ICMS, R$ 9,8 bi de IPVA) e suas destinações.",
            link: { href: "/estado-e-economia/orcamento", texto: "Orçamento de MG" },
          },
          {
            id: "pncp-compras",
            pergunta: "Como fiscalizar compras públicas municipais pelo PNCP?",
            resposta:
              "Reportagens investigativas analisam editais, dispensas de licitação e contratos de cidades de médio e pequeno porte.",
            link: { href: "/noticias/estado-e-economia-pncp-compras", texto: "Auditoria do PNCP" },
          },
          {
            id: "ppp-concessoes-mg",
            pergunta: "Quais são as concessões e PPPs de Minas Gerais?",
            resposta:
              "A página reúne 20 contratos do Estado. Apenas 6 são a concessão em si. Os outros são apoio, supervisão ou estudo.",
            link: { href: "/ambiental/ppp", texto: "Concessões e PPPs de MG" },
            links: [
              { href: "https://www.transparencia.mg.gov.br", texto: "Portal da Transparência MG" },
              { href: "/estado-e-economia/compras", texto: "Compras Públicas (PNCP)" },
            ],
          },
        ],
      },
      {
        id: "recursos-27-estados",
        titulo: "Recursos dos 27 Estados (Água, Energia, Combustível, PPPs e Emendas)",
        perguntas: [
          {
            id: "outorgas-agua-27-estados",
            pergunta: "Como consultar as outorgas de água dos 27 estados?",
            resposta:
              "O portal monitora 751 mil outorgas ativas da ANA. Veja vazões e órgãos gestores dos 27 estados.",
            link: { href: "/recursos/estados", texto: "Painel de Recursos dos 27 Estados" },
          },
          {
            id: "assimetria-tarifaria-energia",
            pergunta: "O que é a assimetria tarifária entre o cidadão e a grande indústria?",
            resposta:
              "O cidadão paga em média 75% a mais pelo kWh. As indústrias compram energia no Mercado Livre mais barato.",
            link: { href: "/recursos/estados", texto: "Comparar Tarifas de Energia" },
          },
          {
            id: "combustivel-frotas-estados",
            pergunta: "Quanto os governos estaduais gastam com combustível e frotas?",
            resposta:
              "Os 27 estados gastam R$ 3,4 bilhões anuais com frotas públicas. Os dados são auditados no Portal Nacional de Contratações.",
            link: { href: "/recursos/estados", texto: "Gastos com Combustível" },
          },
          {
            id: "ppps-concessoes-27-estados",
            pergunta: "Onde consultar as concessões e PPPs de todos os estados?",
            resposta:
              "A carteira reúne R$ 214 bilhões em rodovias, saneamento e transportes. Os contratos são auditados pelo BNDES Hub e estados.",
            link: { href: "/recursos/estados", texto: "PPPs e Concessões dos Estados" },
          },
          {
            id: "emendas-estaduais-pix",
            pergunta: "Como fiscalizar as emendas parlamentares e transferências PIX das Assembleias?",
            resposta:
              "As emendas impositivas somam R$ 12,8 bilhões nos 27 estados. O cidadão fiscaliza cotas por deputado e transferências PIX.",
            link: { href: "/recursos/estados", texto: "Emendas nas 27 Assembleias" },
          },
        ],
      },
      {
        id: "documentacao-e-transparencia",
        titulo: "Documentação Técnica, APIs & Transparência",
        perguntas: [
          {
            id: "documentacao-tecnica-portal",
            pergunta: "Onde consultar a documentação técnica, regras de arquitetura e APIs abertas?",
            resposta:
              "A seção de Documentação estilo GitBook reúne guias de arquitetura (duplo deploy), fontes de dados oficiais, princípios editoriais e 3 endpoints de API JSON abertos e gratuitos.",
            link: { href: "/documentacao", texto: "Ver Documentação Técnica" },
            links: [
              { href: "/documentacao/api-publica", texto: "API Pública" },
              { href: "/documentacao/arquitetura", texto: "Arquitetura" },
              { href: "/termos", texto: "Termos & LGPD" },
            ],
          },
          {
            id: "paginas-mais-acessadas",
            pergunta: "Quais são as páginas e dados mais consultados pelos cidadãos?",
            resposta:
              "O painel de Páginas Populares ranqueia em tempo real as consultas sobre contratos municipais, barragens de mineração e repasses de convênios em todo o estado.",
            link: { href: "/dados/populares", texto: "Ver Páginas Populares" },
          },
        ],
      },
      {
        id: "empresas-mineradoras",
        titulo: "Grandes Empresas & Mineradoras",
        perguntas: [
          {
            id: "vale-acionistas",
            pergunta: "Quem são os maiores acionistas globais da Vale?",
            resposta:
              "O portal monitora fundos soberanos e gestoras globais (BlackRock, Capital Group, Previ), distribuição de dividendos e processos.",
            link: { href: "/empresas", texto: "Painel de Grandes Empresas" },
          },
          {
            id: "grandes-empresas-mineradoras",
            pergunta: "Como fiscalizar mineradoras como Sigma Lithium, CSN, Gerdau, Samarco e BHP?",
            resposta:
              "O painel de empresas detalha acionistas controladores, relatórios ESG, passivos socioambientais e processos judiciais de grandes mineradoras.",
            link: { href: "/empresas", texto: "Painel de Grandes Empresas" },
          },
          {
            id: "cfem-royalties",
            pergunta: "O que é CFEM e quanto as mineradoras pagam às cidades?",
            resposta:
              "A Compensação Financeira pela Exploração de Recursos Minerais (royalties da mineração) é mapeada nos municípios mineradores.",
            link: { href: "/noticias/itinga-transparencia-repasses-litio", texto: "Royalties de Mineração" },
          },
          {
            id: "fortunas-mundiais-concentracao",
            pergunta: "Quem são as 1.000 maiores fortunas e quanto ganham por mês?",
            resposta:
              "Mapeamento reúne US$ 13 trilhões em patrimônio. Rendimento mensal sustenta 778 milhões na extrema pobreza.",
            link: { href: "/empresas/fortunas", texto: "1.000 Maiores Fortunas Mundiais" },
          },
          {
            id: "equivalencia-social-fortunas",
            pergunta: "Como é calculada a equivalência social de renda dos bilionários?",
            resposta:
              "Estimamos retorno anual de 4,5% sobre patrimônio. Comparamos com a linha de pobreza do Banco Mundial.",
            link: { href: "/empresas/fortunas", texto: "Ver Calculadora de Equivalência" },
          },
        ],
      },
      {
        id: "internacional-eua-canada",
        titulo: "Internacional (EUA & Canadá)",
        perguntas: [
          {
            id: "mineradoras-canadenses-jequitinhonha",
            pergunta: "Quais mineradoras canadenses operam no Vale do Jequitinhonha?",
            resposta:
              "Sigma Lithium e Lithium Ionic exploram lítio no Vale do Jequitinhonha. Suas ações negociam na Bolsa de Toronto (TSX e TSXV) no Canadá. O portal monitora relatórios técnicos, barragens de rejeitos e licenças das companhias.",
            link: { href: "/canada/mineracao", texto: "Painel de Mineração Canadá (/canada/mineracao)" },
            links: [
              { href: "https://www.money.tmx.com", texto: "Bolsa de Toronto (TSX)" },
              { href: "/empresas", texto: "Painel de Grandes Empresas" },
            ],
          },
          {
            id: "acionistas-vale-eua",
            pergunta: "Quem são os maiores acionistas da Vale nos EUA?",
            resposta:
              "A Vale negocia recibos de ações (ADRs) na Bolsa de Nova York (NYSE). Grandes gestoras norte-americanas como BlackRock e Capital Group detêm participações relevantes. Os dados são auditados nos formulários Form 20-F da SEC dos EUA.",
            link: { href: "/eua/empresas", texto: "Corporações & Fundos na SEC (/eua/empresas)" },
            links: [
              { href: "https://www.sec.gov/edgar", texto: "SEC EDGAR Oficial" },
              { href: "/paraopeba/vale", texto: "Observatório Vale" },
            ],
          },
          {
            id: "denuncia-ouvidoria-canada-core",
            pergunta: "Como fazer denúncia na ouvidoria canadense CORE?",
            resposta:
              "A CORE investiga abusos de direitos humanos de corporações canadenses no exterior. Qualquer cidadão atingido por mineradoras no Brasil pode registrar representação online gratuita. O portal orienta o passo a passo com formulário oficial canadense.",
            link: { href: "https://core-ombuds.canada.ca", texto: "Ouvidoria CORE do Canadá" },
            links: [
              { href: "/canada/mineracao", texto: "Painel Canadá no Portal" },
              { href: "/direitos-em-movimento/ajuda", texto: "Guia de Denúncia e Ajuda" },
            ],
          },
          {
            id: "sec-form-20f-cvm",
            pergunta: "O que é o formulário Form 20-F da SEC nos Estados Unidos?",
            resposta:
              "O Form 20-F é o balanço anual obrigatório de companhias estrangeiras. Ele detalha passivos ambientais, processos judiciais e remuneração da diretoria. O Controle Popular cruza esses relatórios com registros da CVM brasileira.",
            link: { href: "/eua/empresas", texto: "Painel EUA & Mercado de Capitais" },
            links: [
              { href: "https://www.sec.gov", texto: "Securities and Exchange Commission" },
              { href: "/empresas/documentos", texto: "Biblioteca de Relatórios ESG" },
            ],
          },
          {
            id: "barragens-mineradoras-canadenses",
            pergunta: "Quais mineradoras canadenses possuem barragens de mineração no Brasil?",
            resposta:
              "Kinross Gold, Lundin Mining e Yamana operam estruturas de mineração no país. O portal cruza dados do SIGBM com relatórios técnicos do SEDAR+. Consulte o mapa de barragens e níveis de emergência declarados.",
            link: { href: "/canada/mineracao", texto: "Barragens de Mineradoras do Canadá" },
            links: [
              { href: "/ambiental/barragens", texto: "Painel de Barragens SIGBM" },
              { href: "https://www.sedarplus.ca", texto: "SEDAR+ Canadá" },
            ],
          },
          {
            id: "hub-internacional-multilateral",
            pergunta: "Como comparar o Brasil com ONU, UNESCO, OMS e OMC?",
            resposta:
              "O Hub Internacional compara o Brasil com potências do G8 e G20. Reúne IDH, Gini, saúde, educação e comércio de minérios.",
            link: { href: "/internacional", texto: "Hub Internacional & Multilateral" },
            links: [
              { href: "https://www.un.org", texto: "Organização das Nações Unidas (ONU)" },
              { href: "https://www.who.int", texto: "Organização Mundial da Saúde (OMS)" },
            ],
          },
          {
            id: "operacoes-militares-defesa-global",
            pergunta: "O que é o acervo de operações militares e contratos de defesa?",
            resposta:
              "O portal mapeia 48 operações bélicas, deposições de regime e contratos militares. Reúne registros de potências da América do Norte, Europa e demais continentes. Conecta teatros de conflito, acordos armamentistas e empresas militares privadas.",
            link: { href: "/internacional/operacoes-militares", texto: "Acervo de Operações Militares" },
            links: [
              { href: "/internacional/operacoes-militares/mapa", texto: "Mapa Mundial de Defesa" },
              { href: "https://www.sipri.org", texto: "SIPRI Arms Transfers Database" },
            ],
          },
          {
            id: "orcamentos-estrategicos-eua-canada-europa",
            pergunta: "Como consultar os orçamentos militar, de inteligência, clima e energia de EUA, Canadá e Europa?",
            resposta:
              "Consulte o painel de orçamentos estratégicos globais. Compare gastos de defesa, inteligência, água e clima das potências do hemisfério norte.",
            link: { href: "/internacional/orcamentos", texto: "Orçamentos Estratégicos Globais" },
            links: [
              { href: "/internacional", texto: "Hub Multilateral" },
              { href: "/eua", texto: "Observatório dos EUA" },
              { href: "/europa", texto: "Conexões com a Europa" },
            ],
          },
          {
            id: "pmc-mercenarios-contratos-privados",
            pergunta: "Como o portal monitora empresas militares privadas (PMCs) e mercenários?",
            resposta:
              "Monitoramos contratos de segurança militar terceirizados por governos no exterior. O acervo lista corporações como Wagner, Academi, DynCorp e CACI. Apresenta faturamentos bilionários, teatros operacionais e relatórios da ONU.",
            link: { href: "/internacional/operacoes-militares", texto: "Painel de PMCs e Contratos" },
            links: [
              { href: "https://www.icrc.org", texto: "Documento de Montreux (Cruz Vermelha / DHI)" },
              { href: "/internacional/operacoes-militares/mapa", texto: "Mapa de Teatros de Operações" },
            ],
          },
          {
            id: "mapa-mundial-guerras-conflitos",
            pergunta: "Onde consultar a geolocalização de guerras e intervenções estrangeiras?",
            resposta:
              "O Mapa de Defesa geolocaliza todos os teatros de operações e conflitos. Utiliza projeção vetorial interativa com coordenadas precisas e filtros temáticos. Cada ponto no mapa direciona para a ficha completa no acervo.",
            link: { href: "/internacional/operacoes-militares/mapa", texto: "Mapa Mundial de Defesa" },
            links: [
              { href: "/internacional/operacoes-militares", texto: "Acervo Textual de Conflitos" },
              { href: "/terras/globo", texto: "Globo 3D Terras (Camada de Conflitos)" },
            ],
          },
          {
            id: "monopolios-holdings-big-three",
            pergunta: "Como funcionam os monopólios e a rede dos Big Three?",
            resposta:
              "BlackRock, Vanguard e State Street controlam participações simultâneas em corporações concorrentes. O portal exibe grafo interativo em Canvas e índice HHI.",
            link: { href: "/empresas/conglomerados", texto: "Observatório de Monopólios & Grafo" },
            links: [
              { href: "https://www.sec.gov/edgar", texto: "SEC EDGAR Estados Unidos" },
              { href: "/empresas", texto: "Observatório Geral de Empresas" },
            ],
          },
          {
            id: "executivos-conselhos-interlocking",
            pergunta: "O que são diretorias entrelaçadas e interlocking directorates nas empresas?",
            resposta:
              "Ocorre quando os mesmos conselheiros atuam simultaneamente em múltiplas empresas parceiras. O portal mapeia 143 executivos e conselhos das maiores corporações.",
            link: { href: "/empresas/executivos", texto: "Painel de Executivos & Conselhos" },
            links: [
              { href: "https://www.gov.br/cvm", texto: "Comissão de Valores Mobiliários (CVM)" },
              { href: "/empresas/conglomerados", texto: "Rede de Monopólios e Controle" },
            ],
          },
          {
            id: "ameacas-socioambientais-americas",
            pergunta: "Quais são as principais espécies, rios e serras ameaçados nas Américas?",
            resposta:
              "O portal mapeia 90 ameaças críticas em todo o continente americano. Reúne espécies em extinção, bacias hídricas contaminadas e territórios tradicionais vulnerabilizados.",
            link: { href: "/ambiental/ameacas-americas", texto: "Ameaças Socioambientais das Américas" },
            links: [
              { href: "https://www.icmbio.gov.br", texto: "ICMBio Livro Vermelho da Fauna" },
              { href: "https://www.iucnredlist.org", texto: "IUCN Red List of Threatened Species" },
            ],
          },
          {
            id: "barragens-mundiais-rejeitos-energia",
            pergunta: "Onde consultar o monitoramento global de grandes barragens e rejeitos?",
            resposta:
              "O portal cataloga 62 megabarragens mundiais de mineração, energia e abastecimento. Dados integrados ao Globo 3D com fontes da ANM e ICOLD.",
            link: { href: "/ambiental/barragens-globais", texto: "Acervo de Grandes Barragens Mundiais" },
            links: [
              { href: "/terras/globo", texto: "Globo 3D Terras (Camada de Barragens)" },
              { href: "https://www.icold-cigb.org", texto: "ICOLD — World Register of Dams" },
            ],
          },
          {
            id: "conflitos-socioambientais-globais",
            pergunta: "Como auditar conflitos socioambientais e violações corporativas no mundo?",
            resposta:
              "Mapeamos 55 conflitos socioambientais emblemáticos com dados do EJAtlas internacional. Apresenta empresas rés, commodities envolvidas, comunidades afetadas e ações judiciais.",
            link: { href: "/ambiental/conflitos-globais", texto: "Conflitos Socioambientais Mundiais" },
            links: [
              { href: "https://ejatlas.org", texto: "EJAtlas — Global Atlas of Environmental Justice" },
              { href: "https://www.globalwitness.org", texto: "Global Witness — Defensores da Terra" },
            ],
          },
          {
            id: "crise-climatica-poluidores-g20",
            pergunta: "Quais são os maiores emissores e poluidores industriais do planeta?",
            resposta:
              "O acervo reúne o balanço de gases do G20 e vinte mega-poluidores. Cruza dados do Climate TRACE, IPCC e anomalias térmicas do Copernicus.",
            link: { href: "/ambiental/crise-climatica", texto: "Observatório da Crise Climática Global" },
            links: [
              { href: "https://climatetrace.org", texto: "Climate TRACE Emissões Globais" },
              { href: "https://climate.copernicus.eu", texto: "Copernicus Climate Change Service" },
            ],
          },
        ],
      },
      {
        id: "sistema-de-justica",
        titulo: "Sistema de Justiça (TJMG, MPMG, DPMG)",
        perguntas: [
          {
            id: "orcamento-justica",
            pergunta: "Quanto custa o Judiciário de Minas Gerais?",
            resposta:
              "O TJMG consome R$ 14,96 bilhões e o MPMG R$ 4,09 bilhões anuais, com grande parcela em verbas indenizatórias e benefícios.",
            link: { href: "/judiciario/instituicoes", texto: "Fichas da Justiça MG" },
          },
          {
            id: "defensoria-deficit",
            pergunta: "Por que a Defensoria Pública está ausente de 176 comarcas?",
            resposta:
              "Com orçamento 14 vezes menor que o Tribunal de Justiça, a DPMG não dispõe de defensores suficientes para atender a população carente em todo o estado.",
            link: { href: "/judiciario/instituicoes/dpmg", texto: "Déficit da Defensoria" },
          },
          {
            id: "varas-e-gabinetes",
            pergunta: "Como falar diretamente com uma Vara, Fórum ou Balcão Virtual da Justiça?",
            resposta:
              "O Guia de Varas e Gabinetes mapeia 990 unidades e 298 comarcas de Minas Gerais com telefones com DDD, e-mails institucionais, juízes titulares, endereços com CEP e link do Balcão Virtual.",
            link: { href: "/judiciario/contatos", texto: "Guia de Varas, Gabinetes e Balcão Virtual" },
          },
          {
            id: "vagas-indicacoes-quinto",
            pergunta: "Como funciona a escolha de desembargadores pelo Quinto Constitucional?",
            resposta:
              "O painel de Vagas e Indicações acompanha a formação de listas tríplices e indicações de advogados e membros do MP para tribunais de 2ª instância.",
            link: { href: "/judiciario/vagas", texto: "Vagas e Indicações nos Tribunais" },
          },
          {
            id: "inspecoes-presidios-cnj",
            pergunta: "Como consultar os relatórios de inspeções prisionais e superlotação?",
            resposta:
              "Painel com dados do Conselho Nacional de Justiça (CNJ) sobre capacidade, ocupação, mortes sob custódia e condições estruturais de presídios.",
            link: { href: "/judiciario/presidios", texto: "Inspeções Prisionais & Presídios" },
          },
          {
            id: "correicoes-trabalhistas-escravo",
            pergunta: "Onde consultar fiscalizações de trabalho análogo à escravidão e correições?",
            resposta:
              "Relatórios de correições ordinárias dos Tribunais Regionais do Trabalho (TRTs) e operações de resgate de trabalhadores em condições análogas à escravidão.",
            link: { href: "/judiciario/correicoes-trabalhistas", texto: "Correições Trabalhistas" },
          },
          {
            id: "instituicoes-27-estados",
            pergunta: "Onde consultar o orçamento e cúpula dos Tribunais e MPs dos 27 estados?",
            resposta:
              "O painel de Instituições de Justiça cobre Tribunais de Justiça (TJs), Ministérios Públicos (MPs) e Defensorias Públicas de todos os 27 estados brasileiros com orçamentos e organogramas.",
            link: { href: "/judiciario/instituicoes", texto: "Painel das Instituições dos 27 Estados" },
          },
          {
            id: "sirenejud-processos",
            pergunta: "O que é o painel SIRENEJud de processos ambientais?",
            resposta:
              "Banco de dados do CNJ com georreferenciamento de crimes ambientais e ações civis públicas em todo o território nacional.",
            link: { href: "/judiciario/sirenejud", texto: "SIRENEJud do CNJ" },
          },
        ],
      },
      {
        id: "congresso-nacional",
        titulo: "Congresso Nacional & Bancadas",
        perguntas: [
          {
            id: "agenda-comissoes-congresso",
            pergunta: "Quais projetos de lei estão na pauta das comissões temáticas?",
            resposta:
              "Acompanhe a agenda diária de votações e reuniões das comissões da Câmara e do Senado que tratam de mineração, meio ambiente e tributação.",
            link: { href: "/congresso/agenda", texto: "Agenda & Comissões do Congresso" },
          },
          {
            id: "gastos-ceap",
            pergunta: "Como fiscalizar os gastos dos deputados com a CEAP?",
            resposta:
              "Consulte reembolsos de passagens, alimentação e combustível declarados na Cota para Exercício da Atividade Parlamentar.",
            link: { href: "/congresso/parlamentares", texto: "Gastos dos Congressistas" },
          },
          {
            id: "votacoes-bancadas",
            pergunta: "Onde ver as votações nominais dos parlamentares?",
            resposta:
              "Acompanhe o voto de cada deputado em matérias de orçamento, saúde, educação e meio ambiente.",
            link: { href: "/congresso/votacoes", texto: "Votações Nominais" },
          },
          {
            id: "assembleias-legislativas-27",
            pergunta: "Como fiscalizar as 27 Assembleias Legislativas estaduais?",
            resposta:
              "O hub das Assembleias cobre as 27 Casas Legislativas. Traz deputados estaduais, comissões e projetos de interesse social.",
            link: { href: "/assembleias", texto: "Assembleias Legislativas dos Estados" },
            links: [
              { href: "/congresso", texto: "Congresso Nacional" },
              { href: "/fontes-estados", texto: "Fontes dos 27 Estados" },
            ],
          },
          {
            id: "tramitacao-legislativa-tabela",
            pergunta: "Como pesquisar a tramitação de projetos de lei por tema, data e autor?",
            resposta:
              "Consulte a tabela interativa das 27 Assembleias e do Congresso. Filtre por tema, data de protocolo, aprovação e autor.",
            link: { href: "/assembleias", texto: "Tabela das Assembleias Estaduais" },
            links: [
              { href: "/congresso/proposicoes", texto: "Proposições do Congresso" },
              { href: "/assembleias/sp", texto: "Proposições de SP (ALESP)" },
              { href: "/assembleias/mg", texto: "Proposições de MG (ALMG)" },
            ],
          },
        ],
      },
      {
        id: "comunicabr-repasses",
        titulo: "Repasses Federais (ComunicaBR)",
        perguntas: [
          {
            id: "repasses-853-municipios",
            pergunta: "Quanto o governo federal repassa aos 853 municípios de MG?",
            resposta:
              "O painel ComunicaBR mapeia R$ 139 bilhões em transferências da União para Bolsa Família, SUS, Fundeb e BPC em cada cidade mineira.",
            link: { href: "/dados/comunicabr", texto: "ComunicaBR — Repasses Federais" },
          },
        ],
      },
    ],
  },
  {
    id: "central",
    titulo: "Central ONSA & Blog",
    descricao: "Investigações jornalísticas com dados abertos, Biblioteca de Crimes Socioambientais e acessibilidade.",
    categorias: [
      {
        id: "noticias-relatorios",
        titulo: "Blog & Relatórios Cívicos",
        perguntas: [
          {
            id: "reportagens-onsa",
            pergunta: "Onde ver as reportagens investigativas do portal?",
            resposta:
              "O portal publica matérias aprofundadas com auditoria de compras públicas, royalties de mineração e acordos de barragens.",
            link: { href: "/noticias", texto: "Ver blog e relatórios" },
          },
          {
            id: "verificar-fontes",
            pergunta: "Como checar as fontes oficiais de cada matéria?",
            resposta:
              "Cada matéria traz a caixa 'Recomendação para verificar' com links diretos para portais de transparência, PNCP e Diários Oficiais.",
            link: { href: "/noticias", texto: "Explorar reportagens" },
          },
        ],
      },
      {
        id: "biblioteca-crimes",
        titulo: "Biblioteca de Crimes Socioambientais",
        perguntas: [
          {
            id: "acervo-936-docs",
            pergunta: "O que tem na Biblioteca Unificada de Crimes de Barragens?",
            resposta:
              "Mais de 930 laudos periciais, termos de ajustamento de conduta, auditorias da FGV e relatórios da Fiocruz sobre Mariana e Brumadinho.",
            link: { href: "/ambiental/crimes-socioambientais", texto: "Biblioteca de Crimes Socioambientais" },
          },
        ],
      },
      {
        id: "biblioteca-geral",
        titulo: "Biblioteca Geral & Pesquisa Acadêmica",
        perguntas: [
          {
            id: "acervo-unificado",
            pergunta: "Como acessar teses e documentos de pesquisa no portal?",
            resposta:
              "A nova Biblioteca Geral reúne mais de 870 documentos, incluindo relatórios corporativos ESG, atas de 91 órgãos de justiça e artigos acadêmicos do SciELO, UFMG, UFV, UnB, Fiocruz, USP e IPEA.",
            link: { href: "/biblioteca", texto: "Ir para a Biblioteca Geral" },
          },
          {
            id: "teses-mineracao-litio",
            pergunta: "Onde encontrar pesquisas sobre a Vale e o lítio da Sigma?",
            resposta:
              "Na Biblioteca Geral e nas páginas de cada empresa (/empresas/vale e /empresas/sigma-lithium) há uma seção dedicada com teses de doutorado, dissertações e notas técnicas do Inesc, Fiocruz e universidades federais com link para o PDF.",
            link: { href: "/biblioteca", texto: "Ver pesquisas de mineração" },
          },
          {
            id: "consulta-previa-oit",
            pergunta: "Onde consultar materiais sobre Consulta Prévia e Convenção 169?",
            resposta:
              "Temos teses da UnB, manuais do Instituto Socioambiental (ISA) e artigos da FGV Direito sobre a jurisprudência do STF e os Protocolos Autônomos de Consulta de povos indígenas e tradicionais.",
            link: { href: "/biblioteca", texto: "Ver teses sobre Consulta Prévia" },
          },
          {
            id: "justica-27-estados",
            pergunta: "Como consultar os relatórios dos Tribunais de Justiça e MPs dos 27 estados?",
            resposta:
              "No painel do Judiciário (/judiciario/instituicoes) e na Biblioteca Geral catalogamos os relatórios de gestão fiscal (RGF), quadro de pessoal e inspeções de todos os 27 TJs, 27 Ministérios Públicos e 27 Defensorias do Brasil.",
            link: { href: "/judiciario/instituicoes", texto: "Ver 27 Estados" },
          },
        ],
      },
      {
        id: "tecnologia-e-metodologia",
        titulo: "Tecnologia Livre & Metodologia Cívica",
        perguntas: [
          {
            id: "tecnologia-ia-popular",
            pergunta: "Como funciona a inteligência artificial do Seu Nonô e a tecnologia do portal?",
            resposta:
              "O Seu Nonô utiliza arquitetura RAG (Recuperação Aumentada por Geração) com busca vetorial e lexical sobre acervos públicos oficiais, conectando modelos avançados a dados cívicos 100% auditáveis e com citação ABNT obrigatória.",
            link: { href: "/tecnologia", texto: "Tecnologia Livre & IA Cívica" },
          },
          {
            id: "transparencia-privacidade-lgpd",
            pergunta: "Como o portal protege a privacidade e cumpre a regra de Zero Dado Pessoal?",
            resposta:
              "Seguimos diretrizes de Transparência Internacional com varredura contínua de CPF e segredos, validação matemática por mod-11 e anonimização de dados protegidos pela LGPD.",
            link: { href: "/transparencia-internacional", texto: "Metodologia & Transparência Internacional" },
          },
        ],
      },
      {
        id: "acessibilidade-sobre",
        titulo: "Acessibilidade & Sobre o Portal",
        perguntas: [
          {
            id: "comandos-voz-acessibilidade",
            pergunta: "Quais comandos de acessibilidade posso usar com o Seu Nonô?",
            resposta:
              "Digite ou fale: 'tema escuro', 'tema claro', 'tema pequi', 'alto contraste', 'aumentar texto', 'diminuir texto' ou 'cores daltônicas'.",
            link: { href: "/sobre", texto: "Recursos de Acessibilidade" },
          },
          {
            id: "codigo-aberto-licenca",
            pergunta: "O portal tem código aberto?",
            resposta:
              "Sim. Todo o código e os coletores são públicos e auditáveis, construídos para o fortalecimento da cidadania e da transparência pública.",
            link: { href: "/sobre", texto: "Sobre o Controle Popular" },
          },
        ],
      },
      {
        id: "laboratorio-e-analise",
        titulo: "Laboratório de Dados, PowerBI & Árvore de Conexões",
        perguntas: [
          {
            id: "laboratorio-powerbi-camadas",
            pergunta: "Como comparar dois conjuntos de dados em gráficos dither no Laboratório?",
            resposta:
              "O Laboratório reúne 23 camadas ativáveis estilo PowerBI. Você escolhe duas bases e compara contratos, royalties, saúde ou barragens lado a lado em gráficos acessíveis.",
            link: { href: "/laboratorio", texto: "Abrir Laboratório de Dados" },
          },
          {
            id: "arvore-obsidian-conexoes",
            pergunta: "Como navegar pela Árvore de Conexões do portal no estilo Obsidian?",
            resposta:
              "A Árvore de Conexões interativa (/laboratorio/arvore) mapeia os 4 eixos, 199 cidades e mineradoras em nós e arestas. Você pode aplicar zoom, arrastar nós e inspecionar relações cívicas.",
            link: { href: "/laboratorio/arvore", texto: "Ver Árvore de Conexões (Obsidian)" },
          },
        ],
      },
      {
        id: "editais-e-fontes-estados",
        titulo: "Radar de Editais, Estudos Rurais & Fontes dos 27 Estados",
        perguntas: [
          {
            id: "radar-editais-diario-oficial",
            pergunta: "Como funciona o Radar de Editais do Diário Oficial de MG?",
            resposta:
              "O Radar varre o Diário Oficial diariamente e reúne 50+ certames de interesse social (saúde, educação, obras e leilões) com filtros por órgão e download em CSV.",
            link: { href: "/editais", texto: "Radar de Editais" },
          },
          {
            id: "estudos-rurais-jequitinhonha-mucuri",
            pergunta: "Onde encontrar estudos sobre agricultura familiar, reforma agrária e agroecologia?",
            resposta:
              "A seção de Estudos Rurais reúne pesquisas do PPGER/UFVJM, notas técnicas sobre assentamentos e dados de produção camponesa nos Vales do Jequitinhonha e Mucuri.",
            link: { href: "/estudos-rurais", texto: "Acervo de Estudos Rurais" },
          },
          {
            id: "fontes-dados-27-estados",
            pergunta: "Onde consultar os portais de transparência dos 27 estados brasileiros?",
            resposta:
              "O catálogo reúne links diretos dos portais de dados abertos, controladorias, assembleias e tribunais de contas de todas as 27 unidades da federação.",
            link: { href: "/fontes-estados", texto: "Catálogo dos 27 Estados" },
          },
        ],
      },
      {
        id: "consumo-corporativo-mg-g20",
        titulo: "Maiores Consumidores de Água, Energia, Combustível e Empregos (MG e G20)",
        perguntas: [
          {
            id: "top50-consumidores-mg",
            pergunta: "Quem são os maiores consumidores de água e energia em Minas Gerais?",
            resposta:
              "O painel lista as 50 maiores operações corporativas com dados do IGAM, ANA e CCEE.",
            link: { href: "/consumo-corporativo", texto: "Ranking Top 50 MG e G20" },
            links: [
              { href: "https://www.snirh.gov.br/cnarh/", texto: "Fonte Oficial ANA CNARH" },
              { href: "https://dadosabertos.ccee.org.br/", texto: "Fonte Oficial CCEE" },
            ],
          },
          {
            id: "tarifa-empresa-vs-cidadao",
            pergunta: "Quanto uma grande empresa paga pela água e luz comparada ao cidadão?",
            resposta:
              "O cidadão paga até 318 vezes mais pela água tratada e 4,5 vezes mais pela luz.",
            link: { href: "/consumo-corporativo", texto: "Ver Assimetria Tarifária" },
          },
          {
            id: "pegada-hidrica-empregos-cnae",
            pergunta: "Quais setores geram mais empregos por litro de água consumido?",
            resposta:
              "O comércio e a indústria automotiva geram muito mais empregos por água que a mineração.",
            link: { href: "/consumo-corporativo", texto: "Ver Pegada Hídrica e CNAE" },
          },
        ],
      },
    ],
  },
];

export interface PaginaDados {
  id: string;
  titulo: string;
  resumo: string;
  dados: string[];
  links: SeuNonoLink[];
}

export const PAGINAS_DADOS: PaginaDados[] = [
  {
    id: "betim-prefeitura",
    titulo: "Betim — Prefeitura",
    resumo: "Dados da prefeitura de Betim: contratos, despesas, licitações, servidores e obras públicas.",
    dados: [
      "Contratos públicos com valor, fornecedor e alertas de concentração",
      "Despesas por função e subfunção orçamentária",
      "Licitações abertas e seus editais",
      "Fornecedores com valor total e número de contratos",
      "Servidores públicos com vínculos e órgãos (respeitando LGPD)",
      "Obras públicas com contratos e situação",
    ],
    links: [
      { href: "/betim/prefeitura/contratos", texto: "Contratos" },
      { href: "/betim/prefeitura/despesas", texto: "Despesas" },
      { href: "/betim/prefeitura/fornecedores", texto: "Fornecedores" },
      { href: "/betim/prefeitura/servidores", texto: "Servidores" },
    ],
  },
  {
    id: "betim-camara",
    titulo: "Betim — Câmara",
    resumo: "Dados da Câmara Municipal de Betim: vereadores, votações, legislação e proposições.",
    dados: [
      "Vereadores com dados de contato e histórico",
      "Votações de matérias legislativas",
      "Legislação municipal (leis, decretos)",
      "Proposições em tramitação",
    ],
    links: [
      { href: "/betim/camara", texto: "Câmara & Vereadores" },
      { href: "/betim/camara/votacoes", texto: "Votações" },
      { href: "/betim/camara/legislacao", texto: "Legislação" },
    ],
  },
  {
    id: "diamantina",
    titulo: "Diamantina",
    resumo: "Dados de Diamantina-MG: Diário Oficial com 16.601 atos coletados, contratos, licitações e legislação.",
    dados: [
      "Diário Oficial: 16.601 atos de janeiro/2020 a julho/2026",
      "Contratos públicos com valor e fornecedor",
      "Licitações e editais",
      "Legislação municipal",
    ],
    links: [
      { href: "/diamantina/indice", texto: "Índice de Diamantina" },
      { href: "/diamantina/prefeitura/diario", texto: "Diário Oficial" },
    ],
  },
  {
    id: "bh",
    titulo: "Belo Horizonte",
    resumo: "Dados de BH: Diário Oficial (coletor DOM-PBH pronto, aguarda DB), contratos, licitações.",
    dados: [
      "Diário Oficial: coletor escrito (1.814 atos em agosto/2026)",
      "Contratos públicos",
      "Licitações e editais",
    ],
    links: [
      { href: "/bh/indice", texto: "Índice de BH" },
    ],
  },
  {
    id: "congresso",
    titulo: "Congresso Nacional",
    resumo: "Dados do Congresso: proposições, votações, comissões, bancadas e parlamentares.",
    dados: [
      "Proposições federais (PL, PLP, PEC) com tramitação",
      "Votações nominais e simbólicas",
      "Comissões permanentes e especiais",
      "Bancadas e composição do Congresso",
      "Parlamentares com dados de votação e presença",
      "Alertas de projetos que afetam cidades",
    ],
    links: [
      { href: "/congresso/proposicoes", texto: "Proposições" },
      { href: "/congresso/votacoes", texto: "Votações" },
      { href: "/congresso/bancadas", texto: "Bancadas" },
      { href: "/congresso/alertas", texto: "Alertas" },
    ],
  },
  {
    id: "judiciario",
    titulo: "Judiciário",
    resumo: "Dados do Judiciário: tribunais, indicações, vagas, inspeções, presídios e SIRENEJud.",
    dados: [
      "Tribunais estaduais e federais de MG",
      "Indicações de desembargadores e juízes",
      "Vagas em tribunais",
      "Inspeções em presídios",
      "Defensoria Pública",
      "SIRENEJud: processos ambientais do CNJ",
    ],
    links: [
      { href: "/judiciario/tribunais", texto: "Tribunais" },
      { href: "/judiciario/sirenejud", texto: "SIRENEJud" },
      { href: "/judiciario/presidios", texto: "Presídios" },
    ],
  },
  {
    id: "ambiental",
    titulo: "ONSA",
    resumo: "Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, legislação, Justiça, Mariana e a Vale.",
    dados: [
      "COPAM: conselho estadual de meio ambiente",
      "Licenciamento ambiental: 19.000+ empreendimentos em MG",
      "Barragens: classificação de risco e monitoramento",
      "Legislação ambiental estadual e federal",
      "TACs (Termos de Ajustamento de Conduta)",
      "Convênios e estudos ambientais",
    ],
    links: [
      { href: "/ambiental/barragens", texto: "Barragens" },
      { href: "/ambiental/licenciamento", texto: "Licenciamento" },
      { href: "/ambiental/copam", texto: "COPAM" },
    ],
  },
  {
    id: "paraopeba",
    titulo: "Paraopeba (Brumadinho)",
    resumo: "Dados do rompimento da barragem de Brumadinho: reparação, acordo, auditoria, perícia e biblioteca.",
    dados: [
      "Acordo de Brumadinho: execução e metas",
      "Auditoria independente AECOM: 467 documentos, 16 eixos",
      "Perícia judicial UFMG: 7 documentos técnicos",
      "ATIs: 645 documentos de assessorias técnicas",
      "Auxílio emergencial: 434 beneficiários",
      "Barragens SIGBM: 320 estruturas monitoradas",
      "Cotações VALE3 e notícias da Vale",
    ],
    links: [
      { href: "/paraopeba/entenda", texto: "Entenda o caso" },
      { href: "/paraopeba/execucao", texto: "Execução do Acordo" },
      { href: "/paraopeba/analise", texto: "Análise integrada" },
      { href: "/paraopeba/biblioteca", texto: "Biblioteca ATI" },
    ],
  },
  {
    id: "terras",
    titulo: "Terra e território",
    resumo: "Dados territoriais: mapa 3D com camadas de mineração, CAR, processos ambientais e alertas.",
    dados: [
      "Mapa 3D interativo com camadas",
      "Mineração: concessões e áreas exploradas",
      "CAR (Cadastro Ambiental Rural)",
      "Processos ambientais do CNJ (SIRENEJud)",
      "Alertas territoriais",
    ],
    links: [
      { href: "/funcaosocialterra/mapa", texto: "Mapa 3D" },
      { href: "/funcaosocialterra/alertas", texto: "Alertas" },
    ],
  },
  {
    id: "direitos",
    titulo: "Direitos em Movimento",
    resumo: "Onde buscar ajuda, como se defender, canais de denúncia e proteção de direitos.",
    dados: [
      "Canais de denúncia por tipo de violação",
      "Assistência jurídica e social",
      "Proteção de direitos trabalhistas",
      "Direitos de idosos, crianças e mulheres",
      "Defesa do consumidor",
    ],
    links: [
      { href: "/direitos-em-movimento/denuncia", texto: "Quero denunciar" },
      { href: "/direitos-em-movimento/ajuda", texto: "Preciso de ajuda" },
    ],
  },
  {
    id: "noticias",
    titulo: "Blog & Relatórios",
    resumo: "Investigações cívicas, auditoria de compras públicas e monitoramento socioambiental do ONSA.",
    dados: [
      "13 reportagens investigativas cobrindo todas as frentes do portal",
      "Cruzamento do PNCP, SIGBM, ANM, IBAMA e Diários Oficiais",
      "Auditoria de contratos de Betim, Araçuaí e Itinga",
      "Rastreamento de royalties da mineração (CFEM) e projetos de lítio",
      "Caixa de citação científica em formatos ABNT e BibTeX",
      "Seção 'Recomendação para verificar' com links de fontes oficiais",
    ],
    links: [
      { href: "/noticias", texto: "Ver blog e relatórios" },
    ],
  },
  {
    id: "biblioteca",
    titulo: "Biblioteca Geral & Acervo Acadêmico",
    resumo: "878 documentos e relatórios: ESG de empresas, 91 órgãos de justiça e artigos científicos SciELO e teses de pós-graduação.",
    dados: [
      "Acervo Geral com 878 documentos oficiais e acadêmicos",
      "Pesquisas SciELO, UFMG, UFV, UnB, Fiocruz, USP e IPEA",
      "Teses sobre Vale, Brumadinho, Sigma Lithium e Vale do Jequitinhonha",
      "Estudos sobre Protocolo de Consulta Prévia (Convenção 169 OIT)",
      "Relatórios de Gestão das 91 instituições de justiça dos 27 estados",
      "Download de planilhas CSV com UTF-8 BOM e ponto-e-vírgula",
    ],
    links: [
      { href: "/biblioteca", texto: "Acessar Biblioteca Geral" },
      { href: "/judiciario/instituicoes", texto: "Painel dos 27 Estados" },
    ],
  },
  {
    id: "governo-hub",
    titulo: "Governo: Prometeu? Cumpriu?",
    resumo: "Fiscalização de promessas de campanha e metas dos 27 governos estaduais e capitais.",
    dados: [
      "Metas de governo por eixo: saúde, educação, segurança e meio ambiente",
      "Monitoramento de cumprimento de diretrizes orçamentárias",
      "Fichas individuais por estado (MG, SP, RJ, BA, etc.)",
      "Download de relatórios comparativos em CSV",
    ],
    links: [
      { href: "/governo", texto: "Governo: Prometeu? Cumpriu?" },
    ],
  },
  {
    id: "instituicoes-publicas",
    titulo: "Organogramas & Lideranças Públicas",
    resumo: "Estrutura hierárquica, cargos e remunerações de ministérios, agências reguladoras e secretarias.",
    dados: [
      "Organogramas da administração direta e indireta",
      "Cúpula das agências: ANM, ANA, ANTT, IBAMA, ICMBio",
      "Histórico de nomeações e atos oficiais",
      "Fichas institucionais detalhadas por sigla",
    ],
    links: [
      { href: "/instituicoes", texto: "Painel de Instituições" },
    ],
  },
  {
    id: "empresas-mineradoras",
    titulo: "Grandes Empresas & Mineradoras",
    resumo: "Monitoramento de grandes corporações, mineradoras (Vale, Sigma, CSN, Gerdau, Samarco, BHP) e fundos de investimento.",
    dados: [
      "Estrutura acionária (BlackRock, Capital Group, Previ)",
      "Relatórios de sustentabilidade e balanços ESG",
      "Passivos judiciais e crimes socioambientais",
      "Arrecadação de royalties minerais (CFEM)",
    ],
    links: [
      { href: "/empresas", texto: "Painel de Empresas" },
    ],
  },
  {
    id: "ambiental-rios-serras",
    titulo: "Nossos Rios, Serras & Patrimônio Cultural",
    resumo: "Qualidade da água das 7 bacias de MG, proteção de serras de recarga e acervo do patrimônio tombado.",
    dados: [
      "Monitoramento hídrico das bacias do Velhas, Doce, Paraopeba e São Francisco",
      "Áreas de recarga e aquíferos (Gandarela, Moeda, Curral)",
      "1.800+ bens tombados pelo IEPHA e IPHAN em risco",
      "Litígios climáticos e ações de adaptação urbana",
    ],
    links: [
      { href: "/ambiental/nossos-rios", texto: "Nossos Rios" },
      { href: "/ambiental/nossas-serras", texto: "Nossas Serras" },
      { href: "/ambiental/patrimonio-cultural", texto: "Patrimônio Cultural" },
      { href: "/ambiental/litigios-climaticos", texto: "Litígios Climáticos" },
    ],
  },
  {
    id: "ambiental-legislacao-tacs",
    titulo: "Legislação Ambiental, TACs & Precedentes LAI",
    resumo: "20.000 normas ambientais, Termos de Ajustamento de Conduta do IBAMA e decisões de recursos da LAI.",
    dados: [
      "Catálogo completo de legislação ambiental estadual e federal",
      "TACs do IBAMA com valores de multas e recuperação de áreas",
      "Jurisprudência e decisões da CGU sobre negativas de acesso à informação",
      "Relatórios de violações de direitos humanos e conflitos no campo",
    ],
    links: [
      { href: "/ambiental/legislacao", texto: "Legislação Ambiental" },
      { href: "/ambiental/tac", texto: "TACs do IBAMA" },
      { href: "/ambiental/decisoes-lai", texto: "Decisões LAI" },
      { href: "/ambiental/direitos-humanos", texto: "Direitos Humanos" },
    ],
  },
  {
    id: "tecnologia-e-transparencia",
    titulo: "Tecnologia Livre & Integridade",
    resumo: "Infraestrutura soberana de IA com modelos abertos, regras de Zero-Secret e respeito rigoroso à LGPD.",
    dados: [
      "Arquitetura RAG com busca vetorial e modelos via API/local para assistência cívica",
      "Varredura contínua de CPF e segredos via mod-11",
      "Código aberto e coletores auditáveis no GitHub",
      "Alinhamento às diretrizes de integridade da Transparência Internacional",
    ],
    links: [
      { href: "/tecnologia", texto: "Tecnologia Livre" },
      { href: "/transparencia-internacional", texto: "Transparência Internacional" },
    ],
  },
  {
    id: "vales-jequitinhonha-mucuri",
    titulo: "Vales do Jequitinhonha e Mucuri",
    resumo: "Contexto socioambiental e fiscalização dos 82 municípios dos Vales do Jequitinhonha e Mucuri: polo do lítio, compras no PNCP, terras indígenas Maxakali e regras de transparência.",
    dados: [
      "82 municípios mapeados com dados do IBGE, PNCP e FUNAI",
      "Polo do Lítio no Médio Jequitinhonha: Araçuaí, Itinga e Coronel Murta",
      "Vale do Mucuri: 27 municípios e proteção às terras indígenas Maxakali",
      "Compras públicas e contratos municipais via PNCP com links auditáveis",
      "As 6 regras de qualidade: fonte direta, buscável, filtrável, microresumo, chatbot e tags",
      "Recursos hídricos e compensação financeira mineral (CFEM)",
    ],
    links: [
      { href: "/busca", texto: "Buscar nos municípios dos vales" },
      { href: "https://pncp.gov.br", texto: "Portal Nacional de Contratações Públicas" },
    ],
  },
  {
    id: "laboratorio-powerbi",
    titulo: "Laboratório de Dados & PowerBI",
    resumo: "Explorador analítico com 23 camadas ativáveis, gráficos dither, comparador municipal e Árvore de Conexões estilo Obsidian.",
    dados: [
      "23 camadas analíticas ativáveis: barragens, orçamentos, PNCP, leitos e royalties",
      "Comparador de cidades lado a lado com gráficos acessíveis",
      "Visualização de Grafo em Árvore de Conexões interativa (/laboratorio/arvore)",
      "Exportação de dados em CSV com BOM UTF-8 e ponto-e-vírgula",
    ],
    links: [
      { href: "/laboratorio", texto: "Laboratório de Dados" },
      { href: "/laboratorio/arvore", texto: "Árvore de Conexões (Obsidian)" },
      { href: "/laboratorio/comparador", texto: "Comparador Municipal" },
      { href: "/laboratorio/graficos", texto: "Séries Históricas" },
    ],
  },
  {
    id: "editais-hub",
    titulo: "Radar de Editais & Licitações (DO-MG)",
    resumo: "Acompanhamento diário de certames públicos, compras emergenciais e chamamentos de interesse social em Minas Gerais.",
    dados: [
      "50+ editais e chamamentos públicos de interesse social catalogados diariamente",
      "Filtros por órgão estadual (SES, SEE, Seinfra, DER), situação e modalidade",
      "Links diretos para editais e anexos no Diário Oficial de MG",
      "Exportação completa da base em CSV",
    ],
    links: [
      { href: "/editais", texto: "Painel de Editais" },
      { href: "/estado-e-economia/compras", texto: "Compras no PNCP" },
    ],
  },
  {
    id: "estudos-rurais",
    titulo: "Estudos Rurais e Territoriais",
    resumo: "Acervo acadêmico e comunitário sobre reforma agrária, comunidades quilombolas e produção camponesa nos Vales.",
    dados: [
      "Pesquisas em parceria com o PPGER/UFVJM e universidades federais",
      "Mapeamento de assentamentos e agricultura familiar no Jequitinhonha e Mucuri",
      "Dados fundiários e sobreposição territorial com o CAR",
      "Notas técnicas sobre agroecologia e soberania alimentar",
    ],
    links: [
      { href: "/estudos-rurais", texto: "Estudos Rurais" },
      { href: "/terra-e-territorios", texto: "Terra e Territórios" },
    ],
  },
  {
    id: "fontes-27-estados",
    titulo: "Fontes de Dados dos 27 Estados",
    resumo: "Diretório unificado de órgãos de controle, tribunais de contas, assembleias e dados abertos do Brasil.",
    dados: [
      "Portais de transparência e dados abertos das 27 unidades da federação",
      "Tribunais de Contas Estaduais (TCEs) e Ministérios Públicos (MPEs)",
      "Assembleias Legislativas e diários oficiais estaduais",
      "Sistemas de contratações públicas e consultas de processos",
    ],
    links: [
      { href: "/fontes-estados", texto: "Fontes por Estado" },
      { href: "/instituicoes", texto: "Organogramas & Lideranças" },
    ],
  },
  {
    id: "ambiental-condicionantes",
    titulo: "Condicionantes Ambientais de Barragens",
    resumo: "Auditoria do cumprimento de condicionantes das licenças prévias e TACs de grandes barragens em Minas Gerais.",
    dados: [
      "Piloto Irapé e Setúbal: status de evidência pública e links para pareceres técnicos",
      "Obrigações de reassentamento, monitoramento sísmico e recuperação vegetal",
      "Cruzamento com dados do SIGBM, FEAM e autos do COPAM",
      "Documentos comprobatórios auditáveis",
    ],
    links: [
      { href: "/ambiental/condicionantes", texto: "Condicionantes de Barragens" },
      { href: "/ambiental/barragens", texto: "Painel de Barragens" },
      { href: "/ambiental/licenciamento", texto: "Licenciamento Ambiental" },
    ],
  },
  {
    id: "rio-doce-mariana",
    titulo: "Acordo do Rio Doce (Mariana) — R$ 171 Bi",
    resumo: "Execução orçamentária da repactuação judicial de Mariana: repasses estaduais, obras de saneamento e indenizações.",
    dados: [
      "R$ 171 bilhões totais, sendo R$ 100 bilhões em dinheiro novo",
      "Repasses município a município na bacia do Rio Doce em MG e ES",
      "Obras estruturais de esgotamento sanitário, saúde e infraestrutura",
      "Fiscalização do cumprimento de prazos do acordo judicial",
    ],
    links: [
      { href: "/ambiental/mariana", texto: "Painel de Mariana" },
      { href: "/paraopeba/vale", texto: "Observatório Vale" },
    ],
  },
  {
    id: "comunicabr-federal",
    titulo: "ComunicaBR — Repasses Federais nos Municípios",
    resumo: "Transferências diretas da União para os 853 municípios de Minas Gerais em programas sociais, saúde e educação.",
    dados: [
      "R$ 139 bilhões auditados em transferências do Governo Federal em MG",
      "Detalhamento por Bolsa Família, SUS, Fundeb, BPC e Farmácia Popular",
      "Consulta instantânea por município ou código IBGE",
      "Exportação da série histórica",
    ],
    links: [
      { href: "/dados/comunicabr", texto: "ComunicaBR em MG" },
      { href: "/cidades", texto: "199 Cidades Estratégicas" },
    ],
  },
  {
    id: "instituicoes-justica-fichas",
    titulo: "Fichas do Judiciário (TJMG, MPMG, DPMG, TCEMG)",
    resumo: "Orçamentos, folhas de pagamento, penduricalhos e fiscalização externa dos órgãos de controle de Minas Gerais.",
    dados: [
      "TJMG: Orçamento de R$ 14,96 bi, auxílio-alimentação e produtividade",
      "MPMG: Orçamento de R$ 4,09 bi, verbas indenizatórias e promotorias",
      "DPMG: Orçamento de R$ 1,10 bi e mapa de déficit de defensores públicos",
      "TCEMG: Orçamento de R$ 1,15 bi e julgamento de contas municipais",
      "Guia com 990 varas, telefones, juízes e Balcão Virtual",
    ],
    links: [
      { href: "/judiciario/instituicoes", texto: "Quem Fiscaliza a Justiça" },
      { href: "/judiciario/instituicoes/tjmg", texto: "Ficha do TJMG" },
      { href: "/judiciario/instituicoes/mpmg", texto: "Ficha do MPMG" },
      { href: "/judiciario/instituicoes/dpmg", texto: "Ficha da DPMG" },
      { href: "/judiciario/instituicoes/tcemg", texto: "Ficha do TCEMG" },
      { href: "/judiciario/contatos", texto: "Varas & Balcão Virtual" },
    ],
  },
  {
    id: "canada-mineracao",
    titulo: "Canadá — Mineradoras no Brasil (TSX & TSXV)",
    resumo: "Acervo da Bolsa de Toronto: 12 mineradoras canadenses com operações de lítio e ouro, barragens e ouvidoria CORE.",
    dados: [
      "12 mineradoras canadenses com ativos em território brasileiro",
      "Projetos estratégicos de lítio no Vale do Jequitinhonha (Sigma e Lithium Ionic)",
      "Monitoramento de barragens de rejeitos e vistorias da ANM",
      "Canais de denúncia na ouvidoria de direitos humanos CORE do Canadá",
    ],
    links: [
      { href: "/canada/mineracao", texto: "Mineradoras do Canadá" },
      { href: "/canada", texto: "Hub Canadá & Brasil" },
      { href: "https://core-ombuds.canada.ca", texto: "Ouvidoria CORE" },
    ],
  },
  {
    id: "eua-empresas",
    titulo: "Estados Unidos — Corporações & Fundos na SEC",
    resumo: "Mercado de capitais norte-americano: formulários Form 20-F, 10-K, recibos ADR e fundos globais.",
    dados: [
      "Formulários anuais Form 20-F de multinacionais e recibos ADR na NYSE",
      "Grandes fundos globais e institucionais (BlackRock, Capital Group, Vanguard)",
      "Cruzamento com registros da CVM brasileira e compras públicas",
      "Monitoramento de contratos federais no USAspending.gov",
    ],
    links: [
      { href: "/eua/empresas", texto: "Corporações & Fundos SEC" },
      { href: "/eua", texto: "Hub EUA & Brasil" },
      { href: "https://www.sec.gov/edgar", texto: "SEC EDGAR" },
    ],
  },
  {
    id: "ambiental-autorizacoes",
    titulo: "Destinações de Imóveis da União em MG (SPU)",
    resumo: "Cadastro público dos imóveis da União em Minas Gerais, com destinação, classe, proprietário e área, auditável pela fonte oficial.",
    dados: [
      "553 imóveis da União em municípios mineiros",
      "Destinação e regime de uso de cada imóvel",
      "Classe, proprietário e área registrados",
      "Busca, filtros, ordenação e export CSV",
      "Fonte: SPU — Painel de Transparência Ativa",
    ],
    links: [
      { href: "/ambiental/autorizacoes", texto: "Imóveis da União em MG" },
      { href: "https://www.gov.br/gestao/pt-br/assuntos/patrimonio-da-uniao", texto: "SPU — Patrimônio da União" },
    ],
  },
  {
    id: "ambiental-ppp",
    titulo: "Concessões e PPPs de Minas Gerais",
    resumo: "Contratos do Estado de MG cujo objeto cita concessão ou parceria público-privada, com valor, vigência e concessionária.",
    dados: [
      "20 contratos ligados a concessão ou PPP em MG",
      "6 são a concessão em si; os demais são apoio, supervisão ou estudo",
      "Valor, vigência e concessionária de cada contrato",
      "Ressalva editorial separa o instrumento do contrato de apoio",
      "Fonte: Portal da Transparência de Minas Gerais",
    ],
    links: [
      { href: "/ambiental/ppp", texto: "Painel de Concessões e PPPs" },
      { href: "https://www.transparencia.mg.gov.br", texto: "Portal da Transparência MG" },
    ],
  },
  {
    id: "cidades-mg",
    titulo: "Municípios de Minas Gerais (IBGE)",
    resumo: "Lista completa dos 853 municípios de MG, com microrregiões e mesorregiões, e os 10 polos com população do Censo 2022.",
    dados: [
      "853 municípios de Minas Gerais catalogados pelo IBGE",
      "Busca em tempo real, microrregiões e mesorregiões",
      "10 polos regionais com população do Censo 2022",
      "Código IBGE canônico de 6 e 7 dígitos",
      "Fonte: API de Localidades do IBGE",
    ],
    links: [
      { href: "/cidades/mg", texto: "Municípios de Minas Gerais" },
      { href: "https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios", texto: "Fonte Oficial IBGE" },
    ],
  },
  {
    id: "mineracao-cavas",
    titulo: "Cavas de Mineração em Minas Gerais",
    resumo: "Série anual da mineração mapeada por satélite em MG e cruzamento de uma amostra de cavas com os polígonos da ANM, com camadas no globo 3D.",
    dados: [
      "Série anual de área de mineração nova em MG",
      "Amostra datada de cavas cruzada com polígonos da ANM",
      "Três estados: em operação, indício processual ou sem cadastro",
      "Camadas acesas no globo 3D, com link direto",
      "Fonte: MapBiomas (camada de mineração) e ANM",
    ],
    links: [
      { href: "/mineracao/cavas", texto: "Painel das Cavas" },
      { href: "/funcaosocialterra/mapa", texto: "Abrir Globo 3D" },
      { href: "/ambiental/barragens", texto: "Painel de Barragens SIGBM" },
    ],
  },
  {
    id: "assembleias",
    titulo: "Assembleias Legislativas dos Estados",
    resumo: "Monitoramento cidadão das 27 Casas Legislativas estaduais e distrital: deputados estaduais, comissões e proposições de interesse social.",
    dados: [
      "27 Assembleias Legislativas estaduais e distrital",
      "Deputados estaduais e composição da mesa diretora",
      "Proposições de lei e comissões temáticas",
      "Filtros por macrorregião e busca textual",
      "Fontes: portais oficiais das 27 Casas",
    ],
    links: [
      { href: "/assembleias", texto: "Hub das Assembleias" },
      { href: "/congresso", texto: "Congresso Nacional" },
      { href: "/fontes-estados", texto: "Fontes dos 27 Estados" },
    ],
  },
  {
    id: "internacional-multilateral",
    titulo: "Transparência Multilateral & Internacional",
    resumo: "Comparação cívica do Brasil com potências do G8 e G20 em IDH, desigualdade, saúde, educação, comércio de minérios e direitos territoriais.",
    dados: [
      "Indicadores sociais: IDH e índice de Gini (ONU/Banco Mundial)",
      "Gastos em saúde e educação comparados entre países",
      "Comércio internacional de minério, lítio e nióbio",
      "Terras indígenas e salvaguardas socioambientais",
      "Fontes: ONU/PNUD, UNESCO, OMS e OMC",
    ],
    links: [
      { href: "/internacional", texto: "Hub Multilateral" },
      { href: "/eua", texto: "Observatório dos EUA" },
      { href: "/canada", texto: "Observatório do Canadá" },
    ],
  },
  {
    id: "operacoes-militares-global",
    titulo: "Operações Militares, Contratos de Defesa e PMCs",
    resumo: "Mapeamento georreferenciado de 48 operações bélicas, deposições de regime, corporações mercenárias e contratos armamentistas globais.",
    dados: [
      "48 operações, intervenções, golpes e contratos militares geolocalizados",
      "Cobertura de potências norte-americanas, europeias e teatros globais",
      "Monitoramento de PMCs: faturamentos, efetivo e investigações de crimes",
      "Fontes oficiais: CRS, DoD, SIPRI, Nações Unidas e CIJ",
      "Mapa vetorial interativo com navegação bidirecional por ID",
    ],
    links: [
      { href: "/internacional/operacoes-militares", texto: "Acervo de Operações Militares" },
      { href: "/internacional/operacoes-militares/mapa", texto: "Mapa Mundial de Defesa" },
      { href: "/terras/globo", texto: "Globo 3D Terras (Camada Militar)" },
    ],
  },
  {
    id: "fortunas-mundiais",
    titulo: "1.000 Maiores Fortunas Mundiais",
    resumo: "Catálogo auditável das 1.000 maiores fortunas e dinastias mundiais, com ganho mensal estimado e equivalência social.",
    dados: [
      "1.000 fortunas acumulando US$ 13,39 trilhões de patrimônio líquido",
      "Rendimento mensal somado estimado em US$ 50,21 bilhões a cada 30 dias",
      "Equivalência social: sustento de 778,5 milhões de pessoas na extrema pobreza",
      "Filtros por pessoa física, dinastia familiar, país e setor econômico",
      "Fontes oficiais: WID.world, SEC EDGAR, CVM e Banco Mundial",
    ],
    links: [
      { href: "/empresas/fortunas", texto: "1.000 Maiores Fortunas Mundiais" },
      { href: "/empresas/conglomerados", texto: "Monopólios e Holdings" },
      { href: "/empresas/executivos", texto: "CEOs e Conselhos" },
    ],
  },
  {
    id: "orcamentos-globais",
    titulo: "Orçamentos Estratégicos de EUA, Canadá e Europa",
    resumo: "Auditoria comparativa dos 7 orçamentos estratégicos (Militar, Inteligência, Economia, P&D, Água, Energia e Clima) das potências do hemisfério norte.",
    dados: [
      "7 eixos orçamentários: Militar, Inteligência, Economia, P&D, Água, Energia e Clima",
      "EUA: US$ 842 bi em defesa e US$ 100 bi em inteligência",
      "União Europeia: € 326 bi em defesa e € 155 bi em ação climática",
      "Canadá: C$ 31 bi em defesa e metas de transição net-zero",
      "Fontes: OMB, DoD, Treasury, StatsCan, Eurostat e Comissão Europeia",
    ],
    links: [
      { href: "/internacional/orcamentos", texto: "Orçamentos Estratégicos" },
      { href: "/internacional", texto: "Hub Multilateral" },
      { href: "/eua", texto: "Observatório dos EUA" },
    ],
  },
  {
    id: "recursos-27-estados",
    titulo: "Recursos Públicos e Concessões dos 27 Estados",
    resumo: "Auditoria comparativa dos 27 estados em 5 eixos: outorgas de água, tarifas de energia, combustível de frota, PPPs e emendas parlamentares.",
    dados: [
      "751 mil interferências e 48,6 bi m³/ano de água outorgada (ANA/SNIRH)",
      "Assimetria tarifária elétrica: cidadão paga até 1,9x a tarifa industrial",
      "R$ 3,4 bilhões em compras públicas de combustível registradas no PNCP",
      "R$ 214,5 bilhões em contratos de PPP e concessões ativas (BNDES Hub)",
      "R$ 12,8 bilhões em emendas parlamentares votadas em 27 Assembleias",
    ],
    links: [
      { href: "/recursos/estados", texto: "Painel Recursos dos 27 Estados" },
      { href: "/assembleias", texto: "Assembleias Legislativas" },
      { href: "/consumo-corporativo", texto: "Consumo Corporativo MG & G20" },
    ],
  },
];
