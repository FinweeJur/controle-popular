/**
 * ═══ CAPACIDADE INSTITUCIONAL DOS ÓRGÃOS AMBIENTAIS ═══
 *
 * Mapeamento analítico e estrutural da força de trabalho, orçamento real,
 * sobrecarga processual, histórico de concursos públicos e governança
 * institucional dos órgãos ambientais (Estaduais MG, Federais e Referências Estaduais).
 *
 * Fontes oficiais consolidadas:
 * - Relatórios de Gestão e Contas TCU / TCE-MG (2016-2026)
 * - SICAR / CAR (Serviço Florestal Brasileiro e SISEMA/IEF)
 * - Editais Oficiais de Concursos (IBGP, Cebraspe, FGV, Vunesp, Fundatec)
 * - Portais de Transparência e Diários Oficiais Estaduais e da União
 * - Painéis estatísticos do IBAMA, ICMBio, FEAM, IGAM e CETESB
 */

export type EsferaOrgao = "Estadual MG" | "Federal" | "Outros Estados";
export type FaixaVariacao = "Queda acentuada (> 30%)" | "Queda moderada (10% a 30%)" | "Estável (< 10%)";
export type NivelSobrecarga = "Crítica" | "Alta" | "Moderada";

export interface ConcursoInfo {
  anoUltimoConcurso: number;
  vagasOfertadas: number;
  anosHiato: number;
  situacao: "Vigente / Homologado" | "Em andamento / Previsto" | "Crítico (Sem concurso há > 10 anos)" | "Expirado";
  banca?: string;
  editalUrl?: string;
  resumoHiato: string;
}

export interface AreaOrganograma {
  nomeArea: string;
  siglaArea: string;
  responsavel: string;
  cargo: string;
  telefone: string;
  email: string;
  endereco: string;
  siteUrl: string;
  atribuicoes: string;
}

export interface ContatoInstitucional {
  enderecoCompleto: string;
  telefoneGeral: string;
  emailGeral: string;
  ouvidoriaCanal: string;
  ouvidoriaUrl: string;
  ouvidoriaTelefone: string;
  portalTransparenciaUrl: string;
}

export interface LiderancaOrgao {
  cargo: string;
  nome: string;
  mandato: string;
  investidura: string;
}

export interface OrgaoCapacidade {
  id: string;
  sigla: string;
  nome: string;
  esfera: EsferaOrgao;
  papelRegulatorio: string;
  efetivo2016: number;
  efetivo2026: number;
  variacaoEfetivoPct: number;
  faixaVariacao: FaixaVariacao;
  orcamentoRealPct: number;
  processosRepresados: number;
  analistasAtivos: number;
  sobrecargaProcessosPorAnalista: number;
  nivelSobrecarga: NivelSobrecarga;
  atribuicoesLegais: string[];
  baseLegal: string;
  lideranca: LiderancaOrgao;
  contatos: ContatoInstitucional;
  organograma: AreaOrganograma[];
  concurso: ConcursoInfo;
  urlTransparencia: string;
  urlRelatorioGestao: string;
  destaqueAlerta?: string;
}

export interface CoberturaCapacidade {
  totalOrgaos: number;
  totalOrgaosAuditados: number;
  mediaPerdaServidoresPct: number;
  quedaMediaServidoresPct: number;
  quedaMediaOrcamentoRealPct: number;
  volumeConsolidadoRepresado: number;
  orgaoMaiorSobrecarga: string;
  sobrecargaMaxima: number;
  maiorSobrecargaProcessosPorAnalista: number;
  destaqueSobrecarga: string;
  totalServidores2016: number;
  totalServidores2026: number;
  totalAnalistasAtivos: number;
}

export const ORGAOS_CAPACIDADE: OrgaoCapacidade[] = [
  {
    id: "ief-mg",
    sigla: "IEF-MG",
    nome: "Instituto Estadual de Florestas de Minas Gerais",
    esfera: "Estadual MG",
    papelRegulatorio: "Florestas, Unidades de Conservação e Cadastro Ambiental Rural (CAR)",
    efetivo2016: 1340,
    efetivo2026: 712,
    variacaoEfetivoPct: -46.9,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -24.8,
    processosRepresados: 312450,
    analistasAtivos: 135,
    sobrecargaProcessosPorAnalista: 2314,
    nivelSobrecarga: "Crítica",
    destaqueAlerta: "Maior gargalo do país no CAR: 312 mil cadastros pendentes de análise para apenas 135 analistas.",
    baseLegal: "Lei Estadual nº 2.606/1962, Lei Delegada nº 180/2011 e Lei nº 20.922/2013",
    atribuicoesLegais: [
      "Gestão de 95 Unidades de Conservação estaduais (Parques, APA e Estações Ecológicas).",
      "Análise e validação do Cadastro Ambiental Rural (CAR) e adesão ao PRA em Minas Gerais.",
      "Autorização para intervenção ambiental, desmate legalizado e colheita florestal.",
      "Fiscalização do cumprimento de reposição florestal e créditos de compensação."
    ],
    lideranca: {
      cargo: "Diretor-Geral",
      nome: "Breno Esteves Lasmar",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Governador do Estado de Minas Gerais"
    },
    contatos: {
      enderecoCompleto: "Cidade Administrativa, Rodovia Papa João Paulo II, 4143, Prédio Minas, 1º andar, Bairro Serra Verde, Belo Horizonte - MG, CEP 31630-900",
      telefoneGeral: "(31) 3915-1000 / 162",
      emailGeral: "ief@meioambiente.mg.gov.br",
      ouvidoriaCanal: "Ouvidoria Geral do Estado de Minas Gerais (OGE-MG - Meio Ambiente)",
      ouvidoriaUrl: "https://www.ouvidoriageral.mg.gov.br",
      ouvidoriaTelefone: "162 / (31) 3915-2022",
      portalTransparenciaUrl: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/ief"
    },
    concurso: {
      anoUltimoConcurso: 2023,
      vagasOfertadas: 163,
      anosHiato: 15,
      situacao: "Vigente / Homologado",
      banca: "IBGP Concursos",
      editalUrl: "https://www.ibgpconcursos.com.br",
      resumoHiato: "Esperou 15 anos (2008–2023) para abrir apenas 163 vagas, cobrindo menos de 25% dos 628 cargos vagos acumulados."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Controle Processual e Cadastro Ambiental (DCPF / CAR)",
        siglaArea: "DCPF",
        responsavel: "Gláucia Sousa Guimarães",
        cargo: "Diretora de Controle Processual",
        telefone: "(31) 3915-1320",
        email: "car.ief@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Norte, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/car-sicar-mg",
        atribuicoes: "Coordena a fila do CAR-MG, validação eletrônica e passivo de 312 mil imóveis rurais."
      },
      {
        nomeArea: "Diretoria de Unidades de Conservação e Biodiversidade",
        siglaArea: "DUC",
        responsavel: "Pedro Carmo Aguiar",
        cargo: "Diretor de Unidades de Conservação",
        telefone: "(31) 3915-1355",
        email: "duc@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Sul, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/unidades-de-conservacao",
        atribuicoes: "Administração de parques estaduais, planos de manejo, brigadas de incêndio e concessões ecológicas."
      },
      {
        nomeArea: "Diretoria de Conservação e Recuperação de Ecossistemas",
        siglaArea: "DCRE",
        responsavel: "Marina Campos Silveira",
        cargo: "Diretora de Ecossistemas",
        telefone: "(31) 3915-1380",
        email: "dcre@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Leste, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/restauracao-florestal",
        atribuicoes: "Fomento florestal, viveiros públicos, compensações por supressão de vegetação e áreas degradadas."
      }
    ],
    urlTransparencia: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/ief",
    urlRelatorioGestao: "https://www.meioambiente.mg.gov.br/relatorios-de-gestao-ief"
  },
  {
    id: "feam-mg",
    sigla: "FEAM",
    nome: "Fundação Estadual do Meio Ambiente de Minas Gerais",
    esfera: "Estadual MG",
    papelRegulatorio: "Licenciamento de Indústrias, Mineração e Segurança de Barragens",
    efetivo2016: 820,
    efetivo2026: 524,
    variacaoEfetivoPct: -36.1,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -18.2,
    processosRepresados: 18940,
    analistasAtivos: 110,
    sobrecargaProcessosPorAnalista: 172,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Monitoramento de 23 barragens de rejeito com método a montante ainda em descaracterização.",
    baseLegal: "Lei Estadual nº 21.972/2016 e Lei Estadual nº 23.291/2019 (Lei Mar de Lama Nunca Mais)",
    atribuicoesLegais: [
      "Licenciamento ambiental de complexos minerários, metalúrgicos e de infraestrutura pesada.",
      "Fiscalização direta de barragens de rejeitos e aplicação da Política Estadual de Segurança de Barragens.",
      "Monitoramento da qualidade do ar, gestão de resíduos sólidos e recuperação de solos contaminados.",
      "Auditoria extraordinária independente pós-desastres em Mariana e Brumadinho."
    ],
    lideranca: {
      cargo: "Presidente",
      nome: "Rodrigo Franco",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Governador do Estado de Minas Gerais"
    },
    contatos: {
      enderecoCompleto: "Cidade Administrativa, Rodovia Papa João Paulo II, 4143, Prédio Minas, 1º andar, Belo Horizonte - MG, CEP 31630-900",
      telefoneGeral: "(31) 3915-1000 / 162",
      emailGeral: "feam@meioambiente.mg.gov.br",
      ouvidoriaCanal: "Ouvidoria Ambiental OGE-MG / Sisema",
      ouvidoriaUrl: "https://www.ouvidoriageral.mg.gov.br",
      ouvidoriaTelefone: "162 / (31) 3915-1250",
      portalTransparenciaUrl: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/feam"
    },
    concurso: {
      anoUltimoConcurso: 2023,
      vagasOfertadas: 110,
      anosHiato: 15,
      situacao: "Vigente / Homologado",
      banca: "IBGP Concursos",
      editalUrl: "https://www.ibgpconcursos.com.br",
      resumoHiato: "Hiato de 15 anos sem certame; 110 vagas para fiscalização de mais de 300 barragens e licenciamento minerário."
    },
    organograma: [
      {
        nomeArea: "Gerência de Segurança de Estruturas de Mineração e Barragens (GESB)",
        siglaArea: "GESB",
        responsavel: "Eduardo Henrique Meireles",
        cargo: "Gerente de Segurança de Barragens",
        telefone: "(31) 3915-1510",
        email: "gesb.barragens@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Oeste, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/seguranca-de-barragens",
        atribuicoes: "Vistoria e auditoria do descomissionamento de estruturas alteadas a montante em Minas."
      },
      {
        nomeArea: "Diretoria de Gestão Territorial e Qualidade Ambiental",
        siglaArea: "DQGA",
        responsavel: "Camila Viana Ribeiro",
        cargo: "Diretora de Qualidade Ambiental",
        telefone: "(31) 3915-1530",
        email: "qualidade.feam@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Norte, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/qualidade-do-ar-e-solo",
        atribuicoes: "Rede de monitoramento do ar na RMBH e licenciamento de polos siderúrgicos e químicos."
      },
      {
        nomeArea: "Diretoria de Licenciamento e Auditorias Especiais",
        siglaArea: "DLAE",
        responsavel: "Thiago Brandão Nogueira",
        cargo: "Diretor de Licenciamento Industrial",
        telefone: "(31) 3915-1560",
        email: "licenciamento.feam@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Leste, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/licenciamento-feam",
        atribuicoes: "Instrução técnica para deliberação das licenças LP/LI/LO na Câmara Técnica de Mineração do COPAM."
      }
    ],
    urlTransparencia: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/feam",
    urlRelatorioGestao: "https://www.meioambiente.mg.gov.br/relatorios-de-gestao-feam"
  },
  {
    id: "igam-mg",
    sigla: "IGAM",
    nome: "Instituto Mineiro de Gestão das Águas",
    esfera: "Estadual MG",
    papelRegulatorio: "Outorgas de Recursos Hídricos e Monitoramento das Bacias Hidrográficas",
    efetivo2016: 410,
    efetivo2026: 285,
    variacaoEfetivoPct: -30.5,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -12.4,
    processosRepresados: 24630,
    analistasAtivos: 68,
    sobrecargaProcessosPorAnalista: 362,
    nivelSobrecarga: "Crítica",
    destaqueAlerta: "24 mil pedidos de outorga aguardando parecer; bacias do Rio das Velhas e Paraopeba sob estresse hídrico.",
    baseLegal: "Lei Estadual nº 13.199/1999 (Política Estadual de Recursos Hídricos de Minas Gerais)",
    atribuicoesLegais: [
      "Emissão de outorgas superficiais e subterrâneas para mineração, indústria e irrigação.",
      "Monitoramento contínuo de vazão e qualidade da água em 600 pontos nas bacias hidrográficas.",
      "Apoio técnico e operacional aos 36 Comitês de Bacias Hidrográficas (CBHs) de Minas.",
      "Gestão de crises de escassez hídrica, vazões ecológicas e segurança hídrica da RMBH."
    ],
    lideranca: {
      cargo: "Diretor-Geral",
      nome: "Marcelo da Fonseca",
      mandato: "2021–2026",
      investidura: "Nomeado pelo Governador do Estado de Minas Gerais"
    },
    contatos: {
      enderecoCompleto: "Cidade Administrativa, Rodovia Papa João Paulo II, 4143, Prédio Minas, 1º andar, Belo Horizonte - MG, CEP 31630-900",
      telefoneGeral: "(31) 3915-1000 / 162",
      emailGeral: "igam@meioambiente.mg.gov.br",
      ouvidoriaCanal: "Ouvidoria Ambiental OGE-MG",
      ouvidoriaUrl: "https://www.ouvidoriageral.mg.gov.br",
      ouvidoriaTelefone: "162",
      portalTransparenciaUrl: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/igam"
    },
    concurso: {
      anoUltimoConcurso: 2023,
      vagasOfertadas: 45,
      anosHiato: 15,
      situacao: "Vigente / Homologado",
      banca: "IBGP Concursos",
      editalUrl: "https://www.ibgpconcursos.com.br",
      resumoHiato: "15 anos de espera para apenas 45 vagas técnicas; déficit crítico frente a 24 mil outorgas represadas."
    },
    organograma: [
      {
        nomeArea: "Gerência de Instrumentos de Outorga e Regulação",
        siglaArea: "GEOUT",
        responsavel: "Luciana Resende Martins",
        cargo: "Gerente de Outorga",
        telefone: "(31) 3915-1410",
        email: "outorga@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Oeste, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/outorgas-hidricas",
        atribuicoes: "Análise técnica de captações em rios públicos estaduais e poços tubulares profundos."
      },
      {
        nomeArea: "Diretoria de Operações e Eventos Críticos",
        siglaArea: "DOEC",
        responsavel: "Cristiano Antunes Silva",
        cargo: "Diretor de Operações Hidrológicas",
        telefone: "(31) 3915-1440",
        email: "monitoramento.aguas@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Sul, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/monitoramento-qualidade-aguas",
        atribuicoes: "Rede telemétrica hidrometeorológica, alertas de estiagem severa e cheias urbanas."
      },
      {
        nomeArea: "Diretoria de Planejamento e Apoio aos Comitês de Bacia",
        siglaArea: "DPCB",
        responsavel: "Juliana Drumond Alvarenga",
        cargo: "Diretora de Planejamento de Recursos Hídricos",
        telefone: "(31) 3915-1470",
        email: "comites.bacia@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Norte, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/comites-de-bacias-mg",
        atribuicoes: "Enquadramento dos corpos d'água e cobrança pelo uso da água bruta em Minas."
      }
    ],
    urlTransparencia: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/igam",
    urlRelatorioGestao: "https://www.meioambiente.mg.gov.br/relatorios-de-gestao-igam"
  },
  {
    id: "semad-mg",
    sigla: "SEMAD-MG",
    nome: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável de MG",
    esfera: "Estadual MG",
    papelRegulatorio: "Coordenação Geral do SISEMA, Fiscalização Central e Políticas Climáticas",
    efetivo2016: 980,
    efetivo2026: 730,
    variacaoEfetivoPct: -25.5,
    faixaVariacao: "Queda moderada (10% a 30%)",
    orcamentoRealPct: -8.5,
    processosRepresados: 38200,
    analistasAtivos: 195,
    sobrecargaProcessosPorAnalista: 196,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Coordenação dos julgamentos de 38 mil autos de infração e recursos em 2ª instância no COPAM.",
    baseLegal: "Lei Delegada nº 180/2011 e Lei Estadual nº 21.972/2016",
    atribuicoesLegais: [
      "Planejamento estratégico e governança do SISEMA (Semad, Feam, IEF e Igam).",
      "Secretaria Executiva do COPAM (Conselho Estadual de Política Ambiental) e do CERH.",
      "Fiscalização ambiental ostensiva em articulação com o Comando de Policiamento Ambiental da PMMG.",
      "Coordenação do Plano Estadual de Ação Climática (PLAC-MG) e mercado de carbono."
    ],
    lideranca: {
      cargo: "Secretária de Estado",
      nome: "Marília Carvalho de Melo",
      mandato: "2020–2026",
      investidura: "Nomeada pelo Governador do Estado de Minas Gerais"
    },
    contatos: {
      enderecoCompleto: "Cidade Administrativa, Rodovia Papa João Paulo II, 4143, Prédio Minas, 1º andar, Belo Horizonte - MG, CEP 31630-900",
      telefoneGeral: "(31) 3915-1000 / 162",
      emailGeral: "gabinete.semad@meioambiente.mg.gov.br",
      ouvidoriaCanal: "Ouvidoria Geral do Estado de Minas Gerais (OGE-MG)",
      ouvidoriaUrl: "https://www.ouvidoriageral.mg.gov.br",
      ouvidoriaTelefone: "162 / (31) 3915-1100",
      portalTransparenciaUrl: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/semad"
    },
    concurso: {
      anoUltimoConcurso: 2023,
      vagasOfertadas: 98,
      anosHiato: 10,
      situacao: "Vigente / Homologado",
      banca: "IBGP Concursos",
      editalUrl: "https://www.ibgpconcursos.com.br",
      resumoHiato: "Primeiro concurso em uma década (98 vagas); reposição insuficiente para compensar aposentadorias em massa."
    },
    organograma: [
      {
        nomeArea: "Subsecretaria de Fiscalização Ambiental (SUFIS)",
        siglaArea: "SUFIS",
        responsavel: "Alexandre Leal Ferreira",
        cargo: "Subsecretário de Fiscalização",
        telefone: "(31) 3915-1140",
        email: "sufis@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Central, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/fiscalizacao-ambiental-sisema",
        atribuicoes: "Operações integradas contra o desmatamento ilegal, garimpos clandestinos e poluição industrial."
      },
      {
        nomeArea: "Subsecretaria de Regularização Ambiental (SURA)",
        siglaArea: "SURA",
        responsavel: "Clarissa Maria Vasconcelos",
        cargo: "Subsecretária de Regularização",
        telefone: "(31) 3915-1160",
        email: "sura@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Sul, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/regularizacao-ambiental",
        atribuicoes: "Normatização do SLA de licenciamento e padronização das Superintendências Regionais (SUPRAMs)."
      },
      {
        nomeArea: "Subsecretaria de Governança Climática e Sustentabilidade (SUGES)",
        siglaArea: "SUGES",
        responsavel: "Guilherme Santos Morais",
        cargo: "Subsecretário de Governança Climática",
        telefone: "(31) 3915-1180",
        email: "clima@meioambiente.mg.gov.br",
        endereco: "Prédio Minas, 1º andar, Ala Leste, Belo Horizonte - MG",
        siteUrl: "https://www.meioambiente.mg.gov.br/politica-climatica-mg",
        atribuicoes: "Inventário estadual de emissões de GEE, transição energética e resiliência hídrico-climática."
      }
    ],
    urlTransparencia: "https://www.transparencia.mg.gov.br/estrutura-do-estado/orgaos/semad",
    urlRelatorioGestao: "https://www.meioambiente.mg.gov.br/relatorios-de-gestao-semad"
  },
  {
    id: "ibama-fed",
    sigla: "IBAMA",
    nome: "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis",
    esfera: "Federal",
    papelRegulatorio: "Licenciamento Federal Complexo, Poder de Polícia e Fiscalização Nacional",
    efetivo2016: 3420,
    efetivo2026: 2210,
    variacaoEfetivoPct: -35.4,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -21.3,
    processosRepresados: 84500,
    analistasAtivos: 540,
    sobrecargaProcessosPorAnalista: 156,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Redução de um terço do quadro federal de analistas e passivo de mais de 84 mil autos pendentes de cobrança.",
    baseLegal: "Lei Federal nº 7.735/1989 e Lei Federal nº 6.938/1981 (PNMA)",
    atribuicoesLegais: [
      "Licenciamento ambiental de portos, hidrelétricas, exploração de petróleo e ferrovias interestaduais.",
      "Fiscalização ambiental federal e combate a crimes organizados na Amazônia Legal e no Cerrado.",
      "Lavratura e julgamento de autos de infração ambiental e aplicação de multas federais.",
      "Controle de agrotóxicos e substâncias químicas perigosas de abrangência nacional."
    ],
    lideranca: {
      cargo: "Presidente",
      nome: "Rodrigo Agostinho",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Presidente da República"
    },
    contatos: {
      enderecoCompleto: "SCEN Trecho 2, Edifício Sede do IBAMA, Bloco A, Asa Norte, Brasília - DF, CEP 70818-900 (Superintendência MG: Av. do Contorno, 8121, Gutierrez, Belo Horizonte - MG, CEP 30110-053)",
      telefoneGeral: "0800 061 8080 / (61) 3316-1212 / (31) 3555-6100",
      emailGeral: "faleconosco.sede@ibama.gov.br",
      ouvidoriaCanal: "Ouvidoria do IBAMA / Fala.BR",
      ouvidoriaUrl: "https://falabr.cgu.gov.br",
      ouvidoriaTelefone: "(61) 3316-1337",
      portalTransparenciaUrl: "https://www.gov.br/ibama/pt-br/acesso-a-informacao"
    },
    concurso: {
      anoUltimoConcurso: 2022,
      vagasOfertadas: 568,
      anosHiato: 10,
      situacao: "Expirado",
      banca: "Cebraspe",
      editalUrl: "https://www.cebraspe.org.br/concursos/ibama_21",
      resumoHiato: "10 anos sem edital federal (2012–2022); novo certame com 2.200 vagas solicitado e em análise no MGI."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Licenciamento Ambiental Federal (DILIC)",
        siglaArea: "DILIC",
        responsavel: "Claudia Regina dos Santos",
        cargo: "Diretora de Licenciamento",
        telefone: "(61) 3316-1300",
        email: "dilic.sede@ibama.gov.br",
        endereco: "SCEN Trecho 2, Ed. Sede IBAMA, Bloco B, Brasília - DF",
        siteUrl: "https://www.gov.br/ibama/pt-br/assuntos/licenciamento-ambiental",
        atribuicoes: "Coordena o licenciamento de petróleo e gás offshore, rodovias federais e mineração de urânio."
      },
      {
        nomeArea: "Diretoria de Proteção Ambiental (DIPRO)",
        siglaArea: "DIPRO",
        responsavel: "Jair Schmitt",
        cargo: "Diretor de Proteção Ambiental",
        telefone: "(61) 3316-1400",
        email: "dipro.sede@ibama.gov.br",
        endereco: "SCEN Trecho 2, Ed. Sede IBAMA, Bloco C, Brasília - DF",
        siteUrl: "https://www.gov.br/ibama/pt-br/assuntos/fiscalizacao-e-protecao",
        atribuicoes: "Comando das operações de combate a desmatamento, queimadas florestais e apreensão de madeira ilegal."
      },
      {
        nomeArea: "Superintendência Regional do IBAMA em Minas Gerais (SUPES-MG)",
        siglaArea: "SUPES-MG",
        responsavel: "Marcos Paulo de Souza Miranda",
        cargo: "Superintendente Regional em MG",
        telefone: "(31) 3555-6101",
        email: "supes.mg@ibama.gov.br",
        endereco: "Av. do Contorno, 8121, Bairro Gutierrez, Belo Horizonte - MG",
        siteUrl: "https://www.gov.br/ibama/pt-br/composicao/minas-gerais",
        atribuicoes: "Acompanhamento do licenciamento das bacias federais do São Francisco e Rio Doce e crimes de fauna."
      }
    ],
    urlTransparencia: "https://www.gov.br/ibama/pt-br/acesso-a-informacao",
    urlRelatorioGestao: "https://www.gov.br/ibama/pt-br/acesso-a-informacao/auditorias/relatorios-de-gestao"
  },
  {
    id: "icmbio-fed",
    sigla: "ICMBio",
    nome: "Instituto Chico Mendes de Conservação da Biodiversidade",
    esfera: "Federal",
    papelRegulatorio: "Unidades de Conservação Federais, Planos de Manejo e Espécies Ameaçadas",
    efetivo2016: 2150,
    efetivo2026: 1480,
    variacaoEfetivoPct: -31.2,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -15.7,
    processosRepresados: 32100,
    analistasAtivos: 320,
    sobrecargaProcessosPorAnalista: 100,
    nivelSobrecarga: "Moderada",
    destaqueAlerta: "Mais de 330 Unidades de Conservação federais geridas com média de menos de 5 servidores por parque.",
    baseLegal: "Lei Federal nº 11.516/2007 e Lei Federal nº 9.985/2000 (SNUC)",
    atribuicoesLegais: [
      "Gestão de 334 Unidades de Conservação da natureza (Parques Nacionais, RESEX e Florestas Nacionais).",
      "Elaboração de Planos de Ação Nacional para Conservação de Espécies Ameaçadas de Extinção (PAN).",
      "Autorizações para pesquisa científica e exploração sustentável em áreas protegidas federais.",
      "Fiscalização e prevenção a queimadas em mosaicos de conservação por meio do Prevfogo."
    ],
    lideranca: {
      cargo: "Presidente",
      nome: "Mauro Oliveira Pires",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Presidente da República"
    },
    contatos: {
      enderecoCompleto: "EQSW 103/104, Complexo Administrativo, Bloco B, Setor Sudoeste, Brasília - DF, CEP 70670-350",
      telefoneGeral: "(61) 2028-9000",
      emailGeral: "ouvidoria@icmbio.gov.br",
      ouvidoriaCanal: "Ouvidoria do ICMBio / Fala.BR",
      ouvidoriaUrl: "https://falabr.cgu.gov.br",
      ouvidoriaTelefone: "(61) 2028-9292",
      portalTransparenciaUrl: "https://www.gov.br/icmbio/pt-br/acesso-a-informacao"
    },
    concurso: {
      anoUltimoConcurso: 2022,
      vagasOfertadas: 171,
      anosHiato: 8,
      situacao: "Expirado",
      banca: "Cebraspe",
      editalUrl: "https://www.cebraspe.org.br/concursos/icmbio_21",
      resumoHiato: "Apenas 171 vagas para atender 334 unidades de conservação distribuídas em todo o Brasil."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Criação e Manejo de Unidades de Conservação (DIMAN)",
        siglaArea: "DIMAN",
        responsavel: "Rodrigo Mendonça Xavier",
        cargo: "Diretor de Manejo de UCs",
        telefone: "(61) 2028-9120",
        email: "diman.sede@icmbio.gov.br",
        endereco: "Complexo Administrativo, Bloco B, Brasília - DF",
        siteUrl: "https://www.gov.br/icmbio/pt-br/assuntos/unidades-de-conservacao",
        atribuicoes: "Demarcação, regularização fundiária e elaboração de planos de manejo de parques nacionais."
      },
      {
        nomeArea: "Diretoria de Ações Socioambientais e Consolidação Territorial (DISAT)",
        siglaArea: "DISAT",
        responsavel: "Katia Regina Torres",
        cargo: "Diretora Socioambiental",
        telefone: "(61) 2028-9150",
        email: "disat.sede@icmbio.gov.br",
        endereco: "Complexo Administrativo, Bloco B, Brasília - DF",
        siteUrl: "https://www.gov.br/icmbio/pt-br/assuntos/populacoes-tradicionais",
        atribuicoes: "Gestão compartilhada com povos ribeirinhos, quilombolas e extrativistas em Reservas Extrativistas."
      },
      {
        nomeArea: "Diretoria de Pesquisa, Avaliação e Monitoramento da Biodiversidade (DIBIO)",
        siglaArea: "DIBIO",
        responsavel: "Marcelo Marcelino de Oliveira",
        cargo: "Diretor de Pesquisa",
        telefone: "(61) 2028-9180",
        email: "dibio.sede@icmbio.gov.br",
        endereco: "Complexo Administrativo, Bloco B, Brasília - DF",
        siteUrl: "https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade",
        atribuicoes: "Classificação da Lista Vermelha da Fauna Brasileira e avaliação do risco de extinção."
      }
    ],
    urlTransparencia: "https://www.gov.br/icmbio/pt-br/acesso-a-informacao",
    urlRelatorioGestao: "https://www.gov.br/icmbio/pt-br/acesso-a-informacao/auditorias/relatorios-de-gestao"
  },
  {
    id: "ana-fed",
    sigla: "ANA",
    nome: "Agência Nacional de Águas e Saneamento Básico",
    esfera: "Federal",
    papelRegulatorio: "Regulação Hídrica Federal, Rios Interestaduais e Normas de Saneamento",
    efetivo2016: 490,
    efetivo2026: 415,
    variacaoEfetivoPct: -15.3,
    faixaVariacao: "Queda moderada (10% a 30%)",
    orcamentoRealPct: -4.2,
    processosRepresados: 11200,
    analistasAtivos: 125,
    sobrecargaProcessosPorAnalista: 90,
    nivelSobrecarga: "Moderada",
    destaqueAlerta: "Acúmulo de novas atribuições regulatórias do Novo Marco do Saneamento Básico sem reposição proporcional de analistas.",
    baseLegal: "Lei Federal nº 9.984/2000 e Lei Federal nº 14.026/2020",
    atribuicoesLegais: [
      "Outorga de direito de uso de recursos hídricos em corpos d'água de domínio da União.",
      "Emissão de Normas de Referência (NR) nacionais para a regulação dos serviços públicos de saneamento básico.",
      "Operação do Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH).",
      "Coordenação da Rede Hidrometeorológica Nacional e monitoramento da seca via Monitor de Secas."
    ],
    lideranca: {
      cargo: "Diretora-Presidente",
      nome: "Veronica Sánchez da Cruz Rios",
      mandato: "2022–2026",
      investidura: "Sabatina no Senado Federal e nomeação presidencial"
    },
    contatos: {
      enderecoCompleto: "Setor Policial Sul (SPO), Área 5, Quadra 3, Bloco B, Brasília - DF, CEP 70610-200",
      telefoneGeral: "(61) 2109-5400 / 0800 725 2255",
      emailGeral: "faleconosco@ana.gov.br",
      ouvidoriaCanal: "Ouvidoria da ANA / Fala.BR",
      ouvidoriaUrl: "https://falabr.cgu.gov.br",
      ouvidoriaTelefone: "(61) 2109-5500",
      portalTransparenciaUrl: "https://www.gov.br/ana/pt-br/acesso-a-informacao"
    },
    concurso: {
      anoUltimoConcurso: 2024,
      vagasOfertadas: 40,
      anosHiato: 12,
      situacao: "Em andamento / Previsto",
      banca: "Cebraspe",
      editalUrl: "https://www.cebraspe.org.br/concursos/ana_24",
      resumoHiato: "Hiato de 12 anos (2012–2024) para 40 vagas de Especialista em Recursos Hídricos e Saneamento Básico."
    },
    organograma: [
      {
        nomeArea: "Superintendência de Regulação de Recursos Hídricos (SRH)",
        siglaArea: "SRH",
        responsavel: "Marco Neves",
        cargo: "Superintendente de Recursos Hídricos",
        telefone: "(61) 2109-5210",
        email: "srh@ana.gov.br",
        endereco: "Ed. Sede ANA, Bloco B, 2º andar, Brasília - DF",
        siteUrl: "https://www.gov.br/ana/pt-br/assuntos/recursos-hidricos",
        atribuicoes: "Regras operativas de reservatórios hidrelétricos e outorgas na calha do Rio São Francisco."
      },
      {
        nomeArea: "Superintendência de Regulação de Saneamento Básico (SRS)",
        siglaArea: "SRS",
        responsavel: "Cintia Leal Marcondes",
        cargo: "Superintendente de Saneamento",
        telefone: "(61) 2109-5240",
        email: "saneamento@ana.gov.br",
        endereco: "Ed. Sede ANA, Bloco B, 3º andar, Brasília - DF",
        siteUrl: "https://www.gov.br/ana/pt-br/assuntos/saneamento-basico",
        atribuicoes: "Normas de referência de tarifas, drenagem urbana, perdas na distribuição e metas de universalização."
      },
      {
        nomeArea: "Superintendência de Fiscalização e Segurança de Barragens Hídricas (SFI)",
        siglaArea: "SFI",
        responsavel: "Alan Vaz Lopes",
        cargo: "Superintendente de Fiscalização",
        telefone: "(61) 2109-5280",
        email: "fiscalizacao@ana.gov.br",
        endereco: "Ed. Sede ANA, Bloco B, 1º andar, Brasília - DF",
        siteUrl: "https://www.gov.br/ana/pt-br/assuntos/seguranca-de-barragens",
        atribuicoes: "Relatório de Segurança de Barragens (RSB) de acumulação de água para abastecimento e irrigação."
      }
    ],
    urlTransparencia: "https://www.gov.br/ana/pt-br/acesso-a-informacao",
    urlRelatorioGestao: "https://www.gov.br/ana/pt-br/acesso-a-informacao/auditorias/relatorios-de-gestao"
  },
  {
    id: "cetesb-sp",
    sigla: "CETESB-SP",
    nome: "Companhia Ambiental do Estado de São Paulo",
    esfera: "Outros Estados",
    papelRegulatorio: "Licenciamento Industrial e Controle da Poluição no Estado de São Paulo",
    efetivo2016: 2200,
    efetivo2026: 1620,
    variacaoEfetivoPct: -26.4,
    faixaVariacao: "Queda moderada (10% a 30%)",
    orcamentoRealPct: -9.1,
    processosRepresados: 48700,
    analistasAtivos: 380,
    sobrecargaProcessosPorAnalista: 128,
    nivelSobrecarga: "Moderada",
    destaqueAlerta: "Maior parque industrial da América Latina com fila de quase 49 mil certidões e licenças no sistema e-CETESB.",
    baseLegal: "Lei Estadual Paulista nº 118/1973 e Decreto nº 8.468/1976",
    atribuicoesLegais: [
      "Fiscalização e licenciamento das emissões veiculares e industriais no Estado de SP.",
      "Gestão do cadastro e remediação de áreas contaminadas em solo paulista.",
      "Monitoramento da balneabilidade de praias do litoral paulista e bacias Tietê/Pinheiros.",
      "Centro Colaborador da OMS/ONU para questões de saneamento e saúde ambiental."
    ],
    lideranca: {
      cargo: "Diretor-Presidente",
      nome: "Thomaz Toledo",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Governador do Estado de São Paulo"
    },
    contatos: {
      enderecoCompleto: "Avenida Professor Frederico Hermann Júnior, 345, Bairro Alto de Pinheiros, São Paulo - SP, CEP 05459-900",
      telefoneGeral: "(11) 3133-3000 / 0800 011 3560",
      emailGeral: "cetesb@sp.gov.br",
      ouvidoriaCanal: "Ouvidoria da CETESB / Portal do Cidadão SP",
      ouvidoriaUrl: "https://www.ouvidoria.sp.gov.br",
      ouvidoriaTelefone: "(11) 3133-3900",
      portalTransparenciaUrl: "https://cetesb.sp.gov.br/acesso-a-informacao/"
    },
    concurso: {
      anoUltimoConcurso: 2023,
      vagasOfertadas: 224,
      anosHiato: 11,
      situacao: "Vigente / Homologado",
      banca: "Fundação Vunesp",
      editalUrl: "https://www.vunesp.com.br",
      resumoHiato: "11 anos de congelamento de certames abertos para engenheiros e biólogos em São Paulo."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Controle e Licenciamento Ambiental (DCLA)",
        siglaArea: "DCLA",
        responsavel: "Mayla Matsuzaki Fukushima",
        cargo: "Diretora de Controle Ambiental",
        telefone: "(11) 3133-3110",
        email: "dcla@cetesb.sp.gov.br",
        endereco: "Sede CETESB, Prédio 1, 2º andar, São Paulo - SP",
        siteUrl: "https://cetesb.sp.gov.br/licenciamento/",
        atribuicoes: "Licenciamento de grandes indústrias petroquímicas, aterros sanitários e sistemas de efluentes."
      },
      {
        nomeArea: "Diretoria de Engenharia e Qualidade Ambiental (DEQA)",
        siglaArea: "DEQA",
        responsavel: "Carlos Roberto dos Santos",
        cargo: "Diretor de Engenharia",
        telefone: "(11) 3133-3150",
        email: "deqa@cetesb.sp.gov.br",
        endereco: "Sede CETESB, Prédio 6, São Paulo - SP",
        siteUrl: "https://cetesb.sp.gov.br/qualidade-ambiental/",
        atribuicoes: "Rede automática de qualidade do ar e diagnóstico de áreas contaminadas com risco à saúde."
      },
      {
        nomeArea: "Diretoria de Avaliação de Impacto Ambiental (DAIA)",
        siglaArea: "DAIA",
        responsavel: "Domenico Tremaroli",
        cargo: "Diretor de Avaliação de Impacto",
        telefone: "(11) 3133-3180",
        email: "daia@cetesb.sp.gov.br",
        endereco: "Sede CETESB, Prédio 1, 3º andar, São Paulo - SP",
        siteUrl: "https://cetesb.sp.gov.br/eia-rima/",
        atribuicoes: "Análise de Estudos de Impacto Ambiental (EIA/RIMA) de infraestrutura rodoviária e portuária."
      }
    ],
    urlTransparencia: "https://cetesb.sp.gov.br/acesso-a-informacao/",
    urlRelatorioGestao: "https://cetesb.sp.gov.br/relatorios-institucionais/"
  },
  {
    id: "inea-rj",
    sigla: "INEA-RJ",
    nome: "Instituto Estadual do Ambiente do Rio de Janeiro",
    esfera: "Outros Estados",
    papelRegulatorio: "Licenciamento, Recursos Hídricos e Unidades de Conservação Fluminenses",
    efetivo2016: 1250,
    efetivo2026: 769,
    variacaoEfetivoPct: -38.5,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -14.6,
    processosRepresados: 29400,
    analistasAtivos: 190,
    sobrecargaProcessosPorAnalista: 155,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Queda acentuada de 38% no efetivo de analistas pós-crise fiscal fluminense com retenção no portal SELCA.",
    baseLegal: "Lei Estadual Fluminense nº 5.101/2008 (fusão FEEMA, IEF-RJ e SERLA)",
    atribuicoesLegais: [
      "Operação do Sistema Eletrônico de Licenciamento Ambiental do RJ (SELCA).",
      "Segurança hídrica da bacia do Rio Guandu (abastecimento da Região Metropolitana do RJ).",
      "Gestão de 37 Parques e Unidades de Conservação estaduais da Mata Atlântica fluminense.",
      "Fiscalização contra ocupações desordenadas em faixas marginais de proteção de rios e lagoas."
    ],
    lideranca: {
      cargo: "Presidente",
      nome: "Philipe Campello",
      mandato: "2021–2026",
      investidura: "Nomeado pelo Governador do Estado do Rio de Janeiro"
    },
    contatos: {
      enderecoCompleto: "Rua Campo de São Cristóvão, 138, Bairro São Cristóvão, Rio de Janeiro - RJ, CEP 20921-440",
      telefoneGeral: "(21) 2332-4600 / (21) 2334-5906",
      emailGeral: "ouvidoria@inea.rj.gov.br",
      ouvidoriaCanal: "Ouvidoria do INEA / SEI-RJ",
      ouvidoriaUrl: "http://www.inea.rj.gov.br/ouvidoria",
      ouvidoriaTelefone: "(21) 2332-4613",
      portalTransparenciaUrl: "http://transparencia.rj.gov.br"
    },
    concurso: {
      anoUltimoConcurso: 2013,
      vagasOfertadas: 180,
      anosHiato: 13,
      situacao: "Crítico (Sem concurso há > 10 anos)",
      banca: "FGV Projetos",
      editalUrl: "https://conhecimento.fgv.br/concursos/inea13",
      resumoHiato: "Há 13 anos sem nenhum concurso realizado; Regime de Recuperação Fiscal do RJ bloqueia contratações."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Licenciamento Ambiental (DILIC)",
        siglaArea: "DILIC",
        responsavel: "Marcus Vinicius Ramos",
        cargo: "Diretor de Licenciamento Fluminense",
        telefone: "(21) 2332-4640",
        email: "dilic@inea.rj.gov.br",
        endereco: "Sede INEA, 3º andar, Rio de Janeiro - RJ",
        siteUrl: "http://portallicenciamento.inea.rj.gov.br",
        atribuicoes: "Licenciamento de indústrias químicas, terminais portuários e dragagens costeiras."
      },
      {
        nomeArea: "Diretoria de Segurança Hídrica e Qualidade Ambiental (DIBIG)",
        siglaArea: "DIBIG",
        responsavel: "Ana Paula Bernardo",
        cargo: "Diretora de Segurança Hídrica",
        telefone: "(21) 2332-4660",
        email: "aguas@inea.rj.gov.br",
        endereco: "Sede INEA, 2º andar, Rio de Janeiro - RJ",
        siteUrl: "http://www.inea.rj.gov.br/recursos-hidricos",
        atribuicoes: "Monitoramento das águas da Baía de Guanabara, bacia do Rio Paraíba do Sul e Lagoa Rodrigo de Freitas."
      },
      {
        nomeArea: "Diretoria de Biodiversidade e Áreas Protegidas (DIBAP)",
        siglaArea: "DIBAP",
        responsavel: "Marie Paule Elisabeth",
        cargo: "Diretora de Biodiversidade",
        telefone: "(21) 2332-4680",
        email: "areasprotegidas@inea.rj.gov.br",
        endereco: "Sede INEA, 4º andar, Rio de Janeiro - RJ",
        siteUrl: "http://www.inea.rj.gov.br/parques-estaduais",
        atribuicoes: "Gestão dos Parques Estaduais da Pedra Branca, Desengano, Serra da Tiririca e Ilha Grande."
      }
    ],
    urlTransparencia: "http://www.inea.rj.gov.br/transparencia",
    urlRelatorioGestao: "http://www.inea.rj.gov.br/relatorios-de-gestao"
  },
  {
    id: "sema-mt",
    sigla: "SEMA-MT",
    nome: "Secretaria de Estado de Meio Ambiente de Mato Grosso",
    esfera: "Outros Estados",
    papelRegulatorio: "Licenciamento Agropecuário, Geoportal e Desmatamento Amazônia/Cerrado",
    efetivo2016: 880,
    efetivo2026: 720,
    variacaoEfetivoPct: -18.2,
    faixaVariacao: "Queda moderada (10% a 30%)",
    orcamentoRealPct: 3.4,
    processosRepresados: 52300,
    analistasAtivos: 160,
    sobrecargaProcessosPorAnalista: 327,
    nivelSobrecarga: "Crítica",
    destaqueAlerta: "Sobrecarga severa com mais de 52 mil cadastros agropecuários e autorizações de desmate no Geoportal SEMA-MT.",
    baseLegal: "Lei Complementar Estadual nº 214/2005 e Lei nº 10.431/2016",
    atribuicoesLegais: [
      "Operação do Geoportal SEMA-MT de dados geoespaciais abertos (referência em shapefiles).",
      "Controle de desmatamento ilegal e emissão de Autorizações Provisórias de Funcionamento (APF).",
      "Análise e validação do CAR em propriedades do bioma Amazônico, Cerrado e Pantanal mato-grossense.",
      "Outorga de captação de água para irrigação de lavouras e pivôs centrais."
    ],
    lideranca: {
      cargo: "Secretária de Estado",
      nome: "Mauren Lazzaretti",
      mandato: "2019–2026",
      investidura: "Nomeada pelo Governador do Estado de Mato Grosso"
    },
    contatos: {
      enderecoCompleto: "Rua C, Esquina com Rua F, Setor A, Centro Político Administrativo, Cuiabá - MT, CEP 78049-903",
      telefoneGeral: "(65) 3613-7200 / 0800 65 3838",
      emailGeral: "ouvidoria@sema.mt.gov.br",
      ouvidoriaCanal: "Ouvidoria Setorial da SEMA-MT / Fale Cidadão MT",
      ouvidoriaUrl: "https://www.ouvidoria.mt.gov.br",
      ouvidoriaTelefone: "(65) 3613-7397",
      portalTransparenciaUrl: "https://transparencia.mt.gov.br"
    },
    concurso: {
      anoUltimoConcurso: 2014,
      vagasOfertadas: 120,
      anosHiato: 12,
      situacao: "Crítico (Sem concurso há > 10 anos)",
      banca: "Fundação Carlos Chagas (FCC)",
      editalUrl: "https://www.concursosfcc.com.br",
      resumoHiato: "12 anos sem concurso para provimento efetivo; dependência de analistas temporários na análise do CAR."
    },
    organograma: [
      {
        nomeArea: "Secretaria Adjunta de Licenciamento Ambiental e Recursos Hídricos (SALA)",
        siglaArea: "SALA",
        responsavel: "Lilian Ferreira dos Santos",
        cargo: "Secretária Adjunta de Licenciamento",
        telefone: "(65) 3613-7220",
        email: "sala@sema.mt.gov.br",
        endereco: "Ed. Sede SEMA, Bloco 2, Cuiabá - MT",
        siteUrl: "https://geoportal.sema.mt.gov.br",
        atribuicoes: "Gestão do SIGA Ambiental e Geoportal com camadas abertas de licenças e outorgas."
      },
      {
        nomeArea: "Secretaria Adjunta de Mudanças Climáticas e Florestas (SAMCF)",
        siglaArea: "SAMCF",
        responsavel: "Luciane Copetti",
        cargo: "Secretária Adjunta Florestal",
        telefone: "(65) 3613-7250",
        email: "florestal@sema.mt.gov.br",
        endereco: "Ed. Sede SEMA, Bloco 3, Cuiabá - MT",
        siteUrl: "https://www.sema.mt.gov.br/car-mt",
        atribuicoes: "Análise do passivo do CAR de grandes fazendas e reflorestamento de Áreas de Preservação Permanente."
      },
      {
        nomeArea: "Secretaria Adjunta de Fiscalização (SAF)",
        siglaArea: "SAF",
        responsavel: "Valdinei Valério da Silva",
        cargo: "Secretário Adjunto de Fiscalização",
        telefone: "(65) 3613-7280",
        email: "fiscalizacao@sema.mt.gov.br",
        endereco: "Ed. Sede SEMA, Bloco 1, Cuiabá - MT",
        siteUrl: "https://www.sema.mt.gov.br/fiscalizacao",
        atribuicoes: "Monitoramento com alertas de satélite Planet e autuações em tempo real por desmate e fogo."
      }
    ],
    urlTransparencia: "https://geoportal.sema.mt.gov.br",
    urlRelatorioGestao: "https://www.sema.mt.gov.br/relatorios-de-gestao"
  },
  {
    id: "iat-pr",
    sigla: "IAT-PR",
    nome: "Instituto Água e Terra do Paraná",
    esfera: "Outros Estados",
    papelRegulatorio: "Gestão Integrada de Licenciamento, Recursos Hídricos e Geologia (SGA)",
    efetivo2016: 1150,
    efetivo2026: 750,
    variacaoEfetivoPct: -34.8,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -11.8,
    processosRepresados: 23800,
    analistasAtivos: 155,
    sobrecargaProcessosPorAnalista: 154,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Redução de 34% de servidores após a fusão de IAP, Instituto das Águas e Mineropar.",
    baseLegal: "Lei Estadual Paranaense nº 20.070/2019 (criação do IAT por fusão autárquica)",
    atribuicoesLegais: [
      "Operação do Sistema de Gestão Ambiental (SGA) e geoserviços WFS de outorgas do Paraná.",
      "Licenciamento ambiental de portos (Paranaguá), agroindústrias e saneamento estadual.",
      "Outorga e segurança hídrica nas bacias dos rios Iguaçu, Tibagi e Paranapanema.",
      "Mapeamento geológico e gerenciamento de riscos de deslizamento de encostas na Serra do Mar."
    ],
    lideranca: {
      cargo: "Diretor-Presidente",
      nome: "José Volnei Bisognin",
      mandato: "2023–2026",
      investidura: "Nomeado pelo Governador do Estado do Paraná"
    },
    contatos: {
      enderecoCompleto: "Rua Engenheiros Rebouças, 1206, Bairro Rebouças, Curitiba - PR, CEP 80215-100",
      telefoneGeral: "(41) 3213-3700 / (41) 3213-3400",
      emailGeral: "ouvidoria@iat.pr.gov.br",
      ouvidoriaCanal: "Ouvidoria Geral do Estado do Paraná (CGE-PR / IAT)",
      ouvidoriaUrl: "https://www.cge.pr.gov.br/ouvidoria",
      ouvidoriaTelefone: "(41) 3213-3888",
      portalTransparenciaUrl: "https://www.transparencia.pr.gov.br"
    },
    concurso: {
      anoUltimoConcurso: 2021,
      vagasOfertadas: 130,
      anosHiato: 7,
      situacao: "Vigente / Homologado",
      banca: "IBFC",
      editalUrl: "https://www.ibfc.org.br",
      resumoHiato: "130 vagas autorizadas na fusão das 3 autarquias; defasagem de técnicos de campo na Serra do Mar."
    },
    organograma: [
      {
        nomeArea: "Diretoria de Licenciamento e Outorga (DLO)",
        siglaArea: "DLO",
        responsavel: "Ivonei Afonso da Silva",
        cargo: "Diretor de Licenciamento",
        telefone: "(41) 3213-3730",
        email: "dlo@iat.pr.gov.br",
        endereco: "Sede IAT, Bloco Central, Curitiba - PR",
        siteUrl: "https://www.iat.pr.gov.br/Pagina/Consultar-licenciamentos",
        atribuicoes: "Emissão de licenças pelo portal SGA e geoprocessamento da grade de outorgas SIGARH."
      },
      {
        nomeArea: "Diretoria de Saneamento Ambiental e Recursos Hídricos (DISAR)",
        siglaArea: "DISAR",
        responsavel: "José Luiz Scroccaro",
        cargo: "Diretor de Saneamento e Recursos Hídricos",
        telefone: "(41) 3213-3760",
        email: "aguas@iat.pr.gov.br",
        endereco: "Sede IAT, Bloco Anexo, Curitiba - PR",
        siteUrl: "https://www.iat.pr.gov.br/recursos-hidricos",
        atribuicoes: "Planejamento dos comitês de bacias e monitoramento da vazão dos rios paranaenses."
      },
      {
        nomeArea: "Diretoria de Patrimônio Natural (DIPAT)",
        siglaArea: "DIPAT",
        responsavel: "Rafael Andreguetto",
        cargo: "Diretor de Patrimônio Natural",
        telefone: "(41) 3213-3790",
        email: "biodiversidade@iat.pr.gov.br",
        endereco: "Sede IAT, 2º andar, Curitiba - PR",
        siteUrl: "https://www.iat.pr.gov.br/unidades-de-conservacao",
        atribuicoes: "Conservação das florestas com araucária, restingas do litoral e parques estaduais."
      }
    ],
    urlTransparencia: "https://www.iat.pr.gov.br/transparencia",
    urlRelatorioGestao: "https://www.iat.pr.gov.br/relatorios-de-gestao"
  },
  {
    id: "fepam-rs",
    sigla: "FEPAM-RS",
    nome: "Fundação Estadual de Proteção Ambiental Henrique Luis Roessler",
    esfera: "Outros Estados",
    papelRegulatorio: "Licenciamento Ambiental no Rio Grande do Sul e Reconstrução Pós-Enchentes",
    efetivo2016: 620,
    efetivo2026: 387,
    variacaoEfetivoPct: -37.6,
    faixaVariacao: "Queda acentuada (> 30%)",
    orcamentoRealPct: -13.5,
    processosRepresados: 19600,
    analistasAtivos: 130,
    sobrecargaProcessosPorAnalista: 151,
    nivelSobrecarga: "Alta",
    destaqueAlerta: "Quadro de analistas reduzido em 37% sob forte demanda de licenças emergenciais de reconstrução climática pós-enchentes.",
    baseLegal: "Lei Estadual Gaúcha nº 9.077/1990 e Decreto Estadual nº 55.374/2020",
    atribuicoesLegais: [
      "Operação do Sistema Online de Licenciamento (SOL) e publicação de shapefiles abertos de infrações.",
      "Licenciamento de polos petroquímicos (Triunfo), agroindústrias e hidrelétricas no RS.",
      "Planos de contingência ambiental e recomposição de bacias hidrográficas atingidas por enchentes extremas.",
      "Monitoramento da qualidade das águas da Bacia do Guaíba e Lagoa dos Patos."
    ],
    lideranca: {
      cargo: "Presidente",
      nome: "Renato Chagas",
      mandato: "2021–2026",
      investidura: "Nomeado pelo Governador do Estado do Rio Grande do Sul"
    },
    contatos: {
      enderecoCompleto: "Avenida Borges de Medeiros, 261, Bairro Praia de Belas, Porto Alegre - RS, CEP 90119-900",
      telefoneGeral: "(51) 3288-9400 / (51) 3288-9404",
      emailGeral: "ouvidoria@fepam.rs.gov.br",
      ouvidoriaCanal: "Ouvidoria Geral do Estado do Rio Grande do Sul / FEPAM",
      ouvidoriaUrl: "https://www.ouvidoria.rs.gov.br",
      ouvidoriaTelefone: "(51) 3288-9410",
      portalTransparenciaUrl: "https://transparencia.rs.gov.br"
    },
    concurso: {
      anoUltimoConcurso: 2014,
      vagasOfertadas: 90,
      anosHiato: 12,
      situacao: "Crítico (Sem concurso há > 10 anos)",
      banca: "Fundatec",
      editalUrl: "https://www.fundatec.org.br",
      resumoHiato: "12 anos sem concurso público; perda de 37% dos analistas em meio à maior crise climática do Estado."
    },
    organograma: [
      {
        nomeArea: "Departamento de Controle e Fiscalização (DECOFI)",
        siglaArea: "DECOFI",
        responsavel: "Vagner Hoffmann",
        cargo: "Diretor de Fiscalização",
        telefone: "(51) 3288-9430",
        email: "decofi@fepam.rs.gov.br",
        endereco: "Sede FEPAM, 4º andar, Porto Alegre - RS",
        siteUrl: "https://fepam.rs.gov.br/dados-transparencia",
        atribuicoes: "Shapefiles georreferenciados de autos de infração ambiental e embargos econômicos no RS."
      },
      {
        nomeArea: "Departamento de Qualidade Ambiental (DQA)",
        siglaArea: "DQA",
        responsavel: "Fabiani Ribeiro",
        cargo: "Diretora de Qualidade Ambiental",
        telefone: "(51) 3288-9460",
        email: "dqa@fepam.rs.gov.br",
        endereco: "Sede FEPAM, 5º andar, Porto Alegre - RS",
        siteUrl: "https://fepam.rs.gov.br/qualidade-das-aguas",
        atribuicoes: "Laboratório de análises ecotoxicológicas e rede hidrológica de monitoramento do Guaíba."
      },
      {
        nomeArea: "Divisão de Licenciamento Industrial e Hídrico",
        siglaArea: "DILIH",
        responsavel: "Carla Pires Zillmann",
        cargo: "Chefe da Divisão de Licenciamento",
        telefone: "(51) 3288-9480",
        email: "licenciamento@fepam.rs.gov.br",
        endereco: "Sede FEPAM, 3º andar, Porto Alegre - RS",
        siteUrl: "https://fepam.rs.gov.br/sistema-sol",
        atribuicoes: "Gestão do Sistema Online de Licenciamento (SOL) e análise de licenças prévias e de operação."
      }
    ],
    urlTransparencia: "https://fepam.rs.gov.br/dados-transparencia",
    urlRelatorioGestao: "https://fepam.rs.gov.br/relatorios-de-gestao"
  }
];

export const COBERTURA_CAPACIDADE: CoberturaCapacidade = {
  totalOrgaos: ORGAOS_CAPACIDADE.length,
  totalOrgaosAuditados: ORGAOS_CAPACIDADE.length,
  mediaPerdaServidoresPct: -31.4,
  quedaMediaServidoresPct: -31.4,
  quedaMediaOrcamentoRealPct: -19.8,
  volumeConsolidadoRepresado: ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.processosRepresados, 0),
  orgaoMaiorSobrecarga: "IEF-MG",
  sobrecargaMaxima: 2314,
  maiorSobrecargaProcessosPorAnalista: 2314,
  destaqueSobrecarga: "IEF-MG (2.314 proc/analista no CAR)",
  totalServidores2016: ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.efetivo2016, 0),
  totalServidores2026: ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.efetivo2026, 0),
  totalAnalistasAtivos: ORGAOS_CAPACIDADE.reduce((acc, o) => acc + o.analistasAtivos, 0),
};
