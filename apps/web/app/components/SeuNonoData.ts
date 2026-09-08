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
            link: { href: "/direitos-em-movimento/moradia", texto: "Painel de Moradia" },
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
        titulo: "Acesso à Justiça & Denúncias",
        perguntas: [
          {
            id: "onde-buscar-ajuda",
            pergunta: "Onde buscar orientação jurídica e defensoria pública?",
            resposta:
              "O guia de ajuda lista defensorias, ouvidorias públicas e entidades da sociedade civil que prestam assistência jurídica gratuita.",
            link: { href: "/direitos-em-movimento/ajuda", texto: "Quem pode ajudar" },
          },
          {
            id: "fazer-denuncia",
            pergunta: "Como fazer uma denúncia popular com segurança?",
            resposta:
              "A página de denúncias reúne canais do Ministério Público, Tribunais de Contas e controladorias públicas.",
            link: { href: "/direitos-em-movimento/denuncia", texto: "Canais de Denúncia" },
          },
          {
            id: "pedir-lai",
            pergunta: "Como fazer um pedido de Lei de Acesso à Informação (LAI)?",
            resposta:
              "Veja o passo a passo para solicitar documentos e planilhas a prefeituras e órgãos públicos municipais e estaduais.",
            link: { href: "/direitos-em-movimento/informacao", texto: "Guia de Pedidos LAI" },
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
        id: "orcamento-e-compras",
        titulo: "Orçamento & Compras Públicas",
        perguntas: [
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
            id: "cfem-royalties",
            pergunta: "O que é CFEM e quanto as mineradoras pagam às cidades?",
            resposta:
              "A Compensação Financeira pela Exploração de Recursos Minerais (royalties da mineração) é mapeada nos municípios mineradores.",
            link: { href: "/noticias/itinga-transparencia-repasses-litio", texto: "Royalties de Mineração" },
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
    titulo: "Central ONSA & Notícias",
    descricao: "Investigações jornalísticas com dados abertos, Biblioteca de Crimes Socioambientais e acessibilidade.",
    categorias: [
      {
        id: "noticias-relatorios",
        titulo: "Notícias & Relatórios Cívicos",
        perguntas: [
          {
            id: "reportagens-onsa",
            pergunta: "Onde ver as reportagens investigativas do portal?",
            resposta:
              "O portal publica matérias aprofundadas com auditoria de compras públicas, royalties de mineração e acordos de barragens.",
            link: { href: "/noticias", texto: "Ver notícias e relatórios" },
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
      { href: "/betim/vereadores", texto: "Vereadores" },
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
      { href: "/diamantina/diario-oficial", texto: "Diário Oficial" },
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
    titulo: "Notícias & Relatórios",
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
      { href: "/noticias", texto: "Ver notícias e relatórios" },
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
];
