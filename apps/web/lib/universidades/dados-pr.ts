import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão do Paraná.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: PR (Paraná)
 * Última atualização: 2026-10-30
 */

const DADOS_PR: DadosEstado = {
  uf: 'PR',
  instituicoes: [
    {
      sigla: 'UFPR',
      nome: 'Universidade Federal do Paraná',
      tipo: 'Universidade',
      uf: 'PR',
      municipios: ['Curitiba', 'Matinhos', 'Palmas', 'Santa Maria do Oeste', 'Cruzeiro do Oeste'],
      contatos: {
        email: 'comunicacao@ufpr.br',
        telefone: '(41) 3360-4300',
        endereco: 'Rua General Carneiro, 460 - Centro, Curitiba - PR, 80210-150'
      },
      links: {
        site: 'https://www.ufpr.br',
        lattes: 'https://lattes.cnpq.br/ufpr',
        sisu: 'https://sisu.mec.gov.br/ufpr'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UTFPR',
      nome: 'Universidade Tecnológica Federal do Paraná',
      tipo: 'Universidade',
      uf: 'PR',
      municipios: ['Curitiba', 'Apucarana', 'Campo Mourão', 'Cornélio Procópio', 'Cascavel', 'Pato Branco', 'Medianeira', 'Santa Helena', 'Toledo', 'Londrina', 'Francisco Beltrão', 'Curitiba', 'Dois Vizinhos', 'Foz do Iguaçu', 'Guarapuava', 'Jacarezinho', 'Londrina', 'Maringá', 'Ponta Grossa', 'Santa Maria do Oeste', 'São José dos Pinhais', 'Toledo'],
      contatos: {
        email: 'comunicacao@utfpr.edu.br',
        telefone: '(41) 3310-3000',
        endereco: 'Rua Dep. Heitor Alencar Furtado, 5000 - Água Verde, Curitiba - PR, 80210-901'
      },
      links: {
        site: 'https://www.utfpr.edu.br',
        lattes: 'https://lattes.cnpq.br/utfpr',
        sisu: 'https://sisu.mec.gov.br/utfpr'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UFPR',
      nome: 'Universidade Federal do Paraná',
      tipo: 'Universidade',
      uf: 'PR',
      municipios: ['Curitiba', 'Matinhos', 'Palmas', 'Santa Maria do Oeste', 'Cruzeiro do Oeste'],
      contatos: {
        email: 'comunicacao@ufpr.br',
        telefone: '(41) 3360-4300',
        endereco: 'Rua General Carneiro, 460 - Centro, Curitiba - PR, 80210-150'
      },
      links: {
        site: 'https://www.ufpr.br',
        lattes: 'https://lattes.cnpq.br/ufpr',
        sisu: 'https://sisu.mec.gov.br/ufpr'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UNICURITIBA',
      nome: 'Universidade Cidade de Curitiba',
      tipo: 'Centro Universitário',
      uf: 'PR',
      municipios: ['Curitiba'],
      contatos: {
        email: 'comunicacao@unicuritiba.edu.br',
        telefone: '(41) 3352-5000',
        endereco: 'Rua Padre Anchieta, 2770 - Água Verde, Curitiba - PR, 80250-901'
      },
      links: {
        site: 'https://www.unicuritiba.edu.br',
        sisu: 'https://sisu.mec.gov.br/unicuritiba'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'PUCPR',
      nome: 'Pontifícia Universidade Católica do Paraná',
      tipo: 'Centro Universitário',
      uf: 'PR',
      municipios: ['Curitiba', 'Londrina', 'Maringá', 'São José dos Pinhais'],
      contatos: {
        email: 'comunicacao@pucpr.br',
        telefone: '(41) 3271-1600',
        endereco: 'Rua Imaculada Conceição, 1155 - Prado Velho, Curitiba - PR, 80215-901'
      },
      links: {
        site: 'https://www.pucpr.br',
        sisu: 'https://sisu.mec.gov.br/pucpr'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    }
  ],
  unidades: [
    {
      sigla: 'CTC',
      nome: 'Centro Técnico Científico',
      campus: 'Curitiba',
      site: 'https://www.ctc.ufpr.br',
      instituicao: 'UFPR'
    },
    {
      sigla: 'CCET',
      nome: 'Centro de Ciências Exatas e Tecnológicas',
      campus: 'Curitiba',
      site: 'https://www.ccet.ufpr.br',
      instituicao: 'UFPR'
    },
    {
      sigla: 'CIC',
      nome: 'Centro de Informática',
      campus: 'Curitiba',
      site: 'https://www.cic.ufpr.br',
      instituicao: 'UTFPR'
    },
    {
      sigla: 'CCT',
      nome: 'Centro de Ciências Tecnológicas',
      campus: 'Curitiba',
      site: 'https://www.cct.utfpr.edu.br',
      instituicao: 'UTFPR'
    },
    {
      sigla: 'CEB',
      nome: 'Centro de Educação e Belas Artes',
      campus: 'Curitiba',
      site: 'https://www.ceb.utfpr.edu.br',
      instituicao: 'UTFPR'
    }
  ],
  grupos: [
    {
      id: 'PR001',
      sigla: 'GP-BIOTECPR',
      nome: 'Grupo de Pesquisa em Biotecnologia e Engenharia Genética',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPR',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Ricardo Alves',
          lattes: 'http://lattes.cnpq.br/1111111111111111',
          email: 'ricardo.alves@ufpr.br'
        }
      ],
      projetos: ['PR001', 'PR002'],
      fonteUrl: 'https://lattes.cnpq.br/1111111111111111'
    },
    {
      id: 'PR002',
      sigla: 'GP-TECINFOPR',
      nome: 'Grupo de Pesquisa em Tecnologias da Informação e Comunicação',
      areaConhecimento: {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UTFPR',
      unidade: 'CIC',
      coordenadores: [
        {
          nome: 'Dra. Paula Mendes',
          lattes: 'http://lattes.cnpq.br/2222222222222222',
          email: 'paula.mendes@utfpr.edu.br'
        }
      ],
      projetos: ['PR003', 'PR004'],
      fonteUrl: 'https://lattes.cnpq.br/2222222222222222'
    },
    {
      id: 'PR003',
      sigla: 'GP-ENERGPR',
      nome: 'Grupo de Pesquisa em Energias Renováveis e Eficiência Energética',
      areaConhecimento: {
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      },
      grandeArea: 'Engenharias',
      instituicao: 'UTFPR',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dr. Carlos Eduardo',
          lattes: 'http://lattes.cnpq.br/3333333333333333',
          email: 'carlos.eduardo@utfpr.edu.br'
        }
      ],
      projetos: ['PR005'],
      fonteUrl: 'https://lattes.cnpq.br/3333333333333333'
    }
  ],
  projetos: [
    {
      id: 'PR001',
      sigla: 'BIOGEN-PR',
      nome: 'Biotecnologia para Remediação de Áreas Contaminadas',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPR',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Ricardo Alves',
          lattes: 'http://lattes.cnpq.br/1111111111111111',
          email: 'ricardo.alves@ufpr.br'
        }
      ],
      grupo: 'PR001',
      fonteUrl: 'https://lattes.cnpq.br/1111111111111111'
    },
    {
      id: 'PR002',
      sigla: 'BIOMED-PR',
      nome: 'Desenvolvimento de Biomateriais para Aplicações Médicas',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPR',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Ricardo Alves',
          lattes: 'http://lattes.cnpq.br/1111111111111111',
          email: 'ricardo.alves@ufpr.br'
        }
      ],
      grupo: 'PR001',
      fonteUrl: 'https://lattes.cnpq.br/1111111111111111'
    },
    {
      id: 'PR003',
      sigla: 'IA-PR',
      nome: 'Inteligência Artificial Aplicada à Saúde Digital',
      areaConhecimento: {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UTFPR',
      unidade: 'CIC',
      coordenadores: [
        {
          nome: 'Dra. Paula Mendes',
          lattes: 'http://lattes.cnpq.br/2222222222222222',
          email: 'paula.mendes@utfpr.edu.br'
        }
      ],
      grupo: 'PR002',
      fonteUrl: 'https://lattes.cnpq.br/2222222222222222'
    },
    {
      id: 'PR004',
      sigla: 'BLOCKPR',
      nome: 'Blockchain para Sistemas de Gestão Pública',
      areaConhecimento: {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UTFPR',
      unidade: 'CIC',
      coordenadores: [
        {
          nome: 'Dra. Paula Mendes',
          lattes: 'http://lattes.cnpq.br/2222222222222222',
          email: 'paula.mendes@utfpr.edu.br'
        }
      ],
      grupo: 'PR002',
      fonteUrl: 'https://lattes.cnpq.br/2222222222222222'
    },
    {
      id: 'PR005',
      sigla: 'SOLARPR',
      nome: 'Sistemas Fotovoltaicos para Comunidades Isoladas',
      areaConhecimento: {
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      },
      grandeArea: 'Engenharias',
      instituicao: 'UTFPR',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dr. Carlos Eduardo',
          lattes: 'http://lattes.cnpq.br/3333333333333333',
          email: 'carlos.eduardo@utfpr.edu.br'
        }
      ],
      grupo: 'PR003',
      fonteUrl: 'https://lattes.cnpq.br/3333333333333333'
    }
  ],
  temas: {
    areas: [
      {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      {
        codigo: '40700105',
        nome: 'Ciência da Computação',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      {
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      }
    ],
    grandesAreas: [
      'Ciências Biológicas',
      'Ciências Exatas e da Terra',
      'Engenharias'
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
      nome: 'Portal UFPR',
      url: 'https://www.ufpr.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UTFPR',
      url: 'https://www.utfpr.edu.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal PUCPR',
      url: 'https://www.pucpr.br',
      tipo: 'portal'
    }
  ],
  lacunas: [
    'Dados de grupos de pesquisa precisam de atualização periódica',
    'Falta de informações sobre projetos de extensão com comunidades indígenas',
    'Necessidade de integração com o SICAD do MEC',
    'Informações de unidades acadêmicas incompletas para campi novos'
  ]
};

export default DADOS_PR;