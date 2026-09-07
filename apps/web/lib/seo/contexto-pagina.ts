export interface SugestaoContextual {
  pergunta: string;
  resposta: string;
  link: string;
  linkTexto: string;
}

export interface ContextoPagina {
  padrao: string;
  sugestoes: SugestaoContextual[];
}

/**
 * Mapeamento de rotas do portal para sugestões contextuais do Seu Nonô.
 * Cada rota mapeia perguntas que apontam para OUTRAS páginas correlatas,
 * garantindo que o assistente nunca sugira a mesma página onde o leitor já está.
 */
export const CONTEXTOS: ContextoPagina[] = [
  // ─── BETIM ───
  {
    padrao: "^/betim/prefeitura/contratos",
    sugestoes: [
      {
        pergunta: "Quem são os maiores fornecedores da prefeitura?",
        resposta:
          "A página de fornecedores mostra quais empresas mais faturaram com a prefeitura, o número de contratos e alertas de concentração de mercado.",
        link: "/betim/prefeitura/fornecedores",
        linkTexto: "Ver maiores fornecedores",
      },
      {
        pergunta: "Onde ver as despesas orçamentárias de Betim?",
        resposta:
          "Consulte o demonstrativo das despesas por função e subfunção (saúde, educação, saneamento) para ver onde o orçamento municipal é executado.",
        link: "/betim/prefeitura/despesas",
        linkTexto: "Ver despesas orçamentárias",
      },
      {
        pergunta: "Como consultar extratos de contratos no Diário Oficial?",
        resposta:
          "O Diário Oficial de Betim reúne decretos, portarias e extratos contratuais na íntegra com busca e filtros por ano.",
        link: "/betim/prefeitura/diario",
        linkTexto: "Consultar Diário Oficial",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/despesas",
    sugestoes: [
      {
        pergunta: "Quais contratos foram firmados para essas despesas?",
        resposta:
          "A lista de contratos detalha valores, fornecedores e alertas de concentração nas áreas de saúde, educação e obras.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos de Betim",
      },
      {
        pergunta: "Quem recebe a maior parte desses pagamentos?",
        resposta:
          "Consulte o ranking das empresas que mais receberam recursos públicos municipais em Betim.",
        link: "/betim/prefeitura/fornecedores",
        linkTexto: "Ranking de fornecedores",
      },
      {
        pergunta: "Quanto Betim recebe de transferências federais?",
        resposta:
          "O painel ComunicaBR detalha transferências da União para saúde, SUS, Bolsa Família e Fundeb em Betim.",
        link: "/dados/comunicabr",
        linkTexto: "Transferências federais ComunicaBR",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/fornecedores",
    sugestoes: [
      {
        pergunta: "Quais contratos foram emitidos para esses fornecedores?",
        resposta:
          "A página de contratos lista cada contratação individual com vigência, valor e indícios de alerta.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos públicos",
      },
      {
        pergunta: "Qual o valor total de compras da prefeitura?",
        resposta:
          "Veja a execução financeira de cada órgão e secretaria na página de despesas públicas municipais.",
        link: "/betim/prefeitura/despesas",
        linkTexto: "Ver despesas da prefeitura",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/servidores",
    sugestoes: [
      {
        pergunta: "Quanto o município gasta com folha de pagamento?",
        resposta:
          "A composição das despesas públicas municipais detalha gastos com pessoal e encargos por secretaria.",
        link: "/betim/prefeitura/despesas",
        linkTexto: "Ver despesas com pessoal",
      },
      {
        pergunta: "Como estão as contratações e empregos formais na cidade?",
        resposta:
          "O Eixo Direitos em Movimento monitora admissões do CAGED e geração de renda em Betim.",
        link: "/direitos-em-movimento/trabalho-e-renda",
        linkTexto: "Painel de Trabalho e Renda",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/obras",
    sugestoes: [
      {
        pergunta: "Quais os contratos e valores das empreiteiras dessas obras?",
        resposta:
          "A página de contratos lista as licitações de engenharia, reformas de escolas e postos de saúde.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos de obras",
      },
      {
        pergunta: "Betim recebe recursos do Acordo de Brumadinho para obras?",
        resposta:
          "O painel do Paraopeba monitora as obras de macrodrenagem e saneamento financiadas com a cota municipal do acordo.",
        link: "/paraopeba",
        linkTexto: "Reparação em Betim / Paraopeba",
      },
    ],
  },
  {
    padrao: "^/betim/vereadores",
    sugestoes: [
      {
        pergunta: "Como os vereadores votaram nas matérias legislativas?",
        resposta:
          "Acompanhe as atas e registros de votações nominais da Câmara Municipal de Betim.",
        link: "/betim/camara/votacoes",
        linkTexto: "Votações da Câmara",
      },
      {
        pergunta: "Quais leis municipais foram aprovadas recentemente?",
        resposta:
          "Consulte o acervo legislativo municipal com leis ordinárias, complementares e decretos.",
        link: "/betim/camara/legislacao",
        linkTexto: "Legislação Municipal",
      },
    ],
  },
  {
    padrao: "^/betim/coleta-lixo",
    sugestoes: [
      {
        pergunta: "Qual empresa faz a coleta de lixo e qual o valor do contrato?",
        resposta:
          "A lista de contratos públicos traz os valores e vigências dos serviços de limpeza urbana e destinação de resíduos.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos de limpeza",
      },
      {
        pergunta: "Onde consultar licenças ambientais de aterros e destinação?",
        resposta:
          "O ONSA monitora os processos de licenciamento ambiental de empreendimentos de resíduos sólidos em MG.",
        link: "/ambiental/licenciamento",
        linkTexto: "Licenciamento ONSA",
      },
    ],
  },

  // ─── CONGRESSO ───
  {
    padrao: "^/congresso/proposicoes",
    sugestoes: [
      {
        pergunta: "Como os parlamentares votaram nessas propostas?",
        resposta:
          "A página de votações traz o voto nominal de cada deputado e senador nas matérias deliberadas em plenário.",
        link: "/congresso/votacoes",
        linkTexto: "Ver votações nominais",
      },
      {
        pergunta: "Quais deputados tiveram mais gastos com a cota parlamentar (CEAP)?",
        resposta:
          "Consulte o perfil dos congressistas com declarações de gastos, presença em comissões e atuação legislativa.",
        link: "/congresso/parlamentares",
        linkTexto: "Gastos dos parlamentares",
      },
      {
        pergunta: "Quais bancadas concentram mais alertas?",
        resposta:
          "Acompanhe a distribuição partidária e regional das emendas e projetos de interesse da cidadania.",
        link: "/congresso/bancadas",
        linkTexto: "Ver bancadas",
      },
    ],
  },
  {
    padrao: "^/congresso/votacoes",
    sugestoes: [
      {
        pergunta: "Quais projetos de lei (PLs e PECs) estão tramitando?",
        resposta:
          "Consulte o catálogo de proposições federais com status de tramitação, relatores e impacto nas cidades.",
        link: "/congresso/proposicoes",
        linkTexto: "Ver proposições",
      },
      {
        pergunta: "Como atuam as bancadas estaduais no Congresso?",
        resposta:
          "Veja como cada bancada se posiciona e como as emendas orçamentárias afetam os municípios.",
        link: "/congresso/bancadas",
        linkTexto: "Bancadas estaduais",
      },
    ],
  },
  {
    padrao: "^/congresso/parlamentares",
    sugestoes: [
      {
        pergunta: "Como os deputados votam nas pautas de meio ambiente e direitos?",
        resposta:
          "O painel de votações nominais registra cada voto em plenário para você fiscalizar a atuação de cada eleito.",
        link: "/congresso/votacoes",
        linkTexto: "Ver votações nominais",
      },
      {
        pergunta: "Quais alertas de fiscalização cidadã foram registrados?",
        resposta:
          "Pontos de atenção e indícios em convênios e emendas de bancada para acompanhamento social.",
        link: "/congresso/alertas",
        linkTexto: "Ver alertas do Congresso",
      },
    ],
  },
  {
    padrao: "^/congresso/bancadas",
    sugestoes: [
      {
        pergunta: "Quem são os parlamentares de cada bancada?",
        resposta:
          "Acesse a lista completa de deputados e senadores com contatos, presenças e gastos.",
        link: "/congresso/parlamentares",
        linkTexto: "Ver parlamentares",
      },
      {
        pergunta: "Quais projetos prioritários das bancadas estão em pauta?",
        resposta:
          "Explore os projetos de lei e emendas constitucionais sob análise nas comissões e no plenário.",
        link: "/congresso/proposicoes",
        linkTexto: "Ver projetos em pauta",
      },
    ],
  },
  {
    padrao: "^/congresso/alertas",
    sugestoes: [
      {
        pergunta: "Onde ver matérias investigativas completas sobre gastos públicos?",
        resposta:
          "Nossas reportagens cruzam dados do PNCP, emendas parlamentares e convênios municipais.",
        link: "/noticias",
        linkTexto: "Ver investigações jornalísticas",
      },
      {
        pergunta: "Quais parlamentares assinam essas propostas?",
        resposta:
          "Verifique a autoria e os votos nas matérias legislativas monitoradas.",
        link: "/congresso/votacoes",
        linkTexto: "Ver votações",
      },
    ],
  },

  // ─── JUDICIÁRIO ───
  {
    padrao: "^/judiciario/sirenejud",
    sugestoes: [
      {
        pergunta: "Qual o orçamento dos órgãos do Sistema de Justiça em MG?",
        resposta:
          "O TJMG recebe R$ 14,96 bi e o MPMG R$ 4,09 bi, enquanto a DPMG tem déficit de 176 comarcas.",
        link: "/judiciario/instituicoes",
        linkTexto: "Fichas TJMG, MPMG e DPMG",
      },
      {
        pergunta: "Onde consultar as ações de crimes socioambientais e TACs?",
        resposta:
          "A Biblioteca de Crimes Socioambientais reúne 936 laudos periciais e termos de ajustamento de conduta.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca de Crimes Socioambientais",
      },
      {
        pergunta: "Como fiscalizar grandes mineradoras rés em processos ambientais?",
        resposta:
          "Consulte o painel de grandes mineradoras, cotações da Vale e sócios de fundos globais.",
        link: "/empresas",
        linkTexto: "Painel de Grandes Empresas",
      },
    ],
  },
  {
    padrao: "^/judiciario/tribunais",
    sugestoes: [
      {
        pergunta: "Quanto o TJMG e o MPMG gastam com folha e verbas indenizatórias?",
        resposta:
          "As fichas analíticas mostram R$ 1,85 bi em indenizações no TJMG e a disparidade com a Defensoria Pública.",
        link: "/judiciario/instituicoes",
        linkTexto: "Gastos da Justiça MG",
      },
      {
        pergunta: "Onde ver os processos ambientais no SIRENEJud?",
        resposta:
          "O painel do CNJ georreferencia ações ambientais e crimes contra a flora e fauna em todo o país.",
        link: "/judiciario/sirenejud",
        linkTexto: "Painel SIRENEJud",
      },
    ],
  },
  {
    padrao: "^/judiciario/indicacoes",
    sugestoes: [
      {
        pergunta: "Quem fiscaliza a atuação dos magistrados e tribunais?",
        resposta:
          "Conheça o papel do CNJ, do CNMP e as atribuições dos órgãos de corregedoria do Sistema de Justiça.",
        link: "/judiciario/instituicoes",
        linkTexto: "Fiscalização da Justiça",
      },
      {
        pergunta: "Onde acompanhar as ações civis públicas ambientais?",
        resposta:
          "Veja os processos judiciais em trâmite no TJMG, TRF-6 e Superior Tribunal de Justiça.",
        link: "/judiciario/sirenejud",
        linkTexto: "Processos no SIRENEJud",
      },
    ],
  },

  // ─── AMBIENTAL ───
  {
    padrao: "^/ambiental/licenciamento",
    sugestoes: [
      {
        pergunta: "Onde ver as decisões e atas do COPAM?",
        resposta:
          "O Conselho Estadual de Política Ambiental (COPAM) delibera sobre licenças prévias, de instalação e operação em MG.",
        link: "/ambiental/copam",
        linkTexto: "Ver pauta do COPAM",
      },
      {
        pergunta: "Quais barragens de mineração estão em processo de descaracterização?",
        resposta:
          "Consulte as 23 barragens a montante monitoradas pela Lei 'Mar de Lama Nunca Mais' e pelo SIGBM.",
        link: "/ambiental/barragens/descaracterizacao",
        linkTexto: "Descaracterização de Barragens",
      },
      {
        pergunta: "Onde consultar os TACs firmados por mineradoras e órgãos públicos?",
        resposta:
          "O acervo de TACs reúne termos de ajustamento de conduta firmados pelo MPMG, IBAMA e FEAM.",
        link: "/ambiental/tac",
        linkTexto: "Consultar TACs ambientais",
      },
    ],
  },
  {
    padrao: "^/ambiental/barragens",
    sugestoes: [
      {
        pergunta: "Como está o cumprimento dos prazos da descaracterização?",
        resposta:
          "Acompanhe o cronograma das barragens com risco nível 3 e o status das obras de contenção da Vale e outras mineradoras.",
        link: "/ambiental/barragens/descaracterizacao",
        linkTexto: "Painel de Descaracterização",
      },
      {
        pergunta: "Onde ver os laudos técnicos dos rompimentos de Brumadinho e Mariana?",
        resposta:
          "A Biblioteca de Crimes Socioambientais reúne laudos da UFMG, FGV, AECOM e Fiocruz.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca de Crimes Socioambientais",
      },
      {
        pergunta: "Como anda o Acordo Judicial de Brumadinho no Paraopeba?",
        resposta:
          "Acompanhe os repasses de R$ 5,48 bi aos 26 municípios atingidos e a execução de obras públicas.",
        link: "/paraopeba",
        linkTexto: "Observatório do Paraopeba",
      },
    ],
  },
  {
    padrao: "^/ambiental/copam",
    sugestoes: [
      {
        pergunta: "Quais empreendimentos têm processos de licenciamento em curso?",
        resposta:
          "Acesse a base de 19 mil licenças deferidas e em tramitação na SEMAD/Sisema.",
        link: "/ambiental/licenciamento",
        linkTexto: "Licenciamento ONSA",
      },
      {
        pergunta: "Onde ver termos de ajustamento de conduta (TACs) em MG?",
        resposta:
          "Consulte obrigações e compromissos firmados perante o Ministério Público Estadual.",
        link: "/ambiental/tac",
        linkTexto: "Termos de Ajustamento de Conduta",
      },
    ],
  },

  // ─── PARAOPEBA ───
  {
    padrao: "^/paraopeba/execucao",
    sugestoes: [
      {
        pergunta: "Onde ver a análise integrada das perícias da UFMG e das ATIs?",
        resposta:
          "A página de análise integrada cruza os 16 eixos da auditoria AECOM com os laudos da UFMG e das comunidades.",
        link: "/paraopeba/analise",
        linkTexto: "Análise Integrada Paraopeba",
      },
      {
        pergunta: "Onde acessar a Biblioteca Unificada de Crimes de Barragens?",
        resposta:
          "Consulte mais de 930 laudos, relatórios epidemiológicos da Fiocruz e planos comunitários.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca de Crimes Socioambientais",
      },
      {
        pergunta: "Como comparar a reparação de Brumadinho com a do Rio Doce?",
        resposta:
          "Veja a repactuação de R$ 171 bi de Mariana e como os recursos são distribuídos entre os estados.",
        link: "/ambiental/mariana",
        linkTexto: "Repactuação do Rio Doce",
      },
    ],
  },
  {
    padrao: "^/paraopeba/analise",
    sugestoes: [
      {
        pergunta: "Qual o valor já executado nos 26 municípios atingidos?",
        resposta:
          "Consulte a execução orçamentária detalhada da cota municipal do acordo de R$ 37,7 bi.",
        link: "/paraopeba/execucao",
        linkTexto: "Execução do Acordo de Brumadinho",
      },
      {
        pergunta: "Onde consultar o acervo de relatórios técnicos das ATIs?",
        resposta:
          "A Biblioteca das ATIs reúne mais de 640 documentos elaborados por AEDAS, Guaicuy, NACAB e ADAI.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Acervo de Crimes Socioambientais",
      },
      {
        pergunta: "Quem são os acionistas globais da mineradora Vale?",
        resposta:
          "Acompanhe o monitoramento de grandes empresas, fundos internacionais (BlackRock, Previ) e lucros.",
        link: "/empresas",
        linkTexto: "Painel de Grandes Empresas",
      },
    ],
  },
  {
    padrao: "^/paraopeba",
    sugestoes: [
      {
        pergunta: "Onde ver a análise integrada de auditoria, perícia e ATIs?",
        resposta:
          "O cruzamento dos 16 eixos técnicos da AECOM com os laudos da UFMG e assessorias comunitárias.",
        link: "/paraopeba/analise",
        linkTexto: "Ver Análise Integrada",
      },
      {
        pergunta: "Quanto cada município do Paraopeba já recebeu do Acordo?",
        resposta:
          "Tabela completa de execução financeira e obras municipais financiadas pela reparação.",
        link: "/paraopeba/execucao",
        linkTexto: "Execução por Município",
      },
      {
        pergunta: "Como anda a repactuação da Bacia do Rio Doce (Mariana)?",
        resposta:
          "Acompanhe os repasses do novo acordo de Mariana aos municípios atingidos de MG e ES.",
        link: "/ambiental/mariana",
        linkTexto: "Painel de Mariana / Rio Doce",
      },
    ],
  },

  // ─── DIREITOS EM MOVIMENTO ───
  {
    padrao: "^/direitos-em-movimento/denuncia",
    sugestoes: [
      {
        pergunta: "Onde buscar orientação jurídica e defensoria pública?",
        resposta:
          "A seção de ajuda lista serviços gratuitos de apoio jurídico, defensorias e entidades comunitárias.",
        link: "/direitos-em-movimento/ajuda",
        linkTexto: "Buscar Ajuda Jurídica",
      },
      {
        pergunta: "Como protocolar um pedido de Lei de Acesso à Informação (LAI)?",
        resposta:
          "Passo a passo cidadão para pedir dados a prefeituras, órgãos estaduais e federais.",
        link: "/direitos-em-movimento/informacao",
        linkTexto: "Guia de Acesso à Informação",
      },
      {
        pergunta: "Qual lei protege a minha comunidade?",
        resposta:
          "Consulte o catálogo de legislação de direitos sociais, proteção socioambiental e patrimônio.",
        link: "/ambiental/legislacao",
        linkTexto: "Legislação e Direitos",
      },
    ],
  },
  {
    padrao: "^/direitos-em-movimento/informacao",
    sugestoes: [
      {
        pergunta: "O que fazer se a prefeitura negar ou omitir a resposta de LAI?",
        resposta:
          "Veja como recorrer administrativamente e acionar os canais de controle e ouvidorias públicas.",
        link: "/direitos-em-movimento/denuncia",
        linkTexto: "Canais de Denúncia",
      },
      {
        pergunta: "Onde encontrar entidades que auxiliam no controle social?",
        resposta:
          "Conheça movimentos, coletivos e assessorias comunitárias que atuam na defesa dos direitos locais.",
        link: "/direitos-em-movimento/ajuda",
        linkTexto: "Rede de Ajuda e Defesa",
      },
    ],
  },
  {
    padrao: "^/direitos-em-movimento/ajuda",
    sugestoes: [
      {
        pergunta: "Como fazer denúncias de desvio de verbas ou dano ambiental?",
        resposta:
          "Acesse formulários e contatos de ouvidorias do Ministério Público e tribunais de contas.",
        link: "/direitos-em-movimento/denuncia",
        linkTexto: "Quero Fazer Denúncia",
      },
      {
        pergunta: "Como solicitar documentos oficiais que não estão disponíveis?",
        resposta:
          "Utilize o modelo de pedido de informação com fundamentação jurídica da Lei 12.527.",
        link: "/direitos-em-movimento/informacao",
        linkTexto: "Fazer Pedido de LAI",
      },
    ],
  },

  // ─── NOTÍCIAS & RELATÓRIOS ───
  {
    padrao: "^/noticias",
    sugestoes: [
      {
        pergunta: "Como funciona a metodologia de checagem do ONSA?",
        resposta:
          "Nenhuma insinuação sem prova: toda reportagem cita a fonte primária oficial, o número e a data.",
        link: "/sobre",
        linkTexto: "Sobre o Controle Popular",
      },
      {
        pergunta: "Onde consultar o acervo pericial dos crimes de barragens?",
        resposta:
          "Acesse os laudos técnicos, termos de compromisso e planos de saúde das bacias atingidas.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca Socioambiental",
      },
      {
        pergunta: "Onde ver a arrecadação de ICMS e o orçamento estadual de MG?",
        resposta:
          "Consulte o painel de receitas tributárias de Minas Gerais (R$ 81,5 bi de ICMS) e despesas obrigatórias.",
        link: "/estado-e-economia/orcamento",
        linkTexto: "Orçamento de Minas Gerais",
      },
    ],
  },

  // ─── MARIANA & BACIA DO RIO DOCE ───
  {
    padrao: "^/ambiental/mariana",
    sugestoes: [
      {
        pergunta: "Como comparar o acordo do Rio Doce com o do Paraopeba (Brumadinho)?",
        resposta:
          "Consulte a execução financeira de R$ 5,48 bi aos municípios do Paraopeba e auditorias da FGV e AECOM.",
        link: "/paraopeba",
        linkTexto: "Observatório do Paraopeba",
      },
      {
        pergunta: "Onde consultar os laudos periciais e ações judiciais de Mariana?",
        resposta:
          "A Biblioteca Unificada reúne os TACs do Rio Doce, pareceres epidemiológicos e ações civis públicas.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca de Crimes Socioambientais",
      },
      {
        pergunta: "Qual o status de descaracterização de barragens a montante em MG?",
        resposta:
          "Acompanhe as 23 barragens que precisam ser descaracterizadas e as sanções da Lei Mar de Lama Nunca Mais.",
        link: "/ambiental/barragens/descaracterizacao",
        linkTexto: "Descaracterização de Barragens",
      },
    ],
  },

  // ─── CRIMES SOCIOAMBIENTAIS ───
  {
    padrao: "^/ambiental/crimes-socioambientais",
    sugestoes: [
      {
        pergunta: "Onde ver a análise integrada das 3 vozes (auditoria, perícia e ATIs)?",
        resposta:
          "A página cruza os 16 eixos da AECOM com a perícia da UFMG e o que as comunidades atingidas publicaram.",
        link: "/paraopeba/analise",
        linkTexto: "Análise Integrada Paraopeba",
      },
      {
        pergunta: "Como acompanhar a execução dos repasses do Acordo de Brumadinho?",
        resposta:
          "Acesse a cota dos 26 municípios atingidos do Paraopeba com status de projetos e pagamentos.",
        link: "/paraopeba/execucao",
        linkTexto: "Execução do Acordo",
      },
      {
        pergunta: "Como fiscalizar o novo acordo de R$ 171 bilhões de Mariana?",
        resposta:
          "Consulte o painel de Mariana com o cronograma de repasses municipais e execução de obras em MG.",
        link: "/ambiental/mariana",
        linkTexto: "Acordo de Mariana (Rio Doce)",
      },
    ],
  },

  // ─── INSTITUIÇÕES DE JUSTIÇA (TJMG, MPMG, DPMG, ETC.) ───
  {
    padrao: "^/judiciario/instituicoes",
    sugestoes: [
      {
        pergunta: "Onde consultar as ações civis públicas ambientais no Judiciário?",
        resposta:
          "O SIRENEJud (CNJ) georreferencia processos de desmatamento, mineração e danos ambientais.",
        link: "/judiciario/sirenejud",
        linkTexto: "Painel SIRENEJud",
      },
      {
        pergunta: "Qual o impacto do orçamento da Justiça nas contas de MG?",
        resposta:
          "Veja o comparativo entre a arrecadação de impostos (ICMS e IPVA) e os repasses obrigatórios aos poderes.",
        link: "/estado-e-economia/orcamento",
        linkTexto: "Orçamento e Receitas de MG",
      },
      {
        pergunta: "Onde ver as notícias investigativas sobre gastos dos tribunais?",
        resposta:
          "Reportagens detalham orçamentos de R$ 14,9 bi no TJMG e disparidade histórica com a Defensoria Pública.",
        link: "/noticias",
        linkTexto: "Investigações Noticiosas",
      },
    ],
  },

  // ─── 199 CIDADES ESTRATÉGICAS ───
  {
    padrao: "^/cidades",
    sugestoes: [
      {
        pergunta: "Quanto meu município recebe de repasses federais da União?",
        resposta:
          "O ComunicaBR detalha transferências do Bolsa Família, SUS, Fundeb e BPC para os 853 municípios mineiros.",
        link: "/dados/comunicabr",
        linkTexto: "ComunicaBR — Repasses Federais",
      },
      {
        pergunta: "Como navegar no mapa 3D de sobreposições territoriais?",
        resposta:
          "O Globo 3D cruza terras indígenas, quilombolas, concessões minerárias e unidades de conservação.",
        link: "/funcaosocialterra",
        linkTexto: "Globo 3D de Terras",
      },
      {
        pergunta: "Onde ver relatórios de compras públicas do PNCP?",
        resposta:
          "Investigações com dados abertos sobre contratos e compras municipais nas cidades de Minas.",
        link: "/noticias",
        linkTexto: "Notícias e Relatórios",
      },
    ],
  },

  // ─── TECNOLOGIA & IA LIVRE ───
  {
    padrao: "^/tecnologia",
    sugestoes: [
      {
        pergunta: "Como o portal protege a privacidade e segue a LGPD?",
        resposta:
          "O Controle Popular não armazena dados de navegação, é 100% público e gratuito, sem necessidade de cadastro.",
        link: "/sobre",
        linkTexto: "Privacidade e Princípios",
      },
      {
        pergunta: "Onde acessar os canais de fiscalização cidadã?",
        resposta:
          "Acesse guias passo a passo para requisições de Lei de Acesso à Informação e denúncias.",
        link: "/direitos-em-movimento",
        linkTexto: "Direitos em Movimento",
      },
    ],
  },

  // ─── TERRA E TERRITÓRIOS ───
  {
    padrao: "^/terra-e-territorios|^/funcaosocialterra",
    sugestoes: [
      {
        pergunta: "Onde acompanhar a reparação da Bacia do Paraopeba (Brumadinho)?",
        resposta:
          "Acompanhe o monitoramento do Acordo de R$ 37,7 bi, perícia da UFMG e a auditoria independente AECOM.",
        link: "/paraopeba",
        linkTexto: "Observatório do Paraopeba",
      },
      {
        pergunta: "Como fiscalizar as 199 cidades estratégicas do Brasil?",
        resposta:
          "Consulte os perfis municipais com indicadores de leitos SUS, qualidade escolar IDEB e finanças públicas.",
        link: "/cidades",
        linkTexto: "199 Cidades Estratégicas",
      },
      {
        pergunta: "Onde consultar o acervo de crimes e desastres de barragens?",
        resposta:
          "A Biblioteca Unificada reúne 936 laudos periciais, TACs e relatórios de saúde comunitária.",
        link: "/ambiental/crimes-socioambientais",
        linkTexto: "Biblioteca de Crimes Socioambientais",
      },
    ],
  },

  // ─── ESTADO E ECONOMIA ───
  {
    padrao: "^/estado-e-economia",
    sugestoes: [
      {
        pergunta: "Como fiscalizar as grandes mineradoras e seus acionistas?",
        resposta:
          "O portal mapeia os maiores fundos de investimento globais da Vale (BlackRock, Capital Group, Previ) e processos.",
        link: "/empresas",
        linkTexto: "Painel de Grandes Empresas",
      },
      {
        pergunta: "Quanto a União transfere aos 853 municípios de Minas Gerais?",
        resposta:
          "Consulte R$ 139 bilhões em transferências federais do ComunicaBR por município mineiro.",
        link: "/dados/comunicabr",
        linkTexto: "ComunicaBR — Repasses Federais",
      },
      {
        pergunta: "Quem fiscaliza os tribunais e o orçamento da Justiça em MG?",
        resposta:
          "Fichas completas do TJMG (R$ 14,9 bi), MPMG (R$ 4,09 bi) e Defensoria Pública (R$ 1,10 bi).",
        link: "/judiciario/instituicoes",
        linkTexto: "Orçamento da Justiça MG",
      },
    ],
  },
];

/**
 * Retorna sugestões contextuais para uma rota específica,
 * garantindo que NENHUMA sugestão aponte para a própria página onde o leitor já está.
 */
export function obterSugestoesContextuais(rota: string): SugestaoContextual[] {
  const rotaLimpa = rota.replace(/\/$/, "");
  for (const ctx of CONTEXTOS) {
    if (new RegExp(ctx.padrao).test(rota)) {
      const filtradas = ctx.sugestoes.filter((s) => s.link.replace(/\/$/, "") !== rotaLimpa);
      if (filtradas.length > 0) return filtradas;
    }
  }
  return [];
}
