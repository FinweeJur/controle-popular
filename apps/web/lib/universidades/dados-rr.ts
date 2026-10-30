import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de RR.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: RR
 * Última atualização: 2026-10-30
 */

const DADOS_RR: DadosEstado = {
  uf: 'RR',
  instituicoes: [
    {
        'sigla': 'UFRR',
        'nome': 'Universidade Federal de RR',
        'tipo': 'Universidade',
        'uf': 'RR',
        'municipios': [
            'Cidade Principal RR'
        ],
        'contatos': {
            'email': 'comunicacao@ufRR.br',
            'telefone': '(95) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal RR - RR, 69900-000'
        },
        'links': {
            'site': 'https://www.ufRR.br',
            'lattes': 'https://lattes.cnpq.br/ufRR'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'RR001',
        'sigla': 'GP-RRAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e RR',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRR',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RR Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RR.silva@ufRR.br'
            }
        ],
        'projetos': [
            'RR001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'RR001',
        'sigla': 'AMAZONRR',
        'nome': 'Biodiversidade da RR e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRR',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RR Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RR.silva@ufRR.br'
            }
        ],
        'grupo': 'RR001',
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

export default DADOS_RR;
