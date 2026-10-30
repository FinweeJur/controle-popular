import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de RN.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: RN
 * Última atualização: 2026-10-30
 */

const DADOS_RN: DadosEstado = {
  uf: 'RN',
  instituicoes: [
    {
        'sigla': 'UFRN',
        'nome': 'Universidade Federal de RN',
        'tipo': 'Universidade',
        'uf': 'RN',
        'municipios': [
            'Cidade Principal RN'
        ],
        'contatos': {
            'email': 'comunicacao@ufRN.br',
            'telefone': '(84) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal RN - RN, 69900-000'
        },
        'links': {
            'site': 'https://www.ufRN.br',
            'lattes': 'https://lattes.cnpq.br/ufRN'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'RN001',
        'sigla': 'GP-RNAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e RN',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRN',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RN Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RN.silva@ufRN.br'
            }
        ],
        'projetos': [
            'RN001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'RN001',
        'sigla': 'AMAZONRN',
        'nome': 'Biodiversidade da RN e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFRN',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. RN Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'RN.silva@ufRN.br'
            }
        ],
        'grupo': 'RN001',
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

export default DADOS_RN;
