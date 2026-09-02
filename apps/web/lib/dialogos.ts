import type { PonteEntreFrentes } from "@/lib/lugares";

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
];

/**
 * Retorna até 3 pontes de diálogo para uma determinada rota do portal.
 */
export function obterDialogosPorRota(rota: string): PonteEntreFrentes[] {
  const normalizada = rota.endsWith("/") && rota.length > 1 ? rota.slice(0, -1) : rota;
  const match = DIALOGOS_CATALOGO.find((d) => d.rotaOrigem === normalizada);
  if (!match) return [];
  // Garantir a regra editorial de no máximo 3 pontes ativas por tela
  return match.pontes.slice(0, 3);
}

/**
 * Retorna o tópico principal de diálogo para uma rota, se existir.
 */
export function obterTopicoDialogo(rota: string): string | undefined {
  const normalizada = rota.endsWith("/") && rota.length > 1 ? rota.slice(0, -1) : rota;
  return DIALOGOS_CATALOGO.find((d) => d.rotaOrigem === normalizada)?.topicoPrincipal;
}
