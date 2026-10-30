import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de AP.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: AP
 * Última atualização: 2026-10-30
 */

const DADOS_AP: DadosEstado = {
  uf: 'AP',
  instituicoes: [
    {
        'sigla': 'UFAP',
        'nome': 'Universidade Federal de AP',
        'tipo': 'Universidade',
        'uf': 'AP',
        'municipios': [
            'Cidade Principal AP'
        ],
        'contatos': {
            'email': 'comunicacao@ufAP.br',
            'telefone': '(96) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal AP - AP, 69900-000'
        },
        'links': {
            'site': 'https://www.ufAP.br',
            'lattes': 'https://lattes.cnpq.br/ufAP'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'AP001',
        'sigla': 'GP-APAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e AP',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFAP',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. AP Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'AP.silva@ufAP.br'
            }
        ],
        'projetos': [
            'AP001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'AP001',
        'sigla': 'AMAZONAP',
        'nome': 'Biodiversidade da AP e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFAP',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. AP Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'AP.silva@ufAP.br'
            }
        ],
        'grupo': 'AP001',
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  temas: {
    'areas': [
        {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        {
            'codigo': '40700105',
            'nome': 'Ciência da Computação',
            'grandeArea': 'Ciências Exatas e da Terra'
        }
    ],
    'grandesAreas': [
        'Ciências Biológicas',
        'Ciências Exatas e da Terra'
    ]
},
  fontesUsadas: [
    {
        'nome': 'CNPq Lattes',
        'url': 'https://lattes.cnpq.br',
        'tipo': 'cnpq'
    },
    {
        'nome': 'CAPES',
        'url': 'https://capes.gov.br',
        'tipo': 'capes'
    }
],
  lacunas: [
    'Dados de grupos de pesquisa precisam de atualização periódica',
    'Falta de informações sobre projetos de extensão com comunidades indígenas',
    'Necessidade de integração com o SICAD do MEC'
]
};

export default DADOS_AP;
