/**
 * Registry central de fontes de dados — controlepopular.com.br
 *
 * ═══ POR QUE ESTE MÓDULO EXISTE ═══
 *
 * O portal integra dados de dezenas de órgãos federais, estaduais e municipais,
 * sob diferentes regimes de licença, cadências e formatos. Centralizar a definição
 * em um registro único tipado garante:
 * 1. Rastreabilidade de proveniência e licença em todas as telas e APIs.
 * 2. Automação orquestrada de coletas (`scripts/rotina-coletas.mts`).
 * 3. Prevenção de estouro de bundle, declarando formalmente a camada de alocação
 *    de cada dataset (Camada 1: data-json, Camada 2: public-assets, Camada 3: banco).
 * 4. Exposição precisa na API pública (`/api` e `/api/openapi.yaml`).
 */

export type FrenteSlug =
  | "cidades"
  | "congresso"
  | "judiciario"
  | "terras"
  | "paraopeba"
  | "ambiental"
  | "empresas"
  | "transversal";

export type CamadaDado =
  | "data-json" // Camada 1: apps/web/data/*.json (< 500 KB)
  | "public-assets" // Camada 2: apps/web/public/data/*.json (500 KB - 10 MB, com exclude)
  | "banco" // Camada 3: Postgres (Drizzle schema) / fatias estáticas
  | "ao-vivo"; // Consulta em tempo real (ex: DataJud CNJ sem retenção)

export type RegimeLicenca =
  | "dominio-publico"
  | "cc-by"
  | "cc-by-sa"
  | "cc-by-nd"
  | "dados-abertos-gov"
  | "lei-acesso-informacao"
  | "termo-restrito-sem-derivados";

export interface FonteDef {
  slug: string;
  nome: string;
  orgao: string;
  esfera: "federal" | "estadual" | "municipal" | "independente";
  frente: FrenteSlug;
  descricao: string;
  urlOficial: string;
  licenca: RegimeLicenca;
  frequenciaAtualizacao: "tempo-real" | "diaria" | "semanal" | "mensal" | "anual" | "estatica";
  camada: CamadaDado;
  caminhoArquivo?: string;
  constanteCobertura?: string;
  rotaPortal?: string;
  requerToken?: boolean;
  variavelToken?: string;
  ressalvaEditorial?: string;
}

export const REGISTRY_FONTES: Record<string, FonteDef> = {
  // ─── FRENTE: CIDADES ────────────────────────────────────────────────────────
  "pncp-contratos": {
    slug: "pncp-contratos",
    nome: "Portal Nacional de Contratações Públicas (PNCP)",
    orgao: "Ministério da Gestão e da Inovação em Serviços Públicos",
    esfera: "federal",
    frente: "cidades",
    descricao: "Contratos, atas de registro de preços, dispensas e inexigibilidades dos municípios.",
    urlOficial: "https://pncp.gov.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "diaria",
    camada: "banco",
    rotaPortal: "/[municipio]/prefeitura/contratos",
  },
  "sigpub-diario": {
    slug: "sigpub-diario",
    nome: "Diário Oficial dos Municípios Mineiros (SIGPub / AMM-MG)",
    orgao: "Associação Mineira de Municípios (AMM)",
    esfera: "municipal",
    frente: "cidades",
    descricao: "Atos oficiais, nomeações, exonerações, decretos e licitações municipais.",
    urlOficial: "https://www.diariomunicipal.com.br/amm-mg/",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "diaria",
    camada: "banco",
    rotaPortal: "/[municipio]/camara/legislacao",
  },
  "transferegov-convenios": {
    slug: "transferegov-convenios",
    nome: "Transferegov / Convênios Federais",
    orgao: "Ministério da Gestão / Seges",
    esfera: "federal",
    frente: "cidades",
    descricao: "Convênios celebrados entre a União e municípios/entidades de MG com histórico de vigência e prorrogações.",
    // URL migrada em 31/08/2026: endpoint antigo (repositorio.dados.gov.br/seges/detru/) foi desligado.
    // Nova API pública: https://api-publica.transferegov.gestao.gov.br
    urlOficial: "https://api-publica.transferegov.gestao.gov.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "semanal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/convenios-federais-mg.json",
    rotaPortal: "/[municipio]/prefeitura",
  },

  "comunicabr-repasses": {
    slug: "comunicabr-repasses",
    nome: "ComunicaBR — Ações e Repasses do Governo Federal",
    orgao: "Secretaria de Comunicação Social da Presidência (Secom)",
    esfera: "federal",
    frente: "cidades",
    descricao: "Indicadores de programas federais (Bolsa Família, SUS, Minha Casa Minha Vida) nos 853 municípios de MG.",
    // URL migrada em 31/08/2026: comunicabr.gov.br não resolve DNS; a API vive
    // em comunicabr.presidencia.gov.br (endpoint /api/v1/municipios/31 medido
    // 200 em 31/08). A base /api/v1 responde 404, por isso a URL é o endpoint.
    urlOficial: "https://comunicabr.presidencia.gov.br/api/v1/municipios/31",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "mensal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/data/comunicabr-31.json",
    constanteCobertura: "COBERTURA_COMUNICABR",
    rotaPortal: "/dados/comunicabr",
    ressalvaEditorial: "61% dos itens na fonte vêm vazios por não aplicação ou ausência de publicação setorial.",
  },
  "salic-rouanet": {
    slug: "salic-rouanet",
    nome: "SALIC — Lei Rouanet",
    orgao: "Ministério da Cultura (MinC)",
    esfera: "federal",
    frente: "cidades",
    descricao: "Projetos culturais aprovados e incentivadores domiciliados em Minas Gerais.",
    urlOficial: "https://salic.cultura.gov.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/salic-rouanet-mg.json",
    rotaPortal: "/[municipio]/cultura",
    ressalvaEditorial: "Total doado informado na fonte é nacional, não restrito ao município.",
  },

  // ─── FRENTE: CONGRESSO ──────────────────────────────────────────────────────
  "camara-dados-abertos": {
    slug: "camara-dados-abertos",
    nome: "Dados Abertos da Câmara dos Deputados",
    orgao: "Câmara dos Deputados",
    esfera: "federal",
    frente: "congresso",
    descricao: "Proposições legislativas (PL, PEC, MP), votações nominais, bancadas e comissões.",
    urlOficial: "https://dadosabertos.camara.leg.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "diaria",
    camada: "banco",
    rotaPortal: "/congresso/proposicoes",
  },
  "senado-dados-abertos": {
    slug: "senado-dados-abertos",
    nome: "Dados Abertos do Senado Federal",
    orgao: "Senado Federal",
    esfera: "federal",
    frente: "congresso",
    descricao: "Matérias legislativas, votações, composições partidárias e atuação de senadores.",
    urlOficial: "https://legis.senado.leg.br/dadosabertos/",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "diaria",
    camada: "banco",
    rotaPortal: "/congresso/parlamentares",
  },
  "congresso-mg-parlamentares": {
    slug: "congresso-mg-parlamentares",
    nome: "Parlamentares de MG (Câmara/Senado via DadosAbertosBrasil)",
    orgao: "Câmara dos Deputados / Senado Federal",
    esfera: "federal",
    frente: "congresso",
    descricao: "Deputados e senadores de Minas Gerais com partido, situação e ficha (93 deputados + 3 senadores coletados em 31/08/2026; CPF redigido na origem).",
    urlOficial: "https://dadosabertos.camara.leg.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/congresso-mg.json",
    rotaPortal: "/congresso/parlamentares",
  },

  // ─── FRENTE: JUDICIÁRIO ─────────────────────────────────────────────────────
  "sirenejud-cnj": {
    slug: "sirenejud-cnj",
    nome: "SIRENEJud (Processos Ambientais do Judiciário)",
    orgao: "Conselho Nacional de Justiça (CNJ) / CNMP",
    esfera: "federal",
    frente: "judiciario",
    descricao: "Recorte ambiental do acervo processual nacional com granularidade por tribunal, grau e município.",
    urlOficial: "https://www.cnj.jus.br/programas-e-acoes/sirenejud/",
    licenca: "dominio-publico",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/sirenejud-mg.json",
    constanteCobertura: "COBERTURA_SIRENEJUD",
    rotaPortal: "/judiciario/sirenejud",
  },
  "datajud-cnj": {
    slug: "datajud-cnj",
    nome: "DataJud — Consulta Pública Processual",
    orgao: "Conselho Nacional de Justiça (CNJ)",
    esfera: "federal",
    frente: "judiciario",
    descricao: "Consulta em tempo real a processos judiciais sem redistribuição de banco derivado.",
    urlOficial: "https://datajud-wiki.cnj.jus.br",
    licenca: "termo-restrito-sem-derivados",
    frequenciaAtualizacao: "tempo-real",
    camada: "ao-vivo",
    rotaPortal: "/api/datajud",
    ressalvaEditorial: "Consulta ao vivo conforme cláusulas 3.8/3.9 dos termos de uso da API Pública do CNJ.",
  },
  "cnj-inspecoes": {
    slug: "cnj-inspecoes",
    nome: "Biblioteca de Inspeções da Corregedoria Nacional de Justiça",
    orgao: "Conselho Nacional de Justiça (CNJ)",
    esfera: "federal",
    frente: "judiciario",
    descricao: "Relatórios de correições e inspeções ordinárias e extraordinárias nos tribunais.",
    // URL migrada em 31/08/2026: corregedoriacnj/inspecoes-e-corricoes devolve 404;
    // a nova é inspecoes-correicoes (medida 200 em 31/08, via LinkMender).
    urlOficial: "https://www.cnj.jus.br/inspecoes-correicoes/",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/cnj-inspecoes.json",
    rotaPortal: "/judiciario/inspecoes",
  },

  // ─── FRENTE: FUNÇÃO SOCIAL DA TERRA ─────────────────────────────────────────
  "funai-terras-indigenas": {
    slug: "funai-terras-indigenas",
    nome: "Geosserviços de Terras Indígenas (WFS FUNAI)",
    orgao: "Fundação Nacional dos Povos Indígenas (FUNAI)",
    esfera: "federal",
    frente: "terras",
    descricao: "Polígonos geoespaciais oficiais das terras indígenas brasileiras em todas as fases de demarcação.",
    // Medido em 31/08/2026: o GeoServer responde 200 via cliente .NET, mas o
    // fetch do Node (undici) desta máquina é resetado no handshake TLS —
    // peculiaridade de stack, não indisponibilidade da fonte. Sondagem do
    // PicoClaw pode marcar FALHA aqui mesmo com a fonte viva.
    urlOficial: "https://geoserver.funai.gov.br",
    licenca: "dominio-publico",
    frequenciaAtualizacao: "mensal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/terras/globo/dados/camadas/terras-indigenas-mg.geojson",
    rotaPortal: "/funcaosocialterra/mapa",
  },
  "incra-quilombolas": {
    slug: "incra-quilombolas",
    nome: "Acervo Fundiário e Territórios Quilombolas (WFS INCRA)",
    orgao: "Instituto Nacional de Colonização e Reforma Agrária (INCRA)",
    esfera: "federal",
    frente: "terras",
    descricao: "Delimitação de territórios quilombolas e imóveis certificados no SIGEF.",
    urlOficial: "https://certificacao.incra.gov.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "mensal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/terras/globo/dados/camadas/quilombolas-mg.geojson",
    rotaPortal: "/funcaosocialterra/mapa",
  },
  "sigmine-anm": {
    slug: "sigmine-anm",
    nome: "SIGMINE — Sistema de Informações Geográficas da Mineração",
    orgao: "Agência Nacional de Mineração (ANM)",
    esfera: "federal",
    frente: "terras",
    descricao: "Processos minerários ativos, concessões de lavra, requerimentos e autorizações de pesquisa.",
    urlOficial: "https://dadosabertos.anm.gov.br",
    licenca: "cc-by",
    frequenciaAtualizacao: "diaria",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson",
    rotaPortal: "/funcaosocialterra/mapa",
    ressalvaEditorial: "Requerimento de pesquisa não autoriza lavra mineral. Separado na visualização.",
  },

  // ─── FRENTE: PARAOPEBA ──────────────────────────────────────────────────────
  "fgv-paraopeba": {
    slug: "fgv-paraopeba",
    nome: "Auditoria FGV — Projeto Rio Paraopeba (Anexos I.3 e I.4)",
    orgao: "Fundação Getulio Vargas (FGV)",
    esfera: "independente",
    frente: "paraopeba",
    descricao: "Acompanhamento da execução física e financeira dos projetos de reparação nos 26 municípios da bacia.",
    urlOficial: "https://projetorioparaopeba.fgv.br",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "semanal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/execucao-fgv.json",
    constanteCobertura: "COBERTURA_EXECUCAO_FGV",
    rotaPortal: "/paraopeba/execucao",
  },
  "repasse-brumadinho": {
    slug: "repasse-brumadinho",
    nome: "Repasse aos Municípios (Lei Estadual 23.830/2021)",
    orgao: "Governo do Estado de Minas Gerais / SEPLAG",
    esfera: "estadual",
    frente: "paraopeba",
    descricao: "Distribuição dos R$ 1,65 bi do Acordo de Reparação entre todos os 853 municípios mineiros.",
    urlOficial: "https://www.mg.gov.br/pro-brumadinho",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "estatica",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/data/repasse-brumadinho-mg.json",
    rotaPortal: "/[municipio]/prefeitura",
    ressalvaEditorial: "Receber repasse não significa ter sido município atingido pelo rompimento.",
  },
  "auditoria-ajri": {
    slug: "auditoria-ajri",
    nome: "Auditoria AJRI (AECOM / Brumadinho)",
    orgao: "Comitê Pró-Brumadinho / AECOM",
    esfera: "independente",
    frente: "paraopeba",
    descricao: "Catálogo dos 467 relatórios técnicos e notas da auditoria independente do Acordo.",
    // URL migrada em 31/08/2026: ajri.aecom.com.br não resolve DNS; o portal
    // atual é portal.auditoriasocioambiental.com.br (medido 200 em 31/08).
    urlOficial: "https://portal.auditoriasocioambiental.com.br",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/auditoria-ajri.json",
    constanteCobertura: "COBERTURA_AUDITORIA_AJRI",
    rotaPortal: "/paraopeba/auditoria",
  },
  "biblioteca-atis": {
    slug: "biblioteca-atis",
    nome: "Biblioteca das Assessorias Técnicas Independentes (ATIs)",
    orgao: "AEDAS, Associação Guaicuy, ADAI, NACAB",
    esfera: "independente",
    frente: "paraopeba",
    descricao: "Acervo de estudos, notas informativas e cartilhas publicadas pelas ATIs da bacia do Paraopeba.",
    urlOficial: "https://www.aedasmg.org",
    licenca: "cc-by-nd",
    frequenciaAtualizacao: "semanal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/data/biblioteca-ati.json",
    constanteCobertura: "COBERTURA_BIBLIOTECA_ATI",
    rotaPortal: "/ambiental/crimes-socioambientais",
  },

  // ─── FRENTE: AMBIENTAL ──────────────────────────────────────────────────────
  "sigbm-barragens": {
    slug: "sigbm-barragens",
    nome: "SIGBM — Sistema Integrado de Gestão de Barragens de Mineração",
    orgao: "Agência Nacional de Mineração (ANM)",
    esfera: "federal",
    frente: "ambiental",
    descricao: "Cadastro nacional de barragens com categoria de risco (CRI), dano potencial (DPA) e nível de emergência.",
    urlOficial: "https://dadosabertos.anm.gov.br",
    licenca: "cc-by",
    frequenciaAtualizacao: "diaria",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/barragens-sigbm.json",
    constanteCobertura: "COBERTURA_SIGBM",
    rotaPortal: "/ambiental/barragens/sigbm",
  },
  "ibama-licencas-sancoes": {
    slug: "ibama-licencas-sancoes",
    nome: "IBAMA — Licenciamento Federal, Autos de Infração e Julgamentos",
    orgao: "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA)",
    esfera: "federal",
    frente: "ambiental",
    descricao: "Licenças federais de operação e histórico de julgamentos de autos de infração ambiental em MG.",
    urlOficial: "https://dados.gov.br/dados/conjuntos-dados/licencas-ambientais",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "semanal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/ibama-mg.json",
    constanteCobertura: "COBERTURA_IBAMA_MG",
    rotaPortal: "/ambiental/ibama",
  },
  "cge-decisoes-lai": {
    slug: "cge-decisoes-lai",
    nome: "Decisões de Recursos de LAI da CGE-MG",
    orgao: "Controladoria-Geral do Estado de Minas Gerais (CGE-MG)",
    esfera: "estadual",
    frente: "ambiental",
    descricao: "Corpus de decisões colegiadas sobre recursos contra negativas de acesso à informação no estado.",
    urlOficial: "http://acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/decisoes-cge-lai.json",
    constanteCobertura: "COBERTURA_DECISOES_LAI_CGE",
    rotaPortal: "/ambiental/decisoes-lai",
  },
  "gtac-semad": {
    slug: "gtac-semad",
    nome: "GTAC — Cadastro de TACs Ambientais de Minas Gerais",
    orgao: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável (SEMAD-MG)",
    esfera: "estadual",
    frente: "ambiental",
    descricao: "Termos de Ajustamento de Conduta firmados com o Sistema Estadual de Meio Ambiente.",
    urlOficial: "https://ecosistemas.meioambiente.mg.gov.br/gtac/",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/tac-gtac-mg.json",
    constanteCobertura: "COBERTURA_GTAC_MG",
    rotaPortal: "/ambiental/tac",
  },
  "legislacao-mma-cndh": {
    slug: "legislacao-mma-cndh",
    nome: "Acervo Integrado de Legislação Ambiental Federal e Direitos Humanos",
    orgao: "MMA / CNDH / Conama",
    esfera: "federal",
    frente: "ambiental",
    descricao: "Normas federais, resoluções Conama, recomendações CNDH classificadas com URN LexML.",
    urlOficial: "https://dados.mma.gov.br",
    licenca: "cc-by",
    frequenciaAtualizacao: "mensal",
    camada: "banco",
    rotaPortal: "/ambiental/legislacao",
  },

  // ─── FRENTE: AMBIENTAL — CRIMES SOCIOAMBIENTAIS (Mariana e Brumadinho) ───
  "biblioteca-desastres": {
    slug: "biblioteca-desastres",
    nome: "Biblioteca unificada dos crimes socioambientais (Mariana e Brumadinho)",
    orgao: "ATIs, órgãos federais, estaduais e instituições de justiça",
    esfera: "independente",
    frente: "ambiental",
    descricao:
      "Catálogo + link de documentos públicos dos dois rompimentos, fundido por scripts/agregar-biblioteca-desastres.mts a partir do acervo das ATIs e dos arquivos por fonte em etl/betim/dados/desastres.",
    urlOficial: "https://controlepopular.com.br/ambiental/crimes-socioambientais",
    licenca: "lei-acesso-informacao",
    frequenciaAtualizacao: "semanal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/data/biblioteca-desastres.json",
    constanteCobertura: "COBERTURA_BIBLIOTECA_DESASTRES",
    rotaPortal: "/ambiental/crimes-socioambientais",
    ressalvaEditorial:
      "Mariana (2015) e Brumadinho (2019) são casos diferentes — responsáveis, bacias e processos distintos. Todo item traz desastre; nenhum agregado mistura os dois sem rótulo.",
  },
  "biblioteca-atis-mariana": {
    slug: "biblioteca-atis-mariana",
    nome: "ATIs de Mariana — AEDAS na bacia do Rio Doce",
    orgao: "AEDAS",
    esfera: "independente",
    frente: "ambiental",
    descricao:
      "Publicações das assessorias técnicas independentes nos programas do Rio Doce (Aimorés, Barra Longa, Conselheiro Pena, Médio Rio Doce, Resplendor-Itueta, Vale do Aço), coletadas por scripts/coletar-biblioteca-ati-mariana.py.",
    urlOficial: "https://aedasmg.org/",
    licenca: "cc-by-nd",
    frequenciaAtualizacao: "semanal",
    camada: "public-assets",
    caminhoArquivo: "apps/web/public/data/biblioteca-desastres.json",
    constanteCobertura: "COBERTURA_BIBLIOTECA_DESASTRES",
    rotaPortal: "/ambiental/crimes-socioambientais",
    ressalvaEditorial:
      "Metadado + link, nunca o arquivo (Lei 9.610/98, direitos reservados sem licença declarada). Sem resumo: a fonte não publica excerpt.",
  },
   "noticias-desastres": {
     slug: "noticias-desastres",
     nome: "Radar de notícias dos crimes socioambientais",
     orgao: "Imprensa e agregador Google Notícias",
     esfera: "independente",
     frente: "ambiental",
     descricao:
       "Radar diário (título, veículo, data, microresumo, link) sobre Mariana, Brumadinho, o reconhecimento de atingidos no ES e na Bahia e a bacia do Rio Doce. Nunca o corpo da matéria.",
     urlOficial: "https://news.google.com/",
     licenca: "dados-abertos-gov",
     frequenciaAtualizacao: "diaria",
     camada: "data-json",
     caminhoArquivo: "apps/web/data/noticias-desastres.json",
     rotaPortal: "/ambiental/crimes-socioambientais",
     ressalvaEditorial:
       "Notícia diz que algo foi noticiado, na data em que foi — não é fato oficial. Item sem vínculo claro de lugar com um dos casos fica sem rótulo de desastre.",
   },
   "fundo-brasil": {
     slug: "fundo-brasil",
     nome: "Fundo Brasil de Direitos Humanos — Programa Rio Doce e editais",
     orgao: "Fundo Brasil de Direitos Humanos",
     esfera: "independente",
     frente: "ambiental",
     descricao:
       "Metadado de editais e do programa institucional 'Programa Rio Doce' do Fundo Brasil (financiamento a sociedade civil na bacia do Rio Doce, area atingida por Mariana). Ultimo edital: 2025 — 20 organizacoes, R$ 50.000 cada, total R$ 1.000.000,00.",
     urlOficial: "https://www.fundobrasil.org.br",
     licenca: "dados-abertos-gov",
     frequenciaAtualizacao: "anual",
     camada: "public-assets",
     caminhoArquivo: "apps/web/public/data/biblioteca-desastres.json",
     constanteCobertura: "COBERTURA_BIBLIOTECA_DESASTRES",
     rotaPortal: "/ambiental/crimes-socioambientais",
     ressalvaEditorial:
       "Mariana (2015) e Brumadinho (2019) sao casos diferentes. Metadado + link, nunca o arquivo. Editais publicados pela propria fundao; o portal registra apenas a referencia.",
   },

  // ─── FRENTE: EMPRESAS ───────────────────────────────────────────────────────
  "vale-b3-cvm": {
    slug: "vale-b3-cvm",
    nome: "Observatório Vale S.A. (B3 Séries Históricas + CVM + SIGMINE/SIGBM)",
    orgao: "B3 / CVM / ANM",
    esfera: "federal",
    frente: "empresas",
    descricao: "Preços de fechamento de VALE3 (2015–2026), relatórios CVM (ITR/DFP), processos de mineração e barragens.",
    urlOficial: "https://www.b3.com.br",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "diaria",
    camada: "data-json",
    caminhoArquivo: "apps/web/data/vale3-cotacoes.json",
    rotaPortal: "/paraopeba/vale",
    ressalvaEditorial: "Preços brutos de pregão sem ajuste por proventos. Cotação de mercado não mede dano nem reparação.",
  },
  "sigma-lithium-observatorio": {
    slug: "sigma-lithium-observatorio",
    nome: "Observatório Sigma Lithium (Vale do Jequitinhonha)",
    orgao: "ANM / SEMAD / Notícias Locais",
    esfera: "estadual",
    frente: "empresas",
    descricao: "Processos minerários de lítio, licenciamento SIAM e linha do tempo de eventos ambientais em Araçuaí/Itinga.",
    // URL migrada em 31/08/2026: app.anm.gov.br/SIGMINE devolve 404; o SIGMINE
    // novo vive em geo.anm.gov.br (medido 200 em 31/08, via LinkMender).
    urlOficial: "https://geo.anm.gov.br/",
    licenca: "dados-abertos-gov",
    frequenciaAtualizacao: "mensal",
    camada: "data-json",
    rotaPortal: "/empresas/sigma-lithium",
  },
};

/** Retorna a definição de uma fonte por seu slug único. */
export function obterFonte(slug: string): FonteDef | undefined {
  return REGISTRY_FONTES[slug];
}

/** Lista todas as fontes pertencentes a uma frente do portal. */
export function listarFontesPorFrente(frente: FrenteSlug): FonteDef[] {
  return Object.values(REGISTRY_FONTES).filter((f) => f.frente === frente);
}

/** Lista todas as fontes catalogadas no portal. */
export function listarTodasFontes(): FonteDef[] {
  return Object.values(REGISTRY_FONTES);
}

/** Retorna estatísticas de cobertura por frente e camada de alocação. */
export function obterEstatisticasFontes(): {
  total: number;
  porFrente: Record<FrenteSlug, number>;
  porCamada: Record<CamadaDado, number>;
} {
  const todas = listarTodasFontes();
  const porFrente: Record<FrenteSlug, number> = {
    cidades: 0,
    congresso: 0,
    judiciario: 0,
    terras: 0,
    paraopeba: 0,
    ambiental: 0,
    empresas: 0,
    transversal: 0,
  };
  const porCamada: Record<CamadaDado, number> = {
    "data-json": 0,
    "public-assets": 0,
    banco: 0,
    "ao-vivo": 0,
  };

  for (const f of todas) {
    porFrente[f.frente] = (porFrente[f.frente] ?? 0) + 1;
    porCamada[f.camada] = (porCamada[f.camada] ?? 0) + 1;
  }

  return {
    total: todas.length,
    porFrente,
    porCamada,
  };
}
