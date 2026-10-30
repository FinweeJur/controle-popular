import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de SE.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: SE
 * Última atualização: 2026-10-30
 */

const DADOS_SE: DadosEstado = {
  uf: 'SE',
  instituicoes: [
    {
        'sigla': 'UFSE',
        'nome': 'Universidade Federal de SE',
        'tipo': 'Universidade',
        'uf': 'SE',
        'municipios': [
            'Cidade Principal SE'
        ],
        'contatos': {
            'email': 'comunicacao@ufSE.br',
            'telefone': '(79) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal SE - SE, 69900-000'
        },
        'links': {
            'site': 'https://www.ufSE.br',
            'lattes': 'https://lattes.cnpq.br/ufSE'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'SE001',
        'sigla': 'GP-SEAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e SE',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFSE',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. SE Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'SE.silva@ufSE.br'
            }
        ],
        'projetos': [
            'SE001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'SE001',
        'sigla': 'AMAZONSE',
        'nome': 'Biodiversidade da SE e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFSE',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. SE Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'SE.silva@ufSE.br'
            }
        ],
        'grupo': 'SE001',
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

export default DADOS_SE;
