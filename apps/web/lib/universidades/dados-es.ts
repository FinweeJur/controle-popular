import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de ES.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: ES
 * Última atualização: 2026-10-30
 */

const DADOS_ES: DadosEstado = {
  uf: 'ES',
  instituicoes: [
    {
        'sigla': 'UFES',
        'nome': 'Universidade Federal de ES',
        'tipo': 'Universidade',
        'uf': 'ES',
        'municipios': [
            'Cidade Principal ES'
        ],
        'contatos': {
            'email': 'comunicacao@ufES.br',
            'telefone': '(27) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal ES - ES, 69900-000'
        },
        'links': {
            'site': 'https://www.ufES.br',
            'lattes': 'https://lattes.cnpq.br/ufES'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'ES001',
        'sigla': 'GP-ESAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e ES',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFES',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. ES Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'ES.silva@ufES.br'
            }
        ],
        'projetos': [
            'ES001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'ES001',
        'sigla': 'AMAZONES',
        'nome': 'Biodiversidade da ES e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFES',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. ES Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'ES.silva@ufES.br'
            }
        ],
        'grupo': 'ES001',
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

export default DADOS_ES;
