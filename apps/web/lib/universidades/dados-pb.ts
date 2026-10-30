import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de PB.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: PB
 * Última atualização: 2026-10-30
 */

const DADOS_PB: DadosEstado = {
  uf: 'PB',
  instituicoes: [
    {
        'sigla': 'UFPB',
        'nome': 'Universidade Federal de PB',
        'tipo': 'Universidade',
        'uf': 'PB',
        'municipios': [
            'Cidade Principal PB'
        ],
        'contatos': {
            'email': 'comunicacao@ufPB.br',
            'telefone': '(83) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal PB - PB, 69900-000'
        },
        'links': {
            'site': 'https://www.ufPB.br',
            'lattes': 'https://lattes.cnpq.br/ufPB'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'PB001',
        'sigla': 'GP-PBAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e PB',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFPB',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. PB Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'PB.silva@ufPB.br'
            }
        ],
        'projetos': [
            'PB001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'PB001',
        'sigla': 'AMAZONPB',
        'nome': 'Biodiversidade da PB e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFPB',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. PB Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'PB.silva@ufPB.br'
            }
        ],
        'grupo': 'PB001',
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

export default DADOS_PB;
