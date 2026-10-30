import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de PI.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: PI
 * Última atualização: 2026-10-30
 */

const DADOS_PI: DadosEstado = {
  uf: 'PI',
  instituicoes: [
    {
        'sigla': 'UFPI',
        'nome': 'Universidade Federal de PI',
        'tipo': 'Universidade',
        'uf': 'PI',
        'municipios': [
            'Cidade Principal PI'
        ],
        'contatos': {
            'email': 'comunicacao@ufPI.br',
            'telefone': '(86) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal PI - PI, 69900-000'
        },
        'links': {
            'site': 'https://www.ufPI.br',
            'lattes': 'https://lattes.cnpq.br/ufPI'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'PI001',
        'sigla': 'GP-PIAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e PI',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFPI',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. PI Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'PI.silva@ufPI.br'
            }
        ],
        'projetos': [
            'PI001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'PI001',
        'sigla': 'AMAZONPI',
        'nome': 'Biodiversidade da PI e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFPI',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. PI Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'PI.silva@ufPI.br'
            }
        ],
        'grupo': 'PI001',
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

export default DADOS_PI;
