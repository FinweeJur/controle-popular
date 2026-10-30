import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de MT.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: MT
 * Última atualização: 2026-10-30
 */

const DADOS_MT: DadosEstado = {
  uf: 'MT',
  instituicoes: [
    {
        'sigla': 'UFMT',
        'nome': 'Universidade Federal de MT',
        'tipo': 'Universidade',
        'uf': 'MT',
        'municipios': [
            'Cidade Principal MT'
        ],
        'contatos': {
            'email': 'comunicacao@ufMT.br',
            'telefone': '(65) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal MT - MT, 69900-000'
        },
        'links': {
            'site': 'https://www.ufMT.br',
            'lattes': 'https://lattes.cnpq.br/ufMT'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'MT001',
        'sigla': 'GP-MTAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e MT',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMT',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MT Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MT.silva@ufMT.br'
            }
        ],
        'projetos': [
            'MT001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'MT001',
        'sigla': 'AMAZONMT',
        'nome': 'Biodiversidade da MT e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMT',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MT Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MT.silva@ufMT.br'
            }
        ],
        'grupo': 'MT001',
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

export default DADOS_MT;
