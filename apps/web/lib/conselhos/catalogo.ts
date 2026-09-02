import type {
  RegistroConselho,
  CategoriaConselho,
  EsferaConselho,
} from "./tipos";

export const CONSELHOS_CATALOGO: RegistroConselho[] = [
  // ==========================================
  // COMITÊS DE BACIAS HIDROGRÁFICAS
  // ==========================================
  {
    id: "cbh-sao-francisco",
    nome: "Comitê da Bacia Hidrográfica do Rio São Francisco",
    sigla: "CBHSF",
    categoria: "bacias_hidrograficas",
    esfera: "federal",
    uf: "BR",
    baciaHidrografica: "Bacia do Rio São Francisco",
    descricaoPapel:
      "Parlamento das águas do Velho Chico: delibera sobre cobrança pelo uso da água, planos de aplicação de recursos, outorgas de grande porte e programas de recuperação hidroambiental.",
    quemParticipa:
      "Comunidades ribeirinhas, povos indígenas e quilombolas, pescadores, universidades, grandes irrigantes, companhias de saneamento e órgãos governamentais de 6 estados e DF.",
    contatos: {
      siteOficial: "https://cbhsaofrancisco.org.br",
      email: "secretaria@cbhsaofrancisco.org.br",
      reunioesPublicas: "Plenárias ordinárias semestrais transmitidas ao vivo pelo canal oficial.",
      linkAtas: "https://cbhsaofrancisco.org.br/documentos/atas/",
      canalDenuncia: "https://cbhsaofrancisco.org.br/fale-conosco/",
    },
    tags: ["bacia-hidrografica", "sao-francisco", "recursos-hidricos", "controle-social"],
  },
  {
    id: "cbh-rio-doce",
    nome: "Comitê da Bacia Hidrográfica do Rio Doce",
    sigla: "CBH-Doce",
    categoria: "bacias_hidrograficas",
    esfera: "federal",
    uf: "MG",
    baciaHidrografica: "Bacia do Rio Doce",
    descricaoPapel:
      "Colegiado que atua na gestão integrada dos recursos hídricos do Rio Doce em Minas e Espírito Santo, acompanhando projetos de despoluição, outorgas e debates da repactuação de Mariana.",
    quemParticipa:
      "Usuários de água (indústria, mineração, saneamento), organizações não governamentais, comitês afluentes e governos de MG e ES.",
    contatos: {
      siteOficial: "https://cbhdoce.org.br",
      email: "comunicacao@cbhdoce.org.br",
      reunioesPublicas: "Reuniões ordinárias trimestrais públicas e com atas abertas.",
      linkAtas: "https://cbhdoce.org.br/atas-e-deliberacoes/",
    },
    tags: ["rio-doce", "bacia-hidrografica", "mariana", "reparacao", "recursos-hidricos"],
  },
  {
    id: "cbh-rio-das-velhas",
    nome: "Comitê da Bacia Hidrográfica do Rio das Velhas",
    sigla: "CBH-Velhas",
    categoria: "bacias_hidrograficas",
    esfera: "estadual",
    uf: "MG",
    baciaHidrografica: "Bacia do Rio das Velhas",
    descricaoPapel:
      "Fiscaliza e delibera sobre a bacia responsável pela captação de água para grande parte de Belo Horizonte e Região Metropolitana, protegendo cabeceiras em Ouro Preto e foz no São Francisco.",
    quemParticipa:
      "Subcomitês locais de bacia, ambientalistas, moradores de vilas ribeirinhas, COPASA, mineradoras e prefeituras consorciadas.",
    contatos: {
      siteOficial: "https://cbhvelhas.org.br",
      email: "cbhvelhas@cbhvelhas.org.br",
      reunioesPublicas: "Reuniões plenárias e reuniões mensais nos núcleos e subcomitês territoriais.",
      linkAtas: "https://cbhvelhas.org.br/documentos/",
    },
    tags: ["rio-das-velhas", "belo-horizonte", "ouro-preto", "bacia-hidrografica"],
  },
  {
    id: "cbh-rio-paraopeba",
    nome: "Comitê da Bacia Hidrográfica do Rio Paraopeba",
    sigla: "CBH-Paraopeba",
    categoria: "bacias_hidrograficas",
    esfera: "estadual",
    uf: "MG",
    baciaHidrografica: "Bacia do Rio Paraopeba",
    descricaoPapel:
      "Atua no monitoramento da calha do Paraopeba e de seus afluentes em Brumadinho, Betim e municípios vizinhos, fiscalizando obras de saneamento e planos de desassoreamento pós-rompimento de 2019.",
    quemParticipa:
      "Atingidos por barragens, pescadores artesanais, produtores rurais de hortaliças, indústrias, prefeituras e órgãos ambientais.",
    contatos: {
      siteOficial: "https://cbhparaopeba.com.br",
      email: "contato@cbhparaopeba.com.br",
      reunioesPublicas: "Plenárias e reuniões de câmaras técnicas abertas à população.",
      linkAtas: "https://cbhparaopeba.com.br/documentos/",
    },
    tags: ["rio-paraopeba", "brumadinho", "betim", "bacia-hidrografica"],
  },
  {
    id: "cbh-rio-jequitinhonha",
    nome: "Comitê da Bacia Hidrográfica dos Afluentes Mineiros do Rio Jequitinhonha",
    sigla: "CBH-Jequitinhonha",
    categoria: "bacias_hidrograficas",
    esfera: "estadual",
    uf: "MG",
    baciaHidrografica: "Bacia do Rio Jequitinhonha",
    descricaoPapel:
      "Delibera sobre a segurança hídrica no semiárido do Vale do Jequitinhonha, outorgas de água para novos projetos de mineração de lítio e proteção de poços e barraginhas comunitárias.",
    quemParticipa:
      "Artesãos, agricultores familiares, comunidades quilombolas, sindicatos rurais, prefeituras de Araçuaí e Itinga e empresas minerárias.",
    contatos: {
      siteOficial: "http://www.igam.mg.gov.br/cbh-jequitinhonha",
      email: "cbh.jequitinhonha@meioambiente.mg.gov.br",
      reunioesPublicas: "Reuniões itinerantes nas cidades do Vale do Jequitinhonha.",
    },
    tags: ["jequitinhonha", "aracuai", "itinga", "semiarido", "bacia-hidrografica"],
  },
  {
    id: "cbh-alto-tiete",
    nome: "Comitê da Bacia Hidrográfica do Alto Tietê",
    sigla: "CBH-AT",
    categoria: "bacias_hidrograficas",
    esfera: "estadual",
    uf: "SP",
    baciaHidrografica: "Bacia do Alto Tietê",
    descricaoPapel:
      "Coordena as decisões de recursos hídricos na Região Metropolitana de São Paulo, fiscalizando as represas Billings e Guarapiranga e o Sistema Cantareira.",
    quemParticipa:
      "Prefeituras da Grande São Paulo, SABESP, indústrias, ONGs ambientalistas e movimentos de defesa das bacias urbanas.",
    contatos: {
      siteOficial: "https://comiteat.sp.gov.br",
      email: "secretaria@comiteat.sp.gov.br",
      reunioesPublicas: "Reuniões plenárias e de câmaras técnicas mensais.",
      linkAtas: "https://comiteat.sp.gov.br/deliberacoes-e-atas/",
    },
    tags: ["sao-paulo", "tiete", "billings", "cantareira", "bacia-hidrografica"],
  },

  // ==========================================
  // CONSELHOS DE MEIO AMBIENTE (CONAMA, COPAM, CODEMAs)
  // ==========================================
  {
    id: "conama",
    nome: "Conselho Nacional do Meio Ambiente",
    sigla: "CONAMA",
    categoria: "meio_ambiente",
    esfera: "federal",
    uf: "BR",
    descricaoPapel:
      "Órgão consultivo e deliberativo máximo do Sistema Nacional do Meio Ambiente (SISNAMA). Estabelece resoluções com força de lei sobre padrões de emissão, licenciamento e áreas protegidas.",
    quemParticipa:
      "Ministérios federais, governos estaduais, confederações empresariais, sindicatos de trabalhadores, povos indígenas e ONGs eleitas.",
    contatos: {
      siteOficial: "https://www.gov.br/mma/pt-br/assuntos/conama",
      email: "conama@mma.gov.br",
      reunioesPublicas: "Reuniões plenárias transmitidas no canal oficial do Ministério do Meio Ambiente.",
      linkAtas: "https://www.gov.br/mma/pt-br/assuntos/conama/reunioes-do-conama",
    },
    tags: ["conama", "meio-ambiente", "normas-ambientais", "federal"],
  },
  {
    id: "copam-mg",
    nome: "Conselho Estadual de Política Ambiental de Minas Gerais",
    sigla: "COPAM-MG",
    categoria: "meio_ambiente",
    esfera: "estadual",
    uf: "MG",
    descricaoPapel:
      "Órgão colegiado normativo e deliberativo de Minas Gerais responsável por julgar licenças ambientais de grande porte (mineração, siderurgia, barragens) e fixar diretrizes estaduais.",
    quemParticipa:
      "Câmaras Técnicas Especializadas (Mineração, Indústria, Agropecuária), representantes empresariais (FIEMG), universidades e entidades ambientalistas cadastradas.",
    contatos: {
      siteOficial: "https://www.meioambiente.mg.gov.br/copam",
      email: "copam@meioambiente.mg.gov.br",
      reunioesPublicas: "Sessões transmitidas pelo canal da SEMAD no YouTube com pautas prévias.",
      linkAtas: "https://www.meioambiente.mg.gov.br/copam/pautas-e-atas",
    },
    tags: ["copam", "licenciamento", "minas-gerais", "mineracao", "meio-ambiente"],
  },
  {
    id: "codema-diamantina",
    nome: "Conselho Municipal de Desenvolvimento Ambiental de Diamantina",
    sigla: "CODEMA Diamantina",
    categoria: "meio_ambiente",
    esfera: "municipal",
    municipioIbge: "3121605",
    municipioNome: "Diamantina",
    uf: "MG",
    descricaoPapel:
      "Examina e delibera sobre pedidos de licenciamento de impacto local, desmatamentos urbanos, corte de árvores, descarte de resíduos e proteção de córregos no perímetro de Diamantina.",
    quemParticipa:
      "Moradores, associações comunitárias, IPHAN, universidades locais (UFVJM), secretarias municipais e representantes do comércio.",
    contatos: {
      siteOficial: "https://diamantina.mg.gov.br/meio-ambiente/",
      email: "meioambiente@diamantina.mg.gov.br",
      enderecoFisico: "Secretaria Municipal de Meio Ambiente — Diamantina, MG",
      reunioesPublicas: "Reuniões mensais abertas à participação cidadã.",
    },
    tags: ["codema", "diamantina", "meio-ambiente", "espinhaco"],
  },
  {
    id: "codema-betim",
    nome: "Conselho Municipal de Meio Ambiente de Betim",
    sigla: "CODEMA Betim",
    categoria: "meio_ambiente",
    esfera: "municipal",
    municipioIbge: "3106705",
    municipioNome: "Betim",
    uf: "MG",
    descricaoPapel:
      "Fiscaliza a poluição industrial, emissões atmosféricas, licenciamento de galpões e indústrias automotivas/químicas e proteção das várzeas dos córregos de Betim.",
    quemParticipa:
      "Indústrias, sindicatos de trabalhadores, associações de moradores de bairros afetados por odores ou fuligem e técnicos municipais.",
    contatos: {
      siteOficial: "https://www.betim.mg.gov.br/portal/secretarias-paginas/82/codema/",
      email: "meioambiente@betim.mg.gov.br",
      enderecoFisico: "Centro Administrativo João Paulo II — Betim, MG",
      reunioesPublicas: "Reuniões ordinárias mensais com publicação de deliberações no Órgão Oficial.",
    },
    tags: ["codema", "betim", "industria", "poluicao", "meio-ambiente"],
  },
  {
    id: "codema-aracuai",
    nome: "Conselho Municipal de Defesa do Meio Ambiente de Araçuaí",
    sigla: "CODEMA Araçuaí",
    categoria: "meio_ambiente",
    esfera: "municipal",
    municipioIbge: "3103405",
    municipioNome: "Araçuaí",
    uf: "MG",
    descricaoPapel:
      "Acompanha as licenças ambientais locais, a destinação dos resíduos sólidos e os impactos da poeira e circulação de caminhões da mineração de lítio na cidade.",
    quemParticipa:
      "Representantes das comunidades rurais, artesãos, sindicato dos trabalhadores rurais e poder executivo municipal.",
    contatos: {
      siteOficial: "https://www.aracuai.mg.gov.br",
      email: "meioambiente@aracuai.mg.gov.br",
      reunioesPublicas: "Reuniões mensais com pautas afixadas na sede da prefeitura.",
    },
    tags: ["codema", "aracuai", "jequitinhonha", "litio", "meio-ambiente"],
  },
  {
    id: "codema-itinga",
    nome: "Conselho Municipal de Meio Ambiente de Itinga",
    sigla: "CODEMA Itinga",
    categoria: "meio_ambiente",
    esfera: "municipal",
    municipioIbge: "3134004",
    municipioNome: "Itinga",
    uf: "MG",
    descricaoPapel:
      "Fiscaliza o uso das margens do Rio Jequitinhonha, proteção das áreas de extração de barro das artesãs e monitoramento de poeira e ruídos de pedreiras e lavras.",
    quemParticipa:
      "Comunidades quilombolas de Itinga, oleiras tradicionais, pescadores e secretarias de obras e agricultura.",
    contatos: {
      siteOficial: "https://www.itinga.mg.gov.br",
      email: "contato@itinga.mg.gov.br",
      reunioesPublicas: "Sessões periódicas abertas na Câmara Municipal de Itinga.",
    },
    tags: ["codema", "itinga", "jequitinhonha", "meio-ambiente"],
  },

  // ==========================================
  // CONSELHOS DE UNIDADES DE CONSERVAÇÃO
  // ==========================================
  {
    id: "conselho-biribiri",
    nome: "Conselho Consultivo do Parque Estadual do Biribiri",
    sigla: "Conselho Biribiri",
    categoria: "unidades_conservacao",
    esfera: "estadual",
    municipioIbge: "3121605",
    municipioNome: "Diamantina",
    uf: "MG",
    descricaoPapel:
      "Canal oficial de participação comunitária na gestão do Parque Estadual do Biribiri, opinando sobre plano de manejo, concessões turísticas, trilhas e proteção das cachoeiras.",
    quemParticipa:
      "Moradores da vila histórica de Biribiri, condutores de ecoturismo, pesquisadores da UFVJM, IEF-MG e empresários do turismo sustentável.",
    contatos: {
      siteOficial: "https://www.ief.mg.gov.br/unidades-de-conservacao/parques-estaduais/parque-estadual-do-biribiri",
      email: "pebiribiri@meioambiente.mg.gov.br",
      reunioesPublicas: "Reuniões ordinárias trimestrais na sede do parque em Diamantina.",
    },
    tags: ["biribiri", "unidade-conservacao", "diamantina", "ief"],
  },
  {
    id: "conselho-serra-cipo",
    nome: "Conselho Consultivo do Parque Nacional da Serra do Cipó e APA Morro da Pedreira",
    sigla: "Conselho Serra do Cipó",
    categoria: "unidades_conservacao",
    esfera: "federal",
    uf: "MG",
    descricaoPapel:
      "Articula a preservação botânica e de recursos hídricos da Serra do Cipó, combatendo invasões de loteamento ilegal e disciplinando o uso público de trilhas e rios.",
    quemParticipa:
      "ICMBio, brigadistas comunitários voluntários, pesquisadores de botânica, pousadeiros, guias de montanha e prefeituras do entorno.",
    contatos: {
      siteOficial: "https://www.icmbio.gov.br/parnaserradocipo/",
      email: "parna.cipo@icmbio.gov.br",
      reunioesPublicas: "Reuniões públicas convocadas por edital do ICMBio.",
    },
    tags: ["serra-do-cipo", "parque-nacional", "icmbio", "campos-rupestres"],
  },

  // ==========================================
  // POVOS E COMUNIDADES TRADICIONAIS (PCTs)
  // ==========================================
  {
    id: "cnpct",
    nome: "Conselho Nacional de Povos e Comunidades Tradicionais",
    sigla: "CNPCT",
    categoria: "povos_tradicionais",
    esfera: "federal",
    uf: "BR",
    descricaoPapel:
      "Instância federal responsável por propor e monitorar a Política Nacional de Desenvolvimento Sustentável dos Povos e Comunidades Tradicionais, garantindo direitos territoriais e socioculturais.",
    quemParticipa:
      "Representantes eleitos de quilombolas, indígenas, geraizeiros, vazanteiros, faxinalenses, ciganos, retireiros, pescadores e marisqueiras de todo o país.",
    contatos: {
      siteOficial: "https://www.gov.br/mds/pt-br/acoes-e-programas/povos-e-comunidades-tradicionais/cnpct",
      email: "cnpct@mds.gov.br",
      reunioesPublicas: "Reuniões plenárias periódicas em Brasília com deliberações publicadas no Diário Oficial da União.",
    },
    tags: ["povos-tradicionais", "quilombos", "indigenas", "geraizeiros", "direitos-territoriais"],
  },
  {
    id: "cepct-mg",
    nome: "Conselho Estadual de Povos e Comunidades Tradicionais de Minas Gerais",
    sigla: "CEPCT-MG",
    categoria: "povos_tradicionais",
    esfera: "estadual",
    uf: "MG",
    descricaoPapel:
      "Articula as demandas por titulação de terras coletivas, acesso a água, saúde diferenciada e respeito à Convenção 169 da OIT em Minas Gerais.",
    quemParticipa:
      "Lideranças quilombolas do Vale do Jequitinhonha, geraizeiros do Norte de Minas, vazanteiros do São Francisco e Secretaria de Estado de Desenvolvimento Social (SEDESE).",
    contatos: {
      siteOficial: "https://social.mg.gov.br/comunidades-tradicionais",
      email: "comunidadestradicionais@social.mg.gov.br",
      reunioesPublicas: "Reuniões bimestrais públicas com atas disponibilizadas aos movimentos.",
    },
    tags: ["povos-tradicionais", "minas-gerais", "quilombos", "sedese"],
  },

  // ==========================================
  // DIREITOS HUMANOS
  // ==========================================
  {
    id: "cndh",
    nome: "Conselho Nacional dos Direitos Humanos",
    sigla: "CNDH",
    categoria: "direitos_humanos",
    esfera: "federal",
    uf: "BR",
    descricaoPapel:
      "Órgão de Estado com autonomia legal para fiscalizar denúncias de graves violações aos direitos humanos no país, realizar missões in loco e emitir recomendações e resoluções com força institucional.",
    quemParticipa:
      "Conselheiros eleitos de entidades nacionais de direitos humanos, OAB, Ministério Público Federal, Defensoria Pública da União e representantes governamentais.",
    contatos: {
      siteOficial: "https://www.gov.br/participamaisbrasil/cndh",
      email: "cndh@mdhc.gov.br",
      telefone: "(61) 2027-3100",
      reunioesPublicas: "Plenárias mensais abertas ao público transmitidas ao vivo no YouTube.",
      linkAtas: "https://www.gov.br/participamaisbrasil/cndh-atas-e-resolucoes",
      canalDenuncia: "https://www.gov.br/participamaisbrasil/cndh-como-denunciar",
    },
    tags: ["cndh", "direitos-humanos", "fiscalizacao", "defensores", "missoes"],
  },
  {
    id: "conedh-mg",
    nome: "Conselho Estadual de Defesa dos Direitos Humanos de Minas Gerais",
    sigla: "CONEDH-MG",
    categoria: "direitos_humanos",
    esfera: "estadual",
    uf: "MG",
    descricaoPapel:
      "Recebe e apura denúncias de violência policial, perseguição a defensores socioambientais, trabalho escravo contemporâneo e conflitos possessórios em Minas Gerais.",
    quemParticipa:
      "Movimentos sociais, OAB-MG, Pastoral da Terra, Defensoria Pública de MG e Secretaria de Estado de Justiça e Segurança Pública.",
    contatos: {
      siteOficial: "https://www.social.mg.gov.br/direitos-humanos/conedh",
      email: "conedh@social.mg.gov.br",
      telefone: "(31) 3915-3000",
      reunioesPublicas: "Reuniões ordinárias mensais com acolhimento a vítimas e familiares.",
    },
    tags: ["direitos-humanos", "minas-gerais", "conedh", "defesa-social"],
  },

  // ==========================================
  // SAÚDE E SANEAMENTO
  // ==========================================
  {
    id: "cns",
    nome: "Conselho Nacional de Saúde",
    sigla: "CNS",
    categoria: "saude",
    esfera: "federal",
    uf: "BR",
    descricaoPapel:
      "Instância máxima de deliberação do SUS no Brasil: aprova diretrizes de vigilância em saúde ambiental, saúde do trabalhador e monitoramento de doenças decorrentes de contaminação hídrica.",
    quemParticipa:
      "50% usuários do SUS (movimentos sociais, pessoas com deficiência, atingidos), 25% profissionais de saúde e 25% gestores e prestadores de serviço.",
    contatos: {
      siteOficial: "https://conselho.saude.gov.br",
      email: "cns@saude.gov.br",
      linkAtas: "https://conselho.saude.gov.br/atas-cns",
      canalDenuncia: "Disque Saúde 136",
    },
    tags: ["sus", "saude", "vigilancia-ambiental", "controle-social"],
  },
  {
    id: "cms-betim",
    nome: "Conselho Municipal de Saúde de Betim",
    sigla: "CMS Betim",
    categoria: "saude",
    esfera: "municipal",
    municipioIbge: "3106705",
    municipioNome: "Betim",
    uf: "MG",
    descricaoPapel:
      "Fiscaliza os hospitais públicos, UBS, UPA e o abastecimento de medicamentos no SUS de Betim, além de monitorar queixas de poluição hídrica e intoxicação de trabalhadores.",
    quemParticipa:
      "Comunidades de bairro, agentes comunitários de saúde, médicos, enfermeiros e Secretaria Municipal de Saúde.",
    contatos: {
      siteOficial: "https://www.betim.mg.gov.br/portal/secretarias-paginas/79/conselho-municipal-de-saude/",
      email: "cmsbetim@betim.mg.gov.br",
      enderecoFisico: "Secretaria de Saúde de Betim — Rua Pará de Minas, Betim, MG",
      reunioesPublicas: "Reuniões plenárias abertas toda segunda quinta-feira do mês.",
    },
    tags: ["saude", "betim", "sus", "ubs", "controle-social"],
  },
  {
    id: "cms-diamantina",
    nome: "Conselho Municipal de Saúde de Diamantina",
    sigla: "CMS Diamantina",
    categoria: "saude",
    esfera: "municipal",
    municipioIbge: "3121605",
    municipioNome: "Diamantina",
    uf: "MG",
    descricaoPapel:
      "Controla a aplicação das verbas do SUS nos postos de saúde de distritos e comunidades rurais de Diamantina, fiscalizando a qualidade da água e atendimento médico.",
    quemParticipa:
      "Usuários dos distritos rurais, agentes de saúde, profissionais da Santa Casa e gestores municipais.",
    contatos: {
      siteOficial: "https://diamantina.mg.gov.br/saude/",
      email: "saude@diamantina.mg.gov.br",
      reunioesPublicas: "Reuniões ordinárias mensais.",
    },
    tags: ["saude", "diamantina", "sus", "distritos-rurais"],
  },

  // ==========================================
  // CRIANÇA, ADOLESCENTE E CONSELHOS TUTELARES
  // ==========================================
  {
    id: "conanda",
    nome: "Conselho Nacional dos Direitos da Criança e do Adolescente",
    sigla: "CONANDA",
    categoria: "crianca_adolescente",
    esfera: "federal",
    uf: "BR",
    descricaoPapel:
      "Formula diretrizes nacionais para aplicação do Estatuto da Criança e do Adolescente (ECA) e gere o Fundo Nacional para a Criança e o Adolescente (FNCA).",
    quemParticipa:
      "Entidades da sociedade civil de defesa da infância, educadores e representantes governamentais.",
    contatos: {
      siteOficial: "https://www.gov.br/mdhc/pt-br/conanda",
      email: "conanda@mdhc.gov.br",
      canalDenuncia: "Disque 100 (Disque Direitos Humanos)",
    },
    tags: ["infancia", "eca", "conanda", "direitos-humanos"],
  },
  {
    id: "conselho-tutelar-diamantina",
    nome: "Conselho Tutelar de Diamantina",
    sigla: "Conselho Tutelar Diamantina",
    categoria: "crianca_adolescente",
    esfera: "municipal",
    municipioIbge: "3121605",
    municipioNome: "Diamantina",
    uf: "MG",
    descricaoPapel:
      "Atendimento 24h na proteção integral de crianças e adolescentes contra violência, negligência, evasão escolar e exploração de trabalho infantil nos bairros e distritos rurais.",
    quemParticipa: "5 conselheiros tutelares eleitos pelo voto popular direto.",
    contatos: {
      telefone: "(38) 3531-9292 (Plantão 24h)",
      email: "conselhotutelar@diamantina.mg.gov.br",
      enderecoFisico: "Rua do Bonfim, Diamantina, MG",
      canalDenuncia: "Telefone de plantão e Disque 100",
    },
    tags: ["conselho-tutelar", "diamantina", "infancia", "protecao-integral"],
  },
  {
    id: "conselho-tutelar-aracuai",
    nome: "Conselho Tutelar de Araçuaí",
    sigla: "Conselho Tutelar Araçuaí",
    categoria: "crianca_adolescente",
    esfera: "municipal",
    municipioIbge: "3103405",
    municipioNome: "Araçuaí",
    uf: "MG",
    descricaoPapel:
      "Garante os direitos de crianças e adolescentes em toda a área urbana e comunidades rurais de Araçuaí, agindo em casos de abandono, desnutrição e evasão escolar.",
    quemParticipa: "Conselheiros tutelares eleitos pela comunidade.",
    contatos: {
      telefone: "(33) 3731-2550",
      email: "conselhotutelararacuai@gmail.com",
      enderecoFisico: "Praça do Rosário — Araçuaí, MG",
      canalDenuncia: "Plantão do Conselho Tutelar e Disque 100",
    },
    tags: ["conselho-tutelar", "aracuai", "jequitinhonha", "infancia"],
  },

  // ==========================================
  // PATRIMÔNIO CULTURAL E CIDADES HISTÓRICAS
  // ==========================================
  {
    id: "compac-ouro-preto",
    nome: "Conselho Municipal de Preservação do Patrimônio Cultural e Natural de Ouro Preto",
    sigla: "COMPAT Ouro Preto",
    categoria: "patrimonio_cultural",
    esfera: "municipal",
    municipioIbge: "3146107",
    municipioNome: "Ouro Preto",
    uf: "MG",
    descricaoPapel:
      "Fiscaliza intervenções urbanísticas, demolições, reformas e obras na paisagem histórica de Ouro Preto e seus 12 distritos, conciliando moradia popular com tombamento UNESCO.",
    quemParticipa:
      "Moradores dos bairros históricos, arquitetos, IPHAN, Instituto do Patrimônio Histórico de Ouro Preto e UFOP.",
    contatos: {
      siteOficial: "https://ouropreto.mg.gov.br/patrimonio/",
      email: "patrimonio@ouropreto.mg.gov.br",
      reunioesPublicas: "Sessões plenárias mensais abertas à comunidade.",
    },
    tags: ["patrimonio-cultural", "ouro-preto", "unesco", "tombamento"],
  },
  {
    id: "compac-diamantina",
    nome: "Conselho Municipal de Patrimônio Cultural de Diamantina",
    sigla: "COMPAC Diamantina",
    categoria: "patrimonio_cultural",
    esfera: "municipal",
    municipioIbge: "3121605",
    municipioNome: "Diamantina",
    uf: "MG",
    descricaoPapel:
      "Delibera sobre diretrizes de conservação de fachadas, casarios coloniais, festas tradicionais e proteção da paisagem histórica dos garimpos e serra.",
    quemParticipa:
      "Associações de artesãos, seresteiros, historiadores, IPHAN e Secretaria de Cultura e Turismo.",
    contatos: {
      siteOficial: "https://diamantina.mg.gov.br/cultura-e-patrimonio/",
      email: "cultura@diamantina.mg.gov.br",
      enderecoFisico: "Secretaria de Cultura — Praça Juscelino Kubitschek, Diamantina, MG",
    },
    tags: ["patrimonio-cultural", "diamantina", "unesco", "cultura-popular"],
  },
];

/**
 * Retorna todos os conselhos cadastrados.
 */
export function listarConselhos(): RegistroConselho[] {
  return CONSELHOS_CATALOGO;
}

/**
 * Retorna conselho por ID único.
 */
export function obterConselho(id: string): RegistroConselho | undefined {
  return CONSELHOS_CATALOGO.find((c) => c.id === id);
}

/**
 * Filtra conselhos por município (código IBGE ou nome).
 */
export function conselhosPorMunicipio(codigoOuNome: string): RegistroConselho[] {
  const norm = codigoOuNome.trim().toLowerCase();
  return CONSELHOS_CATALOGO.filter(
    (c) =>
      c.municipioIbge === codigoOuNome ||
      (c.municipioNome && c.municipioNome.toLowerCase().includes(norm))
  );
}

/**
 * Filtra conselhos por categoria temática.
 */
export function conselhosPorCategoria(categoria: CategoriaConselho): RegistroConselho[] {
  return CONSELHOS_CATALOGO.filter((c) => c.categoria === categoria);
}

/**
 * Filtra conselhos por esfera de atuação.
 */
export function conselhosPorEsfera(esfera: EsferaConselho): RegistroConselho[] {
  return CONSELHOS_CATALOGO.filter((c) => c.esfera === esfera);
}

/**
 * Filtra conselhos associados a uma bacia hidrográfica.
 */
export function conselhosPorBacia(baciaNome: string): RegistroConselho[] {
  const norm = baciaNome.trim().toLowerCase();
  return CONSELHOS_CATALOGO.filter(
    (c) => c.baciaHidrografica && c.baciaHidrografica.toLowerCase().includes(norm)
  );
}

/**
 * Contagem agregada por categoria.
 */
export function contagemConselhosPorCategoria(): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const c of CONSELHOS_CATALOGO) {
    contagem[c.categoria] = (contagem[c.categoria] ?? 0) + 1;
  }
  return contagem;
}
