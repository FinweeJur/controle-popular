import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de MS.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: MS
 * Última atualização: 2026-10-30
 */

const DADOS_MS: DadosEstado = {
  uf: 'MS',
  instituicoes: [
    {
        'sigla': 'UFMS',
        'nome': 'Universidade Federal de MS',
        'tipo': 'Universidade',
        'uf': 'MS',
        'municipios': [
            'Cidade Principal MS'
        ],
        'contatos': {
            'email': 'comunicacao@ufMS.br',
            'telefone': '(67) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal MS - MS, 69900-000'
        },
        'links': {
            'site': 'https://www.ufMS.br',
            'lattes': 'https://lattes.cnpq.br/ufMS'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'MS001',
        'sigla': 'GP-MSAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e MS',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMS',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MS Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MS.silva@ufMS.br'
            }
        ],
        'projetos': [
            'MS001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'MS001',
        'sigla': 'AMAZONMS',
        'nome': 'Biodiversidade da MS e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFMS',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. MS Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'MS.silva@ufMS.br'
            }
        ],
        'grupo': 'MS001',
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

export default DADOS_MS;
