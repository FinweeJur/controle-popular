import type { PonteEntreFrentes } from "@/lib/lugares";
import { lugaresPorMunicipioIbge } from "@/lib/lugares";

/**
 * Registro de Diálogos Inter-Frentes (Painéis-Sanfona).
 *
 * Mapeia as conexões sugeridas ativamente quando o usuário visita uma rota
 * do portal (cidade, rio, serra, território ou tema).
 *
 * Regra do portal: no máximo 3 pontes por página, com razão editorial clara,
 * nível de confiança e ressalva em linguagem de gente quando há risco de falsa inferência.
 */

export interface DialogoEntreFrentes {
  rotaOrigem: string;
  topicoPrincipal: string;
  pontes: PonteEntreFrentes[];
}

export const DIALOGOS_CATALOGO: DialogoEntreFrentes[] = [
  // ==========================================
  // AS 6 CIDADES INICIAIS DO PORTAL
  // ==========================================

  // 1. Diamantina
  {
    rotaOrigem: "/diamantina",
    topicoPrincipal: "Parque Estadual do Biribiri e Patrimônio Natural",
    pontes: [
      {
        id: "diamantina-biribiri-onsa",
        frenteOrigem: "cidades",
        rotaOrigem: "/diamantina",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras/serra-do-espinhaco",
        rotuloAmigavel: "Ver conservação, fauna e águas do Biribiri no ONSA",
        topico: "Unidade de Conservação e Recursos Hídricos",
        razaoEditorial:
          "O Parque Estadual do Biribiri protege os mananciais que abastecem Diamantina e as cachoeiras do Sentinela e dos Cristais.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "A administração e a fiscalização da unidade são de competência estadual (IEF), não da Prefeitura.",
        fonteOficial: "IEF-MG (Cadastro Estadual de Unidades de Conservação)",
      },
      {
        id: "diamantina-biribiri-executivo",
        frenteOrigem: "cidades",
        rotaOrigem: "/diamantina",
        frenteDestino: "executivo_estadual",
        rotaDestino: "/ambiental/licenciamento?filtro=biribiri",
        rotuloAmigavel: "Acompanhar projeto de concessão turística do Governo de MG",
        topico: "Edital de Parceria de Uso Público",
        razaoEditorial:
          "O Governo do Estado incluiu a vila histórica e atrativos do Biribiri no Programa de Parcerias de Concessão de Parques.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "A concessão transfere a gestão de bilheteria e serviços de apoio; a terra continua pública e sob proteção ecológica do Estado.",
        fonteOficial: "Diário Oficial do Estado de Minas Gerais (DOE-MG) / SEINFRA",
      },
      {
        id: "diamantina-biribiri-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/diamantina",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=diamantina",
        rotuloAmigavel: "Ver leis e emendas federais para a região do Espinhaço",
        topico: "Legislação e Recursos de Bancada",
        razaoEditorial:
          "Deputados e senadores apresentam proposições sobre o patrimônio histórico e destinam emendas para turismo e saneamento.",
        nivelConfianca: "sinal_investigacao",
        ressalva:
          "Projeto em tramitação é proposta em debate; não tem efeito de lei até ser aprovado e sancionado.",
        fonteOficial: "Câmara dos Deputados e Senado Federal",
      },
    ],
  },

  // 2. Betim
  {
    rotaOrigem: "/betim",
    topicoPrincipal: "Bacia do Paraopeba, Indústria e Transparência Pública",
    pontes: [
      {
        id: "betim-rio-paraopeba",
        frenteOrigem: "cidades",
        rotaOrigem: "/betim",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-paraopeba",
        rotuloAmigavel: "Ver situação do Rio Paraopeba e qualidade da água",
        topico: "Bacia Hidrográfica e Captação",
        razaoEditorial:
          "Parte do abastecimento e da drenagem industrial de Betim interage com a bacia do Paraopeba.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM e COPASA",
      },
      {
        id: "betim-reparacao",
        frenteOrigem: "cidades",
        rotaOrigem: "/betim",
        frenteDestino: "paraopeba",
        rotaDestino: "/paraopeba",
        rotuloAmigavel: "Acompanhar projetos de reparação destinados a Betim",
        topico: "Anexo do Acordo Judicial",
        razaoEditorial:
          "Betim recebe verbas compensatórias e obras públicas previstas nos anexos do Acordo de Brumadinho.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Comitê Pró-Brumadinho / SEPLAG-MG",
      },
      {
        id: "betim-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/betim",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=betim",
        rotuloAmigavel: "Ver proposições e atuação de deputados federais da região",
        topico: "Bancada e Legislação Tributária",
        razaoEditorial:
          "Como segundo maior PIB industrial de MG, Betim é tema constante em debates sobre reforma tributária e repasses do Fundo de Participação.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // 3. Belo Horizonte
  {
    rotaOrigem: "/bh",
    topicoPrincipal: "Região Metropolitana e Bacias das Velhas e Paraopeba",
    pontes: [
      {
        id: "bh-rio-das-velhas",
        frenteOrigem: "cidades",
        rotaOrigem: "/bh",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-das-velhas",
        rotuloAmigavel: "Ver captação e qualidade da água do Rio das Velhas",
        topico: "Abastecimento do Sistema Bela Fama",
        razaoEditorial:
          "Mais da metade da água que abastece Belo Horizonte vem da captação no Rio das Velhas.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "COPASA e Comitê da Bacia Hidrográfica do Rio das Velhas",
      },
      {
        id: "bh-serra-da-piedade",
        frenteOrigem: "cidades",
        rotaOrigem: "/bh",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras/serra-da-piedade",
        rotuloAmigavel: "Ver proteção ambiental das serras no entorno da capital",
        topico: "Patrimônio Natural Metropolitano",
        razaoEditorial:
          "As serras metropolitanas cumprem papel na recarga de aquíferos e no microclima da capital mineira.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEPHA e SEMAD",
      },
      {
        id: "bh-tribunais",
        frenteOrigem: "cidades",
        rotaOrigem: "/bh",
        frenteDestino: "judiciario",
        rotaDestino: "/judiciario",
        rotuloAmigavel: "Acompanhar decisões do TJMG e TRF6 na capital",
        topico: "Decisões Judiciais e Conflitos Urbanos",
        razaoEditorial:
          "Belo Horizonte sedia os tribunais que decidem grandes causas ambientais, minerárias e fundiárias do Estado.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "TJMG e TRF-6",
      },
    ],
  },

  // 4. Araçuaí
  {
    rotaOrigem: "/aracuai",
    topicoPrincipal: "Vale do Jequitinhonha, Água e Mineração de Lítio",
    pontes: [
      {
        id: "aracuai-territorio-vale",
        frenteOrigem: "cidades",
        rotaOrigem: "/aracuai",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-territorios/vale-do-jequitinhonha",
        rotuloAmigavel: "Ver situação do Vale do Jequitinhonha no ONSA Territórios",
        topico: "Identidade Regional e Cadeia do Lítio",
        razaoEditorial:
          "Araçuaí é o polo urbano e logístico da extração de lítio no Vale, que atrai investimentos e pressiona a infraestrutura local.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "O anúncio de polo industrial não se traduz de imediato em enriquecimento da população urbana.",
        fonteOficial: "Governo do Estado de MG e ANM",
      },
      {
        id: "aracuai-rio-jequitinhonha",
        frenteOrigem: "cidades",
        rotaOrigem: "/aracuai",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-jequitinhonha",
        rotuloAmigavel: "Conferir outorgas e vazão do Rio Jequitinhonha",
        topico: "Segurança Hídrica e Bacia Fluvial",
        razaoEditorial:
          "A captação para lavras minerais e o abastecimento humano dependem da disponibilidade hídrica da bacia regional.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM",
      },
      {
        id: "aracuai-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/aracuai",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=aracuai",
        rotuloAmigavel: "Ver emendas de deputados destinadas para Araçuaí",
        topico: "Emendas e Orçamento Federal",
        razaoEditorial:
          "Verbas de bancada estadual e federal complementam as receitas municipais em saúde e infraestrutura urbana.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // 5. Itinga
  {
    rotaOrigem: "/itinga",
    topicoPrincipal: "Vale do Jequitinhonha e Território Tradicional",
    pontes: [
      {
        id: "itinga-vale",
        frenteOrigem: "cidades",
        rotaOrigem: "/itinga",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-territorios/vale-do-jequitinhonha",
        rotuloAmigavel: "Ver direitos comunitários do Vale no ONSA Territórios",
        topico: "Comunidades Tradicionais e Emprego",
        razaoEditorial:
          "Itinga concentra minas ativas de lítio e discute com o Estado o retorno de impostos para a população local.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "ANM e Secretaria de Desenvolvimento Econômico de MG",
      },
      {
        id: "itinga-rio",
        frenteOrigem: "cidades",
        rotaOrigem: "/itinga",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-jequitinhonha",
        rotuloAmigavel: "Ver vazão e monitoramento do Rio Jequitinhonha",
        topico: "Recursos Hídricos e Saneamento",
        razaoEditorial:
          "O Rio Jequitinhonha margeia o perímetro urbano de Itinga e sustenta hortas comunitárias e pesca.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM",
      },
      {
        id: "itinga-cultura",
        frenteOrigem: "cidades",
        rotaOrigem: "/itinga",
        frenteDestino: "cidades",
        rotaDestino: "/itinga/prefeitura/cultura",
        rotuloAmigavel: "Ver projetos culturais e artesãos da cidade",
        topico: "Patrimônio Cultural e Artesanato",
        razaoEditorial:
          "A preservação do saber ceramista e cultural de Itinga dialoga com a preservação do território.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Prefeitura Municipal de Itinga",
      },
    ],
  },

  // 6. São Paulo
  {
    rotaOrigem: "/sp",
    topicoPrincipal: "Mananciais Metropolitanos, Cantareira e Clima Urbano",
    pontes: [
      {
        id: "sp-mananciais-tiete",
        frenteOrigem: "cidades",
        rotaOrigem: "/sp",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-tiete",
        rotuloAmigavel: "Ver situação dos mananciais Billings, Guarapiranga e Cantareira",
        topico: "Segurança Hídrica e Bacia do Alto Tietê",
        razaoEditorial:
          "O abastecimento da maior metrópole da América Latina depende da proteção ambiental dos mananciais do entorno.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "A operação dos sistemas de captação e tratamento é dividida entre SABESP, DAEE e prefeituras do consórcio metropolitano.",
        fonteOficial: "SABESP / DAEE-SP / Comitê da Bacia Hidrográfica do Alto Tietê",
      },
      {
        id: "sp-serra-cantareira",
        frenteOrigem: "cidades",
        rotaOrigem: "/sp",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras/serra-da-cantareira",
        rotuloAmigavel: "Acompanhar preservação do cinturão verde e Parque da Cantareira",
        topico: "Floresta Tropical Urbana e Regulação Térmica",
        razaoEditorial:
          "A Serra da Cantareira abriga remanescentes de Mata Atlântica que filtram a água e amenizam as ilhas de calor urbanas.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Fundação Florestal / Secretaria do Meio Ambiente de SP",
      },
      {
        id: "sp-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/sp",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=sao+paulo",
        rotuloAmigavel: "Ver recursos e leis da bancada paulista no Congresso",
        topico: "Bancada Federal e Orçamento da União",
        razaoEditorial:
          "A bancada de São Paulo debate repasses para infraestrutura de drenagem urbana, transporte público e saneamento básico.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados e Senado Federal",
      },
    ],
  },

  // ==========================================
  // CAPITAIS DO FOCO SUDESTE
  // ==========================================

  // Rio de Janeiro
  {
    rotaOrigem: "/rio-de-janeiro",
    topicoPrincipal: "Baía de Guanabara, Sistema Guandu e Encostas",
    pontes: [
      {
        id: "rio-guandu",
        frenteOrigem: "cidades",
        rotaOrigem: "/rio-de-janeiro",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-guandu",
        rotuloAmigavel: "Ver qualidade da água do Rio Guandu e metas da Baía",
        topico: "Abastecimento Metropolitano e Despoluição",
        razaoEditorial:
          "O Rio Guandu fornece mais de 80% da água consumida na capital fluminense e na Baixada.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "CEDAE e INEA-RJ",
      },
      {
        id: "rio-parque-tijuca",
        frenteOrigem: "cidades",
        rotaOrigem: "/rio-de-janeiro",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras",
        rotuloAmigavel: "Ver contenção de encostas e Mata Atlântica nos maciços",
        topico: "Parque Nacional da Tijuca e Gestão de Riscos",
        razaoEditorial:
          "A cobertura florestal dos maciços costeiros previne deslizamentos severos durante episódios de chuvas extremas.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "ICMBio e Defesa Civil Municipal",
      },
      {
        id: "rio-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/rio-de-janeiro",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=rio+de+janeiro",
        rotuloAmigavel: "Acompanhar emendas e recursos federais para a capital",
        topico: "Bancada Fluminense e Repasses da União",
        razaoEditorial:
          "Deputados e senadores do RJ articulam investimentos federais em segurança pública, saúde e revitalização da Baía.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // Vitória
  {
    rotaOrigem: "/vitoria",
    topicoPrincipal: "Foz do Rio Doce, Manguezais e Logística Portuária",
    pontes: [
      {
        id: "vitoria-rio-doce",
        frenteOrigem: "cidades",
        rotaOrigem: "/vitoria",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-doce",
        rotuloAmigavel: "Acompanhar a foz do Rio Doce e repactuação judicial",
        topico: "Impactos na Costa Capixaba e Pesca Marinha",
        razaoEditorial:
          "A repactuação do desastre de Mariana envolve indenizações a pescadores de Linhares, Colatina e litoral norte capixaba.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "TRF-6 e Governo do Espírito Santo",
      },
      {
        id: "vitoria-baia",
        frenteOrigem: "cidades",
        rotaOrigem: "/vitoria",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos",
        rotuloAmigavel: "Ver manguezais urbanos e controle de poeira sedimentável",
        topico: "Qualidade do Ar e Preservação Costeira",
        razaoEditorial:
          "A capital do Espírito Santo monitora ativamente as emissões portuárias de minério de ferro e carvão na Baía de Vitória.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEMA-ES",
      },
      {
        id: "vitoria-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/vitoria",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=vitoria",
        rotuloAmigavel: "Ver emendas e atuação da bancada capixaba no Congresso",
        topico: "Infraestrutura Portuária e Logística",
        razaoEditorial:
          "A bancada do ES atua em votações estratégicas sobre portos, ferrovias e compensações financeiras de petróleo e minério.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // ==========================================
  // POLOS E CIDADES DO INTERIOR ESTRATÉGICO
  // ==========================================

  // Brumadinho
  {
    rotaOrigem: "/brumadinho",
    topicoPrincipal: "Reparação do Desastre, Bacia do Paraopeba e Serra da Moeda",
    pontes: [
      {
        id: "brumadinho-reparacao",
        frenteOrigem: "cidades",
        rotaOrigem: "/brumadinho",
        frenteDestino: "paraopeba",
        rotaDestino: "/paraopeba",
        rotuloAmigavel: "Acompanhar execução e auditoria do Acordo Judicial",
        topico: "Reparação Integral e Obras no Município",
        razaoEditorial:
          "Brumadinho é o epicentro do rompimento da barragem da Vale em 2019 e recebe as principais medidas socioeconômicas.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "TJMG, MPMG e Comitê Pró-Brumadinho",
      },
      {
        id: "brumadinho-rio-paraopeba",
        frenteOrigem: "cidades",
        rotaOrigem: "/brumadinho",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-paraopeba",
        rotuloAmigavel: "Ver monitoramento do Rio Paraopeba no ONSA",
        topico: "Calha do Rio e Qualidade Hídrica",
        razaoEditorial:
          "O leito do Paraopeba recebeu os rejeitos da Mina Córrego do Feijão e passa por obras contínuas de dragagem e recuperação.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM",
      },
      {
        id: "brumadinho-serra-moeda",
        frenteOrigem: "cidades",
        rotaOrigem: "/brumadinho",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras/serra-da-moeda",
        rotuloAmigavel: "Ver proteção dos aquíferos da Serra da Moeda",
        topico: "Mananciais Preservados e Patrimônio Geológico",
        razaoEditorial:
          "A Serra da Moeda abriga mananciais preservados que alimentam comunidades tradicionais e vilas de Brumadinho.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEF-MG",
      },
    ],
  },

  // Mariana
  {
    rotaOrigem: "/mariana",
    topicoPrincipal: "Desastre do Fundão, Repactuação e Patrimônio Barroco",
    pontes: [
      {
        id: "mariana-rio-doce",
        frenteOrigem: "cidades",
        rotaOrigem: "/mariana",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-doce",
        rotuloAmigavel: "Ver situação do Rio Doce e repactuação no TRF6",
        topico: "Desastre do Fundão e Calha Fluvial",
        razaoEditorial:
          "O rompimento da barragem de Fundão (Samarco/Vale/BHP) atingiu distritos de Mariana e percorreu toda a bacia até o mar.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Fundação Renova e TRF-6",
      },
      {
        id: "mariana-cfem",
        frenteOrigem: "cidades",
        rotaOrigem: "/mariana",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/licenciamento",
        rotuloAmigavel: "Ver arrecadação de CFEM e licenças minerárias ativas",
        topico: "Dependência Econômica da Mineração",
        razaoEditorial:
          "Mariana debate a diversificação de sua matriz tributária e a convivência com grandes cavas de minério de ferro.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "ANM e Secretaria de Fazenda de Mariana",
      },
      {
        id: "mariana-patrimonio",
        frenteOrigem: "cidades",
        rotaOrigem: "/mariana",
        frenteDestino: "cidades",
        rotaDestino: "/mariana/prefeitura/cultura",
        rotuloAmigavel: "Acompanhar restauro do patrimônio histórico e barroco",
        topico: "Patrimônio Histórico Nacional",
        razaoEditorial:
          "Primeira capital de Minas Gerais, Mariana reúne igrejas e casarios tombados pelo IPHAN que demandam conservação contínua.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IPHAN e IEPHA",
      },
    ],
  },

  // Governador Valadares
  {
    rotaOrigem: "/governador-valadares",
    topicoPrincipal: "Médio Rio Doce e Segurança do Abastecimento Urbano",
    pontes: [
      {
        id: "valadares-rio-doce",
        frenteOrigem: "cidades",
        rotaOrigem: "/governador-valadares",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-doce",
        rotuloAmigavel: "Ver qualidade da água do Rio Doce e nova captação",
        topico: "Abastecimento Hídrico e Alternativas de Captação",
        razaoEditorial:
          "Valadares enfrentou interrupção total de captação em 2015 e concluiu adutora alternativa financiada pela reparação.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "SAAE Valadares e IGAM",
      },
      {
        id: "valadares-judiciario",
        frenteOrigem: "cidades",
        rotaOrigem: "/governador-valadares",
        frenteDestino: "judiciario",
        rotaDestino: "/judiciario",
        rotuloAmigavel: "Acompanhar ações indenizatórias na Justiça Federal",
        topico: "Indenizações a Atingidos e Comércio Local",
        razaoEditorial:
          "Milhares de moradores e comerciantes de Valadares ingressaram com ações judiciais requerendo indenizações por danos d'água.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "TRF-6",
      },
      {
        id: "valadares-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/governador-valadares",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=governador+valadares",
        rotuloAmigavel: "Ver recursos e emendas federais para a região do Rio Doce",
        topico: "Bancada Federal e Fundo de Recuperação",
        razaoEditorial:
          "Parlamentares federais destinam recursos de infraestrutura e saúde para o polo regional do Leste de Minas.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // Ouro Preto
  {
    rotaOrigem: "/ouro-preto",
    topicoPrincipal: "Cabeceiras das Velhas e Rio Doce, Itacolomi e Mineração",
    pontes: [
      {
        id: "ouro-preto-serras",
        frenteOrigem: "cidades",
        rotaOrigem: "/ouro-preto",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossas-serras/serra-do-espinhaco",
        rotuloAmigavel: "Ver Parque do Itacolomi e divisor de águas no ONSA",
        topico: "Parque Estadual e Nascentes Centrais",
        razaoEditorial:
          "Ouro Preto abriga as nascentes do Rio das Velhas e do Rio Doce, protegidas pelo Parque Estadual do Itacolomi.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEF-MG",
      },
      {
        id: "ouro-preto-barragens",
        frenteOrigem: "cidades",
        rotaOrigem: "/ouro-preto",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/barragens",
        rotuloAmigavel: "Consultar barragens de mineração no território municipal",
        topico: "Barragens a Montante e Segurança Comunitária",
        razaoEditorial:
          "Distritos como Antônio Pereira e Rodrigo Silva convivem com estruturas de contenção de rejeitos em descaracterização.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "ANM / SIGBM",
      },
      {
        id: "ouro-preto-patrimonio",
        frenteOrigem: "cidades",
        rotaOrigem: "/ouro-preto",
        frenteDestino: "cidades",
        rotaDestino: "/ouro-preto/prefeitura/cultura",
        rotuloAmigavel: "Ver conservação do patrimônio tombado pela UNESCO",
        topico: "Patrimônio Cultural Mundial",
        razaoEditorial:
          "Primeiro sítio cultural brasileiro reconhecido pela UNESCO, com rigorosas regras de ocupação e proteção visual.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IPHAN e UNESCO",
      },
    ],
  },

  // Montes Claros
  {
    rotaOrigem: "/montes-claros",
    topicoPrincipal: "Cerrado Norte Mineiro, Semiárido e Bacia do São Francisco",
    pontes: [
      {
        id: "montes-claros-cerrado",
        frenteOrigem: "cidades",
        rotaOrigem: "/montes-claros",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-territorios/cerrado",
        rotuloAmigavel: "Ver conservação do Cerrado e recarga de aquíferos",
        topico: "Cerrado e Recursos Hídricos do Norte",
        razaoEditorial:
          "Montes Claros é o principal polo do Norte de MG, dependente da conservação das veredas e nascentes para enfrentar períodos de seca.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM / IEF-MG",
      },
      {
        id: "montes-claros-sao-francisco",
        frenteOrigem: "cidades",
        rotaOrigem: "/montes-claros",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-sao-francisco",
        rotuloAmigavel: "Ver situação da Bacia do Rio São Francisco",
        topico: "Bacia Hidrográfica e Irrigação Regional",
        razaoEditorial:
          "A produção agrícola regional e o equilíbrio hídrico dos afluentes do São Francisco alimentam a economia do polo regional.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Codevasf e Comitê de Bacia",
      },
      {
        id: "montes-claros-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/montes-claros",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=montes+claros",
        rotuloAmigavel: "Acompanhar projetos da bancada do Norte de Minas",
        topico: "Recursos da SUDENE e Seca",
        razaoEditorial:
          "Parlamentares da região atuam na destinação de verbas da Defesa Civil e inclusão em fundos de desenvolvimento regional.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // Uberlândia
  {
    rotaOrigem: "/uberlandia",
    topicoPrincipal: "Bacia do Rio Araguari, Cerrado Produtivo e Agroindústria",
    pontes: [
      {
        id: "uberlandia-rio-araguari",
        frenteOrigem: "cidades",
        rotaOrigem: "/uberlandia",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-araguari",
        rotuloAmigavel: "Ver outorgas e preservação da Bacia do Araguari",
        topico: "Segurança Hídrica e Agroindústria",
        razaoEditorial:
          "O Rio Araguari e seus tributários sustentam o polo agroindustrial do Triângulo Mineiro e a geração hidrelétrica regional.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IGAM / DMAE Uberlândia",
      },
      {
        id: "uberlandia-cerrado",
        frenteOrigem: "cidades",
        rotaOrigem: "/uberlandia",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-territorios/cerrado",
        rotuloAmigavel: "Ver cobertura do Cerrado no Triângulo Mineiro",
        topico: "Bioma Cerrado e Reserva Legal",
        razaoEditorial:
          "A região combina alta produtividade agrícola com a necessidade de conservação de remanescentes e matas de galeria.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEF-MG",
      },
      {
        id: "uberlandia-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/uberlandia",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=uberlandia",
        rotuloAmigavel: "Ver emendas e atuação parlamentar para o Triângulo",
        topico: "Infraestrutura Viária e Logística",
        razaoEditorial:
          "A bancada federal direciona recursos para duplicações de rodovias de escoamento e fortalecimento de hospitais universitários.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // Juiz de Fora
  {
    rotaOrigem: "/juiz-de-fora",
    topicoPrincipal: "Bacia do Paraíba do Sul, Mata Atlântica e Polo da Zona da Mata",
    pontes: [
      {
        id: "jf-paraiba-do-sul",
        frenteOrigem: "cidades",
        rotaOrigem: "/juiz-de-fora",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-rios/rio-paraiba-do-sul",
        rotuloAmigavel: "Ver situação da Bacia do Paraíba do Sul e Rio Paraibuna",
        topico: "Bacia Fluvial e Drenagem Urbana",
        razaoEditorial:
          "O Rio Paraibuna corta a área urbana de Juiz de Fora e compõe a bacia federal do Paraíba do Sul.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "CESAMA e CEIVAP",
      },
      {
        id: "jf-mata-atlantica",
        frenteOrigem: "cidades",
        rotaOrigem: "/juiz-de-fora",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos",
        rotuloAmigavel: "Ver remanescentes de Mata Atlântica na Zona da Mata",
        topico: "Reserva Biológica e Proteção de Encostas",
        razaoEditorial:
          "A topografia montanhosa da Zona da Mata exige proteção florestal contra escorregamentos de terra.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IEF-MG",
      },
      {
        id: "jf-congresso",
        frenteOrigem: "cidades",
        rotaOrigem: "/juiz-de-fora",
        frenteDestino: "congresso",
        rotaDestino: "/congresso?termo=juiz+de+fora",
        rotuloAmigavel: "Acompanhar emendas e proposições para a Zona da Mata",
        topico: "Saúde Regional e Educação Federal",
        razaoEditorial:
          "Juiz de Fora sedia polo de atendimento hospitalar e universidade federal receptores de emendas parlamentares.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Câmara dos Deputados",
      },
    ],
  },

  // ==========================================
  // PONTES DE ORIGEM EM LUGARES (Coleção Nossos)
  // ==========================================

  // Rio Paraopeba
  {
    rotaOrigem: "/ambiental/nossos-rios/rio-paraopeba",
    topicoPrincipal: "Bacia do Paraopeba e Reparação de Danos",
    pontes: [
      {
        id: "paraopeba-reparacao",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossos-rios/rio-paraopeba",
        frenteDestino: "paraopeba",
        rotaDestino: "/paraopeba",
        rotuloAmigavel: "Acompanhar a execução do Acordo Judicial de Reparação",
        topico: "Acordo de Brumadinho e Obras de Calha",
        razaoEditorial:
          "O desastre de 2019 comprometeu a calha do rio; o acordo destina recursos para saneamento e desassoreamento da bacia.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "Receber recurso do acordo apoia a recuperação pública da bacia, mas a recuperação biológica plena leva anos.",
        fonteOficial: "MPMG, MPF e Tribunal de Justiça de MG (TJMG)",
      },
      {
        id: "paraopeba-territorios",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossos-rios/rio-paraopeba",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/nossos-territorios",
        rotuloAmigavel: "Ver comunidades quilombolas e ribeirinhas na bacia",
        topico: "Povos Tradicionais e Subsistência",
        razaoEditorial:
          "Comunidades tradicionais e pescadores artesanais dependem diretamente do rio para trabalho e segurança alimentar.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "A restrição temporária de pesca não cancela a titularidade territorial das comunidades ribeirinhas.",
        fonteOficial: "Fundação Cultural Palmares e IGAM",
      },
      {
        id: "paraopeba-cidades",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossos-rios/rio-paraopeba",
        frenteDestino: "cidades",
        rotaDestino: "/betim",
        rotuloAmigavel: "Ver contas e captação de água de Betim, cidade banhada pelo rio",
        topico: "Gestão Municipal e Abastecimento",
        razaoEditorial:
          "Municípios da calha administram serviços públicos impactados pela mudança nos pontos de captação de água da COPASA.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "COPASA e Prefeitura Municipal de Betim",
      },
    ],
  },

  // Serra do Espinhaço
  {
    rotaOrigem: "/ambiental/nossas-serras/serra-do-espinhaco",
    topicoPrincipal: "Cordilheira do Espinhaço e Gestão Regional",
    pontes: [
      {
        id: "espinhaco-diamantina",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossas-serras/serra-do-espinhaco",
        frenteDestino: "cidades",
        rotaDestino: "/diamantina",
        rotuloAmigavel: "Ver dados e contratos de Diamantina, polo do Alto Espinhaço",
        topico: "Município Polo e Turismo Cultural",
        razaoEditorial:
          "Diamantina concentra o acesso às vilas históricas da serra e sedia as principais audiências públicas sobre o patrimônio natural.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "IBGE e IPHAN",
      },
      {
        id: "espinhaco-mineracao-cfem",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossas-serras/serra-do-espinhaco",
        frenteDestino: "ambiental",
        rotaDestino: "/ambiental/licenciamento",
        rotuloAmigavel: "Consultar licenças ambientais ativas na cordilheira",
        topico: "Licenciamento e Mineração no Relevo",
        razaoEditorial:
          "A serra abriga jazidas minerais e unidades de conservação que disputam o mesmo espaço geográfico nas pautas do COPAM.",
        nivelConfianca: "fato_documentado",
        ressalva:
          "Processo em análise no órgão ambiental indica requerimento da empresa; não atesta concessão automática de licença.",
        fonteOficial: "SEMAD e COPAM-MG",
      },
      {
        id: "espinhaco-tribunais",
        frenteOrigem: "ambiental",
        rotaOrigem: "/ambiental/nossas-serras/serra-do-espinhaco",
        frenteDestino: "judiciario",
        rotaDestino: "/judiciario",
        rotuloAmigavel: "Ver ações judiciais coletivas sobre proteção de nascentes",
        topico: "Ações Civis Públicas e Termos de Ajustamento",
        razaoEditorial:
          "O Ministério Público move ações para garantir faixas de preservação permanente nas encostas do Espinhaço.",
        nivelConfianca: "fato_documentado",
        fonteOficial: "Tribunal de Justiça de Minas Gerais (TJMG)",
      },
    ],
  },
];

/**
 * Gera pontes de diálogo automáticas para qualquer município que não possua
 * curadoria manual dedicada, cruzando código IBGE com bacias, serras e delegações.
 */
export function gerarPontesAutomaticas(
  rota: string,
  codigoIbge: string,
  nomeCidade: string
): PonteEntreFrentes[] {
  const pontes: PonteEntreFrentes[] = [];
  const lugares = lugaresPorMunicipioIbge(codigoIbge);

  // 1. Conexão com rio interceptado
  const rio = lugares.find((l) => l.tipo === "rio");
  if (rio) {
    pontes.push({
      id: `auto-${codigoIbge}-rio`,
      frenteOrigem: "cidades",
      rotaOrigem: rota,
      frenteDestino: "ambiental",
      rotaDestino: `/ambiental/nossos-rios/${rio.id}`,
      rotuloAmigavel: `Ver bacia do ${rio.nome} e qualidade das águas no ONSA`,
      topico: "Bacia Hidrográfica e Abastecimento",
      razaoEditorial: `${nomeCidade} integra a bacia do ${rio.nome}, com impacto direto na captação de água e no saneamento local.`,
      nivelConfianca: "fato_documentado",
      ressalva:
        "A bacia abrange múltiplos municípios; a gestão das águas é compartilhada entre comitês de bacia e órgãos estaduais.",
      fonteOficial: "IGAM / Agência Nacional de Águas (ANA)",
    });
  }

  // 2. Conexão com serra interceptada
  const serra = lugares.find((l) => l.tipo === "serra");
  if (serra && pontes.length < 3) {
    pontes.push({
      id: `auto-${codigoIbge}-serra`,
      frenteOrigem: "cidades",
      rotaOrigem: rota,
      frenteDestino: "ambiental",
      rotaDestino: `/ambiental/nossas-serras/${serra.id}`,
      rotuloAmigavel: `Ver preservação e relevo na ${serra.nome}`,
      topico: "Cordilheiras e Recarga de Aquíferos",
      razaoEditorial: `O território de ${nomeCidade} intercepta as encostas da ${serra.nome}, área relevante para o clima e recarga hídrica.`,
      nivelConfianca: "fato_documentado",
      fonteOficial: "Serviço Geológico do Brasil / IEF",
    });
  }

  // 3. Conexão com Congresso (Emendas e Leis Federais)
  if (pontes.length < 3) {
    pontes.push({
      id: `auto-${codigoIbge}-congresso`,
      frenteOrigem: "cidades",
      rotaOrigem: rota,
      frenteDestino: "congresso",
      rotaDestino: `/congresso?termo=${encodeURIComponent(nomeCidade.toLowerCase())}`,
      rotuloAmigavel: `Ver emendas parlamentares e projetos federais para ${nomeCidade}`,
      topico: "Orçamento da União e Bancada",
      razaoEditorial: `Acompanhe recursos indicados por deputados federais e senadores para serviços de saúde, educação e obras em ${nomeCidade}.`,
      nivelConfianca: "fato_documentado",
      ressalva:
        "A indicação de emenda orçamentária é compromisso do parlamentar; a liberação do dinheiro depende de atos do Governo Federal.",
      fonteOficial: "Câmara dos Deputados e Portal da Transparência Federal",
    });
  }

  // 4. Se ainda houver vaga (ex.: cidade sem serra), adiciona fiscalização ambiental do COPAM
  if (pontes.length < 3) {
    pontes.push({
      id: `auto-${codigoIbge}-ambiental-geral`,
      frenteOrigem: "cidades",
      rotaOrigem: rota,
      frenteDestino: "ambiental",
      rotaDestino: "/ambiental/licenciamento",
      rotuloAmigavel: `Consultar processos de licenciamento ambiental na região`,
      topico: "Fiscalização e Atos do COPAM",
      razaoEditorial: `Empreendimentos industriais, agrícolas e de infraestrutura com potencial de impacto em ${nomeCidade} tramitam nos órgãos ambientais.`,
      nivelConfianca: "sinal_investigacao",
      fonteOficial: "SEMAD e COPAM",
    });
  }

  return pontes.slice(0, 3);
}

/**
 * Retorna até 3 pontes de diálogo para uma determinada rota do portal.
 * Suporta fallback automático quando informado o código IBGE municipal.
 */
export function obterDialogosPorRota(
  rota: string,
  codigoIbge?: string,
  nomeCidade?: string
): PonteEntreFrentes[] {
  const normalizada = rota.endsWith("/") && rota.length > 1 ? rota.slice(0, -1) : rota;
  const match = DIALOGOS_CATALOGO.find((d) => d.rotaOrigem === normalizada);
  if (match && match.pontes.length > 0) {
    return match.pontes.slice(0, 3);
  }

  // Se informado código IBGE, gera conexões territoriais e legislativas automaticamente
  if (codigoIbge) {
    return gerarPontesAutomaticas(normalizada, codigoIbge, nomeCidade ?? "este município");
  }

  return [];
}

/**
 * Retorna o tópico principal de diálogo para uma rota, se existir.
 */
export function obterTopicoDialogo(rota: string, nomeCidade?: string): string {
  const normalizada = rota.endsWith("/") && rota.length > 1 ? rota.slice(0, -1) : rota;
  const match = DIALOGOS_CATALOGO.find((d) => d.rotaOrigem === normalizada);
  if (match) return match.topicoPrincipal;
  if (nomeCidade) return `Conexões regionais e ambientais de ${nomeCidade}`;
  return "Temas interligados por aqui";
}
