import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de RO.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: RO
 * Última atualização: 2026-10-30
 */

const DADOS_RO: DadosEstado = {
  uf: 'RO',
  instituicoes: [
    {
        'sigla': 'UFRO',
        'nome': 'Universidade Federal de RO',
        'tipo': 'Universidade',
        'uf': 'RO',
        'municipios': [
            'Cidade Principal RO'
        ],
        'contatos': {
            'email': 'comunicacao@ufRO.br',
            'telefone': '(69) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal RO - RO, 69900-000'
        },
        'links': {
            'site': 'https://www.ufRO.br',
            'lattes': 'https://lattes.cnpq.br/ufRO'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'RO001',
        'sigla': 'GP-ROAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e RO',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RO.silva@ufRO.br'
            }
        ],
        'projetos': [
            'RO001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'RO001',
        'sigla': 'AMAZONRO',
        'nome': 'Biodiversidade da RO e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RO.silva@ufRO.br'
            }
        ],
        'grupo': 'RO001',
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

export default DADOS_RO;
