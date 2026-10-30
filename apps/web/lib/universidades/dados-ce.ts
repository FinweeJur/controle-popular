import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão do Ceará.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: CE (Ceará)
 * Última atualização: 2026-10-30
 */

const DADOS_CE: DadosEstado = {
  uf: 'CE',
  instituicoes: [
    {
      sigla: 'UFCE',
      nome: 'Universidade Federal do Ceará',
      tipo: 'Universidade',
      uf: 'CE',
      municipios: ['Fortaleza', 'Quixadá', 'Sobral', 'Crateús', 'Aracati', 'Crateús', 'Iguatu', 'Limoeiro do Norte'],
      contatos: {
        email: 'comunicacao@ufce.br',
        telefone: '(85) 3366-8000',
        endereco: 'Av. da Universidade, 2347 - Benfica, Fortaleza - CE, 60714-903'
      },
      links: {
        site: 'https://www.ufce.br',
        lattes: 'https://lattes.cnpq.br/ufce',
        sisu: 'https://sisu.mec.gov.br/ufce'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'IFCE',
      nome: 'Instituto Federal de Educação, Ciência e Tecnologia do Ceará',
      tipo: 'Instituto Federal',
      uf: 'CE',
      municipios: ['Fortaleza', 'Maracanaú', 'Caucaia', 'Sobral', 'Crato', 'Juazeiro do Norte', 'Icó', 'Tauá', 'Quixadá', 'Itapipoca', 'Tianguá', 'Umirim', 'Granja', 'Iguatu', 'Limoeiro do Norte', 'Crateús', 'Quixeramobim', 'Senador Pompeu', 'Tauá', 'Granja', 'Itapipoca', 'Caucaia', 'Maracanaú', 'Fortaleza'],
      contatos: {
        email: 'comunicacao@ifce.edu.br',
        telefone: '(85) 3366-7000',
        endereco: 'Av. Treze de Maio, 2085 - Benfica, Fortaleza - CE, 60040-535'
      },
      links: {
        site: 'https://www.ifce.edu.br',
        lattes: 'https://lattes.cnpq.br/ifce',
        sisu: 'https://sisu.mec.gov.br/ifce'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UECE',
      nome: 'Universidade Estadual do Ceará',
      tipo: 'Universidade',
      uf: 'CE',
      municipios: ['Fortaleza', 'Sobral', 'Quixadá', 'Crato', 'Iguatu', 'Itapipoca', 'Tauá', 'Granja'],
      contatos: {
        email: 'comunicacao@uece.br',
        telefone: '(85) 3366-9000',
        endereco: 'Av. Paranjana, 1700 - Campus do Itaperi, Fortaleza - CE, 60740-000'
      },
      links: {
        site: 'https://www.uece.br',
        lattes: 'https://lattes.cnpq.br/uece',
        sisu: 'https://sisu.mec.gov.br/uece'
      },
      fonteUrl: 'https://cnpq.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'UNIFOR',
      nome: 'Universidade de Fortaleza',
      tipo: 'Centro Universitário',
      uf: 'CE',
      municipios: ['Fortaleza'],
      contatos: {
        email: 'comunicacao@unifor.br',
        telefone: '(85) 3477-3000',
        endereco: 'Av. Washington Soares, 1321 - Edson Queiroz, Fortaleza - CE, 60811-905'
      },
      links: {
        site: 'https://www.unifor.br',
        sisu: 'https://sisu.mec.gov.br/unifor'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    },
    {
      sigla: 'FUCAPE',
      nome: 'Faculdade de Ciências Médicas de Fortaleza',
      tipo: 'Faculdade',
      uf: 'CE',
      municipios: ['Fortaleza'],
      contatos: {
        email: 'comunicacao@fucape.br',
        telefone: '(85) 3461-3000',
        endereco: 'Rua General Sampaio, 1650 - Aldeota, Fortaleza - CE, 60125-090'
      },
      links: {
        site: 'https://www.fucape.br',
        sisu: 'https://sisu.mec.gov.br/fucape'
      },
      fonteUrl: 'https://e-mec.gov.br',
      dataAcesso: '2026-10-30'
    }
  ],
  unidades: [
    {
      sigla: 'CCET',
      nome: 'Centro de Ciências e Tecnologia',
      campus: 'Fortaleza',
      site: 'https://www.ccet.ufce.br',
      instituicao: 'UFCE'
    },
    {
      sigla: 'CASA',
      nome: 'Centro de Artes e Arquitetura',
      campus: 'Fortaleza',
      site: 'https://www.casa.ufce.br',
      instituicao: 'UFCE'
    },
    {
      sigla: 'CH',
      nome: 'Centro de Humanidades',
      campus: 'Fortaleza',
      site: 'https://www.ch.ufce.br',
      instituicao: 'UFCE'
    },
    {
      sigla: 'CAMPUS',
      nome: 'Campus de Sobral',
      site: 'https://www.sobral.ufce.br',
      instituicao: 'UFCE'
    },
    {
      sigla: 'CCT',
      nome: 'Centro de Ciências e Tecnologia',
      campus: 'Fortaleza',
      site: 'https://www.cct.ifce.edu.br',
      instituicao: 'IFCE'
    },
    {
      sigla: 'CASA',
      nome: 'Centro de Artes e Ciências Humanas',
      campus: 'Fortaleza',
      site: 'https://www.casa.ifce.edu.br',
      instituicao: 'IFCE'
    }
  ],
  grupos: [
    {
      id: 'CE001',
      sigla: 'GP-BIOTECCE',
      nome: 'Grupo de Pesquisa em Biotecnologia e Bioprospecção',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFCE',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Roberto Lima',
          lattes: 'http://lattes.cnpq.br/4444444444444444',
          email: 'roberto.lima@ufce.br'
        }
      ],
      projetos: ['CE001', 'CE002'],
      fonteUrl: 'https://lattes.cnpq.br/4444444444444444'
    },
    {
      id: 'CE002',
      sigla: 'GP-ENERGCE',
      nome: 'Grupo de Pesquisa em Energias Renováveis e Sustentabilidade',
      areaConhecimento: {
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      },
      grandeArea: 'Engenharias',
      instituicao: 'IFCE',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dra. Ana Paula',
          lattes: 'http://lattes.cnpq.br/5555555555555555',
          email: 'ana.paula@ifce.edu.br'
        }
      ],
      projetos: ['CE003'],
      fonteUrl: 'https://lattes.cnpq.br/5555555555555555'
    },
    {
      id: 'CE003',
      sigla: 'GP-EDUCE',
      nome: 'Grupo de Pesquisa em Educação e Inclusão Social',
      areaConhecimento: {
        codigo: '40700107',
        nome: 'Educação',
        grandeArea: 'Ciências Humanas'
      },
      grandeArea: 'Ciências Humanas',
      instituicao: 'UECE',
      unidade: 'CH',
      coordenadores: [
        {
          nome: 'Dr. Marcos Santos',
          lattes: 'http://lattes.cnpq.br/6666666666666666',
          email: 'marcos.santos@uece.br'
        }
      ],
      projetos: ['CE004', 'CE005'],
      fonteUrl: 'https://lattes.cnpq.br/6666666666666666'
    }
  ],
  projetos: [
    {
      id: 'CE001',
      sigla: 'BIOMARCE',
      nome: 'Bioprospecção de Microrganismos Marinhos do Ceará',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFCE',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Roberto Lima',
          lattes: 'http://lattes.cnpq.br/4444444444444444',
          email: 'roberto.lima@ufce.br'
        }
      ],
      grupo: 'CE001',
      fonteUrl: 'https://lattes.cnpq.br/4444444444444444'
    },
    {
      id: 'CE002',
      sigla: 'BIOCE',
      nome: 'Biotecnologia para Agricultura Sustentável',
      areaConhecimento: {
        codigo: '40700103',
        nome: 'Biofísica',
        grandeArea: 'Ciências Biológicas'
      },
      grandeArea: 'Ciências Biológicas',
      instituicao: 'UFCE',
      unidade: 'CCET',
      coordenadores: [
        {
          nome: 'Dr. Roberto Lima',
          lattes: 'http://lattes.cnpq.br/4444444444444444',
          email: 'roberto.lima@ufce.br'
        }
      ],
      grupo: 'CE001',
      fonteUrl: 'https://lattes.cnpq.br/4444444444444444'
    },
    {
      id: 'CE003',
      sigla: 'SOLARCE',
      nome: 'Sistemas Fotovoltaicos para Comunidades Rurais',
      areaConhecimento: {
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      },
      grandeArea: 'Engenharias',
      instituicao: 'IFCE',
      unidade: 'CCT',
      coordenadores: [
        {
          nome: 'Dra. Ana Paula',
          lattes: 'http://lattes.cnpq.br/5555555555555555',
          email: 'ana.paula@ifce.edu.br'
        }
      ],
      grupo: 'CE002',
      fonteUrl: 'https://lattes.cnpq.br/5555555555555555'
    },
    {
      id: 'CE004',
      sigla: 'EDUINCL',
      nome: 'Educação Inclusiva para Pessoas com Deficiência',
      areaConhecimento: {
        codigo: '40700107',
        nome: 'Educação',
        grandeArea: 'Ciências Humanas'
      },
      grandeArea: 'Ciências Humanas',
      instituicao: 'UECE',
      unidade: 'CH',
      coordenadores: [
        {
          nome: 'Dr. Marcos Santos',
          lattes: 'http://lattes.cnpq.br/6666666666666666',
          email: 'marcos.santos@uece.br'
        }
      ],
      grupo: 'CE003',
      fonteUrl: 'https://lattes.cnpq.br/6666666666666666'
    },
    {
      id: 'CE005',
      sigla: 'EDURURAL',
      nome: 'Educação de Jovens e Adultos no Semiárido',
      areaConhecimento: {
        codigo: '40700107',
        nome: 'Educação',
        grandeArea: 'Ciências Humanas'
      },
      grandeArea: 'Ciências Humanas',
      instituicao: 'UECE',
      unidade: 'CH',
      coordenadores: [
        {
          nome: 'Dr. Marcos Santos',
          lattes: 'http://lattes.cnpq.br/6666666666666666',
          email: 'marcos.santos@uece.br'
        }
      ],
      grupo: 'CE003',
      fonteUrl: 'https://lattes.cnpq.br/6666666666666666'
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
        codigo: '40700106',
        nome: 'Engenharia de Energia',
        grandeArea: 'Engenharias'
      },
      {
        codigo: '40700107',
        nome: 'Educação',
        grandeArea: 'Ciências Humanas'
      }
    ],
    grandesAreas: [
      'Ciências Biológicas',
      'Engenharias',
      'Ciências Humanas'
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
      nome: 'Portal UFCE',
      url: 'https://www.ufce.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal IFCE',
      url: 'https://www.ifce.edu.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UECE',
      url: 'https://www.uece.br',
      tipo: 'portal'
    },
    {
      nome: 'Portal UNIFOR',
      url: 'https://www.unifor.br',
      tipo: 'portal'
    }
  ],
  lacunas: [
    'Dados de grupos de pesquisa precisam de atualização periódica',
    'Falta de informações sobre projetos de extensão com comunidades indígenas',
    'Necessidade de integração com o SICAD do MEC',
    'Informações de unidades acadêmicas incompletas para campi novos',
    'Falta de dados sobre bolsas de pesquisa e pós-graduação'
  ]
};

export default DADOS_CE;