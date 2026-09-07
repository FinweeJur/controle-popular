import type { DadosImpactoPovoGente } from "@/app/ambiental/components/BlocoPovoGente";

export interface IndicadorRio {
  valor: string;
  rotulo: string;
  fonte: string;
  dataReferencia: string;
}

export interface DetalhesRio {
  id: string;
  nome: string;
  numeroProtagonista: IndicadorRio;
  populacaoBacia: string;
  municipiosBacia: number;
  estacoesMonitoramento: number;
  comiteBacia: string;
  dadosGrafico: { rotulo: string; valor: number }[];
  impactoPovoGente: DadosImpactoPovoGente;
  itensTabela: { municipio: string; atoOuLicenca: string; situacao: string; ano: string }[];
}

export const DADOS_RIOS: Record<string, DetalhesRio> = {
  "rio-paraopeba": {
    id: "rio-paraopeba",
    nome: "Rio Paraopeba",
    numeroProtagonista: {
      valor: "510 km",
      rotulo: "Extensão total da calha fluvial monitorada no pós-rompimento da B1",
      fonte: "IGAM / AECOM",
      dataReferencia: "2026",
    },
    populacaoBacia: "2,3 milhões de habitantes",
    municipiosBacia: 48,
    estacoesMonitoramento: 11,
    comiteBacia: "CBH Rio Paraopeba",
    dadosGrafico: [
      { rotulo: "2020", valor: 68 },
      { rotulo: "2022", valor: 94 },
      { rotulo: "2024", valor: 142 },
      { rotulo: "2026", valor: 185 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Paraopeba",
      saude: {
        indicador: "Qualidade da Água & Abastecimento",
        descricao: "Monitoramento contínuo de poços artesianos e turbidez em 11 estações ao longo da calha atingida.",
        fonte: "IGAM / COPASA (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Pesca Artesanal & Agricultura Familiar",
        vulnerabilidade: "Colônias de pescadores em processo de indenização e reestruturação produtiva pós-desastre.",
        fonte: "Emater-MG / Colônias de Pescadores Z-14",
      },
      moradia: {
        situacao: "Comunidades Ribeirinhas & Áreas de Várzea",
        familiasRisco: "Famílias residentes em cotas de cheia e monitoradas por planos de contingência da Defesa Civil.",
        fonte: "Defesa Civil Estadual / Prefeituras",
      },
      cultura: {
        manifestacao: "Cultura das Águas & Tradições Ribeirinhas",
        ameacaOuPotencia: "Celebrações religiosas tradicionais, festas de Nossa Senhora do Rosário e canoagem secular.",
        fonte: "IEPHA-MG",
      },
    },
    itensTabela: [
      { municipio: "Betim", atoOuLicenca: "Acordo Judicial de Reparação Integral", situacao: "Em execução", ano: "2026" },
      { municipio: "Brumadinho", atoOuLicenca: "Auditoria Socioambiental Independente (AECOM)", situacao: "Ativo", ano: "2026" },
      { municipio: "Mário Campos", atoOuLicenca: "Monitoramento Hidrológico de Turbidez", situacao: "Vigente", ano: "2025" },
      { municipio: "São Joaquim de Bicas", atoOuLicenca: "Obras de Macrodrenagem e Contenção", situacao: "Em andamento", ano: "2025" },
      { municipio: "Juatuba", atoOuLicenca: "Recuperação de Matas Ciliares", situacao: "Em execução", ano: "2024" },
    ],
  },
  "rio-doce": {
    id: "rio-doce",
    nome: "Rio Doce",
    numeroProtagonista: {
      valor: "853 km",
      rotulo: "Extensão total da calha fluvial interestadual (MG/ES) em repactuação",
      fonte: "ANA / CBH-Doce",
      dataReferencia: "2026",
    },
    populacaoBacia: "3,5 milhões de habitantes",
    municipiosBacia: 228,
    estacoesMonitoramento: 65,
    comiteBacia: "CBH Rio Doce",
    dadosGrafico: [
      { rotulo: "2020", valor: 110 },
      { rotulo: "2022", valor: 165 },
      { rotulo: "2024", valor: 215 },
      { rotulo: "2026", valor: 280 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Doce",
      saude: {
        indicador: "Captação de Água & Vigilância Toxicológica",
        descricao: "Acompanhamento dos parâmetros de metais pesados após a repactuação federal de R$ 171 bilhões.",
        fonte: "Vigiagua / Ministério da Saúde (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Pesca Marinha e Fluvial, Cacau e Agropecuária",
        vulnerabilidade: "Pescadores artesanais de Linhares, Colatina e foz em Regência sob repactuação de indenizações.",
        fonte: "Fórum de Pescadores do Rio Doce / DPU",
      },
      moradia: {
        situacao: "Assentamentos e Populações Atingidas por Enchentes",
        familiasRisco: "Mais de 12.000 famílias em áreas de vulnerabilidade física na bacia hidrográfica.",
        fonte: "Defesa Civil MG / ES",
      },
      cultura: {
        manifestacao: "Povo Indígena Krenak (Watu) & Comunidades Quilombolas",
        ameacaOuPotencia: "O Rio Doce como entidade viva sagrada ('Watu') na cosmologia dos Krenak.",
        fonte: "Memorial Krenak / FUNAI",
      },
    },
    itensTabela: [
      { municipio: "Mariana", atoOuLicenca: "Acordo de Repactuação Federal (R$ 171 bi)", situacao: "Homologado", ano: "2026" },
      { municipio: "Governador Valadares", atoOuLicenca: "Captação Alternativa no Rio Corrente Grande", situacao: "Vigente", ano: "2025" },
      { municipio: "Baixo Guandu", atoOuLicenca: "Ação Judicial Internacional de Londres", situacao: "Ativo", ano: "2025" },
      { municipio: "Linhares", atoOuLicenca: "Monitoramento Estuarino e Marinho na Foz", situacao: "Em execução", ano: "2024" },
    ],
  },
  "rio-das-velhas": {
    id: "rio-das-velhas",
    nome: "Rio das Velhas",
    numeroProtagonista: {
      valor: "761 km",
      rotulo: "Maior afluente em extensão da Bacia do Rio São Francisco",
      fonte: "CBH Rio das Velhas / IGAM",
      dataReferencia: "2026",
    },
    populacaoBacia: "4,9 milhões de habitantes",
    municipiosBacia: 51,
    estacoesMonitoramento: 32,
    comiteBacia: "CBH Rio das Velhas",
    dadosGrafico: [
      { rotulo: "2020", valor: 55 },
      { rotulo: "2022", valor: 85 },
      { rotulo: "2024", valor: 130 },
      { rotulo: "2026", valor: 175 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio das Velhas",
      saude: {
        indicador: "Tratamento de Esgoto e Efluentes Urbanos",
        descricao: "Captação de Bela Fama responsável por 40% do abastecimento de Belo Horizonte com 94,2% de esgoto tratado.",
        fonte: "COPASA / SNIS (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Indústria, Serviços e Agricultura Familiar",
        vulnerabilidade: "Produtores de hortaliças da várzea metropolitana e barqueiros tradicionais de Barra do Guaicuí.",
        fonte: "CBH Velhas / Emater-MG",
      },
      moradia: {
        situacao: "Ocupações Urbanas e Vilas Ribeirinhas nas Bacias do Arrudas e Onça",
        familiasRisco: "Comunidades periféricas expostas a inundações nas cheias de verão.",
        fonte: "URBEL / Defesa Civil BH",
      },
      cultura: {
        manifestacao: "Memória Histórica da Mineração Colonial e Navegação dos Vapores",
        ameacaOuPotencia: "Patrimônio histórico de Sabará, Ouro Preto e foz histórica em Barra do Guaicuí.",
        fonte: "IEPHA-MG",
      },
    },
    itensTabela: [
      { municipio: "Belo Horizonte", atoOuLicenca: "Despoluição dos Córregos Arrudas e Onça", situacao: "Em execução", ano: "2026" },
      { municipio: "Nova Lima", atoOuLicenca: "Proteção de Mananciais de Bela Fama", situacao: "Vigente", ano: "2025" },
      { municipio: "Sabará", atoOuLicenca: "Fiscalização de Rejeitos e Assoreamento", situacao: "Ativo", ano: "2025" },
      { municipio: "Várzea da Palma", atoOuLicenca: "Encontro das Águas com o São Francisco", situacao: "Monitorado", ano: "2024" },
    ],
  },
  "rio-jequitinhonha": {
    id: "rio-jequitinhonha",
    nome: "Rio Jequitinhonha",
    numeroProtagonista: {
      valor: "1.090 km",
      rotulo: "Extensão da calha que conecta o semiárido mineiro ao litoral baiano",
      fonte: "ANA / IGAM",
      dataReferencia: "2026",
    },
    populacaoBacia: "1,1 milhão de habitantes",
    municipiosBacia: 55,
    estacoesMonitoramento: 22,
    comiteBacia: "CBH Jequitinhonha",
    dadosGrafico: [
      { rotulo: "2020", valor: 40 },
      { rotulo: "2022", valor: 65 },
      { rotulo: "2024", valor: 95 },
      { rotulo: "2026", valor: 135 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Jequitinhonha",
      saude: {
        indicador: "Segurança Hídrica e Monitoramento de Mineração de Lítio",
        descricao: "Fiscalização das outorgas de água em Araçuaí e Itinga frente à exploração de espodumênio.",
        fonte: "IGAM / ANM (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Agricultura de Vazante, Cerâmica Artesanal e Mineração",
        vulnerabilidade: "Lavradores e artesãs do barro dependentes do fluxo sazonal do rio.",
        fonte: "Associações Comunitárias do Vale",
      },
      moradia: {
        situacao: "Comunidades Quilombolas e Vazanteiros",
        familiasRisco: "Comunidades rurais em áreas de estiagem severa atendidas por carros-pipa e poços.",
        fonte: "CEDEC-MG / Defesa Civil",
      },
      cultura: {
        manifestacao: "Artesanato em Cerâmica do Vale e Folguedos Tradicionais",
        ameacaOuPotencia: "Reconhecimento internacional da arte cerâmica das paneleiras do Vale do Jequitinhonha.",
        fonte: "IPHAN / IEPHA-MG",
      },
    },
    itensTabela: [
      { municipio: "Araçuaí", atoOuLicenca: "Monitoramento Hídrico do Vale do Lítio", situacao: "Ativo", ano: "2026" },
      { municipio: "Itinga", atoOuLicenca: "Outorga de Captação e Repasses de CFEM", situacao: "Vigente", ano: "2025" },
      { municipio: "Diamantina", atoOuLicenca: "Preservação de Cabeceiras no Espinhaço", situacao: "Em execução", ano: "2025" },
      { municipio: "Almenara", atoOuLicenca: "Comitê de Bacia Hidrográfica do Baixo Jequitinhonha", situacao: "Ativo", ano: "2024" },
    ],
  },
  "rio-sao-francisco": {
    id: "rio-sao-francisco",
    nome: "Rio São Francisco (Alto e Médio)",
    numeroProtagonista: {
      valor: "2.830 km",
      rotulo: "Extensão total do Rio da Integração Nacional (Serra da Canastra à foz)",
      fonte: "CBHSF / ANA",
      dataReferencia: "2026",
    },
    populacaoBacia: "18 milhões de habitantes",
    municipiosBacia: 521,
    estacoesMonitoramento: 140,
    comiteBacia: "CBH São Francisco",
    dadosGrafico: [
      { rotulo: "2020", valor: 145 },
      { rotulo: "2022", valor: 210 },
      { rotulo: "2024", valor: 310 },
      { rotulo: "2026", valor: 420 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio São Francisco",
      saude: {
        indicador: "Abastecimento Múltiplo e Transposição Hídrica",
        descricao: "Manutenção das vazões ecológicas do reservatório de Três Marias e Sobradinho com telemetria contínua.",
        fonte: "ANA / ONS (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Piscicultura, Irrigação de Frutas e Agropecuária",
        vulnerabilidade: "Comunidades tradicionais ribeirinhas e pescadores artesanais com declínio do surubim e dourado.",
        fonte: "Codevasf / IBAMA",
      },
      moradia: {
        situacao: "Povos Tradicionais de Fundo e Fecho de Pasto e Quilombolas",
        familiasRisco: "Famílias ribeirinhas vulneráveis às flutuações de cota das hidrelétricas.",
        fonte: "INCRA / CPT",
      },
      cultura: {
        manifestacao: "Lendas Fluviais, Carrancas e Romarias do Bom Jesus dos Navegantes",
        ameacaOuPotencia: "Patrimônio imaterial da navegação barranqueira e tradições quilombolas do Velho Chico.",
        fonte: "IPHAN",
      },
    },
    itensTabela: [
      { municipio: "Pirapora", atoOuLicenca: "Navegação Fluvial e Estação Hidrométrica", situacao: "Ativo", ano: "2026" },
      { municipio: "São Gonçalo do Abaeté", atoOuLicenca: "Operação da UHE Três Marias (CEMIG)", situacao: "Vigente", ano: "2025" },
      { municipio: "Januária", atoOuLicenca: "Preservação de Lagoas Marginais e Berçários", situacao: "Em execução", ano: "2025" },
      { municipio: "Manga", atoOuLicenca: "Fiscalização de Captações para Irrigação", situacao: "Monitorado", ano: "2024" },
    ],
  },
  "rio-tiete": {
    id: "rio-tiete",
    nome: "Rios Tietê, Pinheiros & Represas",
    numeroProtagonista: {
      valor: "1.100 km",
      rotulo: "Extensão da calha que corta São Paulo de leste a oeste até o Rio Paraná",
      fonte: "DAEE-SP / CETESB",
      dataReferencia: "2026",
    },
    populacaoBacia: "22 milhões de habitantes",
    municipiosBacia: 105,
    estacoesMonitoramento: 88,
    comiteBacia: "CBH Alto Tietê",
    dadosGrafico: [
      { rotulo: "2020", valor: 180 },
      { rotulo: "2022", valor: 260 },
      { rotulo: "2024", valor: 390 },
      { rotulo: "2026", valor: 510 },
    ],
    impactoPovoGente: {
      lugarNome: "Rios Tietê e Pinheiros",
      saude: {
        indicador: "Despoluição Urbana e Controle de Odor/Gases",
        descricao: "Investimentos do Projeto Novo Rio Pinheiros e metas de recuperação da mancha de poluição urbana.",
        fonte: "Sabesp / CETESB (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Serviços Urbanos, Hidrovia Tietê-Paraná e Polo Industrial",
        vulnerabilidade: "Catadores de recicláveis, trabalhadores de dragagem e manutenção da calha metropolitana.",
        fonte: "Secretaria de Meio Ambiente SP",
      },
      moradia: {
        situacao: "Favelas e Palafitas em Áreas de Várzea e Córregos Contribuintes",
        familiasRisco: "Milhares de famílias expostas a transbordamento nas cheias de verão.",
        fonte: "Defesa Civil SP / SEHAB",
      },
      cultura: {
        manifestacao: "História da Urbanização Paulista e Memória dos Esportes Náuticos",
        ameacaOuPotencia: "Iniciativas cidadãs de reaproximação da metrópole com seus rios históricos.",
        fonte: "Museu da Cidade de São Paulo",
      },
    },
    itensTabela: [
      { municipio: "São Paulo", atoOuLicenca: "Programa Novo Rio Pinheiros (Fase 3)", situacao: "Em execução", ano: "2026" },
      { municipio: "Guarulhos", atoOuLicenca: "Intercepção de Esgotos na Cabeceira", situacao: "Vigente", ano: "2025" },
      { municipio: "Salto", atoOuLicenca: "Monitoramento da Espuma de Poluição e Queda D'Água", situacao: "Ativo", ano: "2025" },
      { municipio: "Barra Bonita", atoOuLicenca: "Eclusa da Hidrovia Tietê-Paraná", situacao: "Operacional", ano: "2024" },
    ],
  },
  "rio-guandu": {
    id: "rio-guandu",
    nome: "Rio Guandu & Baía de Guanabara",
    numeroProtagonista: {
      valor: "43.000 L/s",
      rotulo: "Vazão nominal tratada pela ETA Guandu (maior estação de água do mundo)",
      fonte: "CEDAE / INEA-RJ",
      dataReferencia: "2026",
    },
    populacaoBacia: "9 milhões de habitantes",
    municipiosBacia: 15,
    estacoesMonitoramento: 30,
    comiteBacia: "CBH Guandu",
    dadosGrafico: [
      { rotulo: "2020", valor: 90 },
      { rotulo: "2022", valor: 140 },
      { rotulo: "2024", valor: 220 },
      { rotulo: "2026", valor: 310 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Guandu",
      saude: {
        indicador: "Segurança Hídrica e Controle de Geosmina/Turbidez",
        descricao: "Garantia do abastecimento de 80% da população da Região Metropolitana do Rio de Janeiro.",
        fonte: "CEDAE / Agenersa (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Polo Industrial de Santa Cruz, Pesca Costeira e Agricultura",
        vulnerabilidade: "Pescadores da Baía de Sepetiba impactados por dragagens e resíduos industriais.",
        fonte: "Colônia de Pescadores Z-10 / DPU",
      },
      moradia: {
        situacao: "Bairros da Baixada Fluminense em Áreas de Drenagem",
        familiasRisco: "Comunidades de Nova Iguaçu, Queimados e Japeri sem saneamento pleno.",
        fonte: "Defesa Civil RJ / Instituto Rio Metrópole",
      },
      cultura: {
        manifestacao: "Tradições Fluminenses e Resistência da Baixada",
        ameacaOuPotencia: "Preservação da Floresta Nacional Mário Xavier e restingas históricas.",
        fonte: "ICMBio",
      },
    },
    itensTabela: [
      { municipio: "Nova Iguaçu", atoOuLicenca: "Complexo da Nova ETA Guandu 2", situacao: "Em execução", ano: "2026" },
      { municipio: "Rio de Janeiro", atoOuLicenca: "Contrato de Concessão dos Blocos de Saneamento", situacao: "Vigente", ano: "2025" },
      { municipio: "Seropédica", atoOuLicenca: "Proteção do Aquífero Piranema", situacao: "Ativo", ano: "2025" },
      { municipio: "Queimados", atoOuLicenca: "Coleta em Córregos da Bacia dos Macacos", situacao: "Em andamento", ano: "2024" },
    ],
  },
  "rio-paraiba-do-sul": {
    id: "rio-paraiba-do-sul",
    nome: "Bacia do Rio Paraíba do Sul",
    numeroProtagonista: {
      valor: "1.137 km",
      rotulo: "Extensão da calha que conecta SP, MG e RJ e alimenta a transposição do Guandu",
      fonte: "CEIVAP / ANA",
      dataReferencia: "2026",
    },
    populacaoBacia: "14 milhões de habitantes",
    municipiosBacia: 184,
    estacoesMonitoramento: 75,
    comiteBacia: "CEIVAP",
    dadosGrafico: [
      { rotulo: "2020", valor: 120 },
      { rotulo: "2022", valor: 175 },
      { rotulo: "2024", valor: 250 },
      { rotulo: "2026", valor: 340 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Paraíba do Sul",
      saude: {
        indicador: "Vazão Ecológica e Transposição de Água",
        descricao: "Regulação hídrica tripartite garantindo água para o Vale do Paraíba paulista e a Baixada Fluminense.",
        fonte: "ANA / CEIVAP (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Polo Metalmecânico, Siderurgia (CSN) e Agropecuária",
        vulnerabilidade: "Trabalhadores fabris e pequenos produtores de leite da Zona da Mata de Minas.",
        fonte: "Fiemg / Fiesp",
      },
      moradia: {
        situacao: "Cidades Históricas e Polos Industriais Ribeirinhos",
        familiasRisco: "Cidades serranas vulneráveis a enxurradas e enchentes ribeirinhas (ex: Três Rios, Petrópolis).",
        fonte: "Defesa Civil RJ / MG",
      },
      cultura: {
        manifestacao: "Ciclo Histórico do Café e Patrimônio Ferroviário",
        ameacaOuPotencia: "Cidades do Vale Histórico e memória dos barões do café e quilombos da serra.",
        fonte: "IPHAN",
      },
    },
    itensTabela: [
      { municipio: "Volta Redonda", atoOuLicenca: "Fiscalização Ambiental de Efluentes Siderúrgicos (CSN)", situacao: "Ativo", ano: "2026" },
      { municipio: "São José dos Campos", atoOuLicenca: "Monitoramento Hidrológico no Alto Paraíba", situacao: "Vigente", ano: "2025" },
      { municipio: "Juiz de Fora", atoOuLicenca: "Gestão de Afluentes da Zona da Mata (Rio Paraibuna)", situacao: "Em execução", ano: "2025" },
      { municipio: "Campos dos Goytacazes", atoOuLicenca: "Monitoramento da Foz e Intrusão Salina", situacao: "Ativo", ano: "2024" },
    ],
  },
  "rio-araguari": {
    id: "rio-araguari",
    nome: "Rio Araguari & Bacia do Paranaíba",
    numeroProtagonista: {
      valor: "475 km",
      rotulo: "Extensão da calha que irriga o agronegócio e gera energia no Triângulo Mineiro",
      fonte: "CBH Araguari / IGAM",
      dataReferencia: "2026",
    },
    populacaoBacia: "1,2 milhão de habitantes",
    municipiosBacia: 20,
    estacoesMonitoramento: 18,
    comiteBacia: "CBH Araguari",
    dadosGrafico: [
      { rotulo: "2020", valor: 35 },
      { rotulo: "2022", valor: 55 },
      { rotulo: "2024", valor: 85 },
      { rotulo: "2026", valor: 120 },
    ],
    impactoPovoGente: {
      lugarNome: "Rio Araguari",
      saude: {
        indicador: "Abastecimento do Polo de Uberlândia e Qualidade das Águas",
        descricao: "Captação contínua no sistema Bom Jardim / Sucupira garantindo água tratada para Uberlândia e Araguari.",
        fonte: "DMAE Uberlândia / SAE Araguari (2026)",
      },
      trabalhoERenda: {
        atividadePrincipal: "Polo Agroindustrial, Complexo Hidrelétrico e Produção de Soja/Milho",
        vulnerabilidade: "Pequenos agricultores familiares e pescadores artesanais no entorno dos reservatórios.",
        fonte: "Emater-MG",
      },
      moradia: {
        situacao: "Chácaras de Recreio e Comunidades Ribeirinhas",
        familiasRisco: "Comunidades vizinhas às barragens das UHEs Nova Ponte, Miranda e Capim Branco.",
        fonte: "Defesa Civil Triângulo Mineiro",
      },
      cultura: {
        manifestacao: "Tradições do Triângulo Mineiro e Festas Sertanejas",
        ameacaOuPotencia: "Preservação das corredeiras naturais e cânions do cerrado mineiro.",
        fonte: "Secretarias de Cultura Locais",
      },
    },
    itensTabela: [
      { municipio: "Uberlândia", atoOuLicenca: "Ampliação da Captação Hídrica Sistema Capim Branco", situacao: "Em execução", ano: "2026" },
      { municipio: "Araguari", atoOuLicenca: "Fiscalização de Agrotóxicos em Áreas de Recarga", situacao: "Ativo", ano: "2025" },
      { municipio: "Nova Ponte", atoOuLicenca: "Operação da UHE Nova Ponte (CEMIG)", situacao: "Vigente", ano: "2025" },
      { municipio: "Indianópolis", atoOuLicenca: "Conservação das Matas de Galeria", situacao: "Em andamento", ano: "2024" },
    ],
  },
};

export function obterDadosRio(slug: string): DetalhesRio | null {
  return DADOS_RIOS[slug] ?? null;
}
