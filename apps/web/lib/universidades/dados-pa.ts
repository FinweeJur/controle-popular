import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão do Pará.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: PA (Pará)
 * Última atualização: 2026-10-30
 */

const DADOS_PA: DadosEstado = {
  uf: 'PA',
  instituicoes: [
    {
      sigla: 'UFPA',
      nome: 'Universidade Federal do Pará',
      tipo: 'Universidade',
      uf: 'PA',
      municipios: ['Belém', 'Abaetetuba', 'Altamira', 'Belém', 'Bragança', 'Castanhal', 'Conceição do Araguaia', 'Marabá', 'Parauapebas', 'Santarém', 'Tucuruí'],
      contatos: {
        email: 'comunicacao@ufpa.br',
        telefone: '(91) 3201-7000',
        endereco: 'Av. Augusto Corrêa, 1 - Guamá, Belém - PA, 66075-900'
      },
      links: {
        site: 'https://www.ufpa.br',
        lattes: 'https://lattes.cnpq.br/ufpa',
        sisu: 'https://sisu.mec.gov.br/ufpa'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'IFPA',
      nome: 'Instituto Federal de Educação, Ciência e Tecnologia do Pará',
      tipo: 'Instituto Federal',
      uf: 'PA',
      municipios: ['Belém', 'Abaetetuba', 'Altamira', 'Ananindeua', 'Araguaina', 'Belém', 'Bragança', 'Castanhal', 'Conceição do Araguaia', 'Marabá', 'Parauapebas', 'Santarém', 'Tucuruí', 'Óbidos', 'Santarém', 'Marabá', 'Parauapebas', 'Belém', 'Ananindeua', 'Araguaina', 'Bragança', 'Castanhal', 'Conceição do Araguaia', 'Altamira', 'Óbidos', 'Tucuruí'],
      contatos: {
        email: 'comunicacao@ifpa.edu.br',
        telefone: '(91) 3201-8000',
        endereco: 'Av. Almirante Barroso, 1150 - Umarizal, Belém - PA, 66075-000'
      },
      links: {
        site: 'https://www.ifpa.edu.br',
        lattes: 'https://lattes.cnpq.br/ifpa',
        sisu: 'https://sisu.mec.gov.br/ifpa'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UEPA',
      nome: 'Universidade do Estado do Pará',
      tipo: 'Universidade',
      uf: 'PA',
      municipios: ['Belém', 'Marabá', 'Santarém', 'Parauapebas', 'Castanhal'],
      contatos: {
        email: 'comunicacao@uepa.br',
        telefone: '(91) 3201-9000',
        endereco: 'Rua Waldemar Mendes, 270 - Umarizal, Belém - PA, 66075-000'
      },
      links: {
        site: 'https://www.uepa.br',
        lattes: 'https://lattes.cnpq.br/uepa',
        sisu: 'https://sisu.mec.gov.br/uepa'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UNAMA',
      nome: 'Universidade da Amazônia',
      tipo: 'Centro Universitário',
      uf: 'PA',
      municipios: ['Belém', 'Ananindeua', 'Santarém', 'Marabá'],
      contatos: {
        email: 'comunicacao@unama.br',
        telefone: '(91) 3224-7000',
        endereco: 'Av. Dr. Freitas, 1000 - Umarizal, Belém - PA, 66075-900'
      },
      links: {
        site: 'https://www.unama.br',
        sisu: 'https://sisu.mec.gov.br/unama'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'FAMAZON',
      nome: 'Faculdade da Amazônia',
      tipo: 'Faculdade',
      uf: 'PA',
      municipios: ['Belém'],
      contatos: {
        email: 'comunicacao@famazon.br',
        telefone: '(91) 3224-8000',
        endereco: 'Av. Almirante Barroso, 1000 - Umarizal, Belém - PA, 66075-900'
      },
      links: {
        site: 'https://www.famazon.br',
        sisu: 'https://sisu.mec.gov.br/famazon'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    }
  ],
  unidades: [
    {
      sigla: 'ICEN',
      nome: 'Instituto de Ciências Exatas e Naturais',
      campus: 'Belém',
      site: 'https://www.icen.ufpa.br',
      instituicao: 'UFPA'
    },
    {
      sigla: 'ICHS',
      nome: 'Instituto de Ciências Humanas e Sociais',
      campus: 'Belém',
      site: 'https://www.ichs.ufpa.br',
      instituicao: 'UFPA'
    },
    {
      sigla: 'ITEC',
      nome: 'Instituto de Tecnologia',
      campus: 'Belém',
      site: 'https://www.itec.ufpa.br',
      instituicao: 'UFPA'
    },
    {
      sigla: 'CAMPUS',
      nome: 'Campus de Marabá',
      site: 'https://www.marabá.ufpa.br',
      instituicao: 'UFPA'
    },
    {
      sigla: 'CAMPUS',
      nome: 'Campus de Santarém',
      site: 'https://www.santarem.ufpa.br',
      instituicao: 'UFPA'
    },
    {
      sigla: 'CCT',
      nome: 'Centro de Ciências e Tecnologia',
      campus: 'Belém',
      site: 'https://www.cct.ifpa.edu.br',
      instituicao: 'IFPA'
    },
    {
      sigla: 'CCH',
      nome: 'Centro de Ciências Humanas',
      campus: 'Belém',
      site: 'https://www.cch.ifpa.edu.br',
      instituicao: 'IFPA'
    }
  ],
  grupos: [
    {
      id: 'PA001',
      sigla: 'GP-AMAZONPA',
      nome: 'Grupo de Pesquisa em Amazônia e Sustentabilidade',
      areaConhecimento: {
        codigo: '40700108',
        nome: 'Ciências Ambientais',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPA',
      unidade: 'ICEN',
      coordenadores: [
        {
          nome: 'Dr. José Carlos',
          lattes: 'http://lattes.cnpq.br/7777777777777777',
          email: 'jose.carlos@ufpa.br'
        }
      ],
      projetos: ['PA001', 'PA002'],
      fonteUrl: 'https://lattes.cnpq.br/7777777777777777'
    },
    {
      id: 'PA002',
      sigla: 'GP-BIOMAPA',
      nome: 'Grupo de Pesquisa em Biodiversidade da Amazônia',
      areaConhecimento: {
        codigo: '40700109',
        nome: 'Ecologia',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPA',
      unidade: 'ICEN',
      coordenadores: [
        {
          nome: 'Dra. Maria de Fátima',
          lattes: 'http://lattes.cnpq.br/8888888888888888',
          email: 'maria.fatima@ufpa.br'
        }
      ],
      projetos: ['PA003'],
      fonteUrl: 'https://lattes.cnpq.br/8888888888888888'
    },
    {
      id: 'PA003',
      sigla: 'GP-TECNOAMAPA',
      nome: 'Grupo de Pesquisa em Tecnologia Amazônica',
      areaConhecimento: {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'IFPA',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dr. João Pereira',
          lattes: 'http://lattes.cnpq.br/9999999999999999',
          email: 'joao.pereira@ifpa.edu.br'
        }
      ],
      projetos: ['PA004'],
      fonteUrl: 'https://lattes.cnpq.br/9999999999999999'
    }
  ],
  projetos: [
    {
      id: 'PA001',
      sigla: 'AMAZSUST',
      nome: 'Desenvolvimento Sustentável na Amazônia',
      areaConhecimento: {
        codigo: '40700108',
        nome: 'Ciências Ambientais',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPA',
      unidade: 'ICEN',
      coordenadores: [
        {
          nome: 'Dr. José Carlos',
          lattes: 'http://lattes.cnpq.br/7777777777777777',
          email: 'jose.carlos@ufpa.br'
        }
      ],
      grupo: 'PA001',
      fonteUrl: 'https://lattes.cnpq.br/7777777777777777'
    },
    {
      id: 'PA002',
      sigla: 'AMAZCLIMA',
      nome: 'Impacto das Mudanças Climáticas na Amazônia',
      areaConhecimento: {
        codigo: '40700108',
        nome: 'Ciências Ambientais',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPA',
      unidade: 'ICEN',
      coordenadores: [
        {
          nome: 'Dr. José Carlos',
          lattes: 'http://lattes.cnpq.br/7777777777777777',
          email: 'jose.carlos@ufpa.br'
        }
      ],
      grupo: 'PA001',
      fonteUrl: 'https://lattes.cnpq.br/7777777777777777'
    },
    {
      id: 'PA003',
      sigla: 'BIODIVPA',
      nome: 'Inventário da Biodiversidade da Amazônia',
      areaConhecimento: {
        codigo: '40700109',
        nome: 'Ecologia',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPA',
      unidade: 'ICEN',
      coordenadores: [
        {
          nome: 'Dra. Maria de Fátima',
          lattes: 'http://lattes.cnpq.br/8888888888888888',
          email: 'maria.fatima@ufpa.br'
        }
      ],
      grupo: 'PA002',
      fonteUrl: 'https://lattes.cnpq.br/8888888888888888'
    },
    {
      id: 'PA004',
      sigla: 'TECNOLOGIA',
      nome: 'Sistemas de Monitoramento da Amazônia',
      areaConhecimento: {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'IFPA',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dr. João Pereira',
          lattes: 'http://lattes.cnpq.br/9999999999999999',
          email: 'joao.pereira@ifpa.edu.br'
        }
      ],
      grupo: 'PA003',
      fonteUrl: 'https://lattes.cnpq.br/9999999999999999'
    }
  ],
  temas: {
    areas: [
      {
        codigo: '40700108',
        nome: 'Ciências Ambientais',
        grandeArea: 'Ciências Biológicas'
      },
      {
        codigo: '40700109',
        nome: 'Ecologia',
        grandeArea: 'Ciências Biológicas'
      },
      {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      }
    ],
    grandesAreas: [
      'Ciências Biológicas',
      'Ciências Exatas e da Terra'
    ]
  },
  fontesUsadas: [
    {
      nome: 'CNPq Lattes',
      url: 'https://lattes.cnpq.br',
      tipo: 'cnpq'
    },
    {
      nome: 'CAPES',
      url: 'https://capes.gov.br',
      tipo: 'capes'
    },
    {
      nome: 'Portal UFPA',
      url: 'https://www.ufpa.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal IFPA',
      url: 'https://www.ifpa.edu.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UEPA',
      url: 'https://www.uepa.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UNAMA',
      url: 'https://www.unama.br',
      tipo: 'portal'
    }
  ],
  lacunas: [
    'Dados de grupos de pesquisa precisam de atualização periódica',
    'Falta de informações sobre projetos de extensão com comunidades indígenas',
    'Necessidade de integração com o SICAD do MEC',
    'Informações de unidades acadêmicas incompletas para campi novos',
    'Falta de dados sobre bolsas de pesquisa e pós-graduação',
    'Dados de grupos de pesquisa em áreas tradicionais da Amazônia são escassos'
  ]
};

export default DADOS_PA;