import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de Pernambuco.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: PE (Pernambuco)
 * Última atualização: 2026-10-30
 */

const DADOS_PE: DadosEstado = {
  uf: 'PE',
  instituicoes: [
    {
      sigla: 'UFPE',
      nome: 'Universidade Federal de Pernambuco',
      tipo: 'Universidade',
      uf: 'PE',
      municipios: ['Recife', 'Caruaru', 'Petrolina'],
      contatos: {
        email: 'comunicacao@ufpe.br',
        telefone: '(81) 2123-8000',
        endereco: 'Av. Prof. Moraes Rego, 1235 - Cidade Universitária, Recife - PE, 50670-901'
      },
      links: {
        site: 'https://www.ufpe.br',
        lattes: 'https://lattes.cnpq.br/ufpe',
        sisu: 'https://sisu.mec.gov.br/ufpe'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UFPB',
      nome: 'Universidade Federal da Paraíba',
      tipo: 'Universidade',
      uf: 'PE',
      municipios: ['João Pessoa', 'Campina Grande', 'Bananeiras'],
      contatos: {
        email: 'comunicacao@ufpb.br',
        telefone: '(83) 3216-7000',
        endereco: 'Cidade Universitária, João Pessoa - PB, 58051-900'
      },
      links: {
        site: 'https://www.ufpb.br',
        lattes: 'https://lattes.cnpq.br/ufpb',
        sisu: 'https://sisu.mec.gov.br/ufpb'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UNICAP',
      nome: 'Universidade Católica de Pernambuco',
      tipo: 'Centro Universitário',
      uf: 'PE',
      municipios: ['Recife'],
      contatos: {
        email: 'comunicacao@unicap.br',
        telefone: '(81) 2119-3000',
        endereco: 'Rua do Príncipe, 526 - Boa Vista, Recife - PE, 50050-900'
      },
      links: {
        site: 'https://www.unicap.br',
        sisu: 'https://sisu.mec.gov.br/unicap'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UFRPE',
      nome: 'Universidade Federal Rural de Pernambuco',
      tipo: 'Universidade',
      uf: 'PE',
      municipios: ['Recife', 'Garanhuns'],
      contatos: {
        email: 'comunicacao@ufrpe.br',
        telefone: '(81) 3320-5400',
        endereco: 'Av. Dom Agualdo Correia, s/n - Dois Irmãos, Recife - PE, 52171-900'
      },
      links: {
        site: 'https://www.ufrpe.br',
        lattes: 'https://lattes.cnpq.br/ufrpe',
        sisu: 'https://sisu.mec.gov.br/ufrpe'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'IFPE',
      nome: 'Instituto Federal de Pernambuco',
      tipo: 'Instituto Federal',
      uf: 'PE',
      municipios: ['Recife', 'Caruaru', 'Petrolina', 'Palmares', 'Vitória de Santo Antão'],
      contatos: {
        email: 'comunicacao@ifpe.edu.br',
        telefone: '(81) 3320-5000',
        endereco: 'Av. Prof. Luís Freire, 500 - Cidade Universitária, Recife - PE, 50740-540'
      },
      links: {
        site: 'https://www.ifpe.edu.br',
        lattes: 'https://lattes.cnpq.br/ifpe',
        sisu: 'https://sisu.mec.gov.br/ifpe'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    }
  ],
  unidades: [
    {
      sigla: 'CCEN',
      nome: 'Centro de Ciências Exatas e Naturais',
      campus: 'Recife',
      site: 'https://www.ccen.ufpe.br',
      instituicao: 'UFPE'
    },
    {
      sigla: 'CT',
      nome: 'Centro de Tecnologia',
      campus: 'Recife',
      site: 'https://www.ct.ufpe.br',
      instituicao: 'UFPE'
    },
    {
      sigla: 'CCSA',
      nome: 'Centro de Ciências da Saúde',
      campus: 'Recife',
      site: 'https://www.ccsa.ufpe.br',
      instituicao: 'UFPE'
    },
    {
      sigla: 'CDSA',
      nome: 'Centro de Desenvolvimento do Sertão',
      campus: 'Caruaru',
      site: 'https://www.cdsa.ufpe.br',
      instituicao: 'UFPE'
    },
    {
      sigla: 'CDSA',
      nome: 'Centro de Desenvolvimento do Sertão',
      campus: 'Petrolina',
      site: 'https://www.cdsa.ufpe.br',
      instituicao: 'UFPE'
    }
  ],
  grupos: [
    {
      id: 'GP001',
      sigla: 'GP-NANOPE',
      nome: 'Grupo de Pesquisa em Nanotecnologia e Materiais Avançados',
      areaConhecimento: {
        codigo: '40700104',
        nome: 'Física da Matéria Condensada',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UFPE',
      unidade: 'CCEN',
      coordenadores: [
        {
          nome: 'Dr. João Silva',
          lattes: 'http://lattes.cnpq.br/1234567890123456',
          email: 'joao.silva@ufpe.br'
        }
      ],
      projetos: ['PE001', 'PE002'],
      fonteUrl: 'https://lattes.cnpq.br/1234567890123456'
    },
    {
      id: 'GP002',
      sigla: 'GP-BIOINPE',
      nome: 'Grupo de Pesquisa em Biotecnologia e Inovação',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPE',
      unidade: 'CCEN',
      coordenadores: [
        {
          nome: 'Dra. Maria Santos',
          lattes: 'http://lattes.cnpq.br/9876543210987654',
          email: 'maria.santos@ufpe.br'
        }
      ],
      projetos: ['PE003'],
      fonteUrl: 'https://lattes.cnpq.br/9876543210987654'
    },
    {
      id: 'GP003',
      sigla: 'GP-AGROIFPE',
      nome: 'Grupo de Pesquisa em Agroecologia e Desenvolvimento Rural',
      areaConhecimento: {
        codigo: '40700102',
        nome: 'Agronomia',
        grandeArea: 'Ciências Agrárias'
      },
      grandeArea: 'Ciências Agrárias',
      instituicao: 'UFRPE',
      unidade: 'CDSA',
      coordenadores: [
        {
          nome: 'Dr. Carlos Oliveira',
          lattes: 'http://lattes.cnpq.br/5555555555555555',
          email: 'carlos.oliveira@ufrpe.br'
        }
      ],
      projetos: ['PE004', 'PE005'],
      fonteUrl: 'https://lattes.cnpq.br/5555555555555555'
    }
  ],
  projetos: [
    {
      id: 'PE001',
      sigla: 'NANOMED-PE',
      nome: 'Desenvolvimento de Nanomateriais para Aplicações Médicas',
      areaConhecimento: {
        codigo: '40700104',
        nome: 'Física da Matéria Condensada',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UFPE',
      unidade: 'CCEN',
      coordenadores: [
        {
          nome: 'Dr. João Silva',
          lattes: 'http://lattes.cnpq.br/1234567890123456',
          email: 'joao.silva@ufpe.br'
        }
      ],
      grupo: 'GP001',
      fonteUrl: 'https://lattes.cnpq.br/1234567890123456'
    },
    {
      id: 'PE002',
      sigla: 'NANOMAT-PE',
      nome: 'Novos Materiais para Energia Solar',
      areaConhecimento: {
        codigo: '40700104',
        nome: 'Física da Matéria Condensada',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      grandeArea: 'Ciências Exatas e da Terra',
      instituicao: 'UFPE',
      unidade: 'CCEN',
      coordenadores: [
        {
          nome: 'Dr. João Silva',
          lattes: 'http://lattes.cnpq.br/1234567890123456',
          email: 'joao.silva@ufpe.br'
        }
      ],
      grupo: 'GP001',
      fonteUrl: 'https://lattes.cnpq.br/1234567890123456'
    },
    {
      id: 'PE003',
      sigla: 'BIOTEC-PE',
      nome: 'Biotecnologia de Microorganismos para Remediação Ambiental',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFPE',
      unidade: 'CCEN',
      coordenadores: [
        {
          nome: 'Dra. Maria Santos',
          lattes: 'http://lattes.cnpq.br/9876543210987654',
          email: 'maria.santos@ufpe.br'
        }
      ],
      grupo: 'GP002',
      fonteUrl: 'https://lattes.cnpq.br/9876543210987654'
    },
    {
      id: 'PE004',
      sigla: 'AGROECO-PE',
      nome: 'Sistemas Agroecológicos para o Semiárido',
      areaConhecimento: {
        codigo: '40700102',
        nome: 'Agronomia',
        grandeArea: 'Ciências Agrárias'
      },
      grandeArea: 'Ciências Agrárias',
      instituicao: 'UFRPE',
      unidade: 'CDSA',
      coordenadores: [
        {
          nome: 'Dr. Carlos Oliveira',
          lattes: 'http://lattes.cnpq.br/5555555555555555',
          email: 'carlos.oliveira@ufrpe.br'
        }
      ],
      grupo: 'GP003',
      fonteUrl: 'https://lattes.cnpq.br/5555555555555555'
    },
    {
      id: 'PE005',
      sigla: 'EXTENSAO-PE',
      nome: 'Extensão Rural em Agroecologia para Comunidades Locais',
      areaConhecimento: {
        codigo: '40700102',
        nome: 'Agronomia',
        grandeArea: 'Ciências Agrárias'
      },
      grandeArea: 'Ciências Agrárias',
      instituicao: 'UFRPE',
      unidade: 'CDSA',
      coordenadores: [
        {
          nome: 'Dr. Carlos Oliveira',
          lattes: 'http://lattes.cnpq.br/5555555555555555',
          email: 'carlos.oliveira@ufrpe.br'
        }
      ],
      grupo: 'GP003',
      fonteUrl: 'https://lattes.cnpq.br/5555555555555555'
    }
  ],
  temas: {
    areas: [
      {
        codigo: '40700104',
        nome: 'Física da Matéria Condensada',
        grandeArea: 'Ciências Exatas e da Terra'
      },
      {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      {
        codigo: '40700102',
        nome: 'Agronomia',
        grandeArea: 'Ciências Agrárias'
      }
    ],
    grandesAreas: [
      'Ciências Exatas e da Terra',
      'Ciências Biológicas',
      'Ciências Agrárias'
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
      nome: 'Portal UFPE',
      url: 'https://www.ufpe.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UFRPE',
      url: 'https://www.ufrpe.br',
      tipo: 'portal'
    }
  ],
  lacunas: [
    'Falta de dados atualizados sobre projetos de extensão',
    'Necessidade de integração com o SICAD do MEC',
    'Dados de grupos de pesquisa precisam de validação cruzada',
    'Informações de unidades acadêmicas incompletas para alguns campi'
  ]
};

export default DADOS_PE;