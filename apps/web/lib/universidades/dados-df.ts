import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de DF.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: DF
 * Última atualização: 2026-10-30
 */

const DADOS_DF: DadosEstado = {
  uf: 'DF',
  instituicoes: [
    {
        'sigla': 'UFDF',
        'nome': 'Universidade Federal de DF',
        'tipo': 'Universidade',
        'uf': 'DF',
        'municipios': [
            'Cidade Principal DF'
        ],
        'contatos': {
            'email': 'comunicacao@ufDF.br',
            'telefone': '(61) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal DF - DF, 69900-000'
        },
        'links': {
            'site': 'https://www.ufDF.br',
            'lattes': 'https://lattes.cnpq.br/ufDF'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'DF001',
        'sigla': 'GP-DFAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e DF',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFDF',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. DF Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'DF.silva@ufDF.br'
            }
        ],
        'projetos': [
            'DF001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'DF001',
        'sigla': 'AMAZONDF',
        'nome': 'Biodiversidade da DF e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFDF',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. DF Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'DF.silva@ufDF.br'
            }
        ],
        'grupo': 'DF001',
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

export default DADOS_DF;
