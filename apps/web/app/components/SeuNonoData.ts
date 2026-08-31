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
    id: "cidades",
    titulo: "Cidades",
    descricao: "Acompanhe prefeituras, Câmaras, contratos, obras e serviços do seu município.",
    categorias: [
      {
        id: "minha-cidade",
        titulo: "Acompanhar minha cidade",
        perguntas: [
          {
            id: "encontrar-cidade",
            pergunta: "Como encontrar dados da minha cidade?",
            resposta:
              "Na página inicial há uma busca por município. Basta digitar o nome da cidade para acessar a página dela, com contratos, despesas, obras, legislação e mais.",
            link: { href: "/", texto: "Ir para a home" },
          },
          {
            id: "pagina-cidade",
            pergunta: "O que tem na página da minha cidade?",
            resposta:
              "Cada município tem um painel com dados da prefeitura, Câmara, território, meio ambiente, clima, educação, saúde, segurança e links úteis.",
            link: { href: "/betim", texto: "Ver exemplo de Betim" },
          },
        ],
      },
      {
        id: "dinheiro",
        titulo: "Dinheiro público",
        perguntas: [
          {
            id: "maiores-contratos",
            pergunta: "Quais são os maiores contratos da prefeitura?",
            resposta:
              "A tela de contratos lista todos os contratos públicos do município, com valor, fornecedor, objeto e alertas de atenção. Use os filtros para ver os de maior valor.",
            link: { href: "/betim/prefeitura/contratos", texto: "Ver contratos" },
          },
          {
            id: "maiores-fornecedores",
            pergunta: "Quem são os maiores fornecedores?",
            resposta:
              "A página de fornecedores mostra quais empresas mais contrataram a prefeitura, com valor total, número de contratos e indícios de concentração.",
            link: { href: "/betim/prefeitura/fornecedores", texto: "Ver fornecedores" },
          },
          {
            id: "despesas",
            pergunta: "Onde ver despesas e licitações?",
            resposta:
              "Despesas por função e subfunção estão em 'Despesas'; licitações abertas e seus editais estão em 'Licitações'.",
            link: { href: "/betim/prefeitura/despesas", texto: "Ver despesas" },
          },
          {
            id: "alertas-contratos",
            pergunta: "Como identificar contratos em alerta?",
            resposta:
              "Contratos com indícios de atenção ganham badges na lista: concentração no ano, dispensa próxima do limite legal ou fornecedor criado no mesmo ano. Sempre são sinais, não conclusões.",
            link: { href: "/betim/prefeitura/contratos", texto: "Ver contratos com alerta" },
          },
        ],
      },
      {
        id: "obras-servicos",
        titulo: "Obras e serviços",
        perguntas: [
          {
            id: "obras",
            pergunta: "Onde ver obras da cidade?",
            resposta:
              "A seção Obras reúne contratos e dados sobre obras públicas do município, quando disponíveis nos dados abertos.",
            link: { href: "/betim/prefeitura/obras", texto: "Ver obras" },
          },
          {
            id: "coleta-lixo",
            pergunta: "Quando o lixo é coletado?",
            resposta:
              "A página de coleta de lixo mostra os dias e horários por região do município, quando divulgados pela prefeitura.",
            link: { href: "/betim/coleta-lixo", texto: "Ver coleta de lixo" },
          },
          {
            id: "plantao-farmacias",
            pergunta: "Onde ver plantão de farmácias?",
            resposta:
              "A tela de plantão mostra as farmácias de plantão na cidade, com endereço e telefone quando publicados pela prefeitura.",
            link: { href: "/betim/plantao-farmacias", texto: "Ver farmácias de plantão" },
          },
        ],
      },
      {
        id: "pessoas-instituicoes",
        titulo: "Pessoas e instituições",
        perguntas: [
          {
            id: "vereadores",
            pergunta: "Quem são os vereadores?",
            resposta:
              "A página de vereadores lista os parlamentares municipais, com dados de contato e histórico quando disponíveis.",
            link: { href: "/betim/vereadores", texto: "Ver vereadores" },
          },
          {
            id: "votacoes-camara",
            pergunta: "O que a Câmara está votando?",
            resposta:
              "A seção Votações da Câmara mostra matérias em votação ou já votadas, quando a Casa publica os dados de forma aberta.",
            link: { href: "/betim/camara/votacoes", texto: "Ver votações" },
          },
          {
            id: "servidores",
            pergunta: "Onde ver servidores públicos?",
            resposta:
              "A página de servidores reúne dados sobre vínculos da prefeitura, com filtros por órgão e cargo, respeitando a LGPD.",
            link: { href: "/betim/prefeitura/servidores", texto: "Ver servidores" },
          },
        ],
      },
      {
        id: "legislacao",
        titulo: "Legislação municipal",
        perguntas: [
          {
            id: "lei-organica",
            pergunta: "Onde está a Lei Orgânica do município?",
            resposta:
              "A seção Legislação da cidade reúne Lei Orgânica, Plano Diretor, Lei de Zoneamento e outras leis principais, com link para a fonte e status de verificação.",
            link: { href: "/betim/legislacao", texto: "Ver legislação municipal" },
          },
          {
            id: "leis-camara",
            pergunta: "Onde ver leis aprovadas pela Câmara?",
            resposta:
              "A página de legislação da Câmara lista leis, decretos e outras normas municipais, quando publicadas.",
            link: { href: "/betim/camara/legislacao", texto: "Ver leis da Câmara" },
          },
        ],
      },
      {
        id: "territorio",
        titulo: "Território e meio ambiente",
        perguntas: [
          {
            id: "mineracao-cidade",
            pergunta: "Tem mineração perto da minha cidade?",
            resposta:
              "A tela Terras mostra processos minerários, territórios tradicionais e sobreposições no município, quando houver dados espaciais disponíveis.",
            link: { href: "/betim/terras", texto: "Ver terras e mineração" },
          },
          {
            id: "meio-ambiente-cidade",
            pergunta: "Como acompanhar o meio ambiente da cidade?",
            resposta:
              "A seção Meio Ambiente do município traz autuações, barragens, licenciamentos e dados sobre a bacia do Paraopeba.",
            link: { href: "/betim/meio-ambiente", texto: "Ver meio ambiente" },
          },
        ],
      },
      {
        id: "protecao-social",
        titulo: "Proteção social",
        perguntas: [
          {
            id: "rede-protecao",
            pergunta: "Onde buscar ajuda na cidade?",
            resposta:
              "A Rede de Proteção reúne telefones e endereços de serviços de acolhimento, assistência social, saúde mental e direitos humanos.",
            link: { href: "/betim/rede-de-protecao", texto: "Ver rede de proteção" },
          },
        ],
      },
    ],
  },
  {
    id: "congresso",
    titulo: "Congresso Nacional",
    descricao: "Acompanhe parlamentares, votações, proposições, comissões e alertas na Câmara e no Senado.",
    categorias: [
      {
        id: "parlamentares",
        titulo: "Parlamentares",
        perguntas: [
          {
            id: "meus-parlamentares",
            pergunta: "Quem são os parlamentares do meu estado?",
            resposta:
              "A página de parlamentares permite buscar deputados federais e senadores por estado, partido ou nome.",
            link: { href: "/congresso/parlamentares", texto: "Ver parlamentares" },
          },
          {
            id: "bancadas",
            pergunta: "Como ver as bancadas estaduais?",
            resposta:
              "A seção Bancadas mostra a composição por estado, com indicadores de atuação quando disponíveis.",
            link: { href: "/congresso/bancadas", texto: "Ver bancadas" },
          },
        ],
      },
      {
        id: "votacoes-proposicoes",
        titulo: "Votações e proposições",
        perguntas: [
          {
            id: "votacoes",
            pergunta: "O que está sendo votado no Congresso?",
            resposta:
              "A tela de votações lista as matérias mais recentes, com resultado nominal quando os dados são abertos.",
            link: { href: "/congresso/votacoes", texto: "Ver votações" },
          },
          {
            id: "proposicoes",
            pergunta: "Como acompanhar proposições?",
            resposta:
              "A página de proposições permite buscar projetos de lei, requerimentos e emendas por tema, autor ou número.",
            link: { href: "/congresso/proposicoes", texto: "Ver proposições" },
          },
        ],
      },
      {
        id: "comissoes-agenda",
        titulo: "Comissões e agenda",
        perguntas: [
          {
            id: "comissoes",
            pergunta: "Quais comissões existem?",
            resposta:
              "A seção Comissões lista as comissões permanentes e temporárias da Câmara e do Senado.",
            link: { href: "/congresso/comissoes", texto: "Ver comissões" },
          },
          {
            id: "agenda",
            pergunta: "Qual a agenda do Congresso?",
            resposta:
              "A agenda reúne sessões e reuniões previstas, com link para as transmissões quando disponíveis.",
            link: { href: "/congresso/agenda", texto: "Ver agenda" },
          },
        ],
      },
      {
        id: "alertas-congresso",
        titulo: "Alertas e bons exemplos",
        perguntas: [
          {
            id: "vicio-auditavel",
            pergunta: "O que é alerta de vício auditável?",
            resposta:
              "São indícios de irregularidade em emendas, convênios ou indicações, rotulados como 'ponto de atenção', nunca como conclusão.",
            link: { href: "/congresso/alertas", texto: "Ver alertas" },
          },
          {
            id: "bons-exemplos",
            pergunta: "Onde ver bons exemplos de atuação?",
            resposta:
              "A seção Bons Exemplos destaca votações ou proposições que ampliam transparência ou controle social.",
            link: { href: "/congresso/bons-exemplos", texto: "Ver bons exemplos" },
          },
        ],
      },
    ],
  },
  {
    id: "judiciario",
    titulo: "Judiciário",
    descricao: "Dados sobre tribunais, correições, indicações, vagas, defensoria e presídios.",
    categorias: [
      {
        id: "tribunais",
        titulo: "Tribunais",
        perguntas: [
          {
            id: "tribunais-lista",
            pergunta: "Quais tribunais estão no portal?",
            resposta:
              "A página de tribunais reúne informações institucionais e dados publicados pelos Tribunais Superiores e estaduais.",
            link: { href: "/judiciario/tribunais", texto: "Ver tribunais" },
          },
          {
            id: "correicoes",
            pergunta: "O que são correições trabalhistas?",
            resposta:
              "Correições são inspeções administrativas realizadas nos tribunais. A página reúne relatórios e recomendações publicadas.",
            link: { href: "/judiciario/correicoes-trabalhistas", texto: "Ver correições" },
          },
        ],
      },
      {
        id: "indicacoes-vagas",
        titulo: "Indicações e vagas",
        perguntas: [
          {
            id: "indicacoes",
            pergunta: "Como acompanhar indicações para tribunais?",
            resposta:
              "A tela de indicações mostra nomes indicados para cargos de dirigentes e magistrados, com status de tramitação.",
            link: { href: "/judiciario/indicacoes", texto: "Ver indicações" },
          },
          {
            id: "vagas",
            pergunta: "Onde ver vagas em tribunais?",
            resposta:
              "A seção Vagas lista concursos e seleções públicas em andamento nos tribunais.",
            link: { href: "/judiciario/vagas", texto: "Ver vagas" },
          },
        ],
      },
      {
        id: "defensoria-presidios",
        titulo: "Defensoria e presídios",
        perguntas: [
          {
            id: "defensoria",
            pergunta: "Onde ver dados sobre Defensoria Pública?",
            resposta:
              "A página da Defensoria reúne dados institucionais e indicadores de atendimento, quando publicados.",
            link: { href: "/judiciario/defensoria", texto: "Ver Defensoria" },
          },
          {
            id: "presidios",
            pergunta: "Onde ver dados sobre presídios?",
            resposta:
              "A seção Presídios traz dados sobre unidades prisionais, vagas e população carcerária.",
            link: { href: "/judiciario/presidios", texto: "Ver presídios" },
          },
        ],
      },
      {
        id: "inspecoes",
        titulo: "Inspeções",
        perguntas: [
          {
            id: "inspecoes",
            pergunta: "Onde ver inspeções judiciais?",
            resposta:
              "A página de inspeções reúne relatórios de inspeções em unidades do Judiciário e do sistema prisional.",
            link: { href: "/judiciario/inspecoes", texto: "Ver inspeções" },
          },
        ],
      },
    ],
  },
  {
    id: "ambiental",
    titulo: "Ambiental",
    descricao: "Licenciamento, barragens, patrimônio cultural, decisões e legislação ambiental.",
    categorias: [
      {
        id: "licenciamento",
        titulo: "Licenciamento",
        perguntas: [
          {
            id: "licenciamentos",
            pergunta: "Onde ver licenciamentos ambientais?",
            resposta:
              "A tela de licenciamento lista processos ambientais por município, com status, órgão licenciador e empreendimento.",
            link: { href: "/ambiental/licenciamento", texto: "Ver licenciamentos" },
          },
          {
            id: "copam",
            pergunta: "O que é o COPAM?",
            resposta:
              "COPAM é o Conselho de Política Ambiental de Minas Gerais. A página reúne atas e reuniões do conselho.",
            link: { href: "/ambiental/copam", texto: "Ver COPAM" },
          },
        ],
      },
      {
        id: "barragens",
        titulo: "Barragens",
        perguntas: [
          {
            id: "barragens",
            pergunta: "Onde ver barragens por município?",
            resposta:
              "A seção Barragens mostra dados de barragens, incluindo manchas de inundação e status de descaracterização.",
            link: { href: "/ambiental/barragens", texto: "Ver barragens" },
          },
          {
            id: "descaracterizacao",
            pergunta: "O que é descaracterização de barragem?",
            resposta:
              "É o processo de eliminar a condição de barragem de alto risco. A página mostra quais barragens estão nesse processo.",
            link: { href: "/ambiental/barragens/descaracterizacao", texto: "Ver descaracterização" },
          },
        ],
      },
      {
        id: "patrimonio-direitos",
        titulo: "Patrimônio e direitos",
        perguntas: [
          {
            id: "patrimonio-cultural",
            pergunta: "Onde ver patrimônio cultural tombado?",
            resposta:
              "A página lista bens tombados no estado, com link para a fonte e dados sobre o tipo de tombamento.",
            link: { href: "/ambiental/patrimonio-cultural", texto: "Ver patrimônio cultural" },
          },
          {
            id: "direito-critico",
            pergunta: "O que é Direito Crítico?",
            resposta:
              "É uma seção com decisões e orientações sobre conflitos ambientais e territoriais, explicadas de forma acessível.",
            link: { href: "/ambiental/direito-critico", texto: "Ver Direito Crítico" },
          },
        ],
      },
      {
        id: "decisoes-convenios",
        titulo: "Decisões e convênios",
        perguntas: [
          {
            id: "decisoes",
            pergunta: "Onde ver decisões ambientais?",
            resposta:
              "A seção Decisões reúne decisões judiciais e administrativas sobre meio ambiente.",
            link: { href: "/ambiental/decisoes", texto: "Ver decisões" },
          },
          {
            id: "decisoes-lai",
            pergunta: "O que são Decisões LAI?",
            resposta:
              "São respostas a pedidos de acesso à informação sobre temas ambientais, publicadas como forma de ampliar transparência.",
            link: { href: "/ambiental/decisoes-lai", texto: "Ver decisões LAI" },
          },
          {
            id: "convenios-ambiental",
            pergunta: "Onde ver convênios ambientais?",
            resposta:
              "A página de convênios lista transferências e acordos relacionados a meio ambiente, saúde e assistência.",
            link: { href: "/ambiental/convenios", texto: "Ver convênios" },
          },
        ],
      },
      {
        id: "legislacao-ambiental",
        titulo: "Legislação",
        perguntas: [
          {
            id: "legislacao-ambiental",
            pergunta: "Onde ver legislação ambiental?",
            resposta:
              "A seção Legislação reúne normas federais e estaduais sobre meio ambiente, com link para o texto original.",
            link: { href: "/ambiental/legislacao", texto: "Ver legislação ambiental" },
          },
        ],
      },
    ],
  },
  {
    id: "paraopeba",
    titulo: "Paraopeba",
    descricao: "Acompanhamento do acordo de reparação do rompimento da barragem da Vale.",
    categorias: [
      {
        id: "entenda",
        titulo: "Entenda o acordo",
        perguntas: [
          {
            id: "o-que-e",
            pergunta: "O que é o acordo de reparação?",
            resposta:
              "É o acordo judicial que define as ações e recursos para reparar os danos do rompimento da barragem da Vale em Brumadinho.",
            link: { href: "/paraopeba/entenda", texto: "Entenda o acordo" },
          },
          {
            id: "quem-atua",
            pergunta: "Quem atua na reparação?",
            resposta:
              "A página 'Quem atua' mostra os órgãos, instituições e entidades responsáveis por executar e fiscalizar o acordo.",
            link: { href: "/paraopeba/quem-atua", texto: "Ver quem atua" },
          },
        ],
      },
      {
        id: "acompanhar",
        titulo: "Acompanhar",
        perguntas: [
          {
            id: "execucao",
            pergunta: "Como acompanhar a execução do acordo?",
            resposta:
              "A tela Execução mostra indicadores e dados sobre o andamento das medidas previstas no acordo.",
            link: { href: "/paraopeba/execucao", texto: "Ver execução" },
          },
          {
            id: "linha-do-tempo",
            pergunta: "Qual a linha do tempo dos fatos?",
            resposta:
              "A linha do tempo reúne os principais eventos desde o rompimento até os marcos mais recentes da reparação.",
            link: { href: "/paraopeba/linha-do-tempo", texto: "Ver linha do tempo" },
          },
          {
            id: "documentos",
            pergunta: "Onde encontrar documentos oficiais?",
            resposta:
              "A biblioteca de documentos reúne textos do acordo, relatórios e decisões judiciais.",
            link: { href: "/paraopeba/documentos", texto: "Ver documentos" },
          },
        ],
      },
      {
        id: "analises",
        titulo: "Análises",
        perguntas: [
          {
            id: "analise",
            pergunta: "Quais análises já foram publicadas?",
            resposta:
              "A seção Análise reúne levantamentos do portal sobre execução, repasses e prioridades do acordo.",
            link: { href: "/paraopeba/analise", texto: "Ver análises" },
          },
          {
            id: "auditoria",
            pergunta: "Onde ver auditorias?",
            resposta:
              "A página Auditoria mostra dados sobre fiscalização e controle dos recursos do acordo.",
            link: { href: "/paraopeba/auditoria", texto: "Ver auditoria" },
          },
          {
            id: "auxilio-pericia",
            pergunta: "Onde ver auxílio e perícia?",
            resposta:
              "As páginas Auxílio e Perícia detalham os programas de auxílio financeiro emergencial e os laudos técnicos da reparação.",
            link: { href: "/paraopeba/auxilio", texto: "Ver auxílio" },
          },
        ],
      },
      {
        id: "biblioteca-clipping",
        titulo: "Biblioteca e clipping",
        perguntas: [
          {
            id: "biblioteca",
            pergunta: "Onde ver biblioteca e notícias?",
            resposta:
              "A Biblioteca reúne publicações acadêmicas e relatórios; o Clipping reúne notícias sobre o tema.",
            link: { href: "/paraopeba/biblioteca", texto: "Ver biblioteca" },
          },
        ],
      },
    ],
  },
  {
    id: "direitos-em-movimento",
    titulo: "Direitos em Movimento",
    descricao: "Onde buscar ajuda, como denunciar, pedir informação e acompanhar os principais achados do portal.",
    categorias: [
      {
        id: "sobre-direitos",
        titulo: "Sobre",
        perguntas: [
          {
            id: "o-que-e-direitos",
            pergunta: "O que é Direitos em Movimento?",
            resposta:
              "É uma seção do portal que reúne orientações sobre acesso à informação, canais de denúncia e defesa de direitos, além de destacar achados do Controle Popular que merecem atenção da sociedade.",
            link: { href: "/direitos-em-movimento", texto: "Ir para Direitos em Movimento" },
          },
          {
            id: "como-acompanhar",
            pergunta: "Como acompanhar os poderes públicos?",
            resposta:
              "Você pode usar os dados do portal para fiscalizar contratos, votações, licenciamentos e obras. A seção Direitos em Movimento mostra por onde começar.",
            link: { href: "/direitos-em-movimento", texto: "Ver guia de acompanhamento" },
          },
        ],
      },
      {
        id: "como-agir",
        titulo: "Como agir",
        perguntas: [
          {
            id: "pedir-informacao",
            pergunta: "Como pedir informação à administração pública?",
            resposta:
              "Todo cidadão tem direito a informações públicas (LAI). A página explica como fazer um pedido, qual o prazo e o que fazer se receber resposta incompleta.",
            link: { href: "/direitos-em-movimento/informacao", texto: "Guia de acesso à informação" },
          },
          {
            id: "denunciar",
            pergunta: "Onde denunciar irregularidades?",
            resposta:
              "A página de denúncia reúne canais como ouvidorias, Ministério Público, Controladorias, Tribunal de Contas e polícia, com orientação sobre quando usar cada um.",
            link: { href: "/direitos-em-movimento/denuncia", texto: "Canais de denúncia" },
          },
          {
            id: "buscar-ajuda",
            pergunta: "Onde buscar ajuda para defender direitos?",
            resposta:
              "A seção Ajuda lista organizações, defensorias, procuradorias e movimentos sociais que podem apoiar cidadãos e comunidades.",
            link: { href: "/direitos-em-movimento/ajuda", texto: "Quem pode ajudar" },
          },
        ],
      },
      {
        id: "principais-achados",
        titulo: "Principais achados",
        perguntas: [
          {
            id: "achado-contratos-alerta",
            pergunta: "Quais contratos estão em alerta?",
            resposta:
              "A tela de contratos de cada município mostra indícios de atenção: concentração de contratos com o mesmo fornecedor no ano, dispensa próxima do limite legal e fornecedor criado no mesmo ano do contrato. São sinais, não conclusões.",
            link: { href: "/betim/prefeitura/contratos", texto: "Ver contratos em alerta" },
            links: [
              { href: "/betim/prefeitura/fornecedores", texto: "Ver fornecedores" },
            ],
          },
          {
            id: "achado-territorio",
            pergunta: "Quais empreendimentos sobrepõem terras indígenas e quilombolas?",
            resposta:
              "A tela Terras cruza mineração, barragens e licenciamentos com territórios indígenas e quilombolas. As sobreposições são calculadas com interseção espacial exata; co-ocorrências no mesmo município são rotuladas separadamente.",
            link: { href: "/betim/terras", texto: "Ver cruzamentos territoriais" },
            links: [
              { href: "/ambiental/barragens", texto: "Ver barragens" },
              { href: "/ambiental/licenciamento", texto: "Ver licenciamentos" },
            ],
          },
          {
            id: "achado-mineracao-barragens",
            pergunta: "Onde há mineração ou barragens perto de comunidades?",
            resposta:
              "A frente Ambiental e a tela Terras mostram processos minerários, manchas de barragens e licenciamentos próximos a cidades e territórios tradicionais.",
            link: { href: "/ambiental/barragens", texto: "Ver barragens" },
            links: [
              { href: "/betim/terras", texto: "Ver mineração na cidade" },
            ],
          },
          {
            id: "achado-paraopeba",
            pergunta: "O que o portal achou sobre o Acordo Paraopeba?",
            resposta:
              "O portal acompanha a execução do acordo de reparação do rompimento da barragem da Vale, incluindo repasses, obras, programas de auxílio e auditorias. Toda comparação traz ressalva metodológica.",
            link: { href: "/paraopeba/execucao", texto: "Ver execução do acordo" },
            links: [
              { href: "/paraopeba/analise", texto: "Ver análises" },
              { href: "/paraopeba/auditoria", texto: "Ver auditoria" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "geral",
    titulo: "Geral",
    descricao: "Informações sobre o portal, acessibilidade, privacidade e busca.",
    categorias: [
      {
        id: "sobre",
        titulo: "Sobre o portal",
        perguntas: [
          {
            id: "o-que-e-portal",
            pergunta: "O que é o Controle Popular?",
            resposta:
              "Portal independente de transparência que reúne dados públicos sobre cidades, Congresso Nacional, Judiciário e meio ambiente. Não tem vínculo com nenhum órgão ou partido.",
            link: { href: "/sobre", texto: "Sobre o portal" },
          },
          {
            id: "como-usar",
            pergunta: "Como usar o portal?",
            resposta:
              "Use a busca universal, navegue pelas frentes no menu superior ou escolha um município na home. Cada página traz filtros e explicações sobre os dados.",
            link: { href: "/busca", texto: "Buscar no portal" },
          },
        ],
      },
      {
        id: "acessibilidade",
        titulo: "Acessibilidade",
        perguntas: [
          {
            id: "tamanho-fonte",
            pergunta: "Como aumentar o tamanho da letra?",
            resposta:
              "Na barra superior há controles para aumentar ou diminuir o tamanho da fonte (A− / A / A+), além de tema claro, escuro e alto contraste.",
          },
          {
            id: "ouvir-pagina",
            pergunta: "Como ouvir a página?",
            resposta:
              "O botão 'Ouvir página' no canto inferior direito lê o conteúdo principal em voz alta, respeitando o leitor de tela.",
          },
          {
            id: "tema-contraste",
            pergunta: "Como mudar o tema ou contraste?",
            resposta:
              "No canto superior direito da barra global você encontra o seletor de tema (claro/escuro/alto contraste) e o modo seguro para daltônicos.",
          },
        ],
      },
      {
        id: "privacidade-dados",
        titulo: "Privacidade e dados",
        perguntas: [
          {
            id: "dados-usuario",
            pergunta: "O que vocês fazem com meus dados?",
            resposta:
              "O portal não coleta dados pessoais sem consentimento. Veja a política de privacidade para mais detalhes.",
            link: { href: "/termos", texto: "Ver termos e privacidade" },
          },
          {
            id: "usar-dados",
            pergunta: "Posso usar os dados do portal?",
            resposta:
              "Sim. Os dados são públicos e o código do portal é aberto. Cite a fonte original e leia os termos de uso.",
            link: { href: "/termos", texto: "Ver termos de uso" },
          },
          {
            id: "sugerir-dado",
            pergunta: "Como sugerir uma base de dados?",
            resposta:
              "Envie sugestões pelo repositório público no GitHub ou pelos canais de contato do portal.",
            link: { href: "https://github.com/FinweeJur/controle-popular", texto: "GitHub do projeto" },
          },
        ],
      },
    ],
  },
];

/**
 * Resumos de dados das páginas do portal. O SeuNonô usa estes textos para
 * responder quando o usuário pergunta sobre dados específicos de uma página.
 * Cada entrada contém o título da página, um resumo dos dados disponíveis,
 * e links para acesso direto.
 */
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
    titulo: "Meio ambiente",
    resumo: "Dados ambientais: COPAM, licenciamento, barragens, legislação e TACs.",
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
];
