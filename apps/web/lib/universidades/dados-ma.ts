import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de MA.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: MA
 * Última atualização: 2026-10-30
 */

const DADOS_MA: DadosEstado = {
  uf: 'MA',
  instituicoes: [
    {
        'sigla': 'UFMA',
        'nome': 'Universidade Federal de MA',
        'tipo': 'Universidade',
        'uf': 'MA',
        'municipios': [
            'Cidade Principal MA'
        ],
        'contatos': {
            'email': 'comunicacao@ufMA.br',
            'telefone': '(98) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal MA - MA, 69900-000'
        },
        'links': {
            'site': 'https://www.ufMA.br',
            'lattes': 'https://lattes.cnpq.br/ufMA'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'MA001',
        'sigla': 'GP-MAAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e MA',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMA',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MA Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MA.silva@ufMA.br'
            }
        ],
        'projetos': [
            'MA001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'MA001',
        'sigla': 'AMAZONMA',
        'nome': 'Biodiversidade da MA e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMA',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MA Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MA.silva@ufMA.br'
            }
        ],
        'grupo': 'MA001',
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

export default DADOS_MA;
